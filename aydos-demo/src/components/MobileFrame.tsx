import React from "react";
import { Smartphone, Monitor, Wifi, Battery, Signal } from "lucide-react";
import { THEME_COLORS } from "./ThemeColors";

interface MobileFrameProps {
  children: React.ReactNode;
  showPhoneFrame: boolean;
  onTogglePhoneFrame: () => void;
  theme: "day" | "sepia" | "warm" | "night";
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  showPhoneFrame,
  onTogglePhoneFrame,
  theme,
}) => {
  // Theme styling wrapper
  const themeBgClasses = {
    day: "bg-[#f5f5f5] text-neutral-900",
    sepia: "bg-[#181512] text-[#e8dbcd]",
    warm: "bg-[#161210] text-[#eeded5]",
    night: "text-neutral-100",
  }[theme] || "text-neutral-100";

  const contentBgClasses = {
    day: "bg-white text-neutral-900",
    sepia: "bg-[#1e1b17] text-[#e8dbcd]",
    warm: "bg-[#1a1512] text-[#eeded5]",
    night: "text-neutral-100",
  }[theme] || "text-neutral-100";

  const isNight = theme === "night";

  // Desktop Responsive View (Default - fully spacious, zero nested scroll traps)
  if (!showPhoneFrame) {
    return (
      <div
        className={`min-h-screen w-full flex flex-col ${themeBgClasses} transition-colors duration-300 relative`}
        style={isNight ? { backgroundColor: THEME_COLORS.appBackground } : undefined}
      >
        {/* Floating device switcher pill on top right - always visible and accessible */}
        <div className="fixed top-3 right-4 z-50">
          <button
            onClick={onTogglePhoneFrame}
            style={{
              backgroundColor: THEME_COLORS.cardElevatedBg,
              borderColor: THEME_COLORS.cardBorder,
              color: THEME_COLORS.textPrimary,
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:opacity-90 text-xs font-semibold backdrop-blur-md shadow-xl transition-all active:scale-95 cursor-pointer border"
            title="Preview in Mobile Phone simulator mockup"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Phone Frame View</span>
          </button>
        </div>

        <div
          className="flex-1 w-full max-w-4xl mx-auto flex flex-col"
          style={isNight ? { backgroundColor: THEME_COLORS.contentBackground } : undefined}
        >
          {children}
        </div>
      </div>
    );
  }

  // Mobile Simulator Mockup View
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-2 sm:p-6 text-neutral-100 transition-colors duration-300 relative"
      style={{ backgroundColor: THEME_COLORS.appBackground }}
    >
      {/* Switcher back to Full Desktop View */}
      <div className="fixed top-3 right-4 z-50">
        <button
          onClick={onTogglePhoneFrame}
          style={{
            backgroundColor: THEME_COLORS.cardElevatedBg,
            borderColor: THEME_COLORS.cardBorder,
            color: THEME_COLORS.textPrimary,
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:opacity-90 text-xs font-semibold backdrop-blur-md shadow-xl transition-all active:scale-95 cursor-pointer border"
          title="Switch to Full Width Desktop Studio View"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Full Desktop View</span>
        </button>
      </div>

      {/* Phone device mockup */}
      <div
        style={{
          borderColor: THEME_COLORS.mobileFrameBorder,
          backgroundColor: THEME_COLORS.contentBackground,
        }}
        className="w-full max-w-[412px] h-[92vh] rounded-[36px] sm:rounded-[44px] shadow-2xl overflow-hidden border-2 sm:border-[8px] flex flex-col relative"
      >
        {/* Mobile Status Bar */}
        <div
          style={{
            backgroundColor: THEME_COLORS.headerBackground,
            color: THEME_COLORS.textSecondary,
          }}
          className="flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-semibold select-none z-40 shrink-0 border-b border-white/10"
        >
          <span className="font-mono">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {/* Dynamic Island / Notch pill */}
          <div
            style={{ backgroundColor: THEME_COLORS.appBackground }}
            className="w-24 h-4 rounded-full flex items-center justify-center border border-white/10"
          >
            <div
              style={{ backgroundColor: THEME_COLORS.cardElevatedBg }}
              className="w-2 h-2 rounded-full mr-2"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
            <Battery className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Inner viewport with smooth scrolling */}
        <div
          style={isNight ? { backgroundColor: THEME_COLORS.contentBackground } : undefined}
          className={`flex-1 w-full overflow-y-auto flex flex-col ${contentBgClasses} transition-colors duration-300`}
        >
          {children}
        </div>

        {/* Bottom Home Indicator */}
        <div
          style={{
            backgroundColor: THEME_COLORS.headerBackground,
            borderTopColor: THEME_COLORS.cardBorder,
          }}
          className="flex items-center justify-center py-2 z-40 border-t shrink-0"
        >
          <div className="w-32 h-1.5 bg-white/20 rounded-full" />
        </div>
      </div>
    </div>
  );
};
