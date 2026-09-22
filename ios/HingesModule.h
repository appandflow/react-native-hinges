#import <HingesSpec/HingesSpec.h>
#import <React/RCTInvalidating.h>
#import <ReactCommon/RCTTurboModuleWithJSIBindings.h>

NS_ASSUME_NONNULL_BEGIN

@interface HingesModule : NativeHingesSpecBase <NativeHingesSpec, RCTInvalidating, RCTTurboModuleWithJSIBindings>
@end

NS_ASSUME_NONNULL_END
