#import "HingesModule.h"

#import "HingeInteraction.h"
#include "../cpp/HingesWorklets.h"

#import <React/RCTFabricSurface.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTSurfaceView.h>
#import <React/RCTUtils.h>
#import <UIKit/UIKit.h>

#include <atomic>

@interface HingeRootObservation : NSObject
@property (nonatomic, weak) UIView *view;
@property (nonatomic, strong) id<UIInteraction> interaction;
@property (nonatomic, assign) NSUInteger subscribers;
@end

@implementation HingeRootObservation
@end

@implementation HingesModule {
  NSMutableDictionary<NSNumber *, HingeRootObservation *> *_observations;
  NSMutableDictionary<NSNumber *, NSArray<NSDictionary *> *> *_snapshots;
  std::atomic<bool> _invalidated;
  std::shared_ptr<hinges::WorkletsBridge> _worklets;
  __weak RCTSurfacePresenter *_surfacePresenter;
}

+ (NSString *)moduleName
{
  return @"NativeHinges";
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)init
{
  if (self = [super init]) {
    _observations = [NSMutableDictionary new];
    _snapshots = [NSMutableDictionary new];
    _invalidated = false;
    _worklets = std::make_shared<hinges::WorkletsBridge>();
  }
  return self;
}

- (void)installJSIBindingsWithRuntime:(facebook::jsi::Runtime &)runtime
                          callInvoker:(const std::shared_ptr<facebook::react::CallInvoker> &)callInvoker
{
  __weak HingesModule *weakSelf = self;
  _worklets->install(runtime,
      [weakSelf](int rootTag) { [weakSelf startObserving:rootTag]; },
      [weakSelf](int rootTag) { [weakSelf stopObserving:rootTag]; });
}

- (void)setSurfacePresenter:(RCTSurfacePresenter *)surfacePresenter
{
  _surfacePresenter = surfacePresenter;
}

- (NSDictionary *)getSnapshot:(double)rootTag
{
  @synchronized (_snapshots) {
    return @{@"hinges": _snapshots[@(rootTag)] ?: @[]};
  }
}

- (void)emitSnapshotForRoot:(NSNumber *)rootTag hinges:(NSArray<NSDictionary *> *)hinges
{
  if (_invalidated) return;
  std::vector<hinges::HingeReading> readings;
  readings.reserve(hinges.count);
  for (NSDictionary *hinge in hinges) {
    readings.push_back({[hinge[@"status"] UTF8String], [hinge[@"angle"] doubleValue], [hinge[@"hasAngle"] boolValue]});
  }
  _worklets->publish(rootTag.intValue, readings);
  [self emitOnHingesChange:@{@"rootTag": rootTag, @"hinges": hinges}];
}

- (void)updateRoot:(NSNumber *)rootTag
      observation:(HingeRootObservation *)observation
           hinges:(NSArray<NSDictionary *> *)hinges
{
  if (_invalidated || _observations[rootTag] != observation) return;
  @synchronized (_snapshots) {
    if ([_snapshots[rootTag] isEqualToArray:hinges]) return;
    _snapshots[rootTag] = hinges;
  }
  [self emitSnapshotForRoot:rootTag hinges:hinges];
}

- (void)startObserving:(double)rootTag
{
  RCTExecuteOnMainQueue(^{
    if (self->_invalidated) return;
    NSNumber *tag = @(rootTag);
    HingeRootObservation *observation = self->_observations[tag];
    if (observation == nil) {
      observation = [HingeRootObservation new];
      self->_observations[tag] = observation;
    }
    observation.subscribers += 1;
    if (observation.interaction == nil) {
      UIView *view = [self->_surfacePresenter surfaceForRootTag:tag.integerValue].view;
      observation.view = view;
      if (view != nil) {
        __weak HingesModule *weakSelf = self;
        __weak HingeRootObservation *weakObservation = observation;
        id<UIInteraction> interaction = HingesMakeInteraction(^(NSArray<NSDictionary *> *hinges) {
          HingesModule *strongSelf = weakSelf;
          HingeRootObservation *strongObservation = weakObservation;
          if (strongSelf == nil || strongObservation == nil) return;
          [strongSelf updateRoot:tag observation:strongObservation hinges:hinges];
        });
        if (interaction != nil) {
          observation.interaction = interaction;
          [view addInteraction:interaction];
        }
      }
    }
    [self emitSnapshotForRoot:tag hinges:[self getSnapshot:rootTag][@"hinges"]];
  });
}

- (void)stopObserving:(double)rootTag
{
  RCTExecuteOnMainQueue(^{
    NSNumber *tag = @(rootTag);
    HingeRootObservation *observation = self->_observations[tag];
    if (observation == nil) return;
    observation.subscribers -= 1;
    if (observation.subscribers > 0) return;
    [self->_observations removeObjectForKey:tag];
    if (observation.interaction != nil) {
      [observation.view removeInteraction:observation.interaction];
    }
    @synchronized (self->_snapshots) {
      [self->_snapshots removeObjectForKey:tag];
    }
  });
}

- (void)invalidate
{
  _invalidated = true;
  _worklets->invalidate();
  RCTExecuteOnMainQueue(^{
    for (HingeRootObservation *observation in self->_observations.allValues) {
      if (observation.interaction != nil) {
        [observation.view removeInteraction:observation.interaction];
      }
    }
    [self->_observations removeAllObjects];
    @synchronized (self->_snapshots) {
      [self->_snapshots removeAllObjects];
    }
  });
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeHingesSpecJSI>(params);
}

@end
