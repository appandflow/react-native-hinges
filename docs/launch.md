# Launch draft: reserved regions and hinges

Draft for the functional alpha.2 releases. Verify both npm versions and `next`
dist-tags before posting. Documentation sites are local builds; the links below
use the public repositories. This document does not authorize posting to X.

## X post

> Two React Native alphas for foldables:
>
> react-native-reserved-regions: folds + occlusions in your view's coordinates.
> react-native-hinges: posture + angles, including Reanimated shared values.
>
> Native Android emulator demo below.
>
> https://github.com/appandflow/react-native-reserved-regions
> https://github.com/appandflow/react-native-hinges

Attach the [combined Field Notes demo](https://github.com/user-attachments/assets/7f69106d-2649-4591-917c-9aa7743fd5fa).
The clip shows native emulator inputs, not the app's simulated preview.

Suggested reply after registry verification:

```sh
npm install react-native-hinges@0.1.0-alpha.2 react-native-reserved-regions@0.1.0-alpha.2
```

> New Architecture; tested on RN 0.88 RC. UIKit observations require the iOS 27.1
> SDK and runtime, and a UIScene host. Android readings depend on folding features
> and a hinge sensor. Early alphas: feedback and device reports welcome.

Link the [animated-mount compatibility note](verification/worklets-readiness-mount-2026-09-20.md)
in the release details. The example patches Worklets 0.13.0 for synchronous
readiness-driven animated mounts; consuming apps do not receive that patch by
installing either library. They must apply it, rebuild, and validate their app.
Do not post a documentation-site URL until its deployment is verified.

## Recorded demo

The 26.584-second original recording uses Android 16/API 36 emulator-5580 and
app `hinges.example`. The Field Notes source is included in commit `bde6e96`,
with RN `0.88.0-rc.1`, Reanimated `4.7.0`, Worklets `0.13.0` plus the committed
FIFO patch, and a local reserved-regions alpha.2 candidate tarball. It is not an
npm-installed or physical-device recording. The later Git dependency pin contains
the same native regions code.

The input sequence lasts 22 seconds. Video timestamps differ from host input
elapsed time; the original file has not been retimed.

| Host input time | Input                                       | Visible behavior                                                                              |
| --------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 0–3 s           | Flat posture, 180°                          | Open journal and measured no-division state.                                                  |
| 3–19 s          | Half-open posture, 180° → 60° → 180° sweeps | Native division marker and two-page caption; angle readout, perspective, and lighting change. |
| 19–22 s         | Flat posture, 180°                          | Journal returns to its open layout.                                                           |

The emulator's native sensor console supplies angles. An AOSP `display_features`
override supplies fold geometry; posture and angle are controlled independently.
The **NATIVE HINGE** badge and degree readout remain visible. This clip does not
show occlusion overlays, Sensor Lab's JS-stall test, or changing native iOS angles.
The reserved-regions example separately visualizes occlusions and provider bounds.

A generated preview is available in the app. Keep **SIMULATED ANGLE** visible in
any preview recording; its numeric readout is independently labeled native.

## Retained evidence

The task's `alpha2-demo/android/` artifact directory contains the original video,
`input.json`, the APK/source hashes in `patched-provenance.json`, startup/reload
screenshots, and the empty post-patch error logs. `alpha2-demo/ios-combined.png`
records static Duo startup with measured no-division state and native 0°.

The approximately 60 commands per second in the input log describe host injection
cadence, not delivered event frequency, hardware sampling frequency, or FPS.
Earlier Sensor Lab delivery measurements and their limits are recorded in the
[Android root-observer report](verification/root-observer-2026-09-20.md).

## Alt text

Field Notes travel journal on an Android emulator. Two illustrated pages sit
side by side. A native fold marker appears between them, and the caption changes
to “Two pages · native fold.” As the native angle readout changes, the pages tilt
and their lighting shifts before returning to an open layout. The screen names
react-native-hinges and react-native-reserved-regions.
