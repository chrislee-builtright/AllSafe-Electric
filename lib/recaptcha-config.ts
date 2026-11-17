/**
 * Google reCAPTCHA v3 site key. Public by design (it ships to the browser), so it is safe to
 * keep in source. The matching SECRET key is server-only: set RECAPTCHA_SECRET_KEY in Vercel,
 * never in code.
 */
export const RECAPTCHA_SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeLCiUuAAAAAF_1OjaOUHwAyI2EtjwXD52fMO7m';

export const RECAPTCHA_ACTIONS = { estimate: 'estimate_request' } as const;
