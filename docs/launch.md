# Launch draft: reserved regions and hinges

Draft material for the first functional alphas. Do not post a release claim
until both intended npm versions and their dist-tags have been verified. The
hinges `0.1.0-alpha.0` package is a placeholder. Both documentation sites are
currently local builds; the links below target the public repositories.

## X post

> Two React Native alphas for foldables:
>
> react-native-reserved-regions → view-scoped folds + occlusions
> react-native-hinges → posture + angles, with optional Reanimated shared values
>
> New Architecture · iOS + Android
>
> https://github.com/appandflow/react-native-reserved-regions
> https://github.com/appandflow/react-native-hinges

Attach the [recorded Android emulator demo](https://github.com/user-attachments/assets/4f7783d8-2d17-4615-b24a-b618be93436b). Add the exact installation commands and
platform requirements in a reply after verifying the release:

> Regions use the provider's coordinates. Hinges expose native posture and raw
> radians; unavailable angles stay null. UIKit needs the iOS 27.1 SDK + runtime.
> Android readings depend on the device's folding features and hinge sensor.
>
> Early alphas—feedback and device reports welcome.

If the functional packages are not published, replace “alphas” with “libraries
in development” and explicitly say “Try the source; npm packages are not ready.”
Do not publish a docs-site URL until its deployment has been checked.

## Recorded video

A 22-second Android emulator capture now shows the default Field Notes screen
using native callbacks from both libraries. The **NATIVE HINGE** badge stays
visible. This capture uses emulator-console angle input and an AOSP
`display_features` fold override; it is not a physical-device recording or the
app's generated Preview mode. Posture and angle are controlled separately in
this setup.

| Time    | Recorded action                                               | Visible result                                                                                   |
| ------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 0–3 s   | Flat posture, 180° angle.                                     | Open journal with the ordinary page gap.                                                         |
| 3–19 s  | Half-open posture with smooth 180° → 60° → 180° angle sweeps. | The native fold changes the page gap and caption; angle updates change perspective and lighting. |
| 19–22 s | Return to flat posture at 180°.                               | The journal returns to its open layout.                                                          |

The Field Notes screen has no occlusion overlay or live numeric angle text.
Sensor Lab holds the native readouts, raw/smoothed controls, and JS-stall test;
those diagnostics are not shown in this clip. The reserved-regions example
separately visualizes reported geometry.

An optional title/end card can name both packages and identify the Android
emulator. Keep the interaction at its recorded speed. Add release installation
information only after publication is verified. No final upload URL is recorded
here yet.

### Optional simulated preview shot

A separate preview shot can illustrate the design without hinge input. Keep
**SIMULATED ANGLE** visible in Field Notes or **SIMULATED PREVIEW** in Sensor Lab
for the whole shot, and label it again in the edit. A preview continuing during a
JS stall only demonstrates that generated animation. The recorded 22-second
native sequence does not use this mode.

## Recording evidence

For each native clip, retain:

- The source commit, app build, device/profile, OS/runtime, and iOS SDK when relevant.
- The input sequence and whether values came from native APIs or simulated preview.
- The original recording, without retiming the interaction.
- A brief note describing the actual observation and any missing data.

For event-rate samples, record the duration, changed-angle event count, mean and
maximum gaps, and the exact input sequence. These numbers measure that run's
delivered changed-value events. They are not display FPS, hardware sampling
frequency, or a supported-frequency guarantee. A single static angle naturally
produces few or no changes.

## Alt text draft

“Field Notes travel journal on an Android emulator. Two illustrated pages sit
side by side. A native fold changes their spacing and the caption to ‘Two pages ·
native fold’. As the emulator's hinge angle changes, the pages tilt and their
lighting shifts, then return to the open layout. The screen identifies both
react-native-hinges and react-native-reserved-regions.”

## Available native evidence

The 22-second Field Notes capture demonstrates the combined layout and animation
under the emulator inputs described above. Retain its original recording and
source/build details with release review before uploading the final edit.

Separate Android API 36 emulator measurements recorded native angle changes
through Sensor Lab's one-second JS-stall control and fixed-angle initial values
after two cold relaunches. See [the verification note](verification/android-emulator-2026-09-20.md).
These measurements do not establish physical-device performance, and the launch
clip does not show the JS-stall test.
