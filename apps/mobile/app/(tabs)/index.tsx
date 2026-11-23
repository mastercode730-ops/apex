import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useApi } from '../../src/useApi';
import { FadeIn, LiveDot, Screen, TeamBadge } from '../../src/ui';
import { Carousel, MatchTile, SectionTitle, SeriesCover, scoreOf } from '../../src/kit';
import { ago, teamLabel, type Article, type MatchView, type Refs, type Series, type Team } from '../../src/api';
import { c, r } from '../../src/theme';
import { useTheme } from '../../src/ThemeProvider';

const byStart = (a: MatchView, b: MatchView) => +new Date(a.startTime) - +new Date(b.startTime);

/** Big featured match at the top of Home. */
function Hero({ m, refs, seriesName }: { m: MatchView; refs?: Refs; seriesName?: string }) {
  const [a, b] = [teamLabel(refs, m.team1Id), teamLabel(refs, m.team2Id)];
  const live = m.status === 'live';
  return (
    <Pressable onPress={() => router.push(`/match/${m.id}`)} accessibilityRole="button" accessibilityLabel={`${a.name} versus ${b.name}`} style={{ borderRadius: 24, overflow: 'hidden', backgroundColor: c.surface }}>
      <View style={{ position: 'absolute', inset: 0, flexDirection: 'row' }}><View style={{ flex: 1, backgroundColor: a.color }} /><View style={{ flex: 1, backgroundColor: b.color }} /></View>
      <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(5,8,20,0.55)' }} />
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '800', letterSpacing: 2, fontSize: 12, textTransform: 'uppercase' }} numberOfLines={1}>{seriesName ?? m.format}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 14, marginVertical: 18 }}>
          <View style={{ alignItems: 'center', gap: 8, flex: 1 }}><TeamBadge refs={refs} id={m.team1Id} size={72} /><Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{a.code}</Text>{scoreOf(m, m.team1Id) && <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{scoreOf(m, m.team1Id)!.text}</Text>}</View>
          <View style={{ width: 38, height: 38, borderRadius: 19, marginTop: 17, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>VS</Text></View>
          <View style={{ alignItems: 'center', gap: 8, flex: 1 }}><TeamBadge refs={refs} id={m.team2Id} size={72} /><Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{b.code}</Text>{scoreOf(m, m.team2Id) && <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{scoreOf(m, m.team2Id)!.text}</Text>}</View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch' }}>
          <View style={{ flex: 1 }}>
            {live ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.6)', alignSelf: 'flex-start', borderRadius: r.pill, paddingHorizontal: 10, paddingVertical: 4 }}><LiveDot /><Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>LIVE</Text></View> : null}
            <Text style={{ color: '#fff', fontSize: 13.5, fontWeight: '600', marginTop: live ? 6 : 0 }} numberOfLines={2}>{m.status === 'upcoming' ? `Starts ${new Date(m.startTime).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : m.statusLine}</Text>
          </View>
          <View style={{ backgroundColor: '#eef2fb', borderRadius: r.pill, paddingHorizontal: 18, paddingVertical: 11 }}><Text style={{ color: '#0b1020', fontWeight: '800', fontSize: 14 }}>{live ? 'Live Score' : 'Match Centre'} ›</Text></View>
        </View>
      </View>
    </Pressable>
  );
}

export default function Home() {
  useTheme();
  const { width } = useWindowDimensions();
  const { data, refs, loading, error, refreshing, refresh } = useApi<MatchView[]>('/matches', 10_000);
  const series = useApi<Series[]>('/series', 120_000);
  const teams = useApi<Team[]>('/teams', 300_000);
  const news = useApi<Omit<Article, 'body'>[]>('/news?limit=5', 60_000);
  const colors = useMemo(() => Object.fromEntries((teams.data ?? []).map((t) => [t.id, t.color])), [teams.data]);

  const all = data ?? [];
  const live = all.filter((m) => m.status === 'live');
  const upcoming = all.filter((m) => m.status === 'upcoming').sort(byStart);
  const done = all.filter((m) => m.status === 'completed').sort((a, b) => byStart(b, a));
  const strip = [...live, ...upcoming.slice(0, 6), ...done.slice(0, 4)].slice(0, 10);
  const hero = live[0] ?? upcoming[0] ?? done[0];
  const seriesName = (id: string) => series.data?.find((s) => s.id === id)?.name;

  return (
    <Screen loading={loading} error={error} refreshing={refreshing} onRefresh={refresh} empty={data && !data.length ? 'No matches right now. Check back soon.' : undefined} flush>
      {hero && <FadeIn style={{ paddingHorizontal: 16 }}><Hero m={hero} refs={refs} seriesName={seriesName(hero.seriesId)} /></FadeIn>}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingVertical: 16 }}>
        {[{ label: `Live (${live.length})`, go: '/matches', dot: live.length > 0 }, { label: 'Fixtures', go: '/matches' }, { label: 'Rankings', go: '/rankings' }, { label: 'News', go: '/news' }].map((q) => (
          <Pressable key={q.label} onPress={() => router.navigate(q.go)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: r.pill, paddingHorizontal: 16, paddingVertical: 11 }} accessibilityRole="button">
            {q.dot && <LiveDot />}<Text style={{ color: c.text, fontWeight: '600', fontSize: 15 }}>{q.label} ›</Text>
          </Pressable>
        ))}
      </ScrollView>

      {strip.length > 0 && <Carousel data={strip} width={width - 40} render={(m) => <MatchTile m={m} refs={refs} />} />}

      {(news.data?.length ?? 0) > 0 && (
        <View style={{ paddingHorizontal: 16, marginTop: 30 }}>
          <SectionTitle title="Featured News" action="All News" onAction={() => router.navigate('/news')} />
          {news.data!.slice(0, 4).map((a) => (
            <Pressable key={a.id} onPress={() => router.push(`/news/${a.slug}`)} accessibilityRole="button" style={{ flexDirection: 'row', gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.line }}>
              <View style={{ width: 84, height: 84, borderRadius: 12, backgroundColor: colors[a.teamIds?.[0] ?? ''] ?? c.surface2 }} />
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={{ color: c.text, fontSize: 16.5, fontWeight: '600', lineHeight: 22 }} numberOfLines={3}>{a.title}</Text>
                <Text style={{ color: c.muted, fontSize: 12, marginTop: 6, textTransform: 'uppercase' }}>{a.author} · {ago(a.publishedAt)}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {(series.data?.length ?? 0) > 0 && (
        <View style={{ marginTop: 30 }}>
          <View style={{ paddingHorizontal: 16 }}><SectionTitle title="Featured Series" action="View all" onAction={() => router.navigate('/series')} /></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
            {series.data!.map((s) => (
              <View key={s.id}><SeriesCover s={s} colors={colors} width={150} height={185} onPress={() => router.push(`/series/${s.id}`)} /><Text style={{ color: c.text, fontWeight: '600', marginTop: 8, width: 150 }} numberOfLines={1}>{s.short}</Text></View>
            ))}
          </ScrollView>
        </View>
      )}
    </Screen>
  );
}
