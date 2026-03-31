import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Common disposable/throwaway email domains
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "guerrillamail.info", "guerrillamail.biz",
  "guerrillamail.de", "guerrillamail.net", "guerrillamail.org", "guerrillamailblock.com",
  "grr.la", "sharklasers.com", "spam4.me", "trashmail.com", "trashmail.me",
  "trashmail.at", "trashmail.io", "trashmail.net", "trashmail.org", "trashmail.app",
  "trashmail.xyz", "dispostable.com", "fakeinbox.com", "mailnull.com",
  "spamgourmet.com", "tempr.email", "discard.email", "yopmail.com", "yopmail.fr",
  "maildrop.cc", "tempinbox.com", "temp-mail.org", "throwaway.email",
  "getairmail.com", "spamfree24.org", "binkmail.com", "bobmail.info", "dayrep.com",
  "drdrb.com", "dump-email.info", "dumpyemail.com", "emailondeck.com", "email60.com",
  "filzmail.com", "garliclife.com", "hatespam.org", "hidemail.de",
  "incognitomail.com", "incognitomail.net", "incognitomail.org",
  "junk1.tk", "kasmail.com", "klassmaster.com", "kurzepost.de",
  "letthemeatspam.com", "mailcatch.com", "mailismagic.com", "mailme.ir",
  "mailme24.com", "mailmetrash.com", "mailnew.com", "mailzilla.org",
  "mierdamail.com", "mt2015.com", "mytrashmail.com", "nobulk.com",
  "nomail.pw", "nomail2me.com", "nospamfor.us", "nospamthanks.info",
  "nowmymail.com", "objectmail.com", "onewaymail.com", "otherinbox.com",
  "outlawspam.com", "pookmail.com", "rcpt.at", "reallymymail.com", "recode.me",
  "s0ny.net", "safersignup.de", "safetymail.info", "safetypost.de",
  "selfdestructingmail.com", "sendspamhere.com", "sharedmailbox.org",
  "shieldemail.com", "shiftmail.com", "skeefmail.com", "slopsbox.com",
  "sofimail.com", "spam.la", "spam.su", "spamavert.com", "spamcero.com",
  "spamex.com", "spamfree.eu", "spamfree24.de", "spamfree24.eu",
  "spamfree24.net", "spamgourmet.net", "spamgourmet.org", "spamhole.com",
  "spamify.com", "spaml.com", "spaml.de", "spammotel.com", "spamoff.de",
  "spamslicer.com", "spamspot.com", "spamtrail.com", "spamwc.de",
  "supergreatmail.com", "suremail.info", "tafmail.com", "teewars.org",
  "teleworm.com", "teleworm.us", "tempalias.com", "tempe-mail.com",
  "tempmail.com", "tempmail.it", "tempomail.fr", "temporaryemail.net",
  "temporaryemail.us", "temporaryinbox.com", "tempthe.net",
  "thelimestones.com", "thisisnotmyrealemail.com", "thismail.net",
  "throwam.com", "throwanmail.com", "tittbit.in", "tmail.com",
  "tmailinator.com", "toiea.com", "trash-mail.at", "trash-mail.com",
  "trash-mail.de", "trash-mail.io", "trash-mail.me", "trash-mail.net",
  "trashdevil.com", "trashdevil.de", "trashmailer.com", "trbvm.com",
  "turual.com", "twinmail.de", "uggsrock.com", "uroid.com",
  "veryrealemail.com", "viditag.com", "vomoto.com", "vubby.com",
  "walala.org", "walkmail.net", "webemail.me", "weg-werf-email.de",
  "wegwerf-emails.de", "wegwerfadresse.de", "wegwerfemail.com",
  "wegwerfemail.de", "wegwerfemail.net", "wegwerfemail.org",
  "wegwerfmail.de", "wegwerfmail.net", "wegwerfmail.org",
  "whyspam.me", "wickmail.net", "willhackforfood.biz",
  "willselfdestruct.com", "wronghead.com", "wuzupmail.net",
  "xagloo.co", "xagloo.com", "xemaps.com", "xents.com", "xmaily.com",
  "xoxy.net", "xyzfree.net", "yapped.net", "yep.it",
  "z1p.biz", "zehnminuten.de", "zehnminutenmail.de", "zippymail.info",
  "zoemail.com", "zoemail.net", "zoemail.org",
]);

export async function POST(request: NextRequest) {
  let body: { email?: string; turnstileToken?: string; next?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { email, turnstileToken, next } = body;

  if (!email || !turnstileToken) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  // 1. Validate Turnstile token
  const turnstileRes = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY!,
        response: turnstileToken,
      }),
    }
  );
  const turnstileData = await turnstileRes.json();
  if (!turnstileData.success) {
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 400 }
    );
  }

  // 2. Block disposable email domains
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return NextResponse.json(
      { error: "Please use a permanent email address." },
      { status: 400 }
    );
  }

  // 3. Send magic link via Supabase
  const supabase = createClient();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://eternaflame.org";
  const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(next ?? "/create")}`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    console.error("Magic link error:", error.message);
    return NextResponse.json(
      { error: "Failed to send email. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
