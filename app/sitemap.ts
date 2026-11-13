import type { MetadataRoute } from "next";
import { getWorkProjects } from "@/lib/storyblok";

const BASE = "https://www.gandalondon.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getWorkProjects().catch(() => []);
  const workEntries = projects.map((p) => ({
    url: `${BASE}/work/${p.slug}`,
    ...(p.updated ? { lastModified: p.updated } : {}),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/work`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/writing`, changeFrequency: "monthly", priority: 0.6 },
    ...workEntries,
  ];
}
