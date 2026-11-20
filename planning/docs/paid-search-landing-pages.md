# Google Ads landing pages (/lp/)

Built 2026-11-20. Five noindexed paid-search landing pages, separate from the organic service pages.
Code: `lib/paidLanding.ts` (all copy), `components/paid/*` (template, focused header, trust footer,
mobile sticky bar, chrome gate), `app/lp/[slug]/page.tsx` (route, `dynamicParams = false`).

Context: Oct 21 to Nov 19, 2026 search campaign spent $1,469.08 for 93 clicks and 1 recorded conversion
(panel replacement). Eight keyword entries scored 1 to 3 with below-average expected CTR and landing-page
experience. These pages address landing-page relevance and conversion. Expected CTR also depends on the ads
themselves, so the draft ads below need testing; no page can guarantee a Quality Score.

## Pages

| Final URL | Search intent | Status | Validation |
|---|---|---|---|
| /lp/panel-replacement/ | Replace or upgrade a home panel | Built, not deployed to production | noindex,follow; self canonical; not in sitemaps; SEO + schema audit pass; mobile + desktop checked |
| /lp/breaker-repair/ | Breaker keeps tripping or will not reset | Built, not deployed to production | same |
| /lp/outlet-repair/ | Dead outlets, GFCI will not reset, sparking outlets | Built, not deployed to production | same |
| /lp/partial-power-loss/ | Part of the home or a circuit has no power | Built, not deployed to production | same |
| /lp/electrician/ | Local residential electrician, "near me" | Built, not deployed to production | same |

No separate troubleshooting page was created for the paused "residential electrical troubleshooting" and
"circuit breaker troubleshooting" keywords. No city or keyword-variant pages were created.

## How the pages behave

- **Indexing:** `noindex, follow` meta via `pageMetadata({ index: false })`, self-referencing canonical,
  excluded from all five sitemaps (they are explicit lists in `lib/sitemaps.ts`), not linked from organic
  pages or navigation. `robots.txt` is unchanged: `/lp/` is not blocked, and AdsBot-Google /
  AdsBot-Google-Mobile keep their `Allow: /` groups.
- **Chrome:** `PaidChromeGate` hides the site top bar, header, footer and site sticky bar only on `/lp/`.
  Those pages render a brand + call + request header, a trust footer (real NAP, both license numbers with the
  state lookup, hours, privacy policy, about, reviews, contact) and a mobile call/request bar that hides while
  the request form is on screen. The consent banner and "Privacy choices" link still render on every page.
- **Form:** the existing `EstimateForm` (compact, repair-request wording) and `submitEstimate` server action,
  unchanged. Same server-side validation, reCAPTCHA v3, shared Postgres rate limiter, two honeypots, timing
  check, spam heuristics, submission-ID dedupe, save-first delivery, consent-gated attribution, accepted-only
  CallRail form capture and the existing /thank-you/ redirect. The referer path (for example
  `/lp/panel-replacement/`) is stored on the lead without its query string.
- **Calls:** the shared `CallButton` renders the real number; CallRail DNI swaps it client-side exactly as on
  the rest of the site. Call clicks are tagged `lp-{slug}` in the existing GA4 `click_call` event (only fires
  after measurement consent). No new conversion events were added.

## SEO preservation check

Baseline: prerendered HTML of all 60 existing pages from the production branch build, plus live HTML for the
six named URLs (the branch build matched live for all six; the only difference was the live reviews feed,
which needs production API keys).

After the change: titles, descriptions, canonicals, robots, H1/H2 text, H3 counts, internal links and JSON-LD
are identical on all 60 pages, and the full markup is byte-identical once the per-build ID comment and inline
script payloads are excluded. `npm run verify` (typecheck, SEO audit, schema audit) passes on all 65 pages.
`/electrical-services-parker-co/` still permanently redirects to `/electrical-services/` (config unchanged).

Note for a separate decision: `/circuit-breaker-repair/`, `/outlet-gfci-repair/` and `/partial-power-loss/`
are currently live as **noindex** paid repair pages (`index: false`, added with the earlier paid repair
template), not indexed organic pages. This work preserves that state as-is. If those URLs are meant to rank,
that is an organic SEO change to make separately.

## Measured performance (local production build, mobile viewport)

Measured in the desktop app's browser pane against `next start`, no network throttling, so only relative
numbers are meaningful. CLS 0 on all five pages. About 21 KB of compressed HTML and about 172 KB of JS per
page, the same as the existing paid repair pages. Above-the-fold images on mobile: one 7 KB logo. Two fixes
made during testing: the hero photo is hidden on phones and is no longer preloaded there (saved 52 KB), and
the paid header requests a 384px logo instead of the shared component's 2400px variant (saved 30 KB). LCP did
not record in the pane; run PageSpeed Insights on the preview URL for field-like numbers.

## Business facts to confirm before ads go live

Each of these is in the page copy, sourced from the repo's own records (`CLAUDE.md`, `lib/business.ts`,
`lib/services.ts`, existing approved page copy), but none was confirmed with the client in this pass:

1. Panel price range shown on /lp/panel-replacement/ ($2,200 to $8,800, rendered from
   `lib/services.ts` priceRange, `needsApproval: false`). Confirm it is still current.
2. Permit practice: "we file the permit, coordinate the utility disconnect and reconnect, and meet the
   inspector" (from the organic panel page). Confirm for all jurisdictions served.
3. "Most panel replacements are completed in a single day" (from the organic panel FAQ).
4. Residential-only scope ("We focus on residential electrical work for homeowners").
5. "We test the work before we finish the visit" (from the existing paid repair pages).
6. Owner experience "20+ years" (CLAUDE.md) versus "15+ years" in planning/CLAUDE.md §3. Pages use 20+ per
   the root CLAUDE.md rule.
7. Review count and rating are not typed anywhere; the reviews rail shows live figures only when the reviews
   API key is configured, and renders nothing otherwise.

Left out on purpose because they are unverified: "BBB A+ Accredited" (in the site top bar and footer), free
estimates, emergency or same-day availability, warranties, financing, discounts and any diagnostic fee amount.

## Preview deployment

Preview-only CLI deployment of this branch (production untouched):
https://all-safe-electric-rhvyde3ug-brd5.vercel.app (behind Vercel authentication). Checked there: all five
`/lp/` URLs return 200 with `noindex, follow, nocache`; `/lp/nope/` returns 404; `/electrical-services-parker-co/`
308s directly to `/electrical-services/`; `/electrical-panel-services/` keeps its `index, follow` meta;
`/sitemap-services.xml` has no `/lp/` entries. Every preview response also carries the existing
`X-Robots-Tag: noindex, nofollow` safety header for non-production hosts; production does not send it.
The preview environment has the CallRail swap script but no GA4/Ads IDs and no database URL, so preview form
submissions are rejected by the rate limiter (fails closed) and never become leads.

## Not verified here (needs access or authorization)

- No production or preview form submission was sent and no test call was placed. Accepted, rejected
  (reCAPTCHA, rate limit, honeypot, spam), duplicate, DB-down, email-down and total-failure paths were run
  against mocks (patched copy of `scripts/test-lead-delivery.cjs`; the committed script is already broken on
  the production branch because it does not stub `@/lib/recaptcha-config` and `@/lib/formGuard`).
  `scripts/test-callrail-form.ts`, `scripts/test-attribution.ts` and `scripts/test-form-guard.ts` pass.
- CallRail number swapping and GA4/Ads tag loading could not run locally (no public env vars). Check on the
  Vercel preview: decline consent, confirm GA4 does not load and CallRail does not load; allow, confirm both
  load and the number swaps on the header, hero, request section and sticky bar.
- reCAPTCHA on preview hosts only passes on the exact `VERCEL_URL` deployment host.
- Ads settings, keyword states and final URLs were not changed.

## Draft responsive search ads

Draft only. Not published, and no campaign destinations were changed. Counts generated by script; every
headline is 30 characters or fewer and every description 90 or fewer.

### Panel replacement

- **Final URL:** https://allsafehomeservice.com/lp/panel-replacement/
- **Primary intent:** Hire an electrician to replace or upgrade a home electrical panel
- **Keyword theme:** electrical panel replacement parker; panel upgrade parker co; breaker box replacement; fuse box replacement; 200 amp service upgrade; electrical panel upgrade near me

| Headline | Chars |
|---|---|
| Panel Replacement in Parker | 27 |
| Electrical Panel Upgrades | 25 |
| Licensed Master Electrician | 27 |
| Written Price Before Work | 25 |
| Permit & Inspection Handled | 27 |
| Repair or Replace? We Assess | 28 |
| Fuse Box Replacement | 20 |
| Service Upgrades for EVs | 24 |
| 200-Amp Service Upgrades | 24 |
| Parker-Based Since 2018 | 23 |
| Serving South Denver Metro | 26 |
| Call Allsafe Electric | 21 |

| Description | Chars |
|---|---|
| Panel replacement and service upgrades by licensed electricians. Written price first. | 85 |
| We assess your panel, explain repair vs. replacement, and price it in writing first. | 84 |
| Permit filed, utility disconnect coordinated, inspection attended. Based in Parker. | 83 |
| Adding an EV charger or hot tub? We size your service to your actual loads. | 75 |

**How the ad and page align:** H1 and hero match "panel replacement and upgrades in Parker". Page carries the repair-vs-replace comparison, permit/utility process, the panel price range from lib/services.ts and the cost factors, so every ad claim (permit handled, written price, EV/200-amp sizing, licensed, Parker since 2018) is visible on the page.

### Breaker repair

- **Final URL:** https://allsafehomeservice.com/lp/breaker-repair/
- **Primary intent:** Hire an electrician for a breaker that keeps tripping or will not reset
- **Keyword theme:** circuit breaker repair parker; breaker keeps tripping electrician; breaker won't reset electrician; replace circuit breaker; afci breaker keeps tripping electrician. Keep "circuit breaker troubleshooting" and "residential electrical troubleshooting" PAUSED. Keep DIY/how-to negatives.

| Headline | Chars |
|---|---|
| Circuit Breaker Repair | 22 |
| Breaker Keeps Tripping? | 23 |
| Breaker Won't Reset? Call Us | 28 |
| Licensed Parker Electricians | 28 |
| Written Repair Price First | 26 |
| Flat-Fee Diagnostic Visit | 25 |
| We Find the Cause First | 23 |
| AFCI & GFCI Breaker Repair | 26 |
| Open Weekdays 8am to 6pm | 24 |
| Call Allsafe Electric | 21 |

| Description | Chars |
|---|---|
| A licensed electrician finds why your breaker trips and quotes the repair in writing. | 85 |
| Flat-fee diagnostic visit. You approve the written repair price before work starts. | 83 |
| Parker-based residential electrician serving 21 South Denver metro communities. | 79 |

**How the ad and page align:** Ad and page are both about hiring a professional to diagnose and repair, not DIY troubleshooting. Page shows what is checked on a tripping circuit, the flat-fee diagnostic wording (no amount), written-price approval and weekday hours.

### Outlet repair

- **Final URL:** https://allsafehomeservice.com/lp/outlet-repair/
- **Primary intent:** Hire an electrician for dead outlets, a GFCI that will not reset, or sparking outlets
- **Keyword theme:** outlet repair parker; gfci outlet repair; electrician for dead outlet; outlet not working electrician; sparking outlet repair

| Headline | Chars |
|---|---|
| Outlet & GFCI Repair | 20 |
| Dead Outlet? We Can Help | 24 |
| GFCI Won't Reset? | 17 |
| Sparking Outlet Repair | 22 |
| Kitchen, Bath & Garage Outlets | 30 |
| Licensed Parker Electricians | 28 |
| Written Repair Price First | 26 |
| Flat-Fee Diagnostic Visit | 25 |
| Call Allsafe Electric | 21 |

| Description | Chars |
|---|---|
| Dead outlets, GFCIs that won't reset, or sparking outlets. Licensed electricians. | 81 |
| We test the outlet and circuit, find the fault, and quote the repair in writing first. | 86 |
| Flat-fee diagnostic visit. Open weekdays, 8am to 6pm. Call Allsafe Electric. | 76 |

**How the ad and page align:** H1 names outlets and GFCI. Page lists the outlet problems handled (dead, GFCI, sparking/warm, loose, kitchen/bath/garage/outdoor), where the fault usually is, measured safety guidance, and the written-price process.

### Partial power loss

- **Final URL:** https://allsafehomeservice.com/lp/partial-power-loss/
- **Primary intent:** Hire an electrician when part of the home or a circuit has lost power
- **Keyword theme:** partial power outage house electrician; half house no power electrician; one room no power electrician; outlets not working breaker not tripped

| Headline | Chars |
|---|---|
| Lost Power to Part of Home? | 27 |
| Partial Power Loss Repair | 25 |
| One Room Without Power? | 23 |
| Outlets Dead, Breaker On? | 25 |
| We Trace Where Power Stops | 26 |
| Licensed Parker Electricians | 28 |
| Written Repair Price First | 26 |
| Call Allsafe Electric | 21 |

| Description | Chars |
|---|---|
| One room or circuit out? A licensed electrician traces where the power stops. | 77 |
| We help you tell a home wiring problem from a utility outage. Based in Parker. | 78 |
| Flat-fee diagnostic visit and a written price before any repair work starts. | 76 |

**How the ad and page align:** Page leads with the home-or-utility decision so it does not imply every outage is home wiring or needs a new panel; ads promise tracing the power loss and the written-price process, both shown on the page.

### Electrician (general / near me)

- **Final URL:** https://allsafehomeservice.com/lp/electrician/
- **Primary intent:** Hire a local residential electrician, including "electrician near me"
- **Keyword theme:** electrician parker co; electrician near me; residential electrician parker; electrician castle rock; electrician highlands ranch (only towns in the 21-community list)

| Headline | Chars |
|---|---|
| Electrician in Parker, CO | 25 |
| Residential Electrician | 23 |
| Licensed Local Electricians | 27 |
| Parker-Based Since 2018 | 23 |
| Serving 21 Metro Communities | 28 |
| Repairs, Panels & EV Chargers | 29 |
| Written Price Before Work | 25 |
| Open Weekdays 8am to 6pm | 24 |
| Call Allsafe Electric | 21 |

| Description | Chars |
|---|---|
| Licensed residential electricians in Parker. Repairs, panels, lighting, EV chargers. | 84 |
| Serving Castle Rock, Highlands Ranch, Lone Tree, Centennial and more. Call to confirm. | 86 |
| You get the price in writing before work starts. Open weekdays, 8am to 6pm. | 75 |

**How the ad and page align:** Page shows the 21 communities grouped by county so a near-me visitor can confirm coverage in seconds, plus the residential job types named in the ads.

