---
title: Observe outside React
description: Read hinge snapshots and subscribe without a React hook.
---

Create an observer and attach it to one `HingeProvider`. Keep the same observer instance for that provider's lifetime.

```tsx
import { createHingeObserver, HingeProvider } from 'react-native-hinges';

export const hingeObserver = createHingeObserver();

export default function App() {
  return (
    <HingeProvider observer={hingeObserver} style={{ flex: 1 }}>
      <AppContent />
    </HingeProvider>
  );
}
```

The provider owns native observation. Creating an observer alone does not attach to a device or window.

## Read and subscribe

```ts
const currentHinges = hingeObserver.get();

const unsubscribe = hingeObserver.subscribe(() => {
  const updatedHinges = hingeObserver.get();
  console.log(updatedHinges);
});
```

`get()` returns the latest immutable snapshot. Subscribe callbacks receive no arguments; call `get()` inside the callback to read the new value. Call `unsubscribe()` when the consumer no longer needs updates.

## Lifetime and scope

The snapshot starts as `[]` and is cleared when its provider unmounts. Create a separate observer for each provider. Sharing one between unrelated native hierarchies would make the source of a reading ambiguous.

When you omit the `observer` prop, the provider creates an internal observer for hook consumers. `useHinges()` uses React's `useSyncExternalStore` to read the same snapshots as the external `get()` / `subscribe()` interface.

There is no global observer. Even code outside React needs an observer connected to the intended provider.
