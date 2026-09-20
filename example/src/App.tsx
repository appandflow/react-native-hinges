import { useEffect, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { HingeProvider, createHingeObserver, useHinges } from 'react-native-hinges';

const observer = createHingeObserver();

function Inspector() {
  const hinges = useHinges();
  const insets = useSafeAreaInsets();
  const [updates, setUpdates] = useState(0);
  useEffect(() => observer.subscribe(() => setUpdates((value) => value + 1)), []);
  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
          paddingLeft: insets.left + 24,
          paddingRight: insets.right + 24,
        },
      ]}
    >
      <Text style={styles.title}>Hinges</Text>
      <Text style={styles.description}>Native posture and angle, observed independently of reserved regions.</Text>
      <Text style={styles.metric}>Hinges reported: {hinges.length}</Text>
      <Text style={styles.metric}>Observer updates: {updates}</Text>
      {hinges.length === 0 ? (
        <Text style={styles.empty}>No hinge readings available</Text>
      ) : (
        hinges.map((hinge, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.heading}>Hinge {index + 1}</Text>
            <Text style={styles.metric}>Status: {hinge.status}</Text>
            <Text style={styles.angle}>
              {hinge.angle === null ? 'Angle unavailable' : `${((hinge.angle * 180) / Math.PI).toFixed(1)}°`}
            </Text>
            <Text style={styles.metric}>
              {hinge.angle === null ? 'No unambiguous native angle reading' : `${hinge.angle.toFixed(3)} radians`}
            </Text>
          </View>
        ))
      )}
      <Text style={styles.description}>
        The hook and the non-React observer share the same snapshot. Angles are reported in radians; degrees above are
        for display.
      </Text>
    </ScrollView>
  );
}

export default function App() {
  return (
    <HingeProvider observer={observer} style={styles.screen}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
        <Inspector />
      </SafeAreaProvider>
    </HingeProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f7f9fc' },
  content: { padding: 24, gap: 20 },
  title: { fontSize: 36, fontWeight: '700', color: '#14213d' },
  heading: { fontSize: 22, fontWeight: '600', color: '#14213d' },
  description: { fontSize: 16, lineHeight: 24, color: '#52627d' },
  metric: { fontSize: 16, color: '#243552' },
  angle: { fontSize: 38, fontWeight: '600', color: '#2563eb' },
  card: { padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#c9d6e8', backgroundColor: '#ffffff', gap: 16 },
  empty: { fontSize: 18, color: '#52627d', paddingVertical: 32 },
});
