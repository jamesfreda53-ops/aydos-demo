import {
  fsrs,
  createEmptyCard,
  Rating,
  State,
  fixDate,
  Card,
  RecordLog,
  generatorParameters,
} from "ts-fsrs";
import { SavedWord } from "../types";

// Re-export core ts-fsrs types and enums for convenience
export { Rating, State };
export type { Card, RecordLog };

/**
 * Shared FSRS scheduler instance configured with short-term steps enabled
 * and deterministic scheduling for consistent user feedback.
 */
export const fsrsScheduler = fsrs(
  generatorParameters({
    enable_short_term: true,
    enable_fuzz: false,
  })
);

/**
 * Hydrate a Card object, ensuring due and last_review are valid JavaScript Date instances.
 * If raw is missing or invalid, initializes a new Card via ts-fsrs createEmptyCard().
 */
export function hydrateFSRSCard(raw?: any, fallbackDate: Date = new Date()): Card {
  if (!raw || typeof raw !== "object") {
    return createEmptyCard(fallbackDate);
  }

  try {
    const due = raw.due ? fixDate(raw.due) : fallbackDate;
    const last_review = raw.last_review ? fixDate(raw.last_review) : undefined;

    return {
      due,
      stability: typeof raw.stability === "number" ? raw.stability : 0,
      difficulty: typeof raw.difficulty === "number" ? raw.difficulty : 0,
      elapsed_days: typeof raw.elapsed_days === "number" ? raw.elapsed_days : 0,
      scheduled_days: typeof raw.scheduled_days === "number" ? raw.scheduled_days : 0,
      reps: typeof raw.reps === "number" ? raw.reps : 0,
      lapses: typeof raw.lapses === "number" ? raw.lapses : 0,
      learning_steps: typeof raw.learning_steps === "number" ? raw.learning_steps : 0,
      state: typeof raw.state === "number" ? raw.state : State.New,
      last_review,
    };
  } catch (err) {
    console.warn("[FSRS] Error hydrating card, falling back to empty card:", err);
    return createEmptyCard(fallbackDate);
  }
}

/**
 * Retrieve the active FSRS Card from a SavedWord item, automatically
 * creating or hydrating it.
 */
export function getFSRSCard(word: SavedWord): Card {
  const fallbackDate = word.savedAt ? new Date(word.savedAt) : new Date();
  return hydrateFSRSCard(word.fsrsCard, fallbackDate);
}

/**
 * Check whether an FSRS Card is currently due for review.
 * New cards (State.New) or cards with due <= now are considered due.
 */
export function isCardDue(card?: Card, now: Date = new Date()): boolean {
  if (!card) return true;
  const dueTime = card.due instanceof Date ? card.due.getTime() : new Date(card.due).getTime();
  return dueTime <= now.getTime();
}

/**
 * Compute the 4 scheduling outcomes (Again, Hard, Good, Easy) using the ts-fsrs scheduler.
 */
export function getFSRSRepeatOptions(card: Card, now: Date = new Date()): RecordLog {
  const hydrated = hydrateFSRSCard(card, now);
  return fsrsScheduler.repeat(hydrated, now);
}

/**
 * Format a friendly relative interval string for card scheduling previews
 * (e.g. "1m", "6m", "10m", "1d", "3d", "2w", "1mo").
 */
export function formatFSRSInterval(dueDate: Date | string, now: Date = new Date()): string {
  const dueTime = dueDate instanceof Date ? dueDate.getTime() : new Date(dueDate).getTime();
  const diffMs = dueTime - now.getTime();

  if (diffMs <= 0) {
    return "now";
  }

  const seconds = Math.round(diffMs / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (minutes < 1) {
    return "< 1m";
  }
  if (minutes < 60) {
    return `${minutes}m`;
  }
  if (hours < 24) {
    return `${hours}h`;
  }
  if (days < 14) {
    return `${days}d`;
  }
  if (days < 60) {
    const weeks = Math.round(days / 7);
    return `${weeks}w`;
  }
  if (days < 365) {
    const months = Math.round(days / 30);
    return `${months}mo`;
  }
  const years = (days / 365).toFixed(1);
  return `${years}y`;
}

/**
 * Execute an FSRS review rating on a SavedWord using ts-fsrs and return the updated SavedWord.
 */
export function applyFSRSRating(
  word: SavedWord,
  rating: Rating,
  now: Date = new Date()
): {
  updatedWord: SavedWord;
  nextCard: Card;
  scheduledDue: Date;
  intervalText: string;
} {
  const currentCard = getFSRSCard(word);
  const record = fsrsScheduler.repeat(currentCard, now);
  const nextItem = record[rating];
  const nextCard = nextItem.card;

  const intervalText = formatFSRSInterval(nextCard.due, now);

  const updatedWord: SavedWord = {
    ...word,
    fsrsCard: nextCard,
  };

  return {
    updatedWord,
    nextCard,
    scheduledDue: nextCard.due,
    intervalText,
  };
}

/**
 * Human-readable name for an FSRS card state.
 */
export function getStateName(state: State | number): string {
  switch (state) {
    case State.New:
      return "New";
    case State.Learning:
      return "Learning";
    case State.Review:
      return "Review";
    case State.Relearning:
      return "Relearning";
    default:
      return "New";
  }
}

/**
 * Styling classes for badge representations of FSRS card states.
 */
export function getStateBadgeClass(state: State | number, isDue = false): string {
  if (isDue) {
    return "bg-amber-500/20 text-amber-300 border-amber-400/30";
  }
  switch (state) {
    case State.New:
      return "bg-blue-500/20 text-blue-300 border-blue-400/30";
    case State.Learning:
      return "bg-purple-500/20 text-purple-300 border-purple-400/30";
    case State.Review:
      return "bg-emerald-500/20 text-emerald-300 border-emerald-400/30";
    case State.Relearning:
      return "bg-rose-500/20 text-rose-300 border-rose-400/30";
    default:
      return "bg-white/10 text-blue-200 border-white/15";
  }
}

export interface DeckStatistics {
  dueCount: number;
  newCount: number;
  learningCount: number;
  reviewCount: number;
  totalCount: number;
}

/**
 * Calculate deck summary statistics for the user's flashcard collection.
 */
export function getDeckStatistics(words: SavedWord[], now: Date = new Date()): DeckStatistics {
  let dueCount = 0;
  let newCount = 0;
  let learningCount = 0;
  let reviewCount = 0;

  for (const word of words) {
    const card = getFSRSCard(word);
    const due = isCardDue(card, now);

    if (due) {
      dueCount++;
    }

    if (card.state === State.New) {
      newCount++;
    } else if (card.state === State.Learning || card.state === State.Relearning) {
      learningCount++;
    } else if (card.state === State.Review) {
      reviewCount++;
    }
  }

  return {
    dueCount,
    newCount,
    learningCount,
    reviewCount,
    totalCount: words.length,
  };
}
