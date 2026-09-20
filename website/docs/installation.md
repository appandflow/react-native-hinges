---
title: Installation
description: Try the native hinge API and check platform requirements.
---

`react-native-hinges` exposes hinge posture and angles through a React provider and hook, with a snapshot and subscription API for code outside React.

## Preview status

The implementation is in development. The published `0.1.0-alpha.0` package on npm, including the `next` tag, is a name-reservation placeholder and does not include this API. These docs describe the repository source. [Run the example from source](./example.md) to try the current implementation.

## Requirements

| Platform     | Requirement                                                                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| React Native | New Architecture / Fabric. The example uses `0.88.0-rc.1`; a broader supported version range has not been established.                                                               |
| iOS          | Build with the iOS 27.1 SDK or later and run on iOS 27.1 or later. Older SDKs compile out hinge observation, including on newer devices. Older runtimes return an empty hinge array. |
| Android      | API 24 or later, or your app's higher minimum. Posture requires a WindowManager-compatible folding device. An angle requires an available, unambiguous hinge-angle sensor.           |

The package contains a native Fabric view. When integrating a package release, install CocoaPods dependencies on iOS and rebuild the native app on both platforms. JavaScript-only updates cannot add its native implementation.

`react-native-hinges` is independent of `react-native-reserved-regions`. Use the reserved-regions package separately when you need display division or occlusion geometry. Hinge observations describe physical posture and angle, without rectangle coordinates.

Continue with [the provider and hook](./usage.md).
