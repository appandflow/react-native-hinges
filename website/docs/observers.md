---
title: Observe outside React
description: Read root-scoped snapshots and subscribe without a hook.
---

```ts
import { createHingeObserver } from 'react-native-hinges';

// Obtain this root's tag from RootTagContext or the native host.
const observer = createHingeObserver(rootTag);
const unsubscribe = observer.subscribe(() => {
  console.log(observer.get());
});
console.log(observer.get());

// Release when no longer needed.
unsubscribe();
```

Creation seeds the snapshot from the native cache; `get()` synchronously reads the JS-owned snapshot. Returned arrays and entries are immutable, and equivalent snapshots retain their identity. Before a native reading is available it returns `[]`.

`subscribe()` starts observation for the selected root. Callbacks receive no arguments; read `get()` for the current value. Multiple subscriptions on this observer share one native subscription; separate observers and animated hooks are reference-counted natively. Unsubscribing the final consumer releases native observation and clears its native cache. The observer retains its last delivered snapshot until a later subscription refreshes it.

Creating an observer or calling `get()` alone does not start native observation. Subscribe when readings must remain current. No process-wide root is selected implicitly.
