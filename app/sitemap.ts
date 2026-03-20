import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/server";

const BASE_URL = "https://eternaflame.org";

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: BASE_URL, changeFrequency: "daily", priority: 1.0 },
  { url: `${BASE_URL}/search`, changeFrequency: "daily", priority: 0.9 },
  { url: `${BASE_URL}/create`, changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE_URL}/discover`, changeFrequency: "daily", priority: 0.7 },
  { url: `${BASE_URL}/start`, changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE_URL}/permanence`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE_URL}/map`, changeFrequency: "weekly", priority: 0.6 },
  { url: `${BASE_URL}/lives/`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${BASE_URL}/military/`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${BASE_URL}/schools/`, changeFrequency: "weekly", priority: 0.7 },
];

const US_STATES = [
  "alabama","alaska","arizona","arkansas","california","colorado","connecticut",
  "delaware","florida","georgia","hawaii","idaho","illinois","indiana","iowa",
  "kansas","kentucky","louisiana","maine","maryland","massachusetts","michigan",
  "minnesota","mississippi","missouri","montana","nebraska","nevada",
  "new-hampshire","new-jersey","new-mexico","new-york","north-carolina",
  "north-dakota","ohio","oklahoma","oregon","pennsylvania","rhode-island",
  "south-carolina","south-dakota","tennessee","texas","utah","vermont",
  "virginia","washington","west-virginia","wisconsin","wyoming",
];

const CONFLICTS = [
  "world-war-ii","vietnam-war","korean-war","world-war-i",
  "gulf-war","iraq-war","afghanistan","cold-war-era","peacetime",
];

const LEARN_SLUGS = [
  "free-obituary-search",
  "how-to-preserve-family-history",
  "create-free-online-memorial",
  "digital-legacy",
  "how-to-write-a-memorial",
  "vietnam-veterans-arkansas",
  "living-memorial",
  "preserving-voice-recordings",
  "what-to-do-after-someone-dies-online",
  "cemetery-records-online",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // State cluster pages
  const statePages: MetadataRoute.Sitemap = US_STATES.map(s => ({
    url: `${BASE_URL}/lives/${s}/`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Military cluster pages
  const militaryPages: MetadataRoute.Sitemap = CONFLICTS.map(c => ({
    url: `${BASE_URL}/military/${c}/`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Learn articles
  const learnPages: MetadataRoute.Sitemap = LEARN_SLUGS.map(s => ({
    url: `${BASE_URL}/learn/${s}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Profile pages (first 50,000)
  let profilePages: MetadataRoute.Sitemap = [];
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("profiles")
      .select("slug, id, updated_at")
      .eq("privacy", "public")
      .not("slug", "is", null)
      .order("updated_at", { ascending: false })
      .limit(49000);

    profilePages = (data ?? []).map(p => ({
      url: `${BASE_URL}/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));
  } catch { /* continue without profile pages */ }

  return [
    ...STATIC_PAGES,
    ...statePages,
    ...militaryPages,
    ...learnPages,
    ...profilePages,
  ];
}
