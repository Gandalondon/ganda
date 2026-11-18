import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "a.storyblok.com" }],
  },
  async redirects() {
    // Sniff moved to its own site (getsniff.app); the old copy here was removed to save Vercel storage (4 Nov 2026)
    return [
      { source: "/sniff", destination: "https://getsniff.app", permanent: true },
      { source: "/sniff/:path*", destination: "https://getsniff.app", permanent: true },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/lionel",
        destination: "/lionel/index.html",
      },
      {
        // Woden concept page (static, noindex), built in ~/Woden/site
        source: "/woden",
        destination: "/woden/index.html",
      },
      {
        // Forn concept page (static, noindex): the app's 3D rings with one big line at a time
        source: "/forn",
        destination: "/forn/index.html",
      },
    ];
  },
  async headers() {
    return [
      {
        // Forn concept page: keep it out of search results
        source: "/forn/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/forn",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://app.storyblok.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
