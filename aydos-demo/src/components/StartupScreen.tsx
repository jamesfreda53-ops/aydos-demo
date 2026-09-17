import React from "react";
import { motion } from "motion/react";
import { THEME_COLORS } from "./ThemeColors";
import { AYDOS_LOGO_DATA_URI } from "../assets/logoBase64";

interface StartupScreenProps {
  onStart: () => void;
}

export const StartupScreen: React.FC<StartupScreenProps> = ({ onStart }) => {
  const navyBgColor = THEME_COLORS.contentBackground;

  return (
    <motion.div
      id="startup-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between sm:justify-center p-4 sm:p-6 select-none overflow-hidden"
      style={{
        backgroundColor: navyBgColor,
      }}
    >
      {/* Spacer for balanced mobile vertical distribution */}
      <div className="hidden sm:block" />

      <div className="flex flex-col items-center justify-center max-w-sm w-full text-center my-auto">
        {/* AYDOS Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-6 sm:mb-12 flex items-center justify-center"
        >
          {/* Ambient halo glow */}
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-20 pointer-events-none scale-90 sm:scale-100"
            style={{ backgroundColor: "#38bdf8" }}
          />

          {/* Logo Frame: Scaled safely down for smaller mobile viewports (e.g., iPhone SE) */}
          <div
            className="w-32 h-32 xs:w-36 xs:h-36 sm:w-52 sm:h-52 md:w-60 md:h-60 rounded-full overflow-hidden flex items-center justify-center shadow-2xl border shrink-0 relative bg-black/20"
            style={{
              borderColor: THEME_COLORS.cardBorder,
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
            }}
          >
            <img
              src={AYDOS_LOGO_DATA_URI}
              alt="AYDOS"
              className="w-full h-full object-cover select-none pointer-events-none"
              draggable={false}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/aydos.png";
              }}
            />
          </div>
        </motion.div>

        {/* Start Your Journey Button */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex justify-center px-2 sm:px-0"
        >
          <button
            id="startup-start-journey-btn"
            type="button"
            onClick={onStart}
            style={{
              backgroundColor: "#ffffff",
              color: navyBgColor,
            }}
            className="w-full sm:w-auto px-6 py-3.5 sm:px-10 sm:py-4 rounded-full font-bold text-sm sm:text-lg tracking-wide shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-2xl cursor-pointer"
          >
            Start Your Journey
          </button>
        </motion.div>
      </div>

      {/* Subtle Mobile Footer Spacing/Safe Area padding insurance */}
      <div className="h-4 sm:hidden shrink-0" />
    </motion.div>
  );
};
