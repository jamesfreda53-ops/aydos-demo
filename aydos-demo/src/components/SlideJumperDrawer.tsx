import React from "react";
import { X, Layers, Check, Disc3 } from "lucide-react";
import { Story } from "../types";
import { resolveStoryAssetUrl, handleImageFallback } from "../utils/storyAssets";

interface SlideJumperDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  story: Story;
  currentSlideIndex: number; // 0 is Title Slide, 1..N are slides
  onSelectSlide: (index: number) => void;
}

export const SlideJumperDrawer: React.FC<SlideJumperDrawerProps> = ({
  isOpen,
  onClose,
  story,
  currentSlideIndex,
  onSelectSlide,
}) => {
  if (!isOpen) return null;

  const titleIllustration = resolveStoryAssetUrl(
    story.titleSlide?.illustrationUrl || story.coverImage
  );

  return (
    <div
      id="slide-jumper-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xs p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        id="slide-jumper-content"
        className="w-full max-w-md bg-[#0e1b45] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-white/15 p-5 max-h-[80vh] flex flex-col text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-white" />
            <h3 className="font-bold text-sm text-white font-serif italic">
              Story Navigation (Title + {story.slides.length} Slides)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-blue-200 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Slide grid list */}
        <div className="flex-1 overflow-y-auto mt-3 grid grid-cols-2 gap-2.5 pr-1">
          {/* 1. Title Slide Item (Index 0) */}
          <button
            onClick={() => {
              onSelectSlide(0);
              onClose();
            }}
            className={`relative rounded-2xl overflow-hidden border-2 text-left flex flex-col transition-all active:scale-95 group cursor-pointer ${
              currentSlideIndex === 0
                ? "ring-2 ring-white border-white shadow-lg shadow-white/20"
                : "border-white/15 hover:border-white/40 bg-[#08102b]"
            }`}
          >
            <div className="relative aspect-square w-full overflow-hidden bg-[#08102b]">
              <img
                src={titleIllustration}
                alt="Story Title Cover"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
                onError={(e) => handleImageFallback(e, story.coverImage)}
              />
              <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-xs text-[9px] font-mono font-bold text-white flex items-center gap-1">
                <Disc3 className="w-2.5 h-2.5 text-white" /> Cover
              </div>
              {currentSlideIndex === 0 && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white text-blue-950 flex items-center justify-center shadow-xs font-bold">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>
            <div className="p-2 bg-[#08102b]">
              <span className="text-[9px] uppercase tracking-wider text-blue-200 font-bold block">
                Title Slide
              </span>
              <p className="text-[11px] text-white font-bold truncate font-serif">
                {story.title}
              </p>
            </div>
          </button>

          {/* 2. Content Slides (Indices 1..N) */}
          {story.slides.map((slide, idx) => {
            const slideIndex = idx + 1;
            const isCurrent = slideIndex === currentSlideIndex;
            const slideUrl = resolveStoryAssetUrl(slide.illustrationUrl);
            return (
              <button
                key={slide.id}
                onClick={() => {
                  onSelectSlide(slideIndex);
                  onClose();
                }}
                className={`relative rounded-2xl overflow-hidden border-2 text-left flex flex-col transition-all active:scale-95 group cursor-pointer ${
                  isCurrent
                    ? "ring-2 ring-white border-white shadow-lg shadow-white/20"
                    : "border-white/15 hover:border-white/40 bg-[#08102b]"
                }`}
              >
                <div className="relative aspect-square w-full overflow-hidden bg-[#08102b]">
                  <img
                    src={slideUrl}
                    alt={`Slide ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    onError={handleImageFallback}
                  />
                  <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-xs text-[9px] font-mono font-bold text-white">
                    Slide {idx + 1}
                  </div>
                  {isCurrent && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white text-blue-950 flex items-center justify-center shadow-xs font-bold">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div className="p-2 bg-[#08102b]">
                  <p className="text-[11px] text-blue-100 line-clamp-2 leading-tight font-serif">
                    {slide.paragraph}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
