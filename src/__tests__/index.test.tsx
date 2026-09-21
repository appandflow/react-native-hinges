import { useEffect } from 'react';
import { beforeEach, expect, it, jest } from '@jest/globals';
import { act, create } from 'react-test-renderer';
import { RootTagContext, type RootTag } from 'react-native';
import { createHingeObserver, useHinges, type Hinge } from '../index';
import NativeHinges from '../HingesModule';
import type { HingesChangeEvent, NativeHinge } from '../NativeHinges';

jest.mock('react-native-reanimated', () => {
  throw new Error('Core must not load Reanimated');
});
jest.mock('react-native-worklets', () => {
  throw new Error('Core must not load Worklets');
});
const mockSnapshots = new Map<number, readonly NativeHinge[]>();
const mockListeners = new Set<(event: HingesChangeEvent) => void>();
jest.mock('../HingesModule', () => ({
  __esModule: true,
  default: {
    getSnapshot: jest.fn((root: number) => ({ hinges: mockSnapshots.get(root) ?? [] })),
    startObserving: jest.fn(),
    stopObserving: jest.fn(),
    onHingesChange: jest.fn((listener: (event: HingesChangeEvent) => void) => {
      mockListeners.add(listener);
      return { remove: () => mockListeners.delete(listener) };
    }),
  },
}));
const native = [{ status: 'partiallyOpen', angle: Math.PI / 2, hasAngle: true }];
function emit(rootTag: number, hinges: readonly NativeHinge[]) {
  mockSnapshots.set(rootTag, hinges);
  for (const listener of mockListeners) listener({ rootTag, hinges });
}
beforeEach(() => {
  mockSnapshots.clear();
  mockListeners.clear();
  jest.clearAllMocks();
});

it('reads cached initial state without starting observation and preserves immutable snapshot identity', () => {
  mockSnapshots.set(1, native);
  const observer = createHingeObserver(1);
  const snapshot = observer.get();
  expect(snapshot).toEqual([{ status: 'partiallyOpen', angle: Math.PI / 2 }]);
  expect(observer.get()).toBe(snapshot);
  expect(Object.isFrozen(snapshot)).toBe(true);
  expect(Object.isFrozen(snapshot[0])).toBe(true);
  expect(NativeHinges.startObserving).not.toHaveBeenCalled();
});

it('isolates roots, shares one observation across subscriptions, and releases only the final subscription', () => {
  const observer = createHingeObserver(1);
  const first = jest.fn();
  const second = jest.fn();
  const offFirst = observer.subscribe(first);
  const offSecond = observer.subscribe(second);
  expect(NativeHinges.startObserving).toHaveBeenCalledTimes(1);
  emit(2, native);
  expect(first).not.toHaveBeenCalled();
  emit(1, native);
  expect(first).toHaveBeenCalledTimes(1);
  emit(1, native);
  expect(first).toHaveBeenCalledTimes(1);
  offFirst();
  offFirst();
  expect(NativeHinges.stopObserving).not.toHaveBeenCalled();
  emit(1, [{ status: 'future', angle: 99, hasAngle: false }]);
  expect(observer.get()).toEqual([{ status: 'unknown', angle: null }]);
  expect(second).toHaveBeenCalledTimes(2);
  offSecond();
  expect(NativeHinges.stopObserving).toHaveBeenCalledWith(1);
  expect(mockListeners.size).toBe(0);
});

it('does not replace a newer cached snapshot with a queued older event', () => {
  const observer = createHingeObserver(1);
  const off = observer.subscribe(jest.fn());
  emit(1, native);
  const snapshot = observer.get();
  for (const listener of mockListeners) listener({ rootTag: 1, hinges: [] });
  expect(observer.get()).toBe(snapshot);
  off();
});

it('hooks work without a provider, follow root changes, and stop on unmount', async () => {
  let latest: readonly Hinge[] = [];
  function Consumer() {
    const hinges = useHinges();
    useEffect(() => {
      latest = hinges;
    });
    return null;
  }
  const child = <Consumer />;
  const tree = (root: number) => (
    <RootTagContext.Provider value={root as unknown as RootTag}>{child}</RootTagContext.Provider>
  );
  mockSnapshots.set(1, native);
  let renderer: ReturnType<typeof create>;
  await act(() => {
    renderer = create(tree(1));
  });
  expect(latest).toEqual([{ status: 'partiallyOpen', angle: Math.PI / 2 }]);
  await act(() => emit(1, [{ status: 'closed', angle: 0, hasAngle: true }]));
  expect(latest[0]?.status).toBe('closed');
  await act(() => {
    renderer.update(tree(2));
  });
  expect(latest).toEqual([]);
  expect(NativeHinges.stopObserving).toHaveBeenCalledWith(1);
  expect(NativeHinges.startObserving).toHaveBeenCalledWith(2);
  await act(() => renderer.unmount());
  expect(NativeHinges.stopObserving).toHaveBeenCalledWith(2);
});

it('keeps React snapshots stable until notification even if the native cache advances', () => {
  const observer = createHingeObserver(1);
  const listener = jest.fn();
  const off = observer.subscribe(listener);
  const snapshot = observer.get();
  mockSnapshots.set(1, native);
  expect(observer.get()).toBe(snapshot);
  for (const callback of mockListeners) callback({ rootTag: 1, hinges: native });
  expect(listener).toHaveBeenCalledTimes(1);
  expect(observer.get()).toEqual([{ status: 'partiallyOpen', angle: Math.PI / 2 }]);
  for (const callback of mockListeners) callback({ rootTag: 1, hinges: native });
  expect(listener).toHaveBeenCalledTimes(1);
  off();
});

function NoRootConsumer() {
  useHinges();
  return null;
}

it('throws a clear error when useHinges renders without a RootTagContext provider', () => {
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    expect(() =>
      act(() => {
        create(<NoRootConsumer />);
      }),
    ).toThrow(
      'useHinges must render inside a React Native root: RootTagContext is 0 (or invalid). ' +
        'In tests, wrap the tree in <RootTagContext.Provider value={1}> (cast as RootTag if needed in TS).',
    );
  } finally {
    error.mockRestore();
  }
});

it('refreshes state that changed between observer creation and subscription', () => {
  const observer = createHingeObserver(1);
  expect(observer.get()).toEqual([]);
  mockSnapshots.set(1, native);
  const listener = jest.fn();
  const off = observer.subscribe(listener);
  expect(observer.get()).toEqual([{ status: 'partiallyOpen', angle: Math.PI / 2 }]);
  expect(listener).toHaveBeenCalledTimes(1);
  off();
});
