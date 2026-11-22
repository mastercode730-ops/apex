'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useInView, animate } from 'framer-motion';

/** Staggered scroll-reveal wrapper. */
export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -8% 0px' });
  return (
    <motion.div ref={ref} className={className} initial={{ opacity: 0, y: 18 }} animate={inView ? { opacity: 1, y: 0 } : undefined} transition={{ duration: 0.55, delay, ease: [0.2, 0.8, 0.2, 1] }}>
      {children}
    </motion.div>
  );
}

/** Rolls a number from its previous value to the new one. */
export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [shown, setShown] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const c = animate(prev.current, value, { duration: 0.6, ease: 'easeOut', onUpdate: (v) => setShown(Math.round(v)) });
    prev.current = value;
    return () => c.stop();
  }, [value]);
  return <span className={`num ${className ?? ''}`}>{shown}</span>;
}

/** Re-fetches server data on an interval while the tab is visible. */
export function LiveRefresh({ every = 5000, matchId }: { every?: number; matchId?: string }) {
  const router = useRouter();
  useEffect(() => {
    let poll: ReturnType<typeof setInterval> | undefined;
    let es: EventSource | undefined;
    const startPolling = () => { poll = setInterval(() => { if (document.visibilityState === 'visible') router.refresh(); }, every); };
    if (matchId && typeof EventSource !== 'undefined') {
      let first = true;
      es = new EventSource(`/api/matches/${matchId}/stream`);
      es.addEventListener('update', () => { if (first) { first = false; return; } if (document.visibilityState === 'visible') router.refresh(); });
      es.onerror = () => { es?.close(); es = undefined; if (!poll) startPolling(); }; // graceful fallback
    } else startPolling();
    return () => { es?.close(); if (poll) clearInterval(poll); };
  }, [router, every, matchId]);
  return null;
}

export function WinProb({ t1, t2, p1 }: { t1: string; t2: string; p1: number }) {
  const pct = Math.round(p1 * 100);
  return (
    <div aria-label={`Win probability: ${t1} ${pct}%, ${t2} ${100 - pct}%`}>
      <div className="mb-2 flex justify-between text-sm font-bold"><span>{t1} <span className="num text-accent">{pct}%</span></span><span><span className="num text-blue">{100 - pct}%</span> {t2}</span></div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-surface2">
        <motion.div className="h-full bg-accent" animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 80, damping: 18 }} />
        <motion.div className="h-full bg-blue" animate={{ width: `${100 - pct}%` }} transition={{ type: 'spring', stiffness: 80, damping: 18 }} />
      </div>
    </div>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  useEffect(() => { setTheme((document.documentElement.dataset.theme as 'light' | 'dark') ?? 'dark'); }, []);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next); document.documentElement.dataset.theme = next;
    try { localStorage.setItem('apex-theme', next); } catch {}
  };
  return (
    <button onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} className="grid size-10 place-items-center rounded-full border border-line bg-surface text-lg transition hover:scale-110">
      <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
    </button>
  );
}

export function MobileMenu({ items }: { items: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button aria-expanded={open} aria-controls="mobile-nav" aria-label="Menu" onClick={() => setOpen((o) => !o)} className="grid size-10 place-items-center rounded-full border border-line bg-surface">
        <span aria-hidden="true">{open ? '✕' : '☰'}</span>
      </button>
      {open && (
        <motion.nav id="mobile-nav" aria-label="Mobile" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="absolute inset-x-0 top-full border-b border-line bg-bg/95 p-4 backdrop-blur">
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {items.map((i) => <li key={i.href}><a href={i.href} onClick={() => setOpen(false)} className="block rounded-xl bg-surface px-4 py-3.5 font-semibold">{i.label}</a></li>)}
          </ul>
        </motion.nav>
      )}
    </div>
  );
}

/** Consent-gated GA4. No analytics scripts load until the visitor accepts. */
export function Consent({ gaId }: { gaId?: string }) {
  const [state, setState] = useState<'unknown' | 'granted' | 'denied'>('denied');
  useEffect(() => {
    let v: string | null = null;
    try { v = localStorage.getItem('apex-consent'); } catch {}
    setState(v === 'granted' ? 'granted' : v === 'denied' ? 'denied' : 'unknown');
  }, []);
  useEffect(() => {
    if (state !== 'granted' || !gaId || document.getElementById('ga4')) return;
    const s = document.createElement('script'); s.id = 'ga4'; s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`; document.head.appendChild(s);
    const w = window as unknown as { dataLayer: unknown[] };
    w.dataLayer = w.dataLayer || [];
    const gtag = (...a: unknown[]) => { w.dataLayer.push(a); };
    gtag('js', new Date()); gtag('config', gaId, { anonymize_ip: true });
  }, [state, gaId]);
  const choose = (v: 'granted' | 'denied') => { setState(v); try { localStorage.setItem('apex-consent', v); } catch {} };
  if (state !== 'unknown') return null;
  return (
    <motion.div role="dialog" aria-label="Cookie consent" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="card consent-card fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-2xl flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <p className="flex-1 text-sm text-muted">We use privacy-friendly analytics only if you agree. See our <a className="text-accent underline" href="/privacy-policy">Privacy Policy</a>.</p>
      <div className="flex gap-2">
        <button onClick={() => choose('denied')} className="chip">Decline</button>
        <button onClick={() => choose('granted')} className="chip active">Accept</button>
      </div>
    </motion.div>
  );
}

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setStatus('sending'); setMsg('');
    const fd = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    try {
      const r = await fetch('/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(fd) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Something went wrong');
      setStatus('ok'); (e.target as HTMLFormElement).reset();
    } catch (err) { setStatus('error'); setMsg(err instanceof Error ? err.message : 'Something went wrong'); }
  }
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY;
  useEffect(() => {
    if (!siteKey || document.getElementById('cf-ts')) return;
    const sc = document.createElement('script'); sc.id = 'cf-ts'; sc.async = true; sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'; document.head.appendChild(sc);
  }, [siteKey]);
  const field = 'w-full min-w-0 rounded-xl border border-line bg-surface2 px-4 py-3 outline-none transition focus:border-accent';
  return (
    <form onSubmit={onSubmit} className="card grid max-w-xl gap-4 p-4 sm:p-6" noValidate>
      <label className="grid gap-1.5 text-sm font-semibold">Name<input name="name" required minLength={2} maxLength={80} autoComplete="name" className={field} /></label>
      <label className="grid gap-1.5 text-sm font-semibold">Email<input name="email" type="email" required maxLength={120} autoComplete="email" className={field} /></label>
      <label className="grid gap-1.5 text-sm font-semibold">Message<textarea name="message" required minLength={10} maxLength={2000} rows={5} className={field} /></label>
      {siteKey && <div className="cf-turnstile" data-sitekey={siteKey} />}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" /> {/* honeypot */}
      <button disabled={status === 'sending'} className="rounded-xl bg-accent px-5 py-3 font-bold text-accentink transition hover:brightness-110 disabled:opacity-60">{status === 'sending' ? 'Sending…' : 'Send message'}</button>
      <p role="status" aria-live="polite" className={`text-sm ${status === 'ok' ? 'text-good' : 'text-live'}`}>
        {status === 'ok' && 'Thanks! Your message was received.'}{status === 'error' && msg}
      </p>
    </form>
  );
}
