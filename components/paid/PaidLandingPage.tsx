import Link from 'next/link';
import { CallButton } from '@/components/cta';
import { EstimateForm } from '@/components/EstimateForm';
import { SiteImage } from '@/components/SiteImage';
import { ServiceReviews } from '@/components/ServiceReviews';
import { FaqList } from '@/components/Faq';
import { Schema } from '@/components/Schema';
import { CheckIcon } from '@/components/Icons';
import { business, abs } from '@/lib/business';
import { cities } from '@/lib/cities';
import { getService } from '@/lib/services';
import { webPageNode } from '@/lib/schema';
import { afterContactCopy, hoursCopy, type DecisionBlock, type PaidLanding } from '@/lib/paidLanding';

const usd = (n: number) => `$${n.toLocaleString('en-US')}`;

/**
 * Shared layout for the /lp/ Google Ads landing pages. Structure is shared; every
 * section's copy comes from that page's entry in lib/paidLanding.ts.
 * The request form is the site's existing EstimateForm: the same server action,
 * reCAPTCHA, honeypots, rate limiting, duplicate protection, consent-aware attribution
 * and accepted-only CallRail capture as every other form on the site.
 */
export function PaidLandingPage({ page }: { page: PaidLanding }) {
  const path = `/lp/${page.slug}/`;
  const panel = page.pricing.showPanelRange ? getService('electrical-panel-services')?.priceRange : undefined;

  return (
    <>
      <Schema
        nodes={[
          webPageNode({ path, name: page.h1, description: page.description, about: true }),
          {
            '@type': 'Service',
            '@id': `${abs(path)}#service`,
            name: page.eyebrow,
            description: page.intro,
            url: abs(path),
            provider: { '@id': `${abs('/')}#business` },
            areaServed: cities.map((c) => ({ '@type': 'City', name: `${c.name}, CO` })),
          },
        ]}
      />

      {/* Hero */}
      <section className="surface-dark bg-aurora py-9 md:py-14">
        <div className="container-page grid items-center gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          <div>
            <p className="eyebrow">{page.eyebrow} · Parker & South Denver metro</p>
            <h1 className="mt-4 text-[2rem] leading-[1.15] sm:text-[2.6rem] lg:text-[3rem]">{page.h1}</h1>
            <p className="mt-5 max-w-xl text-body-lg text-white/90">{page.intro}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <CallButton location="hero" service={page.trackingService} />
              <a href="#request" className="btn btn-ghost" data-cta="estimate" data-location="hero">
                Request service
              </a>
            </div>
            <p className="mt-4 text-small text-white/90">{hoursCopy}</p>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-small">
              {[
                `Colorado master electrician ${business.licenses.master.id}`,
                'Based in Parker since 2018',
                'Written price before work starts',
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 shrink-0 text-green-300" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="hidden justify-center sm:flex">
            <SiteImage
              name={page.photo}
              alt={page.photoAlt}
              sizes="(min-width: 1024px) 520px, 90vw"
              className="h-auto max-h-[380px] w-auto max-w-full rounded-card"
            />
          </div>
        </div>
      </section>

      {/* Service fit */}
      <section className="container-page py-12 md:py-16" aria-labelledby="fit-heading">
        <p className="eyebrow">What we handle</p>
        <h2 id="fit-heading" className="mt-3 text-h2">Is this the right call for your home?</h2>
        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          {page.handles.map((h) => (
            <article key={h.title} className="card p-6">
              <h3 className="flex items-start gap-3 text-h3">
                <CheckIcon className="mt-1 h-6 w-6 shrink-0 text-green-600" />
                {h.title}
              </h3>
              <p className="mt-3 text-body text-slate">{h.text}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 rounded-card border border-rule bg-paper p-6">
          <h3 className="text-body-lg font-semibold text-ink">Good to know</h3>
          <ul className="mt-3 space-y-2 text-body text-slate">
            {page.boundaries.map((b) => (
              <li key={b} className="flex gap-3">
                <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Decision block={page.decision} />

      {/* What happens next */}
      <section className="container-page py-12 md:py-16" aria-labelledby="next-heading">
        <p className="eyebrow">What happens next</p>
        <h2 id="next-heading" className="mt-3 text-h2">From your call to a finished job</h2>
        <ol className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {page.steps.map((s, i) => (
            <li key={s.title} className="card p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50 font-bold text-green-700" aria-hidden>
                {i + 1}
              </span>
              <h3 className="mt-4 text-body-lg font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 text-body text-slate">{s.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-body text-slate">{hoursCopy} Call to discuss current appointment availability.</p>
      </section>

      {/* Pricing */}
      <section className="border-y border-rule bg-green-50 py-12 md:py-14" aria-labelledby="pricing-heading">
        <div className="container-page grid gap-8 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Pricing</p>
            <h2 id="pricing-heading" className="mt-3 text-h2">How pricing works</h2>
            {panel && (
              <p className="mt-5 text-body-lg font-semibold text-ink">
                Most panel upgrades run {usd(panel.low)} to {usd(panel.high)}.
              </p>
            )}
            <p className="mt-4 text-body-lg text-slate">{page.pricing.intro}</p>
            {panel && (
              <p className="mt-4 text-body text-slate">
                If you are not sure whether you need a new panel at all, {diagnosticLower()}
              </p>
            )}
          </div>
          <div className="card p-6 md:p-8">
            <h3 className="text-h3">What affects the price</h3>
            <ul className="mt-4 space-y-3 text-body text-slate">
              {page.pricing.factors.map((f) => (
                <li key={f} className="flex gap-3">
                  <CheckIcon className="mt-1 h-5 w-5 shrink-0 text-green-600" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="container-page py-12 md:py-16" aria-labelledby="why-heading">
        <p className="eyebrow">Why Allsafe</p>
        <h2 id="why-heading" className="mt-3 text-h2">What you can check before you call</h2>
        <div className="mt-7 grid gap-5 md:grid-cols-3">
          <article className="card p-6">
            <h3 className="text-h3">Licensed in Colorado</h3>
            <p className="mt-3 text-body text-slate">
              Electrical contractor license {business.licenses.contractor.id}. Our master electrician holds license{' '}
              {business.licenses.master.id}.
            </p>
            <a className="mt-3 inline-block text-small underline" href={business.licenses.verifyUrl} target="_blank" rel="noopener noreferrer">
              Verify on the state license lookup
            </a>
          </article>
          <article className="card p-6">
            <h3 className="text-h3">A local Parker shop</h3>
            <p className="mt-3 text-body text-slate">
              Founded in Parker in 2018, at {business.address.streetAddress}, {business.address.addressLocality}. Our owner and master electrician brings 20+ years of
              experience serving the South Denver metro.
            </p>
            <Link className="mt-3 inline-block text-small underline" href="/about/">
              About Allsafe Electric
            </Link>
          </article>
          <article className="card p-6">
            <h3 className="text-h3">The price before the work</h3>
            <p className="mt-3 text-body text-slate">
              You get the price in writing before work starts, and we test the work before we finish the visit.
            </p>
            <a className="mt-3 inline-block text-small underline" href={business.google.profileUrl} target="_blank" rel="noopener noreferrer">
              Read our Google reviews
            </a>
          </article>
        </div>
        <div className="mt-12">
          <ServiceReviews tags={page.reviewTags} limit={4} heading="What homeowners say about working with us" />
        </div>
      </section>

      {/* Request */}
      <section id="request" className="scroll-mt-20 border-y border-rule bg-blue-50 py-12 md:py-16" aria-labelledby="request-heading">
        <div className="container-page grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="eyebrow">Request service</p>
            <h2 id="request-heading" className="mt-3 text-h2">Call us, or send a request</h2>
            <p className="mt-4 text-body-lg text-slate">Calling is the fastest way to discuss the problem and appointment availability.</p>
            <div className="mt-5">
              <CallButton location="mid_page" service={page.trackingService} />
            </div>
            <p className="mt-4 text-body text-slate">{hoursCopy}</p>
            <h3 className="mt-6 text-body-lg font-semibold text-ink">After you contact us</h3>
            <p className="mt-2 text-body text-slate">{afterContactCopy}</p>
            <p className="mt-4 text-body text-slate">
              <Link href={page.learnMore.href} className="underline">
                {page.learnMore.label}
              </Link>
            </p>
          </div>
          <div className="card p-6 md:p-8">
            <p className="font-semibold text-ink">{page.formIntro}</p>
            <EstimateForm variant="compact" defaultService={page.formService || undefined} submitLabel="Send my request" repairRequest />
          </div>
        </div>
      </section>

      <div className="container-page max-w-4xl py-12 md:py-16">
        <FaqList faqs={page.faqs} heading="Questions before you book" />
      </div>
    </>
  );
}

function diagnosticLower() {
  return 'a diagnostic visit is a flat fee, and if any repairs or replacements are needed, we will give you the price in writing before we start any work.';
}

function Decision({ block }: { block: DecisionBlock }) {
  if (block.kind === 'coverage') return <Coverage block={block} />;
  return (
    <section className="bg-paper py-12 md:py-16" aria-labelledby="decision-heading">
      <div className="container-page">
        <h2 id="decision-heading" className="text-h2">{block.title}</h2>
        <p className="mt-4 max-w-3xl text-body-lg text-slate">{block.intro}</p>
        {block.kind === 'compare' ? (
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {[block.left, block.right].map((col) => (
              <div key={col.heading} className="card p-6">
                <h3 className="text-h3">{col.heading}</h3>
                <ul className="mt-4 space-y-3 text-body text-slate">
                  {col.items.map((it) => (
                    <li key={it} className="flex gap-3">
                      <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-600" />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {block.items.map((it) => (
              <div key={it.title} className="card p-6">
                <h3 className="text-body-lg font-semibold text-ink">{it.title}</h3>
                <p className="mt-2 text-body text-slate">{it.text}</p>
              </div>
            ))}
          </div>
        )}
        {block.note && <p className="mt-6 max-w-3xl text-body text-slate">{block.note}</p>}
      </div>
    </section>
  );
}

function Coverage({ block }: { block: Extract<DecisionBlock, { kind: 'coverage' }> }) {
  const byCounty = new Map<string, string[]>();
  for (const c of cities) byCounty.set(c.county, [...(byCounty.get(c.county) ?? []), c.name]);
  return (
    <section className="bg-paper py-12 md:py-16" aria-labelledby="decision-heading">
      <div className="container-page">
        <h2 id="decision-heading" className="text-h2">{block.title}</h2>
        <p className="mt-4 max-w-3xl text-body-lg text-slate">{block.intro}</p>
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...byCounty.entries()].map(([county, names]) => (
            <div key={county} className="card p-6">
              <h3 className="text-body-lg font-semibold text-ink">{county === 'Denver' ? 'Denver' : `${county} County`}</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {names.map((n) => (
                  <li key={n} className="rounded-full border border-rule bg-white px-3 py-1 text-small text-slate">
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-6 text-body text-slate">
          Not sure? Call us, or include your ZIP code in your request and we will confirm.
        </p>
      </div>
    </section>
  );
}
