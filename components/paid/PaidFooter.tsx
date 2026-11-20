import Link from 'next/link';
import { business } from '@/lib/business';

/**
 * Trust footer for /lp/ pages: business identity, real NAP, licenses with the state lookup,
 * hours, and the privacy policy. Deliberately short; no organic navigation.
 */
export function PaidFooter() {
  const a = business.address;
  return (
    <footer className="surface-dark bg-navy py-10 text-small text-white/85">
      <div className="container-page grid gap-6 md:grid-cols-3">
        <div>
          <p className="font-semibold text-white">{business.name}</p>
          <address className="mt-2 not-italic">
            {a.streetAddress}
            <br />
            {a.addressLocality}, {a.addressRegion} {a.postalCode}
            <br />
            <a href={business.phone.href} className="font-semibold">
              {business.phone.display}
            </a>
          </address>
        </div>
        <div>
          <p className="font-semibold text-white">Licensed in Colorado</p>
          <p className="mt-2">
            Master Electrician {business.licenses.master.id}
            <br />
            Electrical Contractor {business.licenses.contractor.id}
          </p>
          <a className="mt-2 inline-block underline" href={business.licenses.verifyUrl} target="_blank" rel="noopener noreferrer">
            Verify a license with the state
          </a>
        </div>
        <div>
          <p className="font-semibold text-white">Hours</p>
          <p className="mt-2">We are open weekdays, 8am to 6pm.</p>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            <li><Link href="/about/" className="underline">About us</Link></li>
            <li><Link href="/reviews/" className="underline">Reviews</Link></li>
            <li><Link href="/contact/" className="underline">Contact</Link></li>
            <li><Link href="/privacy-policy/" className="underline">Privacy policy</Link></li>
          </ul>
        </div>
      </div>
      <p className="container-page mt-8 text-tiny text-white/70">
        &copy; {new Date().getFullYear()} {business.name}. Serving Parker and the South Denver metro since 2018.
      </p>
    </footer>
  );
}
