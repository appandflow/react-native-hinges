# react-native-hinges

Hinge posture and angle observations for React Native's New Architecture.

`0.1.0-alpha.0` is a name-reservation placeholder. The API below is under
development in this repository; it is not implemented by that npm release.

## Requirements

- React Native New Architecture (Fabric); example uses 0.88.0-rc.1.
- iOS 27.1 SDK and runtime for UIKit hinge observations. SDK compile guards allow
  older SDK builds, but those builds return no hinges even on newer devices.
- Android API 24 or newer with a Jetpack WindowManager-supported folding device.
  Angle readings require an available hinge-angle sensor on API 30 or newer.

## React usage

```tsx
import { HingeProvider, useHinges } from 'react-native-hinges';

function Screen() {
  const hinges = useHinges();
  return null;
}

export default function App() {
  return (
    <HingeProvider style={{ flex: 1 }}>
      <Screen />
    </HingeProvider>
  );
}
```

Each hinge has `status: 'unknown' | 'closed' | 'partiallyOpen' | 'fullyOpen'` and
`angle: number | null` in radians. An empty array means no readings are available
(including before initialization). Array order is not a persistent identity.

## Why a provider?

The combined API needs a native observation scope. Apple's `UIHingeInteraction`
attaches to a view and reports the hinge associated with its hierarchy. Android
WindowManager reports folding posture for an Activity window, while Android's
hinge-angle sensor is a device-level source. The provider combines those sources
for the intended app hierarchy; the sensor alone cannot supply every field.

The provider's size and position do not clip hinge state or change angle units.
This is different from reserved-region rectangles, whose coordinates depend on
provider bounds. Place `HingeProvider` where the relevant hierarchy is available;
use an explicit observer when code outside React needs the same readings.

## Outside React

```tsx
import { createHingeObserver, HingeProvider } from 'react-native-hinges';

const observer = createHingeObserver();
const unsubscribe = observer.subscribe(() => console.log(observer.get()));
// Mount once: <HingeProvider observer={observer}>...</HingeProvider>
// When your subscription is no longer needed:
unsubscribe();
```

The mounted provider connects the observer to a native hierarchy. `get()` and
`subscribe()` can be used outside React; there is no implicit global window.
Use one observer per provider. Unmounting the provider clears its snapshot.

## Reanimated

The optional `react-native-hinges/reanimated` entry point requires Reanimated
`^4.7.0` and Worklets `^0.13.0`. The example uses `4.7.0` and `0.13.0`. Configure
the Worklets Babel plugin and rebuild native dependencies using
[Reanimated's setup guide](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/).

```tsx
import { AnimatedHingeProvider, useAnimatedHinges } from 'react-native-hinges/reanimated';
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

Use `AnimatedHingeProvider` instead of `HingeProvider` for this hierarchy.
The ordinary hook and `observer` prop still work. The animated hook returns a
read-only-by-contract `SharedValue<readonly Hinge[]>`, initially `[]`; read it
inside worklets and do not write to it. It preserves raw radians and nullable
angles. The library adds no smoothing or sampling-frequency guarantee.

Reanimated removes the event handler on provider unmount, but an externally
retained shared value currently keeps its last snapshot. The ordinary observer
is cleared independently. See the [integration guide](website/docs/reanimated.md)
for a complete example and current validation limits. These APIs are not present
in the npm placeholder.

## Native behavior

Apple's `UIHingeInteraction` reports zero or one hinge for its view hierarchy.
The provider's bounds do not clip the readings. On Android, each WindowManager
folding feature contributes a posture; an angle is attached only when exactly
one sensor and at most one feature can be associated. Ambiguous angles are
`null`. A sensor without a window feature reports `unknown` posture. The library
does not invent closed/flat thresholds from sensor angles.

Reserved layout geometry lives in the separate
[react-native-reserved-regions](https://github.com/appandflow/react-native-reserved-regions)
package. A hinge reading is not a division rectangle.

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
