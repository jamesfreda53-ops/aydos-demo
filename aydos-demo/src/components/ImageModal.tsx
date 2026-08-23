import React from "react";
import { X, Sparkles } from "lucide-react";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  caption: string;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  caption,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="image-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95 border border-white/10"
          aria-label="Close image inspection"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-full rounded-3xl overflow-hidden shadow-2xl border-2 sm:border-[2.5px] border-white/20 bg-[#08102b]">
          <img
            src={imageUrl}
            alt={caption}
            className="w-full max-h-[75vh] object-contain mx-auto"
            referrerPolicy="no-referrer"
          />
        </div>

        {caption && (
          <div className="mt-3.5 px-4 py-2 rounded-2xl bg-[#0e1b45]/90 backdrop-blur-md text-white text-xs sm:text-sm text-center max-w-lg border border-white/15 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-white shrink-0" />
            <span className="font-serif italic">{caption}</span>
          </div>
        )}
      </div>
    </div>
  );
};
