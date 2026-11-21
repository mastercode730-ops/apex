'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Advertising (Google AdSense). Fully driven by env vars, so it ships "off" and costs nothing until configured:
 *   NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
 *   NEXT_PUBLIC_AD_SLOT_BANNER / _RECT / _INFEED / _ARTICLE / _ANCHOR = ad unit ids from AdSense
 *   NEXT_PUBLIC_ADS_PREVIEW=true   shows labelled placeholders so the layout can be reviewed before ads are live
 *
 * Rules built in: never on utility/legal pages, space is reserved (no layout shift), unfilled slots collapse,
 * and visitors who have not accepted cookies only get non-personalised ads.
 */
export type AdKind = 'banner' | 'rect' | 'infeed' | 'article';

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const PREVIEW = process.env.NEXT_PUBLIC_ADS_PREVIEW === 'true';
const SLOTS: Record<AdKind | 'anchor', string | undefined> = {
  banner: process.env.NEXT_PUBLIC_AD_SLOT_BANNER,
  rect: process.env.NEXT_PUBLIC_AD_SLOT_RECT,
  infeed: process.env.NEXT_PUBLIC_AD_SLOT_INFEED,
  article: process.env.NEXT_PUBLIC_AD_SLOT_ARTICLE,
  anchor: process.env.NEXT_PUBLIC_AD_SLOT_ANCHOR,
};
/** Pages that must stay ad-free (policy/low-content/utility pages). */
const NO_ADS = /^\/(admin|contact|privacy-policy|terms-and-conditions|community-guidelines|editorial-policy|search)(\/|$)/;

const enabled = (kind: AdKind | 'anchor') => PREVIEW || !!(CLIENT && SLOTS[kind]);

declare global { interface Window { adsbygoogle?: Record<string, unknown>[] & { requestNonPersonalizedAds?: number } } }

let scriptAdded = false;
function loadScript() {
  if (scriptAdded || !CLIENT || document.getElementById('adsense-js')) { scriptAdded = true; return; }
  scriptAdded = true;
  let consent = ''; try { consent = localStorage.getItem('apex-consent') ?? ''; } catch {}
  window.adsbygoogle = window.adsbygoogle || [];
  if (consent !== 'granted') window.adsbygoogle.requestNonPersonalizedAds = 1;
  const s = document.createElement('script');
  s.id = 'adsense-js'; s.async = true; s.crossOrigin = 'anonymous';
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`;
  document.head.appendChild(s);
}

/** Reserved heights per format so the page never jumps when an ad arrives. */
const BOX: Record<AdKind, string> = {
  banner: 'min-h-[50px] md:min-h-[90px]',
  rect: 'min-h-[250px]',
  infeed: 'min-h-[250px]',
  article: 'min-h-[250px]',
};

function Unit({ kind, slot }: { kind: AdKind | 'anchor'; slot?: string }) {
  const ref = useRef<HTMLModElement>(null);
  const done = useRef(false);
  useEffect(() => {
    if (!CLIENT || !slot || done.current || !ref.current) return;
    done.current = true; loadScript();
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}
  }, [slot]);
  if (!CLIENT || !slot) {
    return <div className={`ad-placeholder ${kind === 'anchor' ? 'min-h-[50px]' : BOX[kind]}`}>{kind} ad slot{CLIENT ? '' : ' (preview)'}</div>;
  }
  return <ins ref={ref} className={`adsbygoogle block ${kind === 'anchor' ? 'min-h-[50px]' : BOX[kind]}`} data-ad-client={CLIENT} data-ad-slot={slot} data-ad-format={kind === 'infeed' ? 'fluid' : 'auto'} data-full-width-responsive="true" />;
}

/** One ad placement. `className` positions the wrapper (e.g. `lg:col-span-2`, `my-8`). */
export function AdSlot({ kind, className = '' }: { kind: AdKind; className?: string }) {
  const path = usePathname();
  if (!enabled(kind) || NO_ADS.test(path)) return null;
  return (
    <aside aria-label="Advertisement" className={`ad-wrap ${kind === 'rect' ? 'mx-auto w-full max-w-[336px] sm:max-w-none' : ''} ${className}`}>
      <p className="ad-label">Advertisement</p>
      <Unit kind={kind} slot={SLOTS[kind]} />
    </aside>
  );
}

/** Sticky mobile banner pinned to the bottom of the screen; dismissible for the visit. */
export function AnchorAd() {
  const path = usePathname();
  const [closed, setClosed] = useState(false);
  const show = enabled('anchor') && !closed && !NO_ADS.test(path);
  useEffect(() => {
    const r = document.documentElement;
    if (show) r.setAttribute('data-anchor-ad', ''); else r.removeAttribute('data-anchor-ad');
    return () => r.removeAttribute('data-anchor-ad');
  }, [show]);
  if (!show) return null;
  return (
    <div className="anchor-ad md:hidden" role="complementary" aria-label="Advertisement">
      <button type="button" aria-label="Close ad" onClick={() => setClosed(true)} className="anchor-ad-close">✕</button>
      <Unit kind="anchor" slot={SLOTS.anchor} />
    </div>
  );
}

/** Dismissible "get the app" strip for phones (like most sports sites). Needs a store link env var. */
export function AppBanner({ ios, android }: { ios?: string; android?: string }) {
  const [hidden, setHidden] = useState(true);
  const [href, setHref] = useState<string>();
  useEffect(() => {
    let dismissed = false; try { dismissed = localStorage.getItem('apex-app-banner') === '1'; } catch {}
    const ua = navigator.userAgent;
    const link = /iPhone|iPad|iPod/i.test(ua) ? ios : /Android/i.test(ua) ? android : undefined;
    setHref(link); setHidden(dismissed || !link);
  }, [ios, android]);
  if (hidden || !href) return null;
  const close = () => { setHidden(true); try { localStorage.setItem('apex-app-banner', '1'); } catch {} };
  return (
    <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-2 md:hidden">
      <button type="button" aria-label="Dismiss" onClick={close} className="grid size-8 place-items-center rounded-full text-muted">✕</button>
      <span aria-hidden="true" className="grid size-9 place-items-center rounded-lg bg-accent text-accentink">▲</span>
      <p className="min-w-0 flex-1 text-sm"><b>Apex app</b><span className="block truncate text-xs text-muted">Faster live scores &amp; alerts</span></p>
      <a href={href} rel="noopener" className="btn btn-primary !min-h-8 !px-4 !py-1 text-sm">Open</a>
    </div>
  );
}
