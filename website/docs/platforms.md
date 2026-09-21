---
title: Platform behavior
description: How UIKit, WindowManager, and hinge sensors map to the API.
---

## iOS

Hinge observation uses `UIHingeInteraction` on the React root's view hierarchy. A native update supplies zero or one `UIHinge`. UIKit's status maps to the public strings, and its angle is exposed in radians.

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

Use an Xcode and simulator runtime that include iPhone Duo when testing that device. Changing iOS angles have not yet been validated.

The host app must adopt the UIScene lifecycle; the example uses `UISceneDelegate` for the React Native release candidate's iOS 27.1 compatibility. See [React Native issue #58606](https://github.com/react/react-native/issues/58606).

[Apple: adaptive layouts on iPhone Duo](https://developer.apple.com/videos/play/tech-talks/111463/)

## Android

The native module observes Jetpack WindowManager folding features for its Activity window and, on API 30 or later, the optional device-level `TYPE_HINGE_ANGLE` sensor for angle. The combined snapshot is associated with that root's hierarchy; the two native sources do not have identical scope.

| WindowManager state   | Public status   |
| --------------------- | --------------- |
| `HALF_OPENED`         | `partiallyOpen` |
| `FLAT`                | `fullyOpen`     |
| No associated feature | `unknown`       |

The library does not infer `closed` from the angle. Every reported folding feature can contribute hinge state, including a flat feature that does not separate the display.

Android sensor readings use degrees; the library converts them to radians. An angle is attached only when there is exactly one hinge-angle sensor and at most one folding feature. With multiple folding features, each angle remains `null` because there is no reliable feature-to-sensor association. If only the sensor is available, the hinge has status `unknown`.

The current Android registration requests `SENSOR_DELAY_NORMAL`. The effective delivery cadence depends on the sensor and operating system; this is not a promised update rate. There is no public sampling-rate option.

A supported device can report posture without angle readings. Sensor and WindowManager availability depend on the device, emulator profile, and platform implementation.

[Android: FoldingFeature](https://developer.android.com/reference/androidx/window/layout/FoldingFeature) · [Android: hinge-angle sensor](https://developer.android.com/reference/android/hardware/Sensor#TYPE_HINGE_ANGLE)

## Validation limits

The tested React Native baseline is `0.88.0-rc.1`. Physical hardware, multiple live roots/windows, and multiple-hinge hardware have not yet been validated. Initial readings arrive asynchronously when the native cache is empty; neither the ordinary nor animated hook guarantees a reading in the first rendered frame.

## Other platforms

The fallback module returns `[]` and creates no native view. There is no browser hinge sensor integration.
