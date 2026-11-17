import type { Article, RankingEntry, StatRow } from './types';
import { players, slugify } from './players';
import { teams } from './teams';
import { hash, rng } from './rng';
import { maxOvers } from './engine';
import type { Format } from './types';

export type RankKind = 'team' | 'batter' | 'bowler' | 'allrounder';
export type RankFormat = 'TEST' | 'ODI' | 'T20';

const womenPool: [string, string, string][] = [
  ['Smriti Mandhana', 'ind', 'bat'], ['Harmanpreet Kaur', 'ind', 'bat'], ['Jemimah Rodrigues', 'ind', 'bat'], ['Deepti Sharma', 'ind', 'all'], ['Renuka Singh', 'ind', 'bowl'],
  ['Ellyse Perry', 'aus', 'all'], ['Beth Mooney', 'aus', 'bat'], ['Alyssa Healy', 'aus', 'bat'], ['Ashleigh Gardner', 'aus', 'all'], ['Megan Schutt', 'aus', 'bowl'],
  ['Nat Sciver-Brunt', 'eng', 'all'], ['Heather Knight', 'eng', 'bat'], ['Sophie Ecclestone', 'eng', 'bowl'], ['Amy Jones', 'eng', 'bat'],
  ['Laura Wolvaardt', 'sa', 'bat'], ['Marizanne Kapp', 'sa', 'all'], ['Nonkululeko Mlaba', 'sa', 'bowl'], ['Amelia Kerr', 'nz', 'all'], ['Suzie Bates', 'nz', 'bat'],
  ['Chamari Athapaththu', 'sl', 'all'], ['Nida Dar', 'pak', 'all'], ['Hayley Matthews', 'wi', 'all'], ['Nahida Akter', 'ban', 'bowl'],
];

export function rankings(kind: RankKind, format: RankFormat, gender: 'men' | 'women' = 'men'): RankingEntry[] {
  const r = rng(hash(`${gender}-${kind}-${format}`));
  if (gender === 'women' && kind !== 'team') {
    const ok = (t: string) => kind === 'batter' ? t !== 'bowl' : kind === 'bowler' ? t !== 'bat' : t === 'all';
    return womenPool.filter((w) => ok(w[2])).map((w) => ({ w, v: 540 + Math.floor(r() * 340) })).sort((a, b) => b.v - a.v).slice(0, 12)
      .map((x, i) => ({ rank: i + 1, prev: Math.max(1, i + 1 + (Math.floor(r() * 3) - 1)), teamId: x.w[1], name: x.w[0], rating: x.v }));
  }
  if (kind === 'team') {
    return teams.map((t) => ({ t, v: 100 + Math.floor(r() * 80) })).sort((a, b) => b.v - a.v)
      .map((x, i) => ({ rank: i + 1, prev: Math.max(1, i + 1 + (Math.floor(r() * 3) - 1)), teamId: x.t.id, name: x.t.name, rating: x.v }));
  }
  const want = (p: (typeof players)[number]) =>
    kind === 'batter' ? p.role === 'Batter' || p.role === 'Wicketkeeper' || p.role === 'All-rounder'
      : kind === 'bowler' ? p.role === 'Bowler' || p.role === 'All-rounder'
        : p.role === 'All-rounder';
  return players.filter(want).map((p) => ({ p, v: 520 + Math.floor(r() * 380) })).sort((a, b) => b.v - a.v).slice(0, 15)
    .map((x, i) => ({ rank: i + 1, prev: Math.max(1, i + 1 + (Math.floor(r() * 3) - 1)), playerId: x.p.id, teamId: x.p.teamId, name: x.p.name, rating: x.v }));
}

export const statCategories = [
  { id: 'most-runs', label: 'Most Runs' }, { id: 'most-wickets', label: 'Most Wickets' }, { id: 'highest-strike-rate', label: 'Highest Strike Rate' },
  { id: 'most-hundreds', label: 'Most Hundreds' }, { id: 'most-sixes', label: 'Most Sixes' }, { id: 'most-fours', label: 'Most Fours' }, { id: 'most-fifties', label: 'Most Fifties' },
] as const;

export function stats(category: string, seriesId: string): StatRow[] {
  const r = rng(hash(`${category}-${seriesId}`));
  const bowlerCat = category === 'most-wickets';
  const pool = players.filter((p) => (bowlerCat ? p.role === 'Bowler' || p.role === 'All-rounder' : p.role !== 'Bowler'));
  const scale: Record<string, number> = { 'most-runs': 420, 'most-wickets': 16, 'highest-strike-rate': 90, 'most-hundreds': 3, 'most-sixes': 20, 'most-fours': 45, 'most-fifties': 5 };
  const base = scale[category] ?? 100;
  return pool.map((p) => ({ p, v: category === 'highest-strike-rate' ? 120 + Math.floor(r() * 90) : Math.max(1, Math.round(base * (0.25 + r() * 0.85))) }))
    .sort((a, b) => b.v - a.v).slice(0, 15)
    .map((x, i) => ({ rank: i + 1, playerId: x.p.id, teamId: x.p.teamId, matches: 3 + Math.floor(r() * 8), value: x.v, extra: undefined }));
}

const NOW = () => Date.now();
const A = (category: Article['category'], title: string, excerpt: string, author: string, minsAgo: number, teamIds: string[] = [], seriesId?: string): Article => ({
  id: slugify(title).slice(0, 40), slug: slugify(title).slice(0, 80), category, title, excerpt, author,
  publishedAt: new Date(NOW() - minsAgo * 60_000).toISOString(), teamIds, seriesId,
  body: [
    excerpt,
    'This is demonstration copy for the Apex platform. In production, editorial content is authored in the CMS and published through the news API, with bylines, sources and corrections handled by the editorial team.',
    'Apex does not republish third-party articles. All editorial on this site is original or licensed, and statistics are provided by the configured cricket data provider.',
  ],
});
export const articles: Article[] = [
  A('news', 'Rain delay stalls opening Test as hosts hold the edge', 'Persistent showers at the Wanderers forced an early stop on day three with the home side in a commanding position.', 'Aarav M.', 12, ['ban', 'sa'], 'ban-vs-sa-2026'),
  A('records', 'Record opening stand headlines a high-scoring ODI in Adelaide', 'The visitors posted their highest ODI total at the venue as the openers combined for a landmark partnership.', 'Priya S.', 45, ['eng', 'aus'], 'eng-vs-aus-2026'),
  A('analysis', 'Why the middle overs decide this T20 series', 'A look at spin matchups, powerplay returns and death-over execution shaping the Auckland contests.', 'Kabir R.', 120, ['ind', 'nz'], 'ind-vs-nz-2026'),
  A('prediction', 'Predicted XI: how India line up for the second T20', 'Selectors face a pace-versus-spin call on a Bay Oval surface that traditionally assists seamers.', 'Neha T.', 190, ['ind', 'nz'], 'ind-vs-nz-2026'),
  A('listicles', 'Five highest T10 totals in tournament history', 'From explosive powerplays to relentless finishers, the biggest team totals the short format has produced.', 'Sam L.', 260, ['pak', 'aus'], 'apex-t10-2026'),
  A('reactions', 'Captains react after a tense finish in Abu Dhabi', 'Both skippers praised their bowlers while admitting the margins were fine in a thriller.', 'Aarav M.', 330, ['eng', 'ind'], 'apex-t10-2026'),
  A('stories', 'The long road back: a pacer rebuilds after injury', 'Eighteen months of rehab, a changed action and a return to international colours.', 'Priya S.', 520, ['pak']),
  A('news', 'Pakistan name unchanged squad for second Test in Rawalpindi', 'The selectors kept faith with the side that played in Galle, with a spinner on standby.', 'Kabir R.', 640, ['pak', 'sl'], 'sl-vs-pak-2026'),
  A('analysis', 'Spin or pace: reading the Sharjah surface', 'Historical scoring patterns suggest a slow, low surface where adaptability will matter.', 'Neha T.', 800, ['afg', 'wi'], 'afg-vs-wi-2026'),
  A('records', 'Fastest to 1,000 ODI runs against a single opposition', 'A statistical dive into head-to-head dominance in the 50-over format.', 'Sam L.', 1300, ['ind', 'nz']),
];
export const articleBySlug = (slug: string) => articles.find((a) => a.slug === slug);
export const categoryLabels: Record<Article['category'], string> = {
  news: 'Cricket News', records: 'Cricket Records', analysis: 'Cricket Analysis', prediction: 'Cricket Prediction',
  reactions: 'Cricket Reactions', listicles: 'Cricket Listicles', stories: 'Cricket Stories',
};

export interface PointsRow { teamId: string; played: number; won: number; lost: number; noResult: number; points: number; nrr: number; }
interface PtsMatch { team1Id: string; team2Id: string; winnerId?: string; format?: Format; innings?: { battingTeamId: string; runs: number; wickets: number; ballsBowled: number }[]; }
/** Points table from completed matches: 2 pts per win, 1 each for no result. NRR uses real run/over data (all out = full quota). */
export function pointsTable(teamIds: string[], completed: PtsMatch[]): PointsRow[] {
  type Acc = PointsRow & { rf: number; bf: number; ra: number; ba: number };
  const rows = new Map<string, Acc>(teamIds.map((id) => [id, { teamId: id, played: 0, won: 0, lost: 0, noResult: 0, points: 0, nrr: 0, rf: 0, bf: 0, ra: 0, ba: 0 }]));
  for (const m of completed) {
    for (const id of [m.team1Id, m.team2Id]) {
      const row = rows.get(id); if (!row) continue;
      row.played++;
      if (m.winnerId === id) { row.won++; row.points += 2; } else if (m.winnerId) row.lost++; else { row.noResult++; row.points += 1; }
    }
    if (m.winnerId && m.format && m.format !== 'TEST' && m.innings && m.innings.length === 2) {
      const quota = maxOvers(m.format) * 6;
      for (const inn of m.innings) {
        const bat = rows.get(inn.battingTeamId); const opp = rows.get(inn.battingTeamId === m.team1Id ? m.team2Id : m.team1Id);
        const balls = inn.wickets >= 10 ? quota : inn.ballsBowled;
        if (bat) { bat.rf += inn.runs; bat.bf += balls; }
        if (opp) { opp.ra += inn.runs; opp.ba += balls; }
      }
    }
  }
  return [...rows.values()].map((x) => ({ teamId: x.teamId, played: x.played, won: x.won, lost: x.lost, noResult: x.noResult, points: x.points,
    nrr: x.bf && x.ba ? +((x.rf / (x.bf / 6)) - (x.ra / (x.ba / 6))).toFixed(3) : 0 })).sort((a, b) => b.points - a.points || b.nrr - a.nrr);
}

export interface CareerRow { format: RankFormat; matches: number; runs: number; avg: number; sr: number; hundreds: number; wickets: number; econ: number; best: string; }
export function careerStats(playerId: string): CareerRow[] {
  return (['TEST', 'ODI', 'T20'] as const).map((format) => {
    const r = rng(hash(`${playerId}-${format}`));
    const matches = Math.floor((format === 'TEST' ? 40 : format === 'ODI' ? 90 : 70) * (0.5 + r()));
    const runs = Math.floor(matches * (format === 'TEST' ? 45 : format === 'ODI' ? 38 : 24) * (0.5 + r()));
    const wickets = Math.floor(matches * (0.2 + r() * 1.4));
    return { format, matches, runs, avg: +(runs / Math.max(1, matches * 0.8)).toFixed(2), sr: +((format === 'TEST' ? 48 : format === 'ODI' ? 88 : 138) * (0.85 + r() * 0.3)).toFixed(1),
      hundreds: Math.floor(runs / (format === 'TEST' ? 900 : 1500)), wickets, econ: +((format === 'TEST' ? 3.1 : format === 'ODI' ? 5.2 : 7.8) * (0.85 + r() * 0.3)).toFixed(2), best: `${1 + Math.floor(r() * 5)}/${10 + Math.floor(r() * 40)}` };
  });
}
