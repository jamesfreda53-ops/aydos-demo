import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Maximize2,
  ArrowRight,
  Clock,
  BookOpen,
  User,
} from "lucide-react";
import { Story, ReaderSettings } from "../types";
import { THEME_COLORS } from "./ThemeColors";
import { resolveStoryAssetUrl, handleImageFallback } from "../utils/storyAssets";

interface TitleSlideViewerProps {
  story: Story;
  settings: ReaderSettings;
  vocabHelperActive?: boolean;
  onToggleVocabHelper?: () => void;
  onWordTap: (word: string, contextSentence: string) => void;
  onImageExpand: (imageUrl: string, caption: string) => void;
  onBeginStory: () => void;
}

export const TitleSlideViewer: React.FC<TitleSlideViewerProps> = ({
  story,
  settings,
  vocabHelperActive = false,
  onToggleVocabHelper,
  onWordTap,
  onImageExpand,
  onBeginStory,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
  }, [story.id, story.coverImage, story.titleSlide?.illustrationUrl]);

  const titleSlideData = story.titleSlide || {
    title: story.title,
    subtitle: story.subtitle,
    author: story.author,
    illustrationUrl: story.coverImage,
    illustrationCaption: `${story.title} - Album Cover Artwork`,
    introParagraph: story.summary,
  };

  // Combine title, subtitle, and intro text for tokenized tap-to-define
  const introText = titleSlideData.introParagraph || story.summary;

  const parsedIntroWords = React.useMemo(() => {
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

    while ((match = regex.exec(introText)) !== null) {
      const matchedText = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + matchedText.length;
      const isWord = /^[a-zA-Z0-9'’-]+$/.test(matchedText);

      tokens.push({
        id: `title-token-${startIndex}-${matchedText}`,
        text: matchedText,
        cleanWord: isWord ? matchedText.replace(/['’]/g, "") : "",
        isWord,
        startIndex,
        endIndex,
      });
    }

    return tokens;
  }, [introText]);

  // Font family mapper
  const fontFamilyClass = {
    lexend: "font-lexend",
    literata: "font-literata font-serif",
    fredoka: "font-fredoka",
    sans: "font-jakarta",
  }[settings.fontFamily] || "font-literata font-serif";

  return (
    <div className="w-full flex flex-col flex-1 pb-6 space-y-4 font-sans animate-in fade-in duration-300">
      {/* 1. Square Album Cover Showcase (1:1 Ratio) */}
      <div
        style={{ borderColor: THEME_COLORS.cardBorder }}
        className="relative w-full max-w-md mx-auto aspect-square rounded-3xl overflow-hidden shadow-2xl bg-[#0b1536] border-2 sm:border-[2.5px] group"
      >
        {/* Loading Skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0e1b45] animate-pulse">
            <BookOpen className="w-10 h-10 text-blue-300/40" />
          </div>
        )}

        {/* Square Title Image (Album Art) */}
        <img
          src={resolveStoryAssetUrl(titleSlideData.illustrationUrl)}
          alt={story.title}
          className={`w-full h-full object-cover transition-all duration-700 ${
            imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => handleImageFallback(e, story.coverImage)}
          referrerPolicy="no-referrer"
        />

        {/* Vinyl / Album Sleeve Sheen Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/10 pointer-events-none" />

        {/* Subtle Ambient Backlight Glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 rounded-full bg-white/8 blur-3xl" />
        </div>

        {/* Top Expand button on Title Cover */}
        <div className="absolute top-3.5 right-3.5 flex items-center justify-end pointer-events-auto">
          <button
            id="expand-title-image-btn"
            onClick={() =>
              onImageExpand(
                titleSlideData.illustrationUrl,
                titleSlideData.illustrationCaption || story.title
              )
            }
            className="w-9 h-9 rounded-full bg-[#08102b]/80 hover:bg-[#08102b] backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all active:scale-95 shadow-lg cursor-pointer"
            title="Inspect artwork in full view"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Title Overlay on Title Image */}
        <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
          <h1 className="text-sm sm:text-base font-bold font-serif italic text-white drop-shadow-md leading-tight">
            {story.title}
          </h1>
        </div>
      </div>

      {/* 2. Vocab Helper Toggle */}
      <div className="flex items-center justify-between px-1 text-xs">
        <button
          type="button"
          id="title-vocab-helper-toggle-btn"
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
      </div>

      {/* 3. Story Header Info Card */}
      <div
        id="title-slide-container"
        className="p-5 sm:p-6 rounded-3xl bg-[#0e1b45] border border-white/10 shadow-2xl space-y-4"
      >
        {/* Title & Subtitle */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-blue-200/80 font-mono">
            <span className="flex items-center gap-1 text-white">
              <User className="w-3.5 h-3.5 text-white" /> {story.author}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-white" /> ~{story.estimatedMinutes} min read
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-white font-serif italic leading-tight">
            {story.title}
          </h2>
          {story.subtitle && (
            <p className="text-xs sm:text-sm text-blue-200/80 font-serif italic">
              {story.subtitle}
            </p>
          )}
        </div>

        {/* Action Button: Read Now */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-end">
          <button
            id="begin-story-slide1-btn"
            onClick={onBeginStory}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-neutral-100 text-blue-950 text-sm font-bold shadow-lg shadow-white/10 transition-all active:scale-95 cursor-pointer"
          >
            <span>Read Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
