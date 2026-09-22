#include "HingesWorklets.h"

#if HINGES_WORKLETS_ENABLED
#include <jsi/jsi.h>
#include <worklets/Compat/StableApi.h>

#include <atomic>
#include <mutex>
#include <utility>

namespace hinges {
namespace jsi = facebook::jsi;

struct Subscription {
  int rootTag;
  std::atomic<bool> active{true};
  std::weak_ptr<worklets::WorkletRuntime> runtime;
  std::shared_ptr<worklets::UIScheduler> scheduler;
  std::shared_ptr<worklets::Serializable> callback;
};

struct WorkletsBridge::State {
  std::mutex mutex;
  bool invalidated = false;
  std::vector<std::shared_ptr<Subscription>> subscriptions;
};

WorkletsBridge::WorkletsBridge() : state_(std::make_unique<State>()) {}
WorkletsBridge::~WorkletsBridge() { invalidate(); }

void WorkletsBridge::install(jsi::Runtime &runtime, std::function<void(int)> start, std::function<void(int)> stop) {
  auto bridge = weak_from_this();
  auto subscribe = jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "nativeHingesSubscribe"), 4,
      [bridge, start = std::move(start), stop = std::move(stop)](
          jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        auto owner = bridge.lock();
        if (!owner) throw jsi::JSError(rt, "Hinges native module was invalidated");
        if (count != 4) throw jsi::JSError(rt, "Expected root, runtime, scheduler and worklet");
        auto subscription = std::make_shared<Subscription>();
        subscription->rootTag = static_cast<int>(args[0].asNumber());
        subscription->runtime = worklets::getWorkletRuntimeFromHolder(rt, args[1].asObject(rt));
        subscription->scheduler = worklets::getUISchedulerFromHolder(rt, args[2].asObject(rt));
        subscription->callback = worklets::extractSerializable(
            rt, args[3], "Hinges callback must be a worklet", worklets::Serializable::ValueType::WorkletType);
        {
          std::lock_guard lock(owner->state_->mutex);
          if (owner->state_->invalidated) throw jsi::JSError(rt, "Hinges native module was invalidated");
          owner->state_->subscriptions.push_back(subscription);
        }
        start(subscription->rootTag);
        return jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forAscii(rt, "unsubscribeHinges"), 0,
            [bridge, subscription, stop](jsi::Runtime &, const jsi::Value &, const jsi::Value *, size_t) -> jsi::Value {
              auto owner = bridge.lock();
              if (!owner || !subscription->active.exchange(false)) return jsi::Value::undefined();
              {
                std::lock_guard lock(owner->state_->mutex);
                std::erase(owner->state_->subscriptions, subscription);
              }
              stop(subscription->rootTag);
              return jsi::Value::undefined();
            });
      });
  runtime.global().setProperty(runtime, "nativeHingesSubscribe", std::move(subscribe));
}

void WorkletsBridge::publish(int rootTag, const std::vector<HingeReading> &hinges) {
  std::vector<std::shared_ptr<Subscription>> listeners;
  {
    std::lock_guard lock(state_->mutex);
    if (state_->invalidated) return;
    for (const auto &subscription : state_->subscriptions) {
      if (subscription->rootTag == rootTag) listeners.push_back(subscription);
    }
  }
  for (const auto &subscription : listeners) {
    auto deliver = [subscription, hinges] {
      if (!subscription->active) return;
      auto runtime = subscription->runtime.lock();
      if (!runtime) return;
      auto &rt = worklets::getJSIRuntimeFromWorkletRuntime(runtime);
      jsi::Array readings(rt, hinges.size());
      for (size_t index = 0; index < hinges.size(); index++) {
        jsi::Object reading(rt);
        reading.setProperty(rt, "status", jsi::String::createFromUtf8(rt, hinges[index].status));
        reading.setProperty(rt, "angle", hinges[index].angle);
        reading.setProperty(rt, "hasAngle", hinges[index].hasAngle);
        readings.setValueAtIndex(rt, index, std::move(reading));
      }
      worklets::runSyncOnRuntime(runtime, subscription->callback, std::move(readings));
    };
    if (worklets::isOnUIThread(subscription->scheduler)) deliver();
    else worklets::scheduleOnUI(subscription->scheduler, std::move(deliver));
  }
}

void WorkletsBridge::invalidate() {
  std::lock_guard lock(state_->mutex);
  state_->invalidated = true;
  for (const auto &subscription : state_->subscriptions) subscription->active = false;
  state_->subscriptions.clear();
}

}
#else
namespace hinges {
struct WorkletsBridge::State {};
WorkletsBridge::WorkletsBridge() = default;
WorkletsBridge::~WorkletsBridge() = default;
void WorkletsBridge::install(facebook::jsi::Runtime &, std::function<void(int)>, std::function<void(int)>) {}
void WorkletsBridge::publish(int, const std::vector<HingeReading> &) {}
void WorkletsBridge::invalidate() {}
}
#endif
