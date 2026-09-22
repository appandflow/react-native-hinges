# Provider-free Worklets bridge verification

## Implementation

`useAnimatedHinges()` uses the React root tag, a root-local native observation,
and Worklets' stable C++ API. It registers a serialized callback before starting
native observation. Cached snapshots are replayed through the same callback.
The hook creates no provider or observer view. The ordinary React hook and
non-React observers share the same native observation.

React Native TurboModule JSI binding installers supply the adapter on both
platforms. The adapter uses `getWorkletRuntimeFromHolder`,
`getUISchedulerFromHolder`, `extractSerializable`, and `runSyncOnRuntime`.
Reanimated and Worklets remain optional for the ordinary API.

## iOS

- Device: owned iPhone Duo simulator, iOS 27.1,
  `EC33DE7B-AFC0-43F4-AEC1-A16960820B4C`.
- Xcode: 27.1 beta; React Native: 0.88.0-rc.1.
- Native build passed after regenerating pods for the removed Fabric component.
- A standalone test screen rendered `useAnimatedHinges()` and `useHinges()`
  together without an animated provider.
- Both paths reported `partiallyOpen` and `1.7376933033587998` radians.
- The JS thread was blocked for five seconds; no native fold changes were
  supplied during this interval, so this run does not prove changing-angle
  delivery during the stall.
- Device Hub motion control was unavailable while the Mac was locked.

## Android

- Device: owned `fold3-camera` emulator, `emulator-5598`.
- Fresh native build and installation exposed the TurboModule JSI binding.
- The standalone test screen used both hooks without an animated provider.
- The emulator hinge sensor was driven through 90, 110, 130, 150, and 170 degrees.
- During a five-second JS busy loop, the UI runtime recorded **18 native angle
  updates covering five distinct values**. The ordinary React updates resumed
  after the JS stall.
- Evidence interval: `1790051082599` through `1790051087599` milliseconds since
  epoch. Samples were timestamped inside `useAnimatedReaction` on the UI runtime.
- This demonstrates delivery independent of the JS thread; the approximately
  four updates per second reflect the test's sensor injection cadence, not a
  measured device sampling limit.
- The temporary probe was removed and the normal example restored afterward.

### Android architecture selection

The Android adapter honors React Native's `reactNativeArchitectures` Gradle
property when setting its CMake ABI filters. When no selection is supplied, it
builds the usual four Android ABIs, matching Worklets' defaults.

The missing-symbol failure was an ABI mismatch in Hinges' new CMake integration.
Stim supplied `-PreactNativeArchitectures=arm64-v8a`, which Worklets honored, but
Hinges originally built all four architectures. Worklets' imported target was a
shared library for arm64 and headers-only for the unbuilt architectures. The
failure occurred while linking Hinges for `armeabi-v7a`.

The same failure reproduced without Stim or its staging directory:

```sh
cd example/android
./gradlew :react-native-hinges:assembleDebug -PreactNativeArchitectures=arm64-v8a
```

After adding the CMake ABI filter, that exact command passed and scheduled only
Hinges' arm64 CMake tasks. `stim android --slot fold3-camera` then passed with
standard `react-native-worklets::worklets` linkage and launched the example on
`emulator-5598`. No explicit library paths, Stim changes, or additional Worklets
patches were needed. The earlier diagnosis attributing this failure to Stim's
nested staging directory was incorrect.

The original runtime probe above used an experimental explicit library link.
The repaired standard-link build produced an identical APK to the already
installed build; Stim verified it and skipped reinstalling those same bytes.
After an app-scoped restart, Android logcat reported `Running "HingesExample"`
from the new process and no native linker error. Stim's automatic launch check
had not observed a fresh Metro bundle request, so this is direct runtime-log
evidence rather than a Stim launch-verification pass.
The example retains its pre-existing Worklets FIFO patch.

## Upstream key-window comparison

An isolated UIKit harness compiled the unmodified Reanimated native sensor files
at commit `b462c6ecbdfc5e0b959eb229ec71bfcd778b2ad2` from
`@pawicao/animated-sensor-hinge`. This did not run their full React Native hook.

A sensor registered while a temporary overlay window was key attached to that
window. After dismissing the overlay and restoring the visible content window
as key, the sensor remained attached to the dismissed window and reported
`angle=0`, `status=UNKNOWN`. The branch has no window-change observer or
reattachment path. In an app this concerns a first sensor registration while
such an overlay is key; Reanimated otherwise shares sensor subscriptions.

Two visible windows in the same scene initially reported the same angle. We
have not established different readings merely from selecting another visible
window, or tested multiple scenes with different display environments.

An immediate inspection before the queued attachment block ran initially looked
like an attachment failure. The later trace showed successful attachment; that
was a test error, not an upstream race. A deliberately pre-window registration
remained unattached, but normal React startup was not shown to reach that order.

## Automated checks

The hook tests cover cached initialization, update mapping without React
renders, root isolation, root replacement, retained values after unmount, and
an actionable missing-native-integration error. They mock the native boundary
and do not replace runtime tests.

The no-Worklets shared C++ fallback compiled with
`HINGES_WORKLETS_ENABLED=0`. This is not a complete core-only application build.
Local package inspection confirmed the common C++ adapter, Android JNI/CMake
sources, and public entry-point declarations are included in the tarball.
