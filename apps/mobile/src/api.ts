// Types are imported from the shared core package as TYPE-ONLY imports, so nothing from it is bundled.
import type { Article, MatchView, Player, RankingEntry, Series, Team } from '../../../packages/core/src/types';

export type { Article, MatchView, Player, RankingEntry, Series, Team };
export type Refs = { teams: Record<string, { name: string; code: string; color: string }>; players: Record<string, { name: string; role: string }> };
export type Envelope<T> = { data: T; refs?: Refs };

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export async function api<T>(path: string, signal?: AbortSignal): Promise<Envelope<T>> {
  const res = await fetch(`${API_URL}/api/v1${path}`, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) {
    let msg = `Server error (${res.status})`;
    try { msg = (await res.json()).error ?? msg; } catch { /* keep default */ }
    throw new Error(msg);
  }
  return res.json();
}

export const teamLabel = (refs: Refs | undefined, id: string) => refs?.teams[id] ?? { name: id.toUpperCase(), code: id.slice(0, 3).toUpperCase(), color: '#334' };
export const playerName = (refs: Refs | undefined, id: string) => refs?.players[id]?.name ?? id;

export function timeLabel(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} · ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
}
export function ago(iso: string) {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} hr ago` : new Date(iso).toLocaleDateString();
}
