import Icon from "./Icon";
import QuoteForm from "./QuoteForm";
import {
  AREAS,
  BUSINESS,
  FAQS,
  REVIEWS,
  SERVICES,
  STEPS,
  TRUST,
  WHY_US,
} from "./data";

export default function BroomheadsPage() {
  return (
    <div id="top">
      {/* ---------- Hero ---------- */}
      <section className="bh-hero text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-bh-blue-100 ring-1 ring-white/15">
              <Icon name="star" className="h-3.5 w-3.5 text-bh-gas" filled />
              Trusted in Sheffield for {BUSINESS.yearsExperience} years
            </span>

            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Sheffield&apos;s family-run{" "}
              <span className="text-bh-gas">plumbers &amp; heating</span>{" "}
              engineers
            </h1>

            <p className="mt-5 max-w-xl text-lg text-slate-200">
              Gas Safe registered boilers, central heating, bathrooms and
              emergency plumbing — done properly, on time and tidied up after.
              Free, no-obligation quotes.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={`tel:${BUSINESS.phonePrimary.tel}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-bh-accent-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-orange-900/30 transition hover:bg-bh-accent-700"
              >
                <Icon name="phone" className="h-5 w-5" filled />
                Call {BUSINESS.phonePrimary.display}
              </a>
              <a
                href="#quote"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-6 py-4 text-base font-bold text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-white/15"
              >
                Get a free quote
                <Icon name="arrowRight" className="h-5 w-5" />
              </a>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-200">
              {TRUST.map((t) => (
                <li key={t.label} className="inline-flex items-center gap-2">
                  <Icon name={t.icon} className="h-4 w-4 text-bh-gas" />
                  {t.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Quote card */}
          <div id="quote" className="lg:justify-self-end lg:pl-4">
            <QuoteForm />
          </div>
        </div>
      </section>

      {/* ---------- Trust / emergency strip ---------- */}
      <section className="border-b border-slate-200 bg-bh-blue-50">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-5 text-center sm:flex-row sm:px-6 sm:text-left">
          <p className="text-sm font-semibold text-bh-navy sm:text-base">
            Burst pipe, leak or no heating?{" "}
            <span className="text-bh-blue-700">
              We offer emergency call-outs across Sheffield.
            </span>
          </p>
          <a
            href={`tel:${BUSINESS.phonePrimary.tel}`}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-bh-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-bh-blue-700"
          >
            <Icon name="phone" className="h-4 w-4" filled />
            {BUSINESS.phonePrimary.display}
          </a>
        </div>
      </section>

      {/* ---------- Services ---------- */}
      <section id="services" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHead
          eyebrow="What we do"
          title="Plumbing &amp; heating, all under one roof"
          sub="From a dripping tap to a full boiler swap or bathroom refit — one local team you can rely on."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <div
              key={s.title}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-bh-blue-500 hover:shadow-lg"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-bh-blue-50 text-bh-blue-600 transition group-hover:bg-bh-blue-600 group-hover:text-white">
                <Icon name={s.icon} className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-bh-navy">{s.title}</h3>
              <p className="mt-2 flex-1 text-sm text-slate-500">{s.text}</p>
              <ul className="mt-4 space-y-1.5">
                {s.points.map((p) => (
                  <li
                    key={p}
                    className="inline-flex items-center gap-2 text-sm text-slate-600"
                  >
                    <Icon name="check" className="h-4 w-4 text-bh-accent-600" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Why us ---------- */}
      <section id="why" className="bg-slate-50">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <SectionHead
                align="left"
                eyebrow="Why Broomheads"
                title="The local name Sheffield homeowners pass on"
                sub="We're not a national call-centre. We're a small, family-run team that lives and works here — and our reputation is everything."
              />
              <dl className="mt-8 grid grid-cols-3 gap-4">
                <Stat value={BUSINESS.yearsExperience} label="Years in Sheffield" />
                <Stat value="100%" label="Gas Safe work" />
                <Stat value="5★" label="Workmanship" />
              </dl>
              <a
                href="#quote"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-bh-accent-600 px-6 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-bh-accent-700"
              >
                Get your free quote
                <Icon name="arrowRight" className="h-5 w-5" />
              </a>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {WHY_US.map((w) => (
                <div
                  key={w.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-bh-accent-50 text-bh-accent-600">
                    <Icon name={w.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-bold text-bh-navy">{w.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-500">{w.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Process ---------- */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHead
          eyebrow="How it works"
          title="Sorted in three simple steps"
          sub="No pressure, no jargon — just a straightforward way to get the job done."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="relative rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-bh-blue-600 text-lg font-extrabold text-white">
                {step.n}
              </span>
              <h3 className="mt-5 text-lg font-bold text-bh-navy">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-slate-500">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Reviews ---------- */}
      <section id="reviews" className="bg-bh-navy">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="text-center">
            <span className="text-sm font-bold uppercase tracking-wide text-bh-blue-100">
              Reviews
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
              What Sheffield says about us
            </h2>
            <div className="mt-3 inline-flex items-center gap-1 text-bh-gas">
              {Array.from({ length: 5 }).map((_, i) => (
                <Icon key={i} name="star" className="h-5 w-5" filled />
              ))}
              <span className="ml-2 text-sm font-medium text-slate-300">
                Rated for workmanship, punctuality &amp; tidiness
              </span>
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {REVIEWS.map((r) => (
              <figure
                key={r.name}
                className="flex flex-col rounded-2xl bg-white/5 p-6 ring-1 ring-white/10"
              >
                <div className="flex gap-1 text-bh-gas">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Icon key={i} name="star" className="h-4 w-4" filled />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-200">
                  “{r.text}”
                </blockquote>
                <figcaption className="mt-5 text-sm">
                  <span className="font-bold text-white">{r.name}</span>
                  <span className="block text-slate-400">{r.area}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Service areas ---------- */}
      <section id="areas" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <SectionHead
            align="left"
            eyebrow="Where we work"
            title="Covering Sheffield &amp; the surrounding suburbs"
            sub={`Based on Blackbrook Road in ${BUSINESS.address.postcode}, we cover the whole city and the western suburbs in particular.`}
          />
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {AREAS.map((area) => (
              <li
                key={area}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-bh-navy shadow-sm"
              >
                <Icon name="mapPin" className="h-4 w-4 text-bh-blue-600" />
                {area}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="faq" className="bg-slate-50">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <SectionHead
            eyebrow="FAQs"
            title="Questions, answered"
            sub="Anything else? Give us a call — we're happy to help."
          />
          <div className="mt-10 space-y-3">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm [&_summary]:list-none"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-bold text-bh-navy">
                  {f.q}
                  <Icon
                    name="chevronDown"
                    className="h-5 w-5 shrink-0 text-bh-blue-600 transition group-open:rotate-180"
                  />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Final CTA ---------- */}
      <section className="bh-hero text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Ready when you are
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-200">
            Call now for a friendly chat and a free quote, or request a callback
            and we&apos;ll get straight back to you.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={`tel:${BUSINESS.phonePrimary.tel}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-bh-accent-600 px-7 py-4 text-base font-bold text-white shadow-lg shadow-orange-900/30 transition hover:bg-bh-accent-700"
            >
              <Icon name="phone" className="h-5 w-5" filled />
              Call {BUSINESS.phonePrimary.display}
            </a>
            <a
              href="#quote"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-4 text-base font-bold text-bh-navy transition hover:bg-slate-100"
            >
              Request a callback
              <Icon name="arrowRight" className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHead({
  eyebrow,
  title,
  sub,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-xl"}>
      <span className="text-sm font-bold uppercase tracking-wide text-bh-blue-600">
        {eyebrow}
      </span>
      <h2
        className="mt-2 text-3xl font-extrabold tracking-tight text-bh-navy sm:text-4xl"
        dangerouslySetInnerHTML={{ __html: title }}
      />
      {sub ? <p className="mt-3 text-slate-500">{sub}</p> : null}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-100">
      <div className="text-2xl font-extrabold text-bh-blue-600">{value}</div>
      <div className="mt-1 text-xs font-medium text-slate-500">{label}</div>
    </div>
  );
}
