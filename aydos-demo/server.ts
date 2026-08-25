import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Curated definitions for story-specific, classical, and common vocabulary words
const CURATED_LEXICON: Record<string, {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  example: string;
  synonyms?: string[];
  funFact?: string;
}> = {
  odysseus: {
    word: "Odysseus",
    phonetic: "/oʊˈdɪs.i.əs/",
    partOfSpeech: "proper noun",
    definition: "The legendary Greek hero and king of Ithaca, celebrated for his sharp mind and ten-year journey home from Troy.",
    example: "Odysseus used his clever wit to protect his sailing crew from great dangers.",
    synonyms: ["Ulysses", "King of Ithaca", "Greek Hero"],
    funFact: "His adventures form the basis of Homer's ancient epic poem, The Odyssey.",
  },
  odyssey: {
    word: "Odyssey",
    phonetic: "/ˈɑː.də.si/",
    partOfSpeech: "noun / proper noun",
    definition: "A long, eventful, and adventurous journey marked by many changes of fortune.",
    example: "The travelers began their great odyssey across the stormy Mediterranean sea.",
    synonyms: ["epic journey", "voyage", "quest"],
    funFact: "Named after Odysseus, the Greek hero whose ten-year voyage became the world's most famous adventure story.",
  },
  "lotus-eaters": {
    word: "Lotus-Eaters",
    phonetic: "/ˈloʊ.t̬əs ˈiː.tɚz/",
    partOfSpeech: "proper noun (plural)",
    definition: "A gentle island people in Greek mythology who lived in peaceful forgetfulness after eating sweet lotus blossoms.",
    example: "The Lotus-Eaters warmly offered their sweet flowering plants to the visiting Greek sailors.",
    synonyms: ["island dwellers", "dreamers"],
    funFact: "In Greek mythology, anyone who tasted the lotus flower forgot their past and wished only to stay on the island forever.",
  },
  lotus: {
    word: "Lotus",
    phonetic: "/ˈloʊ.t̬əs/",
    partOfSpeech: "noun",
    definition: "A sacred water lily with fragrant blossoms, known in Greek myth for its calming and enchanting effect.",
    example: "The sweet taste of the lotus made the weary crew forget all thoughts of sailing home.",
    synonyms: ["water lily", "enchanted blossom"],
  },
  "lotus-flower": {
    word: "Lotus-Flower",
    phonetic: "/ˈloʊ.t̬əs ˈflaʊ.ɚ/",
    partOfSpeech: "noun",
    definition: "The sweet, honeyed blossom of the lotus plant that brings deep peace and forgetfulness to those who eat it.",
    example: "The sailors partook of the sweet lotus-flower and lost all desire to return to Greece.",
    synonyms: ["honeyed blossom", "enchanted plant"],
  },
  cicones: {
    word: "Cicones",
    phonetic: "/sɪˈkoʊ.niːz/",
    partOfSpeech: "proper noun (plural)",
    definition: "A warlike coastal tribe of ancient Thrace who defended their city of Ismarus against Greek raiders.",
    example: "The fierce Cicones fought bravely on horseback across the coastal meadows.",
    synonyms: ["Thracian warriors"],
  },
  ismarus: {
    word: "Ismarus",
    phonetic: "/ɪzˈmɑː.rəs/",
    partOfSpeech: "proper noun",
    definition: "An ancient coastal port city in Thrace, known in Homer's Odyssey as the homeland of the Cicones.",
    example: "The fleet landed on the shores of Ismarus after sailing away from the ruins of Troy.",
    synonyms: ["ancient port", "coastal city"],
  },
  penelope: {
    word: "Penelope",
    phonetic: "/pəˈnel.ə.pi/",
    partOfSpeech: "proper noun",
    definition: "The clever, loyal queen of Ithaca and wife of Odysseus, who waited twenty years for his safe return.",
    example: "Penelope cleverly outsmarted the suitors while keeping hope alive for her husband's homecoming.",
    synonyms: ["Queen of Ithaca"],
  },
  ithaca: {
    word: "Ithaca",
    phonetic: "/ˈɪθ.ə.kə/",
    partOfSpeech: "proper noun",
    definition: "A rocky, picturesque Greek island in the Ionian Sea and the cherished home kingdom of Odysseus.",
    example: "All through the long voyage, Odysseus longed only to return to the sunlit hills of Ithaca.",
    synonyms: ["island kingdom", "homeland"],
  },
  greece: {
    word: "Greece",
    phonetic: "/ɡriːs/",
    partOfSpeech: "proper noun",
    definition: "A historic country in southeastern Europe known as the birthplace of democracy, philosophy, and classical mythology.",
    example: "The brave voyagers dreamed of returning safely to their families in Greece.",
    synonyms: ["Hellas"],
  },
  greek: {
    word: "Greek",
    phonetic: "/ɡriːk/",
    partOfSpeech: "adjective / noun",
    definition: "Relating to the language, culture, heroes, or land of ancient or modern Greece.",
    example: "The Greek ships sailed swiftly over the cresting blue waves.",
    synonyms: ["Hellenic"],
  },
  greeks: {
    word: "Greeks",
    phonetic: "/ɡriːks/",
    partOfSpeech: "noun (plural)",
    definition: "The people of Greece or members of the legendary ancient Greek fleet.",
    example: "The weary Greeks were eager to rest upon the welcoming sands.",
    synonyms: ["Hellenes", "Achaeans"],
  },
  eldoria: {
    word: "Eldoria",
    phonetic: "/elˈdɔːr.i.ə/",
    partOfSpeech: "proper noun",
    definition: "A magical realm celebrated in fairy tales for ancient whispering oaks and hidden lore.",
    example: "The old leather map pointed straight toward the misty border of Eldoria.",
    synonyms: ["enchanted kingdom", "fairytale realm"],
  },
  milo: {
    word: "Milo",
    phonetic: "/ˈmaɪ.loʊ/",
    partOfSpeech: "proper noun",
    definition: "A curious young stargazer and explorer who loves uncovering the secrets of the night sky.",
    example: "Milo adjusted the brass telescope and gazed up at the rings of Saturn.",
  },
  luna: {
    word: "Luna",
    phonetic: "/ˈluː.nə/",
    partOfSpeech: "proper noun",
    definition: "The Roman goddess of the moon, or a poetic name representing the moon.",
    example: "Luna gently held the little wounded bird in her caring hands.",
  },
  able: {
    word: "Able",
    phonetic: "/ˈeɪ.bəl/",
    partOfSpeech: "adjective",
    definition: "Having the power, skill, means, or opportunity to do something successfully.",
    example: "With careful teamwork, the crew was able to steer the ship away from the rocky reef.",
    synonyms: ["capable", "skilled", "competent"],
  },
  again: {
    word: "Again",
    phonetic: "/əˈɡen/",
    partOfSpeech: "adverb",
    definition: "Another time; once more or back to an earlier position.",
    example: "The morning sun rose again over the calm blue waters.",
    synonyms: ["once more", "repeatedly", "anew"],
  },
  ah: {
    word: "Ah",
    phonetic: "/ɑː/",
    partOfSpeech: "interjection",
    definition: "An exclamation expressing relief, pleasure, surprise, realization, or sympathy.",
    example: "\"Ah, at last we have reached safe shores!\" exclaimed the weary captain.",
    synonyms: ["aha", "oh"],
  },
  alleyways: {
    word: "Alleyways",
    phonetic: "/ˈæl.i.weɪz/",
    partOfSpeech: "noun (plural)",
    definition: "Narrow passageways, lanes, or paths between buildings or walls.",
    example: "Lanterns glowed softly along the winding cobblestone alleyways of the port town.",
    synonyms: ["passageways", "lanes", "alleys"],
  },
  am: {
    word: "Am",
    phonetic: "/æm/",
    partOfSpeech: "verb",
    definition: "The first-person present tense form of the verb 'be' (used with 'I').",
    example: "\"I am ready for whatever adventure lies ahead,\" declared the brave explorer.",
    synonyms: ["exist", "live"],
  },
  are: {
    word: "Are",
    phonetic: "/ɑːr/",
    partOfSpeech: "verb",
    definition: "The present tense plural and second-person singular form of the verb 'be'.",
    example: "The stars are shining brightly to guide our nighttime voyage.",
    synonyms: ["exist", "remain"],
  },
  ashtray: {
    word: "Ashtray",
    phonetic: "/ˈæʃ.treɪ/",
    partOfSpeech: "noun",
    definition: "A small dish or container used to collect ashes.",
    example: "A small brass ashtray rested on the corner of the wooden desk in the study.",
    synonyms: ["dish", "receptacle"],
  },
  because: {
    word: "Because",
    phonetic: "/bɪˈkɑːz/",
    partOfSpeech: "conjunction",
    definition: "For the reason that; since or on account of the fact that.",
    example: "They rested under the tall trees because the midday sun had grown very hot.",
    synonyms: ["since", "as", "due to"],
  },
  behind: {
    word: "Behind",
    phonetic: "/bɪˈhaɪnd/",
    partOfSpeech: "preposition / adverb",
    definition: "At the back of or remaining after someone or something moves forward.",
    example: "The golden sun sank quietly behind the purple mountain peaks.",
    synonyms: ["in back of", "following", "rearward"],
  },
  bills: {
    word: "Bills",
    phonetic: "/bɪlz/",
    partOfSpeech: "noun (plural)",
    definition: "Paper currency banknotes, or statements of charges for goods and services.",
    example: "The shopkeeper counted out the crisp paper bills on the wooden counter.",
    synonyms: ["banknotes", "currency", "invoices"],
  },
  breathing: {
    word: "Breathing",
    phonetic: "/ˈbriː.ðɪŋ/",
    partOfSpeech: "verb / noun",
    definition: "The process of taking air into and expelling it from the lungs.",
    example: "Sitting quietly by the river, she took slow, deep breathing exercises to relax.",
    synonyms: ["respiring", "inhaling", "respiration"],
  },
  briefest: {
    word: "Briefest",
    phonetic: "/ˈbriː.fɪst/",
    partOfSpeech: "adjective (superlative)",
    definition: "Lasting for the shortest period of time; the most quick and concise.",
    example: "For the briefest moment, a shooting star streaked across the clear midnight sky.",
    synonyms: ["quickest", "shortest", "most fleeting"],
  },
  bruised: {
    word: "Bruised",
    phonetic: "/bruːzd/",
    partOfSpeech: "adjective / verb",
    definition: "Having discolored skin from an impact, or marked and battered by rough handling.",
    example: "After hiking up the steep rocky cliff, his bruised shins were soothed by cool stream water.",
    synonyms: ["battered", "injured", "discolored"],
  },
  buildings: {
    word: "Buildings",
    phonetic: "/ˈbɪl.dɪŋz/",
    partOfSpeech: "noun (plural)",
    definition: "Permanent structures with walls and a roof, such as houses, temples, and towers.",
    example: "The ancient stone buildings stood proud against the backdrop of the blue sea.",
    synonyms: ["structures", "edifices", "houses"],
  },
  burn: {
    word: "Burn",
    phonetic: "/bɝːn/",
    partOfSpeech: "verb / noun",
    definition: "To be on fire, produce flames or heat, or undergo combustion.",
    example: "A cheerful campfire began to burn brightly as darkness fell over the campsite.",
    synonyms: ["blaze", "ignite", "glow"],
  },
  by: {
    word: "By",
    phonetic: "/baɪ/",
    partOfSpeech: "preposition",
    definition: "Near or beside; through the agency or means of.",
    example: "The peaceful cottage stood quietly by the edge of the whispering stream.",
    synonyms: ["beside", "near", "alongside"],
  },
  caf: {
    word: "Café",
    phonetic: "/kæˈfeɪ/",
    partOfSpeech: "noun",
    definition: "A small, cozy restaurant or coffeehouse serving beverages and light refreshments.",
    example: "Musicians gathered at the sidewalk café to play their acoustic melodies.",
    synonyms: ["coffeehouse", "bistro", "eatery"],
  },
  can: {
    word: "Can",
    phonetic: "/kæn/",
    partOfSpeech: "verb (modal) / noun",
    definition: "To be able to; have the ability or permission to do something.",
    example: "Together, we can solve the riddle written on the ancient scroll.",
    synonyms: ["be able to", "be capable of"],
  },
  catch: {
    word: "Catch",
    phonetic: "/kætʃ/",
    partOfSpeech: "verb",
    definition: "To intercept and hold something moving through the air, or to capture.",
    example: "He reached out his hands quickly to catch the golden apple before it fell.",
    synonyms: ["capture", "seize", "grab"],
  },
  certain: {
    word: "Certain",
    phonetic: "/ˈsɝː.tən/",
    partOfSpeech: "adjective",
    definition: "Completely confident or sure of something without any doubt.",
    example: "The captain was certain that the North Star would guide them safely home.",
    synonyms: ["sure", "confident", "positive"],
  },
  chair: {
    word: "Chair",
    phonetic: "/tʃer/",
    partOfSpeech: "noun",
    definition: "A separate seat for one person, typically having four legs and a back support.",
    example: "Grandfather sat comfortably in his wooden rocking chair by the fireplace.",
    synonyms: ["seat", "armchair", "bench"],
  },
  cigar: {
    word: "Cigar",
    phonetic: "/sɪˈɡɑːr/",
    partOfSpeech: "noun",
    definition: "A roll of cured tobacco leaves wrapped in a tobacco leaf for smoking.",
    example: "The old sea captain kept an antique wooden box on his navigation table.",
    synonyms: ["tobacco roll"],
  },
  cigarette: {
    word: "Cigarette",
    phonetic: "/ˌsɪɡ.əˈret/",
    partOfSpeech: "noun",
    definition: "A thin cylinder of finely cut tobacco wrapped in paper.",
    example: "The detective took notes under the street lamp in the misty evening.",
    synonyms: ["smoke"],
  },
  city: {
    word: "City",
    phonetic: "/ˈsɪt.i/",
    partOfSpeech: "noun",
    definition: "A large, bustling town with many streets, buildings, and inhabitants.",
    example: "From atop the high hill, the glittering lights of the coastal city sparkled below.",
    synonyms: ["metropolis", "town", "municipality"],
  },
  clink: {
    word: "Clink",
    phonetic: "/klɪŋk/",
    partOfSpeech: "noun / verb",
    definition: "A short, sharp, ringing metallic or glass sound, or to make such a sound.",
    example: "The clink of silver coins echoed as the merchant traded with the villagers.",
    synonyms: ["chime", "ting", "jingle"],
  },
  closer: {
    word: "Closer",
    phonetic: "/ˈkloʊ.sɚ/",
    partOfSpeech: "adjective / adverb",
    definition: "Situated at a shorter distance in space or time; more near.",
    example: "They stepped closer to the campfire to warm their cold hands.",
    synonyms: ["nearer", "more proximate"],
  },
  club: {
    word: "Club",
    phonetic: "/klʌb/",
    partOfSpeech: "noun",
    definition: "A heavy wooden stick used as a tool, or an association of people with shared interests.",
    example: "The guardian carried a sturdy polished wooden club to protect the village gates.",
    synonyms: ["staff", "bludgeon", "association"],
  },
  cobblestones: {
    word: "Cobblestones",
    phonetic: "/ˈkɑː.bəl.stoʊnz/",
    partOfSpeech: "noun (plural)",
    definition: "Rounded stones traditionally used for paving historic roads and pathways.",
    example: "The carriage wheels rumbled softly over the ancient mossy cobblestones.",
    synonyms: ["paving stones", "pebbles", "cobbles"],
  },
  coins: {
    word: "Coins",
    phonetic: "/kɔɪnz/",
    partOfSpeech: "noun (plural)",
    definition: "Flat, circular pieces of metal issued by authority as money.",
    example: "The hidden treasure chest was filled with gleaming gold and silver coins.",
    synonyms: ["currency", "money", "tokens"],
  },
  come: {
    word: "Come",
    phonetic: "/kʌm/",
    partOfSpeech: "verb",
    definition: "To move toward or arrive at a place regarded as near or familiar.",
    example: "\"Come with us to explore the hidden valley,\" called the cheerful travelers.",
    synonyms: ["arrive", "approach", "advance"],
  },
  conditions: {
    word: "Conditions",
    phonetic: "/kənˈdɪʃ.ənz/",
    partOfSpeech: "noun (plural)",
    definition: "The state of the environment or circumstances affecting how people live or work.",
    example: "Favorable weather conditions allowed the sailors to make great speed across the bay.",
    synonyms: ["circumstances", "environment", "surroundings"],
  },
};

// Checks whether an entry is a low-quality or legacy placeholder definition
function isServerPlaceholder(entry?: ServerWordDef | null): boolean {
  if (!entry) return true;
  const d = (entry.definition || "").toLowerCase();
  const ex = (entry.example || "").toLowerCase();
  const pos = (entry.partOfSpeech || "").toLowerCase();

  if (d.length < 12) return true;
  if (pos === "vocabulary word" || pos === "story vocabulary" || pos === "word" || !pos) return true;

  if (
    d.includes("an important vocabulary word") ||
    d.includes("a featured vocabulary word") ||
    d.includes("an expressive story word") ||
    d.includes("a meaningful story word") ||
    d.includes("definition for ") ||
    d.includes("loading definition") ||
    d.includes("tap to listen") ||
    d.includes("a meaningful word used to describe") ||
    d.includes("a descriptive word used to express") ||
    d.includes("a meaningful word:")
  ) {
    return true;
  }

  if (
    ex.includes("the student encountered the word") ||
    ex.includes("the explorer used the word") ||
    ex.includes("the reader carefully noticed the word") ||
    ex.includes("the reader noticed the word") ||
    ex.includes("the student read about") ||
    ex.includes("the student read the word") ||
    ex.includes("while exploring the story") ||
    ex.includes("used the word in the story") ||
    ex.includes("appeared in the story")
  ) {
    return true;
  }

  return false;
}

// Smart sentence generator for fallback definitions - NEVER creates "The explorer used the word" templates
function generateSmartExampleSentence(word: string, pos: string, def?: string, context?: string): string {
  const clean = word.trim().replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, "");
  const lower = clean.toLowerCase();

  // 1. If context is provided and contains the word, extract that sentence!
  if (context && typeof context === "string") {
    const sentences = context.split(/(?<=[.!?])\s+/);
    for (const s of sentences) {
      const regex = new RegExp(`\\b${clean}\\b`, "i");
      if (regex.test(s) && s.length >= 15 && s.length <= 160) {
        return s.trim();
      }
    }
  }

  // 2. High-quality natural examples based on part of speech
  const p = (pos || "noun").toLowerCase();
  if (p.includes("verb")) {
    return `They began to ${lower} together as they made their way along the scenic path.`;
  } else if (p.includes("adj")) {
    return `The surrounding landscape looked especially ${lower} in the warm morning light.`;
  } else if (p.includes("adv")) {
    return `She moved ${lower} through the peaceful meadow so as not to disturb the wildlife.`;
  } else if (p.includes("prep")) {
    return `The quiet river flowed gently ${lower} the edge of the ancient forest.`;
  } else if (p.includes("proper")) {
    return `${clean} became known far and wide throughout the historic kingdom.`;
  } else {
    return `A sturdy ${lower} stood proudly near the center of the quiet village.`;
  }
}

// Free Dictionary API fetcher with retry & stemming
async function fetchFromFreeDictionaryAPI(word: string, contextSentence?: string): Promise<{
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  example: string;
  synonyms: string[];
} | null> {
  const clean = word.toLowerCase().trim().replace(/[^a-z-]/g, "");
  if (!clean || clean.length < 2) return null;

  const wordsToTry = [
    clean,
    clean.replace(/s$/, ""),
    clean.replace(/es$/, ""),
    clean.replace(/ed$/, ""),
    clean.replace(/ed$/, "e"),
    clean.replace(/ing$/, ""),
    clean.replace(/ing$/, "e"),
    clean.replace(/ly$/, ""),
    clean.replace(/ies$/, "y"),
  ];

  for (const candidate of wordsToTry) {
    if (!candidate || candidate.length < 2) continue;
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(candidate)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const entry = data[0];
          const capitalized = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

          let phonetic = entry.phonetic || "";
          if (!phonetic && Array.isArray(entry.phonetics)) {
            const withText = entry.phonetics.find((p: any) => p.text);
            if (withText) phonetic = withText.text;
          }
          if (!phonetic) phonetic = `/${clean}/`;

          let partOfSpeech = "noun";
          let definition = "";
          let example = "";
          const synonymsSet = new Set<string>();

          if (Array.isArray(entry.meanings) && entry.meanings.length > 0) {
            // Find the best meaning (prefer standard parts of speech over obscure archaic ones)
            let chosenMeaning = entry.meanings[0];
            for (const m of entry.meanings) {
              const posStr = (m.partOfSpeech || "").toLowerCase();
              if (["noun", "verb", "adjective", "adverb", "preposition"].includes(posStr)) {
                chosenMeaning = m;
                break;
              }
            }

            partOfSpeech = chosenMeaning.partOfSpeech || "noun";

            if (Array.isArray(chosenMeaning.synonyms)) {
              chosenMeaning.synonyms.slice(0, 3).forEach((s: string) => synonymsSet.add(s));
            }

            if (Array.isArray(chosenMeaning.definitions) && chosenMeaning.definitions.length > 0) {
              // Find a clean, non-archaic definition
              for (const d of chosenMeaning.definitions) {
                if (d.definition && !d.definition.toLowerCase().includes("obsolete") && !d.definition.toLowerCase().includes("archaic")) {
                  definition = d.definition;
                  if (d.example) example = d.example;
                  if (Array.isArray(d.synonyms)) {
                    d.synonyms.slice(0, 3).forEach((s: string) => synonymsSet.add(s));
                  }
                  break;
                }
              }
              if (!definition) {
                definition = chosenMeaning.definitions[0].definition || "";
                example = chosenMeaning.definitions[0].example || "";
              }
            }
          }

          if (definition) {
            definition = definition.trim();
            if (!definition.endsWith(".")) definition += ".";
          } else {
            definition = `A word expressing specific actions, qualities, or concepts in the English language.`;
          }

          if (!example || example.includes("used the word") || example.includes("noticed the word") || example.includes("read the word")) {
            example = generateSmartExampleSentence(word, partOfSpeech, definition, contextSentence);
          } else {
            example = example.trim();
            if (!example.endsWith(".")) example += ".";
          }

          return {
            word: capitalized,
            phonetic,
            partOfSpeech,
            definition,
            example,
            synonyms: Array.from(synonymsSet).slice(0, 3),
          };
        }
      }
    } catch {
      // Continue to next candidate stem
    }
  }
  return null;
}

// Batch generation engine that chunks requests for fast, reliable, rate-limit-safe execution
async function batchGenerateWordDefinitions(
  words: string[],
  storyContext?: string
): Promise<Record<string, ServerWordDef>> {
  const results: Record<string, ServerWordDef> = {};
  const ai = getAI();
  const wordsNeedingAI: string[] = [];

  // 1. Resolve any curated lexicon words first
  for (const w of words) {
    const clean = w.trim().replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, "");
    if (!clean || clean.length < 2) continue;
    const lower = clean.toLowerCase();

    if (CURATED_LEXICON[lower]) {
      results[lower] = CURATED_LEXICON[lower];
    } else {
      wordsNeedingAI.push(clean);
    }
  }

  // 2. Chunk AI requests in batches of 15 words
  const CHUNK_SIZE = 15;
  for (let i = 0; i < wordsNeedingAI.length; i += CHUNK_SIZE) {
    const chunk = wordsNeedingAI.slice(i, i + CHUNK_SIZE);

    if (ai) {
      try {
        const prompt = `You are a children's and student's educational dictionary builder.
Define the following ${chunk.length} words for elementary and middle school students: ${JSON.stringify(chunk)}.
${storyContext ? `Story Context: "${storyContext.slice(0, 1200)}"` : ""}

Rules:
1. Provide student-friendly, clear definitions easy for kids to understand.
2. Provide correct part of speech (noun, verb, adjective, adverb, preposition, conjunction, proper noun).
3. Provide approximate phonetic pronunciation (e.g. "/ˈwɪs.pɚ/").
4. Provide an authentic, natural, engaging example sentence for each word showing real usage (DO NOT use placeholder templates).
5. Return a JSON object with an "entries" array containing the defined words.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                entries: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      word: { type: Type.STRING },
                      phonetic: { type: Type.STRING },
                      partOfSpeech: { type: Type.STRING },
                      definition: { type: Type.STRING },
                      example: { type: Type.STRING },
                      synonyms: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      funFact: { type: Type.STRING },
                    },
                    required: ["word", "phonetic", "partOfSpeech", "definition", "example"],
                  },
                },
              },
              required: ["entries"],
            },
          },
        });

        const parsed = JSON.parse(response.text || "{}");
        if (Array.isArray(parsed.entries)) {
          for (const item of parsed.entries) {
            if (item.word && item.definition) {
              const k = item.word.toLowerCase();
              results[k] = {
                word: item.word,
                phonetic: item.phonetic || `/${k}/`,
                partOfSpeech: item.partOfSpeech || "noun",
                definition: item.definition,
                example: item.example || generateSmartExampleSentence(item.word, item.partOfSpeech, item.definition, storyContext),
                synonyms: item.synonyms || [],
                funFact: item.funFact || undefined,
              };
            }
          }
        }
      } catch (aiChunkErr) {
        console.warn(`Gemini chunk batch failed, falling back to lexical resolver:`, aiChunkErr);
      }
    }

    // 3. Fallback for any words in the chunk that didn't get resolved by AI
    for (const w of chunk) {
      const lower = w.toLowerCase();
      if (!results[lower]) {
        // Try Free Dictionary API
        let apiResolved: ServerWordDef | null = null;
        try {
          apiResolved = await fetchFromFreeDictionaryAPI(w, storyContext);
        } catch {
          // Ignore
        }

        if (apiResolved && !isServerPlaceholder(apiResolved)) {
          results[lower] = apiResolved;
        } else {
          // High quality grammatical synthesis
          const capitalized = w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
          let pos = "noun";
          let def = `An object, element, or character present in the narrative.`;

          if (w.endsWith("ly")) {
            pos = "adverb";
            def = `In a ${w.slice(0, -2)} or characteristic manner.`;
          } else if (w.endsWith("ing") || w.endsWith("ed")) {
            pos = "verb";
            def = `To engage in the action or experience of ${lower}.`;
          } else if (w.endsWith("ful") || w.endsWith("ous") || w.endsWith("est") || w.endsWith("able")) {
            pos = "adjective";
            def = `Possessing the special quality or condition of being ${lower}.`;
          }

          const ex = generateSmartExampleSentence(w, pos, def, storyContext);

          results[lower] = {
            word: capitalized,
            phonetic: `/${lower}/`,
            partOfSpeech: pos,
            definition: def,
            example: ex,
            synonyms: [],
          };
        }
      }
    }
  }

  return results;
}

// Function to scan and repair all placeholder definitions in dictionary.txt
async function repairAllPlaceholdersInDictionary(): Promise<{
  repairedCount: number;
  wordsRepaired: string[];
  totalWords: number;
  txt: string;
}> {
  const currentTxt = readDictionaryFile();
  const diskDict = parseTxtOnServer(currentTxt);
  const placeholderKeys = Object.keys(diskDict).filter((k) => isServerPlaceholder(diskDict[k]));

  if (placeholderKeys.length === 0) {
    return {
      repairedCount: 0,
      wordsRepaired: [],
      totalWords: Object.keys(diskDict).length,
      txt: currentTxt,
    };
  }

  console.log(`[Dictionary] Found ${placeholderKeys.length} placeholder entries in dictionary. Repairing with rich definitions...`);

  // Batch generate rich definitions for all placeholder words
  const wordsToRegenerate = placeholderKeys.map((k) => diskDict[k].word || k);
  const regeneratedMap = await batchGenerateWordDefinitions(wordsToRegenerate);

  let actualRepaired = 0;
  const repairedWordsList: string[] = [];

  for (const k of placeholderKeys) {
    if (regeneratedMap[k] && !isServerPlaceholder(regeneratedMap[k])) {
      diskDict[k] = regeneratedMap[k];
      actualRepaired++;
      repairedWordsList.push(diskDict[k].word || k);
    }
  }

  const updatedTxt = formatTxtOnServer(diskDict);
  writeDictionaryFile(updatedTxt);

  console.log(`[Dictionary] Successfully repaired ${actualRepaired} placeholder definitions in dictionary.txt!`);

  return {
    repairedCount: actualRepaired,
    wordsRepaired: repairedWordsList,
    totalWords: Object.keys(diskDict).length,
    txt: updatedTxt,
  };
}

// Helpers to read/write dictionary.txt file on disk
const DICTIONARY_FILE_PATHS = [
  path.join(process.cwd(), "public", "dictionary.txt"),
  path.join(process.cwd(), "src", "data", "dictionary.txt"),
];

function getDictionaryFilePath(): string {
  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  return DICTIONARY_FILE_PATHS[0];
}

function readDictionaryFile(): string {
  for (const fpath of DICTIONARY_FILE_PATHS) {
    if (fs.existsSync(fpath)) {
      return fs.readFileSync(fpath, "utf-8");
    }
  }
  return "";
}

function writeDictionaryFile(content: string) {
  for (const fpath of DICTIONARY_FILE_PATHS) {
    try {
      const dir = path.dirname(fpath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(fpath, content, "utf-8");
    } catch (err) {
      console.warn(`Warning writing to ${fpath}:`, err);
    }
  }
}

// Simple in-memory parser for server-side
interface ServerWordDef {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  example: string;
  synonyms?: string[];
  funFact?: string;
}

function parseTxtOnServer(txt: string): Record<string, ServerWordDef> {
  const dictionary: Record<string, ServerWordDef> = {};
  if (!txt) return dictionary;

  const lines = txt.split(/\r?\n/);
  let currentWord = "";
  let currentPhonetic = "";
  let currentPartOfSpeech = "";
  let currentDefinition = "";
  let currentExample = "";
  let currentSynonyms: string[] = [];
  let currentFunFact = "";

  const commit = () => {
    if (currentWord.trim()) {
      const key = currentWord.trim().toLowerCase();
      dictionary[key] = {
        word: currentWord.trim(),
        phonetic: currentPhonetic.trim() || `/${currentWord.trim().toLowerCase()}/`,
        partOfSpeech: currentPartOfSpeech.trim() || "word",
        definition: currentDefinition.trim() || `Definition for ${currentWord.trim()}.`,
        example: currentExample.trim() || `Example sentence using ${currentWord.trim()}.`,
        synonyms: currentSynonyms.length > 0 ? currentSynonyms : undefined,
        funFact: currentFunFact.trim() || undefined,
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
    } else if (line.startsWith("FACT:") || line.startsWith("FunFact:")) {
      currentFunFact = line.replace(/^(FACT|FunFact):\s*/i, "").trim();
    } else {
      const headerMatch = line.match(/^([A-Za-z0-9'’-]+)(?:\s+\[([^\]]+)\])?(?:\s+\(([^)]+)\))?/);
      if (headerMatch) {
        commit();
        const rawW = headerMatch[1];
        currentWord = rawW.charAt(0).toUpperCase() + rawW.slice(1).toLowerCase();
        currentPhonetic = headerMatch[2] ? `[${headerMatch[2]}]` : "";
        currentPartOfSpeech = headerMatch[3] || "";

        const remaining = line.slice(headerMatch[0].length).trim();
        if (remaining.startsWith("-") || remaining.startsWith(":")) {
          currentDefinition = remaining.replace(/^[-:]\s*/, "").trim();
        }
      }
    }
  }
  commit();
  return dictionary;
}

function formatTxtOnServer(dictionary: Record<string, ServerWordDef>): string {
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
    lines.push("");
  }

  return lines.join("\n");
}

// Helpers to read/write stories.txt manifest on disk
const STORIES_FILE_PATHS = [
  path.join(process.cwd(), "dist", "stories.txt"),
  path.join(process.cwd(), "public", "stories.txt"),
  path.join(process.cwd(), "src", "data", "stories.txt"),
];

function readStoriesFile(): string {
  let newestContent = "";
  let newestMtime = 0;

  for (const fpath of STORIES_FILE_PATHS) {
    if (fs.existsSync(fpath)) {
      try {
        const stat = fs.statSync(fpath);
        if (stat.mtimeMs >= newestMtime && stat.size > 0) {
          newestMtime = stat.mtimeMs;
          newestContent = fs.readFileSync(fpath, "utf-8");
        }
      } catch {
        // continue to next path
      }
    }
  }

  if (newestContent) return newestContent;

  for (const fpath of STORIES_FILE_PATHS) {
    if (fs.existsSync(fpath)) {
      return fs.readFileSync(fpath, "utf-8");
    }
  }
  return "";
}

function writeStoriesFile(content: string) {
  for (const fpath of STORIES_FILE_PATHS) {
    try {
      const dir = path.dirname(fpath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(fpath, content, "utf-8");
    } catch (err) {
      console.warn(`Warning writing to ${fpath}:`, err);
    }
  }
}

interface ServerStoryEntry {
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  genre?: string;
  readingLevel?: string;
  estimatedMinutes?: number;
  seriesTitle?: string;
  seriesId?: string;
  seriesFolder?: string;
  chapterNumber?: string;
  chapterTitle?: string;
  chapterFolder?: string;
  storyFolder?: string;
  seriesOrder?: number;
  seriesDescription?: string;
  seriesCoverImage?: string;
  coverImage?: string;
  themeColor?: string;
  accentColor?: string;
  slideCount?: number;
  summary?: string;
  tags?: string[];
}

function parseTagsOnServer(raw: string): string[] {
  if (!raw || !raw.trim()) return [];
  const bracketMatches = raw.match(/\[([^\]]+)\]/g);
  if (bracketMatches && bracketMatches.length > 0) {
    return bracketMatches
      .map((m) => m.slice(1, -1).trim())
      .filter((t) => t.length > 0);
  }
  return raw
    .split(/[,;]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function formatTagsOnServer(tags?: string[]): string {
  if (!tags || tags.length === 0) return "";
  return tags
    .map((t) => t.trim().replace(/[\[\]]/g, ""))
    .filter((t) => t.length > 0)
    .map((t) => `[${t}]`)
    .join(" ");
}

function parseStoriesOnServer(txt: string): ServerStoryEntry[] {
  if (!txt || !txt.trim()) return [];
  const normalized = txt.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const entries: ServerStoryEntry[] = [];

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

  if (matches.length === 0) {
    return [];
  }

  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const nextStart = i + 1 < matches.length ? matches[i + 1].start : normalized.length;
    const content = normalized.slice(cur.start + cur.headerLength, nextStart).trim();

    const lines = content.split("\n");
    const meta: Record<string, string> = {};
    const summaryLines: string[] = [];
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
          if (!value) isReadingSummary = true;
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

    const title = meta["title"] || cur.idHint || "Untitled Story";
    const storyId = cur.idHint || meta["id"] || title.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const tags = parseTagsOnServer(meta["tags"] || "");

    const orderNum = parseInt(meta["seriesorder"] || meta["order"] || "1", 10);
    const minNum = parseInt((meta["readingtime"] || meta["estimatedminutes"] || "5").replace(/[^0-9]/g, ""), 10);
    const slideNum = parseInt(meta["slidecount"] || "7", 10);

    entries.push({
      id: storyId,
      title,
      subtitle: meta["subtitle"] || meta["tagline"],
      author: meta["author"] || "Unknown",
      genre: meta["genre"] || "Adventure",
      readingLevel: meta["readinglevel"] || meta["level"] || "Intermediate",
      estimatedMinutes: minNum || 5,
      seriesTitle: meta["seriestitle"] || meta["series"],
      seriesId: meta["seriesid"],
      seriesFolder: meta["seriesfolder"],
      chapterNumber: meta["chapternumber"] || meta["chapter"],
      chapterTitle: meta["chaptertitle"],
      chapterFolder: meta["chapterfolder"],
      storyFolder: meta["storyfolder"],
      seriesOrder: !isNaN(orderNum) ? orderNum : 1,
      seriesDescription: meta["seriesdescription"],
      seriesCoverImage: meta["seriescoverimage"],
      coverImage: meta["coverimage"],
      themeColor: meta["themecolor"],
      accentColor: meta["accentcolor"],
      slideCount: !isNaN(slideNum) ? slideNum : 7,
      summary: summaryLines.length > 0 ? summaryLines.join(" ") : meta["summary"],
      tags: tags.length > 0 ? tags : undefined,
    });
  }

  return entries;
}

function formatStoriesOnServer(entries: ServerStoryEntry[]): string {
  const lines: string[] = [
    "# ==============================================================================",
    "# AYDOS STORIES & SERIES CATALOG MANIFEST",
    "# Editable metadata file for all stories, series, chapters, reading levels, and search tags.",
    "# Adding new stories, series, or chapters creates or updates an entry in this file.",
    "# Search tags are formatted as [tag1] [tag2] [tag3] (hidden in UI cards, indexed in search).",
    "# ==============================================================================",
    "",
  ];

  for (const s of entries) {
    const isChapter = Boolean(s.seriesTitle || s.seriesFolder || s.chapterFolder);
    lines.push(`[${isChapter ? "Chapter" : "Story"}: ${s.id}]`);
    lines.push(`Title: ${s.title}`);
    if (s.subtitle) lines.push(`Subtitle: ${s.subtitle}`);
    lines.push(`Author: ${s.author || "Unknown"}`);
    lines.push(`Genre: ${s.genre || "Adventure"}`);
    lines.push(`ReadingLevel: ${s.readingLevel || "Intermediate"}`);
    lines.push(`ReadingTime: ${s.estimatedMinutes || 5} min`);

    if (s.seriesTitle) lines.push(`SeriesTitle: ${s.seriesTitle}`);
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
    if (s.slideCount) lines.push(`SlideCount: ${s.slideCount}`);

    if (s.summary) {
      lines.push(`Summary: ${s.summary}`);
    }

    if (s.tags && s.tags.length > 0) {
      lines.push(`Tags: ${formatTagsOnServer(s.tags)}`);
    }

    lines.push("");
  }

  return lines.join("\n");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));

  // Serve static assets from /public folder (images, audio, dictionary)
  app.use(express.static(path.join(process.cwd(), "public")));

  // Health endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Assets Management: Check files on disk
  app.get("/api/assets/status", (req, res) => {
    try {
      const { seriesFolder, chapterFolder, storyFolder } = req.query;
      let targetSubpath = "";
      if (seriesFolder && chapterFolder) {
        targetSubpath = path.join(String(seriesFolder), String(chapterFolder));
      } else if (seriesFolder) {
        targetSubpath = String(seriesFolder);
      } else if (storyFolder) {
        targetSubpath = String(storyFolder);
      } else {
        targetSubpath = "odyssey/lotus_eaters";
      }

      const publicBase = path.join(process.cwd(), "public", "stories", targetSubpath);
      const imagesDir = path.join(publicBase, "images");
      const audioDir = path.join(publicBase, "audio");

      const images: Array<{ name: string; size: number; url: string }> = [];
      const audio: Array<{ name: string; size: number; url: string }> = [];
      let storyTextInfo: { name: string; size: number; url: string; preview?: string } | null = null;

      // Check for chapter_name.txt, story_name.txt, or text files in chapter root
      const baseName = path.basename(targetSubpath);
      const txtCandidates = [
        `${baseName}.txt`,
        `${baseName.replace(/-/g, "_")}.txt`,
        `${baseName.replace(/_/g, "-")}.txt`,
        "story.txt",
        "text.txt",
      ];
      
      // Also inspect all files in publicBase for any .txt files
      if (fs.existsSync(publicBase)) {
        const dirEntries = fs.readdirSync(publicBase);
        for (const entry of dirEntries) {
          if (entry.endsWith(".txt") && !txtCandidates.includes(entry)) {
            txtCandidates.push(entry);
          }
        }
      }

      for (const txtName of txtCandidates) {
        const fullTxtPath = path.join(publicBase, txtName);
        if (fs.existsSync(fullTxtPath) && fs.statSync(fullTxtPath).isFile()) {
          const stat = fs.statSync(fullTxtPath);
          const rawContent = fs.readFileSync(fullTxtPath, "utf8");
          storyTextInfo = {
            name: txtName,
            size: stat.size,
            url: `/stories/${targetSubpath.replace(/\\/g, "/")}/${txtName}`,
            preview: rawContent.slice(0, 300),
          };
          break;
        }
      }

      if (fs.existsSync(imagesDir)) {
        const imgFiles = fs.readdirSync(imagesDir);
        for (const f of imgFiles) {
          if (f.startsWith(".")) continue;
          const stat = fs.statSync(path.join(imagesDir, f));
          images.push({
            name: f,
            size: stat.size,
            url: `/stories/${targetSubpath.replace(/\\/g, "/")}/images/${f}`,
          });
        }
      }

      if (fs.existsSync(audioDir)) {
        const audFiles = fs.readdirSync(audioDir);
        for (const f of audFiles) {
          if (f.startsWith(".")) continue;
          const stat = fs.statSync(path.join(audioDir, f));
          audio.push({
            name: f,
            size: stat.size,
            url: `/stories/${targetSubpath.replace(/\\/g, "/")}/audio/${f}`,
          });
        }
      }

      res.json({
        success: true,
        targetSubpath,
        imagesCount: images.length,
        audioCount: audio.length,
        storyText: storyTextInfo,
        images,
        audio,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to inspect story assets" });
    }
  });

  // Assets Management: Upload and save files directly into public/stories/...
  app.post("/api/assets/upload", (req, res) => {
    try {
      const { seriesFolder, chapterFolder, storyFolder, assetType = "images", files } = req.body;
      if (!Array.isArray(files) || files.length === 0) {
        res.status(400).json({ error: "No files provided to upload" });
        return;
      }

      let targetSubpath = "";
      if (seriesFolder && chapterFolder) {
        targetSubpath = path.join(String(seriesFolder), String(chapterFolder));
      } else if (seriesFolder) {
        targetSubpath = String(seriesFolder);
      } else if (storyFolder) {
        targetSubpath = String(storyFolder);
      } else {
        targetSubpath = "odyssey/lotus_eaters";
      }

      const publicDir =
        assetType === "root"
          ? path.join(process.cwd(), "public", "stories", targetSubpath)
          : path.join(process.cwd(), "public", "stories", targetSubpath, String(assetType));

      const distDir =
        assetType === "root"
          ? path.join(process.cwd(), "dist", "stories", targetSubpath)
          : path.join(process.cwd(), "dist", "stories", targetSubpath, String(assetType));

      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      try {
        if (!fs.existsSync(distDir)) {
          fs.mkdirSync(distDir, { recursive: true });
        }
      } catch {
        // Dist may not exist in dev mode
      }

      const savedFiles: Array<{ name: string; size: number; url: string }> = [];

      for (const item of files) {
        if (!item.name || !item.data) continue;
        const filename = path.basename(item.name);
        
        // Strip data:image/...;base64, or data:audio/...;base64, if present
        let base64Data = item.data;
        if (base64Data.includes(";base64,")) {
          base64Data = base64Data.split(";base64,")[1];
        }

        const buffer = Buffer.from(base64Data, "base64");
        const filePath = path.join(publicDir, filename);
        fs.writeFileSync(filePath, buffer);

        try {
          if (fs.existsSync(distDir)) {
            fs.writeFileSync(path.join(distDir, filename), buffer);
          }
        } catch {
          // ignore dist sync error
        }

        const url =
          assetType === "root"
            ? `/stories/${targetSubpath.replace(/\\/g, "/")}/${filename}`
            : `/stories/${targetSubpath.replace(/\\/g, "/")}/${assetType}/${filename}`;

        savedFiles.push({
          name: filename,
          size: buffer.length,
          url,
        });
      }

      res.json({
        success: true,
        savedCount: savedFiles.length,
        savedFiles,
      });
    } catch (err: any) {
      console.error("Asset upload error:", err);
      res.status(500).json({ error: err.message || "Failed to upload asset files" });
    }
  });

  // 1. GET /api/dictionary/file - Fetch the raw txt file and current word count
  app.get("/api/dictionary/file", (_req, res) => {
    try {
      const txt = readDictionaryFile();
      const parsed = parseTxtOnServer(txt);
      res.json({
        success: true,
        txt,
        wordsCount: Object.keys(parsed).length,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to read dictionary file" });
    }
  });

  // 2. POST /api/dictionary/file - Save updated dictionary txt file directly
  app.post("/api/dictionary/file", (req, res) => {
    try {
      const { txt } = req.body;
      if (typeof txt !== "string") {
        res.status(400).json({ error: "Missing txt content" });
        return;
      }

      // Parse and re-sort alphabetically to guarantee strict alphabetical ordering
      const parsed = parseTxtOnServer(txt);
      const reorderedTxt = formatTxtOnServer(parsed);

      writeDictionaryFile(reorderedTxt);

      res.json({
        success: true,
        wordsCount: Object.keys(parsed).length,
        txt: reorderedTxt,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to save dictionary file" });
    }
  });

  // 3. POST /api/dictionary/batch-generate - Developer Button API to add/enrich story words
  app.post("/api/dictionary/batch-generate", async (req, res) => {
    const { words, storyContext, force } = req.body;

    if (!Array.isArray(words)) {
      res.status(400).json({ error: "Words array is required" });
      return;
    }

    try {
      // 1. Read existing dictionary file
      const currentTxt = readDictionaryFile();
      const existingDictionary = parseTxtOnServer(currentTxt);

      // 2. Filter words: find words to process
      const wordsToProcess: string[] = [];
      const alreadyExistingWords: string[] = [];

      for (const w of words) {
        if (!w || typeof w !== "string") continue;
        const clean = w.trim().replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, "");
        if (clean.length < 2) continue; // Ignore 1-letter noise

        const lower = clean.toLowerCase();
        const existing = existingDictionary[lower];

        if (force) {
          if (!wordsToProcess.some((nw) => nw.toLowerCase() === lower)) {
            wordsToProcess.push(clean);
          }
        } else {
          if (existing && !isServerPlaceholder(existing)) {
            alreadyExistingWords.push(clean);
          } else if (!wordsToProcess.some((nw) => nw.toLowerCase() === lower)) {
            wordsToProcess.push(clean);
          }
        }
      }

      // If all words already exist with rich definitions and force is false
      if (wordsToProcess.length === 0) {
        res.json({
          success: true,
          addedCount: 0,
          alreadyExistingCount: alreadyExistingWords.length,
          totalCount: Object.keys(existingDictionary).length,
          message: `All ${alreadyExistingWords.length} words already exist in the shared local dictionary with rich definitions.`,
          wordsAdded: [],
          txtContent: currentTxt,
        });
        return;
      }

      console.log(`[Batch Dictionary] Processing ${wordsToProcess.length} words (force=${!!force})...`);

      // 3. Generate student-friendly definitions using our chunked batch engine
      const generatedMap = await batchGenerateWordDefinitions(wordsToProcess, storyContext);
      const newlyGeneratedEntries: ServerWordDef[] = [];

      for (const [lowerKey, entry] of Object.entries(generatedMap)) {
        existingDictionary[lowerKey] = entry;
        newlyGeneratedEntries.push(entry);
      }

      // 4. Sort alphabetically and write to txt file
      const updatedTxt = formatTxtOnServer(existingDictionary);
      writeDictionaryFile(updatedTxt);

      console.log(`[Batch Dictionary] Successfully saved ${newlyGeneratedEntries.length} definitions to dictionary.txt`);

      res.json({
        success: true,
        addedCount: newlyGeneratedEntries.length,
        alreadyExistingCount: alreadyExistingWords.length,
        totalCount: Object.keys(existingDictionary).length,
        wordsAdded: newlyGeneratedEntries.map((e) => e.word),
        entriesAdded: newlyGeneratedEntries,
        txtContent: updatedTxt,
      });
    } catch (err: any) {
      console.error("Batch dictionary error:", err);
      res.status(500).json({ error: err.message || "Failed to generate dictionary words" });
    }
  });

  // 4. POST /api/dictionary/repair-placeholders - 1-Click Upgrade all legacy placeholder entries
  app.post("/api/dictionary/repair-placeholders", async (_req, res) => {
    try {
      const result = await repairAllPlaceholdersInDictionary();
      res.json({
        success: true,
        ...result,
      });
    } catch (err: any) {
      console.error("Repair placeholders error:", err);
      res.status(500).json({ error: err.message || "Failed to repair placeholder definitions" });
    }
  });

  // Single word lookup endpoint
  app.post("/api/dictionary/lookup", async (req, res) => {
    const { word, contextSentence } = req.body;

    if (!word || typeof word !== "string") {
      res.status(400).json({ error: "Word is required" });
      return;
    }

    const cleanWord = word.trim().replace(/[.,!?;:"'()]/g, "");
    const lower = cleanWord.toLowerCase();

    // Check disk dictionary first!
    const currentTxt = readDictionaryFile();
    const diskDict = parseTxtOnServer(currentTxt);
    const existing = diskDict[lower];

    // If already on disk and is a REAL definition (not placeholder), return immediately!
    if (existing && !isServerPlaceholder(existing) && existing.definition.length > 10) {
      res.json({ ...existing, source: "local-file" });
      return;
    }

    // Check curated classical/mythology lexicon
    if (CURATED_LEXICON[lower]) {
      const entry = CURATED_LEXICON[lower];
      diskDict[lower] = entry;
      writeDictionaryFile(formatTxtOnServer(diskDict));
      res.json({ ...entry, source: "curated" });
      return;
    }

    let resolvedEntry: ServerWordDef | null = null;
    let source = "gemini";

    // Try Gemini AI
    const ai = getAI();
    if (ai) {
      try {
        const prompt = `You are a friendly, encouraging children's and student's dictionary assistant.
Provide a clear, student-friendly definition and example sentence for the word: "${cleanWord}".
${contextSentence ? `The word appeared in this context: "${contextSentence}"` : ""}

Respond in JSON format with:
- word: the base or target word (capitalized correctly)
- phonetic: approximate phonetic pronunciation (e.g. "/ˈlɪs.ən/")
- partOfSpeech: part of speech (noun, verb, adjective, adverb, etc.)
- definition: a simple, clear, 1-2 sentence definition easy for elementary / middle school students to understand
- example: a vivid, relatable example sentence showing how to use the word (do NOT use placeholder templates)
- synonyms: array of 2-3 simple synonyms
- funFact: a brief 1-sentence tip, mnemonic, or fun fact about the word (optional)`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                phonetic: { type: Type.STRING },
                partOfSpeech: { type: Type.STRING },
                definition: { type: Type.STRING },
                example: { type: Type.STRING },
                synonyms: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                funFact: { type: Type.STRING },
              },
              required: ["word", "phonetic", "partOfSpeech", "definition", "example"],
            },
          },
        });

        const parsed = JSON.parse(response.text || "{}");
        if (parsed.word && parsed.definition) {
          resolvedEntry = {
            word: parsed.word,
            phonetic: parsed.phonetic || `/${lower}/`,
            partOfSpeech: parsed.partOfSpeech || "noun",
            definition: parsed.definition,
            example: parsed.example || generateSmartExampleSentence(parsed.word, parsed.partOfSpeech, parsed.definition, contextSentence),
            synonyms: parsed.synonyms || [],
            funFact: parsed.funFact || undefined,
          };
          source = "gemini";
        }
      } catch (err) {
        console.warn("Gemini lookup failed, falling back to Free Dictionary API:", err);
      }
    }

    // Try Free Dictionary API if Gemini didn't resolve
    if (!resolvedEntry) {
      try {
        const apiRes = await fetchFromFreeDictionaryAPI(cleanWord, contextSentence);
        if (apiRes && !isServerPlaceholder(apiRes)) {
          resolvedEntry = apiRes;
          source = "dictionary-api";
        }
      } catch (apiErr) {
        console.warn("Free Dictionary API failed:", apiErr);
      }
    }

    // High quality synthesis fallback if both failed (NEVER create placeholder template strings)
    if (!resolvedEntry) {
      const cap = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase();
      const pos = cleanWord.endsWith("ly") ? "adverb" : cleanWord.endsWith("ing") || cleanWord.endsWith("ed") ? "verb" : cleanWord.endsWith("ful") || cleanWord.endsWith("ous") || cleanWord.endsWith("est") ? "adjective" : "noun";
      const def = `A meaningful word used to describe actions, feelings, or details in a story.`;
      const ex = generateSmartExampleSentence(cleanWord, pos, def, contextSentence);

      resolvedEntry = {
        word: cap,
        phonetic: `/${lower}/`,
        partOfSpeech: pos,
        definition: def,
        example: ex,
        synonyms: [],
      };
      source = "synthesized";
    }

    // Auto-save the new word into dictionary.txt if valid
    if (resolvedEntry && !isServerPlaceholder(resolvedEntry)) {
      try {
        diskDict[lower] = resolvedEntry;
        writeDictionaryFile(formatTxtOnServer(diskDict));
      } catch (saveErr) {
        console.warn("Could not auto-save resolved word to dictionary file:", saveErr);
      }
    }

    res.json({ ...resolvedEntry, source });
  });

  // Story Narration / explanation endpoint
  app.post("/api/story/explain-slide", async (req, res) => {
    const { paragraph } = req.body;
    if (!paragraph) {
      res.status(400).json({ error: "Paragraph is required" });
      return;
    }

    const ai = getAI();
    if (!ai) {
      res.json({
        summary: paragraph,
        funQuestion: "What do you think will happen next in this adventure?",
      });
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `Given this story paragraph for young students:
"${paragraph}"

Provide:
1. A very simple 1-sentence summary of what happened.
2. A fun reading comprehension question to spark student curiosity.
3. 2 key vocabulary words from this paragraph with their quick meanings.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              funQuestion: { type: Type.STRING },
              keyWords: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING },
                    meaning: { type: Type.STRING },
                  },
                  required: ["word", "meaning"],
                },
              },
            },
            required: ["summary", "funQuestion", "keyWords"],
          },
        },
      });

      res.json(JSON.parse(response.text || "{}"));
    } catch (err) {
      console.error("Explain slide error:", err);
      res.status(500).json({ error: "Failed to explain slide" });
    }
  });

  // ==========================================
  // STORIES MANIFEST API ENDPOINTS
  // ==========================================

  // 1. GET /api/stories/file - Read stories.txt
  app.get("/api/stories/file", (_req, res) => {
    try {
      const txt = readStoriesFile();
      const entries = parseStoriesOnServer(txt);
      res.json({
        success: true,
        txt,
        count: entries.length,
        stories: entries,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to read stories file" });
    }
  });

  // 2. POST /api/stories/file - Save stories.txt directly
  app.post("/api/stories/file", (req, res) => {
    try {
      const { txt } = req.body;
      if (typeof txt !== "string") {
        res.status(400).json({ error: "Missing txt content" });
        return;
      }
      writeStoriesFile(txt);
      const parsed = parseStoriesOnServer(txt);
      res.json({
        success: true,
        count: parsed.length,
        stories: parsed,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to save stories file" });
    }
  });

  // 3. POST /api/stories/save - Save / update / import a story into stories.txt
  app.post("/api/stories/save", (req, res) => {
    try {
      const { story } = req.body;
      if (!story || !story.id || !story.title) {
        res.status(400).json({ error: "Story object with id and title is required" });
        return;
      }

      const currentTxt = readStoriesFile();
      const entries = parseStoriesOnServer(currentTxt);

      const newEntry: ServerStoryEntry = {
        id: story.id,
        title: story.title,
        subtitle: story.subtitle,
        author: story.author,
        genre: story.genre,
        readingLevel: story.readingLevel,
        estimatedMinutes: story.estimatedMinutes,
        seriesTitle: story.seriesTitle,
        seriesId: story.seriesId,
        seriesFolder: story.seriesFolder,
        chapterNumber: story.chapterNumber ? String(story.chapterNumber) : undefined,
        chapterTitle: story.chapterTitle,
        chapterFolder: story.chapterFolder,
        storyFolder: story.storyFolder,
        seriesOrder: story.seriesOrder,
        seriesDescription: story.seriesDescription,
        seriesCoverImage: story.seriesCoverImage,
        coverImage: story.coverImage,
        themeColor: story.themeColor,
        accentColor: story.accentColor,
        slideCount: story.slides?.length || 7,
        summary: story.summary,
        tags: Array.isArray(story.tags) ? story.tags : undefined,
      };

      const existingIndex = entries.findIndex((e) => e.id === story.id);
      if (existingIndex >= 0) {
        entries[existingIndex] = { ...entries[existingIndex], ...newEntry };
      } else {
        entries.push(newEntry);
      }

      const updatedTxt = formatStoriesOnServer(entries);
      writeStoriesFile(updatedTxt);

      console.log(`[Stories] Saved story "${story.title}" (${story.id}) to stories.txt manifest`);

      res.json({
        success: true,
        savedId: story.id,
        count: entries.length,
        txt: updatedTxt,
      });
    } catch (err: any) {
      console.error("Save story error:", err);
      res.status(500).json({ error: err.message || "Failed to save story" });
    }
  });

  // 4. POST /api/stories/delete - Delete story from stories.txt
  app.post("/api/stories/delete", (req, res) => {
    try {
      const { storyId } = req.body;
      if (!storyId) {
        res.status(400).json({ error: "storyId is required" });
        return;
      }

      const currentTxt = readStoriesFile();
      const entries = parseStoriesOnServer(currentTxt);
      const filtered = entries.filter((e) => e.id !== storyId);

      const updatedTxt = formatStoriesOnServer(filtered);
      writeStoriesFile(updatedTxt);

      res.json({
        success: true,
        deletedId: storyId,
        count: filtered.length,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to delete story" });
    }
  });

  // Vite middleware for development vs Static files for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    // Auto-repair any legacy placeholder entries in dictionary.txt on startup in background
    setTimeout(() => {
      repairAllPlaceholdersInDictionary().catch((err) => {
        console.warn("[Dictionary] Initial placeholder repair warning:", err);
      });
    }, 1500);
  });
}

startServer();
