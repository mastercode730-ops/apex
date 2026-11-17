import { Breadcrumbs, PageTitle } from '@/components/ui';
import { pageMeta } from '@/lib/site';

export const metadata = pageMeta({ title: 'Privacy Policy', description: 'How Apex collects, uses and protects your data, including cookies, analytics and your rights.', path: '/privacy-policy' });

const S = ({ h, children }: { h: string; children: React.ReactNode }) => <section className="mb-8"><h2 className="mb-2 font-display text-xl font-bold">{h}</h2><div className="grid gap-3 text-muted">{children}</div></section>;

export default function Privacy() {
  return (
    <div className="max-w-3xl">
      <Breadcrumbs items={[{ name: 'Privacy Policy', href: '/privacy-policy' }]} />
      <PageTitle sub="Last updated: 17 November 2026">Privacy Policy</PageTitle>
      <S h="What we collect"><p>Apex does not require an account. We collect only: (1) the name, email and message you submit through the contact form; (2) your theme and cookie-consent choice, stored in your browser&apos;s local storage; and (3) anonymised usage analytics, only if you accept cookies.</p></S>
      <S h="Analytics and cookies"><p>If you click Accept in the cookie banner, we load Google Analytics 4 with IP anonymisation to understand which pages are used. If you decline, no analytics script is loaded and no analytics cookies are set. You can change your choice by clearing this site&apos;s local storage.</p></S>
      <S h="Third-party services"><p>Fonts are self-hosted by the framework at build time. Analytics (Google LLC) loads only with consent. Contact messages may be delivered through an email provider acting as our processor.</p></S>
      <S h="How long we keep data"><p>Contact messages are kept only as long as needed to respond, then deleted within 12 months.</p></S>
      <S h="Your rights"><p>You may request access to, correction of, or deletion of your data at any time via the <a className="text-accent underline" href="/contact">contact form</a>.</p></S>
      <S h="Data sources"><p>Match, player and statistics data displayed in demonstration builds is simulated and does not represent real events.</p></S>
    </div>
  );
}
