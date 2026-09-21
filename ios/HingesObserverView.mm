#import "HingesObserverView.h"

#import "HingeInteraction.h"

#import <UIKit/UIKit.h>
#import <react/renderer/components/HingesSpec/ComponentDescriptors.h>
#import <react/renderer/components/HingesSpec/EventEmitters.h>
#import <react/renderer/components/HingesSpec/Props.h>
#import <react/renderer/components/HingesSpec/RCTComponentViewHelpers.h>

using namespace facebook::react;

@interface HingesObserverView () <RCTHingesObserverViewViewProtocol>
- (void)emitSnapshot;
@end

@implementation HingesObserverView {
  HingesObserverViewEventEmitter::OnHingesChange _snapshot;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<HingesObserverViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const HingesObserverViewProps>();
    _props = defaultProps;
    __weak HingesObserverView *weakSelf = self;
    id<UIInteraction> interaction = HingesMakeInteraction(^(NSArray<NSDictionary *> *hinges) {
      HingesObserverView *strongSelf = weakSelf;
      if (strongSelf == nil) return;
      HingesObserverViewEventEmitter::OnHingesChange snapshot;
      for (NSDictionary *hinge in hinges) {
        snapshot.hinges.push_back(
            {[hinge[@"status"] UTF8String], [hinge[@"angle"] doubleValue], [hinge[@"hasAngle"] boolValue]});
      }
      strongSelf->_snapshot = std::move(snapshot);
      [strongSelf emitSnapshot];
    });
    if (interaction != nil) {
      [self addInteraction:interaction];
    }
  }
  return self;
}

- (void)emitSnapshot
{
  if (_eventEmitter == nullptr) return;
  std::static_pointer_cast<const HingesObserverViewEventEmitter>(_eventEmitter)->onHingesChange(_snapshot);
}

- (void)updateEventEmitter:(const EventEmitter::Shared &)eventEmitter
{
  [super updateEventEmitter:eventEmitter];
  [self emitSnapshot];
}

- (void)refresh
{
  [self emitSnapshot];
}

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
  RCTHingesObserverViewHandleCommand(self, commandName, args);
}

- (void)prepareForRecycle
{
  _snapshot = {};
  [super prepareForRecycle];
}

@end
