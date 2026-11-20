import type { Metadata, Viewport } from 'next';
import { Poppins, Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TopBar } from '@/components/TopBar';
import { StickyBar } from '@/components/StickyBar';
import { Analytics } from '@/components/Analytics';
import { PaidChromeGate } from '@/components/paid/PaidChromeGate';
import { Schema } from '@/components/Schema';
import { businessNode, websiteNode } from '@/lib/schema';
import { SITE_URL, business } from '@/lib/business';

/**
 * Phase 1.12 (planning/docs/09, 2026-09-11): trimmed from 4 weights each (8
 * font files) to 3. Dropped 500 from both: globals.css hardcodes h1-h4 and
 * .btn at 600/700 already, and font-medium (500) shows up in only a handful
 * of small text spots sitewide, not anywhere above the fold. next/font only
 * emits a <link rel="preload"> for the weight/style files actually referenced
 * in the initial render, so fewer declared weights means fewer render-blocking
 * font requests on first paint.
 */
const display = Poppins({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const body = Inter({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0068A8',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Allsafe Electric | Parker, CO residential electrician',
    template: '%s',
  },
  description:
    'Licensed residential electrician in Parker, Colorado. Fast response, licensed and insured, BBB A+ accredited. Panels, EV chargers, wiring, lighting and urgent repairs.',
  applicationName: business.name,
  authors: [{ name: business.name }],
  creator: business.name,
  publisher: business.name,
  formatDetection: { telephone: true, address: false, email: false },
  alternates: { canonical: '/' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US" className={`${display.variable} ${body.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[60] focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:shadow-lift"
        >
          Skip to content
        </a>
        <PaidChromeGate>
          <TopBar />
          <Header />
        </PaidChromeGate>
        <main id="main">{children}</main>
        <PaidChromeGate>
          <Footer />
          <StickyBar />
        </PaidChromeGate>
        <Schema nodes={[businessNode(), websiteNode()]} />
        <Analytics />
      </body>
    </html>
  );
}
