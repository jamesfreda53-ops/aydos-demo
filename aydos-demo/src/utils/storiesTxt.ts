import { Story, Slide, QuizQuestion } from "../types";
import {
  chapterImage,
  chapterAudio,
  seriesTitleImage,
  chapterTitleImage,
  storyImage,
  storyAudio,
  slugify,
  resolveStoryAssetUrl,
  GITHUB_RAW_BASE_URL,
} from "./storyAssets";

/**
 * Extracts tags from a tag line like "Tags: [mythology] [greek] [hero] [odyssey]"
 * or comma-separated tags like "Tags: mythology, greek, hero".
 */
export function parseTagsString(raw: string): string[] {
  if (!raw || !raw.trim()) return [];
  const bracketMatches = raw.match(/\[([^\]]+)\]/g);
  if (bracketMatches && bracketMatches.length > 0) {
    return bracketMatches
      .map((m) => m.slice(1, -1).trim())
      .filter((t) => t.length > 0);
  }
  // Fallback: comma or semicolon separated
  return raw
    .split(/[,;]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

/**
 * Formats an array of tags into individual brackets: "[tag1] [tag2] [tag3]".
 */
export function formatTagsString(tags?: string[]): string {
  if (!tags || tags.length === 0) return "";
  return tags
    .map((t) => t.trim().replace(/[\[\]]/g, ""))
    .filter((t) => t.length > 0)
    .map((t) => `[${t}]`)
    .join(" ");
}

/**
 * Parses raw text from /public/stories.txt into Story objects.
 */
export function parseStoriesTxt(rawText: string): Story[] {
  if (!rawText || !rawText.trim()) return [];

  const normalized = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const entries: Story[] = [];

  // Split entries by headers like [Story: ...] or [Chapter: ...] or blocks starting with [Story
  const blockRegex = /\[\s*(?:story|chapter)(?:\s*:\s*([^\]]+))?\s*\]/gi;
  const matches: { idHint?: string; start: number; headerLength: number }[] = [];

  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(normalized)) !== null) {
    matches.push({
      idHint: match[1]?.trim(),
      start: match.index,
      headerLength: match[0].length,
    });
  }

  // If no [Story: ...] block headers found, try splitting by divider lines "===..."
  if (matches.length === 0) {
    const dividerRegex = /(?:^|\n)={3,}(?:\n|$)/g;
    let divMatch: RegExpExecArray | null;
    while ((divMatch = dividerRegex.exec(normalized)) !== null) {
      matches.push({
        idHint: undefined,
        start: divMatch.index,
        headerLength: divMatch[0].length,
      });
    }
  }

  const rawBlocks: { idHint?: string; content: string }[] = [];
  if (matches.length > 0) {
    for (let i = 0; i < matches.length; i++) {
      const cur = matches[i];
      const nextStart = i + 1 < matches.length ? matches[i + 1].start : normalized.length;
      const content = normalized.slice(cur.start + cur.headerLength, nextStart).trim();
      if (content) {
        rawBlocks.push({ idHint: cur.idHint, content });
      }
    }
  } else {
    // Single block fallback
    rawBlocks.push({ content: normalized.trim() });
  }

  for (const block of rawBlocks) {
    const lines = block.content.split("\n");
    const meta: Record<string, string> = {};
    let summaryLines: string[] = [];
    let isReadingSummary = false;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;

      const kv = line.match(/^([a-zA-Z\s_-]+):\s*(.*)$/);
      if (kv && !isReadingSummary) {
        const key = kv[1].trim().toLowerCase().replace(/[\s_-]+/g, "");
        const value = kv[2].trim();
        if (key === "summary" || key === "description" || key === "synopsis") {
          meta[key] = value;
          if (!value) {
            isReadingSummary = true;
          }
        } else {
          meta[key] = value;
        }
      } else if (isReadingSummary) {
        if (line.match(/^[a-zA-Z\s_-]+:/)) {
          isReadingSummary = false;
          const kv2 = line.match(/^([a-zA-Z\s_-]+):\s*(.*)$/)!;
          const key2 = kv2[1].trim().toLowerCase().replace(/[\s_-]+/g, "");
          meta[key2] = kv2[2].trim();
        } else {
          summaryLines.push(line);
        }
      }
    }

    const title = meta["title"] || block.idHint || "Untitled Story";
    const subtitle = meta["subtitle"] || meta["tagline"] || "";
    const author = meta["author"] || "Unknown";
    const genre = meta["genre"] || "Adventure";
    const levelRaw = meta["readinglevel"] || meta["level"] || "Intermediate";
    const readingLevel: "Beginner" | "Intermediate" | "Advanced" =
      levelRaw.toLowerCase().includes("beg")
        ? "Beginner"
        : levelRaw.toLowerCase().includes("adv")
        ? "Advanced"
        : "Intermediate";

    const minutesRaw = meta["readingtime"] || meta["estimatedminutes"] || meta["time"] || "5";
    const estimatedMinutes = parseInt(minutesRaw.replace(/[^0-9]/g, ""), 10) || 5;

    const seriesTitle = meta["seriestitle"] || meta["series"];
    const seriesAuthor = meta["seriesauthor"];
    const seriesId = meta["seriesid"] || (seriesTitle ? slugify(seriesTitle) : undefined);
    const seriesFolder = meta["seriesfolder"] || (seriesTitle ? slugify(seriesTitle) : undefined);
    const chapterNumber = meta["chapternumber"] || meta["chapter"];
    const chapterTitle = meta["chaptertitle"] || (seriesTitle ? title.replace(/^Chapter\s+[IVXLCDM\d]+[:\s-]+/i, "").trim() : undefined);
    const chapterFolder = meta["chapterfolder"] || (chapterTitle ? slugify(chapterTitle) : undefined);
    const storyFolder = meta["storyfolder"] || (!chapterFolder && !seriesTitle ? (seriesFolder || slugify(title)) : slugify(title));
    const seriesOrderRaw = meta["seriesorder"] || meta["order"] || (chapterNumber ? chapterNumber.replace(/[^0-9]/g, "") : "1");
    const seriesOrder = parseInt(String(seriesOrderRaw), 10) || 1;
    const seriesDescription = meta["seriesdescription"];
    const seriesCoverImage = meta["seriescoverimage"];
    const coverImage = meta["coverimage"];
    const themeColor = meta["themecolor"] || "from-amber-600 to-orange-800";
    const accentColor = meta["accentcolor"] || "#d97706";
    const summary = summaryLines.length > 0 ? summaryLines.join(" ") : meta["summary"] || subtitle || "";

    const tags = parseTagsString(meta["tags"] || "");

    // A story is only part of a series if it has an explicit seriesTitle, or both seriesFolder and chapterFolder
    const isSeries = Boolean(
      (seriesTitle && seriesTitle.trim() !== "") ||
      (seriesFolder && chapterFolder) ||
      (chapterNumber && seriesFolder && chapterFolder)
    );
    const sFolder = isSeries ? (seriesFolder || "series") : (meta["storyfolder"] || meta["seriesfolder"] || storyFolder || slugify(title));
    const cFolder = isSeries ? (chapterFolder || slugify(title)) : undefined;

    const storyId =
      block.idHint ||
      meta["id"] ||
      (isSeries && cFolder ? `${sFolder}-${cFolder}` : sFolder) ||
      slugify(title);

    const slideCount = parseInt(meta["slidecount"] || "7", 10) || 7;

    const defaultCover = isSeries && cFolder
      ? chapterTitleImage(sFolder, cFolder, "title.webp")
      : `${GITHUB_RAW_BASE_URL}/${sFolder}/images/title.png`;

    const resolvedCover = coverImage
      ? resolveStoryAssetUrl(coverImage)
      : defaultCover;

    const resolvedSeriesCover = isSeries
      ? (seriesCoverImage ? resolveStoryAssetUrl(seriesCoverImage) : seriesTitleImage(sFolder, "title.webp"))
      : undefined;

    const entry: Story = {
      id: storyId,
      title,
      subtitle,
      author,
      genre,
      readingLevel,
      levelBadge: readingLevel,
      estimatedMinutes,
      coverImage: resolvedCover,
      summary,
      themeColor,
      accentColor,
      tags: tags.length > 0 ? tags : undefined,
      storyFolder: !isSeries ? sFolder : undefined,
      seriesId: isSeries ? seriesId : undefined,
      seriesTitle: isSeries ? seriesTitle : undefined,
      seriesAuthor: isSeries ? (seriesAuthor || undefined) : undefined,
      seriesFolder: isSeries ? sFolder : undefined,
      chapterNumber: isSeries ? (chapterNumber || `Chapter ${seriesOrder}`) : undefined,
      chapterTitle: isSeries ? chapterTitle : undefined,
      chapterFolder: isSeries ? cFolder : undefined,
      seriesOrder: isSeries ? seriesOrder : undefined,
      seriesDescription: isSeries ? seriesDescription : undefined,
      seriesCoverImage: resolvedSeriesCover,
      titleSlide: {
        title,
        subtitle,
        author,
        illustrationUrl: resolvedCover,
        illustrationCaption: `${title} - Title Artwork`,
        introParagraph: summary,
      },
      slides: Array.from({ length: slideCount }, (_, idx) => {
        const slideNum = idx + 1;
        return {
          id: `${storyId}-slide-${slideNum}`,
          slideNumber: slideNum,
          paragraph: "",
          illustrationUrl: isSeries && cFolder
            ? chapterImage(sFolder, cFolder, `${slideNum}.webp`)
            : `${GITHUB_RAW_BASE_URL}/${sFolder}/images/${slideNum}.png`,
          illustrationCaption: `Slide ${slideNum}`,
          audioUrl: isSeries && cFolder
            ? chapterAudio(sFolder, cFolder, slideNum)
            : `${GITHUB_RAW_BASE_URL}/${sFolder}/audio/${slideNum}.wav`,
        };
      }),
      quizQuestions: [
        {
          id: `${storyId}-q1`,
          type: "multiple_choice",
          question: `What was the central event or adventure in "${title}"?`,
          options: [
            "The characters navigated challenging trials and worked together",
            "They stayed quietly at home without traveling",
            "They built a stone fortress on a distant mountain",
            "They fell asleep under a tree",
          ],
          correctIndex: 0,
          explanation: `The narrative centers on character courage, discovery, and navigation through obstacles.`,
        },
      ],
    };

    entries.push(entry);
  }

  return entries;
}

/**
 * Formats an array of stories into the standardized /public/stories.txt file content.
 */
export function formatStoriesTxt(stories: Story[]): string {
  const lines: string[] = [
    "# ==============================================================================",
    "# AYDOS STORIES & SERIES CATALOG MANIFEST",
    "# Editable metadata file for all stories, series, chapters, reading levels, and search tags.",
    "# Search tags are formatted as [tag1] [tag2] [tag3] (hidden in UI, indexed in search).",
    "# ==============================================================================",
    "",
  ];

  for (const s of stories) {
    const isChapter = Boolean(s.seriesTitle || s.seriesFolder || s.chapterFolder);
    lines.push(`[${isChapter ? "Chapter" : "Story"}: ${s.id}]`);
    lines.push(`Title: ${s.title}`);
    if (s.subtitle) lines.push(`Subtitle: ${s.subtitle}`);
    lines.push(`Author: ${s.author || "Unknown"}`);
    lines.push(`Genre: ${s.genre || "Adventure"}`);
    lines.push(`ReadingLevel: ${s.readingLevel || "Intermediate"}`);
    lines.push(`ReadingTime: ${s.estimatedMinutes || 5} min`);

    if (s.seriesTitle) lines.push(`SeriesTitle: ${s.seriesTitle}`);
    if (s.seriesAuthor) lines.push(`SeriesAuthor: ${s.seriesAuthor}`);
    if (s.seriesId) lines.push(`SeriesId: ${s.seriesId}`);
    if (s.seriesFolder) lines.push(`SeriesFolder: ${s.seriesFolder}`);
    if (s.chapterNumber) lines.push(`ChapterNumber: ${s.chapterNumber}`);
    if (s.chapterTitle) lines.push(`ChapterTitle: ${s.chapterTitle}`);
    if (s.chapterFolder) lines.push(`ChapterFolder: ${s.chapterFolder}`);
    if (s.seriesOrder !== undefined) lines.push(`SeriesOrder: ${s.seriesOrder}`);
    if (s.seriesDescription) lines.push(`SeriesDescription: ${s.seriesDescription}`);
    if (s.seriesCoverImage) lines.push(`SeriesCoverImage: ${s.seriesCoverImage}`);

    if (s.storyFolder && !s.chapterFolder) lines.push(`StoryFolder: ${s.storyFolder}`);
    if (s.coverImage) lines.push(`CoverImage: ${s.coverImage}`);
    if (s.themeColor) lines.push(`ThemeColor: ${s.themeColor}`);
    if (s.accentColor) lines.push(`AccentColor: ${s.accentColor}`);
    if (s.slides?.length) lines.push(`SlideCount: ${s.slides.length}`);

    if (s.summary) {
      lines.push(`Summary: ${s.summary}`);
    }

    if (s.tags && s.tags.length > 0) {
      lines.push(`Tags: ${formatTagsString(s.tags)}`);
    }

    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Fetches the raw stories.txt manifest from the server (which syncs with GitHub & disk).
 */
export async function fetchStoriesFile(forceRemoteSync = false): Promise<{ txt: string; stories: Story[] } | null> {
  try {
    const query = forceRemoteSync ? `?sync=true&_t=${Date.now()}` : "";
    const res = await fetch(`/api/stories/file${query}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && typeof data.txt === "string") {
        const stories = parseStoriesTxt(data.txt);
        return { txt: data.txt, stories };
      }
    }
  } catch (err) {
    console.warn("Could not fetch /api/stories/file:", err);
  }

  // Fallback to static /stories.txt
  try {
    const staticRes = await fetch(`/stories.txt`);
    if (staticRes.ok) {
      const txt = await staticRes.text();
      if (txt && !txt.startsWith("<!DOCTYPE")) {
        const stories = parseStoriesTxt(txt);
        return { txt, stories };
      }
    }
  } catch (err) {
    console.warn("Could not fetch static /stories.txt:", err);
  }

  return null;
}

/**
 * Writes the full stories.txt manifest back to server & GitHub.
 */
export async function saveStoriesFile(
  txt: string,
  commitMessage = "Update stories.txt"
): Promise<boolean> {
  try {
    const res = await fetch("/api/stories/file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txt, message: commitMessage }),
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to save stories.txt:", err);
    return false;
  }
}

/**
 * Merges ONE story into the manifest and writes back via server & GitHub in a single request.
 */
export async function saveStoryToServer(story: Story): Promise<boolean> {
  try {
    const res = await fetch("/api/stories/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ story, message: `Update story: ${story.title || story.id}` }),
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to save story:", err);
    return false;
  }
}

/**
 * Merges MULTIPLE stories into the manifest in one single request.
 */
export async function saveMultipleStoriesToServer(stories: Story[]): Promise<boolean> {
  if (!stories || stories.length === 0) return true;
  try {
    const label = stories.length === 1 ? stories[0].title : `${stories.length} stories`;
    const res = await fetch("/api/stories/save-multiple", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stories, message: `Update: ${label}` }),
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to save multiple stories:", err);
    return false;
  }
}

/**
 * Deletes a story by ID from the manifest on server & GitHub.
 */
export async function deleteStoryFromServer(storyId: string): Promise<boolean> {
  try {
    const res = await fetch("/api/stories/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyId, message: `Delete story: ${storyId}` }),
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to delete story:", err);
    return false;
  }
}

