// @ts-check
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse } from 'csv-parse/sync';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Redirects are generated from data/url-map.csv at build time, never hand-maintained.
 * See planning/docs/04 §4. Columns: old_url,bucket,new_url,status,reason,impressions_90d,inlinks
 * Rows with status === '301' become permanent redirects. One hop only — the CSV must
 * already be flattened (A→C directly, never A→B→C).
 */
function redirectsFromCsv() {
  const csvPath = join(__dirname, 'data', 'url-map.csv');
  if (!existsSync(csvPath)) return [];
  try {
    const rows = parse(readFileSync(csvPath, 'utf8'), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    return rows
      .filter((r) => r.status === '301' && r.old_url && r.new_url && r.old_url !== r.new_url)
      .map((r) => ({ source: r.old_url, destination: r.new_url, permanent: true }));
  } catch (err) {
    console.warn('[next.config] could not parse data/url-map.csv:', err.message);
    return [];
  }
}

const ContentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  // 'unsafe-inline' scoped to scripts is required for GA4/GTM + Next's hydration bootstrap.
  // Hardening path: nonce-based CSP via middleware (disables full static opt on affected routes).
  // featurable.com added 2026-09-16 for the Google reviews widget. Without it
  // the CSP blocked the embed script outright ("Loading the script
  // https://featurable.com/assets/bundle.js violates ... script-src"), which is
  // why the widget rendered nothing no matter how it was configured.
  // cdn.calltrk.com added 2026-09-18 for the CallRail dynamic number swap
  // script (separate domain from callrail.com, same product). Same failure
  // mode as featurable.com above if left off this list: the script tag loads
  // but the browser silently blocks it, so calls never get tracked.
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://cdn.callrail.com https://*.callrail.com https://cdn.calltrk.com https://*.calltrk.com https://featurable.com https://*.featurable.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.googleusercontent.com https://maps.gstatic.com https://maps.googleapis.com https://*.google-analytics.com https://www.googletagmanager.com https://featurable.com https://*.featurable.com",
  "font-src 'self' data:",
  // Featurable fetches the review payload from its own API at runtime.
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://*.callrail.com https://*.calltrk.com https://places.googleapis.com https://featurable.com https://*.featurable.com https://www.google.com/recaptcha/",
  'frame-src https://book.housecallpro.com https://www.google.com https://www.google.com/recaptcha/',
  "media-src 'self'",
  "manifest-src 'self'",
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), browsing-topics=(), interest-cohort=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: true, // planning/docs/03 §1 — the current site uses them; do not change.
  compress: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
    ],
    deviceSizes: [400, 640, 828, 1080, 1200, 1600, 1920, 2400],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  async redirects() {
    return [
      // Enforce apex host (www → apex). http → https handled at the edge/host.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.allsafehomeservice.com' }],
        destination: 'https://allsafehomeservice.com/:path*',
        permanent: true,
      },
      // Known live-site hub inconsistency — planning/CLAUDE.md §5, docs/03 §2.
      // /electrical-services/ (homepage hero button target) → the indexed hub.
      // Confirm against GSC before launch; documented in planning/docs/99.
      {
        source: '/electrical-services-parker-co/',
        destination: '/electrical-services/',
        permanent: true,
      },
      {
        source: '/emergency-electrical-repairs-parker-co/',
        destination: '/emergency-electrical-repairs/',
        permanent: true,
      },
      ...redirectsFromCsv(),
      // planning/docs/09 §1.5. The legacy WordPress site published a page per
      // {service}-{city}-colorado combination, 536 URLs across these 10 services
      // and ~54 city slugs, pulled from allsafehomeservice.com's own sitemaps
      // (post-sitemap.xml, page-sitemap1-3.xml, local-sitemap.xml) 2026-09-11.
      // None of that per-city split exists on the new site yet (Tier-2/3 city x
      // service pages are Phase 2, still gated off) — every city variant of a
      // given service collapses to that one real service page. A CSV row per
      // URL would mean 536 near-identical rows, so these are :city wildcards
      // instead. Safe as wildcards (unlike /electrician-:city/ below) because no
      // real route on the new site matches the "-colorado" suffixed shape, so
      // there is nothing for the pattern to accidentally shadow.
      {
        source: '/ceiling-fan-installation-:city-colorado/',
        destination: '/ceiling-fan-installation/',
        permanent: true,
      },
      {
        source: '/electrical-outlet-services-:city-colorado/',
        destination: '/electrical-outlet-services/',
        permanent: true,
      },
      {
        source: '/electrical-panel-services-:city-colorado/',
        destination: '/electrical-panel-services/',
        permanent: true,
      },
      {
        source: '/electrical-switch-services-:city-colorado/',
        destination: '/electrical-switch-services/',
        permanent: true,
      },
      {
        source: '/electrical-wiring-repairs-services-:city-colorado/',
        destination: '/electrical-wiring-repairs-services/',
        permanent: true,
      },
      {
        source: '/residential-ev-charging-:city-colorado/',
        destination: '/residential-ev-charging/',
        permanent: true,
      },
      {
        source: '/whole-home-surge-protection-:city-colorado/',
        destination: '/whole-home-surge-protection/',
        permanent: true,
      },
      {
        source: '/home-electrical-safety-inspections-:city-colorado/',
        destination: '/home-electrical-safety-inspections/',
        permanent: true,
      },
      {
        source: '/emergency-electrical-repairs-:city-colorado/',
        destination: '/emergency-electrical-repairs/',
        permanent: true,
      },
      {
        source: '/lighting-services-:city-colorado/',
        destination: '/lighting-services/',
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        source: '/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/img/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      // planning/docs/09 §1.7 (client audit, 2026-09-11). Vercel preview deployments
      // and any other non-production host get a hard noindex, regardless of what the
      // page's own <meta name="robots"> says — this is the safety net that stops a
      // staging URL from ever getting indexed if a preview link leaks. Production
      // itself never sends this header, since the host will match.
      {
        source: '/:path*',
        missing: [{ type: 'host', value: 'allsafehomeservice.com' }],
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default nextConfig;
