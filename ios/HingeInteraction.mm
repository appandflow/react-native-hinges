#import "HingeInteraction.h"

id<UIInteraction> HingesMakeInteraction(HingesUpdateHandler handler)
{
#if defined(__IPHONE_27_1) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_27_1
  if (@available(iOS 27.1, *)) {
    return [[UIHingeInteraction alloc]
        initWithUpdateHandler:^(UIHingeInteraction *interaction, UIHingeInteractionUpdate *update) {
      UIHinge *hinge = update.hinge;
      if (hinge == nil) {
        handler(@[]);
        return;
      }
      NSString *status = @"unknown";
      switch (hinge.status) {
        case UIHingeStatusClosed: status = @"closed"; break;
        case UIHingeStatusPartiallyOpen: status = @"partiallyOpen"; break;
        case UIHingeStatusFullyOpen: status = @"fullyOpen"; break;
        case UIHingeStatusUnknown: break;
      }
      handler(@[@{@"status": status, @"angle": @(hinge.angle), @"hasAngle": @YES}]);
    }];
  }
#endif
  return nil;
}
