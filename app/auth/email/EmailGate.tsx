"use client";

import { useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";

export default function EmailGate({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setErrorMsg("Please wait for verification to complete.");
      return;
    }
    setStatus("loading");
    setErrorMsg("");

    const res = await fetch("/api/auth/send-magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, turnstileToken: token, next }),
    });
    const data = await res.json();

    if (res.ok) {
      setStatus("sent");
    } else {
      setStatus("error");
      setErrorMsg(data.error ?? "Something went wrong. Please try again.");
      setToken(null);
    }
  }

  if (status === "sent") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <div className="w-full max-w-md text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl"
            style={{ background: "linear-gradient(135deg, #F59E0B 0%, #92400E 100%)" }}
          >
            ✉
          </div>
          <h1
            className="text-3xl font-bold text-warm-primary mb-4"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Check your email
          </h1>
          <p className="text-warm-secondary text-lg mb-3">
            We sent a link to{" "}
            <span className="text-flame font-medium">{email}</span>.
          </p>
          <p className="text-warm-secondary text-lg">
            Click it to continue — no password needed.
          </p>
          <p className="text-warm-tertiary text-sm mt-6">
            Didn&rsquo;t get it? Check your spam folder, or{" "}
            <button
              onClick={() => setStatus("idle")}
              className="text-flame hover:underline"
            >
              try again
            </button>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl"
            style={{ background: "linear-gradient(135deg, #F59E0B 0%, #92400E 100%)" }}
          >
            🔥
          </div>
          <h1
            className="text-3xl sm:text-4xl font-bold text-warm-primary mb-3"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Enter your email to continue
          </h1>
          <p className="text-warm-secondary text-base">
            We&rsquo;ll send you a link — no password, no account setup.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
            className="w-full bg-surface border border-[rgba(245,158,11,0.2)] focus:border-flame rounded-card px-5 py-4 text-warm-primary text-lg outline-none transition-all placeholder:text-warm-tertiary"
          />

          <div className="flex justify-center">
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={setToken}
              onError={() => setToken(null)}
              onExpire={() => setToken(null)}
            />
          </div>

          {errorMsg && (
            <p className="text-red-400 text-sm text-center">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={status === "loading" || !email}
            className="w-full px-8 py-4 rounded-button text-[#0d0f0e] font-semibold text-base transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #F59E0B 0%, #92400E 100%)" }}
          >
            {status === "loading" ? "Sending…" : "Send me a link"}
          </button>
        </form>

        <p className="text-center text-warm-tertiary text-xs mt-8 leading-relaxed">
          Your email is used only to verify you&rsquo;re a real person.
          <br />
          We don&rsquo;t sell or share it.
        </p>
      </div>
    </div>
  );
}
