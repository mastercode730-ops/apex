export type Format = 'T20' | 'ODI' | 'TEST' | 'T10';
export type MatchStatus = 'live' | 'upcoming' | 'completed';
export type Role = 'Batter' | 'Bowler' | 'All-rounder' | 'Wicketkeeper';

export interface Team { id: string; code: string; name: string; color: string; board: string; since: number; bio: string; }
export interface Player { id: string; name: string; teamId: string; role: Role; battingStyle: string; bowlingStyle: string; born: string; }
export interface Series { id: string; slug: string; name: string; short: string; format: Format[]; teamIds: string[]; start: string; end: string; kind: 'International' | 'League' | 'Domestic'; }

export interface Ball {
  over: number; ball: number; batterId: string; bowlerId: string;
  runs: number; extra?: 'wd' | 'nb'; wicket?: { kind: string; playerId: string };
}
export interface BatLine { playerId: string; runs: number; balls: number; fours: number; sixes: number; out?: string; onStrike?: boolean; }
export interface BowlLine { playerId: string; overs: string; maidens: number; runs: number; wickets: number; econ: number; }
export interface InningsView {
  battingTeamId: string; runs: number; wickets: number; overs: string; ballsBowled: number; runRate: number;
  batting: BatLine[]; bowling: BowlLine[]; fallOfWickets: { runs: number; wicket: number; playerId: string; over: string }[];
  extras: number; complete: boolean; target?: number; partnership: { runs: number; balls: number };
}
export interface CommentaryItem { id: string; over: string; text: string; runs: number; kind: 'ball' | 'wicket' | 'four' | 'six'; }
export interface MatchView {
  id: string; slug: string; seriesId: string; title: string; format: Format; status: MatchStatus;
  team1Id: string; team2Id: string; venue: string; city: string; startTime: string;
  toss?: string; innings: InningsView[]; result?: string; statusLine: string;
  winProb?: { team1: number; team2: number };
  commentary: CommentaryItem[]; recentOvers: { over: number; balls: string[]; runs: number }[];
  umpires: string[]; winnerId?: string;
}
export interface RankingEntry { rank: number; prev: number; playerId?: string; teamId: string; name: string; rating: number; }
export interface Article {
  id: string; slug: string; category: 'news' | 'records' | 'analysis' | 'prediction' | 'reactions' | 'listicles' | 'stories';
  title: string; excerpt: string; body: string[]; author: string; publishedAt: string; seriesId?: string; teamIds?: string[];
}
export interface StatRow { rank: number; playerId: string; teamId: string; matches: number; value: number; extra?: string; }

/** Pluggable data source. Swap the demo engine for a licensed live-data feed. */
export interface CricketProvider {
  listMatches(): MatchView[];
  getMatch(id: string): MatchView | undefined;
}
