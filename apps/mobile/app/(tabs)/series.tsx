import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useApi } from '../../src/useApi';
import { Screen, TeamBadge } from '../../src/ui';
import { FeaturedRow, MatchTile, SectionTitle, SeriesCover, UnderlineTabs } from '../../src/kit';
import { type MatchView, type Series, type Team } from '../../src/api';
import { c } from '../../src/theme';
import { useTheme } from '../../src/ThemeProvider';

type Tab = 'overview' | 'matches' | 'teams';
const byStart = (a: MatchView, b: MatchView) => +new Date(a.startTime) - +new Date(b.startTime);
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

/** Featured series: switch tournament at the top, then Overview / Matches / Teams. */
export default function SeriesTab() {
  useTheme();
  const list = useApi<Series[]>('/series', 120_000);
  const teams = useApi<Team[]>('/teams', 300_000);
  const [sel, setSel] = useState<string>();
  const [tab, setTab] = useState<Tab>('overview');
  const colors = useMemo(() => Object.fromEntries((teams.data ?? []).map((t) => [t.id, t.color])), [teams.data]);
  const current = sel ?? list.data?.[0]?.id;
  const detail = useApi<{ series: Series; matches: MatchView[] }>(current ? `/series/${current}` : null, 30_000);
  useEffect(() => { setTab('overview'); }, [current]);

  const s = detail.data?.series ?? list.data?.find((x) => x.id === current);
  const ms = detail.data?.matches ?? [];
  const live = ms.filter((m) => m.status === 'live');
  const next = ms.filter((m) => m.status === 'upcoming').sort(byStart)[0];
  const last = ms.filter((m) => m.status === 'completed').sort((a, b) => byStart(b, a))[0];
  const featured = [...live, ...(next ? [next] : []), ...(last ? [last] : [])].slice(0, 3);

  return (
    <Screen loading={list.loading} error={list.error} refreshing={list.refreshing} onRefresh={() => { list.refresh(); detail.refresh(); }} empty={list.data && !list.data.length ? 'No series yet.' : undefined} flush>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingTop: 4 }}>
        {(list.data ?? []).map((x) => <SeriesCover key={x.id} s={x} colors={colors} selected={x.id === current} onPress={() => setSel(x.id)} width={186} height={228} />)}
      </ScrollView>

      {s && (
        <View style={{ paddingHorizontal: 16, marginTop: 22 }}>
          <Text style={{ color: c.text, fontSize: 24, fontWeight: '800' }}>{s.short}</Text>
          <Text style={{ color: c.muted, marginTop: 4 }}>{fmtDate(s.start)} to {fmtDate(s.end)} · {s.format.join(' · ')}</Text>
        </View>
      )}
      <View style={{ marginTop: 14 }}>
        <UnderlineTabs<Tab> value={tab} onChange={setTab} tabs={[{ key: 'overview', label: 'Overview' }, { key: 'matches', label: 'Matches' }, { key: 'teams', label: 'Teams' }]} />
      </View>

      <View style={{ padding: 16, gap: 12 }}>
        {tab === 'overview' && (
          <>
            <SectionTitle title="Featured Matches" action="All Matches" onAction={() => setTab('matches')} />
            {featured.map((m) => <FeaturedRow key={m.id} m={m} refs={detail.refs} />)}
            {!featured.length && !detail.loading && <Text style={{ color: c.muted }}>Fixtures to be announced.</Text>}
            <Pressable onPress={() => current && router.push(`/series/${current}`)} accessibilityRole="button" style={{ marginTop: 8, alignSelf: 'flex-start' }}><Text style={{ color: c.blue, fontWeight: '600', fontSize: 15 }}>Open full series page ›</Text></Pressable>
          </>
        )}
        {tab === 'matches' && [...ms].sort(byStart).map((m) => <MatchTile key={m.id} m={m} refs={detail.refs} />)}
        {tab === 'matches' && !ms.length && !detail.loading && <Text style={{ color: c.muted }}>No matches yet.</Text>}
        {tab === 'teams' && (s?.teamIds ?? []).map((t) => {
          const team = teams.data?.find((x) => x.id === t);
          return (
            <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 16, padding: 14 }}>
              <TeamBadge id={t} refs={detail.refs} size={40} /><Text style={{ color: c.text, fontSize: 17, fontWeight: '700' }}>{team?.name ?? t.toUpperCase()}</Text>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}
