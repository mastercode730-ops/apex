import type { Team } from './types';
const T = (id: string, code: string, name: string, color: string, board: string, since: number, bio: string): Team => ({ id, code, name, color, board, since, bio });
export const teams: Team[] = [
  T('ind', 'IND', 'India', '#1e6bff', 'Board of Control for Cricket in India', 1932, 'India play their home internationals across a vast network of venues and are one of the most followed sides in world cricket.'),
  T('aus', 'AUS', 'Australia', '#f5c400', 'Cricket Australia', 1877, 'Australia contested the first ever Test match in 1877 and have won multiple World Cups across formats.'),
  T('eng', 'ENG', 'England', '#e8344e', 'England and Wales Cricket Board', 1877, 'England helped create the international game and are known for an aggressive modern white-ball and Test approach.'),
  T('nz', 'NZ', 'New Zealand', '#38bdf8', 'New Zealand Cricket', 1930, 'The Black Caps punch above their weight and are consistent finalists in global tournaments.'),
  T('sa', 'SA', 'South Africa', '#16a34a', 'Cricket South Africa', 1889, 'South Africa are famed for a world-class pace attack and are a perennial force in all formats.'),
  T('pak', 'PAK', 'Pakistan', '#10b981', 'Pakistan Cricket Board', 1952, 'Pakistan are renowned for producing fast bowlers and match-winners with flair.'),
  T('sl', 'SL', 'Sri Lanka', '#6366f1', 'Sri Lanka Cricket', 1982, 'Sri Lanka won the 1996 World Cup and have produced generations of spin and stroke-making talent.'),
  T('ban', 'BAN', 'Bangladesh', '#22c55e', 'Bangladesh Cricket Board', 2000, 'Bangladesh have grown rapidly since gaining Test status in 2000, with passionate home support.'),
  T('afg', 'AFG', 'Afghanistan', '#3b82f6', 'Afghanistan Cricket Board', 2017, 'Afghanistan have risen quickly, built on a world-class spin attack.'),
  T('wi', 'WI', 'West Indies', '#be185d', 'Cricket West Indies', 1928, 'The West Indies dominated cricket in the 1970s and 80s and remain a power in T20.'),
];
export const teamById = (id: string) => teams.find((t) => t.id === id);
