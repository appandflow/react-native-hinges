#import "HingesObserverView.h"

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
#if defined(__IPHONE_27_1) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_27_1
    if (@available(iOS 27.1, *)) {
      __weak HingesObserverView *weakSelf = self;
      UIHingeInteraction *interaction = [[UIHingeInteraction alloc]
          initWithUpdateHandler:^(UIHingeInteraction *interaction, UIHingeInteractionUpdate *update) {
            HingesObserverView *strongSelf = weakSelf;
            if (strongSelf == nil) return;
            HingesObserverViewEventEmitter::OnHingesChange snapshot;
            UIHinge *hinge = update.hinge;
            if (hinge != nil) {
              std::string status = "unknown";
              switch (hinge.status) {
                case UIHingeStatusClosed: status = "closed"; break;
                case UIHingeStatusPartiallyOpen: status = "partiallyOpen"; break;
                case UIHingeStatusFullyOpen: status = "fullyOpen"; break;
                case UIHingeStatusUnknown: break;
              }
              snapshot.hinges.push_back({status, hinge.angle, true});
            }
            strongSelf->_snapshot = std::move(snapshot);
            [strongSelf emitSnapshot];
          }];
      [self addInteraction:interaction];
    }
#endif
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
