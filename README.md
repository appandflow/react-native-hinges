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
