#include <HingesWorklets.h>
#include <ReactCommon/BindingsInstallerHolder.h>
#include <fbjni/fbjni.h>

#include <memory>
#include <string>
#include <utility>
#include <vector>

namespace hinges {

using namespace facebook;

class HingesWorkletsModule : public jni::HybridClass<HingesWorkletsModule> {
 public:
  static constexpr auto kJavaDescriptor = "Lcom/appandflow/hinges/HingesModule;";

  static jni::local_ref<jhybriddata> initWorkletsBridge(
      jni::alias_ref<jhybridobject> jThis) {
    return makeCxxInstance(jThis);
  }

  static jni::local_ref<react::BindingsInstallerHolder::javaobject> getBindingsInstaller(
      jni::alias_ref<HingesWorkletsModule::javaobject> jThis) {
    auto bridge = jThis->cthis()->bridge_;
    auto module = jni::make_global(jThis);
    return react::BindingsInstallerHolder::newObjectCxxArgs(
        [bridge = std::move(bridge), module = std::move(module)](
            jsi::Runtime& runtime, const std::shared_ptr<react::CallInvoker>&) {
          bridge->install(
              runtime,
              [module](int rootTag) {
                jni::ThreadScope::WithClassLoader([&] {
                  static const auto startObserving = module->getClass()->getMethod<void(double)>("startObserving");
                  startObserving(module, static_cast<jdouble>(rootTag));
                });
              },
              [module](int rootTag) {
                jni::ThreadScope::WithClassLoader([&] {
                  static const auto stopObserving = module->getClass()->getMethod<void(double)>("stopObserving");
                  stopObserving(module, static_cast<jdouble>(rootTag));
                });
              });
        });
  }

  static void publishHinges(
      jni::alias_ref<HingesWorkletsModule::javaobject> jThis,
      jint rootTag,
      jni::alias_ref<jni::JArrayClass<jni::JString>> statuses,
      jni::alias_ref<jni::JArrayDouble> angles,
      jni::alias_ref<jni::JArrayBoolean> hasAngles) {
    const auto count = statuses->size();
    std::vector<HingeReading> hinges;
    hinges.reserve(count);

    auto angleValues = angles->getRegion(0, count);
    auto hasAngleValues = hasAngles->getRegion(0, count);
    for (jsize index = 0; index < count; index++) {
      jni::local_ref<jni::JString> status = (*statuses)[index];
      hinges.push_back({status->toStdString(), angleValues[index], hasAngleValues[index] == JNI_TRUE});
    }

    jThis->cthis()->bridge_->publish(rootTag, hinges);
  }

  static void invalidateWorkletsBridge(jni::alias_ref<HingesWorkletsModule::javaobject> jThis) {
    jThis->cthis()->bridge_->invalidate();
  }

  static void registerNatives() {
    javaClassLocal()->registerNatives({
        makeNativeMethod("initWorkletsBridge", HingesWorkletsModule::initWorkletsBridge),
        makeNativeMethod("getBindingsInstaller", HingesWorkletsModule::getBindingsInstaller),
        makeNativeMethod("publishHinges", HingesWorkletsModule::publishHinges),
        makeNativeMethod("invalidateWorkletsBridge", HingesWorkletsModule::invalidateWorkletsBridge),
    });
  }

 private:
  friend HybridBase;

  explicit HingesWorkletsModule(jni::alias_ref<jhybridobject>) : bridge_(std::make_shared<WorkletsBridge>()) {}

  std::shared_ptr<WorkletsBridge> bridge_;
};

} // namespace hinges

JNIEXPORT jint JNI_OnLoad(JavaVM* vm, void*) {
  return facebook::jni::initialize(vm, [] { hinges::HingesWorkletsModule::registerNatives(); });
}
