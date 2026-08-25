import React, { useState, useEffect } from "react";
import { X, Save, Layers, Sparkles, Image as ImageIcon, BookOpen, Check } from "lucide-react";
import { GITHUB_RAW_BASE_URL, seriesTitleImage, resolveStoryAssetUrl, handleImageFallback } from "../utils/storyAssets";

export interface SeriesData {
  seriesId: string;
  seriesTitle: string;
  seriesDescription: string;
  seriesFolder: string;
  seriesCoverImage: string;
  author: string;
  genre: string;
  readingLevel: "Beginner" | "Intermediate" | "Advanced";
  tags?: string[];
}

interface SeriesEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  series: SeriesData | null;
  onSave: (updated: SeriesData) => void;
}

const GENRE_SUGGESTIONS = [
  "Epic & Adventure",
  "Mythology",
  "Folklore",
  "Fantasy",
  "Historical Fiction",
  "Science & Nature",
  "Mystery & Suspense",
  "Drama",
];

export const SeriesEditorModal: React.FC<SeriesEditorModalProps> = ({
  isOpen,
  onClose,
  series,
  onSave,
}) => {
  const [seriesTitle, setSeriesTitle] = useState("");
  const [seriesDescription, setSeriesDescription] = useState("");
  const [seriesFolder, setSeriesFolder] = useState("");
  const [seriesCoverImage, setSeriesCoverImage] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");
  const [readingLevel, setReadingLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (series) {
      setSeriesTitle(series.seriesTitle || "");
      setSeriesDescription(series.seriesDescription || "");
      setSeriesFolder(series.seriesFolder || "");
      setSeriesCoverImage(series.seriesCoverImage || "");
      setAuthor(series.author || "");
      setGenre(series.genre || "Epic & Adventure");
      setReadingLevel(series.readingLevel || "Intermediate");
      setTags(series.tags || []);
      setTagInput("");
    }
  }, [series]);

  if (!isOpen || !series) return null;

  const currentFolder = seriesFolder.trim() || series.seriesFolder || "series";
  const defaultGithubCoverUrl = `${GITHUB_RAW_BASE_URL}/${currentFolder}/title.webp`;
  const activeCoverPreview = seriesCoverImage.trim() || defaultGithubCoverUrl;

  const handleAddTag = (rawTag?: string) => {
    const textToAdd = (rawTag !== undefined ? rawTag : tagInput).trim();
    if (!textToAdd) return;

    // Handle multiple tags or bracketed tags e.g. "[odyssey] [mythology]"
    const matches = textToAdd.match(/\[(.*?)\]/g);
    let newTags: string[] = [];
    if (matches && matches.length > 0) {
      newTags = matches.map((m) => m.slice(1, -1).trim()).filter(Boolean);
    } else {
      newTags = textToAdd
        .split(/[,;\s]+/)
        .map((t) => t.replace(/^[#\[\]]+|[#\[\]]+$/g, "").trim())
        .filter(Boolean);
    }

    if (newTags.length > 0) {
      setTags((prev) => {
        const set = new Set(prev.map((t) => t.toLowerCase()));
        const added = [...prev];
        for (const nt of newTags) {
          if (!set.has(nt.toLowerCase())) {
            set.add(nt.toLowerCase());
            added.push(nt);
          }
        }
        return added;
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setTags((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      seriesId: series.seriesId,
      seriesTitle: seriesTitle.trim() || series.seriesTitle,
      seriesDescription: seriesDescription.trim(),
      seriesFolder: seriesFolder.trim() || series.seriesFolder,
      seriesCoverImage: seriesCoverImage.trim() || defaultGithubCoverUrl,
      author: author.trim() || "Author",
      genre: genre.trim() || "Adventure",
      readingLevel,
      tags: tags.length > 0 ? tags : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="series-editor-modal"
        className="w-full max-w-lg bg-[#141414] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#1a1a1a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-serif italic">
                Edit Series Information
              </h2>
              <p className="text-[10px] text-neutral-400">
                Update series details, artwork, and GitHub asset path
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Live Cover Preview */}
          <div className="flex items-center gap-4 p-3 rounded-2xl bg-[#1c1c1c] border border-white/10">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-white/15 bg-black/50">
              <img
                src={resolveStoryAssetUrl(activeCoverPreview)}
                alt="Series Cover Preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={handleImageFallback}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono text-orange-400 uppercase font-bold tracking-wider">
                Series Showcase
              </div>
              <h3 className="text-sm font-bold text-white font-serif italic truncate mt-0.5">
                {seriesTitle || "Untitled Series"}
              </h3>
              <p className="text-xs text-neutral-400 truncate mt-0.5">
                {genre} • {author || "Unknown Author"}
              </p>
              <div className="mt-1 text-[10px] text-neutral-500 font-mono truncate">
                Folder: /{currentFolder}/
              </div>
            </div>
          </div>

          {/* Series Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-200">
              Series Title <span className="text-orange-400">*</span>
            </label>
            <input
              type="text"
              required
              value={seriesTitle}
              onChange={(e) => setSeriesTitle(e.target.value)}
              placeholder="e.g. The Odyssey"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c1c1c] border border-white/10 text-white text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-1 focus:ring-orange-400 font-serif"
            />
          </div>

          {/* Author and Genre */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-200">
                Author / Narrator
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Homer"
                className="w-full px-3 py-2 rounded-xl bg-[#1c1c1c] border border-white/10 text-white text-xs focus:outline-hidden focus:ring-1 focus:ring-orange-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-200">
                Genre / Category
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g. Epic & Adventure"
                className="w-full px-3 py-2 rounded-xl bg-[#1c1c1c] border border-white/10 text-white text-xs focus:outline-hidden focus:ring-1 focus:ring-orange-400"
              />
            </div>
          </div>

          {/* Genre Chips */}
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">
              Quick Suggestions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {GENRE_SUGGESTIONS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenre(g)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                    genre.toLowerCase() === g.toLowerCase()
                      ? "bg-orange-500/20 text-orange-300 border-orange-500/40 font-bold"
                      : "bg-[#1c1c1c] text-neutral-400 border-white/5 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Target Reading Level */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-200">
              Target Reading Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["Beginner", "Intermediate", "Advanced"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setReadingLevel(lvl)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    readingLevel === lvl
                      ? "bg-orange-400 text-neutral-950 border-orange-400 shadow-md shadow-orange-500/20"
                      : "bg-[#1c1c1c] text-neutral-400 border-white/10 hover:text-white"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Series Overview / Lore Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-200 flex items-center justify-between">
              <span>Series Overview / Synopsis</span>
              <span className="text-[10px] text-neutral-500 font-mono">
                {seriesDescription.length} chars
              </span>
            </label>
            <textarea
              rows={3}
              value={seriesDescription}
              onChange={(e) => setSeriesDescription(e.target.value)}
              placeholder="Enter an engaging overarching description for this series collection..."
              className="w-full p-3 rounded-xl bg-[#1c1c1c] border border-white/10 text-xs text-neutral-200 focus:outline-hidden focus:ring-1 focus:ring-orange-400 leading-relaxed"
            />
          </div>

          {/* GitHub Series Asset Pathway */}
          <div className="p-3.5 rounded-2xl bg-[#1a1a1a] border border-white/10 space-y-2.5">
            <label className="text-xs font-semibold text-neutral-200 flex items-center justify-between">
              <span>GitHub Series Folder Name</span>
              <span className="text-[10px] text-neutral-400 font-mono">under /public/stories/</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={seriesFolder}
                onChange={(e) =>
                  setSeriesFolder(
                    e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "")
                  )
                }
                placeholder="e.g. odyssey"
                className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs font-mono text-orange-300 focus:outline-hidden focus:ring-1 focus:ring-orange-400"
              />
              <button
                type="button"
                onClick={() => setSeriesCoverImage(defaultGithubCoverUrl)}
                className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] text-neutral-300 font-semibold border border-white/10 whitespace-nowrap cursor-pointer"
                title="Reset cover URL to GitHub series title art"
              >
                Use GitHub Cover
              </button>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono break-all leading-tight">
              Resolved: {GITHUB_RAW_BASE_URL}/{currentFolder}/title.webp
            </div>
          </div>

          {/* Custom Cover Artwork URL Override */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-200">
              Series Cover Image URL (Optional Override)
            </label>
            <input
              type="text"
              value={seriesCoverImage}
              onChange={(e) => setSeriesCoverImage(e.target.value)}
              placeholder="Leave empty to use GitHub /<seriesFolder>/title.webp"
              className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c1c] border border-white/10 text-xs font-mono text-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-orange-400"
            />
          </div>

          {/* Search Tags (Hidden from user display, searchable in Library) */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-[#1a1a1a] border border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <span>Search Tags</span>
                <span className="text-[10px] text-neutral-400 font-normal">
                  (Hidden from students; searchable in Library)
                </span>
              </label>
              <span className="text-[10px] font-mono text-orange-400">
                {tags.length} tag{tags.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Existing Tags Chips */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-[#141414] border border-white/5 max-h-24 overflow-y-auto">
                {tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-300 text-xs font-mono font-medium"
                  >
                    <span>[{t}]</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(idx)}
                      className="text-orange-400 hover:text-white transition-colors cursor-pointer ml-0.5"
                      title={`Remove [${t}]`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add Tag Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Type tag name and hit enter, e.g. [mythology] [homer]..."
                className="flex-1 px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-orange-400"
              />
              <button
                type="button"
                onClick={() => handleAddTag()}
                className="px-3 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-xs font-semibold border border-orange-500/30 transition-all cursor-pointer whitespace-nowrap"
              >
                Add Tag
              </button>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-white/10 bg-[#1a1a1a]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-400 hover:bg-orange-300 text-neutral-950 text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Series Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
