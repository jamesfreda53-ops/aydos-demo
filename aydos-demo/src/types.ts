export interface Slide {
  id: string;
  slideNumber: number;
  paragraph: string;
  illustrationUrl: string;
  illustrationCaption: string;
  keyWords?: string[];
  audioUrl?: string; // Optional pre-recorded audio file path or Web Speech synthesis fallback
  audioDurationSec?: number;
}

export type QuizQuestionType = 'multiple_choice' | 'true_false' | 'open_response';

export interface QuizQuestion {
  id: string;
  type?: QuizQuestionType; // defaults to 'multiple_choice' for backward compatibility
  question: string;
  options?: string[]; // for multiple_choice (3 or 4 options)
  correctIndex?: number; // for multiple_choice (0, 1, 2, 3)
  correctBoolean?: boolean; // for true_false (true or false)
  sampleAnswer?: string; // for open_response ideal response / rubric key points
  explanation: string;
}

export interface StudentQuizSubmission {
  questionId: string;
  type: QuizQuestionType;
  selectedOptionIndex?: number;
  selectedBoolean?: boolean;
  writtenResponse?: string;
  isCorrect?: boolean;
}

export interface TitleSlide {
  title: string;
  subtitle?: string;
  author?: string;
  illustrationUrl: string; // The square "title" image (album cover)
  illustrationCaption?: string;
  introParagraph?: string; // Optional introductory text
}

export interface Story {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  coverImage: string; // Title image preview (square album cover)
  titleSlide?: TitleSlide;
  readingLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  levelBadge: string;
  estimatedMinutes: number;
  genre: string;
  themeColor: string; // Tailwind color class or hex
  accentColor: string;
  summary: string;
  slides: Slide[]; // 7-10 slides each
  quizQuestions: QuizQuestion[];
  userEdited?: boolean;
  isCustom?: boolean;

  // Optional Series Designation
  storyFolder?: string; // Directory name for standalone stories in /public/stories/<storyFolder> (e.g. "orpheus")
  seriesId?: string; // Grouping identifier for the series (e.g. "the-odyssey" or "odyssey")
  seriesFolder?: string; // Directory name of the series in /public/stories/<seriesFolder> (e.g. "odyssey")
  seriesTitle?: string; // Display name of the parent series (e.g. "The Odyssey")
  chapterNumber?: number | string; // e.g. 2 or "Chapter II"
  chapterTitle?: string; // e.g. "The Lotus-Eaters"
  chapterFolder?: string; // Directory name of the chapter in /public/stories/<seriesFolder>/<chapterFolder> (e.g. "lotus_eaters")
  seriesDescription?: string; // Series overview / synopsis
  seriesCoverImage?: string; // Main album/series cover artwork
  seriesOrder?: number; // Sorting order within series (1, 2, 3...)
  tags?: string[]; // Search tags (e.g. ["greek", "mythology", "adventure"])
}

export interface WordDefinition {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  example: string;
  synonyms?: string[];
  funFact?: string;
  source?: string;
}

export interface SavedWord extends WordDefinition {
  savedAt: number;
  storyTitle: string;
  slideNumber: number;
}

export type ReaderTheme = 'day' | 'sepia' | 'warm' | 'night';
export type FontSizeOption = 'sm' | 'base' | 'lg' | 'xl' | '2xl';
export type FontFamilyOption = 'lexend' | 'literata' | 'fredoka' | 'sans';

export interface ReaderSettings {
  theme: ReaderTheme;
  fontSize: FontSizeOption;
  fontFamily: FontFamilyOption;
  narrationSpeed: number; // 0.75, 1.0, 1.25, 1.5, 2.0
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
  highlightSpokenWords: boolean;
  autoAdvanceOnComplete: boolean;
  voiceGender: 'female' | 'male' | 'default';
  showPhoneFrameOnDesktop: boolean;
  vocabHelperEnabled?: boolean;
}
