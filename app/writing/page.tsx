import { getStory } from "@/lib/storyblok";
import { Instrument_Sans } from "next/font/google";
import Image from "next/image";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// Instrument Sans on Google Fonts only ships 400/500/600/700 — there is no
// 300/Light weight, so body copy renders at 400 (closest available) rather
// than the 300 in the design spec. Flagged in the handoff notes.
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = pageMetadata({
  title: "Writing | Ganda",
  description:
    "Short science-fiction stories about work, judgement and what happens when automation still needs a human.",
  path: "/writing",
});

const DEFAULT_HERO_STATEMENT =
  "I write short science-fiction stories about work, judgement and what happens when automation can do almost everything, but still needs a human.";

const DEFAULT_STORIES_TITLE = "Stories";

const labelStyle: React.CSSProperties = {
  fontSize: "var(--type-display)",
  fontWeight: 500,
  letterSpacing: "-0.006em",
  lineHeight: 1.15,
  color: "#ffffff",
};

const bodyTextStyle: React.CSSProperties = {
  fontSize: "var(--type-body)",
  fontWeight: 300,
  lineHeight: 1.45,
  color: "#ffffff",
};

// Shape of a single "story" nestable block (Storyblok component: story).
// Each story carries its own title, cover, blurb and store link, so a new
// entry can be added from the CMS without a code change or a redeploy.
type StoryBlock = {
  _uid?: string;
  title?: string;
  description?: string;
  cover_image?: { filename?: string };
  amazon_url?: string;
};

// Shape of a single "content_section" nestable block (Storyblok
// component: content_section) — a reusable title/body pair. Process and
// Author are just two entries of this same block, so adding another
// section (e.g. "How I design the covers") is a Storyblok edit, not a
// code change: add an entry to the "sections" Blocks field and it
// renders here automatically, in whatever order it's placed.
type ContentSectionBlock = {
  _uid?: string;
  title?: string;
  body?: string;
};

export default async function WritingPage() {
  const story = await getStory("writing").catch(() => null);
  const content = (story?.content ?? {}) as {
    hero_statement?: string;
    stories_title?: string;
    stories?: StoryBlock[];
    sections?: ContentSectionBlock[];
  };

  const heroStatement = content.hero_statement || DEFAULT_HERO_STATEMENT;
  const storiesTitle = content.stories_title || DEFAULT_STORIES_TITLE;
  // No hardcoded fallback list here on purpose — this section is driven
  // entirely by the "stories" Blocks field in Storyblok.
  const stories = content.stories ?? [];
  // No hardcoded fallback here either, same reasoning as "stories" —
  // driven entirely by the "sections" Blocks field in Storyblok.
  const sections = content.sections ?? [];

  return (
    <main
      id="main"
      className={`gd-writing-page ${instrumentSans.className}`}
      style={{ paddingBottom: "calc(144 * var(--u))" }}
    >
      {/* Hero */}
      <section>
        <div className="gd-container">
          <h1
            style={{
              // Same position and measure as the homepage h1: marginTop/
              // marginBottom 128, maxWidth 816 — not the hero's own padding
              // scale, so the two pages line up exactly.
              marginTop: "calc(128 * var(--u))",
              marginBottom: "calc(128 * var(--u))",
              maxWidth: "calc(960 * var(--u))",
              fontSize: "var(--type-hero)",
              lineHeight: 1.2,
              letterSpacing: "-0.006em",
              fontWeight: 500,
              color: "#ffffff",
              textWrap: "pretty" as React.CSSProperties["textWrap"],
            }}
          >
            {heroStatement}
          </h1>
        </div>
      </section>

      {/* Stories — one shared .gd-split, same as Process/Author below:
          "Stories" (Storyblok's "stories_title" field) in the label
          column, top-aligned (align-items: start) with a column of story
          rows in the content column. Individual story titles are NOT
          shown beside the covers — that reads as noise once there's more
          than one story — but each one is still present as a visually
          hidden h3 (see .sr-only in globals.css) so it's available to
          screen readers and search engines. It's only rendered when the
          story has a title, so a story without one never leaves an empty
          heading in the DOM. */}
      <div className="gd-container">
        <div className="gd-split" style={{ gap: "calc(24 * var(--u))" }}>
          <h2 style={labelStyle}>{storiesTitle}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "calc(96 * var(--u))" }}>
            {stories.map((s, i) => {
              // No local fallback image — every story is expected to have
              // its own cover set in Storyblok, so the cover box is simply
              // skipped for the (unexpected) case where one doesn't.
              const coverUrl = s.cover_image?.filename;
              const description = s.description || "";
              // Only treat the field as a real link if it looks like one —
              // an empty field, or a placeholder like "TBC", falls back to
              // "Coming soon" instead of a dead/broken link.
              const amazonUrl = s.amazon_url?.trim();
              const hasAmazonLink =
                !!amazonUrl && /^https?:\/\//i.test(amazonUrl);
              return (
                <div key={s._uid ?? i}>
                  {s.title && <h3 className="sr-only">{s.title}</h3>}
                  <div className="gd-story-row">
                    {/* Cover thumbnail — sizing/border/responsive
                        behaviour lives in .gd-story-cover (globals.css),
                        so it scales down on mobile instead of
                        overflowing the viewport. */}
                    {coverUrl && (
                      <div className="gd-story-cover" data-fade-media>
                        <Image
                          src={coverUrl}
                          alt={`${s.title || "Story"} book cover`}
                          fill
                          sizes="(max-width: 640px) 100vw, 22vw"
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "calc(16 * var(--u))",
                        maxWidth: "calc(576 * var(--u))",
                      }}
                    >
                      <div>
                        {description.split("\n\n").map((para, pi) => (
                          <p
                            key={pi}
                            style={{
                              ...bodyTextStyle,
                              marginTop: pi === 0 ? 0 : "1.2em",
                              textWrap:
                                "pretty" as React.CSSProperties["textWrap"],
                            }}
                          >
                            {para}
                          </p>
                        ))}
                      </div>
                      {hasAmazonLink ? (
                        <a
                          href={amazonUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`View ${s.title || "story"} on Amazon (opens in new tab)`}
                          style={{
                            ...bodyTextStyle,
                            alignSelf: "flex-start",
                            textDecoration: "underline",
                          }}
                        >
                          View on Amazon
                        </a>
                      ) : (
                        <span
                          style={{
                            ...bodyTextStyle,
                            alignSelf: "flex-start",
                          }}
                        >
                          Coming soon
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sections — Process, Author and any future one-off section
          (e.g. "How I design the covers") are all the same
          content_section block: title on the left, body on the right,
          same .gd-split as Stories above. Order follows the "sections"
          field in Storyblok, so reordering there is enough — no code
          change needed. */}
      {sections.map((sec, i) => (
        <div
          key={sec._uid ?? i}
          className="gd-container"
          style={{ marginTop: "calc(96 * var(--u))" }}
        >
          <div className="gd-split" style={{ gap: "calc(24 * var(--u))" }}>
            {sec.title && <h2 style={labelStyle}>{sec.title}</h2>}
            <div>
              {(sec.body || "").split("\n\n").map((para, pi) => (
                <p
                  key={pi}
                  style={{
                    ...bodyTextStyle,
                    marginTop: pi === 0 ? 0 : "1.2em",
                    textWrap: "pretty" as React.CSSProperties["textWrap"],
                  }}
                >
                  {para}
                </p>
              ))}
              {/* Under the bio: the one way to get in touch from this page. */}
              {sec.title?.trim().toLowerCase() === "author" && (
                <p
                  style={{
                    ...bodyTextStyle,
                    marginTop: "1.2em",
                    textWrap: "pretty" as React.CSSProperties["textWrap"],
                  }}
                >
                  If you enjoyed reading my stories or have anything to share,
                  contact me at{" "}
                  <a
                    href="mailto:tony@gandalondon.com"
                    style={{ color: "inherit", textDecoration: "underline" }}
                  >
                    tony@gandalondon.com
                  </a>
                  .
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </main>
  );
}
