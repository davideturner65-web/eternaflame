"use client";

import type { Metadata } from "next";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Note: metadata export not used in client components — set in a separate
// server component wrapper or define in layout. Keeping here for reference.
// export const metadata: Metadata = { ... }

type Step = 1 | 2 | 3 | 4;

export default function StartPage() {
  const [step, setStep] = useState<Step>(1);
  const [tagline, setTagline] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: dbErr } = await supabase
        .from("profiles")
        .insert({
          first_name: firstName.trim(),
          last_name: lastName.trim() || "—",
          birth_year: birthYear ? parseInt(birthYear) : null,
          personality_summary: tagline.trim() || null,
          privacy: "public",
          ingestion_source: "manual",
        })
        .select("id")
        .single();

      if (dbErr) throw dbErr;
      if (!data) throw new Error("No profile returned");

      // Add location if provided
      if (city.trim() || state.trim()) {
        await supabase.from("profile_locations").insert({
          profile_id: data.id,
          location_type: "lived",
          city: city.trim() || null,
          state_province: state.trim() || null,
          is_current: true,
        });
      }

      setProfileId(data.id);
      setStep(4);
    } catch (e: unknown) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20 animate-fade-in">
      <div className="w-full max-w-xl">

        {/* Step indicator */}
        {step < 4 && (
          <div className="flex gap-2 justify-center mb-12">
            {[1, 2, 3].map(s => (
              <div key={s}
                className={`h-1 w-12 rounded-full transition-all duration-300 ${s <= step ? "bg-flame" : "bg-surface-raised"}`} />
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-warm-primary mb-4"
              style={{ fontFamily: "var(--font-playfair)" }}>
              Start Your Eternaflame
            </h1>
            <p className="text-warm-secondary text-lg mb-3">
              Your story, in your words, while you still have them.
            </p>
            <p className="text-2xl sm:text-3xl text-warm-primary mt-10 mb-3"
              style={{ fontFamily: "var(--font-playfair)" }}>
              What&rsquo;s one thing you&rsquo;d want people to know about you?
            </p>
            <p className="text-warm-tertiary text-sm mb-8">
              This becomes the first thing people read when they find your Eternaflame.
            </p>
            <textarea
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              placeholder="Known for my quick wit and terrible puns..."
              rows={3}
              className="w-full bg-surface border border-[rgba(245,158,11,0.2)] focus:border-flame rounded-card px-5 py-4 text-warm-primary text-lg outline-none transition-all resize-none placeholder:text-warm-tertiary"
              style={{ fontFamily: "var(--font-source-serif)" }}
              autoFocus
            />
            <button
              onClick={() => setStep(2)}
              disabled={!tagline.trim()}
              className="mt-6 w-full px-8 py-4 rounded-button text-[#0d0f0e] font-semibold text-base transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #F59E0B 0%, #92400E 100%)" }}>
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="text-center">
            <p className="text-2xl sm:text-3xl text-warm-primary mb-8"
              style={{ fontFamily: "var(--font-playfair)" }}>
              And your name?
            </p>
            <div className="flex gap-3 mb-5">
              <input
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="First name"
                className="flex-1 bg-surface border border-[rgba(245,158,11,0.2)] focus:border-flame rounded-card px-5 py-4 text-warm-primary text-lg outline-none transition-all placeholder:text-warm-tertiary"
                autoFocus
              />
              <input
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Last name"
                className="flex-1 bg-surface border border-[rgba(245,158,11,0.2)] focus:border-flame rounded-card px-5 py-4 text-warm-primary text-lg outline-none transition-all placeholder:text-warm-tertiary"
              />
            </div>
            <p className="text-2xl sm:text-3xl text-warm-primary mt-8 mb-6"
              style={{ fontFamily: "var(--font-playfair)" }}>
              Year you were born?
            </p>
            <input
              value={birthYear}
              onChange={e => setBirthYear(e.target.value)}
              placeholder="1975"
              type="number"
              min="1880"
              max={new Date().getFullYear()}
              className="w-full bg-surface border border-[rgba(245,158,11,0.2)] focus:border-flame rounded-card px-5 py-4 text-warm-primary text-lg outline-none transition-all placeholder:text-warm-tertiary text-center"
            />
            <button
              onClick={() => setStep(3)}
              disabled={!firstName.trim()}
              className="mt-8 w-full px-8 py-4 rounded-button text-[#0d0f0e] font-semibold text-base transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #F59E0B 0%, #92400E 100%)" }}>
              Continue
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <p className="text-2xl sm:text-3xl text-warm-primary mb-8"
              style={{ fontFamily: "var(--font-playfair)" }}>
              Where did you grow up?
            </p>
            <div className="flex gap-3 mb-8">
              <input
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="City"
                className="flex-[2] bg-surface border border-[rgba(245,158,11,0.2)] focus:border-flame rounded-card px-5 py-4 text-warm-primary text-lg outline-none transition-all placeholder:text-warm-tertiary"
                autoFocus
              />
              <input
                value={state}
                onChange={e => setState(e.target.value)}
                placeholder="State"
                className="flex-1 bg-surface border border-[rgba(245,158,11,0.2)] focus:border-flame rounded-card px-5 py-4 text-warm-primary text-lg outline-none transition-all placeholder:text-warm-tertiary"
              />
            </div>
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <button
              onClick={submit}
              disabled={loading}
              className="w-full px-8 py-4 rounded-button text-[#0d0f0e] font-semibold text-base transition-all duration-200 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #F59E0B 0%, #92400E 100%)" }}>
              {loading ? "Starting your Eternaflame…" : "Start my Eternaflame"}
            </button>
            <button
              onClick={submit}
              disabled={loading}
              className="mt-3 text-sm text-warm-tertiary hover:text-warm-secondary transition-colors w-full text-center">
              Skip — I&rsquo;ll add this later
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl"
              style={{ background: "linear-gradient(135deg, #F59E0B 0%, #92400E 100%)" }}>
              🔥
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-warm-primary mb-4"
              style={{ fontFamily: "var(--font-playfair)" }}>
              Your Eternaflame is started.
            </h2>
            <p className="text-warm-secondary text-lg mb-6">
              Come back whenever you have something to add. There&rsquo;s no rush. It lives here as long as the internet does.
            </p>
            {tagline && (
              <div className="card-surface rounded-card p-6 mb-8">
                <p className="text-warm-primary italic text-lg" style={{ fontFamily: "var(--font-playfair)" }}>
                  &ldquo;{tagline}&rdquo;
                </p>
                <p className="text-warm-tertiary text-sm mt-2">
                  {firstName} {lastName}{birthYear && `, born ${birthYear}`}
                </p>
              </div>
            )}
            {profileId && (
              <Link href={`/profile/${profileId}`}
                className="inline-block px-8 py-4 rounded-button text-[#0d0f0e] font-semibold text-base transition-all duration-200 hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #F59E0B 0%, #92400E 100%)" }}>
                See your Eternaflame
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
