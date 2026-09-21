#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^HingesUpdateHandler)(NSArray<NSDictionary *> *hinges);

/// Returns nil when the SDK or runtime has no UIHingeInteraction.
id<UIInteraction> _Nullable HingesMakeInteraction(HingesUpdateHandler handler);

NS_ASSUME_NONNULL_END
