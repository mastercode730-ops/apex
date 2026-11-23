import Svg, { Circle, Path, Rect } from 'react-native-svg';

/**
 * Drawn icons (no icon font needed), so the bottom bar always renders.
 * `active` adds a soft fill and a heavier stroke.
 */
export type IconName = 'home' | 'trophy' | 'ball' | 'news' | 'grid' | 'sun' | 'moon';

export function Icon({ name, color, active = false, size = 24 }: { name: IconName; color: string; active?: boolean; size?: number }) {
  const line = { stroke: color, strokeWidth: active ? 2.1 : 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;
  const body = { ...line, fill: active ? color : 'none', fillOpacity: active ? 0.25 : 0 } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'home' && <Path {...body} d="M3.5 11 12 3.5 20.5 11V19a1.5 1.5 0 0 1-1.5 1.5h-4.2v-5.6H9.2v5.6H5A1.5 1.5 0 0 1 3.5 19z" />}
      {name === 'trophy' && (<>
        <Path {...body} d="M7.5 3.5h9v6a4.5 4.5 0 0 1-9 0z" />
        <Path {...line} d="M7.5 5.5H4.5V7a3 3 0 0 0 3 3M16.5 5.5h3V7a3 3 0 0 1-3 3M12 14v4M8.5 20.5h7" />
      </>)}
      {name === 'ball' && (<>
        <Circle {...body} cx="12" cy="12" r="8.5" />
        <Path {...line} d="M7.2 5.8c2.6 2.9 2.6 9.5 0 12.4M16.8 5.8c-2.6 2.9-2.6 9.5 0 12.4" />
      </>)}
      {name === 'news' && (<>
        <Rect {...body} x="4" y="4" width="16" height="16" rx="2.5" />
        <Path {...line} d="M8 9h8M8 13h8M8 16.5h5" />
      </>)}
      {name === 'grid' && (<>
        <Rect {...body} x="4" y="4" width="7" height="7" rx="2" /><Rect {...body} x="13" y="4" width="7" height="7" rx="2" />
        <Rect {...body} x="4" y="13" width="7" height="7" rx="2" /><Rect {...body} x="13" y="13" width="7" height="7" rx="2" />
      </>)}
      {name === 'moon' && <Path {...body} d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />}
      {name === 'sun' && (<>
        <Circle {...line} cx="12" cy="12" r="4" />
        <Path {...line} d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" />
      </>)}
    </Svg>
  );
}
