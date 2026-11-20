import { notFound } from 'next/navigation';
import { PaidLandingPage } from '@/components/paid/PaidLandingPage';
import { PaidHeader } from '@/components/paid/PaidHeader';
import { PaidFooter } from '@/components/paid/PaidFooter';
import { PaidStickyBar } from '@/components/paid/PaidStickyBar';
import { getPaidLanding, paidLandings } from '@/lib/paidLanding';
import { pageMetadata } from '@/lib/seo';

/** Google Ads landing pages. noindex,follow; never listed in sitemaps or navigation. */
export const dynamicParams = false;

export function generateStaticParams() {
  return paidLandings.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const page = getPaidLanding((await params).slug);
  if (!page) return {};
  return pageMetadata({
    path: `/lp/${page.slug}/`,
    title: page.title,
    description: page.description,
    index: false,
    ogEyebrow: page.eyebrow,
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const page = getPaidLanding((await params).slug);
  if (!page) notFound();
  return (
    <>
      <PaidHeader service={page.trackingService} />
      <PaidLandingPage page={page} />
      <PaidFooter />
      <PaidStickyBar service={page.trackingService} />
    </>
  );
}
