import type { Metadata } from "next";

export const SITE_URL = "https://www.gandalondon.com";
export const SITE_NAME = "Ganda";
export const SHARE_IMAGE = "/opengraph-image.png";

// Default description for the site (home page and anything without its own).
export const SITE_DESCRIPTION =
  "Portfolio of Tony Goff-Yu, a London-based product designer with 20+ years' experience in automotive, e-commerce, experimentation and customer experience.";

// Per-page metadata: its own canonical URL, and its own Open Graph and Twitter
// tags. Pages that only set a title and description inherit the root layout's
// Open Graph tags wholesale, so every page would share the home page's title
// and URL when shared. `path` is relative ("/about"); metadataBase in the root
// layout turns it into an absolute URL.
export function pageMetadata({
  title,
  description,
  path,
  noindex = false,
}: {
  title: string;
  description?: string;
  path: string;
  noindex?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: "en_GB",
      type: "website",
      images: [{ url: SHARE_IMAGE, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SHARE_IMAGE],
    },
    ...(noindex ? { robots: { index: false } } : {}),
  };
}

// Structured data for the home page: who the site belongs to, and the site
// itself. Add profile URLs (LinkedIn and so on) to sameAs on the Person to
// help Google connect them to the site.
export const HOME_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: "en-GB",
      publisher: { "@id": `${SITE_URL}/#person` },
    },
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: "Tony Goff-Yu",
      url: SITE_URL,
      jobTitle: "Product Designer",
      description:
        "London-based product designer with 20+ years' experience in automotive, e-commerce, experimentation and customer experience.",
      worksFor: { "@type": "Organization", name: "Ganda", url: SITE_URL },
      address: { "@type": "PostalAddress", addressLocality: "London" },
      knowsAbout: [
        "Product design",
        "Experimentation",
        "Customer experience",
        "Conversion optimisation",
      ],
    },
  ],
};
