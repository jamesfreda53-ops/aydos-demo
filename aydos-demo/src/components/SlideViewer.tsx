import React, { useState } from "react";
import { Maximize2, Sparkles, BookOpen, Volume2, Info } from "lucide-react";
import { Slide, ReaderSettings } from "../types";
import { THEME_COLORS } from "./ThemeColors";

interface SlideViewerProps {
  slide: Slide;
  settings: ReaderSettings;
  speakingCharIndex: number;
  speakingCharLength: number;
  isPlayingAudio: boolean;
  vocabHelperActive?: boolean;
  onToggleVocabHelper?: () => void;
  onWordTap: (word: string, contextSentence: string) => void;
  onImageExpand: (imageUrl: string, caption: string) => void;
}

export const SlideViewer: React.FC<SlideViewerProps> = ({
  slide,
  settings,
  speakingCharIndex,
  speakingCharLength,
  isPlayingAudio,
  vocabHelperActive = false,
  onToggleVocabHelper,
  onWordTap,
  onImageExpand,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Split paragraph into tokens (words + punctuation/whitespace) with character indices
  const parsedWords = React.useMemo(() => {
    const text = slide.paragraph;
    const tokens: Array<{
      id: string;
      text: string;
      cleanWord: string;
      isWord: boolean;
      startIndex: number;
      endIndex: number;
    }> = [];

    const regex = /([a-zA-Z0-9'’-]+)|([^a-zA-Z0-9'’-]+)/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const matchedText = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + matchedText.length;
      const isWord = /^[a-zA-Z0-9'’-]+$/.test(matchedText);

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
  }, [slide.paragraph]);

  // Font size mapper
  const fontSizeClass = {
    sm: "text-base sm:text-lg leading-relaxed",
    base: "text-lg sm:text-xl leading-relaxed",
    lg: "text-xl sm:text-2xl leading-loose",
    xl: "text-2xl sm:text-3xl leading-loose",
    "2xl": "text-3xl sm:text-4xl leading-loose",
  }[settings.fontSize] || "text-lg sm:text-xl leading-relaxed";

  // Font family mapper
  const fontFamilyClass = {
    lexend: "font-lexend",
    literata: "font-literata font-serif",
    fredoka: "font-fredoka",
    sans: "font-jakarta",
  }[settings.fontFamily] || "font-literata font-serif";

  return (
    <div className="w-full flex flex-col flex-1 pb-4">
      {/* 1. Slide Illustration matching Design HTML with square album-cover aspect ratio */}
      <div
        style={{ borderColor: THEME_COLORS.cardBorder }}
        className="relative w-full max-w-md mx-auto aspect-square rounded-3xl overflow-hidden shadow-2xl bg-[#0b1536] border-2 sm:border-[2.5px] group"
      >
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0e1b45] animate-pulse">
            <BookOpen className="w-8 h-8 text-blue-300/40" />
          </div>
        )}
        <img
          src={slide.illustrationUrl}
          alt={slide.illustrationCaption}
          className={`w-full h-full object-cover transition-all duration-700 ${
            imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
          }`}
          onLoad={() => setImageLoaded(true)}
          referrerPolicy="no-referrer"
        />

        {/* Vinyl / Album Sleeve Sheen Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#060d24]/80 via-transparent to-white/10 pointer-events-none" />

        {/* Ambient subtle warm backlight glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-36 h-36 rounded-full bg-blue-400/15 blur-3xl" />
        </div>

        {/* Top-right Frosted Glass Zoom Action button */}
        <button
          id="expand-image-btn"
          onClick={() => onImageExpand(slide.illustrationUrl, slide.illustrationCaption)}
          className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-[#08102b]/80 hover:bg-[#08102b] backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all active:scale-95 shadow-lg cursor-pointer"
          title="Inspect illustration full screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Bottom caption */}
        {slide.illustrationCaption && (
          <div className="absolute bottom-3.5 left-4 right-4 text-[11px] text-blue-100/90 pointer-events-none">
            <p className="truncate drop-shadow-md font-medium text-xs text-white">
              {slide.illustrationCaption}
            </p>
          </div>
        )}
      </div>

      {/* 2. Vocab Helper Toggle Bar */}
      <div className="mt-3.5 flex items-center justify-between px-1 text-xs">
        <button
          type="button"
          id="vocab-helper-toggle-btn"
          onClick={onToggleVocabHelper}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all active:scale-95 cursor-pointer select-none ${
            vocabHelperActive
              ? "bg-white text-blue-950 font-bold border-white shadow-[0_0_12px_rgba(255,255,255,0.4)]"
              : "bg-[#0b1536] text-blue-200/80 hover:text-white border-white/15 hover:border-white/30"
          }`}
          title={
            vocabHelperActive
              ? "Vocab Helper is ON (tap any word to define). Click to turn off."
              : "Vocab Helper is OFF. Click to enable tap-to-define on words."
          }
        >
          <Sparkles
            className={`w-3.5 h-3.5 ${
              vocabHelperActive ? "text-blue-950 fill-blue-950" : "text-white"
            }`}
          />
          <span className="text-xs font-semibold">Vocab Helper</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              vocabHelperActive
                ? "bg-blue-950 text-white"
                : "bg-white/10 text-blue-200"
            }`}
          >
            {vocabHelperActive ? "On" : "Off"}
          </span>
        </button>

        {isPlayingAudio && (
          <span className="inline-flex items-center gap-1.5 text-white font-mono text-[11px] font-bold animate-pulse">
            <Volume2 className="w-3.5 h-3.5" /> Narrating
          </span>
        )}
      </div>

      {/* 3. Interactive Paragraph Content in Deep Royal Blue Card */}
      <div
        id="slide-paragraph-container"
        className={`mt-2 p-5 sm:p-6 rounded-3xl bg-[#0e1b45] border border-white/10 shadow-2xl select-text ${fontFamilyClass} ${fontSizeClass} transition-all`}
      >
        <p className="text-neutral-100 tracking-normal text-left leading-relaxed">
          {parsedWords.map((token) => {
            if (!token.isWord) {
              return <span key={token.id}>{token.text}</span>;
            }

            // Check if this word is currently being spoken
            const isSpeaking =
              isPlayingAudio &&
              settings.highlightSpokenWords &&
              speakingCharIndex >= 0 &&
              token.startIndex <= speakingCharIndex &&
              token.endIndex >= speakingCharIndex;

            // Check if it's in the slide's key vocabulary
            const isKeyWord = slide.keyWords?.some(
              (kw) => kw.toLowerCase() === token.cleanWord.toLowerCase()
            );

            return (
              <span
                key={token.id}
                onClick={() => {
                  if (vocabHelperActive) {
                    onWordTap(token.cleanWord, slide.paragraph);
                  }
                }}
                className={`inline-block px-1 py-0.5 -mx-0.5 rounded-sm transition-all duration-150 ${
                  isSpeaking
                    ? "active-speaking-word text-white font-bold scale-105"
                    : vocabHelperActive
                    ? isKeyWord
                      ? "text-white font-semibold underline decoration-white/60 decoration-2 underline-offset-4 bg-white/15 hover:bg-white/25 cursor-pointer active:scale-95"
                      : "cursor-pointer hover:bg-white/15 hover:text-white active:scale-95"
                    : isKeyWord
                    ? "text-white font-medium underline decoration-white/30 decoration-1 underline-offset-4"
                    : "cursor-text"
                }`}
                title={vocabHelperActive ? `Tap to define "${token.cleanWord}"` : undefined}
              >
                {token.text}
              </span>
            );
          })}
        </p>
      </div>

      {/* 4. Slide Key Vocabulary Pills */}
      {slide.keyWords && slide.keyWords.length > 0 && (
        <div className="mt-3.5 px-1">
          <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-blue-200/70">
            <Info className="w-3.5 h-3.5 text-white" />
            <span className="text-[11px] uppercase tracking-wider text-blue-200/70 font-bold">
              Key Story Vocabulary
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {slide.keyWords.map((kw) => (
              <button
                key={kw}
                onClick={() => onWordTap(kw, slide.paragraph)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#0b1536] text-white border border-white/15 hover:border-white/40 hover:bg-white/10 transition-all active:scale-95 flex items-center gap-1.5 shadow-sm cursor-pointer"
                title={`Look up definition for "${kw}"`}
              >
                <Sparkles className="w-3 h-3 text-white" />
                {kw}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
