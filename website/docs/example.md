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
  causes an occlusion.
- `useAnimatedHinges()` drives lighting and fades/slides secondary journal text
  between 120° and 60°. The pages stay geometrically flat; the physical screen
  supplies perspective. Reduced motion disables translation. When the angle is
  unavailable, the artwork appears open; the underlying reading remains `null`.

Native input is the default, labeled **NATIVE HINGE**. **Preview motion** generates
an angle for the artwork and displays **SIMULATED ANGLE**; **Use native angle**
returns to native observations. Preview does not generate reserved-region geometry.

The example installs `react-native-reserved-regions@0.1.0-alpha.2` from npm.

[Watch the native Android emulator demo](https://github.com/user-attachments/assets/7f69106d-2649-4591-917c-9aa7743fd5fa). The recording uses the matching local alpha.2 candidate and the example Worklets patch; it is not a physical-device or npm-installed recording.

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

The example includes Reanimated 4.7.0 and Worklets 0.13.0. See [the optional integration](./reanimated.md) for how its animated and ordinary consumers share native root observation.

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
