---
title: Platform behavior
description: How UIKit, WindowManager, and hinge sensors map to the API.
---

## iOS

Hinge observation uses `UIHingeInteraction` on the provider's view hierarchy. A native update supplies zero or one `UIHinge`. UIKit's status maps to the public strings, and its angle is exposed in radians.

| UIKit status   | Public status   |
| -------------- | --------------- |
| Unknown        | `unknown`       |
| Closed         | `closed`        |
| Partially open | `partiallyOpen` |
| Fully open     | `fullyOpen`     |

The native API requires both a supporting SDK and a supporting runtime. Typed calls are compiled only inside this guard:

```objc
#if defined(__IPHONE_27_1) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_27_1
if (@available(iOS 27.1, *)) {
  // UIKit hinge observation requires the iOS 27.1 SDK and runtime.
}
#endif
```

An older-SDK build returns no hinges even on an iOS 27.1 device because observation was compiled out. A newer-SDK build also returns no hinges on an older runtime. Rebuild with the supporting SDK to enable observation.

Use an Xcode and simulator runtime that include iPhone Duo when testing that device. Automated iOS fold-transition coverage has not yet been established.

[Apple: adaptive layouts on iPhone Duo](https://developer.apple.com/videos/play/tech-talks/111463/)

## Android

The provider observes Jetpack WindowManager folding features for posture and the optional `TYPE_HINGE_ANGLE` sensor for angle.

| WindowManager state   | Public status   |
| --------------------- | --------------- |
| `HALF_OPENED`         | `partiallyOpen` |
| `FLAT`                | `fullyOpen`     |
| No associated feature | `unknown`       |

The library does not infer `closed` from the angle. Every reported folding feature can contribute hinge state, including a flat feature that does not separate the display.

Android sensor readings use degrees; the library converts them to radians. An angle is attached only when there is exactly one hinge-angle sensor and at most one folding feature. With multiple folding features, each angle remains `null` because there is no reliable feature-to-sensor association. If only the sensor is available, the hinge has status `unknown`.

A supported device can report posture without angle readings. Sensor and WindowManager availability depend on the device, emulator profile, and platform implementation.

[Android: FoldingFeature](https://developer.android.com/reference/androidx/window/layout/FoldingFeature) · [Android: hinge-angle sensor](https://developer.android.com/reference/android/hardware/Sensor#TYPE_HINGE_ANGLE)

## Other platforms

The fallback renders a React Native `View` without native observations. Consumers receive `[]`. There is no browser hinge sensor integration.
