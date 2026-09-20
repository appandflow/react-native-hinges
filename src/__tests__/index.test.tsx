import * as React from 'react';
import { expect, it, jest } from '@jest/globals';
import { act, create } from 'react-test-renderer';
import { HingeProvider, createHingeObserver, useHinges, type Hinge } from '../index';
import type { HingesChangeEvent } from '../HingesViewNativeComponent';

let mockOnHingesChange: ((event: { nativeEvent: HingesChangeEvent }) => void) | undefined;
jest.mock('../HingesView', () => ({
  HingesView: ({
    children,
    onHingesChange,
  }: {
    children: React.ReactNode;
    onHingesChange: typeof mockOnHingesChange;
  }) => {
    mockOnHingesChange = onHingesChange;
    return children;
  },
}));

it('shares immutable hinge arrays with React and non-React consumers and cleans up subscriptions', async () => {
  const observer = createHingeObserver();
  const listener = jest.fn();
  const unsubscribe = observer.subscribe(listener);
  const observed: (readonly Hinge[])[] = [];
  function Probe() {
    const hinges = useHinges();
    React.useEffect(() => {
      observed.push(hinges);
    }, [hinges]);
    return null;
  }
  let renderer: ReturnType<typeof create>;
  await act(async () => {
    renderer = create(
      <HingeProvider observer={observer}>
        <Probe />
      </HingeProvider>,
    );
  });
  expect(observer.get()).toEqual([]);
  const event = {
    nativeEvent: {
      hinges: [
        { status: 'partiallyOpen', angle: Math.PI / 2, hasAngle: true },
        { status: 'fullyOpen', angle: 0, hasAngle: false },
      ],
    },
  };
  await act(async () => {
    mockOnHingesChange?.(event);
  });
  const snapshot = observer.get();
  expect(snapshot).toEqual([
    { status: 'partiallyOpen', angle: Math.PI / 2 },
    { status: 'fullyOpen', angle: null },
  ]);
  expect(observed.at(-1)).toBe(snapshot);
  expect(Object.isFrozen(snapshot)).toBe(true);
  expect(Object.isFrozen(snapshot[0])).toBe(true);
  expect(listener).toHaveBeenCalledTimes(1);
  await act(async () => {
    mockOnHingesChange?.(event);
  });
  expect(observer.get()).toBe(snapshot);
  expect(listener).toHaveBeenCalledTimes(1);
  unsubscribe();
  await act(async () => {
    renderer!.unmount();
  });
  expect(observer.get()).toEqual([]);
  expect(listener).toHaveBeenCalledTimes(1);
});

it('isolates providers and preserves unavailable or unknown native readings', async () => {
  const first = createHingeObserver();
  const second = createHingeObserver();
  let renderer: ReturnType<typeof create>;
  let other: ReturnType<typeof create>;
  await act(async () => {
    renderer = create(<HingeProvider observer={first} />);
  });
  const firstHandler = mockOnHingesChange;
  await act(async () => {
    other = create(<HingeProvider observer={second} />);
  });
  await act(async () => {
    firstHandler?.({ nativeEvent: { hinges: [{ status: 'future', angle: 0, hasAngle: false }] } });
  });
  expect(first.get()).toEqual([{ status: 'unknown', angle: null }]);
  expect(second.get()).toEqual([]);
  await act(async () => {
    firstHandler?.({ nativeEvent: { hinges: [] } });
  });
  expect(first.get()).toEqual([]);
  await act(async () => {
    renderer!.unmount();
    other!.unmount();
  });
});

it('transfers the current snapshot when the provider receives a new observer', async () => {
  const first = createHingeObserver();
  const second = createHingeObserver();
  let renderer: ReturnType<typeof create>;
  await act(async () => {
    renderer = create(<HingeProvider observer={first} />);
  });
  await act(async () => {
    mockOnHingesChange?.({
      nativeEvent: { hinges: [{ status: 'partiallyOpen', angle: Math.PI / 2, hasAngle: true }] },
    });
  });
  await act(async () => {
    renderer!.update(<HingeProvider observer={second} />);
  });
  expect(first.get()).toEqual([]);
  expect(second.get()).toEqual([{ status: 'partiallyOpen', angle: Math.PI / 2 }]);
  await act(async () => {
    renderer!.unmount();
  });
  expect(second.get()).toEqual([]);
});
