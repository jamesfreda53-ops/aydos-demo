import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Upload,
  Image as ImageIcon,
  Music,
  FileText,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  RefreshCw,
  Sparkles,
  FileCheck,
  ChevronRight,
  Eye,
} from "lucide-react";
import { Story } from "../types";
import { parseStoryTxt } from "../utils/storyTextLoader";

interface StoryAssetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: Story;
  onAssetsUpdated?: () => void;
}

interface AssetFileInfo {
  name: string;
  size: number;
  url: string;
}

export const StoryAssetManagerModal: React.FC<StoryAssetManagerModalProps> = ({
  isOpen,
  onClose,
  story,
  onAssetsUpdated,
}) => {
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState("");
  const [uploadErrorMsg, setUploadErrorMsg] = useState("");

  const [existingImages, setExistingImages] = useState<AssetFileInfo[]>([]);
  const [existingAudio, setExistingAudio] = useState<AssetFileInfo[]>([]);
  const [existingStoryText, setExistingStoryText] = useState<{
    name: string;
    size: number;
    url: string;
    preview?: string;
  } | null>(null);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const seriesFolder = story.seriesFolder || "odyssey";
  const chapterFolder = story.chapterFolder || "lotus_eaters";
  const expectedImageNames = [
    "title.png",
    ...story.slides.map((s) => `${s.slideNumber}.png`),
  ];
  const expectedAudioNames = story.slides.map((s) => `${s.slideNumber}.wav`);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    setUploadErrorMsg("");
    try {
      const res = await fetch(
        `/api/assets/status?seriesFolder=${encodeURIComponent(
          seriesFolder
        )}&chapterFolder=${encodeURIComponent(chapterFolder)}`
      );
      if (res.ok) {
        const data = await res.json();
        setExistingImages(data.images || []);
        setExistingAudio(data.audio || []);
        setExistingStoryText(data.storyText || null);
      }
    } catch (err: any) {
      console.warn("Failed to check asset status:", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setUploadSuccessMsg("");
      setUploadErrorMsg("");
    }
  }, [isOpen, story.id]);

  if (!isOpen) return null;

  const handleProcessAndUpload = async (
    files: FileList | File[],
    assetType: "images" | "audio" | "root"
  ) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadSuccessMsg("");
    setUploadErrorMsg("");

    try {
      const filePayloads: Array<{ name: string; data: string }> = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Preserve original file name (e.g. lotus_eaters.txt)
        const targetFileName = file.name || `${chapterFolder}.txt`;

        filePayloads.push({
          name: targetFileName,
          data: base64,
        });
      }

      const res = await fetch("/api/assets/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seriesFolder,
          chapterFolder,
          assetType,
          files: filePayloads,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to upload asset files");
      }

      const result = await res.json();
      setUploadSuccessMsg(
        `Successfully uploaded ${result.savedCount} file(s)!`
      );
      await fetchStatus();
      if (onAssetsUpdated) {
        onAssetsUpdated();
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadErrorMsg(err.message || "Failed to save files on server.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const allFiles: File[] = Array.from(e.dataTransfer.files);
      const textFiles = allFiles.filter((f) =>
        f.type.startsWith("text/") || /\.(txt|rtf|md)$/i.test(f.name)
      );
      const imageFiles = allFiles.filter((f) =>
        f.type.startsWith("image/") || /\.(png|jpg|jpeg|webp|avif)$/i.test(f.name)
      );
      const audioFiles = allFiles.filter((f) =>
        f.type.startsWith("audio/") || /\.(wav|mp3|ogg|m4a)$/i.test(f.name)
      );

      if (textFiles.length > 0) {
        handleProcessAndUpload(textFiles, "root");
      }
      if (imageFiles.length > 0) {
        handleProcessAndUpload(imageFiles, "images");
      }
      if (audioFiles.length > 0) {
        handleProcessAndUpload(audioFiles, "audio");
      }
    }
  };

  return (
    <div
      id="story-asset-manager-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="relative w-full max-w-2xl bg-[#0e1b45] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#08102b]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Chapter Media & Asset Hub
              </h2>
              <p className="text-xs text-blue-200/80 font-mono">
                /public/stories/{seriesFolder}/{chapterFolder}/images/
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchStatus}
              disabled={loadingStatus || uploading}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-blue-100 hover:text-white transition-colors"
              title="Refresh status from disk"
            >
              <RefreshCw
                className={`w-4 h-4 ${loadingStatus ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-blue-200 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
          {/* Status Alert Banner */}
          {uploadSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{uploadSuccessMsg}</span>
            </div>
          )}

          {uploadErrorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadErrorMsg}</span>
            </div>
          )}

          {/* Drag & Drop Upload Zone */}
          <div
            className="border-2 border-dashed border-white/20 hover:border-white/50 rounded-2xl p-6 text-center bg-[#08102b] transition-colors flex flex-col items-center justify-center cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/png,image/jpeg,image/webp,image/avif"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  handleProcessAndUpload(e.target.files, "images");
                }
              }}
            />
            <input
              type="file"
              ref={audioInputRef}
              multiple
              accept="audio/wav,audio/mp3,audio/ogg,audio/m4a"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  handleProcessAndUpload(e.target.files, "audio");
                }
              }}
            />

            <input
              type="file"
              ref={textInputRef}
              accept=".txt,.rtf,.md,text/plain"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  handleProcessAndUpload(e.target.files, "root");
                }
              }}
            />

            <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>

            <h3 className="text-sm font-semibold text-white mb-1">
              Drag & Drop Chapter Files or Click to Browse
            </h3>
            <p className="text-xs text-blue-200/80 max-w-md mb-3">
              Drop all files at once (<code className="text-white font-bold">{chapterFolder}.txt</code>,{" "}
              <code className="text-white font-bold">title.png</code>,{" "}
              <code className="text-white font-bold">1.png - 7.png</code>,{" "}
              <code className="text-white font-bold">1.wav - 7.wav</code>). Files are saved
              directly to disk.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                disabled={uploading}
                onClick={(e) => {
                  e.stopPropagation();
                  textInputRef.current?.click();
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                {uploading ? "Saving..." : `Select ${chapterFolder}.txt`}
              </button>

              <button
                type="button"
                disabled={uploading}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-blue-950 text-xs font-bold transition-all shadow-md shadow-white/20 active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Select Images
              </button>

              <button
                type="button"
                disabled={uploading}
                onClick={(e) => {
                  e.stopPropagation();
                  audioInputRef.current?.click();
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer border border-white/15"
              >
                <Music className="w-3.5 h-3.5" />
                Select Audio (.wav)
              </button>
            </div>
          </div>

          {/* Story Text (story.txt) Status Card */}
          <div className="p-4 rounded-2xl bg-[#08102b] border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Chapter Text File (<code className="text-amber-300 font-mono">story.txt</code>)
                </span>
              </div>
              {existingStoryText ? (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Loaded ({Math.round(existingStoryText.size / 1024 * 10) / 10} KB)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-amber-300 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Using default text
                </span>
              )}
            </div>

            <p className="text-xs text-blue-200/70 leading-relaxed">
              Place triggers like <code className="text-amber-300 bg-black/40 px-1.5 py-0.5 rounded font-mono">[1]</code>, <code className="text-amber-300 bg-black/40 px-1.5 py-0.5 rounded font-mono">[2]</code>, etc. in <code className="text-white font-mono">story.txt</code> to demarcate slide paragraphs.
            </p>

            {existingStoryText?.preview && (
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 font-mono text-[11px] text-blue-200/80 max-h-24 overflow-y-auto whitespace-pre-wrap">
                {existingStoryText.preview}...
              </div>
            )}
          </div>

          {/* Chapter Images Status Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-200 flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 text-white" />
                Chapter Slide Illustrations ({existingImages.length} / {expectedImageNames.length} on disk)
              </h4>
              <span className="text-[11px] text-blue-200/60 font-mono">
                PNG • 1:1 Aspect Ratio
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {expectedImageNames.map((imgName) => {
                const isFound = existingImages.some(
                  (f) => f.name.toLowerCase() === imgName.toLowerCase()
                );
                const fileObj = existingImages.find(
                  (f) => f.name.toLowerCase() === imgName.toLowerCase()
                );
                const isTitle = imgName === "title.png";
                const label = isTitle ? "Cover Artwork" : `Slide ${imgName.replace(".png", "")}`;

                return (
                  <div
                    key={imgName}
                    className={`relative p-2.5 rounded-2xl border-2 transition-all flex flex-col items-center justify-between gap-2 text-center group ${
                      isFound
                        ? "bg-[#08102b] border-emerald-500/50"
                        : "bg-[#08102b] border-white/10"
                    }`}
                  >
                    {/* Thumbnail preview if exists */}
                    <div className="relative w-full aspect-square rounded-xl bg-[#0e1b45] overflow-hidden border-2 border-white/10 flex items-center justify-center">
                      {isFound && fileObj ? (
                        <>
                          <img
                            src={`${fileObj.url}?t=${Date.now()}`}
                            alt={imgName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            onClick={() => setPreviewImageModal(fileObj.url)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                            title="Preview image full-size"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-blue-300/40 p-2">
                          <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                          <span className="text-[9px]">Awaiting file</span>
                        </div>
                      )}

                      {/* Status indicator pill */}
                      <span
                        className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center shadow-sm ${
                          isFound
                            ? "bg-emerald-500 text-white"
                            : "bg-blue-950 text-blue-300 border border-white/10"
                        }`}
                      >
                        {isFound ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400/50" />
                        )}
                      </span>
                    </div>

                    <div className="w-full">
                      <p className="text-xs font-semibold text-white truncate">
                        {label}
                      </p>
                      <p className="text-[10px] font-mono text-blue-200/70 truncate">
                        {imgName}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chapter Audio Status Grid */}
          <div className="space-y-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-200 flex items-center gap-2">
                <Music className="w-3.5 h-3.5 text-white" />
                Narration Audio Tracks ({existingAudio.length} / {expectedAudioNames.length} on disk)
              </h4>
              <span className="text-[11px] text-blue-200/60 font-mono">
                WAV / MP3
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {expectedAudioNames.map((audName) => {
                const isFound = existingAudio.some(
                  (f) => f.name.toLowerCase() === audName.toLowerCase()
                );
                return (
                  <div
                    key={audName}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                      isFound
                        ? "bg-[#08102b] border-emerald-500/30 text-emerald-300"
                        : "bg-[#08102b] border-white/5 text-blue-200/60"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Music className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-xs font-mono truncate">{audName}</span>
                    </div>
                    {isFound ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <span className="text-[10px] text-blue-200/50 shrink-0">Missing</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-[#08102b] flex items-center justify-between">
          <p className="text-[11px] text-blue-200/80">
            Files uploaded here are saved directly to the project's <code className="text-white font-bold">public/</code> directory and persist across browser reloads.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-blue-950 text-xs font-bold transition-colors shrink-0 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Large Image Preview Modal */}
      {previewImageModal && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewImageModal(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl border border-white/20">
            <img
              src={previewImageModal}
              alt="Preview"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={() => setPreviewImageModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/70 text-white hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
