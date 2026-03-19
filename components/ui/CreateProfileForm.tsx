"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface FamilyRow { name: string; relation_type: string; surviving: boolean }

const RELATIONSHIPS = [
  { value: "spouse", label: "Spouse" },
  { value: "child", label: "Child" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "grandchild", label: "Grandchild" },
  { value: "grandparent", label: "Grandparent" },
  { value: "other", label: "Other" },
];

const inputClass = "w-full px-4 py-2.5 rounded-button bg-[rgba(196,164,105,0.05)] border border-[rgba(196,164,105,0.15)] text-[#E7E0D5] placeholder-[#78716C] focus:outline-none focus:border-[rgba(196,164,105,0.5)] transition-colors text-sm";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[#C4A869] small-caps text-sm border-b border-[rgba(196,164,105,0.15)] pb-2 mb-5">{children}</h2>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[#A8A29E] text-sm">
        {label}{required && <span className="text-[#C4A869] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function CreateProfileForm() {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    first_name: "", middle_name: "", last_name: "", nickname: "", suffix: "",
    birth_date: "", death_date: "",
    birth_place: "", residence: "", burial_place: "",
    career: "", education: "", faith: "", interests: "", personality: "",
    military_branch: "", military_rank: "", military_conflict: "", military_years: "",
    obituary_source: "", privacy: "public",
  });

  const [family, setFamily] = useState<FamilyRow[]>([
    { name: "", relation_type: "spouse", surviving: true },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function updateFamily(index: number, field: keyof FamilyRow, value: string | boolean) {
    setFamily(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  }

  async function saveProfile() {
    const res = await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        family_members: family.filter(f => f.name.trim()).map(f => ({
          name: f.name,
          relation_type: f.relation_type,
          surviving: f.surviving,
        })),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Save failed");
    return data.profile.id as string;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError("First and last name are required.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setShowAuth(true); return; }

    setLoading(true);
    setError("");
    try {
      const id = await saveProfile();
      router.push(`/profile/${id}?new=1`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    let userId: string | null = null;

    if (authMode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
      if (error) { setAuthError(error.message); setAuthLoading(false); return; }
      userId = data.user?.id ?? null;
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (error) { setAuthError(error.message); setAuthLoading(false); return; }
      userId = data.user?.id ?? null;
    }

    if (!userId) { setAuthError("Could not authenticate. Please try again."); setAuthLoading(false); return; }

    try {
      const id = await saveProfile();
      router.push(`/profile/${id}?new=1`);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Profile save failed.");
      setAuthLoading(false);
    }
  }

  async function handleGoogleAuth() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  if (showAuth) {
    return (
      <div className="card-surface rounded-card p-8 max-w-md mx-auto">
        <h2 className="text-xl font-semibold text-[#E7E0D5] mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
          {authMode === "signup" ? "Create a free account to save" : "Sign in to save"}
        </h2>
        <p className="text-[#A8A29E] text-sm mb-6">
          {authMode === "signup" ? "One quick step, then their profile is saved permanently." : "Welcome back. Sign in to complete the profile."}
        </p>

        <button onClick={handleGoogleAuth}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-button border border-[rgba(196,164,105,0.3)] text-[#E7E0D5] text-sm font-medium hover:bg-[rgba(196,164,105,0.08)] transition-all mb-5">
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 border-t border-[rgba(196,164,105,0.15)]" />
          <span className="text-[#78716C] text-xs">or</span>
          <div className="flex-1 border-t border-[rgba(196,164,105,0.15)]" />
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-3">
          <input type="email" placeholder="Email address" value={authEmail}
            onChange={e => setAuthEmail(e.target.value)} required className={inputClass} />
          <input type="password" placeholder="Password" value={authPassword}
            onChange={e => setAuthPassword(e.target.value)} required className={inputClass} />
          {authError && <p className="text-red-400 text-sm">{authError}</p>}
          <button type="submit" disabled={authLoading}
            className="w-full py-3 rounded-button text-[#1C1917] font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #C4A869 0%, #A8884A 100%)" }}>
            {authLoading ? "Saving..." : authMode === "signup" ? "Create account & remember them" : "Sign in & remember them"}
          </button>
        </form>

        <button onClick={() => setAuthMode(authMode === "signup" ? "signin" : "signup")}
          className="mt-4 w-full text-center text-[#78716C] text-xs hover:text-[#A8A29E] transition-colors">
          {authMode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
        <button onClick={() => setShowAuth(false)}
          className="mt-2 w-full text-center text-[#78716C] text-xs hover:text-[#A8A29E] transition-colors">
          &larr; Back to form
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10">
      <section>
        <SectionHeading>Who they are</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First name" required><input name="first_name" value={form.first_name} onChange={handleChange} placeholder="James" className={inputClass} required /></Field>
          <Field label="Last name" required><input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Turner" className={inputClass} required /></Field>
          <Field label="Middle name"><input name="middle_name" value={form.middle_name} onChange={handleChange} placeholder="Robert" className={inputClass} /></Field>
          <Field label="Nickname"><input name="nickname" value={form.nickname} onChange={handleChange} placeholder="Jim" className={inputClass} /></Field>
          <Field label="Date of birth"><input name="birth_date" type="date" value={form.birth_date} onChange={handleChange} className={inputClass} /></Field>
          <Field label="Date of passing"><input name="death_date" type="date" value={form.death_date} onChange={handleChange} className={inputClass} /></Field>
        </div>
      </section>

      <section>
        <SectionHeading>Where they lived</SectionHeading>
        <div className="flex flex-col gap-4">
          <Field label="Birthplace"><input name="birth_place" value={form.birth_place} onChange={handleChange} placeholder="Pine Bluff, AR" className={inputClass} /></Field>
          <Field label="Where they lived"><input name="residence" value={form.residence} onChange={handleChange} placeholder="Little Rock, AR" className={inputClass} /></Field>
          <Field label="Burial or resting place"><input name="burial_place" value={form.burial_place} onChange={handleChange} placeholder="Roselawn Memorial Park, Little Rock" className={inputClass} /></Field>
        </div>
      </section>

      <section>
        <SectionHeading>Their story</SectionHeading>
        <div className="flex flex-col gap-4">
          <Field label="Career"><input name="career" value={form.career} onChange={handleChange} placeholder="Retired teacher at Central High School — 35 years" className={inputClass} /></Field>
          <Field label="Education"><input name="education" value={form.education} onChange={handleChange} placeholder="University of Arkansas" className={inputClass} /></Field>
          <Field label="Faith & community"><input name="faith" value={form.faith} onChange={handleChange} placeholder="First Baptist Church of Little Rock" className={inputClass} /></Field>
          <Field label="Interests (comma-separated)"><input name="interests" value={form.interests} onChange={handleChange} placeholder="Fishing, Arkansas Razorbacks football, Woodworking" className={inputClass} /></Field>
          <Field label="Personality — in their words, or someone who loved them">
            <textarea name="personality" value={form.personality} onChange={handleChange} rows={3}
              placeholder="Known for his quick wit and generous spirit. Never met a stranger."
              className={inputClass + " resize-none"} />
          </Field>
        </div>
      </section>

      <section>
        <SectionHeading>Military service</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Branch"><input name="military_branch" value={form.military_branch} onChange={handleChange} placeholder="U.S. Army" className={inputClass} /></Field>
          <Field label="Rank"><input name="military_rank" value={form.military_rank} onChange={handleChange} placeholder="Sergeant" className={inputClass} /></Field>
          <Field label="Conflict or era"><input name="military_conflict" value={form.military_conflict} onChange={handleChange} placeholder="Vietnam" className={inputClass} /></Field>
          <Field label="Years of service"><input name="military_years" value={form.military_years} onChange={handleChange} placeholder="1962–1966" className={inputClass} /></Field>
        </div>
      </section>

      <section>
        <SectionHeading>Family</SectionHeading>
        <div className="flex flex-col gap-3">
          {family.map((row, index) => (
            <div key={index} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-start">
              <input value={row.name} onChange={e => updateFamily(index, "name", e.target.value)}
                placeholder="Linda Kay Turner" className={inputClass} />
              <select value={row.relation_type} onChange={e => updateFamily(index, "relation_type", e.target.value)}
                className={inputClass + " w-auto"}>
                {RELATIONSHIPS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <select value={row.surviving ? "surviving" : "predeceased"}
                onChange={e => updateFamily(index, "surviving", e.target.value === "surviving")}
                className={inputClass + " w-auto"}>
                <option value="surviving">Surviving</option>
                <option value="predeceased">Predeceased</option>
              </select>
              {family.length > 1 && (
                <button type="button" onClick={() => setFamily(prev => prev.filter((_, i) => i !== index))}
                  className="text-[#78716C] hover:text-[#A8A29E] px-2 py-2.5 text-lg leading-none">&times;</button>
              )}
            </div>
          ))}
          <button type="button"
            onClick={() => setFamily(prev => [...prev, { name: "", relation_type: "child", surviving: true }])}
            className="text-sm text-[#C4A869] hover:text-[#E7E0D5] text-left transition-colors mt-1">
            + Add family member
          </button>
        </div>
      </section>

      <section>
        <SectionHeading>Attribution & privacy</SectionHeading>
        <div className="flex flex-col gap-4">
          <Field label="Obituary source (optional)">
            <input name="obituary_source" value={form.obituary_source} onChange={handleChange}
              placeholder="Arkansas Democrat-Gazette" className={inputClass} />
          </Field>
          <Field label="Who can see this profile">
            <div className="flex flex-col gap-2 mt-1">
              {[
                { value: "public", label: "Public", desc: "Anyone can find and view this profile" },
                { value: "family", label: "Family only", desc: "Only people you share the link with" },
                { value: "private", label: "Private", desc: "Only you can see it" },
              ].map(opt => (
                <label key={opt.value} className="flex items-start gap-3 cursor-pointer">
                  <input type="radio" name="privacy" value={opt.value} checked={form.privacy === opt.value}
                    onChange={handleChange} className="mt-0.5 accent-[#C4A869]" />
                  <div>
                    <span className="text-[#E7E0D5] text-sm">{opt.label}</span>
                    <p className="text-[#78716C] text-xs">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </Field>
        </div>
      </section>

      <div className="flex flex-col items-center gap-3 pt-2">
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full sm:w-auto px-10 py-4 rounded-button text-[#1C1917] font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #C4A869 0%, #A8884A 100%)" }}>
          {loading ? "Saving..." : `Remember ${form.first_name || "them"} forever`}
        </button>
        <p className="text-[#78716C] text-xs text-center max-w-sm">
          This profile will be permanent and free. You can always come back and add more.
        </p>
      </div>
    </form>
  );
}
