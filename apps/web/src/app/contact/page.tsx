import { Breadcrumbs, PageTitle } from '@/components/ui';
import { ContactForm } from '@/components/client';
import { pageMeta } from '@/lib/site';

export const metadata = pageMeta({ title: 'Contact Apex', description: 'Get in touch with the Apex team for feedback, corrections, partnerships or data requests.', path: '/contact' });

export default function Contact() {
  return (
    <>
      <Breadcrumbs items={[{ name: 'Contact', href: '/contact' }]} />
      <PageTitle sub="Feedback, corrections, partnerships or privacy requests. We reply within a few working days.">Contact us</PageTitle>
      <ContactForm />
    </>
  );
}
