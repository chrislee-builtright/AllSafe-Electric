import { RECAPTCHA_SITE_KEY } from './recaptcha-config';

type Grecaptcha = {
  ready: (cb: () => void) => void;
  execute: (key: string, opts: { action: string }) => Promise<string>;
};

let loading: Promise<void> | null = null;

/** Loads the reCAPTCHA script once, on demand (first form interaction), so page load stays fast. */
export function loadRecaptcha(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if ((window as unknown as { grecaptcha?: Grecaptcha }).grecaptcha) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(RECAPTCHA_SITE_KEY)}`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error('reCAPTCHA failed to load'));
    };
    document.head.appendChild(s);
  });
  return loading;
}

/** Returns a fresh single-use token for `action`, or '' if reCAPTCHA is unavailable (blocked, offline). */
export async function getRecaptchaToken(action: string): Promise<string> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      (async () => {
        await loadRecaptcha();
        const g = (window as unknown as { grecaptcha: Grecaptcha }).grecaptcha;
        return new Promise<string>((resolve, reject) =>
          g.ready(() => g.execute(RECAPTCHA_SITE_KEY, { action }).then(resolve, reject))
        );
      })(),
      new Promise<string>((_, reject) => { timeout = setTimeout(() => reject(new Error('timeout')), 8000); }),
    ]);
  } catch {
    return '';
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
