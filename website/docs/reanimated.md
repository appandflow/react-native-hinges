---
title: Reanimated integration
description: Read native hinge snapshots from Reanimated worklets.
---

The optional `react-native-hinges/reanimated` entry point supplies hinge snapshots as a Reanimated shared value. Use it when an animated style needs the latest native reading without routing each update through React state.

This is an initial integration. It does not promise a sampling frequency, a display frame rate, or delivery of every hardware sample. [Platform behavior](./platforms.md) still determines which readings are available.

## Install the optional dependencies

The core provider, hook, and observer do not require Reanimated. For the animated entry point, the current peer ranges are Reanimated `^4.7.0` and Worklets `^0.13.0`; the example uses `4.7.0` and `0.13.0`.

```sh
pnpm add react-native-reanimated@^4.7.0 react-native-worklets@^0.13.0
```

For a React Native Community CLI app, add `react-native-worklets/plugin` last in the Babel plugins list, install iOS pods, and rebuild the native app. Preserve your existing presets and plugins. Follow the [official Reanimated setup instructions](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/).

The npm `0.1.0-alpha.0` placeholder does not contain this integration. Use the repository source until a functional alpha is published.

## Replace the provider for this hierarchy

```tsx
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { AnimatedHingeProvider, useAnimatedHinges } from 'react-native-hinges/reanimated';

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
  return (
    <AnimatedHingeProvider style={{ flex: 1 }}>
      <HingeCard />
    </AnimatedHingeProvider>
  );
}
```

The example reads the first hinge and hides the card when its angle is unavailable. An app supporting several hinges must choose the appropriate observation; array order is not a stable hardware identity.

`AnimatedHingeProvider` takes the same props as `HingeProvider`, including `observer`. It replaces the ordinary provider for that hierarchy. The regular `useHinges()` hook and `createHingeObserver()` subscriptions still work beneath it, so a React readout and an animated view can use the same native source.

## Shared-value contract

```ts
function useAnimatedHinges(): SharedValue<readonly Hinge[]>;
```

The shared value starts at `[]`. Each hinge keeps the ordinary API's native status and raw angle in radians, with `null` for unavailable angles. The hook throws outside `AnimatedHingeProvider`. Each animated provider owns a separate shared value.

Read it with `get()` inside a worklet such as `useAnimatedStyle`. Treat the value as read-only even though the underlying Reanimated type exposes setters. Reading a shared value during React rendering is not supported; use the regular `useHinges()` hook for rendered text. See [Reanimated's shared-value guidance](https://docs.swmansion.com/react-native-reanimated/docs/core/useSharedValue/).

Native events update the shared value in Reanimated's UI runtime. The ordinary hook and observer continue to run on the JavaScript thread and can lag while that thread is busy. Those are two consumption paths; the observer is not an animation-frame callback.

## Raw readings and presentation

The Reanimated integration applies no interpolation, smoothing, JavaScript-side throttling, or fixed output interval. Native sources and their registration policy govern event cadence. Add a spring or timing animation in your app if that presentation suits the interaction. Interpolated frames describe your animation, not additional native measurements.

The demo's simulated preview is generated animation. Its raw/smoothed switch changes the artwork; it does not change native sensor values. A simulator sample is specific to that device profile and input sequence, not a hardware performance guarantee.

## Lifetime and validation limits

Reanimated unregisters the native event handler when the animated provider unmounts. If other code retains its shared value, that value currently retains the last snapshot; it is not reset by the observer's unmount cleanup. The ordinary observer is cleared separately.

The initial Android API 36 emulator checks observed native angle updates during the demo's one-second JavaScript stall. Two cold app relaunches also delivered a fixed 111-degree reading without further input after the first telemetry publication. These checks cover that emulator and input sequence, not all remount timing, iOS callbacks, or physical-device performance. A successful simulated-preview animation alone does not verify native delivery. The first alpha's release notes record the available evidence.
