import * as React from 'react';
import { expect, it, jest } from '@jest/globals';
import { act, create } from 'react-test-renderer';
import type { SharedValue } from 'react-native-reanimated';
import { createHingeObserver, useHinges, type Hinge, type HingeProviderProps } from '../index';
import { AnimatedHingeProvider, useAnimatedHinges } from '../reanimated';
import type { HingesChangeEvent } from '../HingesViewNativeComponent';

const mockWorklets = new Map<string, (event: HingesChangeEvent) => void>();
const mockJSListeners = new Map<string, (event: { nativeEvent: HingesChangeEvent }) => void>();

jest.mock('react-native-reanimated', () => {
  const mockReact = jest.requireActual<typeof import('react')>('react');
  return {
    useSharedValue: <T,>(initial: T) => {
      const [shared] = mockReact.useState(() => {
        let value = initial;
        return {
          get: () => value,
          set: (next: T) => {
            value = next;
          },
        };
      });
      return shared;
    },
    useEvent: (handler: (event: HingesChangeEvent) => void) => mockReact.useRef(handler).current,
    createAnimatedComponent: (Component: React.ComponentType<HingeProviderProps>) =>
      function AnimatedComponent({
        onHingesChange,
        ...props
      }: HingeProviderProps & {
        onHingesChange: (event: HingesChangeEvent) => void;
      }) {
        mockReact.useLayoutEffect(() => {
          mockWorklets.set(props.testID!, onHingesChange);
          return () => {
            mockWorklets.delete(props.testID!);
          };
        }, [props.testID, onHingesChange]);
        return <Component {...props} />;
      },
  };
});

jest.mock('../HingesView', () => {
  const mockReact = jest.requireActual<typeof import('react')>('react');
  return {
    HingesView: ({
      children,
      testID,
      onHingesChange,
    }: HingeProviderProps & {
      onHingesChange: (event: { nativeEvent: HingesChangeEvent }) => void;
    }) => {
      mockReact.useLayoutEffect(() => {
        mockJSListeners.set(testID!, onHingesChange);
        return () => {
          mockJSListeners.delete(testID!);
        };
      }, [testID, onHingesChange]);
      return children;
    },
  };
});

async function emit(testID: string, hinges: HingesChangeEvent['hinges']) {
  await act(async () => {
    mockWorklets.get(testID)!({ hinges });
    mockJSListeners.get(testID)!({ nativeEvent: { hinges } });
  });
}

it('maps native events identically for worklets, React hooks and non-React observers without rendering animated consumers', async () => {
  const observer = createHingeObserver();
  let shared: SharedValue<readonly Hinge[]>;
  let reactSnapshot: readonly Hinge[] = [];
  let animatedRenders = 0;
  function AnimatedProbe() {
    const hinges = useAnimatedHinges();
    React.useLayoutEffect(() => {
      shared = hinges;
      animatedRenders++;
    });
    return null;
  }
  function ReactProbe() {
    const hinges = useHinges();
    React.useLayoutEffect(() => {
      reactSnapshot = hinges;
    }, [hinges]);
    return null;
  }
  let renderer: ReturnType<typeof create>;
  await act(async () => {
    renderer = create(
      <AnimatedHingeProvider testID="mapping" observer={observer}>
        <AnimatedProbe />
        <ReactProbe />
      </AnimatedHingeProvider>,
    );
  });
  expect(shared!.get()).toEqual([]);
  expect(observer.get()).toEqual([]);
  const initialRenders = animatedRenders;
  const nativeHinges = [
    { status: 'closed', angle: 0, hasAngle: true },
    { status: 'partiallyOpen', angle: Math.PI / 2, hasAngle: true },
    { status: 'fullyOpen', angle: Math.PI, hasAngle: true },
    { status: 'future', angle: 123, hasAngle: false },
  ];
  await emit('mapping', nativeHinges);
  expect(shared!.get()).toEqual([
    { status: 'closed', angle: 0 },
    { status: 'partiallyOpen', angle: Math.PI / 2 },
    { status: 'fullyOpen', angle: Math.PI },
    { status: 'unknown', angle: null },
  ]);
  expect(shared!.get()).toEqual(observer.get());
  expect(reactSnapshot).toBe(observer.get());
  expect(animatedRenders).toBe(initialRenders);
  await emit('mapping', []);
  expect(shared!.get()).toEqual([]);
  expect(reactSnapshot).toEqual([]);
  await emit('mapping', nativeHinges);
  await act(async () => {
    renderer!.unmount();
  });
  expect(observer.get()).toEqual([]);
});

it('keeps nested and independent animated snapshots separate across rerenders and observer replacement', async () => {
  const firstObserver = createHingeObserver();
  const nextObserver = createHingeObserver();
  const innerObserver = createHingeObserver();
  const values = new Map<string, SharedValue<readonly Hinge[]>>();
  function Probe({ name }: { name: string }) {
    const hinges = useAnimatedHinges();
    React.useLayoutEffect(() => {
      values.set(name, hinges);
    }, [name, hinges]);
    return null;
  }
  function Tree({ replace = false }: { replace?: boolean }) {
    return (
      <>
        <AnimatedHingeProvider testID="outer" observer={replace ? nextObserver : firstObserver}>
          <Probe name="outer" />
          <AnimatedHingeProvider testID="inner" observer={innerObserver}>
            <Probe name="inner" />
          </AnimatedHingeProvider>
        </AnimatedHingeProvider>
        <AnimatedHingeProvider testID="independent">
          <Probe name="independent" />
        </AnimatedHingeProvider>
      </>
    );
  }
  let renderer: ReturnType<typeof create>;
  await act(async () => {
    renderer = create(<Tree />);
  });
  const outer = values.get('outer')!;
  const inner = values.get('inner')!;
  const independent = values.get('independent')!;
  expect(outer).not.toBe(inner);
  expect(independent).not.toBe(outer);
  await emit('outer', [{ status: 'fullyOpen', angle: Math.PI, hasAngle: true }]);
  expect(outer.get()).toEqual(firstObserver.get());
  expect(inner.get()).toEqual([]);
  expect(independent.get()).toEqual([]);
  await emit('inner', [{ status: 'partiallyOpen', angle: 1, hasAngle: true }]);
  expect(inner.get()).toEqual(innerObserver.get());
  expect(outer.get()).toEqual([{ status: 'fullyOpen', angle: Math.PI }]);
  await act(async () => {
    renderer!.update(<Tree replace />);
  });
  expect(values.get('outer')).toBe(outer);
  expect(values.get('inner')).toBe(inner);
  expect(firstObserver.get()).toEqual([]);
  expect(nextObserver.get()).toEqual(outer.get());
  await emit('outer', [{ status: 'closed', angle: 0, hasAngle: true }]);
  expect(outer.get()).toEqual([{ status: 'closed', angle: 0 }]);
  expect(nextObserver.get()).toEqual(outer.get());
  expect(inner.get()).toEqual([{ status: 'partiallyOpen', angle: 1 }]);
  expect(independent.get()).toEqual([]);
  await act(async () => {
    renderer!.unmount();
  });
  expect(nextObserver.get()).toEqual([]);
  expect(innerObserver.get()).toEqual([]);
});
