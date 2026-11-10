"use client";

import { useStoryblokState } from "@storyblok/react";
import { useEffect, useState } from "react";
import WorkGrid from "@/components/WorkGrid";
import BlurImage from "@/components/BlurImage";
import YouTubeEmbed, { type YouTubeBlock } from "@/components/YouTubeEmbed";
import { typeset, renderInlineLinks } from "@/lib/inline";
import type { WorkProject } from "@/lib/storyblok";

type TextBlock = {
  component: "text_block";
  Title?: string;
  text?: string;
  image?: { filename: string; alt?: string };
  show_image_border?: boolean;
};

type ImageBlock = {
  component: "image";
  image?: { filename: string; alt?: string };
  // Defaults OFF. Toggle on in Storyblok for screenshots that need a frame
  // to separate them from the page background.
  show_image_border?: boolean;
};

// A single subtitle+body pair inside a TextBlockSections block (nested
// Storyblok component: text_section_item).
type TextSectionItem = {
  _uid?: string;
  subtitle?: string;
  body?: string;
};

// Same two-column text+image layout as TextBlock, but for content that
// needs repeated subtitle/body pairs under one title (e.g. "Opportunity" /
// "Outcome") instead of a single body field. Nested Storyblok component:
// text_block_sections. Image border defaults OFF for this block (opposite
// of TextBlock, where it defaults on) - only shows when explicitly true.
type TextBlockSections = {
  component: "text_block_sections";
  title?: string;
  image?: { filename: string; alt?: string };
  sections?: TextSectionItem[];
  show_image_border?: boolean;
};

// A large standalone statement, styled like the page's top hero text, that
// can be dropped in anywhere in the body to break up a long case study.
// Nested Storyblok component: hero_block.
type HeroBlock = {
  component: "hero_block";
  text?: string;
};

// A pull quote at the same width as HeroBlock, with an attribution line
// underneath (e.g. a testimonial). Nested Storyblok component: quote_block.
type QuoteBlock = {
  component: "quote_block";
  text?: string;
  byline?: string;
};

// Same two-column text+visual layout as TextBlock (title/body on the
// left, visual on the right), but the visual is an interactive HTML
// prototype (e.g. a Claude-exported build dropped in public/) embedded
// via iframe on desktop. On mobile, where the prototype likely will not
// work well, a static fallback image is shown instead and the iframe is
// never mounted (so its HTML/JS never even loads over a mobile
// connection). Nested Storyblok component: prototype_embed.
type PrototypeEmbedBlock = {
  component: "prototype_embed";
  title?: string;
  body?: string;
  // Path to the exported HTML file, e.g. /prototypes/carwow-lionel.html
  prototype_url?: string;
  fallback_image?: { filename: string; alt?: string };
  // Border defaults OFF for this block's fallback image (matching
  // prototype_embed's own no-border iframe). Toggle on in Storyblok if
  // the uploaded fallback screenshot needs one to read correctly.
  show_image_border?: boolean;
  // Full width (22 Oct 2026, for the Sniff dogs): with no title or body,
  // the embed runs edge to edge like an image block, at 4:3, and shows on
  // every screen size (no fallback image needed). Off by default, so
  // existing embeds keep their 880x922 prototype frame.
  full_width?: boolean;
};

type Block =
  | TextBlock
  | ImageBlock
  | TextBlockSections
  | HeroBlock
  | QuoteBlock
  | PrototypeEmbedBlock
  | YouTubeBlock;

type StoryContent = {
  title?: string;
  client?: string;
  summary?: string;
  hero_text?: string;
  thumbnail?: { filename: string; alt?: string };
  body?: Block[];
  // Storyblok boolean field: when true, the More Work grid at the bottom
  // of this project page is hidden so the page simply ends.
  hide_work_grid?: boolean;
};

const PLACEHOLDER_BLOCKS: TextBlock[] = [
  {
    component: "text_block",
    text: "Project summary goes here. A short opening paragraph introducing the project, the brief and the role played.",
  },
  {
    component: "text_block",
    text: "A second passage describing the process, the decisions made and the outcome. Replace this with project-specific copy in the CMS.",
  },
];

// Same breakpoint the site's CSS already switches to a stacked, mobile
// layout at (see .gd-split / .gd-grid-3 in globals.css), reused here so
// desktop vs mobile stays consistent across the page.
const DESKTOP_BREAKPOINT = "(min-width: 1025px)";

// Renders the two-column title/body + prototype layout described above.
// Split into its own component (rather than inlined in the body-block
// map) because it needs its own hook state, and hooks cannot be called
// from inside a .map() callback.
function PrototypeEmbed({
  block,
  TitleTag = "h2",
}: {
  block: PrototypeEmbedBlock;
  TitleTag?: "h1" | "h2";
}) {
  const [showPrototype, setShowPrototype] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_BREAKPOINT);
    const update = () => setShowPrototype(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  if (!block.prototype_url && !block.fallback_image?.filename) return null;

  // With no title or body, there's no left column to balance - center the
  // prototype in the page instead of leaving it pinned to the (empty)
  // right-hand track of the two-column split.
  const hasText = Boolean(block.title || block.body);
  const fullWidth = block.full_width === true && !hasText;

  const media = (
    <>
      {(showPrototype || fullWidth) && block.prototype_url ? (
        <iframe
          src={block.prototype_url}
          title={block.title || "Interactive prototype"}
          data-fade-media
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          // The export centers its content vertically within the
          // page (body { align-items: center }), which leaves a gap
          // above it whenever the content is shorter than the fixed
          // iframe height. Since the export is same-origin (served
          // from our own public/), pin it to the top instead so it
          // lines up with the text column, rather than trying to
          // predict/crop the gap from outside the iframe.
          onLoad={(e) => {
            try {
              const doc = e.currentTarget.contentDocument;
              if (doc?.body) {
                doc.body.style.alignItems = "flex-start";
              }
            } catch {
              // Cross-origin or otherwise inaccessible - leave the
              // export's own centering as-is.
            }
          }}
          style={fullWidth ? {
            width: "100%",
            aspectRatio: "4 / 3",
            height: "auto",
            border: "none",
            display: "block",
          } : {
            width: "100%",
            // Locked to the export's real design canvas ratio (full
            // prototype incl. side panel: 880x922). maxHeight caps the
            // rendered size on the page (the design-tool reference
            // showed the same 880x922 canvas at a smaller effective
            // size than our wide column renders it at) - the browser
            // shrinks width to match once maxHeight kicks in, keeping
            // the exact ratio rather than cropping or distorting it.
            maxWidth: "calc(880 * var(--u))",
            aspectRatio: "880 / 922",
            maxHeight: "calc(824 * var(--u))",
            height: "auto",
            border: "none",
            display: "block",
          }}
        />
      ) : (
        block.fallback_image?.filename && (
          <BlurImage
            src={block.fallback_image.filename}
            alt={block.fallback_image.alt ?? ""}
            width={1200}
            height={900}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              ...(block.show_image_border === true
                ? { border: "1px solid var(--border)" }
                : {}),
            }}
          />
        )
      )}
    </>
  );

  if (!hasText) {
    return (
      <div className="gd-container" style={{ marginTop: "calc(176 * var(--u))" }}>
        <div style={fullWidth ? undefined : { maxWidth: "calc(880 * var(--u))", margin: "0 auto" }}>{media}</div>
      </div>
    );
  }

  return (
    <div className="gd-container" style={{ marginTop: "calc(176 * var(--u))" }}>
      <div className="gd-split" style={{ gap: "calc(24 * var(--u))" }}>
        <div style={{ maxWidth: "calc(100% - 24 * var(--u))" }}>
          {block.title && (
            <TitleTag
              style={{
                fontSize: "var(--type-display)",
                fontWeight: 500,
                letterSpacing: "-0.006em",
                lineHeight: 1.15,
                marginBottom: "calc(24 * var(--u))",
              }}
            >
              {block.title}
            </TitleTag>
          )}
          {block.body &&
            block.body.split("\n\n").map((para, j) => (
              <p
                key={j}
                style={{
                  fontSize: "var(--type-body)",
                  fontWeight: 300,
                  lineHeight: 1.45,
                  marginBottom: "1em",
                  textWrap: "pretty",
                }}
              >
                {renderInlineLinks(para)}
              </p>
            ))}
        </div>
        {/* media is capped at maxWidth:880, narrower than this column's
            stretched track - push it to the column's right edge so the
            leftover gap sits in the middle gutter (next to the text)
            instead of trailing on the page's outer right edge. */}
        <div style={{ marginLeft: "auto", maxWidth: "calc(880 * var(--u))", width: "100%" }}>
          {media}
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetail({
  story: initialStory,
  slug,
  projects,
}: {
  story: unknown;
  slug?: string;
  projects: WorkProject[];
}) {
  const story = useStoryblokState(initialStory as never);
  const content = ((story as { content?: StoryContent })?.content ??
    {}) as StoryContent;

  const blocks = content.body?.length ? content.body : PLACEHOLDER_BLOCKS;

  // Index of the first block that renders a heading (see the h1 note below).
  const firstHeadingIndex = blocks.findIndex((b) => {
    switch (b.component) {
      case "text_block_sections":
      case "prototype_embed":
        return Boolean(b.title);
      case "hero_block":
      case "image":
      case "quote_block":
      case "YouTube":
        return false;
      default:
        return Boolean((b as { Title?: string }).Title);
    }
  });

  return (
    <main id="main" style={{ paddingBottom: "calc(96 * var(--u))" }}>
      {content.hero_text && (
        <div className="gd-container">
          <h1
            style={{
              maxWidth: "calc(960 * var(--u))",
              marginTop: "calc(80 * var(--u))",
              marginBottom: "var(--gd-statement-gap)",
              fontSize: "var(--type-display)",
              lineHeight: 1.2,
              fontWeight: 500,
              letterSpacing: "-0.006em",
              color: "var(--ink)",
              textWrap: "pretty",
            }}
          >
            {typeset(content.hero_text)}
          </h1>
        </div>
      )}

      {/* Body blocks. With no hero text above them, the first block is the
          page title, so it sits at the same 80px from the nav as the
          homepage intro and the About title (every block otherwise carries a
          176px top margin). See .gd-body-first in globals.css. */}
      {!content.hero_text && firstHeadingIndex === -1 && (
        <h1 className="sr-only">
          {content.client ??
            content.title ??
            (story as { name?: string } | null)?.name}
        </h1>
      )}
      <div className={content.hero_text ? "gd-body-after-hero" : "gd-body-first"}>
        {blocks.map((block, i) => {
          // The page's h1: its hero text, or when there is none, the first
          // block title (so every case study has exactly one h1).
          const Tag =
            !content.hero_text && i === firstHeadingIndex ? "h1" : "h2";
          if (block.component === "image") {
            if (!block.image?.filename) return null;
            return (
              <div key={i} className="gd-container" style={{ marginTop: "calc(176 * var(--u))" }}>
                <BlurImage
                  src={block.image.filename}
                  alt={block.image.alt ?? ""}
                  width={1200}
                  height={900}
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                    ...(block.show_image_border === true
                      ? { border: "1px solid var(--border)" }
                      : {}),
                  }}
                />
              </div>
            );
          }

          if (block.component === "text_block_sections") {
            const sections = block.sections ?? [];
            const SubTag = block.title ? "h3" : "h2";
            return (
              <div key={i} className="gd-container" style={{ marginTop: "calc(176 * var(--u))" }}>
                <div className="gd-split" style={{ gap: "calc(24 * var(--u))" }}>
                  <div style={{ maxWidth: "calc(100% - 24 * var(--u))" }}>
                    {block.title && (
                      <Tag
                        style={{
                          fontSize: "var(--type-display)",
                          fontWeight: 500,
                          letterSpacing: "-0.006em",
                          lineHeight: 1.15,
                          marginBottom: "calc(24 * var(--u))",
                        }}
                      >
                        {block.title}
                      </Tag>
                    )}
                    {sections.map((sec, si) => (
                      <div
                        key={sec._uid ?? si}
                        style={{ marginTop: si === 0 ? 0 : "calc(32 * var(--u))" }}
                      >
                        {sec.subtitle && (
                          // h3 under a block title; h2 when the block has
                          // none, so headings never skip a level.
                          <SubTag
                            style={{
                              fontSize: "var(--type-body)",
                              letterSpacing: "-0.0048em",
                              fontWeight: 500,
                              lineHeight: 1.3,
                              marginBottom: "0.5em",
                            }}
                          >
                            {sec.subtitle}
                          </SubTag>
                        )}
                        {sec.body &&
                          sec.body.split("\n\n").map((para, j) => (
                            <p
                              key={j}
                              style={{
                                fontSize: "var(--type-body)",
                                fontWeight: 300,
                                lineHeight: 1.45,
                                marginBottom: "1em",
                                textWrap: "pretty",
                              }}
                            >
                              {renderInlineLinks(para)}
                            </p>
                          ))}
                      </div>
                    ))}
                  </div>
                  <div>
                    {block.image?.filename && (
                      <BlurImage
                        src={block.image.filename}
                        alt={block.image.alt ?? ""}
                        width={1200}
                        height={900}
                        style={{
                          width: "100%",
                          height: "auto",
                          display: "block",
                          ...(block.show_image_border === true
                            ? { border: "1px solid var(--border)" }
                            : {}),
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          }

          if (block.component === "hero_block") {
            if (!block.text) return null;
            return (
              <div key={i} className="gd-container" style={{ marginTop: "calc(176 * var(--u))" }}>
                <p
                  style={{
                    maxWidth: "calc(960 * var(--u))",
                    fontSize: "var(--type-display)",
                    lineHeight: 1.2,
                    fontWeight: 500,
                    letterSpacing: "-0.006em",
                    color: "var(--ink)",
                    textWrap: "pretty",
                  }}
                >
                  {renderInlineLinks(block.text)}
                </p>
              </div>
            );
          }

          if (block.component === "quote_block") {
            if (!block.text) return null;
            return (
              // data-fade-block: the quote and byline fade in together as one.
              <div
                key={i}
                className="gd-container"
                data-fade-block
                style={{ marginTop: "calc(176 * var(--u))" }}
              >
                <blockquote
                  style={{
                    maxWidth: "calc(960 * var(--u))",
                    fontSize: "var(--type-display)",
                    lineHeight: 1.2,
                    fontWeight: 500,
                    letterSpacing: "-0.006em",
                    color: "var(--ink)",
                    textWrap: "pretty",
                  }}
                >
                  {block.text}
                </blockquote>
                {block.byline && (
                  <p
                    style={{
                      maxWidth: "var(--wrap)",
                      marginTop: "calc(24 * var(--u))",
                      fontSize: "var(--type-body)",
                      fontWeight: 300,
                      lineHeight: 1.45,
                      color: "var(--ink)",
                    }}
                  >
                    {block.byline}
                  </p>
                )}
              </div>
            );
          }

          if (block.component === "YouTube") {
            return <YouTubeEmbed key={i} block={block} />;
          }

          if (block.component === "prototype_embed") {
            return <PrototypeEmbed key={i} block={block} TitleTag={Tag} />;
          }

          return (
            <div key={i} className="gd-container" style={{ marginTop: "calc(176 * var(--u))" }}>
              <div className="gd-split" style={{ gap: "calc(24 * var(--u))" }}>
                <div style={{ maxWidth: "calc(100% - 24 * var(--u))" }}>
                  {block.Title && (
                    <Tag
                      style={{
                        fontSize: "var(--type-display)",
                        fontWeight: 500,
                        letterSpacing: "-0.006em",
                        lineHeight: 1.15,
                        marginBottom: "calc(24 * var(--u))",
                      }}
                    >
                      {block.Title}
                    </Tag>
                  )}
                  {block.text &&
                    block.text.split("\n\n").map((para, j) => (
                      <p
                        key={j}
                        style={{
                          fontSize: "var(--type-body)",
                          fontWeight: 300,
                          lineHeight: 1.45,
                          marginBottom: "1em",
                          textWrap: "pretty",
                        }}
                      >
                        {renderInlineLinks(para)}
                      </p>
                    ))}
                </div>
                <div>
                  {block.image?.filename && (
                    <BlurImage
                      src={block.image.filename}
                      alt={block.image.alt ?? ""}
                      width={1200}
                      height={900}
                      style={{
                        width: "100%",
                        height: "auto",
                        display: "block",
                        ...(block.show_image_border !== false
                          ? { border: "1px solid var(--border)" }
                          : {}),
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Work grid */}
      {!content.hide_work_grid && (
        <div className="gd-container" style={{ marginTop: "calc(200 * var(--u))" }}>
          {/* The page's own project is left out of its list. */}
          <WorkGrid
            projects={projects.filter(
              (p) => p.slug.toLowerCase() !== slug?.toLowerCase(),
            )}
          />
        </div>
      )}
    </main>
  );
}
