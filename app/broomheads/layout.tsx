import type { Metadata } from "next";
import Link from "next/link";
import Icon from "./Icon";
import { BUSINESS } from "./data";

export const metadata: Metadata = {
  title: "Broomheads Plumbing & Heating | Sheffield Plumbers — Gas Safe",
  description:
    "Sheffield's family-run plumbers with 40+ years' experience. Gas Safe boiler installation & repair, central heating, bathrooms and emergency plumbing. Free quotes — call 0114 230 7222.",
  openGraph: {
    title: "Broomheads Plumbing & Heating — Sheffield Plumbers",
    description:
      "Family-run, Gas Safe registered Sheffield plumbers. Boilers, heating, bathrooms & emergency plumbing. Free quotes.",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Plumber",
  name: BUSINESS.name,
  description:
    "Family-run Sheffield plumbing and heating business with over 40 years' experience. Gas Safe registered.",
  telephone: BUSINESS.phonePrimary.display,
  email: BUSINESS.email,
  url: "https://www.broomheadsplumbing.co.uk/",
  areaServed: "Sheffield",
  address: {
    "@type": "PostalAddress",
    streetAddress: BUSINESS.address.line1,
    addressLocality: BUSINESS.address.city,
    postalCode: BUSINESS.address.postcode,
    addressCountry: "GB",
  },
  openingHours: ["Mo-Fr 08:00-18:00", "Sa 09:00-13:00"],
  priceRange: "££",
};

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-bh-navy"
    >
      {children}
    </a>
  );
}

export default function BroomheadsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-full flex-col bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top utility bar */}
      <div className="bg-bh-navy text-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-2 text-xs sm:px-6 sm:text-sm">
          <span className="inline-flex items-center gap-2">
            <Icon name="shield" className="h-4 w-4 text-bh-gas" />
            Gas Safe registered · Fully insured
          </span>
          <span className="hidden items-center gap-2 sm:inline-flex">
            <Icon name="mapPin" className="h-4 w-4 text-bh-blue-100" />
            {BUSINESS.address.city} · {BUSINESS.address.postcode}
          </span>
        </div>
      </div>

      {/* Sticky header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href="#top" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-bh-blue-600 text-white shadow-sm">
              <Icon name="wrench" className="h-6 w-6" />
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-extrabold tracking-tight text-bh-navy">
                Broomheads
              </span>
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-bh-blue-600">
                Plumbing &amp; Heating
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-1 lg:flex">
            <NavLink href="#services">Services</NavLink>
            <NavLink href="#why">Why us</NavLink>
            <NavLink href="#reviews">Reviews</NavLink>
            <NavLink href="#areas">Areas</NavLink>
            <NavLink href="#faq">FAQs</NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="#quote"
              className="hidden rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-bh-navy transition hover:bg-slate-50 sm:inline-flex"
            >
              Free quote
            </a>
            <a
              href={`tel:${BUSINESS.phonePrimary.tel}`}
              className="inline-flex items-center gap-2 rounded-xl bg-bh-accent-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-bh-accent-700"
            >
              <Icon name="phone" className="h-4 w-4" filled />
              <span className="hidden sm:inline">
                {BUSINESS.phonePrimary.display}
              </span>
              <span className="sm:hidden">Call</span>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20 lg:pb-0">{children}</main>

      {/* Footer */}
      <footer className="bg-bh-navy text-slate-300">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-bh-blue-600 text-white">
                <Icon name="wrench" className="h-5 w-5" />
              </span>
              <span className="text-lg font-extrabold text-white">
                Broomheads Plumbing &amp; Heating
              </span>
            </div>
            <p className="mt-4 max-w-md text-sm text-slate-400">
              Sheffield&apos;s family-run plumbing and heating specialists for
              over 40 years. Gas Safe registered, fully insured, and trusted by
              homeowners right across the city.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
                Gas Safe Registered
              </span>
              <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
                Fully Insured
              </span>
              <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
                Est. {BUSINESS.established}
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-white">
              Contact
            </h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href={`tel:${BUSINESS.phonePrimary.tel}`}
                  className="inline-flex items-center gap-2 font-semibold text-white hover:text-bh-gas"
                >
                  <Icon name="phone" className="h-4 w-4" />
                  {BUSINESS.phonePrimary.display}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${BUSINESS.phoneMobile.tel}`}
                  className="inline-flex items-center gap-2 hover:text-white"
                >
                  <Icon name="phone" className="h-4 w-4" />
                  {BUSINESS.phoneMobile.display}
                </a>
              </li>
              <li className="inline-flex items-center gap-2">
                <Icon name="mapPin" className="h-4 w-4" />
                {BUSINESS.address.line1}, {BUSINESS.address.city},{" "}
                {BUSINESS.address.postcode}
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-white">
              Opening hours
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              {BUSINESS.hours.map((h) => (
                <li key={h.days} className="flex justify-between gap-4">
                  <span className="text-slate-400">{h.days}</span>
                  <span className="text-right text-slate-200">{h.time}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-slate-400 sm:flex-row sm:px-6">
            <p>
              © {new Date().getFullYear()} Broomheads Plumbing &amp; Heating ·
              Sheffield
            </p>
            <p>
              <Link href="/" className="hover:text-white">
                Concept mockup
              </Link>
            </p>
          </div>
        </div>
      </footer>

      {/* Sticky mobile call/quote bar — major mobile conversion lever */}
      <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-2 gap-px border-t border-slate-200 bg-slate-200 lg:hidden">
        <a
          href={`tel:${BUSINESS.phonePrimary.tel}`}
          className="flex items-center justify-center gap-2 bg-bh-blue-600 py-3.5 text-sm font-bold text-white"
        >
          <Icon name="phone" className="h-5 w-5" filled />
          Call now
        </a>
        <a
          href="#quote"
          className="flex items-center justify-center gap-2 bg-bh-accent-600 py-3.5 text-sm font-bold text-white"
        >
          <Icon name="arrowRight" className="h-5 w-5" />
          Free quote
        </a>
      </div>
    </div>
  );
}
