import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../../src/useApi';
import { Screen, TeamBadge } from '../../src/ui';
import { MatchTile, UnderlineTabs } from '../../src/kit';
import type { MatchView, Series } from '../../src/api';
import { c } from '../../src/theme';
import { useTheme } from '../../src/ThemeProvider';

type Tab = 'live' | 'you' | 'upcoming' | 'finished';
const byStart = (a: MatchView, b: MatchView) => +new Date(a.startTime) - +new Date(b.startTime);

export default function Matches() {
  useTheme();
  const { data, refs, loading, error, refreshing, refresh } = useApi<MatchView[]>('/matches', 10_000);
  const series = useApi<Series[]>('/series', 120_000);
  const [tab, setTab] = useState<Tab>('you');
  const [closed, setClosed] = useState<Record<string, boolean>>({});

  const all = data ?? [];
  const liveCount = all.filter((m) => m.status === 'live').length;
  const groups = useMemo(() => {
    const live = all.filter((m) => m.status === 'live').sort(byStart);
    const up = all.filter((m) => m.status === 'upcoming').sort(byStart);
    const done = all.filter((m) => m.status === 'completed').sort((a, b) => byStart(b, a));
    const list = tab === 'live' ? live : tab === 'upcoming' ? up : tab === 'finished' ? done : [...live, ...up, ...done.slice(0, 6)];
    const map = new Map<string, MatchView[]>();
    for (const m of list) map.set(m.seriesId, [...(map.get(m.seriesId) ?? []), m]);
    return [...map.entries()];
  }, [all, tab]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <UnderlineTabs<Tab> value={tab} onChange={setTab} tabs={[{ key: 'live', label: 'Live', badge: liveCount }, { key: 'you', label: 'For you' }, { key: 'upcoming', label: 'Upcoming' }, { key: 'finished', label: 'Finished' }]} />
      <Screen loading={loading} error={error} refreshing={refreshing} onRefresh={refresh}>
        {groups.map(([sid, ms]) => {
          const s = series.data?.find((x) => x.id === sid);
          const open = !closed[sid];
          return (
            <View key={sid} style={{ marginBottom: 18 }}>
              <Pressable onPress={() => setClosed((x) => ({ ...x, [sid]: open }))} accessibilityRole="button" accessibilityState={{ expanded: open }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
                <TeamBadge refs={refs} id={ms[0].team1Id} size={30} />
                <Text style={{ flex: 1, color: c.text, fontSize: 17, fontWeight: '600' }} numberOfLines={1}>{s?.name ?? ms[0].format}</Text>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={c.muted} />
              </Pressable>
              {open && <View style={{ gap: 12 }}>{ms.map((m) => <MatchTile key={m.id} m={m} refs={refs} />)}</View>}
            </View>
          );
        })}
        {!loading && !groups.length && <View style={{ marginTop: 36, alignItems: 'center' }}><Text style={{ color: c.muted, fontSize: 15 }}>{tab === 'live' ? 'No live matches right now.' : 'Nothing to show here yet.'}</Text></View>}
      </Screen>
    </View>
  );
}
