import type { Series, Format } from './types';
import { slugify } from './players';

const DAY = 86_400_000;
const d = (offset: number) => new Date(Date.now() - (Date.now() % DAY) + offset * DAY).toISOString();
const S = (short: string, name: string, format: Format[], teamIds: string[], start: number, end: number, kind: Series['kind']): Series => ({
  id: slugify(short), slug: `${slugify(name)}-${slugify(short)}`.slice(0, 60), name, short, format, teamIds, start: d(start), end: d(end), kind,
});

export const series: Series[] = [
  S('IND vs NZ 2026', 'India tour of New Zealand 2026', ['TEST', 'ODI', 'T20'], ['ind', 'nz'], -20, 14, 'International'),
  S('ENG vs AUS 2026', 'England tour of Australia 2026', ['ODI'], ['eng', 'aus'], -4, 14, 'International'),
  S('BAN vs SA 2026', 'Bangladesh tour of South Africa 2026', ['TEST'], ['ban', 'sa'], -2, 6, 'International'),
  S('SL vs PAK 2026', 'Pakistan tour of Sri Lanka 2026', ['TEST'], ['sl', 'pak'], -1, 7, 'International'),
  S('AFG vs WI 2026', 'West Indies tour of Afghanistan 2026', ['T20', 'ODI'], ['afg', 'wi'], 0, 18, 'International'),
  S('Apex T10 2026', 'Apex Premier T10 2026', ['T10'], ['ind', 'aus', 'eng', 'pak'], -6, 5, 'League'),
];
export const seriesById = (id: string) => series.find((s) => s.id === id);
