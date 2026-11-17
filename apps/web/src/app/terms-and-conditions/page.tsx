import { Breadcrumbs, PageTitle } from '@/components/ui';
import { pageMeta } from '@/lib/site';

export const metadata = pageMeta({ title: 'Terms and Conditions', description: 'The terms that govern your use of the Apex website and applications.', path: '/terms-and-conditions' });

export default function Terms() {
  return (
    <div className="max-w-3xl">
      <Breadcrumbs items={[{ name: 'Terms & Conditions', href: '/terms-and-conditions' }]} />
      <PageTitle sub="Last updated: 17 November 2026">Terms and Conditions</PageTitle>
      <div className="grid gap-4 text-muted">
        <p>By using Apex you agree to these terms. Apex is provided as is, without warranty. Scores, statistics and predictions are informational only and may be delayed or inaccurate.</p>
        <p>You may not scrape, resell or redistribute site content or data without written permission, or interfere with the service.</p>
        <p>Team names are used for identification only. Apex is not affiliated with any cricket board or the ICC.</p>
        <p>Questions? Use the <a className="text-accent underline" href="/contact">contact form</a>.</p>
      </div>
    </div>
  );
}
