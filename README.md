# react-native-hinges

Hinge posture and angle observations for React Native's New Architecture.

## Installation

Install the functional `0.1.0-alpha.2` release:

```sh
npm install react-native-hinges@0.1.0-alpha.2
```

Install iOS pods and rebuild your native app. This is an early alpha; see the
platform requirements below. The older `0.1.0-alpha.0` is only a name-reservation
placeholder and does not implement these APIs.

## Requirements

- React Native New Architecture (Fabric). The tested example uses `0.88.0-rc.1`;
  a broader supported version range has not been established.
- iOS 27.1 SDK and runtime for UIKit hinge observations. SDK compile guards allow
  older SDK builds, but those builds return no hinges even on newer devices.
  The host app must use the UIScene lifecycle for iOS 27.1. The example adopts
  `UISceneDelegate`; see [React Native issue #58606](https://github.com/react/react-native/issues/58606).
- Android API 24 or newer with a Jetpack WindowManager-supported folding device.
  Angle readings require an available hinge-angle sensor on API 30 or newer.

## React usage

```tsx
import { Text } from 'react-native';
import { useHinges } from 'react-native-hinges';

export default function Screen() {
  const hinges = useHinges();
  return <Text>{hinges[0]?.status ?? 'No reading'}</Text>;
}
```

No provider or view ref is required. The hook uses React Native's `RootTagContext`
and observes the existing native root. Multiple hooks on one root share native
observation. Separate roots keep separate snapshots; there is no implicit global window.

`useHinges()` throws if rendered outside a React Native root, where `RootTagContext`
is still its default of `0`. In tests without an `AppContainer` (such as plain
`react-test-renderer`), wrap the tree in `<RootTagContext.Provider value={1}>`.

Each hinge has `status: 'unknown' | 'closed' | 'partiallyOpen' | 'fullyOpen'` and
`angle: number | null` in radians. An empty array means no readings are available
(including before initialization). Array order is not a persistent identity.

The hook synchronously reads a native cache, then acquires observation when it
subscribes. An uncached first render returns `[]`: the module does not block React
waiting for an OS callback. Initial native readings do not require moving the hinge.
There is no guarantee that the first rendered frame contains a reading.

## Outside React

```ts
import { createHingeObserver } from 'react-native-hinges';

// Pass the intended root's tag from RootTagContext or your native host integration.
const observer = createHingeObserver(rootTag);
const unsubscribe = observer.subscribe(() => console.log(observer.get()));
console.log(observer.get());
// When your subscription is no longer needed:
unsubscribe();
```

Creation reads the native cache once; `get()` returns the latest observed snapshot. `subscribe()` acquires
observation for that root; the last native subscriber releases it and its cache.
You can create multiple observers for the same root. Resubscribe to obtain fresh
readings after observation has stopped.

## Reanimated

The optional `react-native-hinges/reanimated` entry point requires Reanimated
`^4.7.0` and Worklets `^0.13.0`. The example uses `4.7.0` and `0.13.0`. Configure
the Worklets Babel plugin and rebuild native dependencies using
[Reanimated's setup guide](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/).

```tsx
import { useAnimatedHinges } from 'react-native-hinges/reanimated';
import { useAnimatedStyle } from 'react-native-reanimated';

function useHingeCardStyle() {
  const hinges = useAnimatedHinges();
  return useAnimatedStyle(() => {
    const angle = hinges.get()[0]?.angle;
    return {
      opacity: angle == null ? 0 : 1,
      transform: [{ rotateY: `${angle == null ? 0 : Math.PI - angle}rad` }],
    };
  });
}
```

No animated provider is needed. The hook returns a read-only-by-contract
`SharedValue<readonly Hinge[]>`, initialized from the native cache or `[]`.
Read it inside worklets and do not write to it. Native events update the value
on the UI runtime, preserving raw radians and nullable angles without JS delivery
as an intermediate step. The library adds no smoothing or sampling-frequency guarantee.

Unmounting unregisters the worklet and releases its native subscription. An
externally retained shared value keeps its last snapshot. See the
[integration guide](website/docs/reanimated.md) for setup and compatibility limits.

## Native behavior

Apple's `UIHingeInteraction` reports zero or one hinge for its view hierarchy.
The root's bounds do not clip the readings. On Android, each WindowManager
folding feature contributes a posture; an angle is attached only when exactly
one sensor and at most one feature can be associated. Ambiguous angles are
`null`. A sensor without a window feature reports `unknown` posture. The library
does not invent closed/flat thresholds from sensor angles.

Reserved layout geometry lives in the separate
[react-native-reserved-regions](https://github.com/appandflow/react-native-reserved-regions)
package. A hinge reading is not a division rectangle.

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

Changing iOS angles, physical hardware, multiple live roots/windows, and
multiple-hinge hardware have not yet been validated.

## Example

[Watch Field Notes on an Android emulator](https://github.com/user-attachments/assets/7f69106d-2649-4591-917c-9aa7743fd5fa): native fold geometry controls the page layout while hinge angles animate its perspective. The example includes the Worklets patch described above.

## Development

```sh
pnpm install --frozen-lockfile
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm test
pnpm run build
pnpm run docs:build
```

See [the workflow](docs/workflow.md), [agent guide](AGENTS.md),
[release process](RELEASE.md), and [website instructions](website/README.md).

## License

MIT
