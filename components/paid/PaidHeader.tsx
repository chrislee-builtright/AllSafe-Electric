import Link from 'next/link';
import Image from 'next/image';
import { CallButton } from '@/components/cta';
import { PhoneIcon } from '@/components/Icons';
import { business } from '@/lib/business';

/**
 * Focused header for /lp/ ad landing pages: brand, call (primary), request service.
 * No site navigation, so the visitor's next step is calling or requesting service.
 * The call button is the shared CallButton, so CallRail's number swap and the call
 * click event behave exactly as they do on the rest of the site.
 */
export function PaidHeader({ service }: { service: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-3 md:h-[72px]">
        <Link href="/" aria-label="Allsafe Electric home" className="shrink-0">
          {/* Sized for its rendered width; the shared <Logo> requests the full 2400px variant. */}
          <Image
            src="/img/brand/allsafe-electric-logo.webp"
            alt="Allsafe Electric"
            width={2048}
            height={316}
            sizes="(min-width: 640px) 240px, 190px"
            priority
            className="h-7 w-auto sm:h-9"
          />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <a href="#request" className="btn btn-outline hidden sm:inline-flex" data-cta="estimate" data-location="header">
            Request service
          </a>
          <CallButton location="header" service={service} className="!px-4 sm:!px-5">
            <PhoneIcon width={18} height={18} />
            <span className="sm:hidden">Call</span>
            <span className="hidden sm:inline">{business.phone.display}</span>
          </CallButton>
        </div>
      </div>
    </header>
  );
}
