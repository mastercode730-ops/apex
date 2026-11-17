import { useEffect, useRef, type ReactNode } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { c, r } from './theme';
import { teamLabel, timeLabel, type MatchView, type Refs } from './api';
import { router } from 'expo-router';

/** Fades and slides children in; `index` staggers siblings. */
export function FadeIn({ children, index = 0, style }: { children: ReactNode; index?: number; style?: ViewStyle }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(v, { toValue: 1, duration: 420, delay: Math.min(index, 8) * 60, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(); }, [v, index]);
  return <Animated.View style={[{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }, style]}>{children}</Animated.View>;
}

/** Pops briefly whenever `value` changes (a run, a wicket). */
export function ScoreText({ value, style }: { value: string; style?: object }) {
  const s = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    Animated.sequence([Animated.timing(s, { toValue: 1.18, duration: 130, useNativeDriver: true }), Animated.spring(s, { toValue: 1, useNativeDriver: true })]).start();
  }, [value, s]);
  return <Animated.Text style={[{ transform: [{ scale: s }] }, style]}>{value}</Animated.Text>;
}

export function LiveDot() {
  const o = useRef(new Animated.Value(1)).current;
  useEffect(() => { const a = Animated.loop(Animated.sequence([Animated.timing(o, { toValue: 0.25, duration: 700, useNativeDriver: true }), Animated.timing(o, { toValue: 1, duration: 700, useNativeDriver: true })])); a.start(); return () => a.stop(); }, [o]);
  return <Animated.View style={[st.dot, { opacity: o }]} />;
}

export function TeamBadge({ refs, id, size = 34 }: { refs?: Refs; id: string; size?: number }) {
  const t = teamLabel(refs, id);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.color, alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.32 }}>{t.code.slice(0, 3)}</Text>
    </View>
  );
}

export function MatchCard({ m, refs, index = 0 }: { m: MatchView; refs?: Refs; index?: number }) {
  const row = (teamId: string) => {
    const inn = m.innings.find((i) => i.battingTeamId === teamId);
    return (
      <View style={st.row}>
        <View style={st.rowL}><TeamBadge refs={refs} id={teamId} /><Text style={st.team} numberOfLines={1}>{teamLabel(refs, teamId).name}</Text></View>
        {inn && <ScoreText style={st.score} value={`${inn.runs}/${inn.wickets} (${inn.overs})`} />}
      </View>
    );
  };
  return (
    <FadeIn index={index}>
      <Pressable onPress={() => router.push(`/match/${m.id}`)} style={({ pressed }) => [st.card, pressed && { transform: [{ scale: 0.985 }], borderColor: c.accent }]} accessibilityRole="button" accessibilityLabel={`${m.title}. ${m.statusLine}`}>
        <View style={st.cardTop}>
          <Text style={st.muted} numberOfLines={1}>{m.title.split(', ')[1] ?? m.format} · {m.format}</Text>
          {m.status === 'live' ? <View style={st.liveTag}><LiveDot /><Text style={st.liveTxt}>LIVE</Text></View> : <Text style={[st.muted, { fontWeight: '700' }]}>{m.status === 'completed' ? 'Result' : 'Upcoming'}</Text>}
        </View>
        {row(m.team1Id)}{row(m.team2Id)}
        <Text style={[st.status, m.status === 'live' && { color: c.accent }]} numberOfLines={2}>{m.status === 'upcoming' ? timeLabel(m.startTime) : m.statusLine}</Text>
      </Pressable>
    </FadeIn>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return <View style={{ marginTop: 22 }}><Text style={st.h2}>{title}</Text><View style={{ gap: 12 }}>{children}</View></View>;
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!active }} style={[st.chip, active && { backgroundColor: c.accent, borderColor: c.accent }]}><Text style={[st.chipTxt, active && { color: c.accentInk }]}>{label}</Text></Pressable>;
}

export function Screen({ children, refreshing, onRefresh, loading, error, empty }: { children?: ReactNode; refreshing?: boolean; onRefresh?: () => void; loading?: boolean; error?: string; empty?: string }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={c.accent} colors={[c.accent]} /> : undefined}>
      {loading && <ActivityIndicator color={c.accent} style={{ marginTop: 48 }} />}
      {!loading && error && <View style={st.notice}><Text style={st.noticeTitle}>Couldn&apos;t load data</Text><Text style={st.muted}>{error}</Text><Text style={[st.muted, { marginTop: 6 }]}>Pull down to retry.</Text></View>}
      {!loading && !error && empty && <View style={st.notice}><Text style={st.muted}>{empty}</Text></View>}
      {!loading && children}
    </ScrollView>
  );
}

export const st = StyleSheet.create({
  card: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: r.lg, padding: 14, gap: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  rowL: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  team: { color: c.text, fontWeight: '700', fontSize: 15, flexShrink: 1 },
  score: { color: c.text, fontWeight: '800', fontSize: 17, fontVariant: ['tabular-nums'] },
  status: { color: c.muted, fontSize: 13, fontWeight: '600', borderTopWidth: 1, borderTopColor: c.line, paddingTop: 10 },
  muted: { color: c.muted, fontSize: 12 },
  liveTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,77,106,0.15)', borderRadius: r.pill, paddingHorizontal: 9, paddingVertical: 3 },
  liveTxt: { color: c.live, fontWeight: '800', fontSize: 10, letterSpacing: 1 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: c.live },
  h2: { color: c.text, fontSize: 20, fontWeight: '800', marginBottom: 12, letterSpacing: -0.3 },
  chip: { borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, borderRadius: r.pill, paddingHorizontal: 14, paddingVertical: 7 },
  chipTxt: { color: c.muted, fontWeight: '700', fontSize: 13 },
  notice: { backgroundColor: c.surface, borderRadius: r.lg, borderWidth: 1, borderColor: c.line, padding: 20, alignItems: 'center', gap: 4, marginTop: 20 },
  noticeTitle: { color: c.text, fontWeight: '800', fontSize: 16 },
});
