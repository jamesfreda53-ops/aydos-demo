import React, { useState, useRef, useMemo } from "react";
import {
  Bookmark,
  Volume2,
  Edit3,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  X,
  Plus,
  RotateCcw,
  Trash2,
  Save,
  Download,
  Upload,
  Clock,
  Check,
  Calendar,
} from "lucide-react";
import { SavedWord, WordDefinition } from "../types";
import { audioEngine } from "../utils/audioPlayer";
import { getLoadedDictionary } from "../data/dictionary";
import { exportFlashcardsAsJSON, parseImportedFlashcards } from "../services/flashcardStorage";
import { AYDOS_LOGO_DATA_URI } from "../assets/logoBase64";
import {
  Rating,
  State,
  getFSRSCard,
  getFSRSRepeatOptions,
  applyFSRSRating,
  formatFSRSInterval,
  isCardDue,
  getStateName,
  getStateBadgeClass,
  getDeckStatistics,
} from "../services/fsrsService";

interface WordBankViewProps {
  savedWords: SavedWord[];
  onRemoveWord: (word: string) => void;
  onSaveWord?: (wordDef: WordDefinition) => void;
  onUpdateWord?: (oldWord: string, updatedWord: SavedWord) => void;
  onImportWords?: (importedCards: SavedWord[]) => void;
  onOpenDefinition: (wordDef: WordDefinition) => void;
  onClose: () => void;
}

export const WordBankView: React.FC<WordBankViewProps> = ({
  savedWords,
  onRemoveWord,
  onSaveWord,
  onUpdateWord,
  onImportWords,
  onOpenDefinition,
  onClose,
}) => {
  const [practiceMode, setPracticeMode] = useState(false);
  const [filterMode, setFilterMode] = useState<"due" | "all">("due");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [fsrsFeedback, setFsrsFeedback] = useState<{
    word: string;
    interval: string;
    ratingName: string;
    colorClass: string;
  } | null>(null);

  // Deck statistics calculated via FSRS
  const stats = useMemo(() => getDeckStatistics(savedWords), [savedWords]);

  // Filtered practice queue based on FSRS intervals or all cards
  const practiceQueue = useMemo(() => {
    if (filterMode === "due") {
      const dueCards = savedWords.filter((w) => isCardDue(getFSRSCard(w)));
      return dueCards;
    }
    return savedWords;
  }, [savedWords, filterMode]);

  // Safe index within active queue
  const safeCardIndex =
    practiceQueue.length > 0
      ? Math.min(currentCardIndex, practiceQueue.length - 1)
      : 0;
  const currentWord: SavedWord | undefined = practiceQueue[safeCardIndex];

  // FSRS calculations for current card
  const currentFSRSCard = useMemo(() => {
    if (!currentWord) return null;
    return getFSRSCard(currentWord);
  }, [currentWord]);

  const repeatOptions = useMemo(() => {
    if (!currentFSRSCard) return null;
    return getFSRSRepeatOptions(currentFSRSCard);
  }, [currentFSRSCard]);

  // Flashcard Editor Modal State
  const [editingCard, setEditingCard] = useState<SavedWord | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editForm, setEditForm] = useState({
    word: "",
    phonetic: "",
    partOfSpeech: "",
    definition: "",
    example: "",
  });

  const handleExportJSON = () => {
    exportFlashcardsAsJSON(savedWords, "flashcards.json");
  };

  const handleTriggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const cards = await parseImportedFlashcards(file);
      if (onImportWords) {
        onImportWords(cards);
        setImportNotice(`Imported ${cards.length} card(s) from ${file.name}`);
        setTimeout(() => setImportNotice(null), 3000);
      }
    } catch (err: any) {
      alert(err.message || "Failed to import flashcards JSON file.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSpeak = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    audioEngine.speakWord(word);
  };

  const handleNextCard = () => {
    setIsFlipped(false);
    if (practiceQueue.length > 0) {
      setCurrentCardIndex((prev) => (prev + 1) % practiceQueue.length);
    }
  };

  const handleRateCard = (rating: Rating, ratingLabel: string, colorClass: string) => {
    if (!currentWord || !onUpdateWord) return;

    // Use ts-fsrs via fsrsService to compute new interval, stability, and difficulty
    const { updatedWord, intervalText } = applyFSRSRating(currentWord, rating);

    onUpdateWord(currentWord.word, updatedWord);

    // Show instant feedback toast
    setFsrsFeedback({
      word: currentWord.word,
      interval: intervalText,
      ratingName: ratingLabel,
      colorClass,
    });
    setTimeout(() => setFsrsFeedback(null), 2400);

    // Prepare for next card
    setIsFlipped(false);
    if (filterMode === "due") {
      // In due queue, once rated the card is no longer due, so queue shrinks
      if (safeCardIndex >= practiceQueue.length - 1) {
        setCurrentCardIndex(0);
      }
    } else {
      handleNextCard();
    }
  };

  const handleOpenEdit = (e: React.MouseEvent, item: SavedWord) => {
    e.stopPropagation();
    setEditingCard(item);
    setIsAddingNew(false);
    setEditForm({
      word: item.word,
      phonetic: item.phonetic || "",
      partOfSpeech: item.partOfSpeech || "word",
      definition: item.definition,
      example: item.example || "",
    });
  };

  const handleOpenAddNew = () => {
    setEditingCard(null);
    setIsAddingNew(true);
    setEditForm({
      word: "",
      phonetic: "",
      partOfSpeech: "noun",
      definition: "",
      example: "",
    });
  };

  const handleRevertDefinition = () => {
    const wordKey = editForm.word.trim().toLowerCase();
    if (!wordKey) return;
    const dict = getLoadedDictionary();
    const standardDef = dict[wordKey];
    if (standardDef) {
      setEditForm((prev) => ({
        ...prev,
        phonetic: standardDef.phonetic || prev.phonetic,
        partOfSpeech: standardDef.partOfSpeech || prev.partOfSpeech,
        definition: standardDef.definition,
        example: standardDef.example || prev.example,
      }));
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.word.trim() || !editForm.definition.trim()) return;

    const trimmedWord = editForm.word.trim();
    const formattedWord =
      trimmedWord.charAt(0).toUpperCase() + trimmedWord.slice(1);

    const updatedData: SavedWord = {
      word: formattedWord,
      phonetic: editForm.phonetic.trim() || `/${trimmedWord.toLowerCase()}/`,
      partOfSpeech: editForm.partOfSpeech.trim() || "word",
      definition: editForm.definition.trim(),
      example:
        editForm.example.trim() ||
        `An example sentence for "${formattedWord}".`,
      savedAt: editingCard ? editingCard.savedAt : Date.now(),
      storyTitle: editingCard?.storyTitle || "Custom Vocabulary",
      slideNumber: editingCard?.slideNumber ?? 0,
      fsrsCard: editingCard?.fsrsCard,
    };

    if (isAddingNew) {
      if (onSaveWord) {
        onSaveWord(updatedData);
      }
    } else if (editingCard && onUpdateWord) {
      onUpdateWord(editingCard.word, updatedData);
    }

    setEditingCard(null);
    setIsAddingNew(false);
  };

  const handleDeleteCurrentEditing = () => {
    if (editingCard) {
      onRemoveWord(editingCard.word);
      setEditingCard(null);
      setIsAddingNew(false);
    }
  };

  return (
    <div
      id="word-bank-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        id="word-bank-container"
        className="w-full max-w-lg bg-[#0e1b45] rounded-3xl shadow-2xl border border-white/15 p-5 sm:p-6 max-h-[92vh] flex flex-col text-white relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <img
              src={AYDOS_LOGO_DATA_URI}
              alt="AYDOS Logo"
              className="w-8 h-8 rounded-full object-cover border border-white/20 shadow-xs"
            />
            <div>
              <h2 className="text-base font-bold text-white font-serif italic">
                My Word Bank
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Hidden file input for importing JSON */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Export JSON Button */}
            <button
              id="export-flashcards-json-btn"
              onClick={handleExportJSON}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-blue-200 hover:text-white text-xs font-medium transition-all active:scale-95 cursor-pointer"
              title="Export flashcards to JSON file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Export</span>
            </button>

            {/* Import JSON Button */}
            <button
              id="import-flashcards-json-btn"
              onClick={handleTriggerImport}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-blue-200 hover:text-white text-xs font-medium transition-all active:scale-95 cursor-pointer"
              title="Import flashcards from JSON file"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Import</span>
            </button>

            {/* Add Card Button */}
            <button
              id="add-custom-card-btn"
              onClick={handleOpenAddNew}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
              title="Add a custom flashcard"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>

            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-blue-200 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Import Notice */}
        {importNotice && (
          <div className="mt-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{importNotice}</span>
          </div>
        )}

        {/* FSRS Rating Feedback Toast */}
        {fsrsFeedback && (
          <div className="mt-2 px-3.5 py-2 rounded-xl bg-[#08102b] border border-white/20 text-xs flex items-center justify-between shadow-lg animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${fsrsFeedback.colorClass}`}>
                {fsrsFeedback.ratingName}
              </span>
              <span className="font-serif italic font-bold text-white">
                {fsrsFeedback.word}
              </span>
            </div>
            <span className="text-blue-200 text-[11px] font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-300" />
              Next review in {fsrsFeedback.interval}
            </span>
          </div>
        )}

        {/* FSRS Deck Overview Metrics Bar */}
        {savedWords.length > 0 && (
          <div className="mt-3 grid grid-cols-4 gap-1.5 bg-[#08102b] p-2 rounded-2xl border border-white/10 text-center">
            <div className="px-1 py-1 rounded-xl bg-white/5">
              <div className="text-xs font-bold text-amber-300 font-mono">
                {stats.dueCount}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-blue-200/70 font-semibold">
                Due
              </div>
            </div>
            <div className="px-1 py-1 rounded-xl bg-white/5">
              <div className="text-xs font-bold text-blue-300 font-mono">
                {stats.newCount}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-blue-200/70 font-semibold">
                New
              </div>
            </div>
            <div className="px-1 py-1 rounded-xl bg-white/5">
              <div className="text-xs font-bold text-purple-300 font-mono">
                {stats.learningCount}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-blue-200/70 font-semibold">
                Learning
              </div>
            </div>
            <div className="px-1 py-1 rounded-xl bg-white/5">
              <div className="text-xs font-bold text-emerald-300 font-mono">
                {stats.reviewCount}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-blue-200/70 font-semibold">
                Review
              </div>
            </div>
          </div>
        )}

        {/* Tab switch: List View vs Flashcards */}
        {savedWords.length > 0 && (
          <div className="flex items-center gap-1 mt-3 p-1 rounded-2xl bg-[#08102b] border border-white/10">
            <button
              onClick={() => setPracticeMode(false)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !practiceMode
                  ? "bg-white text-blue-950 shadow-xs font-bold"
                  : "text-blue-200 hover:text-white"
              }`}
            >
              Word List ({savedWords.length})
            </button>
            <button
              onClick={() => {
                setPracticeMode(true);
                setIsFlipped(false);
                setCurrentCardIndex(0);
                if (stats.dueCount > 0) {
                  setFilterMode("due");
                }
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                practiceMode
                  ? "bg-white text-blue-950 shadow-md shadow-white/20 font-bold"
                  : "text-blue-200 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Study
              {stats.dueCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-blue-950 font-black">
                  {stats.dueCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto mt-3 pr-1">
          {savedWords.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center mb-3 border border-white/20">
                <Bookmark className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-neutral-100 font-serif italic">
                No words saved yet
              </h3>
              <p className="text-xs text-blue-200/70 max-w-xs mt-1 leading-relaxed">
                Tap any word in a story to save it, or click the "+ Add" button above to create custom flashcards!
              </p>
              <button
                onClick={handleOpenAddNew}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-blue-950 text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add First Flashcard
              </button>
            </div>
          ) : practiceMode ? (
            /* Flashcard Practice Mode */
            <div className="py-1 flex flex-col items-center">
              {/* Queue mode selector pills */}
              <div className="w-full flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-1 bg-[#08102b] p-0.5 rounded-xl border border-white/10 text-[11px]">
                  <button
                    onClick={() => {
                      setFilterMode("due");
                      setIsFlipped(false);
                      setCurrentCardIndex(0);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      filterMode === "due"
                        ? "bg-amber-400 text-blue-950 shadow-xs"
                        : "text-blue-200 hover:text-white"
                    }`}
                  >
                    Due ({stats.dueCount})
                  </button>
                  <button
                    onClick={() => {
                      setFilterMode("all");
                      setIsFlipped(false);
                      setCurrentCardIndex(0);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      filterMode === "all"
                        ? "bg-white/20 text-white shadow-xs"
                        : "text-blue-200 hover:text-white"
                    }`}
                  >
                    All Deck ({savedWords.length})
                  </button>
                </div>

                {practiceQueue.length > 0 && (
                  <span className="text-xs text-blue-200 font-mono">
                    {safeCardIndex + 1} / {practiceQueue.length}
                  </span>
                )}
              </div>

              {practiceQueue.length === 0 ? (
                /* All Caught Up View */
                <div className="w-full py-10 px-6 rounded-3xl bg-[#08102b] border border-white/10 text-center flex flex-col items-center justify-center my-3">
                  <div className="w-12 h-12 rounded-full bg-white text-blue-950 flex items-center justify-center mb-3 shadow-md">
                    <Check className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <h4 className="text-base font-bold text-white font-serif italic">
                    All caught up for now!
                  </h4>
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => {
                        setFilterMode("all");
                        setIsFlipped(false);
                        setCurrentCardIndex(0);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-100 text-blue-950 text-xs font-bold transition-all cursor-pointer shadow-md"
                    >
                      Practice
                    </button>
                    <button
                      onClick={() => setPracticeMode(false)}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-medium transition-all cursor-pointer"
                    >
                      View Word List
                    </button>
                  </div>
                </div>
              ) : currentWord && currentFSRSCard ? (
                <>
                  {/* Flippable card */}
                  <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="w-full aspect-4/3 max-h-[300px] rounded-3xl p-5 sm:p-6 flex flex-col items-center justify-between text-center cursor-pointer border border-white/20 bg-gradient-to-br from-[#0b1536] via-[#16275c] to-[#08102b] shadow-2xl transition-all active:scale-98 relative overflow-hidden"
                  >
                    {/* Background glow accent */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-40 h-40 rounded-full bg-blue-400/15 blur-3xl" />
                    </div>

                    {/* Top status line */}
                    <div className="relative z-10 w-full flex items-center justify-end text-[10px]">
                      <div className="flex items-center gap-1.5 text-blue-200/70 font-mono">
                        <span>Reps: {currentFSRSCard.reps}</span>
                        {currentFSRSCard.stability > 0 && (
                          <span>
                            • S: {currentFSRSCard.stability >= 1
                              ? `${Math.round(currentFSRSCard.stability)}d`
                              : `${(currentFSRSCard.stability * 24).toFixed(0)}h`}
                          </span>
                        )}
                      </div>
                    </div>

                    {!isFlipped ? (
                      /* Front of card */
                      <div className="relative z-10 my-auto">
                        <h3 className="text-3xl sm:text-4xl font-bold text-white mt-2 font-serif italic">
                          {currentWord.word}
                        </h3>
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <span className="text-sm font-mono text-blue-100">
                            {currentWord.phonetic}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-blue-200 border border-white/15 font-mono">
                            {currentWord.partOfSpeech}
                          </span>
                          <button
                            onClick={(e) => handleSpeak(e, currentWord.word)}
                            className="p-1 rounded-full text-blue-200 hover:text-white hover:bg-white/10"
                            title="Hear pronunciation"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Back of card (Definition & Example) */
                      <div className="relative z-10 space-y-2.5 my-auto max-h-full overflow-y-auto px-2">
                        <span className="text-[10px] uppercase tracking-widest text-blue-200/80 font-bold">
                          Definition
                        </span>
                        <p className="text-base sm:text-lg font-serif italic text-white leading-relaxed">
                          "{currentWord.definition}"
                        </p>
                        {currentWord.example && (
                          <p className="text-xs font-serif text-blue-100/90 italic pt-1 border-t border-white/10">
                            Example: {currentWord.example}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* FSRS Rating Buttons or Flip Prompt */}
                  <div className="w-full mt-3">
                    {isFlipped && repeatOptions ? (
                      /* 4-Grade Rating Buttons */
                      <div className="grid grid-cols-4 gap-2 animate-in fade-in duration-150">
                        {/* Again */}
                        <button
                          onClick={() =>
                            handleRateCard(
                              Rating.Again,
                              "Again",
                              "bg-rose-500/20 text-rose-300 border-rose-500/40"
                            )
                          }
                          className="py-2.5 px-2 rounded-2xl bg-rose-950/50 hover:bg-rose-900/70 border border-rose-500/40 text-rose-200 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-sm"
                        >
                          <span className="text-xs font-bold text-white">Again</span>
                        </button>

                        {/* Hard */}
                        <button
                          onClick={() =>
                            handleRateCard(
                              Rating.Hard,
                              "Hard",
                              "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            )
                          }
                          className="py-2.5 px-2 rounded-2xl bg-amber-950/50 hover:bg-amber-900/70 border border-amber-500/40 text-amber-200 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-sm"
                        >
                          <span className="text-xs font-bold text-white">Hard</span>
                        </button>

                        {/* Good */}
                        <button
                          onClick={() =>
                            handleRateCard(
                              Rating.Good,
                              "Good",
                              "bg-sky-500/20 text-sky-300 border-sky-500/40"
                            )
                          }
                          className="py-2.5 px-2 rounded-2xl bg-sky-950/50 hover:bg-sky-900/70 border border-sky-500/40 text-sky-200 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-sm"
                        >
                          <span className="text-xs font-bold text-white">Good</span>
                        </button>

                        {/* Easy */}
                        <button
                          onClick={() =>
                            handleRateCard(
                              Rating.Easy,
                              "Easy",
                              "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            )
                          }
                          className="py-2.5 px-2 rounded-2xl bg-emerald-950/50 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-200 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-sm"
                        >
                          <span className="text-xs font-bold text-white">Easy</span>
                        </button>
                      </div>
                    ) : (
                      /* Not flipped yet - Action bar */
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsFlipped(true)}
                          className="flex-1 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-blue-950 text-xs font-bold flex items-center justify-center shadow-md transition-all cursor-pointer active:scale-98"
                        >
                          Show Answer
                        </button>
                        <button
                          onClick={handleNextCard}
                          className="px-4 py-2.5 rounded-xl bg-[#08102b] hover:bg-[#101e46] text-white border border-white/15 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          title="Skip to next card"
                        >
                          Skip <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            /* List View */
            <div className="space-y-2">
              {savedWords.map((item) => (
                <div
                  key={item.word}
                    onClick={() => onOpenDefinition(item)}
                    className="p-3.5 rounded-2xl bg-[#08102b] border border-white/10 hover:border-white/30 cursor-pointer flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-base text-white font-serif">
                          {item.word}
                        </h4>
                        <span className="text-xs text-blue-200 font-mono">
                          {item.phonetic}
                        </span>
                      </div>
                      <p className="text-xs text-blue-200/80 truncate mt-0.5 font-serif italic">
                        {item.definition}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => handleSpeak(e, item.word)}
                        className="p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 cursor-pointer"
                        title="Pronounce"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      {/* Pen Edit Button */}
                      <button
                        onClick={(e) => handleOpenEdit(e, item)}
                        className="p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 cursor-pointer"
                        title="Edit flashcard definition"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Flashcard Editor / Add Card Modal Drawer */}
        {(editingCard || isAddingNew) && (
          <div
            className="absolute inset-0 bg-[#0a1332]/98 backdrop-blur-md rounded-3xl p-5 sm:p-6 z-20 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold font-serif italic text-white">
                  {isAddingNew ? "Add Flashcard" : `Edit Flashcard: ${editingCard?.word}`}
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditingCard(null);
                  setIsAddingNew(false);
                }}
                className="p-1.5 rounded-full hover:bg-white/10 text-blue-200 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto space-y-3.5 py-3 pr-1">
              {/* Word Input */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-blue-200">
                  Word
                </label>
                <input
                  type="text"
                  required
                  value={editForm.word}
                  onChange={(e) =>
                    setEditForm({ ...editForm, word: e.target.value })
                  }
                  placeholder="e.g. Labyrinth"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1b45] border border-white/20 text-white text-sm focus:outline-hidden focus:border-white"
                />
              </div>

              {/* Phonetic & Part of Speech */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-blue-200">
                    Phonetic (Optional)
                  </label>
                  <input
                    type="text"
                    value={editForm.phonetic}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phonetic: e.target.value })
                    }
                    placeholder="/ˈlæb.ə.rɪnθ/"
                    className="w-full px-3 py-2 rounded-xl bg-[#0e1b45] border border-white/20 text-white text-xs font-mono focus:outline-hidden focus:border-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-blue-200">
                    Part of Speech
                  </label>
                  <input
                    type="text"
                    value={editForm.partOfSpeech}
                    onChange={(e) =>
                      setEditForm({ ...editForm, partOfSpeech: e.target.value })
                    }
                    placeholder="noun / verb / adj"
                    className="w-full px-3 py-2 rounded-xl bg-[#0e1b45] border border-white/20 text-white text-xs focus:outline-hidden focus:border-white"
                  />
                </div>
              </div>

              {/* Definition */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-blue-200">
                    Definition
                  </label>
                  {/* Revert Button */}
                  <button
                    type="button"
                    onClick={handleRevertDefinition}
                    className="flex items-center gap-1 text-[11px] text-blue-300 hover:text-white transition-colors cursor-pointer"
                    title="Restore standard definition from dictionary.txt"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Revert to Dictionary</span>
                  </button>
                </div>
                <textarea
                  required
                  rows={3}
                  value={editForm.definition}
                  onChange={(e) =>
                    setEditForm({ ...editForm, definition: e.target.value })
                  }
                  placeholder="Enter a student-friendly definition..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1b45] border border-white/20 text-white text-xs sm:text-sm font-serif leading-relaxed focus:outline-hidden focus:border-white"
                />
              </div>

              {/* Example Sentence */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-blue-200">
                  Example Sentence (Optional)
                </label>
                <textarea
                  rows={2}
                  value={editForm.example}
                  onChange={(e) =>
                    setEditForm({ ...editForm, example: e.target.value })
                  }
                  placeholder="Example sentence using the word..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1b45] border border-white/20 text-white text-xs font-serif italic focus:outline-hidden focus:border-white"
                />
              </div>

              {/* Bottom Actions inside Editor */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10 gap-2">
                {!isAddingNew && editingCard ? (
                  <button
                    type="button"
                    onClick={handleDeleteCurrentEditing}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-bold cursor-pointer transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Card</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCard(null);
                      setIsAddingNew(false);
                    }}
                    className="px-3.5 py-2 rounded-xl hover:bg-white/10 text-blue-200 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-blue-950 text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Card</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
