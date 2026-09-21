# Root-scoped observer: iOS verification

Verified on September 20, 2026 with Xcode 27.1 beta, React Native
0.88.0-rc.1, Reanimated 4.7.0, and the New Architecture Debug example.

## Device and build

- Owned iPhone Duo simulator running iOS 27.1:
  `EC33DE7B-AFC0-43F4-AEC1-A16960820B4C`.
- App: `hinges.example`; Metro: port 8090.
- Final native build passed in 35.4 seconds, including 8.1 seconds compilation.
- Stim reported bundling at its launch-check deadline. Subsequent native UI
  inspection confirmed the rebuilt example loaded.
- The final `stim logs --errors` query had no matching records.

## Observations

A fresh app install/start with the simulator held closed produced the following
values without any hinge movement:

| Consumer                 | Observed value                           |
| ------------------------ | ---------------------------------------- |
| Reanimated UI telemetry  | 0.0 degrees, closed, one initial reading |
| React `useHinges()` hook | 0.000 radians                            |
| Standalone root observer | 0.000 radians                            |

Navigating from Sensor Lab to Field Notes and back reproduced all three values.
The remounted telemetry received one initial UI reading.

The native cache for the observed root tag 11 contained one closed hinge with
angle 0 and `hasAngle: true`. Reading the unobserved root tag 1 returned an empty
array. This checks lookup separation, but does not establish correctness across
two simultaneously mounted roots or windows.

No native hinge view is mounted by the library. UIKit's interaction attaches to
the existing registered React root. Observation starts with subscription, so the
first uncached render may still receive an empty array before UIKit delivers
its initial callback. These checks do not guarantee a populated first render.

## Reanimated adapter

The initial implementation populated the native cache and ordinary observers,
but did not deliver iOS root events to Reanimated. Runtime diagnostics showed
only `RCTNativeAnimatedTurboModule` registered with `RCTEventDispatcher`.
Reanimated 4.7 registers its observer in `setBridge`, which can precede React
Native's injection of its module registry.

The adapter registers the already initialized Reanimated module through its
`RCTEventDispatcherObserver` protocol before acquiring observations. It does not
load the optional peer, and registration is deduplicated per native module.
Initial and remount delivery passed after this change. This integration depends
on Reanimated's current native observer implementation and needs checking when
upgrading the supported versions. Temporary diagnostics were removed.

## Limits

Changing iOS angles, physical hardware, multiple live roots/windows, and
first-visible-frame layout correction were not verified. The simulator only
provided the static closed hinge state in this run.

## Surface presenter lookup

The root lookup now uses the `RCTSurfacePresenter` injected by `RCTInstance`,
then `surfaceForRootTag:` and the surface's cached view on the main thread. It
no longer uses `viewRegistry_DEPRECATED` or creates a library-owned view.

The replacement compiled in 11.3 seconds; Stim's build/install/launch took
43.1 seconds on the same owned Duo and Metro port. The rebuilt app reported
0.0 degrees, `closed`, and one initial Reanimated reading. Both the React hook
and standalone observer reported 0.000 radians.

A React Native reload visibly returned the app to Field Notes. Opening Sensor
Lab again reproduced all three readings without moving the simulated hinge.
The final `stim logs --errors` check had no matching records. Evidence is the
retained task screenshot `root-hinges-ios/surface-presenter-reload.png`.
This validates static observation and reload recovery, not changing iOS angles
or multiple simultaneously mounted surfaces.

## Codegen module registration

`RCT_EXPORT_MODULE(NativeHinges)` was replaced with an explicit `+moduleName`
returning `NativeHinges`. The generated `RCTModuleProviders.mm` maps that name
to `HingesModule`, so legacy static registration is unnecessary. The generated
`NativeHingesSpecBase` does not implement the module name required by React
Native's module protocol.

A fresh native build passed in 10.2 seconds compilation and 36.7 seconds total
on the same Duo. Its cold launch resolved the module and showed 0.0 degrees,
`closed`, one initial Reanimated reading, and 0.000 radians in both the React
hook and standalone observer. The final runtime error query had no matches.
Evidence: `root-hinges-ios/codegen-module-registration.png`. No additional
reload, native angle changes, or broader platform validation was performed.
