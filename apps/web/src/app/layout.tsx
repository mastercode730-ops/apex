import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Header, Footer, Ticker } from '@/components/chrome';
import { Consent } from '@/components/client';
import { JsonLd } from '@/components/ui';
import { SITE } from '@/lib/site';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} | Live Cricket Scores, Fixtures, Rankings & Stats`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  alternates: { canonical: '/' },
  verification: process.env.GSC_VERIFICATION ? { google: process.env.GSC_VERIFICATION } : undefined,
  openGraph: { siteName: SITE.name, type: 'website', locale: 'en_GB', url: SITE.url, title: SITE.name, description: SITE.description, images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Apex live cricket' }] },
  twitter: { card: 'summary_large_image' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: [{ media: '(prefers-color-scheme: dark)', color: '#080b12' }, { media: '(prefers-color-scheme: light)', color: '#f4f6fb' }] };

const themeInit = `try{var t=localStorage.getItem('apex-theme');if(t)document.documentElement.dataset.theme=t;else if(!matchMedia('(prefers-color-scheme: light)').matches)document.documentElement.dataset.theme='dark';else document.documentElement.dataset.theme='light'}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const org = { '@context': 'https://schema.org', '@type': 'Organization', name: SITE.name, url: SITE.url, logo: `${SITE.url}/icon.svg`, description: SITE.description };
  const site = { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.name, url: SITE.url, potentialAction: { '@type': 'SearchAction', target: `${SITE.url}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' } };
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeInit }} /></head>
      <body>
        <Header />
        <Ticker />
        <main id="main" className="mx-auto min-h-[70vh] max-w-7xl px-4 py-6 sm:py-8 2xl:max-w-[90rem]">{children}</main>
        <Footer />
        <Consent gaId={process.env.NEXT_PUBLIC_GA_ID} />
        <JsonLd data={org} />
        <JsonLd data={site} />
      </body>
    </html>
  );
}
