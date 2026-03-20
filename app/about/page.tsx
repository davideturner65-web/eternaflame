import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Eternaflame — Why We're Building an Index of Every Human Life",
  description: "In two generations, everyone who ever knew you will be gone. Eternaflame exists to make sure that stops being the end of the story. Free forever.",
  alternates: { canonical: "https://eternaflame.org/about" },
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 animate-fade-in">
      <h1 className="text-4xl sm:text-5xl font-bold text-warm-primary mb-4 leading-tight"
        style={{ fontFamily: "var(--font-playfair)" }}>
        Nobody should vanish completely.
      </h1>
      <p className="text-warm-tertiary text-sm mb-16">The story behind Eternaflame</p>

      <div className="flex flex-col gap-10 biography-text">
        <p>
          In two generations, everyone who ever knew you will be gone.
          Your children might remember you clearly. Your grandchildren might have photographs, or fragments of stories.
          But your great-grandchildren? You will be a name, maybe a year — if that.
        </p>
        <p>
          This is the default ending for almost every human who has ever lived.
          Not tragedy, not intentional erasure — just time doing what time does.
          The record closes. The story stops.
        </p>
        <p>
          Eternaflame exists to make that stop being the end.
        </p>

        <hr className="border-[rgba(245,158,11,0.1)]" />

        {/* The 70% */}
        <section>
          <h2 className="text-2xl text-warm-primary font-semibold mb-5"
            style={{ fontFamily: "var(--font-playfair)" }}>
            The 70%
          </h2>
          <p className="mb-4">
            About 70% of people who die never get a published obituary.
            Not because their lives didn&rsquo;t matter — because a newspaper obituary costs $500, and nobody nearby
            knew how to write one, and the forms were confusing, and life moved fast.
          </p>
          <p className="mb-4">
            Every memorial platform that exists today starts with an obituary. If you don&rsquo;t have one,
            you&rsquo;re not in the record. You&rsquo;re invisible.
          </p>
          <p>
            Eternaflame pulls from public death records, vital statistics, and government registries.
            We don&rsquo;t wait for a newspaper to decide someone was worth remembering.
            Every person gets a place in the record — regardless of income, location, or whether anyone nearby
            had time to fill out a form.
          </p>
        </section>

        <hr className="border-[rgba(245,158,11,0.1)]" />

        <section>
          <h2 className="text-2xl text-warm-primary font-semibold mb-5"
            style={{ fontFamily: "var(--font-playfair)" }}>
            What we&rsquo;re building
          </h2>
          <p className="mb-4">
            An index. Every human life, as completely as the historical record allows.
            Names. Dates. Places. Stories — when families add them. Connections — when records show them.
          </p>
          <p className="mb-4">
            The profiles are permanent. Free to create, free to view, free forever.
            There is no premium tier that holds your grandfather&rsquo;s biography hostage.
            There is no subscription that expires and takes the record with it.
          </p>
          <p>
            We use AI to cross-reference records and enrich profiles with detail from public sources.
            We use scrapers to pull from every obituary feed we can find.
            And we build tools that let families add what the records can&rsquo;t capture — the stories,
            the memories, the things that make a person a person.
          </p>
        </section>

        <hr className="border-[rgba(245,158,11,0.1)]" />

        <section>
          <h2 className="text-2xl text-warm-primary font-semibold mb-5"
            style={{ fontFamily: "var(--font-playfair)" }}>
            Why free, forever?
          </h2>
          <p className="mb-4">
            Because charging for memory is wrong. Full stop.
          </p>
          <p className="mb-4">
            Grief is not a market. The people who want to preserve their family&rsquo;s history are
            not a demographic to be monetized. And the 70% who never got an obituary — the people
            whose families couldn&rsquo;t afford a newspaper listing — they especially shouldn&rsquo;t have
            to pay to be remembered.
          </p>
          <p>
            Eternaflame&rsquo;s permanence is backed by a public preservation fund and a commitment to
            open-data export. Read more on our{" "}
            <Link href="/permanence" className="text-flame hover:underline">permanence page</Link>.
          </p>
        </section>

        <hr className="border-[rgba(245,158,11,0.1)]" />

        <section>
          <h2 className="text-2xl text-warm-primary font-semibold mb-5"
            style={{ fontFamily: "var(--font-playfair)" }}>
            From this day forward
          </h2>
          <p className="mb-4">
            Eternaflame launched in 2024. From that day forward, we have endeavored to capture every death
            recorded in public registries across the United States and the English-speaking world.
            Our coverage grows every day.
          </p>
          <p>
            The past is being backfilled as fast as we can. But from now on — nobody slips through.
          </p>
        </section>
      </div>

      {/* CTA */}
      <div className="mt-16 border-t border-[rgba(245,158,11,0.08)] pt-12 text-center">
        <p className="text-warm-secondary mb-6">Know someone whose story belongs here?</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/create"
            className="px-8 py-4 rounded-button text-[#0d0f0e] font-semibold text-base transition-all duration-200 hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #F59E0B 0%, #92400E 100%)" }}>
            Remember Someone — Free
          </Link>
          <Link href="/search"
            className="px-8 py-4 rounded-button text-warm-primary font-semibold text-base border border-[rgba(245,158,11,0.35)] hover:border-flame hover:text-flame transition-all duration-200">
            Search the Record
          </Link>
        </div>
      </div>
    </div>
  );
}
