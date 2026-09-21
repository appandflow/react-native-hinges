import * as React from 'react';
import { beforeEach, expect, it, jest } from '@jest/globals';
import { act, create } from 'react-test-renderer';
import type { SharedValue } from 'react-native-reanimated';
import { AnimatedHingesProvider, useAnimatedHinges } from '../reanimated';
import type { Hinge } from '../index';
import { Commands, type HingesObserverChangeEvent } from '../HingesObserverViewNativeComponent';

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

const mockWorkletHandlers = new Set<(event: HingesObserverChangeEvent) => void>();
jest.mock('react-native-reanimated', () => {
  const react = jest.requireActual<typeof React>('react');
  return {
    __esModule: true,
    createAnimatedComponent: (component: unknown) => component,
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
    useEvent: (handler: (event: HingesObserverChangeEvent) => void) =>
      react.useMemo(() => {
        mockWorkletHandlers.add(handler);
        return handler;
      }, []),
  };
});
jest.mock('../HingesModule', () => ({ __esModule: true, default: {} }));
jest.mock('../HingesObserverViewNativeComponent', () => ({
  __esModule: true,
  default: 'HingesObserverView',
  Commands: { refresh: jest.fn() },
}));

const mockNativeView = { id: 'hinges-observer-view' };
function render(element: React.ReactElement) {
  return create(element, { createNodeMock: () => mockNativeView });
}
function emit(hinges: HingesObserverChangeEvent['hinges']) {
  for (const handler of mockWorkletHandlers) handler({ hinges });
}

beforeEach(() => {
  mockWorkletHandlers.clear();
  mockUIQueue.length = 0;
  mockRNQueue.length = 0;
  jest.clearAllMocks();
});

it('seeds an empty shared value, then updates it from native events without a React render', async () => {
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
  await act(() => {
    render(
      <AnimatedHingesProvider>
        <Consumer />
      </AnimatedHingesProvider>,
    );
  });
  expect(value?.get()).toEqual([]);

  const previousRenders = renders;
  emit([{ status: 'partiallyOpen', angle: Math.PI / 2, hasAngle: true }]);
  expect(value?.get()).toEqual([{ status: 'partiallyOpen', angle: Math.PI / 2 }]);
  emit([{ status: 'future', angle: 123, hasAngle: false }]);
  expect(value?.get()).toEqual([{ status: 'unknown', angle: null }]);
  expect(renders).toBe(previousRenders);
});

it('requests the current snapshot only after the worklet registration hop', async () => {
  await act(() => {
    render(<AnimatedHingesProvider />);
  });
  expect(Commands.refresh).not.toHaveBeenCalled();
  await act(flushSetup);
  expect(Commands.refresh).toHaveBeenCalledWith(mockNativeView);
});

it('does not request a snapshot when unmounted before the hop completes', async () => {
  let renderer: ReturnType<typeof create>;
  await act(() => {
    renderer = render(<AnimatedHingesProvider />);
  });
  await act(() => renderer.unmount());
  await act(flushSetup);
  expect(Commands.refresh).not.toHaveBeenCalled();
});

function OrphanConsumer() {
  useAnimatedHinges();
  return null;
}

it('throws a clear error when useAnimatedHinges renders outside the provider', () => {
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    expect(() =>
      act(() => {
        render(<OrphanConsumer />);
      }),
    ).toThrow(
      'useAnimatedHinges must render inside an AnimatedHingesProvider from react-native-hinges/reanimated. ' +
        'Wrap the tree in <AnimatedHingesProvider> at or above this component.',
    );
  } finally {
    error.mockRestore();
  }
});
