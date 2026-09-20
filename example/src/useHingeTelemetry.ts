import { useCallback, useState } from 'react';
import { useAnimatedReaction, useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import type { Hinge, HingeStatus } from 'react-native-hinges';

type Sample = { events: number; durationMs: number; updatesPerSecond: number; meanGapMs: number; maxGapMs: number };
type Readout = {
  angle: number | null;
  status: HingeStatus;
  rate: number;
  total: number;
  remaining: number;
  sample: Sample | null;
};

export function useHingeTelemetry(hinges: SharedValue<readonly Hinge[]>) {
  const [readout, setReadout] = useState<Readout>({
    angle: null,
    status: 'unknown',
    rate: 0,
    total: 0,
    remaining: 0,
    sample: null,
  });
  const counters = useSharedValue({
    total: 0,
    bucket: 0,
    bucketStart: 0,
    sampleStart: 0,
    count: 0,
    first: 0,
    last: 0,
    maxGap: 0,
  });
  const publish = useCallback((value: Readout, finished: boolean) => {
    setReadout((previous) => ({ ...value, sample: value.sample ?? previous.sample }));
    if (finished) console.info('HINGE_BENCHMARK', JSON.stringify(value.sample));
  }, []);

  useAnimatedReaction(
    () => hinges.get(),
    (current, previous) => {
      const angle = current[0]?.angle;
      if (angle == null || angle === previous?.[0]?.angle) return;
      const now = performance.now();
      const c = counters.get();
      const sampling = c.sampleStart > 0;
      counters.set({
        ...c,
        total: c.total + 1,
        bucket: c.bucket + 1,
        count: sampling ? c.count + 1 : c.count,
        first: sampling && c.count === 0 ? now : c.first,
        last: sampling ? now : c.last,
        maxGap: sampling && c.count > 0 ? Math.max(c.maxGap, now - c.last) : c.maxGap,
      });
    },
  );

  useFrameCallback(() => {
    const now = performance.now();
    const c = counters.get();
    if (c.bucketStart === 0) {
      counters.set({ ...c, bucketStart: now });
      return;
    }
    const elapsed = now - c.bucketStart;
    if (elapsed < 1000) return;
    const finished = c.sampleStart > 0 && now - c.sampleStart >= 10000;
    const duration = now - c.sampleStart;
    const hinge = hinges.get()[0];
    const sample = finished
      ? {
          events: c.count,
          durationMs: duration,
          updatesPerSecond: (c.count * 1000) / duration,
          meanGapMs: c.count > 1 ? (c.last - c.first) / (c.count - 1) : 0,
          maxGapMs: c.maxGap,
        }
      : null;
    scheduleOnRN(
      publish,
      {
        angle: hinge?.angle ?? null,
        status: hinge?.status ?? 'unknown',
        rate: (c.bucket * 1000) / elapsed,
        total: c.total,
        remaining: c.sampleStart > 0 && !finished ? Math.max(0, Math.ceil((10000 - duration) / 1000)) : 0,
        sample,
      },
      finished,
    );
    counters.set({ ...c, bucket: 0, bucketStart: now, sampleStart: finished ? 0 : c.sampleStart });
  });

  const measure = () => {
    scheduleOnUI(() => {
      counters.set({ ...counters.get(), sampleStart: performance.now(), count: 0, first: 0, last: 0, maxGap: 0 });
    });
  };
  return { readout, measure };
}
