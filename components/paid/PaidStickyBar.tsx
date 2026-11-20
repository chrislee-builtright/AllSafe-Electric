'use client';

import { useEffect, useState } from 'react';
import { business } from '@/lib/business';
import { track } from '@/lib/analytics';
import { PhoneIcon } from '@/components/Icons';

/**
 * Mobile call / request bar for /lp/ pages. Appears after the hero, and hides while the
 * request section is on screen so it never covers form fields, error messages or the
 * privacy text. A spacer reserves its height so it never covers page content either.
 */
export function PaidStickyBar({ service }: { service: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    const target = document.getElementById('request');
    const io = target
      ? new IntersectionObserver(([e]) => setFormVisible(e.isIntersecting), { threshold: 0 })
      : null;
    if (target && io) io.observe(target);
    return () => {
      window.removeEventListener('scroll', onScroll);
      io?.disconnect();
    };
  }, []);

  const show = scrolled && !formVisible;
  const seg =
    'flex items-center justify-center gap-2 text-small font-semibold !text-white hover:!text-white transition-colors duration-200';

  return (
    <>
      <div aria-hidden className="lg:hidden" style={{ height: 'calc(66px + env(safe-area-inset-bottom))' }} />
      <nav
        aria-label="Quick actions"
        aria-hidden={!show}
        className={`fixed inset-x-0 bottom-0 z-40 lg:hidden ${show ? 'translate-y-0' : 'pointer-events-none translate-y-full'} transition-transform duration-300 ease-smooth`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid h-[66px] grid-cols-2 bg-navy shadow-[0_-6px_24px_rgba(1,46,77,0.34)]">
          <a
            href={business.phone.href}
            tabIndex={show ? 0 : -1}
            data-cta="call"
            data-location="sticky_bar"
            onClick={() => track.call('sticky_bar', { service })}
            className={`${seg} bg-green-600 hover:bg-green-700`}
          >
            <PhoneIcon width={20} height={20} /> Call now
          </a>
          <a
            href="#request"
            tabIndex={show ? 0 : -1}
            data-cta="estimate"
            data-location="sticky_bar"
            className={`${seg} hover:bg-blue-700`}
          >
            Request service
          </a>
        </div>
      </nav>
    </>
  );
}
