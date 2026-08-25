import React, { useEffect } from "react";
import { Volume2, Bookmark, BookmarkCheck, Sparkles, X, Lightbulb } from "lucide-react";
import { WordDefinition } from "../types";
import { audioEngine } from "../utils/audioPlayer";

interface DictionaryModalProps {
  definition: WordDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveWord: (wordDef: WordDefinition) => void;
  onRemoveSavedWord: (word: string) => void;
  isWordSaved: boolean;
  storyTitle?: string;
  slideNumber?: number;
}

export const DictionaryModal: React.FC<DictionaryModalProps> = ({
  definition,
  isOpen,
  onClose,
  onSaveWord,
  onRemoveSavedWord,
  isWordSaved,
}) => {
  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !definition) return null;

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioEngine.speakWord(definition.word);
  };

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isWordSaved) {
      onRemoveSavedWord(definition.word);
    } else {
      onSaveWord(definition);
    }
  };

  return (
    <div
      id="dictionary-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 transition-opacity animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Compact Floating Pop-Up Bubble */}
      <div
        id="dictionary-popup-bubble"
        className="w-full max-w-[360px] bg-[#0e1b45] border border-white/20 rounded-2xl shadow-2xl shadow-black/90 p-4 sm:p-5 relative animate-in fade-in zoom-in-95 duration-150 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Subtle Top Bubble Badge & Close button */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white border border-white/20 uppercase tracking-wider">
              <Sparkles className="w-2.5 h-2.5 text-white" /> Definition
            </span>
          </div>
          <button
            id="close-dict-bubble-btn"
            onClick={onClose}
            className="w-6 h-6 rounded-full flex items-center justify-center text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close bubble"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Word Header & Quick Actions */}
        <div className="mt-3 flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                id="dict-word-title"
                className="text-xl font-bold tracking-tight text-white font-serif"
              >
                {definition.word}
              </h3>
              <button
                id="pronounce-word-btn"
                onClick={handleSpeak}
                className="inline-flex items-center justify-center p-1.5 rounded-full bg-white/10 hover:bg-white/20 hover:text-white border border-white/15 text-white active:scale-95 transition-all cursor-pointer"
                title="Pronounce word"
              >
                <Volume2 className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-blue-200/80">
              <span className="font-mono text-[11px] text-blue-100 font-semibold">
                {definition.phonetic}
              </span>
              <span>•</span>
              <span className="text-[10px] bg-white/10 px-1.5 py-0.2 rounded text-white uppercase tracking-tight font-semibold">
                {definition.partOfSpeech}
              </span>
            </div>
          </div>

          <button
            id="save-word-bookmark-btn"
            onClick={handleToggleSave}
            className={`p-2 rounded-xl transition-all border shrink-0 cursor-pointer ${
              isWordSaved
                ? "bg-white text-blue-950 border-white shadow-md shadow-white/20 font-bold"
                : "bg-white/5 text-blue-200 border-white/10 hover:bg-white/10 hover:text-white"
            }`}
            title={isWordSaved ? "Remove from Saved Words" : "Save to Word Bank"}
          >
            {isWordSaved ? (
              <BookmarkCheck className="w-4 h-4 text-blue-950" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Definition Content Bubble */}
        <div className="mt-3 space-y-2.5">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p
              id="dict-definition-text"
              className="text-xs sm:text-sm text-neutral-100 leading-relaxed font-serif"
            >
              {definition.definition}
            </p>
          </div>

          {/* Example Sentence */}
          {definition.example && (
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
              <p
                id="dict-example-text"
                className="text-[11px] text-blue-100 border-l-2 border-white/60 pl-2 italic leading-relaxed"
              >
                "{definition.example}"
              </p>
            </div>
          )}

          {/* Synonyms Tag Chips */}
          {definition.synonyms && definition.synonyms.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] uppercase font-bold text-blue-200/60 tracking-wider">
                Synonyms:
              </span>
              {definition.synonyms.slice(0, 3).map((syn, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/10 text-white border border-white/15"
                >
                  {syn}
                </span>
              ))}
            </div>
          )}

          {/* Fun Fact if present */}
          {definition.funFact && (
            <div className="flex items-start gap-1.5 p-2 rounded-lg bg-blue-900/30 border border-white/15 text-blue-100 text-[11px]">
              <Lightbulb className="w-3 h-3 text-white shrink-0 mt-0.5" />
              <p className="leading-snug">{definition.funFact}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

