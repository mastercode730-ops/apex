import type { CricketProvider, MatchView } from './types';

/**
 * Contract every licensed data vendor adapter implements. The ingestion worker calls these on
 * a schedule, normalises the result into Apex types, and writes it to Postgres + cache.
 * Keep vendor-specific field names INSIDE the adapter; nothing outside should know them.
 */
export interface VendorAdapter {
  readonly name: string;
  /** Matches currently in play: poll every 1-5 s. */
  fetchLiveMatches(): Promise<MatchView[]>;
  /** Fixtures and results for a date window: poll every few hours. */
  fetchFixtures(from: Date, to: Date): Promise<MatchView[]>;
  /** Full scorecard and commentary for one match. */
  fetchMatch(sourceId: string): Promise<MatchView | undefined>;
}

export type ProviderName = 'demo' | 'database';

/** Provider selection is env-driven so switching from demo to real data needs no UI changes. */
export function providerName(): ProviderName {
  return (process.env.APEX_DATA_PROVIDER as ProviderName) === 'database' ? 'database' : 'demo';
}

export type { CricketProvider };
