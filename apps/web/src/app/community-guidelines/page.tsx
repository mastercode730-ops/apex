import { Breadcrumbs, PageTitle } from '@/components/ui';
import { pageMeta } from '@/lib/site';

export const metadata = pageMeta({ title: 'Community Guidelines', description: 'The standards we expect from everyone who interacts with Apex, including comments, feedback and messages.', path: '/community-guidelines' });

export default function Guidelines() {
  return (
    <div className="max-w-3xl">
      <Breadcrumbs items={[{ name: 'Community Guidelines', href: '/community-guidelines' }]} />
      <PageTitle sub="Last updated: 17 November 2026">Community Guidelines</PageTitle>
      <ul className="grid list-disc gap-3 pl-5 text-muted">
        <li>Be respectful. Harassment, hate speech, threats and personal attacks are not allowed.</li>
        <li>No spam, scams, or promotion of illegal betting or unlicensed gambling services.</li>
        <li>Do not post other people&apos;s personal information.</li>
        <li>Do not misuse the service: no scraping, automated abuse, or attempts to disrupt Apex.</li>
        <li>Report problems through the <a className="text-accent underline" href="/contact">contact form</a>. We may remove content or restrict access that breaks these rules.</li>
      </ul>
    </div>
  );
}
