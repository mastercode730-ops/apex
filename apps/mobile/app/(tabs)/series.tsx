import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useApi } from '../../src/useApi';
import { FadeIn, Screen, st } from '../../src/ui';
import type { Series } from '../../src/api';
import { c, r } from '../../src/theme';

export default function SeriesList() {
  const { data, loading, error, refreshing, refresh } = useApi<Series[]>('/series', 120_000);
  return (
    <Screen loading={loading} error={error} refreshing={refreshing} onRefresh={refresh} empty={data && !data.length ? 'No series yet.' : undefined}>
      <View style={{ gap: 12 }}>
        {(data ?? []).map((s, i) => (
          <FadeIn key={s.id} index={i}>
            <Pressable onPress={() => router.push(`/series/${s.id}`)} style={({ pressed }) => [st.card, pressed && { borderColor: c.accent }]} accessibilityRole="button">
              <Text style={{ color: c.text, fontSize: 17, fontWeight: '800' }}>{s.name}</Text>
              <Text style={st.muted}>{new Date(s.start).toLocaleDateString()} – {new Date(s.end).toLocaleDateString()}</Text>
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                {s.format.map((f) => <Text key={f} style={{ color: c.text, backgroundColor: c.surface2, borderRadius: r.pill, paddingHorizontal: 10, paddingVertical: 3, fontSize: 11, fontWeight: '700', overflow: 'hidden' }}>{f}</Text>)}
                <Text style={{ color: c.accent, backgroundColor: '#1d2a0a', borderRadius: r.pill, paddingHorizontal: 10, paddingVertical: 3, fontSize: 11, fontWeight: '700', overflow: 'hidden' }}>{s.kind}</Text>
              </View>
            </Pressable>
          </FadeIn>
        ))}
      </View>
    </Screen>
  );
}
