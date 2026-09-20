#import "HingesView.h"

#import <react/renderer/components/HingesViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/HingesViewSpec/EventEmitters.h>
#import <react/renderer/components/HingesViewSpec/Props.h>
#import <react/renderer/components/HingesViewSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

@implementation HingesView {
  NSDictionary *_hinge;
  NSDictionary *_lastSentHinge;
  id<UIInteraction> _hingeInteraction;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<HingesViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const HingesViewProps>();
    _props = defaultProps;
  }
  return self;
}

- (void)startObservingHinge
{
#if defined(__IPHONE_27_1) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_27_1
  if (@available(iOS 27.1, *)) {
    if (_hingeInteraction == nil) {
      __weak HingesView *weakSelf = self;
      UIHingeInteraction *interaction = [[UIHingeInteraction alloc]
          initWithUpdateHandler:^(UIHingeInteraction *interaction, UIHingeInteractionUpdate *update) {
        HingesView *strongSelf = weakSelf;
        if (strongSelf == nil) return;
        UIHinge *hinge = update.hinge;
        NSString *status = @"unknown";
        switch (hinge.status) {
          case UIHingeStatusClosed: status = @"closed"; break;
          case UIHingeStatusPartiallyOpen: status = @"partiallyOpen"; break;
          case UIHingeStatusFullyOpen: status = @"fullyOpen"; break;
          case UIHingeStatusUnknown: break;
        }
        strongSelf->_hinge = hinge == nil ? nil : @{@"status": status, @"angle": @(hinge.angle)};
        [strongSelf emitHinge];
      }];
      _hingeInteraction = interaction;
      [self addInteraction:interaction];
    }
  }
#endif
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  if (self.window == nil) _hinge = nil;
  [self emitHinge];
  if (self.window != nil) [self startObservingHinge];
}

- (void)updateEventEmitter:(EventEmitter::Shared const &)eventEmitter
{
  [super updateEventEmitter:eventEmitter];
  _lastSentHinge = nil;
  [self emitHinge];
}

- (void)emitHinge
{
  if (!_eventEmitter) return;
  NSDictionary *snapshot = _hinge ?: @{};
  if ([_lastSentHinge isEqualToDictionary:snapshot]) return;
  _lastSentHinge = snapshot;
  HingesViewEventEmitter::OnHingesChange event;
  if (_hinge != nil) {
    event.hinges.push_back({[_hinge[@"status"] UTF8String], [_hinge[@"angle"] doubleValue], true});
  }
  std::static_pointer_cast<HingesViewEventEmitter const>(_eventEmitter)->onHingesChange(event);
}

- (void)prepareForRecycle
{
  if (_hingeInteraction != nil) [self removeInteraction:_hingeInteraction];
  _hingeInteraction = nil;
  [super prepareForRecycle];
  _hinge = nil;
  _lastSentHinge = nil;
}

@end
