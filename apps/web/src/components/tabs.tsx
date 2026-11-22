'use client';
import { useRef, useState } from 'react';

type Tab = { key: string; label: string; badge?: string | number; live?: boolean; content: React.ReactNode };

/** Underlined tab row ("Top Matches | Live (10)") with a right-hand slot. Panels are server-rendered, only the visible one is mounted. */
export function ContentTabs({ tabs, label, aside, variant = 'underline' }: { tabs: Tab[]; label: string; aside?: React.ReactNode; variant?: 'underline' | 'chips' }) {
  const [key, setKey] = useState(tabs[0]?.key);
  const current = tabs.find((t) => t.key === key) ?? tabs[0];
  if (!current) return null;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-4">
        <div role="tablist" aria-label={label} className="no-scrollbar -mx-1 flex min-w-0 gap-1 overflow-x-auto px-1">
          {tabs.map((t) => {
            const on = t.key === current.key;
            return (
              <button key={t.key} role="tab" type="button" aria-selected={on} onClick={() => setKey(t.key)} className={variant === 'chips' ? `chip ${on ? 'active' : ''}` : `utab ${on ? 'utab-on' : ''}`}>
                {t.live && <span className="live-dot" />}
                {t.label}{t.badge !== undefined && <span className="num font-medium opacity-70"> ({t.badge})</span>}
              </button>
            );
          })}
        </div>
        {aside && <div className="shrink-0 text-sm font-semibold">{aside}</div>}
      </div>
      <div role="tabpanel" key={current.key} className="page-in">{current.content}</div>
    </div>
  );
}

/** Horizontal snap-scroller with arrow buttons on pointer devices. */
export function HScroll({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const by = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * Math.max(280, ref.current.clientWidth * 0.8), behavior: 'smooth' });
  return (
    <div className="hscroll-wrap relative">
      <button type="button" aria-label="Scroll left" onClick={() => by(-1)} className="hs-btn left-0 -translate-x-1/2">‹</button>
      <div ref={ref} data-lenis-prevent className={`hscroll no-scrollbar ${className}`}>{children}</div>
      <button type="button" aria-label="Scroll right" onClick={() => by(1)} className="hs-btn right-0 translate-x-1/2">›</button>
    </div>
  );
}
