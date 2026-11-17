import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useApi } from '../../src/useApi';
import { Chip, MatchCard, Screen, Section } from '../../src/ui';
import type { MatchView } from '../../src/api';
import { c } from '../../src/theme';

const FORMATS = ['All', 'T20', 'ODI', 'TEST', 'T10'];

export default function Fixtures() {
  const { data, refs, loading, error, refreshing, refresh } = useApi<MatchView[]>('/matches', 30_000);
  const [fmt, setFmt] = useState('All');
  const groups = useMemo(() => {
    const list = (data ?? []).filter((m) => fmt === 'All' || m.format === fmt).sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime));
    const map = new Map<string, MatchView[]>();
    for (const m of list) { const k = new Date(m.startTime).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' }); map.set(k, [...(map.get(k) ?? []), m]); }
    return [...map.entries()];
  }, [data, fmt]);
  return (
    <Screen loading={loading} error={error} refreshing={refreshing} onRefresh={refresh}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{FORMATS.map((f) => <Chip key={f} label={f} active={fmt === f} onPress={() => setFmt(f)} />)}</ScrollView>
      {groups.map(([day, ms]) => <Section key={day} title={day}>{ms.map((m, i) => <MatchCard key={m.id} m={m} refs={refs} index={i} />)}</Section>)}
      {!loading && !groups.length && <View style={{ marginTop: 24 }}><Text style={{ color: c.muted, textAlign: 'center' }}>No fixtures for this format.</Text></View>}
    </Screen>
  );
}
