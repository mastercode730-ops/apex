import { Text } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useApi } from '../../src/useApi';
import { MatchCard, Screen, Section } from '../../src/ui';
import type { MatchView, Series } from '../../src/api';
import { c } from '../../src/theme';

export default function SeriesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, refs, loading, error, refreshing, refresh } = useApi<{ series: Series; matches: MatchView[] }>(`/series/${id}`, 30_000);
  const ms = [...(data?.matches ?? [])].sort((a, b) => +new Date(b.startTime) - +new Date(a.startTime));
  return (
    <Screen loading={loading} error={error} refreshing={refreshing} onRefresh={refresh}>
      <Stack.Screen options={{ title: data?.series.short ?? 'Series' }} />
      {data && <Text style={{ color: c.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.4 }}>{data.series.name}</Text>}
      <Section title="Matches">{ms.map((m, i) => <MatchCard key={m.id} m={m} refs={refs} index={i} />)}</Section>
    </Screen>
  );
}
