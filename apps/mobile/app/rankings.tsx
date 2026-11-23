import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useApi } from '../src/useApi';
import { Chip, FadeIn, Screen, TeamBadge, st } from '../src/ui';
import type { RankingEntry, Refs, Team } from '../src/api';
import { c } from '../src/theme';
import { useTheme } from '../src/ThemeProvider';

const FORMATS = [['TEST', 'Test'], ['ODI', 'ODI'], ['T20', 'T20I']] as const;

export default function Rankings() {
  useTheme();
  const [gender, setGender] = useState<'men' | 'women'>('men');
  const [format, setFormat] = useState<'TEST' | 'ODI' | 'T20'>('T20');
  const teams = useApi<Team[]>('/teams');
  const { data, loading, error, refreshing, refresh } = useApi<RankingEntry[]>(`/rankings/${gender}/team?format=${format}`);
  const refs: Refs = useMemo(() => ({ players: {}, teams: Object.fromEntries((teams.data ?? []).map((t) => [t.id, { name: t.name, code: t.code, color: t.color }])) }), [teams.data]);
  return (
    <Screen loading={loading} error={error} refreshing={refreshing} onRefresh={refresh} empty={data && !data.length ? 'No ranking data yet.' : undefined}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>{(['men', 'women'] as const).map((g) => <Chip key={g} label={g === 'men' ? 'Men' : 'Women'} active={gender === g} onPress={() => setGender(g)} />)}</View>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>{FORMATS.map(([k, l]) => <Chip key={k} label={l} active={format === k} onPress={() => setFormat(k)} />)}</View>
      <View style={{ gap: 8 }}>
        {(data ?? []).map((e, i) => (
          <FadeIn key={`${gender}${format}${e.rank}`} index={i}>
            <View style={[st.card, { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }]}>
              <Text style={{ color: c.accent, fontWeight: '800', fontSize: 18, width: 28, fontVariant: ['tabular-nums'] }}>{e.rank}</Text>
              <TeamBadge refs={refs} id={e.teamId} size={32} />
              <Text style={{ color: c.text, fontWeight: '700', flex: 1, fontSize: 15 }}>{e.name}</Text>
              <Text style={{ color: c.text, fontWeight: '800', fontSize: 16, fontVariant: ['tabular-nums'] }}>{e.rating}</Text>
            </View>
          </FadeIn>
        ))}
      </View>
    </Screen>
  );
}
