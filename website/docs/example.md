---
title: Run the example
description: Inspect native hinge observations with the repository example.
---

The repository includes a React Native `0.88.0-rc.1` example that imports the local library source. Use the Node.js and pnpm versions declared by the repository, plus native tooling for that React Native version.

## Install and launch

```sh
git clone https://github.com/appandflow/react-native-hinges.git
cd react-native-hinges
pnpm install
```

For iOS:

```sh
cd example
bundle install
cd ios
bundle exec pod install
cd ../..
```

Start Metro:

```sh
pnpm --filter react-native-hinges-example start
```

In a second terminal at the repository root:

```sh
pnpm --filter react-native-hinges-example ios
# or
pnpm --filter react-native-hinges-example android
```

## Field Notes

The example opens **Field Notes**, a two-page travel journal using both libraries:

- `react-native-reserved-regions` positions the pages around a native vertical
  division within the journal's bounded provider. Its caption changes to
  **TWO PAGES · NATIVE FOLD** when that division is present.
- A full-screen provider splits the Journal / Map / Moments toolbar around native
  occlusion bounds, with a 12-point gap. The tabs use the clear spans on either
  side; amber outlines show measured rectangles. The API does not identify what
  causes an occlusion. The selection slides and resizes between measured tab
  bounds, clipped to the clear spans so it stays out of the camera gap. Reduced
  motion switches the selection immediately.
- `useAnimatedHinges()` drives lighting and fades the journal number, headline,
  body, and footer while sliding them toward the outer edge between 160° and 80°.
  The mirrored landscape keeps the sun near the outer edge, clear of the fold.
  As it lowers, the sky, sun, mountains, and lake shift from daylight greens
  through a coral sunset into purple dusk.
  The pages stay geometrically flat; the physical screen
  supplies perspective. Reduced motion disables translation. When the angle is
  unavailable, the artwork appears open; the underlying reading remains `null`.

Native input is the default, labeled **NATIVE HINGE**. **Preview motion** generates
an angle for the artwork and displays **SIMULATED ANGLE**; **Use native angle**
returns to native observations. Preview does not generate reserved-region geometry.
Tap **VOL. 01 / THE OUTDOORS** to hide the preview and Sensor Lab buttons for a
recording; tap it again to restore them. Hiding the controls also selects native input.

The example installs `react-native-reserved-regions@0.1.0-alpha.2` from npm.

The example's local review render maps native Android emulator footage onto a [Galaxy Z Fold 3 model by RHModels](https://www.cgtrader.com/free-3d-models/electronics/phone/samsung-galaxy-z-fold-3-black-free-3d-model). The app viewport matches the model's display proportions. The model follows a lightly smoothed curve extracted from the recorded native angle; continuous camera moves reveal the fold region and the toolbar switching tabs around camera clearance. The fold-to-camera move takes two seconds. The illustrated phone is rendered at 60 fps; the app footage keeps its original cadence and native readings. The clean composition keeps the title, hinge angle, divider lines, and device, with no callout overlays or footer labels. The review render stays outside the repository and website deployment. The recording uses local Hinges and example source after alpha.2, the example Worklets patch, and npm-installed reserved regions alpha.2. The illustrated device is not a physical-device recording.

## Sensor Lab

Select **Sensor lab ↗** to open the numeric readings and diagnostic controls.
**Back to Field Notes** returns to the journal. The lab exposes the native reading
and the animation separately:

| Control                | What it changes                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Native / Preview       | Selects native observations or an explicitly labeled generated animation.                                                                              |
| Raw motion / Smoothed  | Applies presentation smoothing to the artwork; the reported native angle stays raw.                                                                    |
| Measure for 10 seconds | Counts distinct non-null angle changes on the UI runtime. The displayed summary can span longer than ten seconds because it is published periodically. |
| Test JS stall · 1s     | Deliberately blocks the JavaScript thread to inspect how native UI-runtime updates behave during that interval.                                        |

A sample's changes-per-second value is not animation FPS or a hardware sampling-rate guarantee. Use changing native input during a stall test. A preview animation continuing to move only verifies that generated animation.

The example includes Reanimated 4.7.0 and Worklets 0.13.0. Its screens call `useAnimatedHinges()` directly and share native observation for the React root. See [the optional integration](./reanimated.md) for how that value is fed.

## Native testing

On iOS, build with the iOS 27.1 SDK or later and run on iOS 27.1 or later. Building against an older SDK compiles out observation even on newer devices.

On Android, choose a foldable emulator profile to exercise posture updates. Angle reporting additionally depends on an available hinge-angle sensor. A missing angle is represented by `null`, not by an estimate based on the posture.

An outer-display screenshot alone does not establish fold-transition behavior. Verify an actual posture change and inspect the new native readings.

[Android emulator controls](https://developer.android.com/studio/run/emulator)

## Checks

From the repository root:

```sh
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm test
pnpm run build
pnpm run docs:build
```
