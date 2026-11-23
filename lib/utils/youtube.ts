const ID = /^[A-Za-z0-9_-]{11}$/;

/** Extracts a YouTube video id from watch, youtu.be, shorts, embed and live links. */
export function parseYouTubeId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = url.pathname.split("/")[1] ?? null;
  } else if (host === "youtube.com" || host === "music.youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else {
      const m = url.pathname.match(/^\/(shorts|embed|live|v)\/([^/?#]+)/);
      id = m ? m[2] : null;
    }
  }
  return id && ID.test(id) ? id : null;
}

export const youTubeEmbedUrl = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
export const youTubeThumb = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
export const youTubeWatchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

/** Only https URLs are accepted for images/thumbnails. */
export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
