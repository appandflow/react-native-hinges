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

This integration is included in the `0.1.0-alpha.2` candidate. See [installation status](./installation.md) before installing; the old `0.1.0-alpha.0` placeholder does not contain it.

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

No provider is needed. The regular hook, explicit observers, and animated hooks share native observation for the same React root. Each animated hook owns a shared value.

## Shared-value contract

```ts
function useAnimatedHinges(): SharedValue<readonly Hinge[]>;
```

The shared value starts from the native cache or `[]`. Hinge status and raw radians have the same meaning as the ordinary API; unavailable angles remain `null`.

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

## Lifetime and validation limits

Unmounting unregisters the root-tag event handler and releases the native subscription. An externally retained shared value keeps its last snapshot. The native cache is cleared when the root has no subscribers.

This prototype registers the handler returned by Reanimated 4.7's `useEvent` directly against the React root tag. Android uses RN 0.88's internal Fabric event emitter type to route the event only to native observers; iOS uses `notifyObserversOfEvent` and explicitly registers an already-loaded Reanimated module with that dispatcher. These integration points need revalidation when upgrading React Native or Reanimated. They avoid delivering angle updates through the JavaScript thread first.

The root-scoped Android implementation has been tested with fixed-angle cold launches and native angle updates during a one-second JS stall. These emulator checks do not establish physical-device rates or first-frame availability. A simulated-preview animation does not verify sensor delivery.
