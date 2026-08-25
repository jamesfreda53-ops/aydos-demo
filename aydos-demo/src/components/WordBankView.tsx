import React, { useState } from "react";
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
} from "lucide-react";
import { SavedWord, WordDefinition } from "../types";
import { audioEngine } from "../utils/audioPlayer";
import { getLoadedDictionary } from "../data/dictionary";

interface WordBankViewProps {
  savedWords: SavedWord[];
  onRemoveWord: (word: string) => void;
  onSaveWord?: (wordDef: WordDefinition) => void;
  onUpdateWord?: (oldWord: string, updatedWord: SavedWord) => void;
  onOpenDefinition: (wordDef: WordDefinition) => void;
  onClose: () => void;
}

export const WordBankView: React.FC<WordBankViewProps> = ({
  savedWords,
  onRemoveWord,
  onSaveWord,
  onUpdateWord,
  onOpenDefinition,
  onClose,
}) => {
  const [practiceMode, setPracticeMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredWords, setMasteredWords] = useState<string[]>([]);

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

  const handleSpeak = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    audioEngine.speakWord(word);
  };

  const handleNextCard = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev + 1) % Math.max(1, savedWords.length));
  };

  const handleMarkMastered = (word: string) => {
    if (!masteredWords.includes(word)) {
      setMasteredWords([...masteredWords, word]);
    }
    handleNextCard();
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
        className="w-full max-w-lg bg-[#0e1b45] rounded-3xl shadow-2xl border border-white/15 p-5 sm:p-6 max-h-[90vh] flex flex-col text-white relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-full bg-white/10 text-white border border-white/15">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-serif italic">
                My Word Bank
              </h2>
              <p className="text-[10px] uppercase tracking-widest text-blue-200/70 font-bold">
                {savedWords.length} words
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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

        {/* Tab switch: List View vs Flashcards */}
        {savedWords.length > 0 && (
          <div className="flex items-center gap-1 mt-4 p-1 rounded-2xl bg-[#08102b] border border-white/10">
            <button
              onClick={() => setPracticeMode(false)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !practiceMode
                  ? "bg-white text-blue-950 shadow-xs font-bold"
                  : "text-blue-200 hover:text-white"
              }`}
            >
              Word List
            </button>
            <button
              onClick={() => {
                setPracticeMode(true);
                setIsFlipped(false);
                setCurrentCardIndex(0);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                practiceMode
                  ? "bg-white text-blue-950 shadow-md shadow-white/20 font-bold"
                  : "text-blue-200 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Flashcard Practice
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1">
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
            <div className="py-2 flex flex-col items-center">
              <div className="w-full flex items-center justify-between text-xs text-blue-200 font-mono mb-2">
                <span>
                  Card {Math.min(currentCardIndex + 1, savedWords.length)} / {savedWords.length}
                </span>
                <span className="text-white font-bold">
                  {masteredWords.length} Mastered
                </span>
              </div>

              {/* Flippable card */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full aspect-4/3 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer border border-white/20 bg-gradient-to-br from-[#0b1536] via-[#16275c] to-[#08102b] shadow-2xl transition-all active:scale-98 relative overflow-hidden"
              >
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-32 h-32 rounded-full bg-blue-400/20 blur-3xl" />
                </div>

                {!isFlipped ? (
                  /* Front of card */
                  <div className="relative z-10">
                    <span className="text-[10px] uppercase tracking-widest text-blue-200/80 font-bold">
                      Tap card to flip definition
                    </span>
                    <h3 className="text-3xl font-bold text-white mt-3 font-serif italic">
                      {savedWords[currentCardIndex]?.word}
                    </h3>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className="text-sm font-mono text-blue-100">
                        {savedWords[currentCardIndex]?.phonetic}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-blue-200 border border-white/15 font-mono">
                        {savedWords[currentCardIndex]?.partOfSpeech}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Back of card (Definition) */
                  <div className="relative z-10 space-y-3 max-h-full overflow-y-auto">
                    <span className="text-[10px] uppercase tracking-widest text-blue-200/80 font-bold">
                      Definition
                    </span>
                    <p className="text-base sm:text-lg font-serif italic text-white leading-relaxed">
                      "{savedWords[currentCardIndex]?.definition}"
                    </p>
                    {savedWords[currentCardIndex]?.example && (
                      <p className="text-xs font-serif text-blue-100/90 italic pt-1 border-t border-white/10">
                        Example: {savedWords[currentCardIndex]?.example}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="w-full flex items-center gap-3 mt-4">
                <button
                  onClick={() =>
                    handleMarkMastered(savedWords[currentCardIndex]?.word)
                  }
                  className="flex-1 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-blue-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-white/20 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-950" /> Got it!
                </button>
                <button
                  onClick={handleNextCard}
                  className="flex-1 py-2.5 rounded-xl bg-[#08102b] hover:bg-[#101e46] text-white border border-white/15 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  Next Card <ArrowRight className="w-4 h-4" />
                </button>
              </div>
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
                    <div className="flex items-center gap-2">
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
