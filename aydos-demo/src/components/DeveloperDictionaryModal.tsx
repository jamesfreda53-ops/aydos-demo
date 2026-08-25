import React, { useState, useEffect, useMemo } from "react";
import {
  Code,
  Sparkles,
  BookOpen,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  RotateCcw,
  Search,
  Plus,
  X,
  Layers,
  ArrowRight,
  Database,
  Check,
} from "lucide-react";
import { WordDefinition } from "../types";
import {
  extractWordsFromStory,
  parseDictionaryTxt,
  formatDictionaryTxt,
} from "../utils/dictionaryTxt";
import {
  loadSharedDictionary,
  batchAddWordsToDictionary,
  saveDictionaryTxtToServer,
  getLoadedDictionary,
  isPlaceholderDefinition,
  repairDictionaryPlaceholders,
} from "../data/dictionary";

interface DeveloperDictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyData: {
    title: string;
    subtitle?: string;
    author?: string;
    summary?: string;
    titleSlide?: { introParagraph?: string };
    slides: Array<{ paragraph: string; keyWords?: string[] }>;
  };
  onDictionaryUpdated?: (totalCount: number) => void;
}

export const DeveloperDictionaryModal: React.FC<DeveloperDictionaryModalProps> = ({
  isOpen,
  onClose,
  storyData,
  onDictionaryUpdated,
}) => {
  // Tabs: 'sync' | 'txt' | 'browse'
  const [activeTab, setActiveTab] = useState<"sync" | "txt" | "browse">("sync");

  // Shared Dictionary State
  const [dictionary, setDictionary] = useState<Record<string, WordDefinition>>({});
  const [rawTxt, setRawTxt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Batch Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [filterMode, setFilterMode] = useState<"all" | "new" | "existing">("new");
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  // Manual word addition state
  const [newWordInput, setNewWordInput] = useState("");
  const [newPosInput, setNewPosInput] = useState("noun");
  const [newDefInput, setNewDefInput] = useState("");
  const [newExInput, setNewExInput] = useState("");

  // Load current dictionary on open
  useEffect(() => {
    if (isOpen) {
      loadCurrentDictionary();
    }
  }, [isOpen]);

  const loadCurrentDictionary = async () => {
    setIsLoading(true);
    try {
      const dict = await loadSharedDictionary(true);
      setDictionary(dict);
      const res = await fetch("/api/dictionary/file");
      if (res.ok) {
        const data = await res.json();
        if (data.txt) {
          setRawTxt(data.txt);
        } else {
          setRawTxt(formatDictionaryTxt(dict));
        }
      } else {
        setRawTxt(formatDictionaryTxt(dict));
      }
    } catch (err: any) {
      console.error("Failed to load dictionary file:", err);
      const dict = getLoadedDictionary();
      setDictionary(dict);
      setRawTxt(formatDictionaryTxt(dict));
    } finally {
      setIsLoading(false);
    }
  };

  // Extract words from the current story
  const storyWords = useMemo(() => {
    return extractWordsFromStory(storyData);
  }, [storyData]);

  // Find all placeholder words currently in dictionary
  const placeholderWords = useMemo(() => {
    return Object.keys(dictionary).filter((k) => isPlaceholderDefinition(dictionary[k]));
  }, [dictionary]);

  // Split into existing rich words vs. new words (or words with placeholders that need enrichment)
  const { existingWords, newWords } = useMemo(() => {
    const existing: string[] = [];
    const newW: string[] = [];

    for (const w of storyWords) {
      const lower = w.toLowerCase();
      const def = dictionary[lower];
      if (def && !isPlaceholderDefinition(def)) {
        existing.push(w);
      } else {
        newW.push(w);
      }
    }

    return { existingWords: existing, newWords: newW };
  }, [storyWords, dictionary]);

  // Filtered list for display
  const displayedStoryWords = useMemo(() => {
    let list =
      filterMode === "new"
        ? newWords
        : filterMode === "existing"
        ? existingWords
        : storyWords;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((w) => w.toLowerCase().includes(q));
    }

    return list;
  }, [filterMode, newWords, existingWords, storyWords, searchQuery]);

  // Browse tab dictionary list
  const browseWordsList = useMemo(() => {
    const keys = Object.keys(dictionary).sort((a, b) => a.localeCompare(b));
    if (!searchQuery.trim()) return keys;
    const q = searchQuery.toLowerCase();
    return keys.filter(
      (k) =>
        k.includes(q) ||
        dictionary[k]?.definition?.toLowerCase().includes(q) ||
        dictionary[k]?.partOfSpeech?.toLowerCase().includes(q)
    );
  }, [dictionary, searchQuery]);

  // Developer Batch Action: Generate & Add to Dictionary
  const handleBatchGenerate = async (forceReenrich = false) => {
    const targetWords = forceReenrich || newWords.length === 0 ? storyWords : newWords;
    if (targetWords.length === 0) {
      setStatusMessage({
        type: "info",
        text: "No words found in this story to add.",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(20);
    setStatusMessage(null);

    try {
      const combinedContext = `${storyData.title}. ${
        storyData.subtitle || ""
      }. ${storyData.slides.map((s) => s.paragraph).join(" ")}`;

      setGenerationProgress(50);

      const result = await batchAddWordsToDictionary(targetWords, combinedContext, forceReenrich);

      setGenerationProgress(100);

      if (result.success) {
        if (result.addedCount > 0) {
          setStatusMessage({
            type: "success",
            text: `Successfully added ${result.addedCount} words with student definitions, parts of speech, and example sentences to dictionary.txt! (Total: ${result.totalCount} words)`,
          });
        } else {
          setStatusMessage({
            type: "info",
            text: `All ${result.alreadyExistingCount || storyWords.length} story words already exist in dictionary.txt with complete definitions. (Total: ${result.totalCount} words)`,
          });
        }

        if (result.txtContent) {
          setRawTxt(result.txtContent);
          const parsed = parseDictionaryTxt(result.txtContent);
          setDictionary(parsed);
        } else {
          await loadCurrentDictionary();
        }

        if (onDictionaryUpdated) {
          onDictionaryUpdated(result.totalCount);
        }
      }
    } catch (err: any) {
      console.error("Batch generate error:", err);
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to generate dictionary definitions.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Developer Repair Action: Upgrades all placeholder definitions across the whole dictionary
  const handleRepairPlaceholders = async () => {
    setIsRepairing(true);
    setStatusMessage({
      type: "info",
      text: "Scanning dictionary and generating student-friendly definitions for placeholder entries...",
    });

    try {
      const result = await repairDictionaryPlaceholders();
      if (result.success) {
        if (result.repairedCount > 0) {
          setStatusMessage({
            type: "success",
            text: `Polished & upgraded ${result.repairedCount} placeholder definitions in dictionary.txt! (Total: ${result.totalWords} words)`,
          });
        } else {
          setStatusMessage({
            type: "success",
            text: `All ${result.totalWords} words in dictionary.txt already have rich, complete definitions! No placeholders found.`,
          });
        }

        if (result.txt) {
          setRawTxt(result.txt);
          const parsed = parseDictionaryTxt(result.txt);
          setDictionary(parsed);
        } else {
          await loadCurrentDictionary();
        }

        if (onDictionaryUpdated) {
          onDictionaryUpdated(result.totalWords);
        }
      }
    } catch (err: any) {
      console.error("Repair placeholders error:", err);
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to repair placeholder definitions.",
      });
    } finally {
      setIsRepairing(false);
    }
  };

  // Save manual edits to TXT file
  const handleSaveTxt = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const result = await saveDictionaryTxtToServer(rawTxt);
      if (result.success) {
        setRawTxt(result.txt);
        const parsed = parseDictionaryTxt(result.txt);
        setDictionary(parsed);
        setStatusMessage({
          type: "success",
          text: `Saved dictionary.txt successfully! Alphabetically sorted (${result.wordsCount} total words).`,
        });
        if (onDictionaryUpdated) {
          onDictionaryUpdated(result.wordsCount);
        }
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to save dictionary.txt file.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Copy TXT to clipboard
  const handleCopyTxt = () => {
    navigator.clipboard.writeText(rawTxt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download TXT file
  const handleDownloadTxt = () => {
    const blob = new Blob([rawTxt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dictionary.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Add single manual word
  const handleAddSingleWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWordInput.trim() || !newDefInput.trim()) return;

    const wordCapitalized =
      newWordInput.trim().charAt(0).toUpperCase() +
      newWordInput.trim().slice(1).toLowerCase();
    const key = wordCapitalized.toLowerCase();

    const updatedDict = {
      ...dictionary,
      [key]: {
        word: wordCapitalized,
        phonetic: `/${key}/`,
        partOfSpeech: newPosInput.trim() || "noun",
        definition: newDefInput.trim(),
        example:
          newExInput.trim() ||
          `The student learned how to use the word "${wordCapitalized}".`,
        source: "local-file" as const,
      },
    };

    const newFormattedTxt = formatDictionaryTxt(updatedDict);
    setRawTxt(newFormattedTxt);
    setDictionary(updatedDict);

    // Save to server
    try {
      await saveDictionaryTxtToServer(newFormattedTxt);
      setStatusMessage({
        type: "success",
        text: `Word "${wordCapitalized}" added to local dictionary!`,
      });
      setNewWordInput("");
      setNewDefInput("");
      setNewExInput("");
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to save word to server.",
      });
    }
  };

  if (!isOpen) return null;

  const totalDictionaryWords = Object.keys(dictionary).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#111111] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-neutral-100">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#141414]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-serif italic">
                  Developer: Shared Local Dictionary
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-orange-400/10 text-orange-300 border border-orange-400/20 text-[10px] font-mono font-bold">
                  dictionary.txt
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono">
                {totalDictionaryWords} Alphabetized Words • All Stories Share This Dictionary
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1e1e1e] hover:bg-[#2a2a2a] text-neutral-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Toast Banner */}
        {statusMessage && (
          <div
            className={`px-5 py-2.5 text-xs flex items-center justify-between border-b ${
              statusMessage.type === "success"
                ? "bg-emerald-950/70 border-emerald-500/30 text-emerald-300"
                : statusMessage.type === "error"
                ? "bg-red-950/70 border-red-500/30 text-red-300"
                : "bg-blue-950/70 border-blue-500/30 text-blue-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : statusMessage.type === "error" ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 shrink-0" />
              )}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-neutral-400 hover:text-white text-xs underline cursor-pointer ml-3"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 py-2 bg-[#0e0e0e] border-b border-white/5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("sync")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "sync"
                  ? "bg-orange-400 text-neutral-950 shadow-md shadow-orange-500/20"
                  : "text-neutral-400 hover:text-white bg-[#161616]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Add Story Words ({newWords.length} New)</span>
            </button>

            <button
              onClick={() => setActiveTab("txt")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "txt"
                  ? "bg-orange-400 text-neutral-950 shadow-md shadow-orange-500/20"
                  : "text-neutral-400 hover:text-white bg-[#161616]"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Edit dictionary.txt ({totalDictionaryWords})</span>
            </button>

            <button
              onClick={() => setActiveTab("browse")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "browse"
                  ? "bg-orange-400 text-neutral-950 shadow-md shadow-orange-500/20"
                  : "text-neutral-400 hover:text-white bg-[#161616]"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Browse All Definitions</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <button
              onClick={loadCurrentDictionary}
              disabled={isLoading}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1a1a1a] hover:bg-[#242424] text-neutral-300 text-xs transition-all cursor-pointer"
              title="Reload from disk"
            >
              <RotateCcw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
              <span>Reload</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: SYNC & ADD STORY WORDS */}
          {activeTab === "sync" && (
            <div className="space-y-5">
              {/* Summary Stats Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[#171717] border border-white/5">
                  <span className="text-[11px] text-neutral-400 block font-mono">
                    Total Words in Story
                  </span>
                  <div className="text-2xl font-bold text-white mt-1">
                    {storyWords.length}
                  </div>
                  <span className="text-[10px] text-neutral-500">
                    Title, slides, keywords & quiz
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#171717] border border-white/5">
                  <span className="text-[11px] text-emerald-400 block font-mono">
                    Already in Shared Dictionary
                  </span>
                  <div className="text-2xl font-bold text-emerald-300 mt-1">
                    {existingWords.length}
                  </div>
                  <span className="text-[10px] text-neutral-500">
                    Skipped (No duplicate entries)
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#171717] border border-white/5">
                  <span className="text-[11px] text-orange-400 block font-mono">
                    New Words to Add
                  </span>
                  <div className="text-2xl font-bold text-orange-400 mt-1">
                    {newWords.length}
                  </div>
                  <span className="text-[10px] text-neutral-500">
                    Will generate student definitions
                  </span>
                </div>
              </div>

              {/* Placeholder Detection & Upgrade Banner */}
              {placeholderWords.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-amber-200">
                        {placeholderWords.length} Words Have Placeholder Definitions
                      </div>
                      <p className="text-[11px] text-amber-300/80 font-serif leading-relaxed">
                        Upgrade all placeholder entries with student-friendly definitions, proper parts of speech, and authentic example sentences.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleRepairPlaceholders}
                    disabled={isRepairing || isGenerating}
                    className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    {isRepairing ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        <span>Upgrading Definitions...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Upgrade {placeholderWords.length} Placeholders</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Developer Action Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1a140f] to-[#141414] border border-orange-500/20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white font-serif italic flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-orange-400" />
                      Add Words to in-Game Dictionary (dictionary.txt)
                    </h3>
                    <p className="text-xs text-neutral-300 font-serif leading-relaxed mt-1">
                      Generates student-friendly definitions, parts of speech (noun, verb, adjective, etc.), and relatable example sentences. Alphabetically merged into <span className="font-mono text-orange-300 font-bold">dictionary.txt</span>.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {newWords.length === 0 && storyWords.length > 0 && (
                      <button
                        onClick={() => handleBatchGenerate(true)}
                        disabled={isGenerating}
                        className="shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 text-neutral-200 text-xs font-semibold border border-white/10 transition-all cursor-pointer"
                        title="Force re-generate and update definitions for all words in this story"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                        <span>Force Re-enrich All {storyWords.length} Story Words</span>
                      </button>
                    )}

                    <button
                      id="dev-batch-generate-btn"
                      onClick={() => handleBatchGenerate(false)}
                      disabled={isGenerating || newWords.length === 0}
                      className="shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-orange-400 hover:bg-orange-500 disabled:opacity-50 disabled:pointer-events-none text-neutral-950 text-xs font-bold shadow-lg shadow-orange-500/20 transition-all active:scale-95 cursor-pointer"
                    >
                      {isGenerating ? (
                        <>
                          <RotateCcw className="w-4 h-4 animate-spin" />
                          <span>Generating Definitions ({newWords.length} Words)...</span>
                        </>
                      ) : newWords.length === 0 ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>All Story Words Already In Dictionary</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Add {newWords.length} Words to dictionary.txt</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {isGenerating && (
                  <div className="w-full bg-[#202020] rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-orange-400 h-full transition-all duration-500"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Word Explorer & Filter */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setFilterMode("new")}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        filterMode === "new"
                          ? "bg-orange-400/20 text-orange-300 border border-orange-400/30"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      New Words ({newWords.length})
                    </button>
                    <button
                      onClick={() => setFilterMode("existing")}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        filterMode === "existing"
                          ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      Already in Dictionary ({existingWords.length})
                    </button>
                    <button
                      onClick={() => setFilterMode("all")}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        filterMode === "all"
                          ? "bg-white/10 text-white border border-white/20"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      All Words ({storyWords.length})
                    </button>
                  </div>

                  {/* Search bar */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter story words..."
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-[#181818] border border-white/10 text-xs text-neutral-200 focus:outline-hidden focus:ring-1 focus:ring-orange-400"
                    />
                  </div>
                </div>

                {/* Word Chips Grid */}
                <div className="p-4 rounded-2xl bg-[#141414] border border-white/5 max-h-60 overflow-y-auto">
                  {displayedStoryWords.length === 0 ? (
                    <div className="text-center py-6 text-xs text-neutral-500">
                      No words match the selected filter.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {displayedStoryWords.map((word) => {
                        const isExisting = Boolean(dictionary[word.toLowerCase()]);
                        const def = dictionary[word.toLowerCase()];
                        return (
                          <div
                            key={word}
                            className={`group relative flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                              isExisting
                                ? "bg-emerald-950/40 text-emerald-300 border border-emerald-500/20"
                                : "bg-orange-950/40 text-orange-300 border border-orange-500/20 font-bold"
                            }`}
                            title={
                              isExisting
                                ? `${word} (${def?.partOfSpeech}): ${def?.definition}`
                                : `${word} (New - not in local dictionary)`
                            }
                          >
                            <span>{word}</span>
                            {isExisting && (
                              <Check className="w-3 h-3 text-emerald-400 inline" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ALPHABETICALLY ORDERED DICTIONARY .TXT FILE EDITOR */}
          {activeTab === "txt" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#171717] border border-white/5">
                <div>
                  <h4 className="text-xs font-bold text-white font-mono">
                    File Location: public/dictionary.txt
                  </h4>
                  <p className="text-[11px] text-neutral-400 font-serif">
                    Alphabetically sorted. Format: <code className="text-orange-300">WORD [phonetic] (part of speech)</code>, followed by <code className="text-orange-300">DEF:</code> and <code className="text-orange-300">EX:</code>.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyTxt}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#222222] hover:bg-[#2a2a2a] text-xs text-neutral-200 transition-all cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copied ? "Copied!" : "Copy TXT"}</span>
                  </button>

                  <button
                    onClick={handleDownloadTxt}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#222222] hover:bg-[#2a2a2a] text-xs text-neutral-200 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>

                  <button
                    id="save-txt-file-btn"
                    onClick={handleSaveTxt}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-orange-400 hover:bg-orange-500 text-neutral-950 text-xs font-bold shadow-md shadow-orange-500/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save TXT to Disk</span>
                  </button>
                </div>
              </div>

              {/* TXT Editor Textarea */}
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a]">
                <textarea
                  rows={18}
                  value={rawTxt}
                  onChange={(e) => setRawTxt(e.target.value)}
                  className="w-full p-4 bg-transparent text-xs sm:text-sm text-neutral-200 font-mono leading-relaxed focus:outline-hidden focus:ring-1 focus:ring-orange-400 select-text"
                  spellCheck={false}
                />
              </div>
            </div>
          )}

          {/* TAB 3: BROWSE ALL DEFINITIONS */}
          {activeTab === "browse" && (
            <div className="space-y-4">
              {/* Search & Add New Word form */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search words, definitions, or parts of speech..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#161616] border border-white/10 text-xs text-neutral-200 focus:outline-hidden focus:ring-1 focus:ring-orange-400"
                  />
                </div>
                <span className="text-xs font-mono text-neutral-400">
                  {browseWordsList.length} of {totalDictionaryWords} words
                </span>
              </div>

              {/* Quick Add Custom Word Card */}
              <form
                onSubmit={handleAddSingleWord}
                className="p-4 rounded-2xl bg-[#161616] border border-white/5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 font-serif italic">
                    <Plus className="w-3.5 h-3.5 text-orange-400" />
                    Add Individual Word Definition
                  </span>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-xl bg-orange-400 hover:bg-orange-500 text-neutral-950 text-xs font-bold transition-all cursor-pointer"
                  >
                    Add Word
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newWordInput}
                    onChange={(e) => setNewWordInput(e.target.value)}
                    placeholder="Word (e.g., Dragonfly)"
                    className="px-3 py-1.5 rounded-xl bg-[#101010] border border-white/10 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-orange-400 font-mono"
                    required
                  />
                  <input
                    type="text"
                    value={newPosInput}
                    onChange={(e) => setNewPosInput(e.target.value)}
                    placeholder="Part of Speech (e.g., noun)"
                    className="px-3 py-1.5 rounded-xl bg-[#101010] border border-white/10 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-orange-400"
                  />
                  <input
                    type="text"
                    value={newExInput}
                    onChange={(e) => setNewExInput(e.target.value)}
                    placeholder="Example Sentence..."
                    className="px-3 py-1.5 rounded-xl bg-[#101010] border border-white/10 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-orange-400 font-serif italic"
                  />
                </div>
                <input
                  type="text"
                  value={newDefInput}
                  onChange={(e) => setNewDefInput(e.target.value)}
                  placeholder="Student-friendly definition..."
                  className="w-full px-3 py-1.5 rounded-xl bg-[#101010] border border-white/10 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-orange-400 font-serif"
                  required
                />
              </form>

              {/* Alphabetical Word Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {browseWordsList.map((key) => {
                  const def = dictionary[key];
                  return (
                    <div
                      key={key}
                      className="p-4 rounded-2xl bg-[#141414] border border-white/5 hover:border-orange-500/30 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white font-serif italic">
                            {def.word || key}
                          </h4>
                          {def.phonetic && (
                            <span className="text-[11px] text-neutral-400 font-mono">
                              {def.phonetic}
                            </span>
                          )}
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-orange-300 font-medium capitalize">
                          {def.partOfSpeech || "word"}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-300 font-serif leading-relaxed">
                        {def.definition}
                      </p>

                      {def.example && (
                        <p className="text-[11px] text-neutral-400 font-serif italic border-l-2 border-orange-500/40 pl-2.5 py-0.5">
                          "{def.example}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#141414] flex items-center justify-between text-xs text-neutral-400">
          <span className="font-mono text-[11px]">
            Shared local file: <span className="text-orange-400">/public/dictionary.txt</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#222222] hover:bg-[#2a2a2a] text-white text-xs font-semibold transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
