import Link from 'next/link';

export const metadata = { title: 'Page not found', robots: { index: false } };

export default function NotFound() {
  return (
    <section className="grid place-items-center py-20 text-center">
      <p className="float-in font-display text-[8rem] font-extrabold leading-none text-accent sm:text-[12rem]">404</p>
      <h1 className="float-in font-display text-3xl font-bold" style={{ animationDelay: '.1s' }}>Clean bowled. That page is out.</h1>
      <p className="mt-3 max-w-md text-muted">The page you are looking for does not exist or has moved.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-full bg-accent px-6 py-3 font-bold text-accentink">Back to home</Link>
        <Link href="/cricket-live-score" className="rounded-full border border-line px-6 py-3 font-bold">Live scores</Link>
        <Link href="/search" className="rounded-full border border-line px-6 py-3 font-bold">Search</Link>
      </div>
    </section>
  );
}
