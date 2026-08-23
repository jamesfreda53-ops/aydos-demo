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

// Curated definitions for story-specific / classical words, names, and phrases
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
};

// Free Dictionary API fetcher with retry & stemming
async function fetchFromFreeDictionaryAPI(word: string): Promise<{
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
            const firstMeaning = entry.meanings[0];
            partOfSpeech = firstMeaning.partOfSpeech || "noun";

            if (Array.isArray(firstMeaning.synonyms)) {
              firstMeaning.synonyms.slice(0, 3).forEach((s: string) => synonymsSet.add(s));
            }

            if (Array.isArray(firstMeaning.definitions) && firstMeaning.definitions.length > 0) {
              const firstDef = firstMeaning.definitions[0];
              definition = firstDef.definition || "";
              example = firstDef.example || "";

              if (Array.isArray(firstDef.synonyms)) {
                firstDef.synonyms.slice(0, 3).forEach((s: string) => synonymsSet.add(s));
              }
            }
          }

          if (definition) {
            definition = definition.trim();
            if (!definition.endsWith(".")) definition += ".";
          } else {
            definition = `A meaningful word: ${capitalized}.`;
          }

          if (!example) {
            example = `The explorer used the word "${clean}" in the story.`;
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
      // Continue to next stem
    }
  }
  return null;
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

  // 3. POST /api/dictionary/batch-generate - Developer Button API to add story words
  app.post("/api/dictionary/batch-generate", async (req, res) => {
    const { words, storyContext } = req.body;

    if (!Array.isArray(words)) {
      res.status(400).json({ error: "Words array is required" });
      return;
    }

    try {
      // 1. Read existing dictionary file
      const currentTxt = readDictionaryFile();
      const existingDictionary = parseTxtOnServer(currentTxt);

      // 2. Filter out words that already exist (case-insensitive check to prevent duplicates)
      const newWordsToProcess: string[] = [];
      const alreadyExistingWords: string[] = [];

      for (const w of words) {
        if (!w || typeof w !== "string") continue;
        const clean = w.trim().replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, "");
        if (clean.length < 2) continue; // Ignore 1-letter noise

        const lower = clean.toLowerCase();
        if (existingDictionary[lower]) {
          alreadyExistingWords.push(clean);
        } else if (!newWordsToProcess.some((nw) => nw.toLowerCase() === lower)) {
          newWordsToProcess.push(clean);
        }
      }

      // If all words already exist, return early without duplicate creations!
      if (newWordsToProcess.length === 0) {
        res.json({
          success: true,
          addedCount: 0,
          alreadyExistingCount: alreadyExistingWords.length,
          totalCount: Object.keys(existingDictionary).length,
          message: "All words already exist in the shared local dictionary. No duplicates created.",
          wordsAdded: [],
          txtContent: currentTxt,
        });
        return;
      }

      // 3. Generate student-friendly definitions with Part of Speech & Example Sentences
      const ai = getAI();
      const newlyGeneratedEntries: ServerWordDef[] = [];

      for (const w of newWordsToProcess) {
        const lowerW = w.toLowerCase();
        
        // 1. Curated lexicon check
        if (CURATED_LEXICON[lowerW]) {
          newlyGeneratedEntries.push(CURATED_LEXICON[lowerW]);
          continue;
        }

        let entryResolved: ServerWordDef | null = null;

        // 2. Gemini generation if available
        if (ai) {
          try {
            const prompt = `You are a children's and student's educational dictionary builder.
Define the word "${w}" for elementary / middle school students.
${storyContext ? `Story context: "${storyContext}"` : ""}
Provide a clear, student-friendly definition, part of speech, approximate phonetic pronunciation, and a natural example sentence.`;

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
              entryResolved = {
                word: parsed.word,
                phonetic: parsed.phonetic || `/${lowerW}/`,
                partOfSpeech: parsed.partOfSpeech || "noun",
                definition: parsed.definition,
                example: parsed.example || `The reader noticed the word "${parsed.word}" in the story.`,
                synonyms: parsed.synonyms || [],
                funFact: parsed.funFact || undefined,
              };
            }
          } catch (aiErr) {
            console.warn(`Gemini lookup failed for ${w}, trying Free Dictionary API:`, aiErr);
          }
        }

        // 3. Free Dictionary API fallback
        if (!entryResolved) {
          try {
            const apiRes = await fetchFromFreeDictionaryAPI(w);
            if (apiRes) {
              entryResolved = apiRes;
            }
          } catch (apiErr) {
            console.warn(`Free Dictionary API error for ${w}:`, apiErr);
          }
        }

        // 4. Clean fallback if neither succeeded
        if (!entryResolved) {
          const capitalized = w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
          entryResolved = {
            word: capitalized,
            phonetic: `/${lowerW}/`,
            partOfSpeech: "vocabulary word",
            definition: `A meaningful word used to describe actions, feelings, or details in the story.`,
            example: `The reader carefully noticed the word "${w}" while exploring the story.`,
            synonyms: [],
          };
        }

        newlyGeneratedEntries.push(entryResolved);
      }

      // 4. Merge into shared dictionary
      for (const entry of newlyGeneratedEntries) {
        const key = entry.word.toLowerCase();
        existingDictionary[key] = entry;
      }

      // 5. Sort alphabetically and write to txt file
      const updatedTxt = formatTxtOnServer(existingDictionary);
      writeDictionaryFile(updatedTxt);

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
    const isPlaceholder = existing && (
      existing.definition.includes("An important vocabulary word:") ||
      existing.definition.includes("A featured vocabulary word:") ||
      existing.definition.includes("An expressive story word") ||
      existing.definition.includes("A meaningful story word") ||
      existing.example.includes("The student encountered the word") ||
      existing.example.includes("The explorer used the word") ||
      existing.example.includes("The reader carefully noticed the word")
    );

    if (existing && !isPlaceholder && existing.definition.length > 5) {
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
- example: a vivid, relatable example sentence showing how to use the word
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
            example: parsed.example || contextSentence || `The student read about "${parsed.word}".`,
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
        const apiRes = await fetchFromFreeDictionaryAPI(cleanWord);
        if (apiRes) {
          resolvedEntry = apiRes;
          source = "dictionary-api";
        }
      } catch (apiErr) {
        console.warn("Free Dictionary API failed:", apiErr);
      }
    }

    // Fallback if both failed
    if (!resolvedEntry) {
      const cap = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase();
      resolvedEntry = {
        word: cap,
        phonetic: `/${lower}/`,
        partOfSpeech: "vocabulary word",
        definition: `A meaningful story word used in the narrative.`,
        example: contextSentence || `The reader noticed the word "${cleanWord}" in the story.`,
        synonyms: [],
      };
      source = "fallback";
    }

    // Auto-save the new word into dictionary.txt so it immediately persists on disk!
    try {
      diskDict[lower] = resolvedEntry;
      writeDictionaryFile(formatTxtOnServer(diskDict));
    } catch (saveErr) {
      console.warn("Could not auto-save resolved word to dictionary file:", saveErr);
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
  });
}

startServer();
