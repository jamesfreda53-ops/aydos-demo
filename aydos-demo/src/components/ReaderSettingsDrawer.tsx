import React from "react";
import {
  X,
  Sun,
  Moon,
  Coffee,
  Sunset,
  Sparkles,
  Volume2,
  VolumeX,
  Volume1,
  Gauge,
  User,
} from "lucide-react";
import {
  ReaderSettings,
  ReaderTheme,
  FontSizeOption,
  FontFamilyOption,
} from "../types";
import { SPEED_OPTIONS } from "./AudioController";

interface ReaderSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
}

export const ReaderSettingsDrawer: React.FC<ReaderSettingsDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const themes: Array<{
    id: ReaderTheme;
    label: string;
    icon: React.ReactNode;
    previewClass: string;
  }> = [
    {
      id: "night",
      label: "Obsidian",
      icon: <Moon className="w-4 h-4" />,
      previewClass: "bg-[#050505] text-neutral-100 border-white/10",
    },
    {
      id: "warm",
      label: "Midnight Warm",
      icon: <Sunset className="w-4 h-4" />,
      previewClass: "bg-[#1a1512] text-[#eeded5] border-white/10",
    },
    {
      id: "sepia",
      label: "Parchment",
      icon: <Coffee className="w-4 h-4" />,
      previewClass: "bg-[#1e1b17] text-[#e8dbcd] border-white/10",
    },
    {
      id: "day",
      label: "Day Light",
      icon: <Sun className="w-4 h-4" />,
      previewClass: "bg-white text-slate-900 border-slate-300",
    },
  ];

  const fontSizes: Array<{
    id: FontSizeOption;
    label: string;
    preview: string;
  }> = [
    { id: "sm", label: "Standard", preview: "Aa" },
    { id: "base", label: "Medium", preview: "Aa" },
    { id: "lg", label: "Large", preview: "Aa" },
    { id: "xl", label: "X-Large", preview: "Aa" },
  ];

  const fontFamilies: Array<{
    id: FontFamilyOption;
    label: string;
    description: string;
    className: string;
  }> = [
    {
      id: "literata",
      label: "Literata",
      description: "Classic storybook serif",
      className: "font-literata font-serif",
    },
    {
      id: "lexend",
      label: "Lexend",
      description: "High readability & dyslexia friendly",
      className: "font-lexend",
    },
    {
      id: "fredoka",
      label: "Fredoka",
      description: "Friendly, rounded display",
      className: "font-fredoka",
    },
    {
      id: "sans",
      label: "Jakarta",
      description: "Modern clean sans-serif",
      className: "font-jakarta",
    },
  ];

  const currentVol = settings.volume ?? 1.0;
  const isMuted = settings.isMuted ?? false;

  return (
    <div
      id="reader-settings-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 transition-opacity"
      onClick={onClose}
    >
      <div
        id="reader-settings-content"
        className="w-full max-w-md bg-[#0e1b45] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-white/15 p-6 max-h-[85vh] overflow-y-auto transform transition-all text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white font-serif italic">
              Reader & Audio Settings
            </h3>
          </div>
          <button
            id="close-settings-btn"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-blue-200 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 space-y-6">
          {/* Audio Player & Speed Section */}
          <div className="p-3.5 bg-[#08102b] rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5" /> Narration Speed
              </label>
              <span className="text-xs font-mono font-bold text-blue-100">
                {settings.narrationSpeed}x
              </span>
            </div>

            {/* Speed preset pills: 0.75x, 1x, 1.25x, 1.5x, 2x */}
            <div className="grid grid-cols-5 gap-1.5">
              {SPEED_OPTIONS.map((spd) => (
                <button
                  key={spd}
                  onClick={() => onUpdateSettings({ narrationSpeed: spd })}
                  className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all text-center border cursor-pointer ${
                    settings.narrationSpeed === spd
                      ? "bg-white text-blue-950 border-white shadow-sm"
                      : "bg-[#101e46] text-blue-100 border-white/10 hover:bg-[#182e6e]"
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Volume control slider */}
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between text-xs font-medium text-blue-100">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      onUpdateSettings({ isMuted: !isMuted })
                    }
                    className="p-1 rounded-md hover:bg-white/10 transition-all text-white cursor-pointer"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted || currentVol === 0 ? (
                      <VolumeX className="w-4 h-4 text-blue-300/40" />
                    ) : currentVol < 0.5 ? (
                      <Volume1 className="w-4 h-4 text-blue-100" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-white" />
                    )}
                  </button>
                  <span>Volume</span>
                </div>
                <span className="font-mono text-blue-200 text-[11px]">
                  {isMuted ? "Muted" : `${Math.round(currentVol * 100)}%`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : currentVol}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateSettings({
                    volume: val,
                    isMuted: val === 0 ? true : false,
                  });
                }}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            {/* Narrator Voice Preference */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-blue-100 font-medium">
                <User className="w-3.5 h-3.5 text-white" />
                <span>Voice Preference</span>
              </div>
              <div className="flex items-center gap-1 bg-[#101e46] p-1 rounded-lg border border-white/10">
                {(["female", "male", "default"] as const).map((voice) => (
                  <button
                    key={voice}
                    onClick={() => onUpdateSettings({ voiceGender: voice })}
                    className={`px-2 py-0.5 rounded-md text-[11px] capitalize font-medium transition-all cursor-pointer ${
                      (settings.voiceGender || "default") === voice
                        ? "bg-white text-blue-950 font-bold"
                        : "text-blue-200 hover:text-white"
                    }`}
                  >
                    {voice}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Color Theme */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-blue-200/70 mb-2.5">
              Color Palette
            </label>
            <div className="grid grid-cols-4 gap-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onUpdateSettings({ theme: t.id })}
                  className={`p-2.5 rounded-xl flex flex-col items-center gap-1.5 border transition-all text-xs font-semibold cursor-pointer ${
                    t.previewClass
                  } ${
                    settings.theme === t.id
                      ? "ring-2 ring-white ring-offset-2 ring-offset-[#0e1b45] scale-102 font-bold"
                      : "opacity-75 hover:opacity-100"
                  }`}
                >
                  {t.icon}
                  <span className="text-[11px] truncate w-full text-center">
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Text Size */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-blue-200/70 mb-2.5">
              Text Size
            </label>
            <div className="grid grid-cols-4 gap-2">
              {fontSizes.map((fs) => (
                <button
                  key={fs.id}
                  onClick={() => onUpdateSettings({ fontSize: fs.id })}
                  className={`py-2 px-1 rounded-xl text-center border transition-all cursor-pointer ${
                    settings.fontSize === fs.id
                      ? "bg-white text-blue-950 border-white font-bold shadow-md shadow-white/20"
                      : "bg-[#08102b] text-blue-100 border-white/10 hover:bg-[#101e46]"
                  }`}
                >
                  <div className="font-bold text-sm">{fs.preview}</div>
                  <div className="text-[10px] mt-0.5 opacity-90">{fs.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Font Typeface */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-blue-200/70 mb-2.5">
              Reading Typeface
            </label>
            <div className="space-y-2">
              {fontFamilies.map((ff) => (
                <button
                  key={ff.id}
                  onClick={() => onUpdateSettings({ fontFamily: ff.id })}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    ff.className
                  } ${
                    settings.fontFamily === ff.id
                      ? "bg-white/15 border-white text-white font-bold"
                      : "bg-[#08102b] border-white/10 text-blue-100 hover:bg-[#101e46]"
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-white">
                      {ff.label}
                    </div>
                    <div className="text-xs text-blue-200/70 font-sans mt-0.5">
                      {ff.description}
                    </div>
                  </div>
                  {settings.fontFamily === ff.id && (
                    <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_6px_#ffffff]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Narration & Reading options */}
          <div className="space-y-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-neutral-100 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-white" /> Follow-Along Glow
                </div>
                <div className="text-xs text-blue-200/70">
                  Highlight words in real-time as narrator reads
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.highlightSpokenWords}
                onChange={(e) =>
                  onUpdateSettings({ highlightSpokenWords: e.target.checked })
                }
                className="w-4 h-4 rounded-md accent-white cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-neutral-100 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-white" /> Auto-Advance Slides
                </div>
                <div className="text-xs text-blue-200/70">
                  Move to next slide automatically when audio finishes
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoAdvanceOnComplete}
                onChange={(e) =>
                  onUpdateSettings({ autoAdvanceOnComplete: e.target.checked })
                }
                className="w-4 h-4 rounded-md accent-white cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-blue-950 font-bold text-xs transition-all shadow-md shadow-white/20 active:scale-98 cursor-pointer"
          >
            Apply & Read
          </button>
        </div>
      </div>
    </div>
  );
};
