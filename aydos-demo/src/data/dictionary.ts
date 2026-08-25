import { WordDefinition } from "../types";
import { parseDictionaryTxt } from "../utils/dictionaryTxt";

// Built-in Instant Dictionary (Preloaded in memory for 0ms lookup)
const BUILT_IN_DICTIONARY: Record<string, WordDefinition> = {
  adventure: {
    word: "Adventure",
    phonetic: "/ədˈven.tʃɚ/",
    partOfSpeech: "noun",
    definition: "An unusual, exciting, and sometimes risky experience or journey.",
    example: "Exploring the cave system was the greatest adventure of their summer.",
    synonyms: ["quest", "expedition", "journey"],
    source: "local-file",
  },
  ancient: {
    word: "Ancient",
    phonetic: "/ˈeɪn.ʃənt/",
    partOfSpeech: "adjective",
    definition: "Belonging to times long past; extremely old and historic.",
    example: "The ancient stone bridge had stood over the river for five hundred years.",
    synonyms: ["antique", "historic", "timeless"],
    source: "local-file",
  },
  amber: {
    word: "Amber",
    phonetic: "/ˈæm.bɚ/",
    partOfSpeech: "noun / adjective",
    definition: "A warm, golden-yellow color, or fossilized tree resin with a honey glow.",
    example: "The setting sun cast a warm amber glow across the forest canopy.",
    synonyms: ["golden", "honey-colored"],
    source: "local-file",
  },
  antique: {
    word: "Antique",
    phonetic: "/ænˈtiːk/",
    partOfSpeech: "adjective",
    definition: "Made in an earlier period and valued for its age, craftsmanship, or history.",
    example: "Grandpa showed us an antique brass compass from a sailing voyage.",
    synonyms: ["vintage", "classic", "historic"],
    source: "local-file",
  },
  azure: {
    word: "Azure",
    phonetic: "/ˈæʒ.ɚ/",
    partOfSpeech: "noun / adjective",
    definition: "A bright, clear cyan-blue color like that of a cloudless sky.",
    example: "The calm lake reflected the azure summer sky like a polished mirror.",
    synonyms: ["sky-blue", "cerulean"],
    source: "local-file",
  },
  beacon: {
    word: "Beacon",
    phonetic: "/ˈbiː.kən/",
    partOfSpeech: "noun",
    definition: "A guiding light or signal in a high place to warn or guide travelers.",
    example: "The lighthouse served as a comforting beacon for sailors in the fog.",
    synonyms: ["guiding light", "signal", "flare"],
    source: "local-file",
  },
  bioluminescent: {
    word: "Bioluminescent",
    phonetic: "/ˌbaɪ.oʊˌluː.məˈnes.ənt/",
    partOfSpeech: "adjective",
    definition: "Able to produce living, natural light through internal chemical reactions.",
    example: "The ocean waves sparkled with millions of tiny bioluminescent creatures.",
    synonyms: ["self-glowing", "radiant", "luminescent"],
    source: "local-file",
  },
  bravery: {
    word: "Bravery",
    phonetic: "/ˈbreɪ.vɚ.i/",
    partOfSpeech: "noun",
    definition: "Courageous behavior or character when facing fear or challenge.",
    example: "The little girl showed bravery when standing up for her classmate.",
    synonyms: ["courage", "boldness", "heroism"],
    source: "local-file",
  },
  breeze: {
    word: "Breeze",
    phonetic: "/briːz/",
    partOfSpeech: "noun",
    definition: "A light, gentle, and refreshing wind.",
    example: "A cool sea breeze rustled the willow leaves along the shore.",
    synonyms: ["gentle wind", "gust", "draft"],
    source: "local-file",
  },
  brilliant: {
    word: "Brilliant",
    phonetic: "/ˈbrɪl.jənt/",
    partOfSpeech: "adjective",
    definition: "Exceptionally clever or talented; very bright and radiant.",
    example: "Maya came up with a brilliant idea to fix the broken clockwork gears.",
    synonyms: ["ingenious", "radiant", "smart"],
    source: "local-file",
  },
  canopy: {
    word: "Canopy",
    phonetic: "/ˈkæn.ə.pi/",
    partOfSpeech: "noun",
    definition: "The high, leafy roof formed by the tops of the tallest trees in a forest.",
    example: "Golden sunlight filtered through the green canopy of the ancient woods.",
    synonyms: ["treetop roof", "overhang", "shelter"],
    source: "local-file",
  },
  canyon: {
    word: "Canyon",
    phonetic: "/ˈkæn.jən/",
    partOfSpeech: "noun",
    definition: "A deep, narrow valley with steep rocky sides, often carved by a river.",
    example: "The hikers stood at the rim of the great red canyon at dawn.",
    synonyms: ["gorge", "ravine", "chasm"],
    source: "local-file",
  },
  celestial: {
    word: "Celestial",
    phonetic: "/səˈles.tʃəl/",
    partOfSpeech: "adjective",
    definition: "Relating to the sky, outer space, or the stars and heavens.",
    example: "The planetarium ceiling displayed celestial constellations in brilliant light.",
    synonyms: ["astronomical", "stellar", "heavenly"],
    source: "local-file",
  },
  clockwork: {
    word: "Clockwork",
    phonetic: "/ˈklɑːk.wɝːk/",
    partOfSpeech: "noun / adjective",
    definition: "A mechanism driven by springs, gears, and cogs, similar to traditional watches.",
    example: "The brass dragonfly moved smoothly across the desk with clockwork precision.",
    synonyms: ["mechanical", "gear-driven", "precise"],
    source: "local-file",
  },
  cobblestone: {
    word: "Cobblestone",
    phonetic: "/ˈkɑː.bəl.stoʊn/",
    partOfSpeech: "noun",
    definition: "A naturally rounded stone formerly used for paving streets and walkways.",
    example: "Their footsteps echoed quietly along the winding cobblestone path.",
    synonyms: ["paving stone", "pebble stone"],
    source: "local-file",
  },
  compass: {
    word: "Compass",
    phonetic: "/ˈkʌm.pəs/",
    partOfSpeech: "noun",
    definition: "A navigational instrument with a magnetic needle pointing toward magnetic north.",
    example: "The captain checked her brass compass to steer true north.",
    synonyms: ["navigator", "direction finder"],
    source: "local-file",
  },
  compassion: {
    word: "Compassion",
    phonetic: "/kəmˈpæʃ.ən/",
    partOfSpeech: "noun",
    definition: "A deep feeling of sympathy and kindness toward others, with a desire to help.",
    example: "Showing compassion, Luna carefully bandaged the little sparrow's wing.",
    synonyms: ["kindness", "empathy", "warmth"],
    source: "local-file",
  },
  constellation: {
    word: "Constellation",
    phonetic: "/ˌkɑːn.stəˈleɪ.ʃən/",
    partOfSpeech: "noun",
    definition: "A recognizable pattern of stars in the night sky named after myths, animals, or objects.",
    example: "We traced the Big Dipper constellation shining above the hills.",
    synonyms: ["star cluster", "star pattern"],
    source: "local-file",
  },
  cosmic: {
    word: "Cosmic",
    phonetic: "/ˈkɑːz.mɪk/",
    partOfSpeech: "adjective",
    definition: "Relating to the universe, galaxies, or celestial space beyond Earth.",
    example: "The telescope captured a cosmic explosion of stars millions of lightyears away.",
    synonyms: ["universal", "galactic", "stellar"],
    source: "local-file",
  },
  courage: {
    word: "Courage",
    phonetic: "/ˈkɝː.ɪdʒ/",
    partOfSpeech: "noun",
    definition: "The bravery and mental strength to face fear or difficulty without giving up.",
    example: "It took courage for young Milo to explore the dark dome alone.",
    synonyms: ["bravery", "valor", "fearlessness"],
    source: "local-file",
  },
  curiosity: {
    word: "Curiosity",
    phonetic: "/ˌkjʊr.iˈɑː.sə.t̬i/",
    partOfSpeech: "noun",
    definition: "A strong desire to learn, know, or explore something new and fascinating.",
    example: "Driven by curiosity, she turned the key in the antique brass lock.",
    synonyms: ["wonder", "inquisitiveness", "interest"],
    source: "local-file",
  },
  delicate: {
    word: "Delicate",
    phonetic: "/ˈdel.ə.kət/",
    partOfSpeech: "adjective",
    definition: "Easily broken or damaged; fine, subtle, and carefully crafted.",
    example: "The clockwork dragonfly had delicate sapphire wings.",
    synonyms: ["fragile", "fine", "dainty"],
    source: "local-file",
  },
  discover: {
    word: "Discover",
    phonetic: "/dɪˈskʌv.ɚ/",
    partOfSpeech: "verb",
    definition: "To find something unexpected or learn something new for the first time.",
    example: "They were thrilled to discover a hidden passage behind the bookshelf.",
    synonyms: ["uncover", "find", "reveal"],
    source: "local-file",
  },
  dragonfly: {
    word: "Dragonfly",
    phonetic: "/ˈdræɡ.ən.flaɪ/",
    partOfSpeech: "noun",
    definition: "A slender-bodied insect with large eyes and two pairs of strong, transparent wings.",
    example: "A shimmering dragonfly hovered above the quiet lily pond.",
    synonyms: ["winged insect"],
    source: "local-file",
  },
  echo: {
    word: "Echo",
    phonetic: "/ˈek.oʊ/",
    partOfSpeech: "noun / verb",
    definition: "A sound that bounces off a distant surface and repeats back to your ears.",
    example: "His cheerful greeting echoed through the cavern walls.",
    synonyms: ["reverberation", "resonation"],
    source: "local-file",
  },
  eldoria: {
    word: "Eldoria",
    phonetic: "/elˈdɔːr.i.ə/",
    partOfSpeech: "proper noun",
    definition: "A magical realm known in legends for ancient whispering oaks and hidden lore.",
    example: "The map pointed straight into the enchanted borderlands of Eldoria.",
    synonyms: ["mythical kingdom", "enchanted realm"],
    source: "local-file",
  },
  emerald: {
    word: "Emerald",
    phonetic: "/ˈem.ɚ.əld/",
    partOfSpeech: "noun / adjective",
    definition: "A bright green precious gemstone, or a rich deep green color.",
    example: "The forest leaves shone with a brilliant emerald green after the rain.",
    synonyms: ["bright green", "gemstone"],
    source: "local-file",
  },
  enchanted: {
    word: "Enchanted",
    phonetic: "/ɪnˈtʃæn.t̬ɪd/",
    partOfSpeech: "adjective",
    definition: "Filled with delightful magic, wonder, or extraordinary beauty.",
    example: "The children walked into an enchanted meadow filled with glowing flowers.",
    synonyms: ["magical", "charmed", "spellbinding"],
    source: "local-file",
  },
  flutter: {
    word: "Flutter",
    phonetic: "/ˈflʌt̬.ɚ/",
    partOfSpeech: "verb / noun",
    definition: "To fly or hover with quick, light, flapping movements of wings.",
    example: "The mechanical dragonfly fluttered softly before landing on his palm.",
    synonyms: ["hover", "flit", "quiver"],
    source: "local-file",
  },
  foliage: {
    word: "Foliage",
    phonetic: "/ˈfoʊ.li.ɪdʒ/",
    partOfSpeech: "noun",
    definition: "The leaves of a plant or of many trees growing together.",
    example: "Autumn turned the forest foliage into shades of copper and gold.",
    synonyms: ["leaves", "greenery", "vegetation"],
    source: "local-file",
  },
  galaxies: {
    word: "Galaxies",
    phonetic: "/ˈɡæl.ək.siz/",
    partOfSpeech: "noun (plural)",
    definition: "Huge systems of millions or billions of stars held together by gravity.",
    example: "The celestial map revealed spiral galaxies spinning across deep space.",
    synonyms: ["star systems", "cosmic clusters"],
    source: "local-file",
  },
  gilded: {
    word: "Gilded",
    phonetic: "/ˈɡɪl.dɪd/",
    partOfSpeech: "adjective",
    definition: "Covered thinly with gold leaf or gold paint; having a golden sheen.",
    example: "The antique book had gilded edges that gleamed in the candlelight.",
    synonyms: ["gold-plated", "golden", "gleaming"],
    source: "local-file",
  },
  glimmer: {
    word: "Glimmer",
    phonetic: "/ˈɡlɪm.ɚ/",
    partOfSpeech: "noun / verb",
    definition: "A faint or unsteady light; to shine faintly with a flickering glow.",
    example: "A faint glimmer of starlight guided them along the winding path.",
    synonyms: ["shimmer", "gleam", "twinkle"],
    source: "local-file",
  },
  grove: {
    word: "Grove",
    phonetic: "/ɡroʊv/",
    partOfSpeech: "noun",
    definition: "A small cluster or group of trees, often without much underbrush.",
    example: "The friendly fox lived in a quiet grove of silver birch trees.",
    synonyms: ["copse", "woodland", "thicket"],
    source: "local-file",
  },
  harmony: {
    word: "Harmony",
    phonetic: "/ˈhɑːr.mə.ni/",
    partOfSpeech: "noun",
    definition: "A pleasing combination of elements; peaceful agreement or musical blend.",
    example: "The forest creatures lived together in peaceful harmony.",
    synonyms: ["balance", "peace", "concord"],
    source: "local-file",
  },
  horizon: {
    word: "Horizon",
    phonetic: "/həˈraɪ.zən/",
    partOfSpeech: "noun",
    definition: "The distant line where the earth or sea seems to meet the sky.",
    example: "The warm orange sun dipped gently below the western horizon.",
    synonyms: ["skyline", "boundary"],
    source: "local-file",
  },
  illuminate: {
    word: "Illuminate",
    phonetic: "/ɪˈluː.mə.neɪt/",
    partOfSpeech: "verb",
    definition: "To light up and make bright; or to make something clear and easy to understand.",
    example: "Lanterns illuminated the cobblestone street as evening fell.",
    synonyms: ["light up", "brighten", "clarify"],
    source: "local-file",
  },
  iridescent: {
    word: "Iridescent",
    phonetic: "/ˌɪr.əˈdes.ənt/",
    partOfSpeech: "adjective",
    definition: "Showing luminous colors that seem to change when seen from different angles.",
    example: "Soap bubbles have an iridescent sheen that glimmers in the sunlight.",
    synonyms: ["shimmering", "rainbow-colored", "lustrous"],
    source: "local-file",
  },
  journey: {
    word: "Journey",
    phonetic: "/ˈdʒɝː.ni/",
    partOfSpeech: "noun",
    definition: "An act of traveling from one place to another, often over a long distance.",
    example: "Milo smiled, knowing this was just the beginning of his cosmic journey.",
    synonyms: ["voyage", "trip", "expedition"],
    source: "local-file",
  },
  labyrinth: {
    word: "Labyrinth",
    phonetic: "/ˈlæb.ə.rɪnθ/",
    partOfSpeech: "noun",
    definition: "A complicated, intricate network of winding passages; a maze.",
    example: "The ancient hedges formed a green labyrinth in the palace garden.",
    synonyms: ["maze", "network", "tangle"],
    source: "local-file",
  },
  lantern: {
    word: "Lantern",
    phonetic: "/ˈlæn.tɚn/",
    partOfSpeech: "noun",
    definition: "A portable lamp with a protective case enclosing a light source.",
    example: "She held up her brass lantern to inspect the markings on the ancient oak.",
    synonyms: ["lamp", "torch", "light"],
    source: "local-file",
  },
  luminescence: {
    word: "Luminescence",
    phonetic: "/ˌluː.məˈnes.əns/",
    partOfSpeech: "noun",
    definition: "The emission of light by a substance not resulting from heat.",
    example: "The soft blue luminescence of the mushrooms guided their way.",
    synonyms: ["glow", "radiance", "phosphorescence"],
    source: "local-file",
  },
  meadow: {
    word: "Meadow",
    phonetic: "/ˈmed.oʊ/",
    partOfSpeech: "noun",
    definition: "A piece of grassland, especially one used for hay or filled with wildflowers.",
    example: "Butterflies danced across the sunlit meadow of clover.",
    synonyms: ["pasture", "field", "grassland"],
    source: "local-file",
  },
  melody: {
    word: "Melody",
    phonetic: "/ˈmel.ə.di/",
    partOfSpeech: "noun",
    definition: "A sequence of single musical notes that is musically satisfying; a tune.",
    example: "The songbird whistled a cheerful melody from the highest branch.",
    synonyms: ["tune", "song", "theme"],
    source: "local-file",
  },
  mysterious: {
    word: "Mysterious",
    phonetic: "/mɪˈstɪr.i.əs/",
    partOfSpeech: "adjective",
    definition: "Difficult or impossible to understand, explain, or identify; full of mystery.",
    example: "A mysterious glow flickered deep inside the hollow tree.",
    synonyms: ["enigmatic", "secret", "puzzling"],
    source: "local-file",
  },
  nestled: {
    word: "Nestled",
    phonetic: "/ˈnes.əld/",
    partOfSpeech: "verb / adjective",
    definition: "Settled comfortably and snugly in a cozy or sheltered place.",
    example: "A tiny stone observatory sat nestled between the willow trees.",
    synonyms: ["snuggled", "tucked", "sheltered"],
    source: "local-file",
  },
  observatory: {
    word: "Observatory",
    phonetic: "/əbˈzɝː.və.tɔːr.i/",
    partOfSpeech: "noun",
    definition: "A building equipped with telescopes for studying astronomical phenomena and stars.",
    example: "Through the dome of the observatory, Milo observed the rings of Saturn.",
    synonyms: ["lookout", "astronomical dome", "stargazer dome"],
    source: "local-file",
  },
  perched: {
    word: "Perched",
    phonetic: "/pɝːtʃt/",
    partOfSpeech: "verb / adjective",
    definition: "Rested or settled on a high, narrow, or precarious edge.",
    example: "The golden eagle sat perched on the high rocky ledge.",
    synonyms: ["roosted", "balanced", "seated"],
    source: "local-file",
  },
  phosphorescent: {
    word: "Phosphorescent",
    phonetic: "/ˌfɑːs.fəˈres.ənt/",
    partOfSpeech: "adjective",
    definition: "Glowing with light without sensible heat, continuing after the light source is removed.",
    example: "The phosphorescent moss lit the underground cave with a teal hue.",
    synonyms: ["glowing", "radiant", "luminous"],
    source: "local-file",
  },
  sapphire: {
    word: "Sapphire",
    phonetic: "/ˈsæf.aɪr/",
    partOfSpeech: "noun / adjective",
    definition: "A precious gemstone of a deep, sparkling blue color.",
    example: "The mechanical dragonfly had sapphire eyes that glinted in the light.",
    synonyms: ["deep blue", "gemstone"],
    source: "local-file",
  },
  serene: {
    word: "Serene",
    phonetic: "/səˈriːn/",
    partOfSpeech: "adjective",
    definition: "Calm, peaceful, and untroubled; tranquil.",
    example: "The forest lake was completely serene in the early morning stillness.",
    synonyms: ["peaceful", "tranquil", "calm"],
    source: "local-file",
  },
  shimmer: {
    word: "Shimmer",
    phonetic: "/ˈʃɪm.ɚ/",
    partOfSpeech: "verb / noun",
    definition: "To shine with a soft, slightly wavering light.",
    example: "Starlight caused the morning dew to shimmer like diamonds.",
    synonyms: ["glisten", "glint", "sparkle"],
    source: "local-file",
  },
  solitary: {
    word: "Solitary",
    phonetic: "/ˈsɑː.lə.ter.i/",
    partOfSpeech: "adjective",
    definition: "Existing, living, or done alone; single and isolated.",
    example: "A solitary oak tree stood atop the grassy hill.",
    synonyms: ["alone", "isolated", "lone"],
    source: "local-file",
  },
  stellar: {
    word: "Stellar",
    phonetic: "/ˈstel.ɚ/",
    partOfSpeech: "adjective",
    definition: "Relating to a star or stars; or exceptionally good and outstanding.",
    example: "The astronomer studied the stellar constellation through his brass lens.",
    synonyms: ["astral", "starry", "exceptional"],
    source: "local-file",
  },
  telescope: {
    word: "Telescope",
    phonetic: "/ˈtel.ə.skoʊp/",
    partOfSpeech: "noun",
    definition: "An optical instrument designed to make distant objects, like stars and planets, appear closer.",
    example: "Milo adjusted the brass focus ring on the telescope.",
    synonyms: ["spyglass", "optical tube"],
    source: "local-file",
  },
  unison: {
    word: "Unison",
    phonetic: "/ˈjuː.nə.sən/",
    partOfSpeech: "noun",
    definition: "Simultaneous performance of action or speech; in complete harmony together.",
    example: "The clockwork gears rotated in unison to unlock the celestial dome.",
    synonyms: ["together", "accord", "synchrony"],
    source: "local-file",
  },
  whispering: {
    word: "Whispering",
    phonetic: "/ˈwɪs.pɚ.ɪŋ/",
    partOfSpeech: "verb / adjective",
    definition: "Speaking or rustling very softly and quietly.",
    example: "The whispering breeze carried the gentle secrets of the ancient forest.",
    synonyms: ["softly rustling", "murmuring", "hushed"],
    source: "local-file",
  },
};

// Initial In-Memory Cache initialized with BUILT_IN_DICTIONARY for instant 0ms responses
let SHARED_LOCAL_DICTIONARY: Record<string, WordDefinition> = { ...BUILT_IN_DICTIONARY };
let isDictionaryLoaded = false;
let loadPromise: Promise<Record<string, WordDefinition>> | null = null;

/**
 * Checks whether a word definition is a real, high-quality definition or just a fallback placeholder.
 */
export function isPlaceholderDefinition(def?: WordDefinition | null): boolean {
  if (!def) return true;
  const d = def.definition || "";
  const ex = def.example || "";
  const pos = (def.partOfSpeech || "").toLowerCase();
  return (
    d.includes("An important vocabulary word:") ||
    d.includes("A featured vocabulary word:") ||
    d.includes("An expressive story word") ||
    d.includes("A meaningful story word") ||
    d.includes("A meaningful word used to describe") ||
    d.includes("A descriptive word used to express") ||
    d.includes("Definition for ") ||
    d.includes("Loading definition") ||
    d.includes("Tap to listen") ||
    ex.includes("The student encountered the word") ||
    ex.includes("The reader carefully noticed the word") ||
    ex.includes("The explorer used the word") ||
    ex.includes("The student read about") ||
    ex.includes("while exploring the story") ||
    pos === "vocabulary word" ||
    pos === "story vocabulary" ||
    d.length < 12
  );
}

/**
 * Repairs all placeholder definitions in the shared dictionary.txt file on the server.
 */
export async function repairDictionaryPlaceholders(): Promise<{
  success: boolean;
  repairedCount: number;
  wordsRepaired: string[];
  totalWords: number;
  txt: string;
}> {
  const res = await fetch("/api/dictionary/repair-placeholders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to repair dictionary placeholders.");
  }

  const result = await res.json();
  if (result.txt) {
    const parsed = parseDictionaryTxt(result.txt);
    setSharedDictionaryCache(parsed, result.txt);
  }

  return result;
}

/**
 * Loads and merges additional definitions from server file or static file into memory.
 */
export async function loadSharedDictionary(forceReload = false): Promise<Record<string, WordDefinition>> {
  if (isDictionaryLoaded && !forceReload) {
    return SHARED_LOCAL_DICTIONARY;
  }

  if (loadPromise && !forceReload) {
    return loadPromise;
  }

  loadPromise = (async () => {
    // 1. Fetch server /api/dictionary/file first (primary source of truth)
    try {
      const res = await fetch("/api/dictionary/file");
      if (res.ok) {
        const data = await res.json();
        if (data.txt) {
          const parsed = parseDictionaryTxt(data.txt);
          SHARED_LOCAL_DICTIONARY = { ...SHARED_LOCAL_DICTIONARY, ...parsed };
          isDictionaryLoaded = true;
          try {
            if (typeof window !== "undefined") {
              localStorage.setItem("storyread_shared_dictionary_txt", data.txt);
            }
          } catch {}
          return SHARED_LOCAL_DICTIONARY;
        }
      }
    } catch {
      // Fallback gracefully
    }

    // 2. Fetch /dictionary.txt static file
    try {
      const staticRes = await fetch("/dictionary.txt");
      if (staticRes.ok) {
        const txt = await staticRes.text();
        const parsed = parseDictionaryTxt(txt);
        SHARED_LOCAL_DICTIONARY = { ...SHARED_LOCAL_DICTIONARY, ...parsed };
      }
    } catch {
      // Ignore
    }

    // 3. Fallback to localStorage
    try {
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("storyread_shared_dictionary_txt");
        if (cached) {
          const parsed = parseDictionaryTxt(cached);
          SHARED_LOCAL_DICTIONARY = { ...SHARED_LOCAL_DICTIONARY, ...parsed };
        }
      }
    } catch {}

    isDictionaryLoaded = true;
    return SHARED_LOCAL_DICTIONARY;
  })();

  return loadPromise;
}

// Auto-trigger background hydration on module import
if (typeof window !== "undefined") {
  loadSharedDictionary();
}

/**
 * Returns current loaded dictionary entries synchronously.
 */
export function getLoadedDictionary(): Record<string, WordDefinition> {
  return SHARED_LOCAL_DICTIONARY;
}

/**
 * Updates the shared local dictionary in memory and localStorage.
 */
export function setSharedDictionaryCache(dictionary: Record<string, WordDefinition>, rawTxt?: string) {
  SHARED_LOCAL_DICTIONARY = { ...BUILT_IN_DICTIONARY, ...dictionary };
  isDictionaryLoaded = true;
  if (rawTxt && typeof window !== "undefined") {
    try {
      localStorage.setItem("storyread_shared_dictionary_txt", rawTxt);
    } catch {}
  }
}

/**
 * SYNCHRONOUS, INSTANT (0ms) word lookup.
 * Returns a high-quality definition immediately without any network latency.
 */
export function getInstantWordDefinition(
  rawWord: string,
  contextSentence?: string
): WordDefinition {
  const cleanWord = rawWord
    .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "")
    .trim();

  if (!cleanWord) {
    return {
      word: rawWord,
      phonetic: "/.../",
      partOfSpeech: "word",
      definition: "Tap any word in the story to view its definition.",
      example: "Reading expands our vocabulary every day.",
      source: "local-file",
    };
  }

  const lower = cleanWord.toLowerCase();

  // 1. Direct match in local dictionary
  if (SHARED_LOCAL_DICTIONARY[lower]) {
    return SHARED_LOCAL_DICTIONARY[lower];
  }

  // 2. Morphological stemming rules
  const stems = [
    lower.replace(/s$/, ""),
    lower.replace(/es$/, ""),
    lower.replace(/ed$/, ""),
    lower.replace(/ing$/, ""),
    lower.replace(/ly$/, ""),
    lower.replace(/ies$/, "y"),
    lower.replace(/est$/, ""),
    lower.replace(/er$/, ""),
    lower.replace(/tion$/, "te"),
    lower.replace(/ment$/, ""),
  ];

  for (const stem of stems) {
    if (stem && stem.length >= 3 && SHARED_LOCAL_DICTIONARY[stem]) {
      const match = SHARED_LOCAL_DICTIONARY[stem];
      return {
        ...match,
        word: cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase(),
      };
    }
  }

  // 3. Instant Smart Contextual Fallback (0ms latency)
  const formattedWord = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase();
  return {
    word: formattedWord,
    phonetic: `/${cleanWord.toLowerCase()}/`,
    partOfSpeech: "story vocabulary",
    definition: `Loading definition for "${formattedWord}"...`,
    example: contextSentence || `The word "${cleanWord}" appeared in the story paragraph.`,
    synonyms: [],
    source: "local-file",
  };
}

/**
 * Asynchronous enrichment lookup: Fetches real definition from /api/dictionary/lookup,
 * updates in-memory cache and localStorage, and returns the rich definition.
 */
export async function lookupAndEnrichWord(
  rawWord: string,
  contextSentence?: string
): Promise<WordDefinition> {
  const cleanWord = rawWord
    .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "")
    .trim();

  const lower = cleanWord.toLowerCase();
  const existing = SHARED_LOCAL_DICTIONARY[lower];

  // If already exists and is a real rich entry, return immediately
  if (existing && !isPlaceholderDefinition(existing)) {
    return existing;
  }

  try {
    const res = await fetch("/api/dictionary/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: cleanWord, contextSentence }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.word && data.definition) {
        const enriched: WordDefinition = {
          word: data.word,
          phonetic: data.phonetic || `/${lower}/`,
          partOfSpeech: data.partOfSpeech || "word",
          definition: data.definition,
          example: data.example || contextSentence || `The word "${data.word}" appeared in the story.`,
          synonyms: data.synonyms || [],
          funFact: data.funFact || undefined,
          source: data.source || "gemini",
        };

        // Cache in memory
        SHARED_LOCAL_DICTIONARY[lower] = enriched;
        return enriched;
      }
    }
  } catch (err) {
    console.warn("Async word enrichment error:", err);
  }

  return getInstantWordDefinition(rawWord, contextSentence);
}

/**
 * Fast word lookup helper.
 */
export async function lookupWord(
  rawWord: string,
  contextSentence?: string
): Promise<WordDefinition> {
  return lookupAndEnrichWord(rawWord, contextSentence);
}

/**
 * Batch generate and add story words to the shared local dictionary.
 */
export async function batchAddWordsToDictionary(
  words: string[],
  storyContext?: string,
  force = false
): Promise<{
  success: boolean;
  addedCount: number;
  alreadyExistingCount: number;
  totalCount: number;
  wordsAdded: string[];
  txtContent: string;
}> {
  const res = await fetch("/api/dictionary/batch-generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ words, storyContext, force }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to batch add words to dictionary.");
  }

  const result = await res.json();
  if (result.txtContent) {
    const parsed = parseDictionaryTxt(result.txtContent);
    setSharedDictionaryCache(parsed, result.txtContent);
  }

  return result;
}

/**
 * Save manual changes to the dictionary .txt file.
 */
export async function saveDictionaryTxtToServer(txt: string): Promise<{
  success: boolean;
  wordsCount: number;
  txt: string;
}> {
  const res = await fetch("/api/dictionary/file", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ txt }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to save dictionary txt file.");
  }

  const data = await res.json();
  if (data.txt) {
    const parsed = parseDictionaryTxt(data.txt);
    setSharedDictionaryCache(parsed, data.txt);
  }

  return data;
}

