import * as React from 'react';
import { beforeEach, expect, it, jest } from '@jest/globals';
import { act, create } from 'react-test-renderer';
import { RootTagContext, type RootTag } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { useAnimatedHinges } from '../reanimated';
import type { Hinge } from '../index';
import NativeHinges from '../HingesModule';
import type { HingesChangeEvent } from '../NativeHinges';

const mockUIQueue: (() => void)[] = [];
const mockRNQueue: (() => void)[] = [];
jest.mock('react-native-worklets', () => ({
  scheduleOnUI: (callback: () => void) => mockUIQueue.push(callback),
  scheduleOnRN: (callback: () => void) => mockRNQueue.push(callback),
}));
function flushSetup() {
  while (mockUIQueue.length) mockUIQueue.shift()?.();
  while (mockRNQueue.length) mockRNQueue.shift()?.();
}

const mockWorklets = new Map<number, Set<(event: HingesChangeEvent) => void>>();
jest.mock('react-native-reanimated', () => {
  const react = jest.requireActual<typeof React>('react');
  return {
    useSharedValue: <T,>(initial: T) =>
      react.useMemo(() => {
        let current = initial;
        return {
          get: () => current,
          set: (value: T) => {
            current = value;
          },
        };
      }, []),
    useEvent: (handler: (event: HingesChangeEvent) => void) =>
      react.useMemo(
        () => ({
          workletEventHandler: {
            registerForEvents: (root: number) =>
              mockUIQueue.push(() => {
                const handlers = mockWorklets.get(root) ?? new Set();
                handlers.add(handler);
                mockWorklets.set(root, handlers);
              }),
            unregisterFromEvents: (root: number) =>
              mockUIQueue.push(() => {
                mockWorklets.get(root)?.delete(handler);
              }),
          },
        }),
        [],
      ),
  };
});
jest.mock('../HingesModule', () => ({
  __esModule: true,
  default: {
    getSnapshot: () => ({ hinges: [] }),
    startObserving: jest.fn((rootTag: number) => {
      for (const handler of mockWorklets.get(rootTag) ?? [])
        handler({ rootTag, hinges: [{ status: 'closed', angle: 0, hasAngle: true }] });
    }),
    stopObserving: jest.fn(),
  },
}));
beforeEach(() => {
  mockWorklets.clear();
  mockUIQueue.length = 0;
  mockRNQueue.length = 0;
  jest.clearAllMocks();
});

it('registers before acquiring native observation, isolates roots, and retains updates without React renders', async () => {
  const values = new Map<string, SharedValue<readonly Hinge[]>>();
  let renders = 0;
  function Consumer({ name }: { name: string }) {
    const hinges = useAnimatedHinges();
    React.useEffect(() => {
      values.set(name, hinges);
      renders++;
    });
    return null;
  }
  const first = <Consumer name="first" />;
  const tree = (two: boolean) => (
    <>
      <RootTagContext.Provider value={1 as unknown as RootTag}>
        {first}
        {two && <Consumer name="second" />}
      </RootTagContext.Provider>
      <RootTagContext.Provider value={2 as unknown as RootTag}>
        <Consumer name="other" />
      </RootTagContext.Provider>
    </>
  );
  let renderer: ReturnType<typeof create>;
  await act(() => {
    renderer = create(tree(true));
  });
  expect(NativeHinges.startObserving).not.toHaveBeenCalled();
  await act(flushSetup);
  expect(values.get('first')?.get()).toEqual([{ status: 'closed', angle: 0 }]);
  const previousRenders = renders;
  for (const handler of mockWorklets.get(1) ?? [])
    handler({ rootTag: 1, hinges: [{ status: 'future', angle: 123, hasAngle: false }] });
  expect(values.get('first')?.get()).toEqual([{ status: 'unknown', angle: null }]);
  expect(values.get('second')?.get()).toEqual([{ status: 'unknown', angle: null }]);
  expect(values.get('other')?.get()).toEqual([{ status: 'closed', angle: 0 }]);
  expect(renders).toBe(previousRenders);
  await act(() => renderer.update(tree(false)));
  await act(flushSetup);
  expect(mockWorklets.get(1)?.size).toBe(1);
  expect(NativeHinges.stopObserving).toHaveBeenCalledWith(1);
  await act(() => renderer.unmount());
  await act(flushSetup);
  expect(mockWorklets.get(1)?.size).toBe(0);
  expect(mockWorklets.get(2)?.size).toBe(0);
  expect(values.get('first')?.get()).toEqual([{ status: 'unknown', angle: null }]);
});

function SetupConsumer() {
  useAnimatedHinges();
  return null;
}

it('throws a clear error when useAnimatedHinges renders without a RootTagContext provider', () => {
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    expect(() =>
      act(() => {
        create(<SetupConsumer />);
      }),
    ).toThrow(
      'useAnimatedHinges must render inside a React Native root: RootTagContext is 0 (or invalid). ' +
        'In tests, wrap the tree in <RootTagContext.Provider value={1}> (cast as RootTag if needed in TS).',
    );
  } finally {
    error.mockRestore();
  }
});

it('does not acquire observation if unmounted before the UI registration acknowledgment', async () => {
  let renderer: ReturnType<typeof create>;
  await act(() => {
    renderer = create(
      <RootTagContext.Provider value={1 as unknown as RootTag}>
        <SetupConsumer />
      </RootTagContext.Provider>,
    );
  });
  await act(() => renderer.unmount());
  await act(flushSetup);
  expect(NativeHinges.startObserving).not.toHaveBeenCalled();
  expect(NativeHinges.stopObserving).not.toHaveBeenCalled();
  expect(mockWorklets.get(1)?.size).toBe(0);
});
