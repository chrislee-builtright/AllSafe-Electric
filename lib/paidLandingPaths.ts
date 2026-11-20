/**
 * Google Ads landing pages live under /lp/. They are noindex, excluded from every sitemap
 * and from organic navigation, and remain crawlable (robots.txt does not block them, and
 * AdsBot has its own Allow group). Keep this prefix out of lib/sitemaps.ts.
 */
export const PAID_LANDING_PREFIX = '/lp/';

export const isPaidLandingPath = (path: string | null | undefined) =>
  Boolean(path && `${path.replace(/\/$/, '')}/`.startsWith(PAID_LANDING_PREFIX));
