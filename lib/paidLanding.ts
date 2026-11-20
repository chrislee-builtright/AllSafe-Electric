import type { Faq } from './services';

/**
 * Google Ads landing pages (/lp/{slug}/). Noindex, excluded from sitemaps and organic
 * navigation. Content rules are the same as the rest of the site (CLAUDE.md):
 * - hours stated only as "We are open weekdays, 8am to 6pm."
 * - no emergency, same-day, after-hours or 24/7 claims
 * - diagnostic fee: flat fee, never the amount, never credited toward the repair
 * - prices only from lib/services.ts priceRange (rendered by the template, never typed here)
 * - "one of our licensed electricians", never one named person doing every job
 * - no review counts, ratings, warranties, financing or discounts typed into copy
 * The organic service pages are untouched; these pages only link to them.
 */

export const diagnosticCopy =
  "A diagnostic visit is a flat fee, and if any repairs or replacements are needed, we'll give you the price in writing before we start any work.";

export const hoursCopy = 'We are open weekdays, 8am to 6pm.';

export type DecisionBlock =
  | { kind: 'compare'; title: string; intro: string; left: { heading: string; items: string[] }; right: { heading: string; items: string[] }; note: string }
  | { kind: 'checklist'; title: string; intro: string; items: { title: string; text: string }[]; note?: string }
  | { kind: 'coverage'; title: string; intro: string };

export interface PaidLanding {
  slug: string;
  /** Analytics label for call clicks and the CallRail service context. */
  trackingService: string;
  /** Preselected option in the request form (a lib/services.ts slug). */
  formService: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  photo: string;
  photoAlt: string;
  handles: { title: string; text: string }[];
  boundaries: string[];
  decision: DecisionBlock;
  steps: { title: string; text: string }[];
  pricing: { intro: string; factors: string[]; showPanelRange?: boolean };
  reviewTags: string[];
  formIntro: string;
  /** The indexed organic page with fuller detail, linked for visitors who want more. */
  learnMore: { href: string; label: string };
  faqs: Faq[];
}

const requestAfter =
  'Sending a request does not book an appointment. We will contact you during business hours to discuss the problem, availability and next steps.';
export const afterContactCopy = requestAfter;

export const paidLandings: PaidLanding[] = [
  {
    slug: 'panel-replacement',
    trackingService: 'lp-panel-replacement',
    formService: 'electrical-panel-services',
    title: 'Electrical Panel Replacement in Parker, CO | Allsafe Electric',
    description:
      'Replace or upgrade your electrical panel with a licensed Parker electrician. Assessment, written price before work starts, permit and inspection handled.',
    eyebrow: 'Panel replacement & upgrades',
    h1: 'Electrical panel replacement and upgrades in Parker, CO',
    intro:
      'Replacing an outdated or damaged panel, adding capacity for an EV charger or addition, or finding out whether your panel needs replacing at all. One of our licensed electricians assesses your panel and service, explains your options, and gives you a written price before work starts.',
    photo: 'electrician-tightening-connections-in-breaker-panel',
    photoAlt: 'Allsafe electrician tightening connections inside a residential breaker panel',
    handles: [
      { title: 'Older or failing panels', text: 'Fuse boxes, panels with a known failure history such as Federal Pacific or Zinsco, and panels that have simply worn out.' },
      { title: 'More capacity for new loads', text: 'Service upgrades when an EV charger, hot tub, heat pump, addition or finished basement needs more than your current service provides.' },
      { title: 'Signs of damage', text: 'Rust or water inside the panel, scorch marks, a warm cover, buzzing, or a burning smell.' },
      { title: 'Out of breaker space', text: 'No room for new circuits. Sometimes a subpanel is the better answer, if your main service has capacity to spare.' },
    ],
    boundaries: [
      'Not every panel problem needs a new panel. A single failing breaker or loose connection is often a repair, and we will tell you if that is the case.',
      'The meter and the utility lines to your home belong to your utility. We coordinate the disconnect and reconnect with them.',
      'We focus on residential electrical work for homeowners.',
    ],
    decision: {
      kind: 'compare',
      title: 'Repair or replace?',
      intro: 'The answer depends on what the assessment finds, not on the age of the house alone. These are the patterns we look for.',
      left: {
        heading: 'Often a repair',
        items: [
          'One breaker trips or has failed in an otherwise sound panel',
          'A loose or overheated connection on a single circuit',
          'A damaged breaker that can be replaced with a compatible one',
        ],
      },
      right: {
        heading: 'Often a replacement',
        items: [
          'A fuse box, or a panel brand with a documented failure history',
          'Corrosion, water damage or heat damage inside the panel',
          'A service too small for the loads you have or are adding',
          'No space for the circuits you need, and no room for a subpanel',
        ],
      },
      note: 'After the assessment, we explain which situation you are in and what each option involves.',
    },
    steps: [
      { title: 'Call or send a request', text: 'Tell us about the panel, roughly how old the home is, and anything you plan to add, such as an EV charger.' },
      { title: 'Panel and service assessment', text: 'One of our licensed electricians checks the panel, service size, meter location and grounding, and reviews your current and planned loads.' },
      { title: 'Written price', text: 'You get your options and a written price before any work starts. Nothing proceeds without your approval.' },
      { title: 'Permit, installation and inspection', text: 'Panel replacements and service upgrades are permitted work. We file the permit, coordinate the utility disconnect and reconnect, and meet the inspector.' },
    ],
    pricing: {
      intro: 'Your price is set after we see the panel and service. On the phone we can talk through the typical range for work like yours.',
      factors: [
        'The amperage your home needs now and for planned additions',
        'Where the meter sits and whether the service mast needs replacing',
        'Grounding and bonding that needs bringing up to current code',
        'What the permit inspection requires',
      ],
      showPanelRange: true,
    },
    reviewTags: ['panel'],
    formIntro: 'Tell us about your panel and what you are hoping to add or fix.',
    learnMore: { href: '/electrical-panel-services/', label: 'Read more about our panel services' },
    faqs: [
      { q: 'How do I know if I need a new panel or just a repair?', a: 'An assessment tells you. A single tripping breaker or a loose connection is often a repair. A fuse box, a panel with a known failure history, damage inside the panel, or a service too small for your loads usually points to replacement. We explain what we find before you decide.' },
      { q: 'How long does a panel replacement take?', a: 'Most are completed in a single day. The power is off for part of it while the old panel comes out and the new one goes in. A service change that also needs a new mast or meter can run into a second day.' },
      { q: 'Do you handle the permit and inspection?', a: 'Yes. Panel replacements and service upgrades are permitted and inspected. We file the permit with the right jurisdiction for your address, coordinate the utility disconnect and reconnect, and meet the inspector.' },
      { q: 'Do I need a 200-amp service?', a: 'It depends on your loads. Many homes adding an EV charger, hot tub or electric heat need it, and some are fine at 150 amps. We size the service to your actual usage and plans rather than a default.' },
      { q: 'Can I add an EV charger without upgrading my panel?', a: 'Sometimes. It depends on your current service size, existing loads and available space in the panel. We check those before recommending an upgrade.' },
      { q: 'When can you schedule the work?', a: `${hoursCopy} Call to discuss current availability for an assessment. Installation is scheduled once you approve the written price and the permit is in place.` },
    ],
  },
  {
    slug: 'breaker-repair',
    trackingService: 'lp-breaker-repair',
    formService: 'electrical-troubleshooting',
    title: 'Circuit Breaker Repair in Parker, CO | Allsafe Electric',
    description:
      'Breaker keeps tripping or will not reset? A licensed Allsafe electrician finds the cause and gives you a written repair price before work starts. Parker, CO.',
    eyebrow: 'Circuit breaker repair',
    h1: 'Circuit breaker repair for homes in Parker, CO',
    intro:
      'A breaker that keeps tripping, will not reset, or feels warm is a sign something on that circuit needs attention. One of our licensed electricians finds the cause, explains the repair, and gives you a written price before any work starts.',
    photo: 'allsafe-electrician-testing-residential-breaker-panel',
    photoAlt: 'Allsafe electrician testing a residential breaker panel',
    handles: [
      { title: 'A breaker that trips repeatedly', text: 'Whether it trips every few days or every time the microwave runs, we find out what the circuit is reacting to.' },
      { title: 'A breaker that will not reset', text: 'A breaker that snaps back off or will not stay on usually points to a fault that needs locating.' },
      { title: 'AFCI and GFCI breaker trips', text: 'Protective breakers that trip without an obvious reason, including newer arc-fault breakers.' },
      { title: 'A warm, buzzing or marked breaker', text: 'Heat, buzzing or scorch marks at a breaker or the panel need a professional look.' },
    ],
    boundaries: [
      'We diagnose before replacing anything. A tripping breaker is often doing its job, and the cause may be wiring, the load on the circuit, or something plugged in.',
      'If an appliance turns out to be the cause, we will tell you so you can have it serviced.',
      'In the meantime, leave a breaker off if it keeps tripping or will not reset. Do not bypass it or install a larger breaker to stop the trips.',
    ],
    decision: {
      kind: 'checklist',
      title: 'What we check on a tripping circuit',
      intro: 'Replacing a breaker without finding the cause can leave the real problem in place. A diagnosis covers the whole circuit.',
      items: [
        { title: 'The breaker itself', text: 'Its condition, rating and connection to the panel.' },
        { title: 'Wiring and connections', text: 'Loose, damaged or overheated connections along the circuit.' },
        { title: 'What is running', text: 'The appliances and devices on the circuit when it trips.' },
        { title: 'The load on the circuit', text: 'Whether the circuit is carrying more than it was designed for.' },
        { title: 'Protective devices', text: 'How AFCI and GFCI protection is behaving on that circuit.' },
        { title: 'The panel around it', text: 'Signs of heat or wear that affect more than one breaker.' },
      ],
      note: 'If we find a wider panel problem, we explain your options before you decide on anything.',
    },
    steps: [
      { title: 'Call or send a request', text: 'Tell us which breaker is affected, how often it trips, and what was running when it did.' },
      { title: 'Diagnosis on site', text: 'One of our licensed electricians tests the breaker and circuit and explains what is causing the trips.' },
      { title: 'Written repair price', text: 'You get the price in writing before repair work starts. You decide whether to go ahead.' },
      { title: 'Repair and test', text: 'We complete the approved repair and test the circuit before we finish the visit.' },
    ],
    pricing: {
      intro: diagnosticCopy,
      factors: [
        'What the cause turns out to be: the breaker, wiring, a connection or the load',
        'The type of breaker involved, such as standard, AFCI or GFCI',
        'Whether any wiring or connections on the circuit need repair',
        'How accessible the wiring is',
      ],
    },
    reviewTags: ['panel', 'wiring'],
    formIntro: 'Tell us which breaker is tripping and what was running at the time.',
    learnMore: { href: '/electrical-troubleshooting/', label: 'Read more about our troubleshooting service' },
    faqs: [
      { q: 'Does a tripping breaker mean I need a new panel?', a: 'Not necessarily. The cause may be a connected appliance, an overloaded circuit, wiring, or the breaker itself. We diagnose the problem before recommending a repair or discussing panel work.' },
      { q: 'Can you just replace the breaker?', a: 'If the breaker is the fault, yes. We test first, because a new breaker on a circuit with a wiring problem or overload will keep tripping.' },
      { q: 'What should I tell you when I call?', a: 'Which breaker is affected, how often it trips, whether it resets, and what was running when it tripped. You do not need to open the panel.' },
      { q: 'Should I keep resetting the breaker?', a: 'If it keeps tripping or will not reset, leave it off and arrange an assessment. Do not bypass the breaker or replace it with a higher-rated one.' },
      { q: 'How does pricing work?', a: diagnosticCopy },
      { q: 'When can you come out?', a: `${hoursCopy} Call to discuss the problem and current appointment availability, or send a request using the form on this page.` },
    ],
  },
  {
    slug: 'outlet-repair',
    trackingService: 'lp-outlet-repair',
    formService: 'electrical-outlet-services',
    title: 'Outlet & GFCI Repair in Parker, CO | Allsafe Electric',
    description:
      'Dead outlet, GFCI that will not reset, or an outlet that sparks? A licensed Allsafe electrician finds the cause and quotes the repair in writing. Parker, CO.',
    eyebrow: 'Outlet & GFCI repair',
    h1: 'Outlet and GFCI repair in Parker and the South Denver metro',
    intro:
      'Dead outlets, a GFCI that will not reset, or an outlet that sparks, buzzes or feels warm. One of our licensed electricians tests the outlet and its circuit, finds the cause, and gives you a written price before repairing it.',
    photo: 'electrician-testing-gfci-kitchen-outlet',
    photoAlt: 'Electrician testing a GFCI outlet in a kitchen',
    handles: [
      { title: 'One or more dead outlets', text: 'A single outlet or a group that stopped working, including outlets that share protection across rooms.' },
      { title: 'GFCI outlets that will not reset', text: 'Kitchen, bathroom, garage and outdoor GFCI outlets that will not reset or keep tripping.' },
      { title: 'Sparking, buzzing or warm outlets', text: 'Outlets that spark when something is plugged in, make noise, feel warm, or show scorch marks.' },
      { title: 'Loose or worn outlets', text: 'Outlets where plugs fall out or the outlet moves in the wall.' },
    ],
    boundaries: [
      'If an outlet is sparking, smells hot or shows scorch marks, stop using it and switch off its breaker if you can do so safely, then call us.',
      'We do not recommend opening outlets or testing wiring yourself. Describing what you see is enough.',
      'A dead outlet is not always the outlet. The cause can be elsewhere on the circuit, which is why we test before replacing.',
    ],
    decision: {
      kind: 'checklist',
      title: 'Where the problem usually is',
      intro: 'Outlets on the same circuit are connected, so the fault is not always at the outlet that stopped working.',
      items: [
        { title: 'The outlet itself', text: 'A worn or failed outlet, or a loose connection behind it.' },
        { title: 'A GFCI in another room', text: 'One GFCI can protect outlets in a bathroom, garage or outside wall.' },
        { title: 'An earlier outlet on the circuit', text: 'A loose connection upstream can cut power to the outlets after it.' },
        { title: 'The breaker', text: 'A tripped or failed breaker, including AFCI and GFCI breakers.' },
      ],
      note: 'We trace the circuit, repair the fault we find, and test the outlets before we finish.',
    },
    steps: [
      { title: 'Call or send a request', text: 'Tell us which outlets stopped working, when you noticed, and whether a reset has been tried.' },
      { title: 'Testing on site', text: 'One of our licensed electricians tests the outlets and circuit and explains where the fault is.' },
      { title: 'Written repair price', text: 'You get the price in writing before repair work starts.' },
      { title: 'Repair and test', text: 'We complete the approved repair and test the outlets and circuit before we finish the visit.' },
    ],
    pricing: {
      intro: diagnosticCopy,
      factors: [
        'How many outlets are affected',
        'Whether the fault is at the outlet or elsewhere on the circuit',
        'The type of outlet needed, such as standard, GFCI, weather-resistant or USB',
        'The condition of the wiring and electrical box behind the outlet',
      ],
    },
    reviewTags: ['outlets'],
    formIntro: 'Tell us which outlets are affected and what you have noticed.',
    learnMore: { href: '/electrical-outlet-services/', label: 'Read more about our outlet services' },
    faqs: [
      { q: 'The breaker is on but the outlet is dead. Can you help?', a: 'Yes. A breaker that appears on does not rule out a problem at a GFCI, an upstream outlet or a connection on the circuit. We test the circuit to find where power stops.' },
      { q: 'Does a GFCI that will not reset need replacing?', a: 'Not always. A failed device, loss of power to the GFCI, or a fault on the outlets it protects can all stop a reset. We test before recommending a replacement.' },
      { q: 'An outlet sparked when I plugged something in. Is it dangerous?', a: 'A small spark can be normal, but repeated sparks, heat, a burning smell or scorch marks are not. Stop using the outlet, switch off its breaker if you can do so safely, and arrange an assessment.' },
      { q: 'Do you repair bathroom, garage and outdoor outlets?', a: 'Yes. We repair outlets and GFCI protection throughout the home, including kitchens, bathrooms, garages and outdoor walls.' },
      { q: 'How does pricing work?', a: diagnosticCopy },
      { q: 'When can you come out?', a: `${hoursCopy} Call to discuss the problem and current appointment availability, or send a request using the form on this page.` },
    ],
  },
  {
    slug: 'partial-power-loss',
    trackingService: 'lp-partial-power-loss',
    formService: 'electrical-troubleshooting',
    title: 'Partial Power Loss Electrician in Parker, CO | Allsafe Electric',
    description:
      'Lost power to one room or part of your home? A licensed Allsafe electrician traces where the power stops and explains the fix. Parker and South Denver metro.',
    eyebrow: 'Partial power loss',
    h1: 'Lost power to part of your home? We can help find out why.',
    intro:
      'When one room, a group of outlets or part of the house goes dark while the rest still works, one of our licensed electricians traces where the power stops and explains whether the fix is in your home or needs your utility.',
    photo: 'electrician-testing-voltage-in-electrical-panel',
    photoAlt: 'Electrician testing voltage inside a residential electrical panel',
    handles: [
      { title: 'One room or area without power', text: 'Outlets and lights out in one part of the home while everything else works.' },
      { title: 'Outlets out, lights still on', text: 'Or the other way around. Mixed patterns help us narrow down the circuit involved.' },
      { title: 'The breaker looks on, but power is off', text: 'Breaker position alone does not confirm a circuit is working. We test and trace it.' },
      { title: 'Several circuits out at once', text: 'We assess the pattern and help determine whether the problem is in your home or the incoming supply.' },
    ],
    boundaries: [
      'Not every outage starts in your home. Some partial outages come from the utility supply, and utility-owned equipment can only be repaired by the utility.',
      'A partial outage does not mean you need a new panel. Most are traced to a single circuit, connection or protective device.',
      'If lights are dimming and brightening across the house, switch off sensitive electronics you can safely reach and check with your utility. If you smell burning, leave the area and call 911.',
    ],
    decision: {
      kind: 'compare',
      title: 'Your home or your utility?',
      intro: 'A few quick observations help decide who to call first. You do not need to open the panel to check these.',
      left: {
        heading: 'May be the utility supply',
        items: [
          'Neighbors have also lost some or all power',
          'Lights throughout the house dim, brighten or flicker together',
          'Several large appliances stopped working at the same moment',
        ],
      },
      right: {
        heading: 'Likely inside your home',
        items: [
          'One room or one group of outlets is out',
          'Outlets are out but the lights in that room work, or the reverse',
          'A GFCI or breaker will not reset',
        ],
      },
      note: 'If it looks like the utility, check their outage information first. If you are unsure, call us and describe what you are seeing.',
    },
    steps: [
      { title: 'Call and describe the outage', text: 'Which rooms, lights and outlets are affected, when it started, and whether neighbors have power. We help you decide whether to contact the utility first.' },
      { title: 'Trace the power loss', text: 'One of our licensed electricians tests the affected circuits and finds where the power stops.' },
      { title: 'Explain the fix', text: 'We tell you whether the repair is in your home or needs the utility, and give you a written price for any repair in your home before work starts.' },
      { title: 'Repair and test', text: 'We complete the approved repair and test the affected circuits before we finish the visit.' },
    ],
    pricing: {
      intro: diagnosticCopy,
      factors: [
        'How many circuits are affected',
        'Whether the cause is a connection, a protective device, wiring or the panel',
        'How accessible the wiring is',
        'Whether part of the problem sits with the utility, which repairs its own equipment',
      ],
    },
    reviewTags: ['wiring', 'emergency'],
    formIntro: 'Tell us which rooms or outlets lost power and when it started.',
    learnMore: { href: '/electrical-troubleshooting/', label: 'Read more about our troubleshooting service' },
    faqs: [
      { q: 'Should I call the utility or an electrician?', a: 'If neighbors are affected or lights across the house are dimming and brightening, check your utility’s outage information first. If the outage is limited to part of your home, call us to describe the symptoms. Some partial outages still need the utility.' },
      { q: 'Half the house has no power. Can you help?', a: 'Yes. We assess the outage and help identify whether it involves your home’s circuits or the incoming supply. Utility-owned equipment is repaired by the utility.' },
      { q: 'Does this mean I need a new panel?', a: 'Not usually. Most partial outages trace back to a single circuit, connection or protective device. If we find a panel problem, we explain your options before you decide.' },
      { q: 'What information helps when I call?', a: 'Which rooms and devices are affected, when it began, whether lights changed brightness, and whether nearby homes have power. You do not need to open the panel or inspect wiring.' },
      { q: 'How does pricing work?', a: diagnosticCopy },
      { q: 'When can you come out?', a: `${hoursCopy} Call to discuss the problem and current appointment availability, or send a request using the form on this page.` },
    ],
  },
  {
    slug: 'electrician',
    trackingService: 'lp-electrician',
    formService: '',
    title: 'Residential Electrician in Parker, CO | Allsafe Electric',
    description:
      'Licensed residential electrician based in Parker, serving 21 South Denver metro communities. Repairs, panels, lighting and EV chargers. Call Allsafe Electric.',
    eyebrow: 'Residential electrician',
    h1: 'Residential electrician serving Parker and the South Denver metro',
    intro:
      'Allsafe Electric is a licensed residential electrical contractor based in Parker since 2018. We serve 21 communities across the South Denver metro, from repairs and panel work to lighting and EV chargers.',
    photo: 'allsafe-electrician-standing-in-modern-home',
    photoAlt: 'Allsafe electrician on a job inside a South Denver metro home',
    handles: [
      { title: 'Repairs and troubleshooting', text: 'Tripping breakers, dead outlets, partial power loss, flickering lights and switches that stopped working.' },
      { title: 'Panels and capacity', text: 'Panel replacements, service upgrades, subpanels and whole-home surge protection.' },
      { title: 'New circuits and installs', text: 'EV chargers, hot tub hookups, standby generators, ceiling fans and new outlets.' },
      { title: 'Lighting and safety', text: 'Indoor and outdoor lighting, smoke and CO detectors, and home electrical safety inspections.' },
    ],
    boundaries: [
      'We work on homes in the communities listed below. If yours is not listed, call or include your ZIP code in your request and we will confirm.',
      `${hoursCopy} Call to discuss your project and current appointment availability.`,
    ],
    decision: {
      kind: 'coverage',
      title: 'Do we serve your area?',
      intro: 'We serve 21 communities across the South Denver metro. Find yours below.',
    },
    steps: [
      { title: 'Call or send a request', text: 'Tell us what you need and where the home is, so we can confirm we serve your address.' },
      { title: 'Visit or assessment', text: 'One of our licensed electricians looks at the problem or project and explains what is involved.' },
      { title: 'Written price', text: 'You get the price in writing before any work starts.' },
      { title: 'The work, permitted where required', text: 'We complete the approved work, file permits for work that needs them, and test before we finish.' },
    ],
    pricing: {
      intro: `For repairs, ${diagnosticCopy.charAt(0).toLowerCase()}${diagnosticCopy.slice(1)} For larger projects such as panels and EV chargers, we discuss the scope first and price the job in writing.`,
      factors: [
        'The type of repair or project',
        'What the diagnosis or assessment finds',
        'Materials, fixtures or equipment involved',
        'Whether the work needs a permit and inspection',
      ],
    },
    reviewTags: [],
    formIntro: 'Tell us what you need and where the home is.',
    learnMore: { href: '/electrical-services/', label: 'See all of our residential services' },
    faqs: [
      { q: 'Are you licensed?', a: 'Yes. Allsafe Electric holds a Colorado electrical contractor license, EC.0101068, and our master electrician holds license ME.0601023. Both can be checked on the state license lookup.' },
      { q: 'Which areas do you serve?', a: 'We are based in Parker and serve 21 communities across the South Denver metro, including Castle Rock, Highlands Ranch, Lone Tree, Centennial and Aurora. The full list is on this page. If you are unsure, call and we will confirm your address.' },
      { q: 'Do you work on commercial buildings?', a: 'We focus on residential electrical work for homeowners.' },
      { q: 'How does pricing work?', a: `${diagnosticCopy} Larger projects are priced in writing after we understand the scope.` },
      { q: 'Do you pull permits?', a: 'Yes, for work that requires one, such as panel and service upgrades, EV chargers, generators and hot tub circuits. We file with the right jurisdiction for your address and meet the inspector.' },
      { q: 'When are you available?', a: `${hoursCopy} Call to discuss your project and current appointment availability, or send a request using the form on this page.` },
    ],
  },
];

export const getPaidLanding = (slug: string) => paidLandings.find((p) => p.slug === slug);
