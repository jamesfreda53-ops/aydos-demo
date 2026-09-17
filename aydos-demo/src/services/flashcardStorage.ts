import { SavedWord } from "../types";

const LOCAL_STORAGE_KEY = "storyread_saved_words";

/**
 * Fetch flashcards from the server (/public/flashcards.json via API)
 * with graceful fallback to localStorage and static /flashcards.json
 */
export async function fetchFlashcards(): Promise<SavedWord[]> {
  try {
    const res = await fetch("/api/flashcards", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.flashcards)) {
        // Cache to localStorage for offline resilience
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.flashcards));
        } catch {
          // Ignore quota errors
        }
        return data.flashcards;
      }
    }
  } catch (err) {
    console.warn("[Flashcards] Could not reach /api/flashcards, checking localStorage:", err);
  }

  // Fallback 1: localStorage
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }

  // Fallback 2: Direct static fetch of public/flashcards.json
  try {
    const staticRes = await fetch("/flashcards.json");
    if (staticRes.ok) {
      const list = await staticRes.json();
      if (Array.isArray(list)) {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
        } catch {
          // Ignore
        }
        return list;
      }
    }
  } catch {
    // Ignore static fetch error
  }

  return [];
}

/**
 * Save / sync the entire list of flashcards to /public/flashcards.json on the server
 * and to localStorage.
 */
export async function saveAllFlashcards(cards: SavedWord[]): Promise<boolean> {
  // Always update localStorage immediately for instant UI responsiveness
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cards));
  } catch {
    // Ignore
  }

  try {
    const res = await fetch("/api/flashcards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flashcards: cards }),
    });
    return res.ok;
  } catch (err) {
    console.warn("[Flashcards] Failed to write to /api/flashcards:", err);
    return false;
  }
}

/**
 * Add a single new flashcard entry.
 * Calls /api/flashcards/add which writes directly to /public/flashcards.json
 */
export async function addFlashcardToServer(card: SavedWord): Promise<boolean> {
  try {
    const res = await fetch("/api/flashcards/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ card }),
    });
    return res.ok;
  } catch (err) {
    console.warn("[Flashcards] Failed to append card to /api/flashcards/add:", err);
    return false;
  }
}

/**
 * Remove a flashcard by word from /public/flashcards.json on the server
 */
export async function deleteFlashcardFromServer(word: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/flashcards/${encodeURIComponent(word)}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch (err) {
    console.warn("[Flashcards] Failed to delete card from /api/flashcards:", err);
    return false;
  }
}

/**
 * Export the current flashcards list as a downloadable JSON file
 */
export function exportFlashcardsAsJSON(cards: SavedWord[], filename = "flashcards.json"): void {
  const jsonStr = JSON.stringify(cards, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse and validate an imported JSON file of flashcards
 */
export async function parseImportedFlashcards(file: File): Promise<SavedWord[]> {
  const text = await file.text();
  const data = JSON.parse(text);

  if (!Array.isArray(data)) {
    throw new Error("Invalid file format: JSON must be an array of flashcards.");
  }

  const validCards: SavedWord[] = [];
  for (const item of data) {
    if (item && typeof item === "object" && typeof item.word === "string" && item.word.trim()) {
      validCards.push({
        word: String(item.word).trim(),
        phonetic: item.phonetic ? String(item.phonetic) : `/${String(item.word).toLowerCase().trim()}/`,
        partOfSpeech: item.partOfSpeech ? String(item.partOfSpeech) : "noun",
        definition: item.definition ? String(item.definition) : "",
        example: item.example ? String(item.example) : "",
        savedAt: typeof item.savedAt === "number" ? item.savedAt : Date.now(),
        storyTitle: item.storyTitle ? String(item.storyTitle) : "Imported Flashcard",
        slideNumber: typeof item.slideNumber === "number" ? item.slideNumber : 0,
        synonyms: Array.isArray(item.synonyms) ? item.synonyms.map(String) : undefined,
        funFact: item.funFact ? String(item.funFact) : undefined,
        fsrsCard: item.fsrsCard && typeof item.fsrsCard === "object" ? item.fsrsCard : undefined,
      });
    }
  }

  if (validCards.length === 0) {
    throw new Error("No valid flashcards found in the selected file.");
  }

  return validCards;
}
