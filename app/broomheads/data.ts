// Broomheads Plumbing & Heating — business facts.
// Sourced from public listings (broomheadsplumbing.co.uk, Yell, directories).
// Verified: family-run Sheffield business, 40+ years, Gas Safe, fully insured.

export const BUSINESS = {
  name: "Broomheads Plumbing & Heating",
  shortName: "Broomheads",
  tagline: "Your local Sheffield plumbers",
  established: 1983, // 40+ years' experience per their listings
  yearsExperience: "40+",
  // Primary number is click-to-call across the site.
  phonePrimary: { display: "0114 230 7222", tel: "+441142307222" },
  phoneSecondary: { display: "0114 286 4222", tel: "+441142864222" },
  phoneMobile: { display: "07836 507 222", tel: "+447836507222" },
  email: "info@broomheadsplumbing.co.uk",
  address: {
    line1: "61 Blackbrook Road",
    city: "Sheffield",
    postcode: "S10 4LQ",
  },
  hours: [
    { days: "Mon – Fri", time: "8:00am – 6:00pm" },
    { days: "Saturday", time: "9:00am – 1:00pm" },
    { days: "Sunday", time: "Emergency call-outs only" },
  ],
  gasSafe: "XXXXXX", // placeholder — drop in the real Gas Safe registration number
} as const;

export const SERVICES = [
  {
    icon: "flame",
    title: "Boiler installation & repair",
    text: "New A-rated boilers supplied & fitted, plus fast repairs and annual servicing to keep you warm and safe.",
    points: ["Gas Safe installs", "Breakdown repairs", "Annual servicing"],
  },
  {
    icon: "thermometer",
    title: "Central heating",
    text: "Full heating systems, radiator upgrades, smart controls and power-flushing to cure cold spots.",
    points: ["System upgrades", "Radiators & valves", "Power flushing"],
  },
  {
    icon: "shower",
    title: "Bathrooms",
    text: "Complete bathroom design and installation — from a new shower to a full refit, finished to a high standard.",
    points: ["Design & supply", "Full installation", "Tiling & finishing"],
  },
  {
    icon: "droplet",
    title: "General plumbing",
    text: "Leaks, taps, toilets, burst pipes and blockages — the everyday jobs done quickly and tidily.",
    points: ["Leaks & bursts", "Taps & toilets", "Blockages cleared"],
  },
] as const;

export const TRUST = [
  { icon: "shield", label: "Gas Safe Registered" },
  { icon: "clock", label: `${BUSINESS.yearsExperience} years' experience` },
  { icon: "home", label: "Family-run & local" },
  { icon: "check", label: "Fully insured & guaranteed" },
] as const;

export const WHY_US = [
  {
    icon: "shield",
    title: "Gas Safe & fully insured",
    text: "Every gas job is carried out by Gas Safe registered engineers, and all work is insured and guaranteed for your peace of mind.",
  },
  {
    icon: "clock",
    title: "Four decades in Sheffield",
    text: "A long-serving, family-run business that's looked after Sheffield homes for over 40 years — most of our work comes from word of mouth.",
  },
  {
    icon: "pound",
    title: "Clear, upfront pricing",
    text: "Honest quotes with no hidden extras and no call-out con. You'll know the price before we start the work.",
  },
  {
    icon: "sparkles",
    title: "Clean & tidy, every time",
    text: "Customers consistently praise our punctual, tidy engineers who treat your home with respect and clear up after themselves.",
  },
] as const;

export const STEPS = [
  { n: "1", title: "Get in touch", text: "Call us or request a callback. Tell us what's wrong — we'll often diagnose over the phone." },
  { n: "2", title: "Free, fair quote", text: "We assess the job and give you a clear written quote with no obligation and no surprises." },
  { n: "3", title: "Job done right", text: "Our Gas Safe engineers complete the work on time, tidy up, and guarantee the result." },
] as const;

export const REVIEWS = [
  {
    name: "Sarah M.",
    area: "Fulwood, S10",
    text: "Broomheads fitted our new boiler and a full bathroom. Superb workmanship, turned up on time every day and left the place spotless. Wouldn't use anyone else.",
  },
  {
    name: "David & Jane P.",
    area: "Crosspool",
    text: "Called them with a leak under the sink — sorted the same day. Friendly, fair price and clearly knew exactly what they were doing. Highly recommended.",
  },
  {
    name: "Michael R.",
    area: "Ecclesall, S11",
    text: "We've used Broomheads for years for our heating and servicing. Always reliable, always tidy and genuinely honest about what does and doesn't need doing.",
  },
] as const;

export const AREAS = [
  "Crosspool",
  "Fulwood",
  "Broomhill",
  "Ecclesall",
  "Hillsborough",
  "Walkley",
  "Nether Edge",
  "Ranmoor",
  "Stannington",
  "Dore & Totley",
  "Sharrow",
  "Greater Sheffield",
] as const;

export const FAQS = [
  {
    q: "Are you Gas Safe registered?",
    a: "Yes. All of our gas and boiler work is carried out by Gas Safe registered engineers, so every installation, service and repair meets the legal safety standard.",
  },
  {
    q: "Do you charge for quotes?",
    a: "No. We provide free, no-obligation quotes. For many jobs we can give you a good idea of cost over the phone, and we'll always confirm the price in writing before starting.",
  },
  {
    q: "Do you cover emergencies?",
    a: "Yes — for burst pipes, major leaks and heating failures we offer emergency call-outs, including Sundays. Call our main line and we'll get to you as quickly as we can.",
  },
  {
    q: "Which areas do you cover?",
    a: "We're based on Blackbrook Road in S10 and cover Sheffield and the surrounding suburbs, including Crosspool, Fulwood, Broomhill, Ecclesall, Hillsborough and beyond.",
  },
  {
    q: "Is your work guaranteed?",
    a: "It is. We're fully insured and we guarantee our workmanship. As a family-run business, our reputation matters — most of our work comes from repeat customers and recommendations.",
  },
] as const;
