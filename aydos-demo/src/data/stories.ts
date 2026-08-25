import { Story, QuizQuestion } from "../types";
import {
  GITHUB_RAW_BASE_URL,
  chapterImage,
  chapterAudio,
  seriesTitleImage,
  chapterTitleImage,
  storyImage,
  storyAudio,
} from "../utils/storyAssets";

export interface DefineChapterOptions {
  id?: string;
  title: string;
  subtitle?: string;
  author?: string;
  readingLevel?: "Beginner" | "Intermediate" | "Advanced";
  estimatedMinutes?: number;
  genre?: string;
  themeColor?: string;
  accentColor?: string;
  seriesId?: string;
  seriesFolder: string;
  seriesTitle?: string;
  chapterNumber?: number | string;
  chapterTitle?: string;
  chapterFolder: string;
  seriesOrder?: number;
  seriesDescription?: string;
  summary?: string;
  slideCount?: number;
  tags?: string[];
  quizQuestions?: QuizQuestion[];
}

export interface DefineStoryOptions {
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  readingLevel?: "Beginner" | "Intermediate" | "Advanced";
  estimatedMinutes?: number;
  genre?: string;
  themeColor?: string;
  accentColor?: string;
  storyFolder: string;
  summary?: string;
  slideCount?: number;
  tags?: string[];
  quizQuestions?: QuizQuestion[];
}

/**
 * Helper to define a series chapter where assets & text are hosted on GitHub.
 * The slide text will be dynamically fetched from GitHub:
 *   <GITHUB_RAW_BASE>/<seriesFolder>/<chapterFolder>/<chapterFolder>.txt
 */
export function defineChapter(opts: DefineChapterOptions): Story {
  const slideCount = opts.slideCount ?? 7;
  const sFolder = opts.seriesFolder;
  const cFolder = opts.chapterFolder;
  const storyId = opts.id || `${sFolder}-${cFolder}`;

  return {
    id: storyId,
    title: opts.title,
    subtitle: opts.subtitle || "",
    author: opts.author || "Homer",
    readingLevel: opts.readingLevel || "Intermediate",
    levelBadge: opts.readingLevel || "Intermediate",
    estimatedMinutes: opts.estimatedMinutes || 5,
    genre: opts.genre || "Adventure",
    themeColor: opts.themeColor || "from-amber-600 to-orange-800",
    accentColor: opts.accentColor || "#d97706",
    coverImage: chapterTitleImage(sFolder, cFolder),
    seriesId: opts.seriesId || "the-odyssey",
    seriesFolder: sFolder,
    seriesTitle: opts.seriesTitle || "The Odyssey",
    chapterNumber: opts.chapterNumber || "Chapter I",
    chapterTitle:
      opts.chapterTitle || opts.title.replace(/^Chapter\s+[IVXLCDM\d]+[:\s-]+/i, "").trim(),
    chapterFolder: cFolder,
    seriesOrder: opts.seriesOrder ?? 1,
    seriesDescription:
      opts.seriesDescription ||
      "Homer's epic saga chronicling Odysseus's perilous ten-year voyage back to Ithaca",
    seriesCoverImage: seriesTitleImage(sFolder),
    tags: opts.tags,
    summary:
      opts.summary ||
      "An epic chapter in the mythological voyage of Odysseus.",
    titleSlide: {
      title: opts.title,
      subtitle: opts.subtitle || "",
      author: opts.author || "Homer",
      illustrationUrl: chapterTitleImage(sFolder, cFolder),
      illustrationCaption: "",
      introParagraph: "",
    },
    // Auto-construct slides 1..N pointing to GitHub assets (1.webp, 1.mp3, etc.)
    // Paragraph text is loaded and hydrated automatically from GitHub!
    slides: Array.from({ length: slideCount }, (_, idx) => {
      const slideNum = idx + 1;
      return {
        id: `${storyId}-slide-${slideNum}`,
        slideNumber: slideNum,
        paragraph: "", // Hydrated from GitHub <chapterFolder>.txt
        illustrationUrl: chapterImage(sFolder, cFolder, `${slideNum}.webp`),
        illustrationCaption: "",
        audioUrl: chapterAudio(sFolder, cFolder, slideNum),
      };
    }),
    quizQuestions: opts.quizQuestions || [
      {
        id: `${storyId}-q1`,
        type: "multiple_choice",
        question: "What was the main conflict faced by the characters in this chapter?",
        options: [
          "Overcoming the dangers and trials that threatened their journey",
          "Finding enough food for the winter",
          "Building a new ship from scratch",
          "Navigating without a compass",
        ],
        correctIndex: 0,
        explanation: "Odysseus had to use his wits and strength to guide his crew past perilous trials.",
      },
      {
        id: `${storyId}-q2`,
        type: "true_false",
        question: "Odysseus was determined to return home to Ithaca.",
        correctBoolean: true,
        explanation: "Despite numerous trials, Odysseus's ultimate goal was returning home to Ithaca.",
      },
    ],
  };
}

/**
 * Helper to define a standalone story where assets & text are hosted on GitHub.
 */
export function defineStandaloneStory(opts: DefineStoryOptions): Story {
  const slideCount = opts.slideCount ?? 7;
  const folder = opts.storyFolder;
  const storyId = opts.id || folder;

  return {
    id: storyId,
    title: opts.title,
    subtitle: opts.subtitle || "",
    author: opts.author || "Unknown",
    readingLevel: opts.readingLevel || "Intermediate",
    levelBadge: opts.readingLevel || "Intermediate",
    estimatedMinutes: opts.estimatedMinutes || 5,
    genre: opts.genre || "Mythology & Drama",
    themeColor: opts.themeColor || "from-purple-900 to-indigo-950",
    accentColor: opts.accentColor || "#8b5cf6",
    coverImage: `${GITHUB_RAW_BASE_URL}/${folder}/images/title.png`,
    storyFolder: folder,
    seriesFolder: undefined,
    tags: opts.tags,
    summary:
      opts.summary ||
      "A timeless mythological tale told with rich narrative, audio narration, and illustrations.",
    titleSlide: {
      title: opts.title,
      subtitle: opts.subtitle || "",
      author: opts.author || "Unknown",
      illustrationUrl: `${GITHUB_RAW_BASE_URL}/${folder}/images/title.png`,
      illustrationCaption: "",
      introParagraph: "",
    },
    slides: Array.from({ length: slideCount }, (_, idx) => {
      const slideNum = idx + 1;
      return {
        id: `${storyId}-slide-${slideNum}`,
        slideNumber: slideNum,
        paragraph: "", // Hydrated from GitHub <storyFolder>.txt
        illustrationUrl: `${GITHUB_RAW_BASE_URL}/${folder}/images/${slideNum}.png`,
        illustrationCaption: "",
        audioUrl: `${GITHUB_RAW_BASE_URL}/${folder}/audio/${slideNum}.wav`,
      };
    }),
    quizQuestions: opts.quizQuestions || [
      {
        id: `${storyId}-q1`,
        type: "multiple_choice",
        question: "What gift or power did Orpheus possess that moved everyone who heard him?",
        options: [
          "His enchanting singing and lyre playing",
          "Superhuman strength in battle",
          "The ability to see the future",
          "Command over storms at sea",
        ],
        correctIndex: 0,
        explanation: "Orpheus was renowned as the greatest musician and singer, whose melodies could move mortals and gods alike.",
      },
      {
        id: `${storyId}-q2`,
        type: "true_false",
        question: "Orpheus was given one crucial condition when leading his love from the underworld.",
        correctBoolean: true,
        explanation: "He was instructed never to look back until they both emerged into the sunlight.",
      },
    ],
  };
}

// ==========================================
// REGISTERED STORIES & CHAPTERS (GitHub Hosted)
// ==========================================
export const STORIES: Story[] = [
  defineChapter({
    id: "odyssey-troy",
    title: "Chapter I - The Fall of Troy",
    subtitle: "Clever Odysseus, the Trojan Horse, and the start of a perilous journey",
    author: "Homer",
    readingLevel: "Intermediate",
    estimatedMinutes: 5,
    genre: "Epic & Adventure",
    seriesId: "the-odyssey",
    seriesFolder: "odyssey",
    seriesTitle: "The Odyssey",
    chapterNumber: "Chapter I",
    chapterTitle: "The Fall of Troy",
    chapterFolder: "troy",
    seriesOrder: 1,
    seriesDescription:
      "Homer's epic saga chronicling Odysseus's perilous ten-year voyage back to Ithaca",
    summary:
      "The ten-year siege of Troy concludes through the cunning trickery of Odysseus and the wooden horse, setting his ships upon the fateful Aegean Sea.",
    tags: ["odyssey", "homer", "greek", "mythology", "troy", "trojan-horse", "epic", "ancient-greece", "adventure", "hero", "ithaca"],
    slideCount: 7,
  }),
  defineChapter({
    id: "odyssey-lotus-eaters",
    title: "Chapter II - The Lotus-Eaters",
    subtitle: "A tale of temptation, memory, and the pull of home",
    author: "Homer",
    readingLevel: "Intermediate",
    estimatedMinutes: 4,
    genre: "Epic & Adventure",
    seriesId: "the-odyssey",
    seriesFolder: "odyssey",
    seriesTitle: "The Odyssey",
    chapterNumber: "Chapter II",
    chapterTitle: "The Lotus-Eaters",
    chapterFolder: "lotus_eaters",
    seriesOrder: 2,
    seriesDescription:
      "Homer's epic saga chronicling Odysseus's perilous ten-year voyage back to Ithaca",
    summary:
      "After a fierce storm blows his ships off course, Odysseus and his crew land among a peaceful people whose strange fruit makes sailors forget home entirely.",
    tags: ["odyssey", "homer", "greek", "mythology", "lotus-eaters", "lotus", "adventure", "epic", "voyage", "island", "memory"],
    slideCount: 7,
  }),
  defineStandaloneStory({
    id: "orpheus",
    title: "Orpheus",
    subtitle: "A modern noir retelling of love, music, and the descent into shadow",
    author: "Mythological Adaptation",
    readingLevel: "Intermediate",
    estimatedMinutes: 6,
    genre: "Noir & Mythology",
    themeColor: "from-slate-900 via-purple-950 to-neutral-900",
    accentColor: "#a855f7",
    storyFolder: "orpheus",
    summary:
      "A haunting story of a gifted musician who ventures into the underworld realm of Herr Hölle to bring back the woman he loves, bound by a single condition.",
    tags: ["orpheus", "eurydice", "mythology", "noir", "music", "lyre", "underworld", "shadow", "love", "greek-myth", "drama"],
    slideCount: 7,
  }),
];

