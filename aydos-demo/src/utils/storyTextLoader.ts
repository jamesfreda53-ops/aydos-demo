import { Story, Slide } from "../types";
import { parseTagsString } from "./storiesTxt";
import {
  chapterImage,
  chapterAudio,
  chapterTitleImage,
  seriesTitleImage,
  storyImage,
  storyAudio,
  resolveChapterImage,
  resolveChapterAudio,
  resolveStoryImage,
  resolveStoryAudio,
  resolveStoryAssetUrl,
  resolveSeriesCoverImage,
  resolveChapterCoverImage,
  resolveStoryCoverImage,
  GITHUB_RAW_BASE_URL,
} from "./storyAssets";

export interface ParsedStoryText {
  metadata: Record<string, string>;
  titleIntro?: string;
  summary?: string;
  slides: {
    slideNumber: number;
    paragraph: string;
    caption?: string;
  }[];
}

/**
 * Parses raw text containing triggers like [1], [2], [3] into structured slide paragraphs.
 * Also supports [0], [Title], [Intro], [Summary], and optional top metadata headers.
 *
 * Example format:
 *   [Title]
 *   Introductory note or tagline for the title slide...
 *
 *   [1]
 *   Slide 1 paragraph goes here...
 *
 *   [2]
 *   Slide 2 paragraph goes here...
 */
export function parseStoryTxt(rawText: string): ParsedStoryText {
  const result: ParsedStoryText = {
    metadata: {},
    slides: [],
  };

  if (!rawText || !rawText.trim()) {
    return result;
  }

  // Normalize line breaks
  const normalized = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Check for top metadata headers (e.g. "Title: ...", "Author: ...") before first trigger
  const firstTriggerMatch = normalized.search(/\[\s*(?:\d+|slide\s*\d+|title|intro|cover|summary|synopsis)[^\]]*\]/i);
  let headerSection = "";
  let bodySection = normalized;

  if (firstTriggerMatch > 0) {
    headerSection = normalized.slice(0, firstTriggerMatch);
    bodySection = normalized.slice(firstTriggerMatch);
  } else if (firstTriggerMatch === -1) {
    // No trigger brackets found at all - check if it's numbered like "1." or "Slide 1:"
    const numberedMatches = normalized.search(/(?:^|\n)(?:slide\s*\d+|\d+\.)\s+/i);
    if (numberedMatches >= 0) {
      bodySection = normalized;
    } else {
      // Single continuous paragraph
      result.slides.push({
        slideNumber: 1,
        paragraph: normalized.trim(),
      });
      return result;
    }
  }

  // Parse header section if any key-value lines exist
  if (headerSection) {
    const lines = headerSection.split("\n");
    for (const line of lines) {
      const kv = line.match(/^([a-zA-Z\s_-]+):\s*(.+)$/);
      if (kv) {
        const key = kv[1].trim().toLowerCase();
        const value = kv[2].trim();
        result.metadata[key] = value;
      }
    }
  }

  // Regex to split by triggers like [1], [2], [Slide 1], [Title], [Intro], [Summary], etc.
  const triggerRegex = /\[\s*(title|intro|cover|summary|synopsis|slide\s*\d+|\d+)(?:\s*[:\-]\s*([^\]]*))?\s*\]/gi;
  
  const sections: { trigger: string; extra?: string; content: string }[] = [];
  let lastIndex = 0;
  let lastTrigger = "";
  let lastExtra: string | undefined = undefined;

  let match: RegExpExecArray | null;
  while ((match = triggerRegex.exec(bodySection)) !== null) {
    if (lastTrigger) {
      const chunk = bodySection.slice(lastIndex, match.index).trim();
      sections.push({ trigger: lastTrigger, extra: lastExtra, content: chunk });
    }
    lastTrigger = match[1].toLowerCase().trim();
    lastExtra = match[2]?.trim();
    lastIndex = match.index + match[0].length;
  }

  // Add the final section after the last trigger
  if (lastTrigger) {
    const chunk = bodySection.slice(lastIndex).trim();
    sections.push({ trigger: lastTrigger, extra: lastExtra, content: chunk });
  }

  // Process sections into slides or metadata
  const slideMap = new Map<number, { paragraph: string; caption?: string }>();

  for (const sec of sections) {
    const trigger = sec.trigger;
    const content = sec.content.trim();

    if (trigger === "title" || trigger === "intro" || trigger === "cover" || trigger === "0") {
      result.titleIntro = content;
    } else if (trigger === "summary" || trigger === "synopsis") {
      result.summary = content;
    } else {
      // Slide number trigger e.g. "1", "slide 1", "2", etc.
      const numMatch = trigger.match(/\d+/);
      if (numMatch) {
        const slideNum = parseInt(numMatch[0], 10);
        slideMap.set(slideNum, {
          paragraph: content,
          caption: sec.extra || undefined,
        });
      }
    }
  }

  // If standard triggers didn't yield slides, fallback to split by numbered sections
  if (slideMap.size === 0) {
    const splitByNumbered = bodySection.split(/(?:^|\n)(?:slide\s*(\d+)|\((\d+)\)|(\d+)\.)\s*/i);
    // Even/odd chunks
    let currentNum = 1;
    for (let i = 1; i < splitByNumbered.length; i += 4) {
      const num = parseInt(splitByNumbered[i] || splitByNumbered[i+1] || splitByNumbered[i+2] || String(currentNum), 10);
      const text = (splitByNumbered[i+3] || "").trim();
      if (text) {
        slideMap.set(num, { paragraph: text });
      }
      currentNum++;
    }
  }

  // Sort slides sequentially by slide number
  const sortedSlideNumbers = Array.from(slideMap.keys()).sort((a, b) => a - b);
  for (const num of sortedSlideNumbers) {
    const item = slideMap.get(num)!;
    result.slides.push({
      slideNumber: num,
      paragraph: item.paragraph,
      caption: item.caption,
    });
  }

  return result;
}

// In-memory cache for fetched story text files
const storyTextCache = new Map<string, string>();

/**
 * Attempts to fetch chapter_name.txt, story_name.txt, or story.txt from GitHub repository (and local fallbacks).
 */
export async function fetchStoryText(
  seriesFolder?: string,
  chapterFolder?: string,
  storyId?: string,
  extraNames?: string[]
): Promise<string | null> {
  const candidateUrls: string[] = [];

  const addFolderTxts = (folderPath: string, nameHints: (string | undefined)[]) => {
    for (const hint of nameHints) {
      if (!hint) continue;
      const clean = hint.trim();
      const snake = clean.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      const kebab = clean.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

      if (snake) {
        candidateUrls.push(`${GITHUB_RAW_BASE_URL}/${folderPath}/${snake}.txt`);
        candidateUrls.push(`/stories/${folderPath}/${snake}.txt`);
      }
      if (kebab && kebab !== snake) {
        candidateUrls.push(`${GITHUB_RAW_BASE_URL}/${folderPath}/${kebab}.txt`);
        candidateUrls.push(`/stories/${folderPath}/${kebab}.txt`);
      }
      if (clean && clean !== snake && clean !== kebab) {
        candidateUrls.push(`${GITHUB_RAW_BASE_URL}/${folderPath}/${clean}.txt`);
        candidateUrls.push(`/stories/${folderPath}/${clean}.txt`);
      }
    }
    candidateUrls.push(`${GITHUB_RAW_BASE_URL}/${folderPath}/story.txt`);
    candidateUrls.push(`${GITHUB_RAW_BASE_URL}/${folderPath}/text.txt`);
    candidateUrls.push(`/stories/${folderPath}/story.txt`);
    candidateUrls.push(`/stories/${folderPath}/text.txt`);
  };

  if (seriesFolder && chapterFolder) {
    const chapterPath = `${seriesFolder}/${chapterFolder}`;
    addFolderTxts(chapterPath, [
      chapterFolder,
      chapterFolder.replace(/_/g, " "),
      chapterFolder.replace(/-/g, " "),
      ...(extraNames || []),
    ]);
  }

  if (seriesFolder) {
    addFolderTxts(seriesFolder, [chapterFolder, seriesFolder, ...(extraNames || [])]);
  }

  if (chapterFolder && chapterFolder !== seriesFolder) {
    addFolderTxts(chapterFolder, [chapterFolder, ...(extraNames || [])]);
  }

  if (storyId) {
    addFolderTxts(storyId, [storyId, ...(extraNames || [])]);
    candidateUrls.push(`${GITHUB_RAW_BASE_URL}/${storyId}.txt`);
    candidateUrls.push(`/stories/${storyId}.txt`);
  }

  for (const url of candidateUrls) {
    if (storyTextCache.has(url)) {
      return storyTextCache.get(url)!;
    }

    try {
      const res = await fetch(url);
      if (res.ok) {
        const text = await res.text();
        // Ensure it's not Vite returning index.html for 404 in SPA mode
        if (text && !text.trim().startsWith("<!DOCTYPE html") && !text.trim().startsWith("<html")) {
          storyTextCache.set(url, text);
          return text;
        }
      }
    } catch {
      // Ignore network errors and continue to next candidate
    }
  }

  return null;
}

/**
 * Hydrates a Story object by fetching its text file (e.g. lotus_eaters.txt, story.txt) and injecting the paragraphs.
 * If slides were not yet created or have fewer slides than in the txt file, it auto-constructs them.
 */
export async function hydrateStoryWithTextFile(story: Story): Promise<Story> {
  // If story has already been edited by the user or is a custom creation, preserve all user edits!
  if (story.userEdited || story.isCustom || story.id.startsWith("custom-")) {
    return story;
  }

  try {
    const extraNames: string[] = [];
    if (story.chapterTitle) extraNames.push(story.chapterTitle);
    if (story.title) extraNames.push(story.title.replace(/^Chapter\s+[IVXLCDM\d]+[:\s-]+/i, "").trim());

    const hasSeriesAndChapter = Boolean(
      story.seriesFolder && story.chapterFolder && story.seriesFolder !== story.chapterFolder
    );
    const sFolder = story.storyFolder || (hasSeriesAndChapter ? story.seriesFolder : (story.seriesFolder || story.id));
    const cFolder = hasSeriesAndChapter ? story.chapterFolder : undefined;

    const rawText = await fetchStoryText(
      story.seriesFolder || story.storyFolder,
      story.chapterFolder,
      story.storyFolder || story.id,
      extraNames
    );

    if (!rawText) {
      // Even if no txt file found, ensure images and audio are properly resolved
      const updatedSlides: Slide[] = [];
      for (const slide of story.slides) {
        const slideNum = slide.slideNumber;
        const resolvedIll = hasSeriesAndChapter
          ? await resolveChapterImage(story.seriesFolder!, story.chapterFolder!, slideNum)
          : await resolveStoryImage(sFolder, slideNum);
        const resolvedAud = hasSeriesAndChapter
          ? await resolveChapterAudio(story.seriesFolder!, story.chapterFolder!, slideNum)
          : await resolveStoryAudio(sFolder, slideNum);
        updatedSlides.push({
          ...slide,
          illustrationUrl: resolvedIll || slide.illustrationUrl,
          audioUrl: resolvedAud || slide.audioUrl,
        });
      }

      const resolvedCover = hasSeriesAndChapter
        ? await resolveChapterCoverImage(story.seriesFolder!, story.chapterFolder!)
        : await resolveStoryCoverImage(sFolder);

      return {
        ...story,
        slides: updatedSlides,
        coverImage: resolvedCover || resolveStoryAssetUrl(story.coverImage),
        titleSlide: story.titleSlide
          ? {
              ...story.titleSlide,
              illustrationUrl: resolvedCover || resolveStoryAssetUrl(story.titleSlide.illustrationUrl),
            }
          : undefined,
      };
    }

    const parsed = parseStoryTxt(rawText);

    if (parsed.slides.length === 0) {
      return story;
    }

    // Build or update slides array
    const updatedSlides: Slide[] = [];

    // Max count between existing slides and parsed slides from story.txt
    const totalCount = Math.max(story.slides.length, parsed.slides.length);

    for (let i = 0; i < totalCount; i++) {
      const slideNum = i + 1;
      const parsedSlide = parsed.slides.find((s) => s.slideNumber === slideNum) || parsed.slides[i];
      const existingSlide = story.slides[i];

      // If existing slide has text, prioritize it; otherwise use text from parsed txt file
      const paragraphText = (existingSlide?.paragraph && existingSlide.paragraph.trim() !== "")
        ? existingSlide.paragraph
        : (parsedSlide?.paragraph || "");

      // Dynamically probe for file existence (.webp/.png and .mp3/.wav)
      const defaultIllustration = hasSeriesAndChapter
        ? await resolveChapterImage(story.seriesFolder!, story.chapterFolder!, slideNum)
        : await resolveStoryImage(sFolder, slideNum);

      const defaultAudio = hasSeriesAndChapter
        ? await resolveChapterAudio(story.seriesFolder!, story.chapterFolder!, slideNum)
        : await resolveStoryAudio(sFolder, slideNum);

      if (existingSlide) {
        updatedSlides.push({
          ...existingSlide,
          slideNumber: slideNum,
          paragraph: paragraphText,
          illustrationCaption: existingSlide.illustrationCaption || parsedSlide?.caption || "",
          illustrationUrl: defaultIllustration || existingSlide.illustrationUrl,
          audioUrl: defaultAudio || existingSlide.audioUrl,
        });
      } else {
        // Auto-generate slide using conventional image and audio paths
        updatedSlides.push({
          id: `${story.id}-slide-${slideNum}`,
          slideNumber: slideNum,
          paragraph: paragraphText,
          illustrationUrl: defaultIllustration,
          illustrationCaption: parsedSlide?.caption || "",
          audioUrl: defaultAudio,
        });
      }
    }

    // Resolve cover image and series cover image with fallback probing
    const resolvedCover = hasSeriesAndChapter
      ? await resolveChapterCoverImage(story.seriesFolder!, story.chapterFolder!)
      : await resolveStoryCoverImage(sFolder);

    const resolvedSeriesCover = hasSeriesAndChapter && story.seriesFolder
      ? await resolveSeriesCoverImage(story.seriesFolder)
      : undefined;

    // Update metadata if specified in story.txt, preserving existing if already set
    const updatedStory: Story = {
      ...story,
      slides: updatedSlides,
      coverImage: resolvedCover || resolveStoryAssetUrl(story.coverImage),
      seriesCoverImage: resolvedSeriesCover || (story.seriesCoverImage ? resolveStoryAssetUrl(story.seriesCoverImage) : undefined),
    };

    if (updatedStory.titleSlide) {
      updatedStory.titleSlide = {
        ...updatedStory.titleSlide,
        illustrationUrl: resolvedCover || resolveStoryAssetUrl(updatedStory.titleSlide.illustrationUrl),
        introParagraph: (parsed.titleIntro && !updatedStory.titleSlide.introParagraph)
          ? parsed.titleIntro
          : updatedStory.titleSlide.introParagraph,
      };
    } else {
      updatedStory.titleSlide = {
        title: updatedStory.title,
        subtitle: updatedStory.subtitle,
        author: updatedStory.author,
        illustrationUrl: resolvedCover,
        illustrationCaption: `${updatedStory.title} - Title Artwork`,
        introParagraph: parsed.titleIntro || updatedStory.summary,
      };
    }

    if (parsed.summary && !updatedStory.summary) {
      updatedStory.summary = parsed.summary;
    }

    if (parsed.metadata.title && !updatedStory.title) {
      updatedStory.title = parsed.metadata.title;
    }

    if (parsed.metadata.subtitle && !updatedStory.subtitle) {
      updatedStory.subtitle = parsed.metadata.subtitle;
    }

    if (parsed.metadata.author && (!updatedStory.author || updatedStory.author === "Unknown")) {
      updatedStory.author = parsed.metadata.author;
    }

    if (parsed.metadata.tags && (!updatedStory.tags || updatedStory.tags.length === 0)) {
      const parsedTags = parseTagsString(parsed.metadata.tags);
      if (parsedTags.length > 0) {
        updatedStory.tags = parsedTags;
      }
    }

    if (parsed.metadata.readinglevel || parsed.metadata.level) {
      const lvl = parsed.metadata.readinglevel || parsed.metadata.level;
      if (lvl.toLowerCase().includes("beg")) updatedStory.readingLevel = "Beginner";
      else if (lvl.toLowerCase().includes("adv")) updatedStory.readingLevel = "Advanced";
      else updatedStory.readingLevel = "Intermediate";
      updatedStory.levelBadge = updatedStory.readingLevel;
    }

    if (parsed.metadata.readingtime || parsed.metadata.estimatedminutes) {
      const min = parseInt((parsed.metadata.readingtime || parsed.metadata.estimatedminutes).replace(/[^0-9]/g, ""), 10);
      if (!isNaN(min) && min > 0) {
        updatedStory.estimatedMinutes = min;
      }
    }

    return updatedStory;
  } catch (err) {
    console.warn(`Could not hydrate text for story ${story.id}:`, err);
    return story;
  }
}

/**
 * Hydrates an array of stories concurrently with their story.txt files.
 */
export async function hydrateAllStories(stories: Story[]): Promise<Story[]> {
  return Promise.all(stories.map((story) => hydrateStoryWithTextFile(story)));
}
