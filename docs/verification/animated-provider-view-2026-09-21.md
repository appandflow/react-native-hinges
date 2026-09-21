# Animated hinges provider view: September 21, 2026

Verification of the replacement of the Reanimated delivery mechanism. The
optional entry point now exposes `AnimatedHingesProvider`, which renders a
hidden `HingesObserverView` Fabric component and feeds its `onHingesChange`
direct event to a Reanimated `useEvent` handler. The previous mechanism
registered a root-tag event handler and depended on `notifyObserversOfEvent`
plus an explicit Reanimated module registration on iOS, and on React Native's
`internal` `FabricEventEmitter` type on Android. Both are removed.

Stack: React Native `0.88.0-rc.1`, Reanimated `4.7.0`, Worklets `0.13.0`,
example app `hinges.example`.

## Repository checks

`pnpm run format`, `format:check`, `lint`, `typecheck`, `test`, `build` and
`docs:build` all pass on the working tree. The rewritten
`src/__tests__/reanimated.test.tsx` covers the seeded `[]` value, worklet updates
without a React render, the `refresh` request after the scheduling hop, no
request after unmount, and the error thrown outside the provider.
`src/__tests__/index.test.tsx` still asserts that the core entry point loads
neither Reanimated nor Worklets.

## iOS

Own iPhone Duo simulator `A7052FCA-BF42-4AC9-96E4-3B4D5EA4424B`
(`hinges-provider-duo`, iOS 27.1), built with Xcode 27.1 beta, Release
configuration, installed and cold launched with `simctl`. No Metro server: the
Release variant embeds the bundle.

The first Release build of the new provider crashed on launch:

```
[Worklets] Locally defined function passed to scheduleOnRN. Only functions
defined on the RN Runtime or host functions can be scheduled on the RN Runtime.
```

The callback passed to `scheduleOnRN` was created inside the `scheduleOnUI`
worklet. Defining it on the React Native runtime and referencing it from the
worklet fixed it. The Jest mocks do not model this Worklets restriction, so the
unit tests passed while the app could not start. That gap remains.

After the fix, a cold launch with the simulator held closed produced:

| Consumer                       | Observed value                       |
| ------------------------------ | ------------------------------------ |
| Sensor Lab `NATIVE ANGLE`      | `0.0°`, `closed`, 1 reading received |
| Sensor Lab mode pill           | `NATIVE HINGE`                       |
| Sensor Lab React `useHinges()` | `0.000 rad`                          |
| Sensor Lab standalone observer | `0.000 rad`                          |
| Field Notes native readout     | `NATIVE HINGE`, `NATIVE 0.0°`        |

The Sensor Lab angle, status and reading count come from
`useHingeTelemetry(useAnimatedHinges())`, so a non-empty reading there is
delivery through the new view to the shared value on the UI runtime. The Field
Notes readout comes from `useHinges()` and confirms the unchanged core path.
Screenshots: `/tmp/hinges-provider-ios/01-field-notes.png` and
`/tmp/hinges-provider-ios/02-sensor-lab-native-angle.png`.

Capture used the active Duo display explicitly. `xcrun simctl io <udid>
enumerate` lists two `Display class: 0` framebuffers; the 2007x2853 inner
display is black while the device is closed, and agent-device's own screenshot
also defaulted to it.

The simulator only reports a static closed hinge. Changing iOS angles, physical
hardware, several simultaneously mounted providers, and first-visible-frame
availability were not established by this run.

### Compile guard

The library also builds against the older SDK. With the default Xcode 27.0
toolchain, a `generic/platform=iOS Simulator` destination and
`CODE_SIGNING_ALLOWED=NO`, the `Hinges` pod target succeeded for both arm64 and
x86_64 against `iPhoneSimulator27.0.sdk`, compiling `HingesObserverView.mm`.
The full application scheme was not built with that toolchain because the host
disk filled during linking; the target that contains the new code was.

`HingesObserverView.mm` keeps the same
`__IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_27_1` guard and
`@available(iOS 27.1, *)` check the module used, so an older SDK compiles the
interaction out and the view emits nothing.

## Android

Emulator `emulator-5580`, AVD `reserved-regions-fold-demo`, a `pixel_9_pro_fold`
on API 36 with a hinge sensor. Release variant with the embedded bundle, no
Metro.

The same Worklets crash appeared here, and for the same reason: the gradle
bundle task did not re-run when only the library source outside `example/`
changed, so the first rebuild after the fix still packaged the old bundle.
Deleting `app/build/generated/assets/react/release/index.android.bundle` before
`:app:assembleRelease` produced a bundle that launches.

With that build installed, driving `hinge-angle0` through the emulator console
produced:

| Input         | Sensor Lab reading       | Field Notes readout |
| ------------- | ------------------------ | ------------------- |
| 180 degrees   | `NATIVE HINGE` pill      |                     |
| 45 degrees    | `45.0°`, `partiallyOpen` |                     |
| 180 degrees   | `180.0°`, `fullyOpen`    |                     |
| 180, relaunch |                          | `NATIVE 180.0°`     |

The Sensor Lab angle and status come from
`useHingeTelemetry(useAnimatedHinges())`, so they are delivery through the new
view. Screenshots are in `/tmp/hinges-android-evidence/`.

`pnpm e2e:android` itself did not complete. Its gradle build, install and sensor
injection succeed, then the cold launch fails:

```
FAIL open field notes: cold launch
Error (DEVICE_IN_USE): Device is already in use by session "cwd:738c1e202b917171:default".
```

Another agent-device session has held that emulator's lease since 01:31 local
time and last issued a command at 05:48. Twelve retries over roughly thirty
minutes hit the same error, and the lease was not reclaimed. The readings above
were therefore taken with plain `adb`: `am start`, `uiautomator dump` for the
text assertions, `input tap` to open the Sensor Lab, and
`adb emu sensor set hinge-angle0` for the input. That covers the same states the
script asserts, but it is not a run of the committed check, and the committed
check remains unexercised against this branch.

Two further notes from this run. `screencap` needs an explicit display id on this
AVD, which `cmd display get-displays` reports as `local:4619827259835644672`.
And `ViewManagerPropertyUpdater` logs `Could not find generated setter for class
com.appandflow.hinges.HingesObserverViewManager` at startup, which is expected
for a view manager with no props; the `refresh` command still arrives through
the generated delegate, as the readings show.

## Not established

- Changing iOS hinge angles, and any physical device on either platform.
- More than one mounted `AnimatedHingesProvider`, and provider remount timing.
- First-visible-frame availability. The provider seeds `[]` and the native view
  emits afterwards.
- Reanimated and React Native versions other than the ones listed above. The
  `useEvent` handler, the `scheduleOnUI` to `scheduleOnRN` hop and the
  `DirectEventHandler` payload are public integration points, but they have only
  been exercised against this pair.
