import * as React from 'react';
import { beforeEach, expect, it, jest } from '@jest/globals';
import { act, create } from 'react-test-renderer';
import { RootTagContext, type RootTag } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { useAnimatedHinges } from '../reanimated';
import type { Hinge } from '../index';
import type { NativeHinge } from '../NativeHinges';

jest.mock('react-native-worklets', () => ({
  createSerializable: (callback: unknown) => callback,
  getUIRuntimeHolder: () => ({}),
  getUISchedulerHolder: () => ({}),
}));
jest.mock('react-native-reanimated', () => ({
  makeMutable: <T,>(initial: T) => {
    let current = initial;
    return {
      get: () => current,
      set: (value: T) => {
        current = value;
      },
    };
  },
}));
const mockSnapshots = new Map<number, readonly NativeHinge[]>();
jest.mock('../HingesModule', () => ({
  __esModule: true,
  default: { getSnapshot: (root: number) => ({ hinges: mockSnapshots.get(root) ?? [] }) },
}));
const listeners = new Map<number, Set<(readings: readonly NativeHinge[]) => void>>();
const unsubscribe = jest.fn();
const native = [{ status: 'partiallyOpen', angle: Math.PI / 2, hasAngle: true }];
function emit(root: number, readings: readonly NativeHinge[]) {
  mockSnapshots.set(root, readings);
  listeners.get(root)?.forEach((callback) => callback(readings));
}
function tree(root: number, child: React.ReactNode) {
  return <RootTagContext.Provider value={root as unknown as RootTag}>{child}</RootTagContext.Provider>;
}
beforeEach(() => {
  listeners.clear();
  mockSnapshots.clear();
  unsubscribe.mockClear();
  globalThis.nativeHingesSubscribe = (root, _runtime, _scheduler, callback) => {
    const listener = callback as unknown as (readings: readonly NativeHinge[]) => void;
    const callbacks = listeners.get(root) ?? new Set();
    listeners.set(root, callbacks);
    callbacks.add(listener);
    listener(mockSnapshots.get(root) ?? []);
    return () => {
      callbacks.delete(listener);
      unsubscribe(root);
    };
  };
});

it('seeds the native cache and applies readings without a provider or React render', async () => {
  mockSnapshots.set(1, native);
  let value: SharedValue<readonly Hinge[]> | undefined;
  let renders = 0;
  function Consumer() {
    const hinges = useAnimatedHinges();
    React.useEffect(() => {
      value = hinges;
      renders++;
    });
    return null;
  }
  let renderer: ReturnType<typeof create>;
  await act(() => {
    renderer = create(tree(1, <Consumer />));
  });
  expect(value?.get()).toEqual([{ status: 'partiallyOpen', angle: Math.PI / 2 }]);
  const previousRenders = renders;
  emit(2, [{ status: 'closed', angle: 0, hasAngle: true }]);
  expect(value?.get()[0]?.angle).toBe(Math.PI / 2);
  emit(1, [{ status: 'future', angle: 123, hasAngle: false }]);
  expect(value?.get()).toEqual([{ status: 'unknown', angle: null }]);
  expect(renders).toBe(previousRenders);
  await act(() => renderer.unmount());
  emit(1, native);
  expect(value?.get()).toEqual([{ status: 'unknown', angle: null }]);
  expect(unsubscribe).toHaveBeenCalledWith(1);
});

it('isolates consumers and replaces the shared value when their root changes', async () => {
  let first: SharedValue<readonly Hinge[]> | undefined;
  let second: SharedValue<readonly Hinge[]> | undefined;
  function First() {
    const hinges = useAnimatedHinges();
    React.useEffect(() => {
      first = hinges;
    });
    return null;
  }
  function Second() {
    const hinges = useAnimatedHinges();
    React.useEffect(() => {
      second = hinges;
    });
    return null;
  }
  let renderer: ReturnType<typeof create>;
  const renderTree = (root: number) => (
    <>
      {tree(root, <First />)}
      {tree(2, <Second />)}
    </>
  );
  await act(() => {
    renderer = create(renderTree(1));
  });
  emit(1, native);
  expect(first?.get()).toHaveLength(1);
  expect(second?.get()).toEqual([]);
  const previous = first;
  await act(() => renderer.update(renderTree(3)));
  expect(unsubscribe).toHaveBeenCalledWith(1);
  expect(first).not.toBe(previous);
  expect(first?.get()).toEqual([]);
  emit(1, [{ status: 'closed', angle: 0, hasAngle: true }]);
  expect(first?.get()).toEqual([]);
  expect(previous?.get()[0]?.angle).toBe(Math.PI / 2);
  await act(() => renderer.unmount());
  expect(unsubscribe).toHaveBeenCalledWith(2);
  expect(unsubscribe).toHaveBeenCalledWith(3);
});

function EmptyConsumer() {
  useAnimatedHinges();
  return null;
}

it('explains when the native app needs to be rebuilt with Worklets', () => {
  globalThis.nativeHingesSubscribe = undefined;
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    expect(() =>
      act(() => {
        create(tree(1, <EmptyConsumer />));
      }),
    ).toThrow('Install react-native-worklets and rebuild the native app');
  } finally {
    error.mockRestore();
  }
});
