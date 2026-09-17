import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Volume2,
  Volume1,
  VolumeX,
  Gauge,
  FastForward,
  Rewind,
} from "lucide-react";
import { THEME_COLORS } from "./ThemeColors";

interface AudioControllerProps {
  isPlaying: boolean;
  isPaused: boolean;
  onPlayToggle: () => void;
  onReplay: () => void;
  onRewind?: () => void;
  onForward?: () => void;
  playbackRate: number;
  onRateChange: (newRate: number) => void;
  volume?: number;
  isMuted?: boolean;
  onVolumeChange?: (newVolume: number) => void;
  onMuteToggle?: () => void;
  progressPct?: number;
  currentTimeSec?: number;
  durationSec?: number;
  currentSlideIndex: number;
  totalSlides: number;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  onOpenQuiz?: () => void;
  isLastSlide?: boolean;
}

export const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5, 2.0] as const;

export const AudioController: React.FC<AudioControllerProps> = ({
  isPlaying,
  isPaused,
  onPlayToggle,
  onReplay,
  onRewind,
  onForward,
  playbackRate,
  onRateChange,
  volume = 1.0,
  isMuted = false,
  onVolumeChange,
  onMuteToggle,
  progressPct = 0,
  currentTimeSec = 0,
  durationSec = 0,
  currentSlideIndex,
  totalSlides,
  onPrevSlide,
  onNextSlide,
  onOpenQuiz,
  isLastSlide,
}) => {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const speedMenuRef = useRef<HTMLDivElement>(null);
  const volumeMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        speedMenuRef.current &&
        !speedMenuRef.current.contains(e.target as Node)
      ) {
        setShowSpeedMenu(false);
      }
      if (
        volumeMenuRef.current &&
        !volumeMenuRef.current.contains(e.target as Node)
      ) {
        setShowVolumeSlider(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const cycleSpeed = () => {
    const currentIndex = SPEED_OPTIONS.indexOf(
      playbackRate as (typeof SPEED_OPTIONS)[number]
    );
    const nextIndex =
      currentIndex === -1 ? 1 : (currentIndex + 1) % SPEED_OPTIONS.length;
    onRateChange(SPEED_OPTIONS[nextIndex]);
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <VolumeX className="w-4 h-4" style={{ color: THEME_COLORS.textMuted }} />;
    }
    if (volume < 0.5) {
      return <Volume1 className="w-4 h-4" style={{ color: THEME_COLORS.textSecondary }} />;
    }
    return <Volume2 className="w-4 h-4" style={{ color: THEME_COLORS.textPrimary }} />;
  };

  return (
    <div
      id="audio-controller-dock"
      style={{
        backgroundColor: `${THEME_COLORS.headerBackground}f5`,
        borderColor: THEME_COLORS.cardBorder,
      }}
      className="sticky bottom-0 z-30 w-full backdrop-blur-md border-t shadow-2xl transition-all"
    >
      {/* Top progress scrubber line */}
      <div className="w-full bg-white/10 h-1 relative overflow-hidden group">
        <div
          className="h-full transition-all duration-200"
          style={{
            backgroundColor: THEME_COLORS.btnPrimaryBg,
            width: `${Math.min(100, Math.max(0, progressPct))}%`,
          }}
        />
        {isPlaying && !isPaused && (
          <div
            className="absolute top-0 bottom-0 w-2 rounded-full -translate-x-1"
            style={{
              backgroundColor: THEME_COLORS.btnPrimaryBg,
              left: `${Math.min(100, Math.max(0, progressPct))}%`,
              boxShadow: `0 0 8px ${THEME_COLORS.btnPrimaryBg}`,
            }}
          />
        )}
      </div>

      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        {/* Left: Previous Slide Button */}
        <button
          id="prev-slide-btn"
          onClick={onPrevSlide}
          disabled={currentSlideIndex === 0}
          style={{
            backgroundColor: THEME_COLORS.cardElevatedBg,
            borderColor: THEME_COLORS.cardBorder,
            color: THEME_COLORS.textPrimary,
          }}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95 shrink-0 cursor-pointer hover:opacity-80"
          aria-label="Previous Slide"
          title="Previous Slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Center: Audio Player Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap justify-center">
          {/* Rewind 5 seconds button */}
          <button
            id="rewind-5s-btn"
            onClick={onRewind || onReplay}
            style={{
              backgroundColor: THEME_COLORS.cardElevatedBg,
              borderColor: THEME_COLORS.cardBorder,
              color: THEME_COLORS.textPrimary,
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border flex items-center justify-center transition-all active:scale-95 cursor-pointer hover:opacity-80"
            title="Rewind 5 seconds / restart slide"
            aria-label="Rewind audio"
          >
            <Rewind className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Replay Entire Slide button */}
          <button
            id="replay-audio-btn"
            onClick={onReplay}
            style={{
              backgroundColor: THEME_COLORS.cardElevatedBg,
              borderColor: THEME_COLORS.cardBorder,
              color: THEME_COLORS.textPrimary,
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border flex items-center justify-center transition-all active:scale-95 cursor-pointer hover:opacity-80"
            title="Replay from start of slide"
            aria-label="Replay audio from start"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Main Play / Pause Button */}
          <button
            id="main-play-audio-btn"
            onClick={onPlayToggle}
            style={{
              backgroundColor: THEME_COLORS.btnPrimaryBg,
              color: THEME_COLORS.btnPrimaryText,
              borderColor: THEME_COLORS.cardBorder,
            }}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center font-bold shadow-lg transition-all active:scale-95 cursor-pointer hover:opacity-90 shrink-0"
            aria-label={isPlaying && !isPaused ? "Pause audio narration" : "Play audio narration"}
            title={isPlaying && !isPaused ? "Pause" : "Play"}
          >
            {isPlaying && !isPaused ? (
              <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            ) : (
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Fast Forward 5 seconds button (if audio element) */}
          {onForward && (
            <button
              id="forward-5s-btn"
              onClick={onForward}
              style={{
                backgroundColor: THEME_COLORS.cardElevatedBg,
                borderColor: THEME_COLORS.cardBorder,
                color: THEME_COLORS.textPrimary,
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border hidden xs:flex items-center justify-center transition-all active:scale-95 cursor-pointer hover:opacity-80"
              title="Skip forward 5 seconds"
              aria-label="Fast forward"
            >
              <FastForward className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}

          {/* Speed selector popup / toggle */}
          <div className="relative" ref={speedMenuRef}>
            <button
              id="speed-cycle-btn"
              onClick={() => setShowSpeedMenu((prev) => !prev)}
              onContextMenu={(e) => {
                e.preventDefault();
                cycleSpeed();
              }}
              style={{
                backgroundColor: THEME_COLORS.cardElevatedBg,
                borderColor: THEME_COLORS.cardBorder,
                color: THEME_COLORS.textPrimary,
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer hover:opacity-80"
              title="Click to choose speed (0.75x, 1x, 1.25x, 1.5x, 2x)"
            >
              <Gauge className="w-3 h-3" />
              <span>{playbackRate}x</span>
            </button>

            {/* Speed selection dropdown modal/popover */}
            {showSpeedMenu && (
              <div
                id="speed-options-popover"
                style={{
                  backgroundColor: THEME_COLORS.cardElevatedBg,
                  borderColor: THEME_COLORS.cardBorder,
                }}
                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 border rounded-xl p-1.5 shadow-2xl flex flex-col gap-1 min-w-[90px] z-50 animate-in fade-in zoom-in-95 duration-100"
              >
                <div
                  style={{ color: THEME_COLORS.textMuted, borderColor: THEME_COLORS.cardBorder }}
                  className="text-[10px] font-bold uppercase tracking-wider text-center py-0.5 border-b"
                >
                  Speed
                </div>
                {SPEED_OPTIONS.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => {
                      onRateChange(speed);
                      setShowSpeedMenu(false);
                    }}
                    style={{
                      backgroundColor:
                        playbackRate === speed ? THEME_COLORS.btnPrimaryBg : "transparent",
                      color:
                        playbackRate === speed
                          ? THEME_COLORS.btnPrimaryText
                          : THEME_COLORS.textSecondary,
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-center transition-all cursor-pointer hover:opacity-90"
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Volume control with slider popover */}
          <div className="relative" ref={volumeMenuRef}>
            <button
              id="volume-control-btn"
              onClick={() => {
                if (onMuteToggle && !showVolumeSlider) {
                  // Toggle slider view
                  setShowVolumeSlider((prev) => !prev);
                } else if (onMuteToggle) {
                  onMuteToggle();
                }
              }}
              onMouseEnter={() => setShowVolumeSlider(true)}
              style={{
                backgroundColor: THEME_COLORS.cardElevatedBg,
                borderColor: THEME_COLORS.cardBorder,
                color: THEME_COLORS.textPrimary,
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border flex items-center justify-center transition-all active:scale-95 cursor-pointer hover:opacity-80"
              title={isMuted ? "Unmute audio" : "Volume controls"}
              aria-label="Volume controls"
            >
              {getVolumeIcon()}
            </button>

            {/* Volume slider popover */}
            {showVolumeSlider && onVolumeChange && (
              <div
                id="volume-slider-popover"
                style={{
                  backgroundColor: THEME_COLORS.cardElevatedBg,
                  borderColor: THEME_COLORS.cardBorder,
                }}
                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 border rounded-xl p-3 shadow-2xl flex flex-col items-center gap-2 min-w-[130px] z-50 animate-in fade-in zoom-in-95 duration-100"
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <div
                  style={{ color: THEME_COLORS.textSecondary }}
                  className="flex items-center justify-between w-full text-[10px] font-bold"
                >
                  <span>Volume</span>
                  <span style={{ color: THEME_COLORS.textPrimary }} className="font-mono">
                    {isMuted ? "0%" : `${Math.round(volume * 100)}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const newVol = parseFloat(e.target.value);
                    onVolumeChange(newVol);
                    if (isMuted && onMuteToggle && newVol > 0) {
                      onMuteToggle();
                    }
                  }}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                  aria-label="Volume slider"
                />
                {onMuteToggle && (
                  <button
                    onClick={onMuteToggle}
                    style={{
                      backgroundColor: THEME_COLORS.cardBackground,
                      color: THEME_COLORS.textSecondary,
                    }}
                    className="w-full py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all text-center cursor-pointer hover:opacity-80"
                  >
                    {isMuted ? "Unmute" : "Mute"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Next Slide or Quiz button */}
        {isLastSlide ? (
          <button
            id="finish-quiz-btn"
            onClick={onOpenQuiz}
            style={{
              backgroundColor: THEME_COLORS.btnPrimaryBg,
              color: THEME_COLORS.btnPrimaryText,
            }}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 shrink-0 cursor-pointer hover:opacity-90"
            title="Take story quiz"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
            <span>Quiz</span>
          </button>
        ) : (
          <button
            id="next-slide-btn"
            onClick={onNextSlide}
            disabled={currentSlideIndex === totalSlides - 1}
            style={{
              backgroundColor: THEME_COLORS.cardElevatedBg,
              borderColor: THEME_COLORS.cardBorder,
              color: THEME_COLORS.textPrimary,
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95 shrink-0 cursor-pointer hover:opacity-80"
            aria-label="Next Slide"
            title="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
