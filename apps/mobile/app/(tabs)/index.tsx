import { useApi } from '../../src/useApi';
import { MatchCard, Screen, Section } from '../../src/ui';
import type { MatchView } from '../../src/api';

const byStart = (a: MatchView, b: MatchView) => +new Date(a.startTime) - +new Date(b.startTime);

export default function Home() {
  const { data, refs, loading, error, refreshing, refresh } = useApi<MatchView[]>('/matches', 10_000);
  const live = (data ?? []).filter((m) => m.status === 'live');
  const upcoming = (data ?? []).filter((m) => m.status === 'upcoming').sort(byStart).slice(0, 6);
  const done = (data ?? []).filter((m) => m.status === 'completed').sort((a, b) => byStart(b, a)).slice(0, 8);
  return (
    <Screen loading={loading} error={error} refreshing={refreshing} onRefresh={refresh} empty={data && !data.length ? 'No matches right now. Check back soon.' : undefined}>
      {live.length > 0 && <Section title={`Live now (${live.length})`}>{live.map((m, i) => <MatchCard key={m.id} m={m} refs={refs} index={i} />)}</Section>}
      {upcoming.length > 0 && <Section title="Upcoming">{upcoming.map((m, i) => <MatchCard key={m.id} m={m} refs={refs} index={i} />)}</Section>}
      {done.length > 0 && <Section title="Recent results">{done.map((m, i) => <MatchCard key={m.id} m={m} refs={refs} index={i} />)}</Section>}
    </Screen>
  );
}
