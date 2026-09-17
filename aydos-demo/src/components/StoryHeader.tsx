import React from "react";
import { ChevronLeft, SlidersHorizontal, Bookmark, Layers, Image as ImageIcon } from "lucide-react";
import { Story } from "../types";
import { THEME_COLORS } from "./ThemeColors";

interface StoryHeaderProps {
  story: Story;
  currentSlideIndex: number;
  totalSlides: number;
  savedWordsCount: number;
  onBackToLibrary: () => void;
  onOpenSettings: () => void;
  onOpenWordBank: () => void;
  onOpenSlideJumper: () => void;
}

export const StoryHeader: React.FC<StoryHeaderProps> = ({
  story,
  currentSlideIndex,
  totalSlides,
  savedWordsCount,
  onBackToLibrary,
  onOpenSettings,
  onOpenWordBank,
  onOpenSlideJumper,
}) => {
  return (
    <header
      style={{
        backgroundColor: `${THEME_COLORS.headerBackground}f2`,
        borderColor: THEME_COLORS.cardBorder,
      }}
      className="sticky top-0 z-30 w-full backdrop-blur-md border-b transition-colors"
    >
      {/* Top slim segmented progress line */}
      <div className="w-full h-1 bg-white/10 flex gap-1 px-4 pt-1">
        {Array.from({ length: totalSlides }).map((_, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor:
                idx <= currentSlideIndex ? THEME_COLORS.btnPrimaryBg : `${THEME_COLORS.cardBorder}`,
            }}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              idx === currentSlideIndex ? "shadow-sm" : ""
            }`}
          />
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        {/* Left: Back button & story brief */}
        <div className="flex items-center gap-2.5 overflow-hidden">
          <button
            id="back-to-library-btn"
            onClick={onBackToLibrary}
            style={{
              backgroundColor: THEME_COLORS.cardElevatedBg,
              borderColor: THEME_COLORS.cardBorder,
              color: THEME_COLORS.textPrimary,
            }}
            className="w-9 h-9 rounded-full border flex items-center justify-center transition-all active:scale-95 shrink-0 cursor-pointer hover:opacity-80"
            title={currentSlideIndex > 0 ? "Back to Chapter Overview" : (story.seriesTitle ? "Back to Series" : "Back to Catalog")}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="truncate text-left flex items-center">
            <h1
              style={{ color: THEME_COLORS.textPrimary }}
              className="text-base font-serif font-bold truncate"
            >
              {story.seriesTitle || story.title.replace(/^Chapter\s+[IVXLCDM\d]+[:\s-]+/i, "").trim()}
            </h1>
          </div>
        </div>

        {/* Right: Action icons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Word Bank badge button */}
          <button
            id="header-wordbank-btn"
            onClick={onOpenWordBank}
            style={{
              backgroundColor: THEME_COLORS.cardElevatedBg,
              borderColor: THEME_COLORS.cardBorder,
              color: THEME_COLORS.textPrimary,
            }}
            className="relative p-2 rounded-full border transition-colors active:scale-95 cursor-pointer hover:opacity-80"
            title="My Word Bank"
          >
            <Bookmark className="w-3.5 h-3.5" />
            {savedWordsCount > 0 && (
              <span
                style={{
                  backgroundColor: THEME_COLORS.btnPrimaryBg,
                  color: THEME_COLORS.btnPrimaryText,
                }}
                className="absolute -top-0.5 -right-0.5 min-w-[15px] h-3.5 px-1 rounded-full text-[9px] font-bold flex items-center justify-center shadow-md"
              >
                {savedWordsCount}
              </span>
            )}
          </button>

          {/* Reader settings */}
          <button
            id="header-settings-btn"
            onClick={onOpenSettings}
            style={{
              backgroundColor: THEME_COLORS.cardElevatedBg,
              borderColor: THEME_COLORS.cardBorder,
              color: THEME_COLORS.textPrimary,
            }}
            className="p-2 rounded-full border transition-colors active:scale-95 cursor-pointer hover:opacity-80"
            title="Reading Settings & Theme"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
