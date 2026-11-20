'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { captureAttribution, measurementChoice, setMeasurementChoice } from '@/lib/attribution';

/** CallRail is available by default; explicit opt-outs stop tracking. GA4 stays opt-in. */
export function Analytics() {
  const ga = process.env.NEXT_PUBLIC_GA4_ID;
  const ads = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  const googleTag = ga || ads;
  const callrail = process.env.NEXT_PUBLIC_CALLRAIL_SWAP_SCRIPT;
  const [allowed, setAllowed] = useState(false);
  const [callTracking, setCallTracking] = useState(false);
  const [showChoice, setShowChoice] = useState(false);
  useEffect(() => {
    const choice = measurementChoice();
    const optedOut = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
    setAllowed(choice === true && !optedOut);
    setCallTracking(choice !== false && !optedOut);
    setShowChoice(choice === null);
    if (choice === true && !optedOut) captureAttribution();
  }, []);

  function choose(value: boolean) {
    if ((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true) value = false;
    setMeasurementChoice(value);
    setAllowed(value);
    setCallTracking(value);
    setShowChoice(false);
    window.gtag?.('consent', 'update', {
      ad_storage: value ? 'granted' : 'denied',
      analytics_storage: value ? 'granted' : 'denied',
      ad_user_data: value ? 'granted' : 'denied',
      ad_personalization: 'denied',
    });
    if (value) captureAttribution();
    // Reload when withdrawing so previously loaded third-party scripts cannot keep running.
    if (!value && (allowed || callTracking)) window.location.reload();
  }

  return <>
    {allowed && googleTag && <>
      <Script id="ga4-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        window.gtag = function(){window.dataLayer.push(arguments);};
        gtag('consent', 'default', {ad_storage:'denied', analytics_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'});
        gtag('consent', 'update', {ad_storage:'granted', analytics_storage:'granted', ad_user_data:'granted', ad_personalization:'denied'});
        gtag('js', new Date());
        ${ga ? `gtag('config', ${JSON.stringify(ga)}, {send_page_view:true});` : ''}
        ${ads ? `gtag('config', ${JSON.stringify(ads)});` : ''}
      `}</Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${googleTag}`} strategy="afterInteractive" />
    </>}
    {callTracking && callrail && <Script src={callrail} strategy="afterInteractive" />}
    <div className="border-t border-rule bg-white px-4 py-3 text-center text-tiny text-grey">
      <button type="button" className="underline" onClick={() => setShowChoice(true)}>Privacy choices</button>
    </div>
    {showChoice && <section aria-label="Privacy choices" className="fixed bottom-20 left-3 right-3 z-[70] mx-auto max-w-xl rounded-card border border-rule bg-white p-5 text-ink shadow-xl sm:bottom-4">
      <p className="font-semibold">Help us understand what works</p>
      <p className="mt-2 text-small text-slate">We use CallRail to track calls and service requests unless you decline tracking. Google Analytics and our saved advertising details stay off until you allow measurement. You can still call or request service if you decline. <Link className="underline" href="/privacy-policy/">Privacy policy</Link></p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" onClick={() => choose(true)}>Allow measurement</button>
        <button type="button" className="btn border border-rule bg-white text-ink" onClick={() => choose(false)}>Decline</button>
      </div>
    </section>}
  </>;
}
