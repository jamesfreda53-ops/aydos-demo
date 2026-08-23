import React, { useEffect } from "react";

/**
 * ============================================================================
 * 🎨 THEME & UI/TEXT COLOR CONTROLLER
 * ============================================================================
 * Edit the hex codes and colors in this file to customize the entire look & feel
 * of the application! All components and text styles read from this configuration.
 * ============================================================================
 */

export const THEME_COLORS = {
  // --------------------------------------------------------------------------
  // 1. 🌌 MAIN APPLICATION & SCREEN BACKGROUNDS
  // --------------------------------------------------------------------------
  appBackground: "#424245",       // Deepest canvas background (desktop viewport background)
  contentBackground: "#070326",   // Main story reader & library background
  headerBackground: "#070326",    // Top story header & navigation bar background
  footerBackground: "#070326",    // Bottom audio controller bar background
  mobileFrameBorder: "#030303",   // Outer border of the simulated phone frame

  // --------------------------------------------------------------------------
  // 2. 🗂️ CARDS, CONTAINERS & PANELS
  // --------------------------------------------------------------------------
  cardBackground: "#070326",      // Story cards, series cards, slide jumpers
  cardElevatedBg: "#070326",      // Elevated cards, badges, nested card containers
  cardHoverBackground: "#45d411", // Card background when hovered or focused
  cardBorder: "rgba(255, 255, 255, 0.12)",      // Card outer border line
  cardBorderHover: "rgba(255, 255, 255, 0.35)", // Card border line on hover

  // --------------------------------------------------------------------------
  // 3. 🪟 MODALS & DRAWERS (Dictionary, Settings, Quiz, Assets, Word Bank)
  // --------------------------------------------------------------------------
  modalOverlay: "#070326", // Dark backdrop behind opened modals
  modalBackground: "#070326",          // Modal main panel background
  modalInnerCard: "#08102b",           // Inner sections, question boxes, flashcards
  modalBorder: "#070326", // Border around modals and drawers

  // --------------------------------------------------------------------------
  // 4. ✍️ TYPOGRAPHY & TEXT COLORS
  // --------------------------------------------------------------------------
  textPrimary: "#ffffff",         // Main titles, slide story paragraphs, dialog headings
  textSecondary: "#c8d6ff",       // Subtitles, author names, description paragraphs
  textMuted: "#8da2d8",           // Slide counters, metadata, dates, secondary labels
  textAccent: "#ffffff",          // Highlighted text, active filter text
  textInverse: "#060d24",         // Dark text inside bright white/accent buttons
  textCodeSnippet: "#93c5fd",     // Code / file names font color

  // --------------------------------------------------------------------------
  // 5. ⭐ BRAND ACCENTS & GLOWS
  // --------------------------------------------------------------------------
  accentPrimary: "#ffffff",       // Primary action button background, active tab pill
  accentSecondary: "#38bdf8",     // Secondary bright icons, stars, bookmarks
  accentGlow: "rgba(255, 255, 255, 0.25)", // Subtle shadow/glow for active items
  dividerColor: "rgba(255, 255, 255, 0.10)", // Divider lines between sections

  // --------------------------------------------------------------------------
  // 6. 🔘 BUTTONS & INTERACTIVE CONTROLS
  // --------------------------------------------------------------------------
  // Primary Buttons (e.g. "Read Chapter", "Start Quiz", "Apply & Read")
  btnPrimaryBg: "#070326",
  btnPrimaryText: "#faf8f5",
  btnPrimaryHover: "#101e46",
  btnPrimaryShadow: "rgba(0, 0, 0, 0.35)",

  // Secondary / Outline Buttons (e.g. Icon circles, Filter pills, Close buttons)
  btnSecondaryBg: "#070326",
  btnSecondaryText: "#ffffff",
  btnSecondaryHover: "#101e46",
  btnSecondaryBorder: "rgba(255, 255, 255, 0.15)",

  // --------------------------------------------------------------------------
  // 7. 🎵 AUDIO CONTROLLER & MEDIA PLAYER
  // --------------------------------------------------------------------------
  audioBarBg: "#08102b",                  // Sticky bottom player background
  audioBarBorder: "rgba(255, 255, 255, 0.12)", // Border line above bottom audio bar
  audioProgressTrack: "rgba(255, 255, 255, 0.18)", // Audio seeker track background
  audioProgressFill: "#ffffff",           // Audio playback elapsed progress bar
  audioPlayBtnBg: "#ffffff",              // Circular Play / Pause button background
  audioPlayBtnIcon: "#08102b",            // Circular Play / Pause icon color
  audioTimeText: "#c8d6ff",               // 0:00 / 0:25 timestamp text color

  // --------------------------------------------------------------------------
  // 8. 📖 STORY READER & VOCABULARY HIGHLIGHTS
  // --------------------------------------------------------------------------
  narratorSpokenGlow: "rgba(255, 255, 255, 0.28)", // Highlight box on currently spoken word
  narratorSpokenText: "#ffffff",                   // Text color of actively spoken word
  vocabHelperUnderline: "rgba(141, 162, 216, 0.65)", // Dashed underline when Vocab Helper is on
  vocabHelperBadgeBg: "#101e46",                  // Vocab Helper active status badge
  vocabHelperBadgeText: "#ffffff",                // Vocab Helper active text

  // --------------------------------------------------------------------------
  // 9. 🧩 COMPREHENSION QUIZ & FLASHCARDS
  // --------------------------------------------------------------------------
  quizOptionDefaultBg: "#08102b",
  quizOptionDefaultText: "#c8d6ff",
  quizOptionHoverBg: "#101e46",
  quizOptionBorder: "rgba(255, 255, 255, 0.15)",
  flashcardGradientFrom: "#0b1536",
  flashcardGradientVia: "#16275c",
  flashcardGradientTo: "#08102b",

  // --------------------------------------------------------------------------
  // 10. 🚦 STATUS & FEEDBACK INDICATORS
  // --------------------------------------------------------------------------
  success: "#10b981",          // Correct answers, saved checkmarks
  successBg: "rgba(16, 185, 129, 0.15)",
  successBorder: "rgba(16, 185, 129, 0.35)",

  error: "#f43f5e",            // Incorrect quiz answers, delete actions
  errorBg: "rgba(244, 63, 94, 0.15)",
  errorBorder: "rgba(244, 63, 94, 0.35)",

  warning: "#f59e0b",          // Alerts, notes
  info: "#38bdf8",             // Info badges, tips
};

/**
 * Injects CSS variables so any component can use them in inline styles or classes
 */
export const ThemeColorStyles: React.FC = () => {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--color-app-bg", THEME_COLORS.appBackground);
    root.style.setProperty("--color-content-bg", THEME_COLORS.contentBackground);
    root.style.setProperty("--color-header-bg", THEME_COLORS.headerBackground);
    root.style.setProperty("--color-footer-bg", THEME_COLORS.footerBackground);
    root.style.setProperty("--color-card-bg", THEME_COLORS.cardBackground);
    root.style.setProperty("--color-card-hover", THEME_COLORS.cardHoverBackground);
    root.style.setProperty("--color-card-border", THEME_COLORS.cardBorder);
    root.style.setProperty("--color-modal-bg", THEME_COLORS.modalBackground);
    root.style.setProperty("--color-modal-inner", THEME_COLORS.modalInnerCard);
    root.style.setProperty("--color-text-primary", THEME_COLORS.textPrimary);
    root.style.setProperty("--color-text-secondary", THEME_COLORS.textSecondary);
    root.style.setProperty("--color-text-muted", THEME_COLORS.textMuted);
    root.style.setProperty("--color-accent-primary", THEME_COLORS.accentPrimary);
    root.style.setProperty("--color-accent-secondary", THEME_COLORS.accentSecondary);
    root.style.setProperty("--color-btn-primary-bg", THEME_COLORS.btnPrimaryBg);
    root.style.setProperty("--color-btn-primary-text", THEME_COLORS.btnPrimaryText);
    root.style.setProperty("--color-btn-secondary-bg", THEME_COLORS.btnSecondaryBg);
    root.style.setProperty("--color-audio-bg", THEME_COLORS.audioBarBg);
  }, []);

  return null;
};

export default THEME_COLORS;
