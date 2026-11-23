import { useMemo, useState, type ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiveDot, TeamBadge } from './ui';
import { Icon } from './icons';
import { useTheme } from './ThemeProvider';
import { teamLabel, type MatchView, type Refs, type Series } from './api';
import { c, onTheme, r } from './theme';

/* ---------------------------------------------------------------- header */
/** Top bar on every tab: logo, Search pill, menu. */
export function AppHeader() {
  const { scheme, toggle } = useTheme();
  const { top } = useSafeAreaInsets();
  return (
    <View style={[k.header, { paddingTop: top + 8 }]}>
      <Pressable onPress={() => router.navigate('/')} style={k.brand} accessibilityRole="button" accessibilityLabel="Apex home">
        <Image source={require('../assets/favicon.png')} style={{ width: 34, height: 34, borderRadius: 9 }} />
        <Text style={k.brandTxt}>APEX</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/search')} style={k.searchPill} accessibilityRole="search" accessibilityLabel="Search">
        <Ionicons name="search" size={17} color={c.text} /><Text style={k.searchTxt}>Search</Text>
      </Pressable>
      <Pressable onPress={toggle} hitSlop={10} accessibilityRole="button" accessibilityLabel={scheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} style={k.themeBtn}><Icon name={scheme === 'dark' ? 'sun' : 'moon'} color={c.text} size={20} /></Pressable>
      <Pressable onPress={() => router.navigate('/more')} hitSlop={12} accessibilityRole="button" accessibilityLabel="Menu"><Ionicons name="menu" size={28} color={c.text} /></Pressable>
    </View>
  );
}

/* ----------------------------------------------------------- score helpers */
/** "368 & 119-2" style score for a team, plus the overs of its latest innings. */
export function scoreOf(m: MatchView, teamId: string) {
  const inns = m.innings.filter((i) => i.battingTeamId === teamId);
  if (!inns.length) return null;
  const text = inns.map((i) => (i.wickets >= 10 ? `${i.runs}` : `${i.runs}-${i.wickets}`)).join(' & ');
  return { text, overs: String(inns[inns.length - 1].overs) };
}
export const clock = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
export const dayShort = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

/* ------------------------------------------------------------- match tile */
/** Scoreboard card: venue line, two team rows, status on the right, result line at the bottom. */
export function MatchTile({ m, refs, width }: { m: MatchView; refs?: Refs; width?: number }) {
  const cur = m.innings[m.innings.length - 1];
  const row = (teamId: string) => {
    const s = scoreOf(m, teamId);
    const batting = m.status === 'live' && cur?.battingTeamId === teamId;
    return (
      <View style={k.tRow}>
        <TeamBadge refs={refs} id={teamId} size={30} />
        <Text style={k.tCode}>{teamLabel(refs, teamId).code}</Text>
        {s ? (
          <View style={k.tScoreWrap}>
            <Text style={[k.tScore, batting && { color: c.blue }]} numberOfLines={1}>{s.text}</Text>
            <Text style={k.tOvers}>{s.overs}</Text>
            {batting && <Text accessibilityLabel="batting">🏏</Text>}
          </View>
        ) : <Text style={k.tYet}>{m.status === 'upcoming' ? '' : 'Yet to bat'}</Text>}
      </View>
    );
  };
  const venue = [m.title.split(', ')[1], m.venue, m.city].filter(Boolean).join(', ');
  return (
    <Pressable onPress={() => router.push(`/match/${m.id}`)} style={({ pressed }) => [k.tile, width ? { width } : null, pressed && { borderColor: c.accent }]} accessibilityRole="button" accessibilityLabel={`${m.title}. ${m.statusLine}`}>
      <Text style={k.tVenue} numberOfLines={1}>{venue}</Text>
      <View style={k.tBody}>
        <View style={{ flex: 1, gap: 10 }}>{row(m.team1Id)}{row(m.team2Id)}</View>
        <View style={k.tSide}>
          {m.status === 'live' ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><LiveDot /><Text style={k.tLive}>Live</Text></View>
            : m.status === 'completed' ? <Text style={k.tSideMuted}>Result</Text>
            : <View style={{ alignItems: 'center' }}><Text style={k.tSideMuted}>{clock(m.startTime)}</Text><Text style={k.tSideBig}>{dayShort(m.startTime)}</Text></View>}
        </View>
      </View>
      {m.status !== 'upcoming' && <Text style={k.tStatus} numberOfLines={2}>{m.statusLine}</Text>}
    </Pressable>
  );
}

/** "NZ  Stumps  IND" row used for featured matches in a series. */
export function FeaturedRow({ m, refs }: { m: MatchView; refs?: Refs }) {
  const mid = m.status === 'live' ? <Text style={[k.fMid, { color: c.live }]}>Live</Text>
    : m.status === 'completed' ? <Text style={[k.fMidBig, { fontSize: 13 }]} numberOfLines={3}>{m.result ?? m.statusLine}</Text>
    : <View style={{ alignItems: 'center' }}><Text style={k.fSmall}>{m.title.split(', ')[1]} on</Text><Text style={k.fMidBig}>{dayShort(m.startTime)}, {clock(m.startTime)}</Text></View>;
  return (
    <Pressable onPress={() => router.push(`/match/${m.id}`)} style={({ pressed }) => [k.fRow, pressed && { borderColor: c.accent }]} accessibilityRole="button">
      <View style={k.fTeam}><TeamBadge refs={refs} id={m.team1Id} size={34} /><Text style={k.tCode}>{teamLabel(refs, m.team1Id).code}</Text></View>
      <View style={{ flex: 1, minWidth: 0, alignItems: 'center', paddingHorizontal: 8 }}>{mid}</View>
      <View style={[k.fTeam, { justifyContent: 'flex-end' }]}><Text style={k.tCode}>{teamLabel(refs, m.team2Id).code}</Text><TeamBadge refs={refs} id={m.team2Id} size={34} /></View>
    </Pressable>
  );
}

/* ------------------------------------------------------------------- tabs */
export function UnderlineTabs<T extends string>({ tabs, value, onChange }: { tabs: { key: T; label: string; badge?: number }[]; value: T; onChange: (k: T) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={k.tabsBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 22 }}>
      {tabs.map((t) => {
        const on = t.key === value;
        return (
          <Pressable key={t.key} onPress={() => onChange(t.key)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={[k.tab, on && { borderBottomColor: c.accent }]}>
            <Text style={[k.tabTxt, on && { color: c.text }]}>{t.label}{t.badge !== undefined ? ` (${t.badge})` : ''}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/* ------------------------------------------------------------- series cover */
/** Tall tournament card: the two teams' colours with the tour title on top. */
export function SeriesCover({ s, colors, selected, onPress, width = 150, height = 190 }: { s: Series; colors: Record<string, string>; selected?: boolean; onPress: () => void; width?: number; height?: number }) {
  const [a, b] = [colors[s.teamIds[0]] ?? '#1f3a8a', colors[s.teamIds[1] ?? s.teamIds[0]] ?? '#0b1020'];
  const m = s.name.match(/^(.+?) tour of (.+?)(?: \d{4})?$/i);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!selected }} accessibilityLabel={s.name} style={[k.cover, { width, height }, selected && { borderColor: c.blue, borderWidth: 3 }]}>
      <View style={StyleSheet.absoluteFill}><View style={{ flex: 1, flexDirection: 'row' }}><View style={{ flex: 1, backgroundColor: a }} /><View style={{ flex: 1, backgroundColor: b }} /></View></View>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(5,8,20,0.28)' }]} />
      {[30, 42, 54, 66, 78].map((t) => <View key={t} style={[StyleSheet.absoluteFill, { top: `${t}%`, backgroundColor: 'rgba(5,8,20,0.16)' }]} />)}
      {selected && <View style={k.check}><Ionicons name="checkmark" size={18} color="#0b1020" /></View>}
      <View style={k.coverBody}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>{s.teamIds.slice(0, 2).map((t) => <TeamBadge key={t} id={t} size={34} refs={{ players: {}, teams: { [t]: { name: t, code: t.toUpperCase(), color: colors[t] ?? '#334' } } }} />)}</View>
        {m ? (<><Text style={k.coverTitle} numberOfLines={1}>{m[1]}</Text><Text style={k.coverTour}>TOUR OF</Text><Text style={k.coverTitle} numberOfLines={1}>{m[2]}</Text></>) : <Text style={k.coverTitle} numberOfLines={3}>{s.name}</Text>}
      </View>
    </Pressable>
  );
}

/* ------------------------------------------------------------- carousel */
/** Horizontal paged list with dots underneath. */
export function Carousel<T>({ data, width, render, gap = 12 }: { data: T[]; width: number; render: (item: T, i: number) => ReactNode; gap?: number }) {
  const [idx, setIdx] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setIdx(Math.round(e.nativeEvent.contentOffset.x / (width + gap)));
  const dots = useMemo(() => data.slice(0, 8), [data]);
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={width + gap} decelerationRate="fast" onScroll={onScroll} scrollEventThrottle={32} contentContainerStyle={{ paddingHorizontal: 16, gap }}>
        {data.map((d, i) => <View key={i} style={{ width }}>{render(d, i)}</View>)}
      </ScrollView>
      {dots.length > 1 && <View style={k.dots}>{dots.map((_, i) => <View key={i} style={[k.dot, i === Math.min(idx, dots.length - 1) && { backgroundColor: c.text, width: 18 }]} />)}</View>}
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={k.secRow}>
      <Text style={k.secTitle}>{title}</Text>
      {action && <Pressable onPress={onAction} hitSlop={10}><Text style={k.secAction}>{action} ›</Text></Pressable>}
    </View>
  );
}

const makeK = () => StyleSheet.create({
  themeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.line, backgroundColor: c.surface },
  header: { backgroundColor: c.bg, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 10 },
  brand: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandTxt: { color: c.text, fontSize: 20, fontWeight: '800', letterSpacing: 1.5 },
  searchPill: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, borderRadius: r.pill, paddingHorizontal: 14, height: 40 },
  searchTxt: { color: c.text, fontSize: 15, fontWeight: '600' },

  tile: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 20, padding: 16, gap: 12 },
  tVenue: { color: c.muted, fontSize: 12.5 },
  tBody: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  tRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tCode: { color: c.text, fontSize: 16, fontWeight: '700', minWidth: 40 },
  tScoreWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexShrink: 1 },
  tScore: { color: c.text, fontSize: 19, fontWeight: '800', fontVariant: ['tabular-nums'], flexShrink: 1 },
  tOvers: { color: c.muted, fontSize: 12, fontVariant: ['tabular-nums'] },
  tYet: { color: c.muted, fontSize: 14 },
  tSide: { minWidth: 82, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: c.line, paddingLeft: 12 },
  tLive: { color: c.live, fontSize: 16, fontWeight: '700' },
  tSideMuted: { color: c.muted, fontSize: 13, fontWeight: '600' },
  tSideBig: { color: c.text, fontSize: 16, fontWeight: '700', marginTop: 2 },
  tStatus: { color: c.amber, fontSize: 13, fontWeight: '600' },

  fRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 18 },
  fTeam: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 84 },
  fMid: { fontSize: 16, fontWeight: '700' },
  fMidBig: { color: c.text, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  fSmall: { color: c.muted, fontSize: 12 },

  tabsBar: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: c.line },
  tab: { paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabTxt: { color: c.muted, fontSize: 17, fontWeight: '600' },

  cover: { borderRadius: 18, overflow: 'hidden', borderWidth: 3, borderColor: 'transparent', backgroundColor: c.surface2 },
  coverBody: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 10, paddingBottom: 14 },
  coverTitle: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' },
  coverTour: { color: 'rgba(255,255,255,0.75)', fontSize: 9, fontWeight: '700', letterSpacing: 2, marginVertical: 2 },
  check: { position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', zIndex: 2 },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.line },
  secRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  secTitle: { color: c.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  secAction: { color: c.blue, fontSize: 15, fontWeight: '600' },
});
export let k = makeK();
onTheme(() => { k = makeK(); });
