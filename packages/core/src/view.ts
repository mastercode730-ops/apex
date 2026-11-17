import type { MatchView } from './types';

/** Light list-level view of a match (no scorecard lines/commentary): small payload for lists and APIs. */
export function toListView(m: MatchView): MatchView {
  return { ...m, commentary: [], recentOvers: [], innings: m.innings.map((i) => ({ ...i, batting: [], bowling: [], fallOfWickets: [] })) };
}
