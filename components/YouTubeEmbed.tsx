"use client";

import { useState } from "react";

// YouTube video for case studies (10 Nov 2026). Nested Storyblok component:
// YouTube, with one text field, `video`, holding any YouTube link.
// Shows the video's own thumbnail and a play button; YouTube's player (and
// its scripts and cookies) only loads once someone presses play. Uses
// youtube-nocookie.com for the player.
export type YouTubeBlock = {
  component: "YouTube";
  video?: string;
};

// Pulls the video ID (and a start time, if the link has one) from the
// common link shapes: youtube.com/watch?v=, youtu.be/, /shorts/, /embed/,
// /live/. Returns null for anything that is not a YouTube link.
export function parseYouTube(link?: string): { id: string; start?: number } | null {
  if (!link) return null;
  let url: URL;
  try {
    url = new URL(link.trim().startsWith("http") ? link.trim() : `https://${link.trim()}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = url.pathname.split("/")[1] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "music.youtube.com") {
    id =
      url.searchParams.get("v") ??
      url.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?#]+)/)?.[1] ??
      null;
  }
  if (!id || !/^[A-Za-z0-9_-]{6,}$/.test(id)) return null;

  // t=90, t=90s, t=1m30s, start=90
  const t = url.searchParams.get("t") ?? url.searchParams.get("start");
  let start: number | undefined;
  if (t) {
    const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
    if (m) {
      const secs = (+(m[1] ?? 0)) * 3600 + (+(m[2] ?? 0)) * 60 + (+(m[3] ?? 0));
      if (secs > 0) start = secs;
    }
  }
  return { id, start };
}

export default function YouTubeEmbed({ block }: { block: YouTubeBlock }) {
  const parsed = parseYouTube(block.video);
  const [playing, setPlaying] = useState(false);
  // maxresdefault is missing for some older or smaller videos; drop to
  // hqdefault (always there) if it fails to load.
  const [thumb, setThumb] = useState<"maxresdefault" | "hqdefault">("maxresdefault");

  if (!parsed) return null;

  const params = new URLSearchParams({ autoplay: "1", rel: "0", playsinline: "1" });
  if (parsed.start) params.set("start", String(parsed.start));
  const src = `https://www.youtube-nocookie.com/embed/${parsed.id}?${params}`;

  return (
    <div className="gd-container" style={{ marginTop: "calc(176 * var(--u))" }}>
      <div
        data-fade-media
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          background: "#000",
          overflow: "hidden",
        }}
      >
        {playing ? (
          <iframe
            src={src}
            title="YouTube video"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label="Play video"
            className="gd-yt-play"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              padding: 0,
              border: "none",
              background: "none",
              cursor: "pointer",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${parsed.id}/${thumb}.jpg`}
              alt=""
              loading="lazy"
              onError={() => thumb === "maxresdefault" && setThumb("hqdefault")}
              onLoad={(e) => {
                // YouTube serves a 120px grey placeholder (not an error)
                // when maxresdefault does not exist.
                if (thumb === "maxresdefault" && e.currentTarget.naturalWidth <= 120) setThumb("hqdefault");
              }}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "calc(88 * var(--u))",
                height: "calc(88 * var(--u))",
                minWidth: 56,
                minHeight: 56,
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg viewBox="0 0 24 24" width="36%" height="36%" style={{ marginLeft: "8%" }}>
                <path d="M6 3.5v17L20 12z" fill="#000" />
              </svg>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
