import type { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Our Permanence Promise | Eternaflame",
  description: "Eternaflame is built to last. Our data export pledge, preservation fund, and institutional partnerships ensure no memory entrusted to us is ever lost.",
  alternates: { canonical: "https://eternaflame.org/permanence" },
};

async function getLiveStats() {
  try {
    const supabase = createServiceClient();
    const [
      { count: totalProfiles },
      { count: todayProfiles },
      { count: claimedProfiles },
      { count: totalMemories },
      { data: fundData },
      { data: coverageData },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("privacy", "public"),
      supabase.from("profiles").select("*", { count: "exact", head: true })
        .eq("privacy", "public")
        .gte("created_at", new Date().toISOString().split("T")[0]),
      supabase.from("profiles").select("*", { count: "exact", head: true })
        .eq("privacy", "public")
        .not("claimed_by", "is", null),
      supabase.from("memories").select("*", { count: "exact", head: true }),
      supabase.from("preservation_fund")
        .select("balance_after_cents, transaction_date")
        .order("transaction_date", { ascending: false })
        .limit(1),
      supabase.from("coverage_stats")
        .select("*")
        .order("stat_date", { ascending: false }),
    ]);

    const fundBalance = fundData?.[0]?.balance_after_cents ?? 0;

    return {
      totalProfiles: totalProfiles ?? 0,
      todayProfiles: todayProfiles ?? 0,
      claimedProfiles: claimedProfiles ?? 0,
      totalMemories: totalMemories ?? 0,
      fundBalanceDollars: fundBalance / 100,
      coverage: coverageData ?? [],
    };
  } catch {
    return {
      totalProfiles: 0, todayProfiles: 0, claimedProfiles: 0,
      totalMemories: 0, fundBalanceDollars: 0, coverage: [],
    };
  }
}

export default async function PermanencePage() {
  const stats = await getLiveStats();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 animate-fade-in">
      <h1 className="text-4xl sm:text-5xl font-bold text-warm-primary mb-4 leading-tight"
        style={{ fontFamily: "var(--font-playfair)" }}>
        This isn&rsquo;t a startup.<br />It&rsquo;s an institution.
      </h1>
      <p className="text-warm-secondary text-lg mb-16 leading-relaxed">
        Every memory entrusted to Eternaflame deserves to last longer than any company does.
        Here&rsquo;s how we&rsquo;re making sure it does.
      </p>

      {/* Live stats */}
      <section className="mb-16">
        <p className="small-caps mb-6">Live statistics</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Lives in the record", value: stats.totalProfiles.toLocaleString() },
            { label: "Added today", value: stats.todayProfiles.toLocaleString() },
            { label: "Families who have claimed", value: stats.claimedProfiles.toLocaleString() },
            { label: "Memories contributed", value: stats.totalMemories.toLocaleString() },
          ].map(stat => (
            <div key={stat.label} className="card-surface rounded-card p-5 text-center">
              <p className="text-2xl font-bold text-flame" style={{ fontFamily: "var(--font-playfair)" }}>
                {stat.value}
              </p>
              <p className="text-warm-tertiary text-xs mt-1 leading-snug">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Preservation fund */}
      <section className="mb-16">
        <p className="small-caps mb-4">Preservation fund</p>
        <div className="card-surface rounded-card p-7">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-4xl font-bold text-flame" style={{ fontFamily: "var(--font-playfair)" }}>
              ${stats.fundBalanceDollars.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-warm-tertiary text-sm">current balance</span>
          </div>
          <p className="text-warm-secondary biography-text">
            The Preservation Fund is a publicly visible reserve dedicated solely to keeping Eternaflame online.
            It is not operating capital. It is not used for growth. It exists for one purpose: ensuring the records
            we hold never go dark due to financial failure.
          </p>
          <p className="text-warm-secondary biography-text mt-4">
            Every dollar is disclosed publicly, every transaction is recorded here.
            The balance starts at zero and grows as we grow. The fund is the institution&rsquo;s commitment
            made visible.
          </p>
        </div>
      </section>

      {/* Coverage stats */}
      {stats.coverage.length > 0 && (
        <section className="mb-16">
          <p className="small-caps mb-6">Coverage — estimated completeness by region</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(245,158,11,0.1)]">
                  <th className="text-left text-warm-tertiary py-3 font-normal">Region</th>
                  <th className="text-right text-warm-tertiary py-3 font-normal">Est. Deaths Since Launch</th>
                  <th className="text-right text-warm-tertiary py-3 font-normal">Captured</th>
                  <th className="text-right text-warm-tertiary py-3 font-normal">Coverage</th>
                </tr>
              </thead>
              <tbody>
                {stats.coverage.map((row: { region: string; estimated_deaths_ytd?: number; profiles_captured_ytd?: number; coverage_pct?: number }) => (
                  <tr key={row.region} className="border-b border-[rgba(245,158,11,0.05)]">
                    <td className="text-warm-primary py-3">{row.region}</td>
                    <td className="text-warm-secondary text-right py-3">{row.estimated_deaths_ytd?.toLocaleString() ?? "—"}</td>
                    <td className="text-warm-secondary text-right py-3">{row.profiles_captured_ytd?.toLocaleString() ?? "—"}</td>
                    <td className="text-flame text-right py-3 font-medium">{row.coverage_pct ? `${row.coverage_pct}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-warm-tertiary text-xs mt-3">
            Our goal is 100% coverage — from this day forward, nobody slips through.
            Since launch, Eternaflame has endeavored to capture every death recorded in public registries
            across covered regions.
          </p>
        </section>
      )}

      {/* Open data pledge */}
      <section className="mb-16">
        <p className="small-caps mb-4">The open data pledge</p>
        <div className="biography-text text-warm-secondary flex flex-col gap-4">
          <p>
            Every profile on Eternaflame — the biographical data, the life story, the connections —
            belongs to the person remembered and their family. Not to us.
          </p>
          <p>
            We commit to three things:
          </p>
          <ul className="flex flex-col gap-3 pl-5">
            <li>
              <strong className="text-warm-primary">Export always works.</strong>{" "}
              Any family member who contributed to a profile can download everything they added as PDF and JSON,
              at any time, for free. No account required after the fact.
            </li>
            <li>
              <strong className="text-warm-primary">If we shut down, the data goes somewhere.</strong>{" "}
              In the event Eternaflame ever closes, all profile data will be transferred to the Internet Archive
              or a comparable permanent institution — not deleted, not sold, not held ransom.
            </li>
            <li>
              <strong className="text-warm-primary">No profile is ever paywalled.</strong>{" "}
              Creating and viewing profiles is free forever. If we ever add optional premium features,
              they will never gatekeep access to existing records.
            </li>
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-16">
        <p className="small-caps mb-6">Why this won&rsquo;t disappear</p>
        <div className="flex flex-col gap-6">
          {[
            {
              q: "What if Eternaflame shuts down?",
              a: "All data goes to the Internet Archive or an equivalent permanent institution. We are actively pursuing a formal data partnership with the Internet Archive. The records are not deleted. They are transferred.",
            },
            {
              q: "What if you get acquired?",
              a: "Any acquisition agreement requires the acquirer to honor the open data pledge and the permanence commitment. This is written into our founding documents. An acquirer that refuses these terms doesn't get the deal.",
            },
            {
              q: "What if you run out of money?",
              a: "The Preservation Fund exists for exactly this scenario. It is separate from operating capital and can sustain the site in read-only mode indefinitely. Beyond that, the data is exportable and transferable — so the records survive even if the platform doesn't.",
            },
            {
              q: "Can I download my family's data?",
              a: "Yes. Any profile you've contributed to has an 'Export your contributions' button that downloads a PDF and JSON zip of everything you added — biographical details, memories, photos. The export is free, immediate, and always available.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="card-surface rounded-card p-6">
              <p className="text-warm-primary font-semibold mb-3" style={{ fontFamily: "var(--font-playfair)" }}>{q}</p>
              <p className="text-warm-secondary text-base leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Internet Archive partnership */}
      <section className="mb-16">
        <p className="small-caps mb-4">Internet Archive partnership</p>
        <div className="card-surface rounded-card p-6 border border-[rgba(245,158,11,0.15)]">
          <p className="text-warm-secondary biography-text">
            We are actively pursuing a formal data preservation partnership with the Internet Archive.
            Under this partnership, Eternaflame profile data would be periodically archived in the Wayback Machine
            and permanently hosted in the Archive&rsquo;s open collections.
          </p>
          <p className="text-warm-tertiary text-sm mt-3">Partnership pending — expected to be formalized in 2025.</p>
        </div>
      </section>

      <div className="text-center mt-12">
        <Link href="/create"
          className="inline-block px-8 py-4 rounded-button text-[#0d0f0e] font-semibold text-base transition-all duration-200 hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #F59E0B 0%, #92400E 100%)" }}>
          Remember Someone — Free forever
        </Link>
      </div>
    </div>
  );
}
