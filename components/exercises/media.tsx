"use client";

import { useState } from "react";
import { ExternalLink, ImageOff, Play } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { youTubeEmbedUrl, youTubeThumb, youTubeWatchUrl } from "@/lib/utils/youtube";

/**
 * Plain <img> on purpose: images are arbitrary https links entered by doctors, and Next's image
 * optimizer would turn the server into a proxy for any website.
 */
export function SafeImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={cn("grid place-items-center bg-canvas text-muted", className)} aria-label={alt} role="img">
        <ImageOff className="h-8 w-8" aria-hidden />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className={cn("object-cover", className)} />;
}

/** Exercise thumbnail: custom thumbnail, then image, then the YouTube preview frame. */
export function ExerciseThumb({
  thumbnailUrl,
  imageUrl,
  youtubeId,
  alt,
  className,
}: {
  thumbnailUrl?: string;
  imageUrl?: string;
  youtubeId?: string | null;
  alt: string;
  className?: string;
}) {
  const src = thumbnailUrl || imageUrl || (youtubeId ? youTubeThumb(youtubeId) : "");
  return <SafeImage src={src} alt={alt} className={className} />;
}

/** Loads the iframe only after a tap: faster pages and less mobile data on long programs. */
export function LazyYouTube({ id, title }: { id: string; title: string }) {
  const [active, setActive] = useState(false);
  if (active) return <YouTubeEmbed id={id} title={title} />;
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setActive(true)}
        className="group relative block aspect-video w-full overflow-hidden rounded-xl bg-ink/5"
        aria-label={`تشغيل فيديو ${title}`}
      >
        <SafeImage src={youTubeThumb(id)} alt={title} className="h-full w-full" />
        <span className="absolute inset-0 grid place-items-center bg-ink/20 transition-colors group-hover:bg-ink/30">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-surface/95 shadow-pop">
            <Play className="h-6 w-6 text-primary rtl-flip" aria-hidden />
          </span>
        </span>
      </button>
    </div>
  );
}

/**
 * YouTube embed (privacy-enhanced domain). A page cannot detect removed or embed-blocked videos,
 * so a direct "open on YouTube" link is always shown beneath the player.
 */
export function YouTubeEmbed({ id, title }: { id: string; title: string }) {
  return (
    <div className="space-y-2">
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-ink/5">
        <iframe
          src={youTubeEmbedUrl(id)}
          title={title}
          loading="lazy"
          className="h-full w-full"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <a
        href={youTubeWatchUrl(id)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary"
      >
        <ExternalLink className="h-4 w-4" aria-hidden />
        الفيديو لا يعمل؟ افتحه على YouTube
      </a>
    </div>
  );
}
