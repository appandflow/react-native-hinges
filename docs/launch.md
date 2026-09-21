# Launch draft: reserved regions and hinges

Draft for the functional alpha.2 releases. Verify both npm versions and `next`
dist-tags before posting. This document does not authorize posting to X.

## X post

> Two React Native libraries for foldables.
>
> Hinges drives animations from native hinge angles. Reserved Regions keeps
> your UI clear of folds and cutouts.
>
> Here they are together in Field Notes. New Architecture, Reanimated support,
> and alpha releases available now.

Attach the [folding Field Notes demo](https://appandflow.github.io/react-native-hinges/demo/fold-showcase-v2.mp4).

Suggested reply:

> Docs and examples:
> https://appandflow.github.io/react-native-hinges/
> https://appandflow.github.io/react-native-reserved-regions/
>
> Tested on RN 0.88 RC. Feedback and device reports welcome.

```sh
npm install react-native-hinges@0.1.0-alpha.2 react-native-reserved-regions@0.1.0-alpha.2
```

UIKit observations require the iOS 27.1 SDK and runtime, and a UIScene host.
Android readings depend on folding features and a hinge sensor.

Link the [animated-mount compatibility note](verification/worklets-readiness-mount-2026-09-20.md)
in the release details. The example patches Worklets 0.13.0 for synchronous
readiness-driven animated mounts; consuming apps do not receive that patch by
installing either library. They must apply it, rebuild, and validate their app.

## Recorded demo

The video maps real Android emulator app footage onto a
[Galaxy Z Fold 3 model by RHModels / CGTrader](https://www.cgtrader.com/free-3d-models/electronics/phone/samsung-galaxy-z-fold-3-black-free-3d-model).
It is a device illustration, not a physical-device recording. The model follows
the native angle readout extracted from the app recording.

The app runs on the owned API 34 emulator `emulator-5590`, with React Native
`0.88.0-rc.1`, Reanimated `4.7.0`, Worklets `0.13.0` plus the example FIFO patch,
and npm-installed reserved regions `0.1.0-alpha.2`. Hinges and the example use
local repository source. The stronger motion and mirrored landscape are example
changes made after the alpha.2 library release.

- Native angle sweeps from 180° through 120°, 90°, and 60°, then back to 180°.
  The journal number, headline, body, and footer fade and slide toward the outer
  edge. The sun stays away from the fold.
- The emulator remains in half-open posture so the measured division stays
  present throughout. The fold close-up holds a recorded frame.
- Journal, Map, and Moments switch in the camera close-up. The toolbar uses the
  clear spans around native occlusion bounds, adding 12 dp of clearance.

The emulator console supplies hinge-angle input. Native Android display-feature
and cutout overrides supply the fixture geometry. The app reads those native
APIs; the video does not use the app's simulated preview. The regions API reports
occlusion geometry and does not identify a camera.

The host recording is cropped to remove letterboxing and the Android taskbar,
restored to the app viewport's aspect ratio, and converted to 24 fps for the
render. Output frame rate is not native event frequency. The video is edited into
a fold sequence and two close-ups; it does not establish hardware performance or
continuous iOS hinge-angle delivery.

## Retained evidence

The task's `fold-showcase-v2/` artifact directory retains the source capture,
input and tab logs, corrected texture, OCR angle readings, rendering scripts,
final video, poster, and provenance. The original alpha.2 capture remains under
`alpha2-demo/android/`; it is superseded for the launch video.

Earlier delivery measurements and their limits are recorded in the
[Android root-observer report](verification/root-observer-2026-09-20.md).
The iOS screenshot proves static Duo startup only. A changing native iOS angle
has not yet been verified.

## Alt text

A 3D Galaxy Z Fold 3 displays the Field Notes travel journal. As the phone folds,
the right page's large number and text fade and slide outward. The illustrated sun
sits near the left outer edge. A close-up highlights the gap between the pages.
Another close-up shows Journal, Map, and Moments tabs switching while keeping a
gap around the camera. The screen names react-native-hinges and
react-native-reserved-regions.
