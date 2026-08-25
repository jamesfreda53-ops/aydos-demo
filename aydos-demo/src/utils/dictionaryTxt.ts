import { WordDefinition } from "../types";

/**
 * Parses an alphabetically ordered dictionary .txt file into a Record<string, WordDefinition>.
 *
 * Supported Format for each entry:
 *
 * WORD [/phonetic/] (part of speech)
 * DEF: Student-friendly definition
 * EX: Student-friendly example sentence
 * SYN: synonym1, synonym2 (optional)
 * FACT: fun fact or note (optional)
 *
 * Or simplified key-value format.
 */
export function parseDictionaryTxt(txt: string): Record<string, WordDefinition> {
  const dictionary: Record<string, WordDefinition> = {};
  if (!txt || typeof txt !== "string") return dictionary;

  // Split into entry blocks by double newlines or lines starting with non-indented word headers
  const lines = txt.split(/\r?\n/);
  let currentWord = "";
  let currentPhonetic = "";
  let currentPartOfSpeech = "";
  let currentDefinition = "";
  let currentExample = "";
  let currentSynonyms: string[] = [];
  let currentFunFact = "";

  const commitCurrent = () => {
    if (currentWord.trim()) {
      const key = currentWord.trim().toLowerCase();
      dictionary[key] = {
        word: currentWord.trim(),
        phonetic: currentPhonetic.trim() || `/${currentWord.trim().toLowerCase()}/`,
        partOfSpeech: currentPartOfSpeech.trim() || "word",
        definition: currentDefinition.trim() || `Definition for ${currentWord.trim()}.`,
        example: currentExample.trim() || `An example sentence using ${currentWord.trim()}.`,
        synonyms: currentSynonyms.length > 0 ? currentSynonyms : undefined,
        funFact: currentFunFact.trim() || undefined,
        source: "local-file",
      };
    }
    currentWord = "";
    currentPhonetic = "";
    currentPartOfSpeech = "";
    currentDefinition = "";
    currentExample = "";
    currentSynonyms = [];
    currentFunFact = "";
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Skip comments and empty lines
    if (!line || line.startsWith("#") || line.startsWith("//") || line.startsWith("===") || line.startsWith("---")) {
      continue;
    }

    if (line.startsWith("DEF:") || line.startsWith("Definition:")) {
      currentDefinition = line.replace(/^(DEF|Definition):\s*/i, "").trim();
    } else if (line.startsWith("EX:") || line.startsWith("Example:")) {
      currentExample = line.replace(/^(EX|Example):\s*/i, "").trim();
    } else if (line.startsWith("SYN:") || line.startsWith("Synonyms:")) {
      const synStr = line.replace(/^(SYN|Synonyms):\s*/i, "").trim();
      currentSynonyms = synStr.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (line.startsWith("FACT:") || line.startsWith("FunFact:") || line.startsWith("Note:")) {
      currentFunFact = line.replace(/^(FACT|FunFact|Note):\s*/i, "").trim();
    } else {
      // Check if this is a header line for a word: e.g. "ADVENTURE [/ədˈven.tʃɚ/] (noun)" or "Adventure: noun - definition"
      // Match pattern: WORD [/phonetic/] (part of speech) or WORD (part of speech) or WORD
      const headerMatch = line.match(/^([A-Za-z0-9'’-]+)(?:\s+\[([^\]]+)\])?(?:\s+\(([^)]+)\))?/);
      if (headerMatch) {
        // If we were already building an entry, commit it
        commitCurrent();

        const rawW = headerMatch[1];
        // Capitalize first letter
        currentWord = rawW.charAt(0).toUpperCase() + rawW.slice(1).toLowerCase();
        currentPhonetic = headerMatch[2] ? `[${headerMatch[2]}]` : "";
        currentPartOfSpeech = headerMatch[3] || "";

        // Check if the rest of line contains definition: e.g. "Word - definition"
        const remaining = line.slice(headerMatch[0].length).trim();
        if (remaining.startsWith("-") || remaining.startsWith(":")) {
          currentDefinition = remaining.replace(/^[-:]\s*/, "").trim();
        }
      }
    }
  }

  // Commit last pending entry
  commitCurrent();

  return dictionary;
}

/**
 * Formats a dictionary Record into an alphabetically sorted, human-readable, easily editable .txt file string.
 */
export function formatDictionaryTxt(
  dictionary: Record<string, WordDefinition>,
  options?: { title?: string }
): string {
  const words = Object.keys(dictionary).sort((a, b) => a.localeCompare(b));

  const lines: string[] = [];
  lines.push("# ====================================================================");
  lines.push(`# STORYREAD SHARED LOCAL DICTIONARY (${words.length} Words)`);
  lines.push("# Alphabetically Ordered • Student-Friendly Definitions & Examples");
  lines.push("#");
  lines.push("# Format:");
  lines.push("# WORD [phonetic] (part of speech)");
  lines.push("# DEF: <student-friendly definition>");
  lines.push("# EX: <student-friendly example sentence>");
  lines.push("# SYN: <optional synonyms comma-separated>");
  lines.push("#");
  lines.push("# Feel free to add, edit, or customize definitions as needed!");
  lines.push("# ====================================================================\n");

  for (const key of words) {
    const entry = dictionary[key];
    const wordDisplay = entry.word || key.charAt(0).toUpperCase() + key.slice(1);
    const phoneticDisplay = entry.phonetic ? ` [${entry.phonetic.replace(/[\[\]\/]/g, "")}]` : "";
    const posDisplay = entry.partOfSpeech ? ` (${entry.partOfSpeech})` : " (word)";

    lines.push(`${wordDisplay.toUpperCase()}${phoneticDisplay}${posDisplay}`);
    lines.push(`DEF: ${entry.definition || `A meaningful word: ${wordDisplay}.`}`);
    lines.push(`EX: ${entry.example || `The student read the word "${wordDisplay}" in the story.`}`);

    if (entry.synonyms && entry.synonyms.length > 0) {
      lines.push(`SYN: ${entry.synonyms.join(", ")}`);
    }
    if (entry.funFact) {
      lines.push(`FACT: ${entry.funFact}`);
    }
    lines.push(""); // Empty line separator between words
  }

  return lines.join("\n");
}

/**
 * Extracts all unique, valid vocabulary words from story text.
 * Filters out numbers, punctuation, short common stop words (a, an, the, in, on, etc. if desired, or keeps them clean).
 */
export function extractWordsFromStory(story: {
  title?: string;
  subtitle?: string;
  summary?: string;
  titleSlide?: { introParagraph?: string };
  slides?: Array<{ paragraph?: string; keyWords?: string[] }>;
}): string[] {
  const textCorpus: string[] = [];

  if (story.title) textCorpus.push(story.title);
  if (story.subtitle) textCorpus.push(story.subtitle);
  if (story.summary) textCorpus.push(story.summary);
  if (story.titleSlide?.introParagraph) textCorpus.push(story.titleSlide.introParagraph);

  if (story.slides) {
    for (const slide of story.slides) {
      if (slide.paragraph) textCorpus.push(slide.paragraph);
      if (slide.keyWords) textCorpus.push(...slide.keyWords);
    }
  }

  const combined = textCorpus.join(" ");

  // Match all words (including hyphenated or apostrophes like "ruby-throated", "o'clock")
  const rawTokens = combined.match(/[a-zA-Z][a-zA-Z'’-]*/g) || [];

  const wordSet = new Set<string>();

  for (const token of rawTokens) {
    // Strip leading/trailing punctuation or quotes
    const clean = token.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, "").trim();
    // Only consider words of at least 2 characters (or "a"/"I" if needed)
    if (clean.length >= 2) {
      wordSet.add(clean.toLowerCase());
    }
  }

  // Return alphabetically sorted list of unique words
  return Array.from(wordSet).sort((a, b) => a.localeCompare(b));
}
