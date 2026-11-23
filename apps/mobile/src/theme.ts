export type Scheme = 'dark' | 'light';

const dark = {
  bg: '#080b12', surface: '#0f1522', surface2: '#161e30', line: '#222c42',
  text: '#eef2fb', muted: '#94a0b8', accent: '#c6ff3d', accentInk: '#0a1200',
  blue: '#7c9cff', live: '#ff4d6a', good: '#4ade80', amber: '#f5b942',
};
const light: typeof dark = {
  bg: '#f4f6fb', surface: '#ffffff', surface2: '#eef1f8', line: '#dde3ef',
  text: '#0b1020', muted: '#5a6478', accent: '#4d7c00', accentInk: '#ffffff',
  blue: '#2f5bff', live: '#e11d48', good: '#15803d', amber: '#b45309',
};

/**
 * Live colour palette. It is mutated in place when the theme changes (see ThemeProvider), so every
 * `c.something` read during a render picks up the current theme. Style sheets that depend on it
 * register a rebuild callback with `onTheme`.
 */
export const c: typeof dark = { ...dark };
let current: Scheme = 'dark';
const subs: (() => void)[] = [];
export const onTheme = (fn: () => void) => { subs.push(fn); };
export const currentScheme = () => current;
export function applyTheme(s: Scheme) {
  if (s === current) return;
  current = s;
  Object.assign(c, s === 'dark' ? dark : light);
  subs.forEach((fn) => fn());
}

/** `#rrggbb` + alpha (0-1) as an rgba() string, for tints that must follow the theme. */
export const tint = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export const r = { sm: 8, md: 14, lg: 20, pill: 999 };
export const fonts = { display: { fontWeight: '800' as const, letterSpacing: -0.3 } };
