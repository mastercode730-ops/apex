import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyTheme, type Scheme } from './theme';

export type Mode = 'system' | 'light' | 'dark';
const KEY = 'apex-theme';

type Ctx = { mode: Mode; scheme: Scheme; ready: boolean; setMode: (m: Mode) => void; toggle: () => void };
const ThemeCtx = createContext<Ctx>({ mode: 'system', scheme: 'dark', ready: false, setMode: () => {}, toggle: () => {} });

/** Holds the user's choice (System / Light / Dark), saves it on the phone and applies the palette. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<Mode>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => { if (v === 'light' || v === 'dark' || v === 'system') setModeState(v); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const scheme: Scheme = mode === 'system' ? (system === 'light' ? 'light' : 'dark') : mode;
  applyTheme(scheme); // runs before children render, so they read the right colours

  const setMode = useCallback((m: Mode) => { setModeState(m); AsyncStorage.setItem(KEY, m).catch(() => {}); }, []);
  const toggle = useCallback(() => setMode(scheme === 'dark' ? 'light' : 'dark'), [scheme, setMode]);
  const value = useMemo(() => ({ mode, scheme, ready, setMode, toggle }), [mode, scheme, ready, setMode, toggle]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

/** Call at the top of a screen/component so it re-renders when the theme changes. */
export const useTheme = () => useContext(ThemeCtx);
