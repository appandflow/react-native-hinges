import { useContext, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RootTagContext,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { createHingeObserver, useHinges } from 'react-native-hinges';
import { useAnimatedHinges } from 'react-native-hinges/reanimated';
import { useHingeTelemetry } from './useHingeTelemetry';
import { FieldNotes } from './FieldNotes';

function Playground() {
  const reactHinges = useHinges();
  const rootTag = useContext(RootTagContext);
  const observer = useMemo(() => createHingeObserver(rootTag), [rootTag]);
  const [observed, setObserved] = useState(observer.get);
  useEffect(() => {
    const off = observer.subscribe(() => setObserved(observer.get()));
    return off;
  }, [observer]);
  const hinges = useAnimatedHinges();
  const { readout, measure } = useHingeTelemetry(hinges);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [preview, setPreview] = useState(false);
  const [smooth, setSmooth] = useState(false);
  const sample = readout.sample;
  const previewAngle = useSharedValue(Math.PI / 3);
  const paneWidth = Math.min(176, (width - insets.left - insets.right - 64) / 2);

  useEffect(() => {
    if (preview && !reducedMotion) {
      previewAngle.set(Math.PI / 5);
      previewAngle.set(withRepeat(withTiming(Math.PI, { duration: 2500, easing: Easing.inOut(Easing.sin) }), -1, true));
    } else {
      cancelAnimation(previewAngle);
      previewAngle.set(Math.PI / 2);
    }
    return () => cancelAnimation(previewAngle);
  }, [preview, previewAngle, reducedMotion]);

  const visualAngle = useDerivedValue(() => {
    const raw = preview ? previewAngle.get() : (hinges.get()[0]?.angle ?? Math.PI);
    return smooth && !reducedMotion ? withTiming(raw, { duration: 150, easing: Easing.bezier(0.23, 1, 0.32, 1) }) : raw;
  });
  const leftStyle = useAnimatedStyle(() => {
    const angle = Math.max(0, Math.min(Math.PI, visualAngle.get()));
    return {
      transform: [{ perspective: 850 }, { rotateY: `${reducedMotion ? 0 : (Math.PI - angle) * 0.44}rad` }],
      backgroundColor: interpolateColor(angle, [0, Math.PI], ['#1e4057', '#416b87']),
    };
  });
  const rightStyle = useAnimatedStyle(() => {
    const angle = Math.max(0, Math.min(Math.PI, visualAngle.get()));
    return {
      transform: [{ perspective: 850 }, { rotateY: `${reducedMotion ? 0 : -(Math.PI - angle) * 0.44}rad` }],
      backgroundColor: interpolateColor(angle, [0, Math.PI], ['#243b30', '#b8ed89']),
    };
  });
  const haloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(visualAngle.get(), [0, Math.PI], [0.12, 0.5]),
    transform: [{ scale: reducedMotion ? 1 : interpolate(visualAngle.get(), [0, Math.PI], [0.75, 1.12]) }],
  }));
  const meterStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: Math.max(0.005, Math.min(1, visualAngle.get() / Math.PI)) }],
  }));
  const nativeAngle = readout.angle === null ? '—' : `${((readout.angle * 180) / Math.PI).toFixed(1)}°`;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 32,
          paddingLeft: insets.left + 24,
          paddingRight: insets.right + 24,
        },
      ]}
    >
      <View style={styles.body}>
        <View style={styles.topline}>
          <Text style={styles.eyebrow}>APP & FLOW / EXPERIMENT 01</Text>
          <Text style={styles.mark}>↗</Text>
        </View>
        <Text style={styles.title}>A little bend.{'\n'}A new perspective.</Text>
        <Text style={styles.subtitle}>Open your device. Watch the light move.</Text>
        <View style={styles.stage}>
          <Animated.View style={[styles.halo, haloStyle]} />
          <View style={styles.orbit} />
          <View style={styles.panels}>
            <Animated.View style={[styles.pane, styles.leftPane, { width: paneWidth }, leftStyle]}>
              <Text style={styles.panelLabel}>HINGE / LAB</Text>
              <View style={styles.moon}>
                <View style={styles.moonShade} />
              </View>
              <Text style={styles.panelFooter}>FORM FOLLOWS{'\n'}MOVEMENT</Text>
            </Animated.View>
            <Animated.View style={[styles.pane, styles.rightPane, { width: paneWidth }, rightStyle]}>
              <Text style={styles.darkLabel}>LIVE PERSPECTIVE</Text>
              <Text style={styles.symbol}>✳</Text>
              <Text style={styles.darkFooter}>ONE MOTION.{'\n'}TWO SIDES.</Text>
            </Animated.View>
          </View>
          <View style={styles.modePill}>
            <View style={[styles.dot, preview && styles.previewDot]} />
            <Text style={styles.modeText}>{preview ? 'SIMULATED PREVIEW' : 'NATIVE HINGE'}</Text>
          </View>
        </View>
        <View style={styles.meter}>
          <Animated.View style={[styles.meterFill, meterStyle]} />
        </View>
        <View style={styles.scale}>
          <Text style={styles.caption}>CLOSED</Text>
          <Text style={styles.caption}>FULLY OPEN</Text>
        </View>
        <View style={styles.controls}>
          <Choice label="Native" selected={!preview} onPress={() => setPreview(false)} />
          <Choice label="Preview" selected={preview} onPress={() => setPreview(true)} />
          <Choice label={smooth ? 'Smoothed' : 'Raw motion'} selected={smooth} onPress={() => setSmooth(!smooth)} />
        </View>
        <View style={styles.telemetry}>
          <View style={styles.metric}>
            <Text style={styles.caption}>NATIVE ANGLE</Text>
            <Text style={styles.value}>{nativeAngle}</Text>
            <Text style={styles.detail}>{readout.status}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.caption}>ANGLE UPDATES / S</Text>
            <Text style={styles.value}>{readout.rate.toFixed(1)}</Text>
            <Text style={styles.detail}>{readout.total} readings received</Text>
          </View>
        </View>
        <Text style={styles.detail}>
          React hook: {reactHinges[0]?.angle?.toFixed(3) ?? 'unavailable'} rad · Observer:{' '}
          {observed[0]?.angle?.toFixed(3) ?? 'unavailable'} rad
        </Text>
        <Text style={styles.note}>
          {preview
            ? 'Preview moves the artwork only. Measurements still come from the native hinge.'
            : 'Hold still to see the rate fall to zero. Move the hinge to measure the stream.'}
        </Text>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={measure} style={styles.primary}>
            <Text style={styles.primaryText}>
              {readout.remaining > 0 ? `Measuring · ${readout.remaining}s` : 'Measure for 10 seconds'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              const end = performance.now() + 1000;
              while (performance.now() < end) {
                /* Deliberately stalls JS to test Reanimated's independent UI runtime. */
              }
            }}
            style={styles.secondary}
          >
            <Text style={styles.secondaryText}>Test JS stall · 1s</Text>
          </Pressable>
        </View>
        {sample && (
          <View style={styles.result}>
            <Text style={styles.resultTitle}>{sample.updatesPerSecond.toFixed(1)} updates/s</Text>
            <Text style={styles.detail}>
              {sample.events} angle changes · {(sample.durationMs / 1000).toFixed(1)}s sample
            </Text>
            <Text style={styles.detail}>
              Mean gap {sample.meanGapMs.toFixed(1)}ms · longest {sample.maxGapMs.toFixed(1)}ms
            </Text>
          </View>
        )}
        <Text style={styles.footnote}>
          Raw radians → shared value → perspective.{'\n'}Smoothing affects the artwork, never the readings. Simulator
          rates do not establish physical-device performance.
        </Text>
      </View>
    </ScrollView>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.choice, selected && styles.choiceSelected]}
    >
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export default function App() {
  const [lab, setLab] = useState(false);
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <View style={styles.screen}>
        {lab ? (
          <>
            <Playground />
            <Pressable accessibilityRole="button" style={styles.secondary} onPress={() => setLab(false)}>
              <Text style={styles.secondaryText}>Back to Field Notes</Text>
            </Pressable>
          </>
        ) : (
          <FieldNotes onOpenLab={() => setLab(true)} />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#101819' },
  content: { flexGrow: 1 },
  body: { width: '100%', maxWidth: 620, alignSelf: 'center' },
  topline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  eyebrow: { fontSize: 10, letterSpacing: 1.7, color: '#a6b8b6', fontWeight: '600' },
  mark: { color: '#c4f496', fontSize: 28 },
  title: { fontSize: 34, lineHeight: 38, letterSpacing: -1.5, fontWeight: '600', color: '#f2f4ea' },
  subtitle: { marginTop: 12, color: '#9aaead', fontSize: 14, lineHeight: 21 },
  stage: { height: 302, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginTop: 12 },
  halo: { position: 'absolute', width: 270, height: 270, borderRadius: 135, backgroundColor: '#507264' },
  orbit: {
    position: 'absolute',
    width: 310,
    height: 180,
    borderRadius: 160,
    borderWidth: 1,
    borderColor: '#45605a',
    transform: [{ rotate: '-22deg' }],
  },
  panels: { flexDirection: 'row', alignItems: 'center' },
  pane: {
    height: 218,
    padding: 17,
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff35',
    backfaceVisibility: 'hidden',
  },
  leftPane: { borderTopLeftRadius: 18, borderBottomLeftRadius: 18, transformOrigin: 'right center' },
  rightPane: { borderTopRightRadius: 18, borderBottomRightRadius: 18, transformOrigin: 'left center' },
  panelLabel: { color: '#ecf5f1', fontSize: 9, letterSpacing: 1.6, fontWeight: '600' },
  darkLabel: { color: '#24452f', fontSize: 9, letterSpacing: 1.2, fontWeight: '600' },
  moon: {
    width: 78,
    height: 78,
    backgroundColor: '#edf4dc',
    borderRadius: 39,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  moonShade: { backgroundColor: '#598094', width: 72, height: 78, borderRadius: 39, marginLeft: 30 },
  symbol: { fontSize: 82, color: '#274732', alignSelf: 'center', lineHeight: 100 },
  panelFooter: { color: '#d7e8e6', fontSize: 11, fontWeight: '500', letterSpacing: 0.8, lineHeight: 15 },
  darkFooter: { color: '#274732', fontSize: 11, fontWeight: '600', letterSpacing: 0.8, lineHeight: 15 },
  modePill: {
    position: 'absolute',
    bottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 20,
    backgroundColor: '#1c2928',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#c4f496' },
  previewDot: { backgroundColor: '#edc278' },
  modeText: { fontSize: 9, letterSpacing: 1.4, color: '#dce6dc' },
  meter: { height: 3, backgroundColor: '#30403c', borderRadius: 2, marginTop: 20, overflow: 'hidden' },
  meterFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#c4f496',
    transformOrigin: 'left center',
  },
  scale: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  caption: { color: '#93a7a0', fontSize: 9, letterSpacing: 1.1, fontWeight: '600' },
  controls: { flexDirection: 'row', gap: 7, marginVertical: 22, flexWrap: 'wrap' },
  choice: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#3a4b45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceSelected: { backgroundColor: '#c4f496', borderColor: '#c4f496' },
  choiceText: { color: '#bfcec5', fontSize: 12, fontWeight: '600' },
  choiceTextSelected: { color: '#1c3324' },
  telemetry: { flexDirection: 'row', gap: 12 },
  metric: { flex: 1, backgroundColor: '#1a2724', borderRadius: 16, padding: 17, gap: 9 },
  value: { color: '#edf3e5', fontSize: 30, fontVariant: ['tabular-nums'], letterSpacing: -1 },
  detail: { fontSize: 11, lineHeight: 17, color: '#a9bdb1' },
  note: { fontSize: 12, lineHeight: 18, color: '#9eafa6', marginTop: 16 },
  actions: { marginTop: 20, gap: 10 },
  primary: {
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#c4f496',
    padding: 14,
  },
  primaryText: { color: '#1c3324', fontSize: 13, fontWeight: '600' },
  secondary: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a4b45',
  },
  secondaryText: { color: '#bfcec5', fontSize: 12 },
  result: { marginTop: 16, padding: 18, borderWidth: 1, borderColor: '#586d50', borderRadius: 14, gap: 6 },
  resultTitle: { color: '#c4f496', fontSize: 22, fontVariant: ['tabular-nums'] },
  footnote: { color: '#738c7c', fontSize: 11, lineHeight: 18, marginTop: 22 },
});
