import React, { useState, useMemo } from "react";
import {
  BookOpen,
  PlusCircle,
  Bookmark,
  Search,
  Sparkles,
  Volume2,
  Layers,
  Clock,
  Edit3,
  Trash2,
  Play,
  User,
  Disc3,
  ChevronRight,
  ChevronLeft,
  BookMarked,
  Sparkle,
} from "lucide-react";
import { Story } from "../types";
import { THEME_COLORS } from "./ThemeColors";
import { AYDOS_LOGO_DATA_URI } from "../assets/logoBase64";
import { SeriesEditorModal, SeriesData } from "./SeriesEditorModal";
import { GITHUB_RAW_BASE_URL, resolveStoryAssetUrl, handleImageFallback } from "../utils/storyAssets";

interface LibraryViewProps {
  activeSeriesId?: string | null;
  onActiveSeriesChange?: (seriesId: string | null) => void;
  stories: Story[];
  onSelectStory: (story: Story) => void;
  onOpenWordBank: () => void;
  onOpenEditor: (storyToEdit?: Story) => void;
  onDeleteCustomStory?: (storyId: string) => void;
  onUpdateSeries?: (seriesData: SeriesData) => void;
  savedWordsCount: number;
}

interface SeriesGroupItem {
  type: "series";
  id: string;
  seriesId: string;
  seriesTitle: string;
  seriesDescription: string;
  seriesCoverImage: string;
  seriesFolder: string;
  author: string;
  genre: string;
  readingLevel: "Beginner" | "Intermediate" | "Advanced";
  chapters: Story[];
}

interface StandaloneStoryItem {
  type: "standalone";
  story: Story;
}

type LibraryFeedItem = SeriesGroupItem | StandaloneStoryItem;

export const LibraryView: React.FC<LibraryViewProps> = ({
  stories,
  onSelectStory,
  onOpenWordBank,
  onOpenEditor,
  onDeleteCustomStory,
  onUpdateSeries,
  savedWordsCount,
  activeSeriesId: controlledActiveSeriesId,
  onActiveSeriesChange,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [localActiveSeriesId, setLocalActiveSeriesId] = useState<string | null>(null);
  const [editingSeries, setEditingSeries] = useState<SeriesData | null>(null);

  const activeSeriesId = controlledActiveSeriesId !== undefined ? controlledActiveSeriesId : localActiveSeriesId;
  const setActiveSeriesId = (id: string | null) => {
    setLocalActiveSeriesId(id);
    if (onActiveSeriesChange) onActiveSeriesChange(id);
  };

  // Group stories into Series vs Standalone
  const libraryItems: LibraryFeedItem[] = useMemo(() => {
    const seriesMap = new Map<string, Story[]>();
    const standalone: Story[] = [];

    stories.forEach((story) => {
      const sKey = story.seriesTitle?.trim() || story.seriesId?.trim();
      if (sKey) {
        const existing = seriesMap.get(sKey) || [];
        existing.push(story);
        seriesMap.set(sKey, existing);
      } else {
        standalone.push(story);
      }
    });

    const items: LibraryFeedItem[] = [];

    // Convert series groups
    seriesMap.forEach((chapterList, sKey) => {
      // Sort chapters by seriesOrder or chapterNumber
      const sortedChapters = [...chapterList].sort((a, b) => {
        const orderA = a.seriesOrder ?? 999;
        const orderB = b.seriesOrder ?? 999;
        return orderA - orderB;
      });

      const firstChapter = sortedChapters[0];
      const seriesFolder = firstChapter.seriesFolder || firstChapter.id || firstChapter.seriesId || sKey.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const seriesCover = resolveStoryAssetUrl(
        firstChapter.seriesCoverImage ||
        firstChapter.coverImage ||
        firstChapter.titleSlide?.illustrationUrl ||
        `${GITHUB_RAW_BASE_URL}/${seriesFolder}/title.webp`
      );

      items.push({
        type: "series",
        id: `series-${firstChapter.seriesId || sKey}`,
        seriesId: firstChapter.seriesId || sKey,
        seriesTitle: firstChapter.seriesTitle || sKey,
        seriesDescription:
          firstChapter.seriesDescription ||
          firstChapter.summary ||
          `A complete collection of chapters from ${firstChapter.seriesTitle || sKey}.`,
        seriesCoverImage: seriesCover,
        seriesFolder: seriesFolder,
        author: firstChapter.author,
        genre: firstChapter.genre,
        readingLevel: (firstChapter.readingLevel as any) || "Intermediate",
        chapters: sortedChapters,
      });
    });

    // Add standalone stories
    standalone.forEach((story) => {
      items.push({
        type: "standalone",
        story,
      });
    });

    return items;
  }, [stories]);

  // Filter items based on search and level
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const cleanTagQuery = query.replace(/^[#\[\]]+|[#\[\]]+$/g, "");

    return libraryItems.filter((item) => {
      if (item.type === "series") {
        const matchesLevel =
          selectedLevel === "All" ||
          item.chapters.some(
            (c) =>
              c.readingLevel.toLowerCase().includes(selectedLevel.toLowerCase()) ||
              c.levelBadge.toLowerCase().includes(selectedLevel.toLowerCase())
          );

        if (!matchesLevel) return false;
        if (!query) return true;

        const matchesSearch =
          item.seriesTitle.toLowerCase().includes(query) ||
          item.seriesDescription.toLowerCase().includes(query) ||
          item.genre.toLowerCase().includes(query) ||
          item.author.toLowerCase().includes(query) ||
          item.chapters.some(
            (c) =>
              c.title.toLowerCase().includes(query) ||
              (c.subtitle && c.subtitle.toLowerCase().includes(query)) ||
              (c.chapterTitle &&
                c.chapterTitle.toLowerCase().includes(query)) ||
              c.summary.toLowerCase().includes(query) ||
              (c.tags &&
                c.tags.some((t) =>
                  t.toLowerCase().includes(query) ||
                  (cleanTagQuery && t.toLowerCase().includes(cleanTagQuery))
                ))
          );
        return matchesSearch;
      } else {
        const { story } = item;
        const matchesLevel =
          selectedLevel === "All" ||
          story.readingLevel.toLowerCase().includes(selectedLevel.toLowerCase()) ||
          story.levelBadge.toLowerCase().includes(selectedLevel.toLowerCase());

        if (!matchesLevel) return false;
        if (!query) return true;

        const matchesSearch =
          story.title.toLowerCase().includes(query) ||
          (story.subtitle && story.subtitle.toLowerCase().includes(query)) ||
          story.summary.toLowerCase().includes(query) ||
          story.genre.toLowerCase().includes(query) ||
          story.author.toLowerCase().includes(query) ||
          (story.tags &&
            story.tags.some((t) =>
              t.toLowerCase().includes(query) ||
              (cleanTagQuery && t.toLowerCase().includes(cleanTagQuery))
            ));
        return matchesSearch;
      }
    });
  }, [libraryItems, selectedLevel, searchQuery]);

  // Find active series if selected
  const activeSeries = useMemo(() => {
    if (!activeSeriesId) return null;
    return libraryItems.find(
      (item): item is SeriesGroupItem =>
        item.type === "series" && item.seriesId === activeSeriesId
    );
  }, [libraryItems, activeSeriesId]);

  return (
    <div
      className="w-full min-h-screen flex flex-col font-sans transition-colors duration-200"
      style={{
        backgroundColor: THEME_COLORS.contentBackground,
        color: THEME_COLORS.textPrimary,
      }}
    >
      {/* Top Navbar */}
      <header
        className="sticky top-0 z-30 backdrop-blur-md px-4 py-3 border-b transition-colors"
        style={{
          backgroundColor: `${THEME_COLORS.headerBackground}f0`,
          borderColor: THEME_COLORS.cardBorder,
        }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shadow-lg border shrink-0 bg-black/40"
              style={{
                borderColor: THEME_COLORS.cardBorder,
              }}
            >
              <img
                src={AYDOS_LOGO_DATA_URI}
                alt="Aydos Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1
                className="text-sm font-bold tracking-tight font-serif italic"
                style={{ color: THEME_COLORS.textPrimary }}
              >
                Aydos
              </h1>
              <p
                className="text-[10px] uppercase tracking-widest font-bold"
                style={{ color: THEME_COLORS.textMuted }}
              >
                Read. Listen. Learn.
              </p>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            {/* Create Story Button */}
            <button
              id="library-create-story-btn"
              onClick={() => onOpenEditor()}
              style={{
                backgroundColor: THEME_COLORS.btnPrimaryBg,
                color: THEME_COLORS.btnPrimaryText,
                borderColor: THEME_COLORS.cardBorder,
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-md hover:opacity-90 cursor-pointer border"
              title="Create or test a new story with text, images, and audio"
              aria-label="Create Story"
            >
              <PlusCircle className="w-4 h-4" />
            </button>

            {/* Word Bank / Study button */}
            <button
              id="library-wordbank-btn"
              onClick={onOpenWordBank}
              style={{
                backgroundColor: THEME_COLORS.cardElevatedBg,
                borderColor: THEME_COLORS.cardBorder,
                color: THEME_COLORS.textPrimary,
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all active:scale-95 shadow-md hover:opacity-90 cursor-pointer"
              title="Study Saved Words"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Study</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 space-y-5">
        {/* SERIES CHAPTER EXPLORER VIEW (WHEN A SERIES IS EXPANDED/OPENED) */}
        {activeSeries ? (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Back to Library Navigation Header */}
            <button
              onClick={() => setActiveSeriesId(null)}
              style={{
                backgroundColor: THEME_COLORS.cardElevatedBg,
                borderColor: THEME_COLORS.cardBorder,
                color: THEME_COLORS.textPrimary,
              }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer shadow-sm hover:opacity-90"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Library</span>
            </button>

            {/* Series Hero Banner - Full Square Showcase matching catalog style */}
            <div
              style={{ borderColor: THEME_COLORS.cardBorder }}
              className="relative aspect-square w-full max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl border-2 sm:border-[2.5px]"
            >
              <img
                src={resolveStoryAssetUrl(activeSeries.seriesCoverImage)}
                alt={activeSeries.seriesTitle}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={handleImageFallback}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to top, ${THEME_COLORS.cardBackground} 0%, rgba(0,0,0,0.55) 8%, rgba(0,0,0,0) 40%, rgba(0,0,0,0) 100%)`,
                }}
              />

              {/* Bottom Title & Subtitle overlay on Album Art */}
              <div className="absolute bottom-4 left-4 right-14 pointer-events-none">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    style={{ color: THEME_COLORS.textSecondary }}
                    className="text-[10px] uppercase tracking-widest font-bold"
                  >
                    {activeSeries.genre}
                  </span>
                  <span style={{ color: THEME_COLORS.textMuted }} className="text-xs">
                    •
                  </span>
                  <span
                    style={{ color: THEME_COLORS.textSecondary }}
                    className="text-xs font-mono flex items-center gap-1"
                  >
                    <User className="w-3 h-3" /> {activeSeries.author}
                  </span>
                </div>
                <h2
                  style={{ color: THEME_COLORS.textPrimary }}
                  className="text-2xl sm:text-3xl font-bold font-serif italic leading-tight drop-shadow-md"
                >
                  {activeSeries.seriesTitle}
                </h2>
              </div>

              {/* Bottom Right: Edit Series Pen Button */}
              <div className="absolute bottom-4 right-4 z-10 pointer-events-auto">
                <button
                  id="series-edit-btn"
                  onClick={() => setEditingSeries(activeSeries)}
                  style={{
                    backgroundColor: THEME_COLORS.cardElevatedBg,
                    borderColor: THEME_COLORS.cardBorder,
                    color: THEME_COLORS.textPrimary,
                  }}
                  className="p-2.5 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-lg hover:opacity-90 active:scale-95 backdrop-blur-md"
                  title="Edit Series Information"
                  aria-label="Edit Series Information"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chapters Header */}
            <div
              style={{ color: THEME_COLORS.textMuted }}
              className="flex items-center justify-between px-1 text-[11px] uppercase tracking-wider font-bold pt-1"
            >
              <span>Chapters ({activeSeries.chapters.length})</span>
            </div>

            {/* Chapter List */}
            <div className="space-y-3">
              {activeSeries.chapters.map((chapter, idx) => {
                const isCustom =
                  chapter.id.startsWith("custom-") || chapter.id.startsWith("story-");
                
                const chapterNum =
                  chapter.chapterNumber
                    ? (typeof chapter.chapterNumber === "number" ? `Chapter ${chapter.chapterNumber}` : chapter.chapterNumber)
                    : `Chapter ${idx + 1}`;

                // Extract clean title
                let cleanTitle = chapter.chapterTitle || chapter.title || "";
                if (cleanTitle.includes(" - ")) {
                  const parts = cleanTitle.split(" - ");
                  if (parts.length > 1 && parts[0].toLowerCase().startsWith("chapter")) {
                    cleanTitle = parts.slice(1).join(" - ").trim();
                  }
                } else if (cleanTitle.includes(": ")) {
                  const parts = cleanTitle.split(": ");
                  if (parts.length > 1 && parts[0].toLowerCase().startsWith("chapter")) {
                    cleanTitle = parts.slice(1).join(": ").trim();
                  }
                }
                if (!cleanTitle) cleanTitle = chapter.title;

                const coverThumb =
                  chapter.coverImage ||
                  chapter.slides?.[0]?.illustrationUrl ||
                  chapter.titleSlide?.illustrationUrl ||
                  activeSeries.seriesCoverImage;

                return (
                  <div
                    key={chapter.id}
                    onClick={() => onSelectStory(chapter)}
                    style={{
                      backgroundColor: THEME_COLORS.cardBackground,
                      borderColor: THEME_COLORS.cardBorder,
                    }}
                    className="group cursor-pointer rounded-2xl border transition-all p-3.5 sm:p-4 flex items-center gap-3.5 sm:gap-4 shadow-md active:scale-[0.99] hover:opacity-95"
                  >
                    {/* Chapter Cover Thumbnail */}
                    <div
                      style={{ borderColor: THEME_COLORS.cardBorder }}
                      className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border-2 sm:border-[2.5px] bg-black/40"
                    >
                      <img
                        src={resolveStoryAssetUrl(coverThumb)}
                        alt={cleanTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        onError={(e) => handleImageFallback(e, activeSeries.seriesCoverImage)}
                      />
                    </div>

                    {/* Chapter Details: Chapter Number // Chapter Title // Read Time */}
                    <div className="flex-1 min-w-0">
                      <div
                        style={{ color: THEME_COLORS.textSecondary }}
                        className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wide"
                      >
                        {chapterNum}
                      </div>
                      <h3
                        style={{ color: THEME_COLORS.textPrimary }}
                        className="text-xs sm:text-sm font-bold font-serif italic leading-snug mt-0.5"
                      >
                        {cleanTitle}
                      </h3>
                      <div
                        style={{ color: THEME_COLORS.textMuted }}
                        className="text-[10px] sm:text-[11px] font-mono mt-1 flex items-center gap-1.5"
                      >
                        <Clock className="w-3 h-3" />
                        <span>{chapter.estimatedMinutes} min read</span>
                      </div>
                    </div>

                    {/* Right column: Utility buttons at top & Read button at bottom */}
                    <div className="flex flex-col items-end justify-between self-stretch shrink-0 gap-2">
                      {/* Top Utility Buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenEditor(chapter);
                          }}
                          style={{
                            backgroundColor: THEME_COLORS.cardElevatedBg,
                            borderColor: THEME_COLORS.cardBorder,
                            color: THEME_COLORS.textPrimary,
                          }}
                          className="w-6 h-6 rounded-full border flex items-center justify-center transition-all cursor-pointer hover:opacity-80 shadow-sm"
                          title="Edit chapter slides"
                          aria-label="Edit chapter"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>

                        {isCustom && onDeleteCustomStory && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Delete chapter "${cleanTitle}"?`)) {
                                onDeleteCustomStory(chapter.id);
                              }
                            }}
                            className="w-6 h-6 rounded-full bg-red-950/40 text-red-300 border border-red-500/20 flex items-center justify-center transition-all cursor-pointer hover:bg-red-900/60 shadow-sm"
                            title="Delete chapter"
                            aria-label="Delete chapter"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Read Button */}
                      <div
                        style={{
                          backgroundColor: THEME_COLORS.btnPrimaryBg,
                          color: THEME_COLORS.btnPrimaryText,
                          borderColor: THEME_COLORS.cardBorder,
                        }}
                        className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm border"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Read</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* STANDARD LIBRARY FEED (SERIES CARDS & STANDALONE STORIES) */
          <>
            {/* Search and Filters */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search
                  style={{ color: THEME_COLORS.textMuted }}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                />
                <input
                  type="text"
                  placeholder="Search series, stories, topics, genres..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    backgroundColor: THEME_COLORS.cardBackground,
                    borderColor: THEME_COLORS.cardBorder,
                    color: THEME_COLORS.textPrimary,
                  }}
                  className="w-full pl-9 pr-4 py-2.5 rounded-2xl border text-xs sm:text-sm placeholder:opacity-50 focus:outline-hidden shadow-inner"
                />
              </div>

              {/* Level filter chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                <span
                  style={{ color: THEME_COLORS.textMuted }}
                  className="font-bold uppercase tracking-wider shrink-0 mr-1 text-[10px]"
                >
                  Level:
                </span>
                {["All", "Beginner", "Intermediate", "Advanced"].map((lvl) => {
                  const isSelected = selectedLevel === lvl;
                  return (
                    <button
                      key={lvl}
                      onClick={() => setSelectedLevel(lvl)}
                      style={{
                        backgroundColor: isSelected
                          ? THEME_COLORS.btnPrimaryBg
                          : THEME_COLORS.cardElevatedBg,
                        color: isSelected
                          ? THEME_COLORS.btnPrimaryText
                          : THEME_COLORS.textSecondary,
                        borderColor: THEME_COLORS.cardBorder,
                      }}
                      className="px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all active:scale-95 text-xs cursor-pointer border shadow-xs"
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stories List / Gallery */}
            <div className="space-y-4">
              <div
                style={{ color: THEME_COLORS.textMuted }}
                className="flex items-center justify-between text-[11px] uppercase tracking-wider font-bold px-1"
              >
                <span>Catalog ({filteredItems.length})</span>
              </div>

              {filteredItems.map((item) => {
                if (item.type === "series") {
                  // --- SERIES ITEM CARD ---
                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveSeriesId(item.seriesId)}
                      style={{
                        backgroundColor: THEME_COLORS.cardBackground,
                        borderColor: THEME_COLORS.cardBorder,
                      }}
                      className="group cursor-pointer rounded-3xl overflow-hidden border-2 sm:border-[2.5px] shadow-2xl transition-all duration-300 active:scale-[0.99] flex flex-col hover:opacity-95"
                    >
                      {/* Prominent Square 1:1 Title Image */}
                      <div
                        className="relative aspect-square w-full overflow-hidden flex items-center justify-center"
                      >
                        <img
                          src={resolveStoryAssetUrl(item.seriesCoverImage)}
                          alt={item.seriesTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                          onError={handleImageFallback}
                        />
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(to top, ${THEME_COLORS.cardBackground} 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 75%, rgba(0,0,0,0.35) 100%)`,
                          }}
                        />

                        {/* Top Badges overlay on Title Art */}
                        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
                          <span
                            style={{
                              backgroundColor: THEME_COLORS.cardElevatedBg,
                              color: THEME_COLORS.textPrimary,
                              borderColor: THEME_COLORS.cardBorder,
                            }}
                            className="px-3 py-1 rounded-full backdrop-blur-md border text-xs font-bold shadow-lg"
                          >
                            {item.readingLevel}
                          </span>
                          <span
                            style={{
                              backgroundColor: THEME_COLORS.btnPrimaryBg,
                              color: THEME_COLORS.btnPrimaryText,
                              borderColor: THEME_COLORS.cardBorder,
                            }}
                            className="px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 border"
                          >
                            <Layers className="w-3.5 h-3.5" /> Series
                          </span>
                        </div>

                        {/* Bottom Title & Subtitle overlay on Album Art */}
                        <div className="absolute bottom-4 left-4 right-28 pointer-events-none">
                          <div
                            className="flex items-center gap-2 mb-1"
                            style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.9))" }}
                          >
                            <span
                              style={{ color: THEME_COLORS.textSecondary }}
                              className="text-[10px] uppercase tracking-widest font-bold"
                            >
                              {item.genre}
                            </span>
                            <span style={{ color: THEME_COLORS.textMuted }} className="text-xs">
                              •
                            </span>
                            <span
                              style={{ color: THEME_COLORS.textSecondary }}
                              className="text-xs font-mono flex items-center gap-1"
                            >
                              <User className="w-3 h-3" /> {item.author}
                            </span>
                          </div>
                          <h3
                            style={{ color: THEME_COLORS.textPrimary }}
                            className="text-xl sm:text-2xl font-bold font-serif italic leading-tight drop-shadow-md"
                          >
                            {item.seriesTitle}
                          </h3>
                        </div>

                        {/* Bottom Right: Read Bubble & Edit Series */}
                        <div className="absolute bottom-4 right-4 flex items-center gap-1.5 pointer-events-auto">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSeries(item);
                            }}
                            style={{
                              backgroundColor: THEME_COLORS.cardElevatedBg,
                              borderColor: THEME_COLORS.cardBorder,
                              color: THEME_COLORS.textPrimary,
                            }}
                            className="p-2 rounded-full border transition-all cursor-pointer hover:opacity-80 shadow-lg backdrop-blur-md"
                            title="Edit Series Information"
                            aria-label="Edit Series Information"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <div
                            style={{
                              backgroundColor: THEME_COLORS.btnPrimaryBg,
                              color: THEME_COLORS.btnPrimaryText,
                              borderColor: THEME_COLORS.cardBorder,
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold shadow-xl border backdrop-blur-md transition-transform group-hover:scale-105 pointer-events-none"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Read</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  // --- STANDALONE STORY CARD ---
                  const { story } = item;
                  const isCustom =
                    story.id.startsWith("custom-") || story.id.startsWith("story-");
                  const titleCoverUrl =
                    story.titleSlide?.illustrationUrl || story.coverImage;

                  return (
                    <div
                      key={story.id}
                      onClick={() => onSelectStory(story)}
                      style={{
                        backgroundColor: THEME_COLORS.cardBackground,
                        borderColor: THEME_COLORS.cardBorder,
                      }}
                      className="group cursor-pointer rounded-3xl overflow-hidden border-2 sm:border-[2.5px] shadow-2xl transition-all duration-300 active:scale-[0.99] flex flex-col hover:opacity-95"
                    >
                      {/* Square 1:1 Title Image */}
                      <div
                        className="relative aspect-square w-full overflow-hidden flex items-center justify-center"
                      >
                        <img
                          src={resolveStoryAssetUrl(titleCoverUrl)}
                          alt={story.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                          onError={handleImageFallback}
                        />
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(to top, ${THEME_COLORS.cardBackground} 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 75%, rgba(0,0,0,0.35) 100%)`,
                          }}
                        />

                        {/* Top Badges */}
                        <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 pointer-events-none">
                          <span
                            style={{
                              backgroundColor: THEME_COLORS.cardElevatedBg,
                              color: THEME_COLORS.textPrimary,
                              borderColor: THEME_COLORS.cardBorder,
                            }}
                            className="px-3 py-1 rounded-full backdrop-blur-md border text-xs font-bold shadow-lg"
                          >
                            {story.readingLevel}
                          </span>
                          {isCustom && (
                            <span
                              style={{
                                backgroundColor: THEME_COLORS.btnPrimaryBg,
                                color: THEME_COLORS.btnPrimaryText,
                                borderColor: THEME_COLORS.cardBorder,
                              }}
                              className="px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider font-mono shadow-sm border"
                            >
                              Custom
                            </span>
                          )}
                        </div>

                        {/* Bottom Title & Subtitle */}
                        <div className="absolute bottom-4 left-4 right-28 pointer-events-none">
                          <div
                            className="flex items-center gap-2 mb-1"
                            style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.9))" }}
                          >
                            <span
                              style={{ color: THEME_COLORS.textSecondary }}
                              className="text-[10px] uppercase tracking-widest font-bold"
                            >
                              {story.genre}
                            </span>
                            <span style={{ color: THEME_COLORS.textMuted }} className="text-xs">
                              •
                            </span>
                            <span
                              style={{ color: THEME_COLORS.textSecondary }}
                              className="text-xs font-mono flex items-center gap-1"
                            >
                              <User className="w-3 h-3" /> {story.author}
                            </span>
                          </div>
                          <h3
                            style={{ color: THEME_COLORS.textPrimary }}
                            className="text-xl sm:text-2xl font-bold font-serif italic leading-tight drop-shadow-md"
                          >
                            {story.title}
                          </h3>
                        </div>

                        {/* Bottom Right: Read Bubble & Actions */}
                        <div className="absolute bottom-4 right-4 flex items-center gap-1.5 pointer-events-auto">
                          {onOpenEditor && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenEditor(story);
                              }}
                              style={{
                                backgroundColor: THEME_COLORS.cardElevatedBg,
                                borderColor: THEME_COLORS.cardBorder,
                                color: THEME_COLORS.textPrimary,
                              }}
                              className="p-2 rounded-full border transition-all cursor-pointer hover:opacity-80 shadow-lg backdrop-blur-md"
                              title="Edit in Story Studio"
                              aria-label="Edit Story"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isCustom && onDeleteCustomStory && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Delete story "${story.title}"?`)) {
                                  onDeleteCustomStory(story.id);
                                }
                              }}
                              className="p-2 rounded-full bg-red-950/40 text-red-300 border border-red-500/20 transition-all cursor-pointer hover:bg-red-900/60 shadow-lg backdrop-blur-md"
                              title="Delete story"
                              aria-label="Delete Story"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <div
                            style={{
                              backgroundColor: THEME_COLORS.btnPrimaryBg,
                              color: THEME_COLORS.btnPrimaryText,
                              borderColor: THEME_COLORS.cardBorder,
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold shadow-xl border backdrop-blur-md transition-transform group-hover:scale-105 pointer-events-none"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Read</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              })}

              {filteredItems.length === 0 && (
                <div
                  style={{ color: THEME_COLORS.textMuted }}
                  className="py-12 text-center space-y-3"
                >
                  <p className="text-sm">No stories or series found matching your filter.</p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedLevel("All");
                        setSearchQuery("");
                      }}
                      style={{ color: THEME_COLORS.textPrimary }}
                      className="text-xs font-bold hover:underline cursor-pointer"
                    >
                      Clear filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
      {/* Series Editor Modal */}
      <SeriesEditorModal
        isOpen={Boolean(editingSeries)}
        onClose={() => setEditingSeries(null)}
        series={editingSeries}
        onSave={(data) => {
          if (onUpdateSeries) {
            onUpdateSeries(data);
          }
        }}
      />
    </div>
  );
};

