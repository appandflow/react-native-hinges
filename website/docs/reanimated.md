---
title: Reanimated integration
description: Read native hinge snapshots from Reanimated worklets.
---

The optional `react-native-hinges/reanimated` entry point supplies hinge snapshots as a Reanimated shared value. Use it when an animated style needs the latest native reading without routing each update through React state.

This is an initial integration. It does not promise a sampling frequency, a display frame rate, or delivery of every hardware sample. [Platform behavior](./platforms.md) still determines which readings are available.

## Install the optional dependencies

The core hook and observer do not require Reanimated. For the animated entry point, the current peer ranges are Reanimated `^4.7.0` and Worklets `^0.13.0`; the example uses `4.7.0` and `0.13.0`.

```sh
pnpm add react-native-reanimated@^4.7.0 react-native-worklets@^0.13.0
```

For a React Native Community CLI app, add `react-native-worklets/plugin` last in the Babel plugins list, install iOS pods, and rebuild the native app. Preserve your existing presets and plugins. Follow the [official Reanimated setup instructions](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/).

The provider-free integration is available starting with `0.1.0-alpha.3`. Remove `AnimatedHingesProvider` when upgrading from `0.1.0-alpha.2`, install pods, and rebuild the native app. See [installation](./installation.md).

## Use the hook

```tsx
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useAnimatedHinges } from 'react-native-hinges/reanimated';

function HingeCard() {
  const hinges = useAnimatedHinges();
  const style = useAnimatedStyle(() => {
    const angle = hinges.get()[0]?.angle;
    return {
      opacity: angle == null ? 0 : 1,
      transform: [{ perspective: 800 }, { rotateY: `${angle == null ? 0 : Math.PI - angle}rad` }],
    };
  });

  return <Animated.View style={[{ width: 160, height: 220, backgroundColor: '#315de0' }, style]} />;
}

export default function App() {
  return <HingeCard />;
}
```

The example reads the first hinge and hides the card when its angle is unavailable. An app supporting several hinges must choose the appropriate observation; array order is not a stable hardware identity.

No provider or additional native view is needed. The hook reads `RootTagContext` to observe the calling React root. Each consumer owns a shared value, while all consumers of that root share native observation with the regular hook and explicit observers.

Tests that render the hook outside React Native's `AppContainer` must supply a valid `RootTagContext`, just as for `useHinges()`.

## Shared-value contract

```ts
function useAnimatedHinges(): SharedValue<readonly Hinge[]>;
```

The shared value is seeded from the root's native cache, or `[]` if no reading exists. Subscription installs the worklet callback before starting observation and replays the latest native snapshot. Hinge status and raw radians have the same meaning as the ordinary API; unavailable angles remain `null`.

Read it with `get()` inside a worklet such as `useAnimatedStyle`. Treat the value as read-only even though the underlying Reanimated type exposes setters. Reading a shared value during React rendering is not supported; use the regular `useHinges()` hook for rendered text. See [Reanimated's shared-value guidance](https://docs.swmansion.com/react-native-reanimated/docs/core/useSharedValue/).

Native events update the shared value in Reanimated's UI runtime. The ordinary hook and observer continue to run on the JavaScript thread and can lag while that thread is busy. Those are two consumption paths; the observer is not an animation-frame callback.

## Raw readings and presentation

The Reanimated integration applies no interpolation, smoothing, JavaScript-side throttling, or fixed output interval. Native sources and their registration policy govern event cadence. Add a spring or timing animation in your app if that presentation suits the interaction. Interpolated frames describe your animation, not additional native measurements.

The demo's simulated preview is generated animation. Its raw/smoothed switch changes the artwork; it does not change native sensor values. A simulator sample is specific to that device profile and input sequence, not a hardware performance guarantee.

### Readiness-gated animated content

On the tested RN `0.88.0-rc.1` Android stack, conditionally mounting Reanimated
`4.7.0` content when `useReservedRegionsReady()` becomes true can throw
`__requestMapperRunFinalizer` is undefined: Worklets `0.13.0` can run synchronous
UI work ahead of queued mapper initialization. The combined hinges example uses
an [example-only Worklets FIFO patch](https://github.com/appandflow/react-native-hinges/blob/main/patches/react-native-worklets%400.13.0.patch).
Installing either library does not patch a consuming app's Worklets dependency.
Keeping the animated subtree mounted avoided this failure in the tested case;
apps that gate its mount need to apply the patch, rebuild the native app, and
validate it themselves.

## How updates are delivered

React Native's TurboModule JSI bindings register a serialized worklet and the UI runtime/scheduler holders. The library uses Worklets' stable C++ API to call that worklet from native hinge callbacks on the UI thread. No Fabric observer view, custom view event, or JavaScript-thread relay is involved.

On iOS, `UIHingeInteraction` attaches to the calling React root. On Android, the observer resolves that root's Activity and combines WindowManager folding features with the default hinge-angle sensor. The native observation is shared with ordinary `useHinges()` and `createHingeObserver()` subscriptions for the same root.

Worklets is an optional native dependency, detected during pod installation and Gradle configuration. Installing it after building the app requires a native rebuild. The core hook and observer continue to work without it.

## Lifetime and validation limits

Unmounting unsubscribes the callback. Queued deliveries for that subscription are ignored. Changing React roots creates a new shared value and releases the old root's subscription. The final subscriber releases native observation and its cache. An externally retained shared value keeps its last snapshot.

The Android emulator check delivered 18 changing native readings to the UI runtime during a five-second JS stall, while an ordinary hook observed the same root. The iOS 27.1 Duo check confirmed the initial reading through both hooks; changing-angle delivery during a JS stall has not yet been verified there. Physical hardware, multiple-hinge devices, and first-frame availability require separate validation.
