'use client';

import { usePathname } from 'next/navigation';
import { isPaidLandingPath } from '@/lib/paidLandingPaths';

/**
 * Hides site-wide chrome (top bar, full navigation header, footer, site sticky bar) on the
 * Google Ads landing pages under /lp/, which render their own focused header, trust footer
 * and sticky bar from app/lp/layout.tsx. Every other route gets its children unchanged, so
 * organic pages render exactly as before.
 */
export function PaidChromeGate({ children }: { children: React.ReactNode }) {
  if (isPaidLandingPath(usePathname())) return null;
  return <>{children}</>;
}
