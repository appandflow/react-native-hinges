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

The folding Field Notes review render is kept as a local artifact outside the
repository and website deployment.

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

The v5 local review render maps real Android emulator app footage onto a
[Galaxy Z Fold 3 model by RHModels / CGTrader](https://www.cgtrader.com/free-3d-models/electronics/phone/samsung-galaxy-z-fold-3-black-free-3d-model).
It is a device illustration, not a physical-device recording. The model follows
a lightly smoothed curve extracted from the native angle readout in the app recording. The library readings and app footage stay unfiltered.

The app runs on the owned API 34 emulator `emulator-5592`, with React Native
`0.88.0-rc.1`, Reanimated `4.7.0`, Worklets `0.13.0` plus the example FIFO patch,
and npm-installed reserved regions `0.1.0-alpha.2`. Hinges and the example use
local repository source. The recording uses the native Fabric observer implementation and example
changes made after the alpha.2 library release.

- Native angle sweeps from 180° through 120° to 90°, then back to 180°.
  The journal number, headline, body, and footer fade and slide toward the outer
  edge. The sun stays away from the fold, and the landscape colors shift into
  sunset as it lowers.
- The emulator remains in half-open posture so the measured division stays
  present throughout. A continuous camera move brings the fold into view, then
  moves toward the camera cutout as the phone opens.
- Journal, Map, and Moments switch in the camera close-up. The toolbar uses the
  clear spans around native occlusion bounds, adding 12 dp of clearance. Its
  selection slides and resizes, clipped out of the cutout gap.

The emulator console supplies hinge-angle input. Native Android display-feature
and cutout overrides supply the fixture geometry. The app reads those native
APIs; the video does not use the app's simulated preview. The regions API reports
occlusion geometry and does not identify a camera.

The scrcpy recording is cropped to remove the Android taskbar and converted to
60 fps for the render using the source timing, with the final static frame held. The app viewport matches the model display aspect ratio, so the screen content keeps its proportions. A Gaussian filter with a 0.16-second standard deviation smooths only the illustrated phone angle. Output frame rate is not native event frequency. The move from the fold close-up to the camera close-up takes two seconds. The camera moves through
a fold sequence and two close-ups; it does not establish hardware performance or
continuous iOS hinge-angle delivery.

The clean v5 composition retains the title, hinge angle, divider lines, and
device while removing callout overlays and footer labels. The source capture was
taken from Hinges at commit `8578e26`; the documentation/main comparison point
is `f38954e`. This artifact does not claim full native current-release validation.

## Retained evidence

The task's `fold-showcase-v5/` artifact directory retains the source capture,
input and tab logs, audited texture, OCR angle readings, rendering scripts,
final video, poster, and provenance. The original alpha.2 capture remains under
`alpha2-demo/android/`; it is superseded for the launch video.

Earlier delivery measurements and their limits are recorded in the
[Android root-observer report](verification/root-observer-2026-09-20.md).
The iOS screenshot proves static Duo startup only. A changing native iOS angle
has not yet been verified.

## Alt text

A 3D Galaxy Z Fold 3 displays the Field Notes travel journal. As the phone folds,
the right page's large number and text fade and slide outward while the landscape
turns from daylight green to a coral sunset. The illustrated sun
sits near the left outer edge. A close-up highlights the gap between the pages.
Another close-up shows Journal, Map, and Moments tabs switching while keeping a
gap around the camera. The screen names react-native-hinges and
react-native-reserved-regions.
