import { Breadcrumbs, PageTitle } from '@/components/ui';
import { pageMeta } from '@/lib/site';

export const metadata = pageMeta({ title: 'Editorial Policy', description: 'How Apex sources, writes, checks and corrects its cricket news, statistics and analysis.', path: '/editorial-policy' });

export default function Editorial() {
  return (
    <div className="max-w-3xl">
      <Breadcrumbs items={[{ name: 'Editorial Policy', href: '/editorial-policy' }]} />
      <PageTitle sub="Last updated: 17 November 2026">Editorial Policy</PageTitle>
      <div className="grid gap-4 text-muted">
        <p><b className="text-ink">Original work.</b> Stories on Apex are written by our editors or licensed from named partners. We do not republish other sites&apos; articles.</p>
        <p><b className="text-ink">Live scores and statistics</b> come from a licensed third-party cricket data provider and are processed automatically. They may be delayed or contain errors; official scorecards prevail.</p>
        <p><b className="text-ink">Corrections.</b> If you spot a mistake, tell us through the <a className="text-accent underline" href="/contact">contact form</a>. We correct verified errors promptly and note material changes.</p>
        <p><b className="text-ink">Independence.</b> Apex is not affiliated with any cricket board or the ICC. Predictions and opinion pieces are labelled as such.</p>
      </div>
    </div>
  );
}
