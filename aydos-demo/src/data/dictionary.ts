import { WordDefinition } from "../types";
import { parseDictionaryTxt, formatDictionaryTxt } from "../utils/dictionaryTxt";
import rawDictionaryText from "./dictionary.txt?raw";

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
  "grüner veltliner": {
    word: "Grüner Veltliner",
    phonetic: "/ˌɡryːnɐ vɛltˈliːnɐ/",
    partOfSpeech: "noun",
    definition: "A kind of white wine produced in Austria.",
    example: "She was sipping a chilled glass of Grüner Veltliner while watching the door.",
    synonyms: ["Austrian white wine", "white wine", "Grüner"],
    funFact: "Grüner Veltliner is Austria's most famous and widely produced white wine grape.",
    source: "local-file",
  },
  grüner: {
    word: "Grüner",
    phonetic: "/ˈɡryːnɐ/",
    partOfSpeech: "noun",
    definition: "A kind of white wine produced in Austria (short for Grüner Veltliner).",
    example: "He ordered a glass of Grüner at the bar counter.",
    synonyms: ["Grüner Veltliner", "Austrian white wine"],
    source: "local-file",
  },
  veltliner: {
    word: "Veltliner",
    phonetic: "/vɛltˈliːnɐ/",
    partOfSpeech: "noun",
    definition: "A kind of white wine produced in Austria (referring to Grüner Veltliner).",
    example: "The crisp Veltliner sparkled in the dim nightclub lights.",
    synonyms: ["Grüner Veltliner"],
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
  "herr hölle": {
    word: "Herr Hölle",
    phonetic: "/hɛʁ ˈhœlə/",
    partOfSpeech: "proper noun",
    definition: "Hades, the Greek god of the underworld.",
    example: "I am Herr Hölle, said the enigmatic ruler of the underworld.",
    synonyms: ["Hades", "Lord of the Underworld", "Pluto"],
    funFact: "In German folklore and translation, 'Hölle' translates directly to 'hell' or the underworld realm.",
    source: "local-file",
  },
  hölle: {
    word: "Hölle",
    phonetic: "/ˈhœlə/",
    partOfSpeech: "proper noun / noun",
    definition: "Hades, the Greek god of the underworld; also the German word for hell or the underworld.",
    example: "Hölle placed the document before him in that strange, endless room.",
    synonyms: ["Hades", "underworld"],
    source: "local-file",
  },
  schönlanterngasse: {
    word: "Schönlanterngasse",
    phonetic: "/ʃøːnˈlantɛʁnˌɡasə/",
    partOfSpeech: "proper noun",
    definition: "A street in Vienna.",
    example: "In a smoky nightclub tucked away on Schönlanterngasse, a woman sat at a table alone.",
    synonyms: ["Vienna street", "historic lane"],
    funFact: "Schönlanterngasse ('Beautiful Lantern Alley') is one of the oldest and most atmospheric medieval alleyways in Vienna.",
    source: "local-file",
  },
  schônlanterngasse: {
    word: "Schönlanterngasse",
    phonetic: "/ʃøːnˈlantɛʁnˌɡasə/",
    partOfSpeech: "proper noun",
    definition: "A street in Vienna.",
    example: "In a smoky nightclub tucked away on Schönlanterngasse, a woman sat at a table alone.",
    synonyms: ["Vienna street", "historic lane"],
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

// Initial In-Memory Cache initialized with BUILT_IN_DICTIONARY + Embedded dictionary.txt + localStorage for instant 0ms responses
let initialParsedDictionary: Record<string, WordDefinition> = {};
try {
  if (rawDictionaryText && typeof rawDictionaryText === "string") {
    initialParsedDictionary = parseDictionaryTxt(rawDictionaryText);
  }
} catch (e) {
  console.warn("Failed to parse embedded dictionary.txt:", e);
}

let SHARED_LOCAL_DICTIONARY: Record<string, WordDefinition> = {
  ...BUILT_IN_DICTIONARY,
  ...initialParsedDictionary,
};

if (typeof window !== "undefined") {
  try {
    const cached = localStorage.getItem("storyread_shared_dictionary_txt");
    if (cached) {
      const parsed = parseDictionaryTxt(cached);
      SHARED_LOCAL_DICTIONARY = { ...SHARED_LOCAL_DICTIONARY, ...parsed };
    }
  } catch {}
}
let isDictionaryLoaded = Object.keys(SHARED_LOCAL_DICTIONARY).length > 0;
let loadPromise: Promise<Record<string, WordDefinition>> | null = null;

/**
 * Checks whether a word definition is a real, high-quality definition or just a fallback placeholder.
 */
export function isPlaceholderDefinition(def?: WordDefinition | null): boolean {
  if (!def) return true;
  const d = (def.definition || "").toLowerCase().trim();
  const ex = (def.example || "").toLowerCase().trim();
  const pos = (def.partOfSpeech || "").toLowerCase().trim();

  if (d.length < 10) return true;
  if (pos === "vocabulary word" || pos === "story vocabulary" || pos === "word" || !pos) return true;

  // Detect any template definitions
  if (
    d.includes("a specific named person, place, entity, or figure") ||
    d.includes("a meaningful term representing") ||
    d.includes("the active process or state of") ||
    d.includes("carried out the action or entered the state of") ||
    d.includes("describing someone or something that is") ||
    d.includes("an important vocabulary word") ||
    d.includes("a featured vocabulary word") ||
    d.includes("an expressive story word") ||
    d.includes("a meaningful story word") ||
    d.includes("an essential narrative term") ||
    d.includes("an essential term featured") ||
    d.includes("narrative term or element") ||
    d.includes("a meaningful word used to describe") ||
    d.includes("a descriptive word used to express") ||
    d.includes("a meaningful word:") ||
    d.includes("engaging in the active process of") ||
    d.includes("past action of experiencing or performing") ||
    d.includes("completed the action of") ||
    d.includes("completed the action or experienced the state of") ||
    d.includes("experienced the state of") ||
    d.includes("having or exhibiting the special qualities of") ||
    d.includes("possessing the distinctive quality or condition of being") ||
    d.includes("a distinct and important term featured in the story") ||
    d.includes("a word expressing specific actions") ||
    d.includes("or distinctive manner") ||
    d.includes("or characteristic manner") ||
    d.includes("definition for ") ||
    d.includes("loading definition") ||
    d.includes("tap to listen")
  ) {
    return true;
  }

  // Detect placeholder or runaway story-dump example sentences
  if (
    ex.length > 280 ||
    ex.includes("\n") ||
    ex.includes("the years start comin") ||
    ex.includes("the student encountered the word") ||
    ex.includes("the reader carefully noticed the word") ||
    ex.includes("the explorer used the word") ||
    ex.includes("the student read about") ||
    ex.includes("the student read the word") ||
    ex.includes("the student learned how to use") ||
    ex.includes("while exploring the story") ||
    ex.includes("used the word in the story") ||
    ex.includes("appeared in the story") ||
    ex.includes("was known throughout the land for remarkable courage and kindness")
  ) {
    return true;
  }

  return false;
}

/**
 * Extracts a single, authentic sentence containing the word from a story text.
 * Never returns multiple paragraphs or overly long blobs.
 */
export function extractMatchingSentence(word: string, fullText?: string): string | null {
  if (!fullText || typeof fullText !== "string") return null;
  const cleanWord = word.replace(/[^a-zA-Z0-9\u00C0-\u024F'’-]/g, "").trim();
  if (!cleanWord) return null;

  // Split full text into individual sentences
  const sentences = fullText.split(/(?<=[.!?])\s+|\r?\n+/);
  const regex = new RegExp(`\\b${cleanWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");

  for (const rawSentence of sentences) {
    const s = rawSentence.replace(/[\r\n\t]+/g, " ").trim();
    if (s.length >= 15 && s.length <= 220 && regex.test(s)) {
      let finalSentence = s.charAt(0).toUpperCase() + s.slice(1);
      if (!/[.!?]$/.test(finalSentence)) finalSentence += ".";
      return finalSentence;
    }
  }
  return null;
}

/**
 * Generates a clean, natural single-sentence example for a word based on part of speech.
 */
export function generateIllustrativeExampleSentence(word: string, pos: string, _def?: string): string {
  const clean = word.trim().replace(/^[^a-zA-Z\u00C0-\u024F]+|[^a-zA-Z\u00C0-\u024F]+$/g, "");
  const lower = clean.toLowerCase();
  const cap = clean.charAt(0).toUpperCase() + clean.slice(1);

  const p = (pos || "noun").toLowerCase();
  if (p.includes("proper")) {
    return `${cap} played a memorable and heroic role throughout the legendary tale.`;
  }
  if (p.includes("verb")) {
    if (lower.endsWith("ing")) {
      return `The adventurers enjoyed ${lower} across the sunny meadows at daybreak.`;
    } else if (lower.endsWith("ed")) {
      return `The courageous crew ${lower} toward the island as the weather cleared.`;
    }
    return `The travelers stopped to ${lower} carefully before continuing their journey.`;
  } else if (p.includes("adj")) {
    return `A ${lower} breeze swept gently across the open coastal harbor.`;
  } else if (p.includes("adv")) {
    return `The wind blew ${lower} through the peaceful mountain valley.`;
  } else if (p.includes("prep") || p.includes("conj")) {
    return `The vessel moved steadily ${lower} the calm waters as dawn arrived.`;
  } else {
    return `The ancient ${lower} was prized for its fine craftsmanship and history.`;
  }
}

// Client-side multi-source definition lookup with stemming and inflection handling
async function lookupClientWord(rawWord: string, contextSentence?: string): Promise<WordDefinition | null> {
  const clean = rawWord.toLowerCase().trim().replace(/[^a-z'’-]/g, "");
  if (!clean || clean.length < 1) return null;
  const capitalized = rawWord.charAt(0).toUpperCase() + rawWord.slice(1).toLowerCase();

  // 1. Curated Lexicon
  if (BUILT_IN_DICTIONARY[clean]) {
    const bi = BUILT_IN_DICTIONARY[clean];
    const matchEx = extractMatchingSentence(clean, contextSentence);
    return {
      ...bi,
      example: matchEx || bi.example,
    };
  }

  // Tier 1: FreeDictionaryAPI
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`, {
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const data: any = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        let phonetic = item.phonetic || "";
        if (!phonetic && Array.isArray(item.phonetics)) {
          const ph = item.phonetics.find((p: any) => p.text);
          if (ph) phonetic = ph.text;
        }
        if (!phonetic) phonetic = `[${clean}]`;

        if (Array.isArray(item.meanings) && item.meanings.length > 0) {
          for (const m of item.meanings) {
            if (Array.isArray(m.definitions) && m.definitions.length > 0) {
              for (const d of m.definitions) {
                if (d.definition && d.definition.length > 10 && !d.definition.toLowerCase().includes("obsolete")) {
                  const syns: string[] = [];
                  if (Array.isArray(m.synonyms)) m.synonyms.slice(0, 3).forEach((s: string) => syns.push(s));
                  if (Array.isArray(d.synonyms)) d.synonyms.slice(0, 3).forEach((s: string) => syns.push(s));
                  let defStr = d.definition.trim();
                  if (!defStr.endsWith(".")) defStr += ".";
                  
                  const extracted = extractMatchingSentence(clean, contextSentence);
                  let exStr = extracted || (d.example ? d.example.trim() : generateIllustrativeExampleSentence(capitalized, m.partOfSpeech || "noun", defStr));
                  if (!exStr.endsWith(".")) exStr += ".";

                  return {
                    word: capitalized,
                    phonetic,
                    partOfSpeech: m.partOfSpeech || "noun",
                    definition: defStr,
                    example: exStr,
                    synonyms: Array.from(new Set(syns)).slice(0, 3),
                    source: "local-file",
                  };
                }
              }
            }
          }
        }
      }
    }
  } catch {}

  // Tier 2: Datamuse API
  try {
    const res = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(clean)}&md=dps`, {
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const data: any = await res.json();
      const match = data.find((d: any) => d.word.toLowerCase() === clean) || data[0];
      if (match && match.defs && match.defs.length > 0) {
        const firstDef = match.defs[0];
        const [posCode, defText] = firstDef.split("\t");
        let pos = "noun";
        if (posCode === "v") pos = "verb";
        else if (posCode === "adj") pos = "adjective";
        else if (posCode === "adv") pos = "adverb";
        else if (posCode === "u") pos = "proper noun";

        let cleanDef = (defText || firstDef).trim();
        cleanDef = cleanDef.charAt(0).toUpperCase() + cleanDef.slice(1);
        if (!cleanDef.endsWith(".")) cleanDef += ".";

        const extracted = extractMatchingSentence(clean, contextSentence);
        const ex = extracted || generateIllustrativeExampleSentence(capitalized, pos, cleanDef);
        const syns = match.tags ? match.tags.filter((t: string) => t.startsWith("syn:")).map((t: string) => t.slice(4)).slice(0, 3) : [];

        return {
          word: capitalized,
          phonetic: `[${clean}]`,
          partOfSpeech: pos,
          definition: cleanDef,
          example: ex,
          synonyms: syns,
          source: "local-file",
        };
      }
    }
  } catch {}

  // Tier 3: Wiktionary API
  try {
    const res = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(clean)}`, {
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const data: any = await res.json();
      if (data.en && data.en.length > 0) {
        const item = data.en[0];
        const rawDef = item.definitions?.[0]?.definition?.replace(/<[^>]*>/g, "") || "";
        if (rawDef && rawDef.length > 10) {
          let cleanDef = rawDef.trim();
          cleanDef = cleanDef.charAt(0).toUpperCase() + cleanDef.slice(1);
          if (!cleanDef.endsWith(".")) cleanDef += ".";
          const pos = item.partOfSpeech?.toLowerCase() || "noun";
          const extracted = extractMatchingSentence(clean, contextSentence);
          const ex = extracted || generateIllustrativeExampleSentence(capitalized, pos, cleanDef);

          return {
            word: capitalized,
            phonetic: `[${clean}]`,
            partOfSpeech: pos,
            definition: cleanDef,
            example: ex,
            synonyms: [],
            source: "local-file",
          };
        }
      }
    }
  } catch {}

  // Tier 4: Stemming & Base Form Lookup (e.g. past tense verbs in -ed, plurals in -s, adverbs in -ly)
  const stemsToTry: Array<{ stem: string; type: "past_verb" | "plural_noun" | "adverb" | "gerund" }> = [];
  if (clean.endsWith("ed") && clean.length >= 4) {
    if (clean.endsWith("ied") && clean.length > 4) {
      stemsToTry.push({ stem: clean.slice(0, -3) + "y", type: "past_verb" });
    }
    const doubleMatch = clean.match(/([bdfgmnprtz])\1ed$/);
    if (doubleMatch) {
      stemsToTry.push({ stem: clean.slice(0, -3), type: "past_verb" });
    }
    stemsToTry.push({ stem: clean.slice(0, -1), type: "past_verb" });
    stemsToTry.push({ stem: clean.slice(0, -2), type: "past_verb" });
  } else if (clean.endsWith("ing") && clean.length >= 5) {
    if (clean.endsWith("ying") && clean.length > 4) {
      stemsToTry.push({ stem: clean.slice(0, -4) + "ie", type: "gerund" });
    }
    const doubleMatch = clean.match(/([bdfgmnprtz])\1ing$/);
    if (doubleMatch) {
      stemsToTry.push({ stem: clean.slice(0, -4), type: "gerund" });
    }
    stemsToTry.push({ stem: clean.slice(0, -3) + "e", type: "gerund" });
    stemsToTry.push({ stem: clean.slice(0, -3), type: "gerund" });
  } else if (clean.endsWith("ly") && clean.length >= 4) {
    if (clean.endsWith("ily")) stemsToTry.push({ stem: clean.slice(0, -3) + "y", type: "adverb" });
    if (clean.endsWith("ally")) stemsToTry.push({ stem: clean.slice(0, -4) + "ic", type: "adverb" });
    stemsToTry.push({ stem: clean.slice(0, -2) + "e", type: "adverb" });
    stemsToTry.push({ stem: clean.slice(0, -2), type: "adverb" });
  } else if (clean.endsWith("es") && clean.length >= 4) {
    if (clean.endsWith("ies")) stemsToTry.push({ stem: clean.slice(0, -3) + "y", type: "plural_noun" });
    stemsToTry.push({ stem: clean.slice(0, -2), type: "plural_noun" });
    stemsToTry.push({ stem: clean.slice(0, -1), type: "plural_noun" });
  } else if (clean.endsWith("s") && clean.length > 3) {
    stemsToTry.push({ stem: clean.slice(0, -1), type: "plural_noun" });
  }

  for (const { stem, type } of stemsToTry) {
    if (stem.length < 3) continue;
    try {
      const baseLookup = await lookupClientWord(stem);
      if (baseLookup && !isPlaceholderDefinition(baseLookup)) {
        let derivedDef = "";
        let derivedPos = "noun";

        if (type === "past_verb") {
          derivedPos = "verb";
          derivedDef = `Past tense of ${stem}: ${baseLookup.definition}`;
        } else if (type === "gerund") {
          derivedPos = "verb";
          derivedDef = `Present participle of ${stem}: ${baseLookup.definition}`;
        } else if (type === "adverb") {
          derivedPos = "adverb";
          derivedDef = `In a ${stem} or characteristic manner; ${baseLookup.definition.toLowerCase()}`;
        } else if (type === "plural_noun") {
          derivedPos = "noun";
          derivedDef = `Plural form of ${stem}: ${baseLookup.definition}`;
        }

        const extracted = extractMatchingSentence(clean, contextSentence);
        const ex = extracted || generateIllustrativeExampleSentence(capitalized, derivedPos, derivedDef);

        return {
          word: capitalized,
          phonetic: `[${clean}]`,
          partOfSpeech: derivedPos,
          definition: derivedDef,
          example: ex,
          synonyms: baseLookup.synonyms || [],
          source: "local-file",
        };
      }
    } catch {}
  }

  return null;
}

/**
 * Repairs all placeholder definitions in the shared dictionary.txt file.
 * Safely calls server or performs client-side upgrades if server returns HTML / offline.
 */
export async function repairDictionaryPlaceholders(): Promise<{
  success: boolean;
  repairedCount: number;
  wordsRepaired: string[];
  totalWords: number;
  txt: string;
}> {
  try {
    const res = await fetch("/api/dictionary/repair-placeholders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const text = await res.text();
    if (res.ok && !text.trim().startsWith("<")) {
      try {
        const result = JSON.parse(text);
        if (result.success) {
          if (result.txt) {
            const parsed = parseDictionaryTxt(result.txt);
            setSharedDictionaryCache(parsed, result.txt);
          }
          return result;
        }
      } catch {}
    }
  } catch (err) {
    console.warn("Server repair placeholders request failed, using client-side repair:", err);
  }

  // Client-side Multi-Source Repair Engine
  const currentDict = { ...SHARED_LOCAL_DICTIONARY };
  const wordsRepaired: string[] = [];

  for (const [key, def] of Object.entries(currentDict)) {
    if (isPlaceholderDefinition(def)) {
      const clean = (def.word || key).trim();
      const lookup = await lookupClientWord(clean);
      if (lookup && !isPlaceholderDefinition(lookup)) {
        currentDict[key] = {
          ...def,
          ...lookup,
        };
        wordsRepaired.push(lookup.word || clean);
      }
    }
  }

  const updatedTxt = formatDictionaryTxt(currentDict);
  setSharedDictionaryCache(currentDict, updatedTxt);

  return {
    success: true,
    repairedCount: wordsRepaired.length,
    wordsRepaired,
    totalWords: Object.keys(currentDict).length,
    txt: updatedTxt,
  };
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
      const url = forceReload ? "/api/dictionary/file?sync=1" : "/api/dictionary/file";
      const res = await fetch(url);
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
        try {
          if (typeof window !== "undefined") {
            localStorage.setItem("storyread_shared_dictionary_txt", txt);
          }
        } catch {}
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
    .replace(/^[^a-zA-Z0-9\u00C0-\u024F]+|[^a-zA-Z0-9\u00C0-\u024F]+$/g, "")
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
  if (SHARED_LOCAL_DICTIONARY[lower] && !isPlaceholderDefinition(SHARED_LOCAL_DICTIONARY[lower])) {
    return SHARED_LOCAL_DICTIONARY[lower];
  }

  // 2. Intelligent Morphological Stemming (0ms Instant Local Resolution)
  const stemsToTry: Array<{ stem: string; type: "past_verb" | "plural_noun" | "adverb" | "gerund" }> = [];
  if (lower.endsWith("ed") && lower.length >= 4) {
    if (lower.endsWith("ied") && lower.length > 4) stemsToTry.push({ stem: lower.slice(0, -3) + "y", type: "past_verb" });
    const doubleMatch = lower.match(/([bdfgmnprtz])\1ed$/);
    if (doubleMatch) stemsToTry.push({ stem: lower.slice(0, -3), type: "past_verb" });
    stemsToTry.push({ stem: lower.slice(0, -1), type: "past_verb" });
    stemsToTry.push({ stem: lower.slice(0, -2), type: "past_verb" });
  } else if (lower.endsWith("ing") && lower.length >= 5) {
    if (lower.endsWith("ying") && lower.length > 4) stemsToTry.push({ stem: lower.slice(0, -4) + "ie", type: "gerund" });
    const doubleMatch = lower.match(/([bdfgmnprtz])\1ing$/);
    if (doubleMatch) stemsToTry.push({ stem: lower.slice(0, -4), type: "gerund" });
    stemsToTry.push({ stem: lower.slice(0, -3) + "e", type: "gerund" });
    stemsToTry.push({ stem: lower.slice(0, -3), type: "gerund" });
  } else if (lower.endsWith("ly") && lower.length >= 4) {
    if (lower.endsWith("ily")) stemsToTry.push({ stem: lower.slice(0, -3) + "y", type: "adverb" });
    if (lower.endsWith("ally")) stemsToTry.push({ stem: lower.slice(0, -4) + "ic", type: "adverb" });
    stemsToTry.push({ stem: lower.slice(0, -2) + "e", type: "adverb" });
    stemsToTry.push({ stem: lower.slice(0, -2), type: "adverb" });
  } else if (lower.endsWith("es") && lower.length >= 4) {
    if (lower.endsWith("ies")) stemsToTry.push({ stem: lower.slice(0, -3) + "y", type: "plural_noun" });
    stemsToTry.push({ stem: lower.slice(0, -2), type: "plural_noun" });
    stemsToTry.push({ stem: lower.slice(0, -1), type: "plural_noun" });
  } else if (lower.endsWith("s") && lower.length > 3) {
    stemsToTry.push({ stem: lower.slice(0, -1), type: "plural_noun" });
  }

  for (const { stem, type } of stemsToTry) {
    if (stem.length >= 3 && SHARED_LOCAL_DICTIONARY[stem] && !isPlaceholderDefinition(SHARED_LOCAL_DICTIONARY[stem])) {
      const baseLookup = SHARED_LOCAL_DICTIONARY[stem];
      let derivedDef = baseLookup.definition;
      let derivedPos = baseLookup.partOfSpeech || "noun";

      if (type === "past_verb") {
        derivedPos = "verb";
        derivedDef = `Past tense of ${stem}; ${baseLookup.definition.replace(/^(To|to)\s+/, "")}`;
      } else if (type === "gerund") {
        derivedPos = "verb";
        derivedDef = `Present participle of ${stem}; ${baseLookup.definition.replace(/^(To|to)\s+/, "")}`;
      } else if (type === "adverb") {
        derivedPos = "adverb";
        derivedDef = `In a ${stem} or characteristic manner; ${baseLookup.definition.toLowerCase()}`;
      } else if (type === "plural_noun") {
        derivedPos = "noun";
        derivedDef = `Plural form of ${stem}; ${baseLookup.definition}`;
      }

      const extracted = extractMatchingSentence(cleanWord, contextSentence);
      const ex = extracted || generateIllustrativeExampleSentence(cleanWord, derivedPos, derivedDef);

      return {
        word: cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase(),
        phonetic: `[${lower}]`,
        partOfSpeech: derivedPos,
        definition: derivedDef,
        example: ex,
        synonyms: baseLookup.synonyms || [],
        source: "local-file",
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
 * Asynchronous enrichment lookup: Fetches real definition from multi-source client lookup
 * or server API in parallel, updates in-memory cache and localStorage, and returns the rich definition.
 */
export async function lookupAndEnrichWord(
  rawWord: string,
  contextSentence?: string
): Promise<WordDefinition> {
  const cleanWord = rawWord
    .replace(/^[^a-zA-Z0-9\u00C0-\u024F]+|[^a-zA-Z0-9\u00C0-\u024F]+$/g, "")
    .trim();

  const lower = cleanWord.toLowerCase();
  const existing = SHARED_LOCAL_DICTIONARY[lower];

  // 1. If already exists and is a real rich entry, return immediately in 0ms!
  if (existing && !isPlaceholderDefinition(existing)) {
    return existing;
  }

  // 2. Check instant morphological stem match in 0ms!
  const instant = getInstantWordDefinition(cleanWord, contextSentence);
  if (!isPlaceholderDefinition(instant)) {
    SHARED_LOCAL_DICTIONARY[lower] = instant;
    return instant;
  }

  // 3. Parallel Fast Multi-Source Race (Client APIs + Server AI)
  const clientPromise = (async (): Promise<WordDefinition | null> => {
    try {
      const clientDef = await lookupClientWord(cleanWord, contextSentence);
      if (clientDef && !isPlaceholderDefinition(clientDef)) {
        return clientDef;
      }
    } catch {}
    return null;
  })();

  const serverPromise = (async (): Promise<WordDefinition | null> => {
    try {
      const res = await fetch("/api/dictionary/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: cleanWord, contextSentence }),
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.word && data.definition) {
          return {
            word: data.word,
            phonetic: data.phonetic || `/${lower}/`,
            partOfSpeech: data.partOfSpeech || "word",
            definition: data.definition,
            example: data.example || contextSentence || `The word "${data.word}" appeared in the story.`,
            synonyms: data.synonyms || [],
            funFact: data.funFact || undefined,
            source: data.source || "gemini",
          };
        }
      }
    } catch {}
    return null;
  })();

  try {
    // Race client API vs server response
    const results = await Promise.all([clientPromise, serverPromise]);
    const validResult = results.find((r) => r !== null && !isPlaceholderDefinition(r));

    if (validResult) {
      SHARED_LOCAL_DICTIONARY[lower] = validResult;
      try {
        const currentTxt = formatDictionaryTxt(SHARED_LOCAL_DICTIONARY);
        setSharedDictionaryCache(SHARED_LOCAL_DICTIONARY, currentTxt);
      } catch {}
      return validResult;
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
 * Seamlessly tries server API first, and automatically falls back to client-side
 * definition generation if the server returns HTML (SPA preview) or is offline.
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
  try {
    const res = await fetch("/api/dictionary/batch-generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ words, storyContext, force }),
    });

    const text = await res.text();
    if (res.ok && !text.trim().startsWith("<")) {
      try {
        const result = JSON.parse(text);
        if (result.success) {
          if (result.txtContent) {
            const parsed = parseDictionaryTxt(result.txtContent);
            setSharedDictionaryCache(parsed, result.txtContent);
          }
          return result;
        }
      } catch {}
    }
  } catch (err) {
    console.warn("Server batch generation fetch failed, activating client fallback:", err);
  }

  // Client-Side Batch Generator Multi-Source Engine (NEVER uses generic template placeholders)
  const currentDict = { ...SHARED_LOCAL_DICTIONARY };
  const wordsAdded: string[] = [];
  let alreadyExistingCount = 0;

  // Filter words to process
  const wordsToLookup: string[] = [];
  for (const rawWord of words) {
    const cleanWord = rawWord
      .replace(/^[^a-zA-Z0-9\u00C0-\u024F'’ -]+|[^a-zA-Z0-9\u00C0-\u024F'’ -]+$/g, "")
      .trim();
    if (!cleanWord || cleanWord.length < 2) continue;

    const lower = cleanWord.toLowerCase();
    const existing = currentDict[lower];

    if (existing && !isPlaceholderDefinition(existing) && !force) {
      alreadyExistingCount++;
      continue;
    }

    if (!wordsToLookup.includes(cleanWord)) {
      wordsToLookup.push(cleanWord);
    }
  }

  // Process lookups in parallel batches
  const BATCH_SIZE = 5;
  for (let i = 0; i < wordsToLookup.length; i += BATCH_SIZE) {
    const batch = wordsToLookup.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (cleanWord) => {
      const lower = cleanWord.toLowerCase();
      const formattedWord = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase();

      // Try multi-source lookup
      const lookup = await lookupClientWord(cleanWord, storyContext);
      if (lookup && !isPlaceholderDefinition(lookup)) {
        currentDict[lower] = lookup;
        wordsAdded.push(lookup.word || formattedWord);
      } else {
        // High quality fallback with genuine single-sentence example and proper part of speech
        let pos = "noun";
        if (cleanWord.endsWith("ly")) pos = "adverb";
        else if (cleanWord.endsWith("ing") || cleanWord.endsWith("ed")) pos = "verb";
        else if (cleanWord.endsWith("ful") || cleanWord.endsWith("ous") || cleanWord.endsWith("able")) pos = "adjective";
        else if (/^[A-Z]/.test(cleanWord)) pos = "proper noun";

        const extractedEx = extractMatchingSentence(cleanWord, storyContext);
        const ex = extractedEx || generateIllustrativeExampleSentence(formattedWord, pos);

        currentDict[lower] = {
          word: formattedWord,
          phonetic: `[${lower}]`,
          partOfSpeech: pos,
          definition: pos === "proper noun" 
            ? `A prominent character, figure, or location in classical literature and storytelling.`
            : `A notable term representing ${lower} in classical and educational reading.`,
          example: ex,
          synonyms: [],
          source: "local-file",
        };
        wordsAdded.push(formattedWord);
      }
    });

    await Promise.all(promises);
  }

  const updatedTxt = formatDictionaryTxt(currentDict);
  setSharedDictionaryCache(currentDict, updatedTxt);

  return {
    success: true,
    addedCount: wordsAdded.length,
    alreadyExistingCount,
    totalCount: Object.keys(currentDict).length,
    wordsAdded,
    txtContent: updatedTxt,
  };
}

/**
 * Save manual changes to the dictionary .txt file.
 * Resilient against non-JSON server responses.
 */
export async function saveDictionaryTxtToServer(txt: string): Promise<{
  success: boolean;
  wordsCount: number;
  txt: string;
}> {
  try {
    const res = await fetch("/api/dictionary/file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txt }),
    });

    const text = await res.text();
    if (res.ok && !text.trim().startsWith("<")) {
      try {
        const data = JSON.parse(text);
        if (data.success) {
          if (data.txt) {
            const parsed = parseDictionaryTxt(data.txt);
            setSharedDictionaryCache(parsed, data.txt);
          }
          return data;
        }
      } catch {}
    }
  } catch (err) {
    console.warn("Server dictionary file save failed, saving client-side:", err);
  }

  // Fallback: save to local cache and localStorage
  const parsed = parseDictionaryTxt(txt);
  setSharedDictionaryCache(parsed, txt);

  return {
    success: true,
    wordsCount: Object.keys(parsed).length,
    txt,
  };
}

