import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useApi } from '../../src/useApi';
import { Chip, FadeIn, LiveDot, Screen, ScoreText, TeamBadge, st } from '../../src/ui';
import { playerName, teamLabel, timeLabel, type MatchView, type Refs } from '../../src/api';
import { c, r } from '../../src/theme';

const TABS = ['Live', 'Scorecard', 'Commentary', 'Info'] as const;
type Tab = (typeof TABS)[number];

export default function MatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ms, setMs] = useState(0);
  const { data: m, refs, loading, error, refreshing, refresh } = useApi<MatchView>(`/matches/${id}`, ms);
  const [tab, setTab] = useState<Tab>('Live');
  useEffect(() => { setMs(m?.status === 'live' ? 6000 : 0); }, [m?.status]); // poll only while the match is live

  return (
    <Screen loading={loading} error={error} refreshing={refreshing} onRefresh={refresh}>
      <Stack.Screen options={{ title: m?.title ?? 'Match' }} />
      {m && (
        <>
          <Scoreboard m={m} refs={refs} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginVertical: 16 }}>
            {TABS.map((t) => <Chip key={t} label={t} active={tab === t} onPress={() => setTab(t)} />)}
          </ScrollView>
          {tab === 'Live' && <LiveTab m={m} refs={refs} />}
          {tab === 'Scorecard' && <ScorecardTab m={m} refs={refs} />}
          {tab === 'Commentary' && <Commentary items={m.commentary} empty="No commentary yet." />}
          {tab === 'Info' && <InfoTab m={m} />}
        </>
      )}
    </Screen>
  );
}

function Scoreboard({ m, refs }: { m: MatchView; refs?: Refs }) {
  const cur = m.innings[m.innings.length - 1];
  return (
    <FadeIn>
      <View style={[st.card, { gap: 14, padding: 18 }]}>
        <View style={st.cardTop}>
          <Text style={st.muted}>{m.format} · {m.venue}</Text>
          {m.status === 'live' ? <View style={st.liveTag}><LiveDot /><Text style={st.liveTxt}>LIVE</Text></View> : <Text style={[st.muted, { fontWeight: '700' }]}>{m.status === 'completed' ? 'Completed' : 'Upcoming'}</Text>}
        </View>
        {[m.team1Id, m.team2Id].map((tid) => {
          const inn = m.innings.find((i) => i.battingTeamId === tid);
          return (
            <View key={tid} style={st.row}>
              <View style={st.rowL}><TeamBadge refs={refs} id={tid} size={44} /><Text style={{ color: c.text, fontWeight: '700', fontSize: 16, flexShrink: 1 }}>{teamLabel(refs, tid).name}</Text></View>
              {inn ? <ScoreText value={`${inn.runs}/${inn.wickets}`} style={{ color: c.text, fontSize: 28, fontWeight: '800', fontVariant: ['tabular-nums'] }} /> : <Text style={{ color: c.muted }}>Yet to bat</Text>}
            </View>
          );
        })}
        <Text style={{ color: c.accent, fontWeight: '700', fontSize: 15 }}>{m.status === 'upcoming' ? timeLabel(m.startTime) : m.statusLine}</Text>
        {cur && <Text style={st.muted}>Overs {cur.overs} · Run rate {cur.runRate}{cur.target ? ` · Target ${cur.target}` : ''}</Text>}
        {m.winProb && <WinBar m={m} refs={refs} />}
      </View>
    </FadeIn>
  );
}

function WinBar({ m, refs }: { m: MatchView; refs?: Refs }) {
  const p = Math.round((m.winProb?.team1 ?? 0.5) * 100);
  return (
    <View accessibilityLabel={`Win probability ${teamLabel(refs, m.team1Id).code} ${p} percent`}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ color: c.accent, fontWeight: '800', fontSize: 12 }}>{teamLabel(refs, m.team1Id).code} {p}%</Text>
        <Text style={{ color: c.blue, fontWeight: '800', fontSize: 12 }}>{100 - p}% {teamLabel(refs, m.team2Id).code}</Text>
      </View>
      <View style={{ flexDirection: 'row', height: 8, borderRadius: r.pill, overflow: 'hidden', backgroundColor: c.surface2 }}>
        <View style={{ width: `${p}%`, backgroundColor: c.accent }} /><View style={{ flex: 1, backgroundColor: c.blue }} />
      </View>
    </View>
  );
}

function LiveTab({ m, refs }: { m: MatchView; refs?: Refs }) {
  const cur = m.innings[m.innings.length - 1];
  if (!cur) return <Text style={{ color: c.muted, textAlign: 'center', marginTop: 12 }}>This match has not started yet.</Text>;
  const crease = cur.batting.filter((b) => !b.out).slice(0, 2);
  return (
    <View style={{ gap: 14 }}>
      {crease.length > 0 && (
        <View style={st.card}>
          <Text style={st.h2}>At the crease</Text>
          {crease.map((b) => (
            <View key={b.playerId} style={st.row}>
              <Text style={{ color: c.text, fontWeight: '700' }}>{playerName(refs, b.playerId)}{b.onStrike ? ' *' : ''}</Text>
              <Text style={{ color: c.text, fontWeight: '800' }}>{b.runs} <Text style={{ color: c.muted, fontWeight: '400', fontSize: 12 }}>({b.balls})</Text></Text>
            </View>
          ))}
        </View>
      )}
      {m.recentOvers.length > 0 && (
        <View style={st.card}>
          <Text style={st.h2}>Recent overs</Text>
          {m.recentOvers.map((o) => (
            <View key={o.over} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={[st.muted, { width: 50 }]}>Over {o.over}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 }}>
                {o.balls.map((b, i) => <Text key={i} style={{ minWidth: 28, textAlign: 'center', paddingVertical: 4, borderRadius: r.pill, overflow: 'hidden', fontWeight: '800', fontSize: 12, color: b === 'W' ? '#fff' : b === '6' ? c.accentInk : c.text, backgroundColor: b === 'W' ? c.live : b === '6' ? c.accent : b === '4' ? c.blue : c.surface2 }}>{b}</Text>)}
              </View>
              <Text style={{ color: c.text, fontWeight: '800' }}>{o.runs}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={st.card}><Text style={st.h2}>Latest commentary</Text><Commentary items={m.commentary.slice(0, 8)} empty="No commentary yet." bare /></View>
    </View>
  );
}

function Commentary({ items, empty, bare }: { items: MatchView['commentary']; empty: string; bare?: boolean }) {
  if (!items.length) return <Text style={{ color: c.muted }}>{empty}</Text>;
  return (
    <View style={bare ? { gap: 10 } : [st.card, { gap: 12 }]}>
      {items.map((it) => (
        <View key={it.id} style={{ flexDirection: 'row', gap: 12 }}>
          <Text style={{ width: 46, textAlign: 'center', paddingVertical: 4, borderRadius: r.sm, overflow: 'hidden', fontWeight: '800', fontSize: 12, color: it.kind === 'wicket' ? '#fff' : it.kind === 'six' ? c.accentInk : c.text, backgroundColor: it.kind === 'wicket' ? c.live : it.kind === 'six' ? c.accent : it.kind === 'four' ? c.blue : c.surface2 }}>{it.over}</Text>
          <Text style={{ color: c.text, flex: 1, fontWeight: it.kind === 'wicket' ? '800' : '400', lineHeight: 20 }}>{it.text}</Text>
        </View>
      ))}
    </View>
  );
}

function ScorecardTab({ m, refs }: { m: MatchView; refs?: Refs }) {
  if (!m.innings.length) return <Text style={{ color: c.muted, textAlign: 'center' }}>Scorecard appears once play begins.</Text>;
  return (
    <View style={{ gap: 16 }}>
      {m.innings.map((inn, idx) => (
        <View key={idx} style={st.card}>
          <View style={st.row}><Text style={st.h2}>{teamLabel(refs, inn.battingTeamId).name}</Text><Text style={{ color: c.text, fontWeight: '800' }}>{inn.runs}/{inn.wickets} ({inn.overs})</Text></View>
          {inn.batting.length === 0 && <Text style={{ color: c.muted }}>Detailed scorecard is not available yet.</Text>}
          {inn.batting.map((b) => (
            <View key={b.playerId} style={{ borderTopWidth: 1, borderTopColor: c.line, paddingTop: 8 }}>
              <View style={st.row}><Text style={{ color: c.text, fontWeight: '700', flex: 1 }}>{playerName(refs, b.playerId)}</Text><Text style={{ color: c.text, fontWeight: '800' }}>{b.runs} <Text style={{ color: c.muted, fontWeight: '400' }}>({b.balls}) {b.fours}x4 {b.sixes}x6</Text></Text></View>
              <Text style={st.muted}>{b.out ?? 'not out'}</Text>
            </View>
          ))}
          {inn.batting.length > 0 && <Text style={[st.muted, { marginTop: 4 }]}>Extras {inn.extras} · Run rate {inn.runRate}</Text>}
          {inn.bowling.length > 0 && <Text style={[st.h2, { marginTop: 10, fontSize: 16 }]}>Bowling</Text>}
          {inn.bowling.map((b) => (
            <View key={b.playerId} style={[st.row, { borderTopWidth: 1, borderTopColor: c.line, paddingTop: 8 }]}>
              <Text style={{ color: c.text, fontWeight: '700', flex: 1 }}>{playerName(refs, b.playerId)}</Text>
              <Text style={{ color: c.muted }}>{b.overs} ov · {b.runs} r · <Text style={{ color: c.text, fontWeight: '800' }}>{b.wickets} w</Text> · {b.econ}</Text>
            </View>
          ))}
          {inn.fallOfWickets.length > 0 && <Text style={[st.muted, { marginTop: 6 }]}>Fall of wickets: {inn.fallOfWickets.map((f) => `${f.runs}-${f.wicket} (${playerName(refs, f.playerId)}, ${f.over} ov)`).join(', ')}</Text>}
        </View>
      ))}
    </View>
  );
}

function InfoTab({ m }: { m: MatchView }) {
  const rows: [string, string][] = [['Match', m.title], ['Format', m.format], ['Venue', `${m.venue}${m.city ? `, ${m.city}` : ''}`], ['Start', timeLabel(m.startTime)], ['Toss', m.toss ?? '-']];
  return (
    <View style={[st.card, { gap: 14 }]}>
      {rows.map(([k, v]) => <View key={k}><Text style={[st.muted, { textTransform: 'uppercase', fontWeight: '800', letterSpacing: 1 }]}>{k}</Text><Text style={{ color: c.text, fontWeight: '600', marginTop: 2 }}>{v}</Text></View>)}
    </View>
  );
}
