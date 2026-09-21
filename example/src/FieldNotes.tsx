import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReservedRegionsProvider, useReservedRegions, useReservedRegionsReady } from 'react-native-reserved-regions';
import { useHinges } from 'react-native-hinges';
import { useAnimatedHinges } from 'react-native-hinges/reanimated';
import Animated, {
  cancelAnimation,
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export function FieldNotes({ onOpenLab }: { onOpenLab: () => void }) {
  const [viewportWidth, setViewportWidth] = useState(0);
  return (
    <ReservedRegionsProvider
      style={styles.screen}
      onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
    >
      <StatusBar hidden />
      <FieldNotesContent viewportWidth={viewportWidth} onOpenLab={onOpenLab} />
    </ReservedRegionsProvider>
  );
}

function FieldNotesContent({ viewportWidth, onOpenLab }: { viewportWidth: number; onOpenLab: () => void }) {
  const insets = useSafeAreaInsets();
  const regions = useReservedRegions();
  const ready = useReservedRegionsReady();
  const occlusions = regions.filter((region) => region.kind === 'occlusion');
  const headerHeight = Math.max(64, insets.top + 16);
  let spaces = [{ start: 24, end: viewportWidth - 24 }];
  for (const { frame } of occlusions) {
    if (frame.y >= headerHeight || frame.y + frame.height <= 0) continue;
    spaces = spaces.flatMap((space) => {
      if (frame.x - 12 >= space.end || frame.x + frame.width + 12 <= space.start) return [space];
      return [
        { start: space.start, end: Math.max(space.start, frame.x - 12) },
        { start: Math.min(space.end, frame.x + frame.width + 12), end: space.end },
      ];
    });
  }
  const header = spaces.reduce((largest, space) =>
    space.end - space.start > largest.end - largest.start ? space : largest,
  );
  const [preview, setPreview] = useState(false);
  const [width, setWidth] = useState(0);
  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{
          paddingTop: headerHeight + 28,
          paddingBottom: insets.bottom + 24,
          paddingLeft: insets.left + 24,
          paddingRight: insets.right + 24,
          gap: 24,
        }}
      >
        <Text style={styles.edition}>VOL. 01 / THE OUTDOORS</Text>
        <View>
          <Text style={styles.heading}>Room to wander.</Text>
          <Text style={styles.subtitle}>A small journal for a wider world.</Text>
          {ready && occlusions.length > 0 && (
            <Text style={styles.occlusionCaption}>RESERVED SPACE · CONTROLS CLEAR</Text>
          )}
        </View>
        <ReservedRegionsProvider onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={styles.spread}>
          <Spread width={width} preview={preview} />
        </ReservedRegionsProvider>
        <HingeReadout preview={preview} />
        <Text style={styles.description}>
          Open a little. Let the light in. Your journal follows the fold, with room for every word.
        </Text>
        <View style={styles.row}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: preview }}
            style={styles.button}
            onPress={() => setPreview(!preview)}
          >
            <Text style={styles.buttonText}>{preview ? 'Use native angle' : 'Preview motion'} ↗</Text>
          </Pressable>
        </View>
        <Text style={styles.credit}>react-native-hinges + react-native-reserved-regions</Text>
      </ScrollView>
      {ready && header.end > header.start && (
        <View style={[styles.header, { left: header.start, width: header.end - header.start, height: headerHeight }]}>
          {header.end - header.start >= 240 && <Text style={styles.brand}>FIELD NOTES</Text>}
          <Pressable accessibilityRole="button" style={styles.labButton} onPress={onOpenLab}>
            <Text numberOfLines={1} style={styles.labText}>
              Sensor lab ↗
            </Text>
          </Pressable>
        </View>
      )}
      {occlusions.map(({ frame }, index) => (
        <View
          key={index}
          pointerEvents="none"
          accessible
          accessibilityLabel={`Native occlusion bounds: x ${frame.x}, y ${frame.y}, width ${frame.width}, height ${frame.height}`}
          style={[styles.occlusionOutline, { left: frame.x, top: frame.y, width: frame.width, height: frame.height }]}
        />
      ))}
    </>
  );
}

function HingeReadout({ preview }: { preview: boolean }) {
  const hinge = useHinges()[0];
  const nativeAngle = hinge?.angle;
  return (
    <View style={styles.row}>
      <View style={styles.badge}>
        <View style={[styles.dot, !hinge && styles.unavailableDot, preview && styles.previewDot]} />
        <Text style={styles.badgeText}>
          {preview ? 'SIMULATED ANGLE' : hinge ? 'NATIVE HINGE' : 'NO HINGE READING'}
        </Text>
      </View>
      <Text style={styles.volume}>
        {nativeAngle == null ? 'NATIVE ANGLE UNAVAILABLE' : `NATIVE ${((nativeAngle * 180) / Math.PI).toFixed(1)}°`}
      </Text>
    </View>
  );
}

function Spread({ width, preview }: { width: number; preview: boolean }) {
  const regions = useReservedRegions();
  const regionsReady = useReservedRegionsReady();
  const hinges = useAnimatedHinges();
  const reducedMotion = useReducedMotion();
  const previewAngle = useSharedValue(Math.PI);
  const division = regions.find(
    (region) =>
      region.kind === 'division' &&
      region.frame.height > region.frame.width &&
      region.frame.x > 0 &&
      region.frame.x + region.frame.width < width,
  );
  const seam = division?.frame;
  const leftWidth = Math.max(0, (seam?.x ?? width / 2) - (seam ? 12 : 2));
  const rightX = seam ? seam.x + seam.width + 12 : width / 2 + 2;

  useEffect(() => {
    if (preview && !reducedMotion) {
      previewAngle.set(Math.PI / 3);
      previewAngle.set(withRepeat(withTiming(Math.PI, { duration: 2400, easing: Easing.inOut(Easing.sin) }), -1, true));
    } else {
      cancelAnimation(previewAngle);
      previewAngle.set(Math.PI);
    }
    return () => cancelAnimation(previewAngle);
  }, [preview, previewAngle, reducedMotion]);
  const angle = useDerivedValue(() =>
    Math.max(0, Math.min(Math.PI, preview ? previewAngle.get() : (hinges.get()[0]?.angle ?? Math.PI))),
  );
  const landscapeStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(angle.get(), [0, Math.PI], ['#384c59', '#abc9ba']),
  }));
  const journalStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(angle.get(), [0, Math.PI], ['#b2ac92', '#f2ebd7']),
  }));
  const detailsStyle = useAnimatedStyle(() => {
    const opacity = Math.max(0, Math.min(1, (angle.get() - Math.PI / 3) / (Math.PI / 3)));
    return { opacity, transform: [{ translateY: reducedMotion ? 0 : (1 - opacity) * 20 }] };
  });
  const sunStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: reducedMotion ? 0 : (1 - angle.get() / Math.PI) * 50 }],
    opacity: 0.45 + (angle.get() / Math.PI) * 0.55,
  }));
  return (
    <>
      {width > 0 && regionsReady && (
        <>
          {seam && (
            <View pointerEvents="none" style={styles.divisionGuide}>
              <View
                style={[
                  styles.divisionMarker,
                  {
                    left: seam.x,
                    top: seam.y,
                    width: Math.max(StyleSheet.hairlineWidth, seam.width),
                    height: seam.height,
                  },
                ]}
              />
            </View>
          )}
          <Animated.View style={[styles.page, styles.landscape, { width: leftWidth }, landscapeStyle]}>
            <Text style={styles.pageLabel}>A PLACE TO EXHALE</Text>
            <Animated.View style={[styles.sun, sunStyle]} />
            <View style={styles.mountainFar} />
            <View style={styles.mountainNear} />
            <View style={styles.lake} />
            <View style={styles.landscapeFooter}>
              <Text style={styles.destination}>Into{'\n'}the quiet.</Text>
              <Text style={styles.location}>SAGUENAY / QUÉBEC</Text>
            </View>
          </Animated.View>
          <Animated.View style={[styles.page, { left: rightX, width: Math.max(0, width - rightX) }, journalStyle]}>
            <Text style={styles.journalLabel}>THE WEEKEND EDIT</Text>
            <Text style={styles.number}>01</Text>
            <Text style={styles.journalTitle}>Take the{'\n'}long way.</Text>
            <Animated.View style={detailsStyle}>
              <View style={styles.rule} />
              <Text style={styles.journalBody}>Pine air. Still water. No particular hurry.</Text>
            </Animated.View>
            <Animated.View style={[styles.journalFooter, detailsStyle]}>
              <Text style={styles.journalLabel}>WALK / PAUSE / REPEAT</Text>
              <Text style={styles.arrow}>↗</Text>
            </Animated.View>
          </Animated.View>
        </>
      )}
      <View style={styles.regionCaption}>
        <Text style={styles.regionText}>
          {!regionsReady
            ? 'MEASURING REGIONS'
            : division
              ? 'TWO PAGES · NATIVE FOLD'
              : 'REGIONS READY · NO PAGE DIVISION'}
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#172521' },
  header: {
    position: 'absolute',
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#172521',
  },
  occlusionOutline: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#edc278',
    backgroundColor: '#edc27815',
    boxShadow: '0 0 18px #edc27880',
  },
  occlusionCaption: { color: '#edc278', fontSize: 8, letterSpacing: 1.5, marginTop: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  brand: { color: '#e9eddb', fontSize: 12, letterSpacing: 3, fontWeight: '700' },
  edition: { color: '#829c8d', fontSize: 8, letterSpacing: 1.2 },
  heading: { color: '#eef0e3', fontSize: 37, fontWeight: '500', letterSpacing: -1.8 },
  subtitle: { color: '#a6b7a6', fontSize: 13, lineHeight: 20, marginTop: 8 },
  spread: { height: 376, marginTop: 16 },
  divisionGuide: { position: 'absolute', left: 0, right: 0, top: 0, height: 344, overflow: 'hidden' },
  divisionMarker: { position: 'absolute', backgroundColor: '#c3e1a0', opacity: 0.35 },
  page: { position: 'absolute', top: 0, height: 344, overflow: 'hidden', borderRadius: 12, padding: 17 },
  landscape: { left: 0 },
  pageLabel: { fontSize: 8, letterSpacing: 1.1, color: '#274638', zIndex: 2, fontWeight: '700' },
  sun: {
    position: 'absolute',
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#f5edcb',
    top: 60,
    right: 20,
  },
  mountainFar: {
    position: 'absolute',
    width: 220,
    height: 260,
    backgroundColor: '#6b9380',
    top: 122,
    left: -80,
    borderTopRightRadius: 110,
    transform: [{ rotate: '-25deg' }],
  },
  mountainNear: {
    position: 'absolute',
    width: 230,
    height: 260,
    backgroundColor: '#345d4d',
    top: 161,
    right: -118,
    borderTopLeftRadius: 70,
    transform: [{ rotate: '24deg' }],
  },
  lake: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 128, backgroundColor: '#24473f' },
  landscapeFooter: { position: 'absolute', bottom: 22, left: 17, right: 10, gap: 18 },
  destination: { color: '#eef1d8', fontSize: 29, fontWeight: '500', letterSpacing: -0.8, lineHeight: 32 },
  location: { color: '#b4cbbc', fontSize: 8, letterSpacing: 1 },
  journalLabel: { color: '#667461', fontSize: 8, letterSpacing: 1, lineHeight: 12 },
  number: { color: '#98a085', fontSize: 50, fontWeight: '300', letterSpacing: -3, marginTop: 10 },
  journalTitle: { color: '#294133', fontSize: 25, lineHeight: 29, fontWeight: '500', letterSpacing: -0.8 },
  rule: { height: 1, backgroundColor: '#9ca58d', marginVertical: 17, width: 30 },
  journalBody: { color: '#53634c', fontSize: 12, lineHeight: 18 },
  journalFooter: { position: 'absolute', bottom: 17, left: 17, right: 17, gap: 4 },
  arrow: { color: '#294133', fontSize: 26 },
  regionCaption: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  regionText: { color: '#829c8d', fontSize: 8, letterSpacing: 1.5 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#c3e1a0' },
  previewDot: { backgroundColor: '#edc278' },
  unavailableDot: { backgroundColor: '#819580' },
  badgeText: { color: '#c3d2b9', fontSize: 9, letterSpacing: 1.3 },
  volume: { color: '#819580', fontSize: 10, letterSpacing: 1.4 },
  description: { color: '#c0cdb8', fontSize: 15, lineHeight: 23, maxWidth: 360 },
  button: { minHeight: 44, borderRadius: 24, paddingHorizontal: 18, paddingVertical: 13, backgroundColor: '#d1e5b2' },
  buttonText: { color: '#284031', fontSize: 12, fontWeight: '600' },
  labButton: {
    maxWidth: '100%',
    marginLeft: 'auto',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: '#edc278',
  },
  labText: { color: '#284031', fontSize: 12, fontWeight: '600' },
  credit: { color: '#758b77', fontSize: 9, lineHeight: 15 },
});
