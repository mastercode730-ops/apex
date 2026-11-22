'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
declare global { interface Window { __lenis?: Lenis } }

/**
 * Inertial smooth scrolling (Lenis) + scroll-state flags on <html> used by the header and progress bar.
 * Native scrolling is kept for touch devices (it is already smooth there) and for reduced-motion users.
 */
export function SmoothScroll() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    const root = document.documentElement;
    let raf = 0;
    const onScroll = () => {
      const y = window.scrollY, max = root.scrollHeight - window.innerHeight;
      root.style.setProperty('--scroll', max > 0 ? String(Math.min(1, y / max)) : '0');
      root.toggleAttribute('data-scrolled', y > 8);
    };
    let lenis: Lenis | undefined;
    if (!reduced()) {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1, anchors: { offset: -80 } });
      window.__lenis = lenis;
      const loop = (t: number) => { lenis!.raf(t); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
      lenis.on('scroll', onScroll);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); lenis?.destroy(); window.__lenis = undefined; };
  }, []);

  // New page = start at the top (Lenis keeps its own scroll position otherwise).
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true }); else window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/** Thin accent bar at the top showing how far down the page you are. */
export function ScrollProgress() {
  return <div aria-hidden="true" className="scroll-progress" />;
}

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const f = () => setShow(window.scrollY > 700);
    f(); window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);
  return (
    <button
      type="button" aria-label="Back to top" tabIndex={show ? 0 : -1}
      onClick={() => (window.__lenis ? window.__lenis.scrollTo(0, { duration: 1.1 }) : window.scrollTo({ top: 0, behavior: 'smooth' }))}
      className={`to-top ${show ? 'to-top-on' : ''}`}
    ><span aria-hidden="true">↑</span></button>
  );
}

/** Primary nav with an active-page indicator. */
export function NavLinks({ items }: { items: { href: string; label: string }[] }) {
  const path = usePathname();
  const active = (h: string) => (h === '/' ? path === '/' : path === h || path.startsWith(h.split('/').slice(0, 2).join('/') + '/') || path === h.split('/').slice(0, 2).join('/'));
  return (
    <nav aria-label="Primary" className="ml-4 hidden gap-0.5 lg:flex">
      {items.map((n) => (
        <Link key={n.href} href={n.href} aria-current={active(n.href) ? 'page' : undefined} className="nav-link">{n.label}</Link>
      ))}
    </nav>
  );
}

/** Renders its (server-rendered) children everywhere except on the listed exact paths. */
export function HideOn({ paths, children }: { paths: string[]; children: React.ReactNode }) {
  const path = usePathname();
  return paths.includes(path) ? null : <>{children}</>;
}
