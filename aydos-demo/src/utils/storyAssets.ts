import type React from "react";

/**
 * Builds GitHub-hosted asset paths for stories and series.
 *
 * GitHub Repository:
 *   https://github.com/jamesfreda53-ops/aydos-demo/main
 *
 * Folder Hierarchy (under /aydos-demo/public/stories/ in GitHub):
 *   <GITHUB_RAW_BASE>/<seriesFolder>/title.png (Series / Story Title Cover image)
 *   <GITHUB_RAW_BASE>/<seriesFolder>/<chapterFolder>/images/<filename> (Chapter slide images, e.g. 1.png, 2.png)
 *   <GITHUB_RAW_BASE>/<seriesFolder>/<chapterFolder>/audio/<filename> (Chapter slide audio, e.g. 1.wav, 2.wav)
 *   <GITHUB_RAW_BASE>/<seriesFolder>/<chapterFolder>/<chapterFolder>.txt (Chapter slide text)
 *
 * Standalone Stories (without series hierarchy):
 *   <GITHUB_RAW_BASE>/<storyFolder>/images/title.png
 *   <GITHUB_RAW_BASE>/<storyFolder>/images/<filename> (e.g. 1.png, 2.png)
 *   <GITHUB_RAW_BASE>/<storyFolder>/audio/<filename> (e.g. 1.wav, 2.wav)
 *   <GITHUB_RAW_BASE>/<storyFolder>/<storyFolder>.txt (Story text)
 */

export const GITHUB_REPO_URL = "https://github.com/jamesfreda53-ops/aydos-demo";
export const GITHUB_RAW_BASE_URL =
  "https://raw.githubusercontent.com/jamesfreda53-ops/aydos-demo/main/aydos-demo/public/stories";

/**
 * GitHub Contents API (api.github.com) -- separate from the raw-URL constants above.
 * The raw URLs are read-only and unauthenticated; this API can both read AND write,
 * which is what the Story/Series Editors need for real persistence.
 */
export const GITHUB_API_OWNER = "jamesfreda53-ops";
export const GITHUB_API_REPO = "aydos-demo";
export const GITHUB_API_BRANCH = "main";
// Path inside the repo to the /public folder -- adjust if your repo layout differs.
// (GITHUB_RAW_BASE_URL above implies /aydos-demo/public/stories/, so /public/ itself
// is one level up from that.)
export const GITHUB_PUBLIC_PATH = "aydos-demo/public";

/**
 * Reads the personal access token from a local .env file via Vite's import.meta.env.
 * NEVER commit the .env file itself -- it must be in .gitignore. This token needs
 * "repo" scope (classic PAT) or "Contents: Read and write" (fine-grained PAT) on
 * this specific repository only.
 */
function getGithubToken(): string {
  const token = (import.meta as any).env?.VITE_GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      "Missing VITE_GITHUB_TOKEN. Add it to a local .env file in the project root " +
        "(e.g. VITE_GITHUB_TOKEN=ghp_xxx) -- never commit this file."
    );
  }
  return token;
}

export interface GithubFileResult {
  content: string; // decoded text content
  sha: string; // required by the API when updating an existing file
}

/**
 * Reads a file's content + SHA from the repo via the GitHub Contents API.
 * Returns null if the file doesn't exist yet (a fresh 404, not an error).
 */
export async function readGithubFile(repoPath: string): Promise<GithubFileResult | null> {
  const url = `https://api.github.com/repos/${GITHUB_API_OWNER}/${GITHUB_API_REPO}/contents/${repoPath}?ref=${GITHUB_API_BRANCH}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getGithubToken()}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub read failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  // GitHub returns base64 content, sometimes with embedded newlines
  const content = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ""))));
  return { content, sha: data.sha };
}

/**
 * Writes (creates or updates) a file in the repo via the GitHub Contents API.
 * Always fetches the current SHA immediately before writing, so this never
 * overwrites changes made since the editing session started.
 */
export async function writeGithubFile(
  repoPath: string,
  content: string,
  commitMessage: string
): Promise<boolean> {
  const url = `https://api.github.com/repos/${GITHUB_API_OWNER}/${GITHUB_API_REPO}/contents/${repoPath}`;
  const existing = await readGithubFile(repoPath);
  const encodedContent = btoa(unescape(encodeURIComponent(content)));

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${getGithubToken()}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: commitMessage,
      content: encodedContent,
      branch: GITHUB_API_BRANCH,
      ...(existing ? { sha: existing.sha } : {}),
    }),
  });

  if (!res.ok) {
    console.error(`GitHub write failed (${res.status}):`, await res.text());
    return false;
  }
  return true;
}

/**
 * Resolves any relative, legacy /stories/, or old repository path to the full GitHub raw URL.
 * Leaves external absolute URLs (data:, blob:, non-aydos http) intact.
 */
export function resolveStoryAssetUrl(pathOrUrl?: string): string {
  if (!pathOrUrl || !pathOrUrl.trim()) return "";
  const trimmed = pathOrUrl.trim();

  // Handle old or varied GitHub raw URLs
  const legacyGithubPatterns = [
    /^https?:\/\/(?:raw\.)?github(?:usercontent)?\.com\/jamesfreda53\/aydos\/(?:main|master|blob\/main|raw\/main)\/?/i,
    /^https?:\/\/raw\.githubusercontent\.com\/jamesfreda53-ops\/aydos-demo\/(?:main|master)\/public\/stories\/?/i,
  ];

  for (const pattern of legacyGithubPatterns) {
    if (pattern.test(trimmed)) {
      const subPath = trimmed.replace(pattern, "").replace(/^\/+/, "");
      return `${GITHUB_RAW_BASE_URL}/${subPath}`;
    }
  }

  // Already an absolute web or data URL that is not our legacy repo
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  // Handle /aydos-demo/public/stories/...
  if (trimmed.startsWith("/aydos-demo/public/stories/")) {
    const subPath = trimmed.slice("/aydos-demo/public/stories/".length);
    return `${GITHUB_RAW_BASE_URL}/${subPath}`;
  }

  // Handle /public/stories/...
  if (trimmed.startsWith("/public/stories/")) {
    const subPath = trimmed.slice("/public/stories/".length);
    return `${GITHUB_RAW_BASE_URL}/${subPath}`;
  }

  // Handle /stories/...
  if (trimmed.startsWith("/stories/")) {
    const subPath = trimmed.slice("/stories/".length);
    return `${GITHUB_RAW_BASE_URL}/${subPath}`;
  }

  // Handle stories/...
  if (trimmed.startsWith("stories/")) {
    const subPath = trimmed.slice("stories/".length);
    return `${GITHUB_RAW_BASE_URL}/${subPath}`;
  }

  // Relative path with leading slash
  if (trimmed.startsWith("/")) {
    return `${GITHUB_RAW_BASE_URL}${trimmed}`;
  }

  return `${GITHUB_RAW_BASE_URL}/${trimmed}`;
}

function formatFileName(fileOrNumber: string | number, defaultExt: string): string {
  const str = String(fileOrNumber).trim();
  if (str.includes(".")) {
    return str;
  }
  return `${str}.${defaultExt}`;
}

/**
 * Builds GitHub raw path for a chapter slide image within a series folder.
 * e.g. chapterImage("odyssey", "lotus_eaters", 1)
 */
export function chapterImage(
  seriesFolder: string,
  chapterFolder: string,
  filenameOrNumber: string | number,
  ext = "webp"
): string {
  const filename = formatFileName(filenameOrNumber, ext);
  return `${GITHUB_RAW_BASE_URL}/${seriesFolder}/${chapterFolder}/images/${filename}`;
}

/**
 * Builds GitHub raw path for a chapter slide audio file within a series folder.
 * e.g. chapterAudio("odyssey", "lotus_eaters", 1)
 */
export function chapterAudio(
  seriesFolder: string,
  chapterFolder: string,
  filenameOrNumber: string | number,
  ext = "mp3"
): string {
  const filename = formatFileName(filenameOrNumber, ext);
  return `${GITHUB_RAW_BASE_URL}/${seriesFolder}/${chapterFolder}/audio/${filename}`;
}

/**
 * Flexible helper for story/chapter images.
 */
export function storyImage(arg1: string, arg2: string | number, arg3?: string | number): string {
  if (arg3 !== undefined) {
    const filename = formatFileName(arg3, "webp");
    return `${GITHUB_RAW_BASE_URL}/${arg1}/${arg2}/images/${filename}`;
  }
  const filename = formatFileName(arg2, "webp");
  return `${GITHUB_RAW_BASE_URL}/${arg1}/images/${filename}`;
}

/**
 * Flexible helper for story/chapter audio files.
 */
export function storyAudio(arg1: string, arg2: string | number, arg3?: string | number): string {
  if (arg3 !== undefined) {
    const filename = formatFileName(arg3, "mp3");
    return `${GITHUB_RAW_BASE_URL}/${arg1}/${arg2}/audio/${filename}`;
  }
  const filename = formatFileName(arg2, "mp3");
  return `${GITHUB_RAW_BASE_URL}/${arg1}/audio/${filename}`;
}

/**
 * Builds GitHub raw path for a series or story title image placed in the series folder.
 */
export function seriesTitleImage(seriesFolder: string, filename = "title.webp"): string {
  return `${GITHUB_RAW_BASE_URL}/${seriesFolder}/${filename}`;
}

/**
 * Builds GitHub raw path for a chapter title image placed in the chapter's images folder.
 */
export function chapterTitleImage(
  seriesFolder: string,
  chapterFolder: string,
  filename = "title.webp"
): string {
  return `${GITHUB_RAW_BASE_URL}/${seriesFolder}/${chapterFolder}/images/${filename}`;
}

export function seriesImage(seriesFolder: string, filename = "title.webp"): string {
  return `${GITHUB_RAW_BASE_URL}/${seriesFolder}/${filename}`;
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Multi-format support: for a given slide, only ONE of these will actually
 * exist in its folder (never both), so we probe in preference order and use
 * whichever one resolves. Newer/compressed formats are tried first.
 */
const IMAGE_EXTENSIONS = ["webp", "png"];
const AUDIO_EXTENSIONS = ["mp3", "wav"];

async function resolveExtension(baseUrlNoExt: string, extensions: string[]): Promise<string> {
  for (const ext of extensions) {
    const url = `${baseUrlNoExt}.${ext}`;
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) return url;
    } catch {
      // Network error -- try the next candidate extension
    }
  }
  // Nothing resolved (e.g. offline, or file genuinely missing) -- return the
  // first-preference extension anyway so the UI has something to attempt/show as broken
  return `${baseUrlNoExt}.${extensions[0]}`;
}

/**
 * Resolves a chapter slide image, trying .webp then .png.
 */
export async function resolveChapterImage(
  seriesFolder: string,
  chapterFolder: string,
  filenameOrNumber: string | number
): Promise<string> {
  const str = String(filenameOrNumber).trim();
  const baseName = str.replace(/\.[a-zA-Z0-9]+$/, "");
  const sFolder = seriesFolder.trim();
  const cFolder = chapterFolder.trim();
  const candidates = [
    `${GITHUB_RAW_BASE_URL}/${sFolder}/${cFolder}/images/${baseName}.webp`,
    `${GITHUB_RAW_BASE_URL}/${sFolder}/${cFolder}/images/${baseName}.png`,
    `${GITHUB_RAW_BASE_URL}/${sFolder}/${cFolder}/${baseName}.webp`,
    `${GITHUB_RAW_BASE_URL}/${sFolder}/${cFolder}/${baseName}.png`,
  ];
  return probeFirstValidUrl(candidates);
}

/** Resolves a chapter slide audio file, trying .mp3 then .wav, .m4a. */
export async function resolveChapterAudio(
  seriesFolder: string,
  chapterFolder: string,
  filenameOrNumber: string | number
): Promise<string> {
  const str = String(filenameOrNumber).trim();
  const baseName = str.replace(/\.[a-zA-Z0-9]+$/, "");
  const sFolder = seriesFolder.trim();
  const cFolder = chapterFolder.trim();
  const candidates = [
    `${GITHUB_RAW_BASE_URL}/${sFolder}/${cFolder}/audio/${baseName}.mp3`,
    `${GITHUB_RAW_BASE_URL}/${sFolder}/${cFolder}/audio/${baseName}.wav`,
    `${GITHUB_RAW_BASE_URL}/${sFolder}/${cFolder}/audio/${baseName}.m4a`,
    `${GITHUB_RAW_BASE_URL}/${sFolder}/${cFolder}/${baseName}.mp3`,
    `${GITHUB_RAW_BASE_URL}/${sFolder}/${cFolder}/${baseName}.wav`,
  ];
  return probeFirstValidUrl(candidates);
}

/** Resolves a standalone story's slide image, trying .webp then .png. */
export async function resolveStoryImage(
  storyFolder: string,
  filenameOrNumber: string | number
): Promise<string> {
  const str = String(filenameOrNumber).trim();
  const baseName = str.replace(/\.[a-zA-Z0-9]+$/, "");
  const sFolder = storyFolder.trim();
  const candidates = [
    `${GITHUB_RAW_BASE_URL}/${sFolder}/images/${baseName}.webp`,
    `${GITHUB_RAW_BASE_URL}/${sFolder}/images/${baseName}.png`,
    `${GITHUB_RAW_BASE_URL}/${sFolder}/${baseName}.webp`,
    `${GITHUB_RAW_BASE_URL}/${sFolder}/${baseName}.png`,
  ];
  return probeFirstValidUrl(candidates);
}

/** Resolves a standalone story's slide audio file, trying .mp3 then .wav, .m4a. */
export async function resolveStoryAudio(
  storyFolder: string,
  filenameOrNumber: string | number
): Promise<string> {
  const str = String(filenameOrNumber).trim();
  const baseName = str.replace(/\.[a-zA-Z0-9]+$/, "");
  const sFolder = storyFolder.trim();
  const candidates = [
    `${GITHUB_RAW_BASE_URL}/${sFolder}/audio/${baseName}.mp3`,
    `${GITHUB_RAW_BASE_URL}/${sFolder}/audio/${baseName}.wav`,
    `${GITHUB_RAW_BASE_URL}/${sFolder}/audio/${baseName}.m4a`,
    `${GITHUB_RAW_BASE_URL}/${sFolder}/${baseName}.mp3`,
    `${GITHUB_RAW_BASE_URL}/${sFolder}/${baseName}.wav`,
  ];
  return probeFirstValidUrl(candidates);
}

/**
 * Checks a list of candidate URLs and returns the first one that exists (HTTP 200).
 * Falls back to the first candidate if all fail or offline.
 */
export async function probeFirstValidUrl(candidates: string[]): Promise<string> {
  if (!candidates || candidates.length === 0) return "";
  for (const url of candidates) {
    if (!url) continue;
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) return url;
    } catch {
      // Network error or blocked - try next candidate
    }
  }
  return candidates[0] || "";
}

/**
 * Resolves a series cover / title artwork:
 * Probes:
 * 1. <seriesFolder>/title.webp
 * 2. <seriesFolder>/title.png
 * 3. <seriesFolder>/images/title.webp
 * 4. <seriesFolder>/images/title.png
 */
export async function resolveSeriesCoverImage(seriesFolder: string): Promise<string> {
  const sFolder = seriesFolder.trim();
  const candidates = [
    `${GITHUB_RAW_BASE_URL}/${sFolder}/title.webp`,
    `${GITHUB_RAW_BASE_URL}/${sFolder}/title.png`,
    `${GITHUB_RAW_BASE_URL}/${sFolder}/images/title.webp`,
    `${GITHUB_RAW_BASE_URL}/${sFolder}/images/title.png`,
  ];
  return probeFirstValidUrl(candidates);
}

/**
 * Resolves a chapter cover / title artwork:
 * Probes:
 * 1. <seriesFolder>/<chapterFolder>/images/title.webp
 * 2. <seriesFolder>/<chapterFolder>/images/title.png
 * 3. <seriesFolder>/<chapterFolder>/title.webp
 * 4. <seriesFolder>/<chapterFolder>/title.png
 * 5. <seriesFolder>/title.webp (series title fallback)
 * 6. <seriesFolder>/title.png
 */
export async function resolveChapterCoverImage(
  seriesFolder: string,
  chapterFolder: string
): Promise<string> {
  const sFolder = seriesFolder.trim();
  const cFolder = chapterFolder.trim();
  const candidates = [
    `${GITHUB_RAW_BASE_URL}/${sFolder}/${cFolder}/images/title.webp`,
    `${GITHUB_RAW_BASE_URL}/${sFolder}/${cFolder}/images/title.png`,
    `${GITHUB_RAW_BASE_URL}/${sFolder}/${cFolder}/title.webp`,
    `${GITHUB_RAW_BASE_URL}/${sFolder}/${cFolder}/title.png`,
    `${GITHUB_RAW_BASE_URL}/${sFolder}/title.webp`,
    `${GITHUB_RAW_BASE_URL}/${sFolder}/title.png`,
  ];
  return probeFirstValidUrl(candidates);
}

/**
 * Resolves a standalone story cover / title artwork:
 * Probes:
 * 1. <storyFolder>/images/title.webp
 * 2. <storyFolder>/images/title.png
 * 3. <storyFolder>/title.webp
 * 4. <storyFolder>/title.png
 * 5. <storyFolder>/images/1.webp
 * 6. <storyFolder>/images/1.png
 */
export async function resolveStoryCoverImage(storyFolder: string): Promise<string> {
  const sFolder = storyFolder.trim();
  const candidates = [
    `${GITHUB_RAW_BASE_URL}/${sFolder}/images/title.webp`,
    `${GITHUB_RAW_BASE_URL}/${sFolder}/images/title.png`,
    `${GITHUB_RAW_BASE_URL}/${sFolder}/title.webp`,
    `${GITHUB_RAW_BASE_URL}/${sFolder}/title.png`,
    `${GITHUB_RAW_BASE_URL}/${sFolder}/images/1.webp`,
    `${GITHUB_RAW_BASE_URL}/${sFolder}/images/1.png`,
  ];
  return probeFirstValidUrl(candidates);
}

/**
 * Universal browser-side image error recovery handler for <img> tags.
 * If a .webp fails to load, gracefully attempts .png (and vice versa)
 * or alternates between /images/title and /title without flickering.
 */
export function handleImageFallback(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackUrl?: string
): void {
  const img = e.currentTarget;
  const currentSrc = img.src || "";
  const retryCount = parseInt(img.dataset.retryCount || "0", 10);

  if (retryCount >= 4) {
    if (fallbackUrl && currentSrc !== fallbackUrl) {
      img.src = resolveStoryAssetUrl(fallbackUrl);
    }
    return;
  }

  img.dataset.retryCount = String(retryCount + 1);

  // Fix duplicate path segment e.g. /orpheus/orpheus/ -> /orpheus/
  const duplicateMatch = currentSrc.match(/\/([^/]+)\/\1\//);
  if (duplicateMatch) {
    img.src = currentSrc.replace(`/${duplicateMatch[1]}/${duplicateMatch[1]}/`, `/${duplicateMatch[1]}/`);
    return;
  }

  if (currentSrc.endsWith(".webp")) {
    img.src = currentSrc.replace(/\.webp($|\?)/, ".png$1");
  } else if (currentSrc.endsWith(".png")) {
    img.src = currentSrc.replace(/\.png($|\?)/, ".webp$1");
  } else if (currentSrc.includes("/images/title.")) {
    img.src = currentSrc.replace("/images/title.", "/title.");
  } else if (currentSrc.includes("/title.")) {
    img.src = currentSrc.replace("/title.", "/images/title.");
  } else if (fallbackUrl && currentSrc !== fallbackUrl) {
    img.src = resolveStoryAssetUrl(fallbackUrl);
  }
}


