import { WordDefinition } from "../types";

export const KNOWN_STORY_PHRASES: string[] = [
  "Grüner Veltliner",
  "Herr Hölle",
  "Schönlanterngasse",
  "Schônlanterngasse",
];

/**
 * Tokenizes a story text block (paragraph, title intro) into words, punctuation,
 * and known compound phrases (e.g. "Grüner Veltliner", "Herr Hölle").
 */
export function tokenizeStoryText(
  text: string,
  customPhrases?: string[]
): Array<{
  id: string;
  text: string;
  cleanWord: string;
  isWord: boolean;
  startIndex: number;
  endIndex: number;
}> {
  if (!text) return [];

  // Combine and sort phrases by length descending so longer phrases match first
  const phraseSet = new Set<string>();
  for (const p of KNOWN_STORY_PHRASES) {
    if (p && p.includes(" ")) phraseSet.add(p.trim());
  }
  if (customPhrases) {
    for (const p of customPhrases) {
      if (p && p.includes(" ")) phraseSet.add(p.trim());
    }
  }

  const phrases = Array.from(phraseSet).sort((a, b) => b.length - a.length);
  const tokens: Array<{
    id: string;
    text: string;
    cleanWord: string;
    isWord: boolean;
    startIndex: number;
    endIndex: number;
  }> = [];

  // If no multi-word phrases exist, use single-pass word/non-word regex
  if (phrases.length === 0) {
    const wordRegex = /([a-zA-Z\u00C0-\u024F0-9'’-]+)|([^a-zA-Z\u00C0-\u024F0-9'’-]+)/g;
    let m: RegExpExecArray | null;
    while ((m = wordRegex.exec(text)) !== null) {
      const matchedText = m[0];
      const startIndex = m.index;
      const endIndex = startIndex + matchedText.length;
      const isWord = /^[a-zA-Z\u00C0-\u024F0-9'’-]+$/.test(matchedText);
      tokens.push({
        id: `${startIndex}-${matchedText}`,
        text: matchedText,
        cleanWord: isWord ? matchedText.replace(/['’]/g, "") : "",
        isWord,
        startIndex,
        endIndex,
      });
    }
    return tokens;
  }

  // Build a regex that matches any of the multi-word phrases (allowing flexible whitespace and optional possessives)
  const escapedPhrases = phrases.map((p) => {
    const parts = p.split(/\s+/).map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    return parts.join("\\s+") + "(?:['’]s)?";
  });

  const phrasePattern = new RegExp(`\\b(?:${escapedPhrases.join("|")})\\b`, "gi");

  let lastIndex = 0;
  let phraseMatch: RegExpExecArray | null;

  while ((phraseMatch = phrasePattern.exec(text)) !== null) {
    const matchStart = phraseMatch.index;
    const matchedPhrase = phraseMatch[0];
    const matchEnd = matchStart + matchedPhrase.length;

    // Tokenize everything between lastIndex and matchStart
    if (matchStart > lastIndex) {
      const sub = text.substring(lastIndex, matchStart);
      const wordRegex = /([a-zA-Z\u00C0-\u024F0-9'’-]+)|([^a-zA-Z\u00C0-\u024F0-9'’-]+)/g;
      let m: RegExpExecArray | null;
      while ((m = wordRegex.exec(sub)) !== null) {
        const matchedText = m[0];
        const startIndex = lastIndex + m.index;
        const endIndex = startIndex + matchedText.length;
        const isWord = /^[a-zA-Z\u00C0-\u024F0-9'’-]+$/.test(matchedText);
        tokens.push({
          id: `${startIndex}-${matchedText}`,
          text: matchedText,
          cleanWord: isWord ? matchedText.replace(/['’]/g, "") : "",
          isWord,
          startIndex,
          endIndex,
        });
      }
    }

    // Clean phrase for lookup (remove trailing possessive like 's or ’s)
    const cleanPhrase = matchedPhrase.replace(/['’]s$/i, "").trim();

    // Push the phrase as a single whole-word token
    tokens.push({
      id: `${matchStart}-${matchedPhrase}`,
      text: matchedPhrase,
      cleanWord: cleanPhrase,
      isWord: true,
      startIndex: matchStart,
      endIndex: matchEnd,
    });

    lastIndex = matchEnd;
  }

  // Tokenize remaining trailing segment
  if (lastIndex < text.length) {
    const sub = text.substring(lastIndex);
    const wordRegex = /([a-zA-Z\u00C0-\u024F0-9'’-]+)|([^a-zA-Z\u00C0-\u024F0-9'’-]+)/g;
    let m: RegExpExecArray | null;
    while ((m = wordRegex.exec(sub)) !== null) {
      const matchedText = m[0];
      const startIndex = lastIndex + m.index;
      const endIndex = startIndex + matchedText.length;
      const isWord = /^[a-zA-Z\u00C0-\u024F0-9'’-]+$/.test(matchedText);
      tokens.push({
        id: `${startIndex}-${matchedText}`,
        text: matchedText,
        cleanWord: isWord ? matchedText.replace(/['’]/g, "") : "",
        isWord,
        startIndex,
        endIndex,
      });
    }
  }

  return tokens;
}

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
      // Check if this is a header line for a word: e.g. "ADVENTURE [/ədˈven.tʃɚ/] (noun)" or "GRÜNER VELTLINER [ˌɡryːnɐ vɛltˈliːnɐ] (noun)"
      // Match pattern: WORD [/phonetic/] (part of speech) or WORD (part of speech) or WORD
      const headerMatch = line.match(/^([A-Za-z\u00C0-\u024F0-9'’ -]+?)(?:\s+\[([^\]]+)\])?(?:\s+\(([^)]+)\))?(?:\s*[-:]\s*(.*))?$/);
      if (headerMatch) {
        // If we were already building an entry, commit it
        commitCurrent();

        const rawW = headerMatch[1].trim();
        // Capitalize each word in the entry title
        currentWord = rawW
          .split(/\s+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
        currentPhonetic = headerMatch[2] ? `[${headerMatch[2]}]` : "";
        currentPartOfSpeech = headerMatch[3] || "";

        // Check if inline definition was supplied
        if (headerMatch[4]) {
          currentDefinition = headerMatch[4].trim();
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
 * Filters out numbers, punctuation, and short single-character tokens.
 */
export function extractWordsFromStory(story: {
  title?: string;
  subtitle?: string;
  summary?: string;
  titleSlide?: { introParagraph?: string };
  slides?: Array<{ paragraph?: string }>;
}): string[] {
  const textCorpus: string[] = [];

  if (story.title) textCorpus.push(story.title);
  if (story.subtitle) textCorpus.push(story.subtitle);
  if (story.summary) textCorpus.push(story.summary);
  if (story.titleSlide?.introParagraph) textCorpus.push(story.titleSlide.introParagraph);

  if (story.slides) {
    for (const slide of story.slides) {
      if (slide.paragraph) textCorpus.push(slide.paragraph);
    }
  }

  const combined = textCorpus.join(" ");

  // Match all words (including unicode/umlauts and hyphenated or apostrophes)
  const rawTokens = combined.match(/[a-zA-Z\u00C0-\u024F][a-zA-Z\u00C0-\u024F'’-]*/g) || [];

  const wordSet = new Set<string>();

  for (const token of rawTokens) {
    // Strip leading/trailing punctuation or quotes
    const clean = token.replace(/^[^a-zA-Z\u00C0-\u024F]+|[^a-zA-Z\u00C0-\u024F]+$/g, "").trim();
    // Keep words of at least 2 characters
    if (clean.length >= 2) {
      wordSet.add(clean.toLowerCase());
    }
  }

  // Match known phrases present in the text corpus
  for (const phrase of KNOWN_STORY_PHRASES) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const phraseRegex = new RegExp(`\\b${escaped}\\b`, "i");
    if (phraseRegex.test(combined)) {
      wordSet.add(phrase.toLowerCase());
    }
  }

  // Return alphabetically sorted list of unique words
  return Array.from(wordSet).sort((a, b) => a.localeCompare(b));
}
