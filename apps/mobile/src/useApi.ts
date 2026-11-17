import { useCallback, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api, type Refs } from './api';

/**
 * Fetches `path` when the screen gains focus and (optionally) re-fetches every `refreshMs`
 * while the screen is focused AND the app is in the foreground, so live scores update without draining battery.
 */
export function useApi<T>(path: string | null, refreshMs = 0) {
  const [state, setState] = useState<{ data?: T; refs?: Refs; error?: string; loading: boolean }>({ loading: true });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!path) return;
    try { const j = await api<T>(path); setState({ data: j.data, refs: j.refs, loading: false }); }
    catch (e) { setState((s) => ({ ...s, error: (e as Error).message, loading: false })); }
  }, [path]);

  useFocusEffect(useCallback(() => {
    load();
    if (!refreshMs) return;
    const t = setInterval(() => { if (AppState.currentState === 'active') load(); }, refreshMs);
    return () => clearInterval(t);
  }, [load, refreshMs]));

  const refresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);
  return { ...state, refreshing, refresh };
}
