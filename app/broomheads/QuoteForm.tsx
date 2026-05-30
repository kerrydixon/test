"use client";

import { useState } from "react";
import Icon from "./Icon";
import { BUSINESS, SERVICES } from "./data";

// Mockup form: no backend yet. It validates lightly and shows a success state so
// the conversion flow can be demoed end-to-end. Wire `onSubmit` to an API route,
// email service or CRM when going live.

export default function QuoteForm() {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-xl ring-1 ring-black/5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
          <Icon name="check" className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-xl font-bold text-bh-navy">
          Thanks — request received
        </h3>
        <p className="mt-2 text-slate-600">
          We&apos;ll call you back shortly. For anything urgent, call us now on{" "}
          <a
            href={`tel:${BUSINESS.phonePrimary.tel}`}
            className="font-semibold text-bh-blue-600 underline"
          >
            {BUSINESS.phonePrimary.display}
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-6 text-sm font-semibold text-slate-500 hover:text-slate-700"
        >
          Send another request
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
      }}
      className="rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5 sm:p-8"
    >
      <h3 className="text-xl font-bold text-bh-navy">
        Get a free quote
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        No obligation. We aim to call back the same working day.
      </p>

      <div className="mt-5 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name" htmlFor="name">
            <input
              id="name"
              name="name"
              required
              autoComplete="name"
              className="bh-input"
              placeholder="Jane Smith"
            />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              className="bh-input"
              placeholder="07…"
            />
          </Field>
        </div>

        <Field label="Postcode" htmlFor="postcode">
          <input
            id="postcode"
            name="postcode"
            autoComplete="postal-code"
            className="bh-input"
            placeholder="S10 …"
          />
        </Field>

        <Field label="What do you need?" htmlFor="service">
          <select id="service" name="service" className="bh-input" defaultValue="">
            <option value="" disabled>
              Choose a service…
            </option>
            {SERVICES.map((s) => (
              <option key={s.title} value={s.title}>
                {s.title}
              </option>
            ))}
            <option value="Emergency">Emergency / urgent</option>
            <option value="Other">Something else</option>
          </select>
        </Field>

        <Field label="Details (optional)" htmlFor="message">
          <textarea
            id="message"
            name="message"
            rows={3}
            className="bh-input resize-none"
            placeholder="Tell us a little about the job…"
          />
        </Field>
      </div>

      <button
        type="submit"
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-bh-accent-600 px-5 py-3.5 text-base font-bold text-white shadow-lg shadow-orange-600/20 transition hover:bg-bh-accent-700 focus:outline-none focus:ring-2 focus:ring-bh-accent-500 focus:ring-offset-2"
      >
        Request my free quote
        <Icon name="arrowRight" className="h-5 w-5" />
      </button>

      <p className="mt-3 text-center text-xs text-slate-400">
        Prefer to talk? Call{" "}
        <a
          href={`tel:${BUSINESS.phonePrimary.tel}`}
          className="font-semibold text-bh-blue-600"
        >
          {BUSINESS.phonePrimary.display}
        </a>
      </p>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}
