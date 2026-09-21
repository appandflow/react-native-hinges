import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View, type LayoutRectangle } from 'react-native';
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
  type SharedValue,
} from 'react-native-reanimated';

const sections = {
  Journal: {
    title: 'Room to wander.',
    subtitle: 'A small journal for a wider world.',
    label: 'THE WEEKEND EDIT',
    number: '01',
    heading: 'Take the\nlong way.',
    body: 'Pine air. Still water. No particular hurry.',
  },
  Map: {
    title: 'Follow the quiet.',
    subtitle: 'The lakeside loop, one step at a time.',
    label: 'LAKESIDE LOOP',
    number: '4.8',
    heading: 'Kilometres\nto slow down.',
    body: 'Easy terrain. Follow the shoreline back to camp.',
  },
  Moments: {
    title: 'Keep a little light.',
    subtitle: 'Small memories from a day outside.',
    label: 'TODAY’S MEMORY',
    number: '03',
    heading: 'The light\nbefore dusk.',
    body: 'A quiet shore, a warm sky, and nowhere else to be.',
  },
};
type Section = keyof typeof sections;
const sectionNames = Object.keys(sections) as Section[];

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
  const usableSpaces = spaces.filter((space) => space.end - space.start >= 44);
  const totalSpace = usableSpaces.reduce((total, space) => total + space.end - space.start, 0);
  let nextSection = 0;
  const toolbar = usableSpaces.map((space, index) => {
    const count =
      index === usableSpaces.length - 1
        ? sectionNames.length - nextSection
        : Math.min(
            sectionNames.length - nextSection,
            Math.max(1, Math.round((sectionNames.length * (space.end - space.start)) / totalSpace)),
          );
    const items = sectionNames.slice(nextSection, nextSection + count);
    nextSection += count;
    return { ...space, items };
  });
  const [section, setSection] = useState<Section>('Journal');
  const entry = sections[section];
  const [tabLayouts, setTabLayouts] = useState<Partial<Record<Section, LayoutRectangle>>>({});
  const selectedLayout = tabLayouts[section];
  const reducedMotion = useReducedMotion();
  const selection = useSharedValue<LayoutRectangle>({ x: 0, y: 0, width: 0, height: 0 });
  useEffect(() => {
    if (!selectedLayout) return;
    selection.set(
      reducedMotion || selection.get().width === 0
        ? selectedLayout
        : withTiming(selectedLayout, { duration: 250, easing: Easing.bezier(0.77, 0, 0.175, 1) }),
    );
  }, [reducedMotion, selectedLayout, selection]);
  const selectionStyle = useAnimatedStyle(() => {
    const { x, y, width, height } = selection.get();
    return { width, height, transform: [{ translateX: x }, { translateY: y }] };
  });
  const [preview, setPreview] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [width, setWidth] = useState(0);
  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{
          paddingTop: headerHeight + 24,
          paddingBottom: insets.bottom + 24,
          paddingLeft: insets.left + 24,
          paddingRight: insets.right + 24,
          gap: 20,
        }}
      >
        <View style={styles.introduction}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={controlsVisible ? 'Hide demo controls' : 'Show demo controls'}
            onPress={() => {
              setControlsVisible(!controlsVisible);
              setPreview(false);
            }}
          >
            <Text style={styles.edition}>VOL. 01 / THE OUTDOORS</Text>
          </Pressable>
          <View>
            <Text style={styles.heading}>{entry.title}</Text>
            <Text style={styles.subtitle}>{entry.subtitle}</Text>
            {ready && occlusions.length > 0 && (
              <Text style={styles.occlusionCaption}>RESERVED SPACE · CONTROLS CLEAR</Text>
            )}
          </View>
        </View>
        <ReservedRegionsProvider onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={styles.spread}>
          <Spread width={width} preview={preview} section={section} />
        </ReservedRegionsProvider>
        <HingeReadout preview={preview} />
        <Text style={styles.description}>
          Open a little. Let the light in. Your journal follows the fold, with room for every word.
        </Text>
        {controlsVisible && (
          <View style={styles.row}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: preview }}
              style={styles.button}
              onPress={() => setPreview(!preview)}
            >
              <Text style={styles.buttonText}>{preview ? 'Use native angle' : 'Preview motion'} ↗</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={styles.labButton} onPress={onOpenLab}>
              <Text style={styles.labText}>Sensor lab ↗</Text>
            </Pressable>
          </View>
        )}
        <Text style={styles.credit}>react-native-hinges + react-native-reserved-regions</Text>
      </ScrollView>
      {ready &&
        toolbar.map((space, index) => (
          <View
            key={index}
            style={[styles.header, { left: space.start, width: space.end - space.start, height: headerHeight }]}
          >
            <Animated.View pointerEvents="none" style={[styles.selection, selectionStyle, { left: -space.start }]} />
            {index === 0 && space.end - space.start >= 148 + space.items.length * 84 && (
              <Text numberOfLines={1} style={styles.brand}>
                FIELD NOTES
              </Text>
            )}
            {space.items.map((name) => (
              <Pressable
                key={name}
                accessibilityRole="tab"
                accessibilityState={{ selected: section === name }}
                style={styles.tab}
                onLayout={({ nativeEvent: { layout } }) => {
                  const next = { ...layout, x: space.start + layout.x };
                  setTabLayouts((previous) => {
                    const current = previous[name];
                    return current?.x === next.x &&
                      current.y === next.y &&
                      current.width === next.width &&
                      current.height === next.height
                      ? previous
                      : { ...previous, [name]: next };
                  });
                }}
                onPress={() => setSection(name)}
              >
                <TabLabel name={name} layout={tabLayouts[name]} selection={selection} />
              </Pressable>
            ))}
          </View>
        ))}
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

function TabLabel({
  name,
  layout,
  selection,
}: {
  name: Section;
  layout: LayoutRectangle | undefined;
  selection: SharedValue<LayoutRectangle>;
}) {
  const style = useAnimatedStyle(() => {
    const { x, width } = selection.get();
    const overlap = layout
      ? Math.max(0, Math.min(x + width, layout.x + layout.width) - Math.max(x, layout.x)) / layout.width
      : 0;
    return { color: interpolateColor(overlap, [0, 1], ['#c0cdb8', '#284031']) };
  });
  return (
    <Animated.Text numberOfLines={1} style={[styles.tabText, style]}>
      {name}
    </Animated.Text>
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

function Spread({ width, preview, section }: { width: number; preview: boolean; section: Section }) {
  const entry = sections[section];
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
    backgroundColor: interpolateColor(angle.get(), [0, Math.PI / 2, Math.PI], ['#302b50', '#d18a80', '#abc9ba']),
  }));
  const mountainFarStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(angle.get(), [0, Math.PI / 2, Math.PI], ['#504366', '#a66e80', '#6b9380']),
  }));
  const mountainNearStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(angle.get(), [0, Math.PI / 2, Math.PI], ['#332c49', '#704858', '#345d4d']),
  }));
  const lakeStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(angle.get(), [0, Math.PI / 2, Math.PI], ['#29263f', '#553f53', '#24473f']),
  }));
  const journalStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(angle.get(), [0, Math.PI], ['#b2ac92', '#f2ebd7']),
  }));
  const detailsStyle = useAnimatedStyle(() => {
    const opacity = Math.max(0, Math.min(1, (angle.get() - (Math.PI * 4) / 9) / ((Math.PI * 4) / 9)));
    return { opacity, transform: [{ translateX: reducedMotion ? 0 : (1 - opacity) * 64 }] };
  });
  const sunStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(angle.get(), [0, Math.PI / 2, Math.PI], ['#df7968', '#f4bd7e', '#f5edcb']),
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
            <View pointerEvents="none" style={styles.landscapeArt}>
              <Animated.View style={[styles.sun, sunStyle]} />
              <Animated.View style={[styles.mountainFar, mountainFarStyle]} />
              <Animated.View style={[styles.mountainNear, mountainNearStyle]} />
              <Animated.View style={[styles.lake, lakeStyle]} />
            </View>
            <View style={styles.landscapeFooter}>
              <Text style={styles.destination}>Into{'\n'}the quiet.</Text>
              <Text style={styles.location}>SAGUENAY / QUÉBEC</Text>
            </View>
          </Animated.View>
          <Animated.View style={[styles.page, { left: rightX, width: Math.max(0, width - rightX) }, journalStyle]}>
            <Text style={styles.journalLabel}>{entry.label}</Text>
            <Animated.View style={detailsStyle}>
              <Text style={styles.number}>{entry.number}</Text>
              <Text style={styles.journalTitle}>{entry.heading}</Text>
              <View style={styles.rule} />
              <Text style={styles.journalBody}>{entry.body}</Text>
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
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#172521',
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#829c8d40',
  },
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  selection: { position: 'absolute', top: 0, borderRadius: 10, backgroundColor: '#edc278' },
  tabText: { color: '#c0cdb8', fontSize: 13, fontWeight: '600' },
  occlusionOutline: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#edc278',
    backgroundColor: '#edc27815',
    boxShadow: '0 0 18px #edc27880',
  },
  occlusionCaption: { color: '#edc278', fontSize: 8, letterSpacing: 1.5, marginTop: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  brand: { marginRight: 16, flexShrink: 1, color: '#e9eddb', fontSize: 12, letterSpacing: 3, fontWeight: '700' },
  introduction: { gap: 12 },
  edition: { color: '#829c8d', fontSize: 8, letterSpacing: 1.2 },
  heading: { color: '#eef0e3', fontSize: 37, fontWeight: '500', letterSpacing: -1.8 },
  subtitle: { color: '#a6b7a6', fontSize: 13, lineHeight: 20, marginTop: 8 },
  spread: { height: 376 },
  divisionGuide: { position: 'absolute', left: 0, right: 0, top: 0, height: 344, overflow: 'hidden' },
  divisionMarker: { position: 'absolute', backgroundColor: '#c3e1a0', opacity: 0.35 },
  page: { position: 'absolute', top: 0, height: 344, overflow: 'hidden', borderRadius: 12, padding: 17 },
  landscape: { left: 0 },
  landscapeArt: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, transform: [{ scaleX: -1 }] },
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
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: '#edc278',
  },
  labText: { color: '#284031', fontSize: 12, fontWeight: '600' },
  credit: { color: '#758b77', fontSize: 9, lineHeight: 15 },
});
