import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Story, WordDefinition, SavedWord, ReaderSettings } from "./types";
import { STORIES } from "./data/stories";
import { hydrateAllStories, hydrateStoryWithTextFile } from "./utils/storyTextLoader";
import { fetchStoriesFile, saveStoryToServer, saveMultipleStoriesToServer, deleteStoryFromServer } from "./utils/storiesTxt";
import { lookupWord, getInstantWordDefinition, lookupAndEnrichWord, isPlaceholderDefinition } from "./data/dictionary";
import { audioEngine } from "./utils/audioPlayer";
import { slugify } from "./utils/storyAssets";

// Components
import { MobileFrame } from "./components/MobileFrame";
import { LibraryView } from "./components/LibraryView";
import { StoryHeader } from "./components/StoryHeader";
import { TitleSlideViewer } from "./components/TitleSlideViewer";
import { SlideViewer } from "./components/SlideViewer";
import { AudioController } from "./components/AudioController";
import { DictionaryModal } from "./components/DictionaryModal";
import { ReaderSettingsDrawer } from "./components/ReaderSettingsDrawer";
import { WordBankView } from "./components/WordBankView";
import { ComprehensionQuizModal } from "./components/ComprehensionQuizModal";
import { SlideJumperDrawer } from "./components/SlideJumperDrawer";
import { ImageModal } from "./components/ImageModal";
import { StoryEditor } from "./components/StoryEditor";
import { SeriesData } from "./components/SeriesEditorModal";
import { ThemeColorStyles, THEME_COLORS } from "./components/ThemeColors";

const DEFAULT_SETTINGS: ReaderSettings = {
  theme: "night",
  fontSize: "base",
  fontFamily: "literata",
  narrationSpeed: 1.0,
  volume: 1.0,
  isMuted: false,
  highlightSpokenWords: true,
  autoAdvanceOnComplete: false,
  voiceGender: "default",
  showPhoneFrameOnDesktop: false,
  vocabHelperEnabled: false,
};

export default function App() {
  // Application View: 'library' | 'reader' | 'editor'
  const [currentView, setCurrentView] = useState<"library" | "reader" | "editor">("library");

  // Custom User-Created & Edited Stories (stored in localStorage)
  const [customStories, setCustomStories] = useState<Story[]>(() => {
    try {
      const stored = localStorage.getItem("storyread_custom_stories");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((s: Story) => s && s.id && typeof s.id === "string");
        }
      }
    } catch {
      // Ignore
    }
    return [];
  });

  // Series Metadata Overrides (stored in localStorage)
  const [seriesOverrides, setSeriesOverrides] = useState<Record<string, SeriesData>>(() => {
    try {
      const stored = localStorage.getItem("storyread_series_overrides");
      if (stored) return JSON.parse(stored);
    } catch {
      // Ignore
    }
    return {};
  });

  // Story being edited
  const [editingStory, setEditingStory] = useState<Story | null>(null);

  // Active Story & Active Series Container
  const [activeSeriesId, setActiveSeriesId] = useState<string | null>(null);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  // currentSlideIndex: 0 = Title Slide (Cover), 1..N = Story Slides
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Audio Playback State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const [speakingCharIndex, setSpeakingCharIndex] = useState(-1);
  const [speakingCharLength, setSpeakingCharLength] = useState(0);
  const [audioProgressPct, setAudioProgressPct] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // Dictionary & Saved Words State
  const [selectedWordDef, setSelectedWordDef] = useState<WordDefinition | null>(null);
  const [isDictOpen, setIsDictOpen] = useState(false);
  const [savedWords, setSavedWords] = useState<SavedWord[]>(() => {
    try {
      const saved = localStorage.getItem("storyread_saved_words");
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return [
      {
        word: "Whispering",
        phonetic: "/ˈwɪs.pɚ.ɪŋ/",
        partOfSpeech: "verb / adjective",
        definition:
          "Speaking very softly or producing a gentle rustling sound like leaves in the wind.",
        example: "The whispering breeze swept through the quiet forest at twilight.",
        savedAt: Date.now(),
        storyTitle: "The Whispering Oak of Eldoria",
        slideNumber: 1,
      },
      {
        word: "Constellation",
        phonetic: "/ˌkɑːn.stəˈleɪ.ʃən/",
        partOfSpeech: "noun",
        definition:
          "A recognizable pattern or group of stars in the night sky named after people, animals, or objects.",
        example: "We pointed our telescope at the Big Dipper constellation.",
        savedAt: Date.now(),
        storyTitle: "The Boy Who Painted Constellations",
        slideNumber: 4,
      },
    ];
  });

  // Modals & Drawers State
  const [isWordBankOpen, setIsWordBankOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isSlideJumperOpen, setIsSlideJumperOpen] = useState(false);
  const [inspectImage, setInspectImage] = useState<{ url: string; caption: string } | null>(null);

  // Settings State
  const [settings, setSettings] = useState<ReaderSettings>(() => {
    try {
      const stored = localStorage.getItem("storyread_settings");
      if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {
      // Ignore
    }
    return DEFAULT_SETTINGS;
  });

  // Base built-in stories hydrated from story.txt files
  const [builtInStories, setBuiltInStories] = useState<Story[]>(STORIES);

  // Load and hydrate all story.txt files on startup
  useEffect(() => {
    let isMounted = true;
    
    async function loadCatalog() {
      try {
        const fileResult = await fetchStoriesFile();
        let baseList = STORIES;
        if (fileResult && fileResult.stories && fileResult.stories.length > 0) {
          // Merge stories from stories.txt with built-in STORIES catalog
          const fileMap = new Map(fileResult.stories.map((s) => [s.id, s]));
          const merged: Story[] = [];
          for (const s of STORIES) {
            if (fileMap.has(s.id)) {
              merged.push({ ...s, ...fileMap.get(s.id)! });
              fileMap.delete(s.id);
            } else {
              merged.push(s);
            }
          }
          for (const extra of fileMap.values()) {
            merged.push(extra);
          }
          baseList = merged;
        }

        const hydrated = await hydrateAllStories(baseList);
        if (isMounted) {
          setBuiltInStories(hydrated);
        }
      } catch (err) {
        console.warn("Failed to load stories manifest, falling back to default stories:", err);
        const hydrated = await hydrateAllStories(STORIES);
        if (isMounted) {
          setBuiltInStories(hydrated);
        }
      }
    }

    loadCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  // Combined stories list (Custom user stories override built-in stories by id, with series overrides merged)
  const allStories = useMemo<Story[]>(() => {
    const customMap = new Map<string, Story>(customStories.map((s) => [s.id, s]));
    const result: Story[] = [];
    for (const b of builtInStories) {
      if (customMap.has(b.id)) {
        result.push(customMap.get(b.id)!);
        customMap.delete(b.id);
      } else {
        result.push(b);
      }
    }
    for (const c of customMap.values()) {
      result.push(c);
    }

    // Apply series overrides if present
    return result.map((story) => {
      const sKey = story.seriesId?.trim() || "";
      const sTitleKey = story.seriesTitle?.trim().toLowerCase() || "";
      const sSlugKey = story.seriesTitle ? slugify(story.seriesTitle) : "";
      const sFolderKey = story.seriesFolder?.trim().toLowerCase() || "";

      const override =
        (sKey && seriesOverrides[sKey]) ||
        (sSlugKey && seriesOverrides[sSlugKey]) ||
        (sTitleKey && seriesOverrides[sTitleKey]) ||
        (sFolderKey && seriesOverrides[sFolderKey]);

      if (override) {
        return {
          ...story,
          seriesTitle: override.seriesTitle || story.seriesTitle,
          seriesDescription:
            override.seriesDescription !== undefined
              ? override.seriesDescription
              : story.seriesDescription,
          seriesFolder: override.seriesFolder || story.seriesFolder,
          seriesCoverImage: override.seriesCoverImage || story.seriesCoverImage,
          author: override.author || story.author,
          genre: override.genre || story.genre,
          readingLevel: override.readingLevel || story.readingLevel,
          levelBadge: override.readingLevel || story.levelBadge,
        };
      }
      return story;
    });
  }, [builtInStories, customStories, seriesOverrides]);

  // Total steps in reader: 1 Title Slide + N Story Slides
  const totalReaderSteps = activeStory ? 1 + activeStory.slides.length : 0;
  const isTitleSlide = currentSlideIndex === 0;
  const isLastSlide = activeStory
    ? currentSlideIndex === activeStory.slides.length
    : false;

  // Save custom stories to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("storyread_custom_stories", JSON.stringify(customStories));
    } catch {
      // Ignore
    }
  }, [customStories]);

  // Save series overrides to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("storyread_series_overrides", JSON.stringify(seriesOverrides));
    } catch {
      // Ignore
    }
  }, [seriesOverrides]);

  // Save words to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("storyread_saved_words", JSON.stringify(savedWords));
    } catch {
      // Ignore
    }
  }, [savedWords]);

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("storyread_settings", JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }, [settings]);

  // Sync Audio Engine State
  useEffect(() => {
    const unsubState = audioEngine.onStateChange((playing, paused) => {
      setIsPlayingAudio(playing);
      setIsPausedAudio(paused);
    });

    const unsubBoundary = audioEngine.onBoundary((charIndex, charLength) => {
      setSpeakingCharIndex(charIndex);
      setSpeakingCharLength(charLength);
    });

    const unsubProgress = audioEngine.onProgress((pct, cur, dur) => {
      setAudioProgressPct(pct);
      setAudioCurrentTime(cur);
      setAudioDuration(dur);
    });

    return () => {
      unsubState();
      unsubBoundary();
      unsubProgress();
    };
  }, []);

  // Update narration speed, volume, and voice on engine
  useEffect(() => {
    audioEngine.setRate(settings.narrationSpeed);
  }, [settings.narrationSpeed]);

  useEffect(() => {
    audioEngine.setVolume(settings.volume ?? 1.0);
    audioEngine.setMuted(settings.isMuted ?? false);
  }, [settings.volume, settings.isMuted]);

  useEffect(() => {
    if (settings.voiceGender) {
      audioEngine.setVoicePreference(settings.voiceGender);
    }
  }, [settings.voiceGender]);

  // Reset audio progress when slide changes
  useEffect(() => {
    setAudioProgressPct(0);
    setAudioCurrentTime(0);
    setAudioDuration(0);
    setSpeakingCharIndex(-1);
    setSpeakingCharLength(0);
  }, [currentSlideIndex, activeStory]);

  // Get current slide audio text and audio URL (only for story slides, not title slide)
  const getCurrentAudioInfo = useCallback(() => {
    if (!activeStory || currentSlideIndex === 0) {
      return { text: "", audioUrl: undefined };
    }

    // Content Slide (index >= 1)
    const slide = activeStory.slides[currentSlideIndex - 1];
    if (!slide) return { text: "", audioUrl: undefined };
    return {
      text: slide.paragraph,
      audioUrl: slide.audioUrl,
    };
  }, [activeStory, currentSlideIndex]);

  // Handle Slide End Audio (for auto-advance)
  const handleSlideAudioComplete = useCallback(() => {
    if (!activeStory) return;

    if (settings.autoAdvanceOnComplete) {
      if (currentSlideIndex < activeStory.slides.length) {
        setTimeout(() => {
          setCurrentSlideIndex((prev) => {
            const nextIdx = prev + 1;
            if (nextIdx <= activeStory.slides.length) {
              const nextSlide = activeStory.slides[nextIdx - 1];
              if (nextSlide) {
                audioEngine.playSlideAudio(
                  nextSlide.paragraph,
                  nextSlide.audioUrl,
                  handleSlideAudioComplete
                );
              }
            }
            return nextIdx;
          });
        }, 800);
      } else {
        setIsQuizOpen(true);
      }
    }
  }, [activeStory, currentSlideIndex, settings.autoAdvanceOnComplete]);

  // Start/Toggle Playback
  const handleTogglePlayAudio = () => {
    if (!activeStory) return;
    const { text, audioUrl } = getCurrentAudioInfo();
    if (!text) return;

    if (isPlayingAudio && !isPausedAudio) {
      audioEngine.pause();
    } else if (isPlayingAudio && isPausedAudio) {
      audioEngine.resume();
    } else {
      audioEngine.playSlideAudio(text, audioUrl, handleSlideAudioComplete);
    }
  };

  const handleReplayAudio = () => {
    if (!activeStory) return;
    const { text, audioUrl } = getCurrentAudioInfo();
    if (!text) return;
    setAudioProgressPct(0);
    audioEngine.playSlideAudio(text, audioUrl, handleSlideAudioComplete);
  };

  const handleRewindAudio = () => {
    audioEngine.rewind(5);
  };

  const handleForwardAudio = () => {
    audioEngine.forward(5);
  };

  const handleVolumeChange = (newVol: number) => {
    handleUpdateSettings({ volume: newVol, isMuted: newVol === 0 });
  };

  const handleMuteToggle = () => {
    handleUpdateSettings({ isMuted: !settings.isMuted });
  };

  // Reader Navigation Handlers
  const handleSelectStory = async (story: Story) => {
    audioEngine.stop();
    const sKey = story.seriesTitle?.trim() || story.seriesId?.trim();
    if (sKey) {
      setActiveSeriesId(story.seriesId || sKey);
    }
    // Hydrate latest story text from story.txt
    const hydrated = await hydrateStoryWithTextFile(story);
    setActiveStory(hydrated);
    setCurrentSlideIndex(0); // Starts on Title Slide (Slide 0)
    setCurrentView("reader");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToLibrary = () => {
    audioEngine.stop();
    if (isQuizOpen) {
      setIsQuizOpen(false);
      return;
    }
    // If on a content slide in reader, go back to Chapter Title screen (slide 0)
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(0);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // If on Chapter Title screen (slide 0), go back to Series container screen (or library)
    setActiveStory(null);
    setCurrentView("library");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      audioEngine.stop();
      setCurrentSlideIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextSlide = () => {
    if (activeStory && currentSlideIndex < activeStory.slides.length) {
      audioEngine.stop();
      setCurrentSlideIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSelectSlideIndex = (index: number) => {
    audioEngine.stop();
    setCurrentSlideIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Story Editor Handlers
  const handleOpenEditor = (storyToEdit?: Story) => {
    audioEngine.stop();
    setEditingStory(storyToEdit || null);
    setCurrentView("editor");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveCustomStory = (story: Story) => {
    const updatedStory: Story = {
      ...story,
      userEdited: true,
      isCustom: true,
    };

    // If story defines or modifies series information, update series overrides
    let newOverrides = { ...seriesOverrides };
    if (updatedStory.seriesId || updatedStory.seriesTitle) {
      const sKey = updatedStory.seriesId || (updatedStory.seriesTitle ? slugify(updatedStory.seriesTitle) : "series");
      const sTitleKey = (updatedStory.seriesTitle || "").trim().toLowerCase();
      const sSlugKey = updatedStory.seriesTitle ? slugify(updatedStory.seriesTitle) : "";
      const sFolderKey = (updatedStory.seriesFolder || "").trim().toLowerCase();

      const seriesData: SeriesData = {
        seriesId: updatedStory.seriesId || sKey,
        seriesTitle: updatedStory.seriesTitle || "",
        seriesDescription: updatedStory.seriesDescription || "",
        seriesFolder: updatedStory.seriesFolder || "",
        seriesCoverImage: updatedStory.seriesCoverImage || "",
        author: updatedStory.author,
        genre: updatedStory.genre,
        readingLevel: updatedStory.readingLevel as any,
      };

      if (sKey) newOverrides[sKey] = seriesData;
      if (sTitleKey) newOverrides[sTitleKey] = seriesData;
      if (sSlugKey) newOverrides[sSlugKey] = seriesData;
      if (sFolderKey) newOverrides[sFolderKey] = seriesData;

      setSeriesOverrides(newOverrides);
      try {
        localStorage.setItem("storyread_series_overrides", JSON.stringify(newOverrides));
      } catch {
        // Ignore
      }
    }

    setCustomStories((prev) => {
      const existingIdx = prev.findIndex((s) => s.id === updatedStory.id);
      let updated: Story[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = updatedStory;
      } else {
        updated = [updatedStory, ...prev];
      }

      // Collect every story that actually changed this save -- the main story plus
      // any series siblings synced below -- so we write them to GitHub in ONE request
      // instead of several back-to-back ones that could race each other.
      const changedStories: Story[] = [updatedStory];

      // If this story is part of a series, sync series attributes across sibling chapters
      if (updatedStory.seriesId || updatedStory.seriesTitle) {
        const targetSeriesId = updatedStory.seriesId || updatedStory.seriesTitle;
        updated = updated.map((st) => {
          if (
            st.id !== updatedStory.id &&
            (st.seriesId === targetSeriesId || st.seriesTitle === updatedStory.seriesTitle)
          ) {
            const syncedStory: Story = {
              ...st,
              seriesTitle: updatedStory.seriesTitle || st.seriesTitle,
              seriesFolder: updatedStory.seriesFolder || st.seriesFolder,
              seriesDescription: updatedStory.seriesDescription || st.seriesDescription,
              seriesCoverImage: updatedStory.seriesCoverImage || st.seriesCoverImage,
              userEdited: true,
            };
            changedStories.push(syncedStory);
            return syncedStory;
          }
          return st;
        });
      }

      saveMultipleStoriesToServer(changedStories).catch((err) => {
        console.warn("Failed to sync story with GitHub manifest:", err);
      });

      try {
        localStorage.setItem("storyread_custom_stories", JSON.stringify(updated));
      } catch {
        // Ignore
      }

      return updated;
    });

    if (activeStory && activeStory.id === updatedStory.id) {
      setActiveStory(updatedStory);
    }

    setCurrentView("library");
  };

  const handleUpdateSeries = (seriesData: SeriesData) => {
    const sKey = seriesData.seriesId || slugify(seriesData.seriesTitle);
    const sTitleKey = seriesData.seriesTitle.trim().toLowerCase();
    const sSlugKey = slugify(seriesData.seriesTitle);
    const sFolderKey = seriesData.seriesFolder ? seriesData.seriesFolder.trim().toLowerCase() : "";

    const newOverrides = {
      ...seriesOverrides,
      ...(sKey ? { [sKey]: seriesData } : {}),
      ...(sTitleKey ? { [sTitleKey]: seriesData } : {}),
      ...(sSlugKey ? { [sSlugKey]: seriesData } : {}),
      ...(sFolderKey ? { [sFolderKey]: seriesData } : {}),
    };

    setSeriesOverrides(newOverrides);
    try {
      localStorage.setItem("storyread_series_overrides", JSON.stringify(newOverrides));
    } catch {
      // Ignore
    }

    setCustomStories((prev) => {
      const updated = [...prev];
      const changedStories: Story[] = [];

      allStories.forEach((st) => {
        const matchSeries =
          (seriesData.seriesId && st.seriesId === seriesData.seriesId) ||
          (st.seriesId && st.seriesId === sKey) ||
          (st.seriesTitle && st.seriesTitle.toLowerCase() === seriesData.seriesId.toLowerCase()) ||
          (st.seriesTitle && st.seriesTitle.toLowerCase() === seriesData.seriesTitle.toLowerCase()) ||
          (st.seriesFolder && seriesData.seriesFolder && st.seriesFolder.toLowerCase() === seriesData.seriesFolder.toLowerCase());

        if (matchSeries) {
          const updatedStory: Story = {
            ...st,
            seriesId: seriesData.seriesId || st.seriesId || sKey,
            seriesTitle: seriesData.seriesTitle,
            seriesDescription: seriesData.seriesDescription ?? st.seriesDescription,
            seriesFolder: seriesData.seriesFolder ?? st.seriesFolder,
            seriesCoverImage: seriesData.seriesCoverImage ?? st.seriesCoverImage,
            author: seriesData.author || st.author,
            genre: seriesData.genre || st.genre,
            readingLevel: seriesData.readingLevel || st.readingLevel,
            levelBadge: seriesData.readingLevel || st.levelBadge,
            tags: seriesData.tags ?? st.tags,
            userEdited: true,
            isCustom: true,
          };
          const idx = updated.findIndex((s) => s.id === st.id);
          if (idx >= 0) {
            updated[idx] = updatedStory;
          } else {
            updated.push(updatedStory);
          }
          changedStories.push(updatedStory);
        }
      });

      // Persist every changed chapter into the GitHub manifest in ONE request
      saveMultipleStoriesToServer(changedStories).catch((err) => {
        console.warn("Failed to sync series changes with GitHub manifest:", err);
      });

      try {
        localStorage.setItem("storyread_custom_stories", JSON.stringify(updated));
      } catch {
        // Ignore
      }

      return updated;
    });
  };

  const handleDeleteCustomStory = (storyId: string) => {
    setCustomStories((prev) => {
      const updated = prev.filter((s) => s.id !== storyId);
      try {
        localStorage.setItem("storyread_custom_stories", JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
    // Remove from server /public/stories.txt manifest
    deleteStoryFromServer(storyId).catch((err) => {
      console.warn("Failed to delete story from server manifest:", err);
    });
  };

  const handleTestStoryFromEditor = async (story: Story) => {
    audioEngine.stop();
    const hydrated = await hydrateStoryWithTextFile(story);
    setActiveStory(hydrated);
    setCurrentSlideIndex(0); // Open Title Slide in Reader
    setCurrentView("reader");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Word Tap & Dictionary (Instant 0ms pop-up bubble trigger)
  const handleWordTap = async (word: string, contextSentence: string) => {
    const instantDef = getInstantWordDefinition(word, contextSentence);
    setSelectedWordDef(instantDef);
    setIsDictOpen(true);

    if (isPlaceholderDefinition(instantDef)) {
      try {
        const enriched = await lookupAndEnrichWord(word, contextSentence);
        if (enriched && !isPlaceholderDefinition(enriched)) {
          setSelectedWordDef(enriched);
        }
      } catch (err) {
        console.warn("Could not enrich word definition:", err);
      }
    }
  };

  const handleSaveWord = (wordDef: WordDefinition) => {
    if (!savedWords.some((w) => w.word.toLowerCase() === wordDef.word.toLowerCase())) {
      const newSaved: SavedWord = {
        ...wordDef,
        savedAt: Date.now(),
        storyTitle: activeStory?.title || "Story",
        slideNumber: isTitleSlide ? 0 : currentSlideIndex,
      };
      setSavedWords([newSaved, ...savedWords]);
    }
  };

  const handleUpdateSavedWord = (oldWord: string, updatedWord: SavedWord) => {
    setSavedWords((prev) =>
      prev.map((w) =>
        w.word.toLowerCase() === oldWord.toLowerCase() ? updatedWord : w
      )
    );
  };

  const handleRemoveSavedWord = (word: string) => {
    setSavedWords(savedWords.filter((w) => w.word.toLowerCase() !== word.toLowerCase()));
  };

  const isCurrentWordSaved = Boolean(
    selectedWordDef &&
      savedWords.some(
        (w) => w.word.toLowerCase() === selectedWordDef.word.toLowerCase()
      )
  );

  const handleUpdateSettings = (newSettings: Partial<ReaderSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleToggleVocabHelper = () => {
    setSettings((prev) => ({
      ...prev,
      vocabHelperEnabled: !prev.vocabHelperEnabled,
    }));
  };

  // 1. STORY EDITOR VIEW
  if (currentView === "editor") {
    return (
      <StoryEditor
        initialStory={editingStory}
        onSaveStory={handleSaveCustomStory}
        onTestStory={handleTestStoryFromEditor}
        onCancel={() => setCurrentView("library")}
      />
    );
  }

  // Active slide object for content slides (index >= 1)
  const currentContentSlide =
    activeStory && currentSlideIndex >= 1
      ? activeStory.slides[currentSlideIndex - 1]
      : null;

  // 2. MAIN READER OR LIBRARY VIEW (Wrapped in Mobile Frame)
  return (
    <>
      <ThemeColorStyles />
      <MobileFrame
        showPhoneFrame={settings.showPhoneFrameOnDesktop}
        onTogglePhoneFrame={() =>
          handleUpdateSettings({
            showPhoneFrameOnDesktop: !settings.showPhoneFrameOnDesktop,
          })
        }
        theme={settings.theme}
      >
      {currentView === "library" || !activeStory ? (
        <LibraryView
          stories={allStories}
          activeSeriesId={activeSeriesId}
          onActiveSeriesChange={setActiveSeriesId}
          onSelectStory={handleSelectStory}
          savedWordsCount={savedWords.length}
          onOpenWordBank={() => setIsWordBankOpen(true)}
          onOpenEditor={handleOpenEditor}
          onDeleteCustomStory={handleDeleteCustomStory}
          onUpdateSeries={handleUpdateSeries}
        />
      ) : (
        <div className="w-full min-h-full flex flex-col justify-between">
          {/* Header */}
          <StoryHeader
            story={activeStory}
            currentSlideIndex={currentSlideIndex}
            totalSlides={totalReaderSteps}
            savedWordsCount={savedWords.length}
            onBackToLibrary={handleBackToLibrary}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenWordBank={() => setIsWordBankOpen(true)}
            onOpenSlideJumper={() => setIsSlideJumperOpen(true)}
          />

          {/* Main Slide Content: Title Slide (index 0) or Content Slide (index 1..N) */}
          <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-3 pb-6 flex flex-col">
            {isTitleSlide ? (
              <TitleSlideViewer
                story={activeStory}
                settings={settings}
                vocabHelperActive={settings.vocabHelperEnabled ?? false}
                onToggleVocabHelper={handleToggleVocabHelper}
                onWordTap={handleWordTap}
                onImageExpand={(url, caption) => setInspectImage({ url, caption })}
                onBeginStory={() => handleNextSlide()}
              />
            ) : (
              currentContentSlide && (
                <SlideViewer
                  slide={currentContentSlide}
                  settings={settings}
                  vocabHelperActive={settings.vocabHelperEnabled ?? false}
                  onToggleVocabHelper={handleToggleVocabHelper}
                  speakingCharIndex={speakingCharIndex}
                  speakingCharLength={speakingCharLength}
                  isPlayingAudio={isPlayingAudio && !isPausedAudio}
                  onWordTap={handleWordTap}
                  onImageExpand={(url, caption) => setInspectImage({ url, caption })}
                />
              )
            )}
          </main>

          {/* Bottom Audio Controller Dock (Only for Story Content Slides, not Title Slide) */}
          {!isTitleSlide && (
            <AudioController
              isPlaying={isPlayingAudio}
              isPaused={isPausedAudio}
              onPlayToggle={handleTogglePlayAudio}
              onReplay={handleReplayAudio}
              onRewind={handleRewindAudio}
              onForward={handleForwardAudio}
              playbackRate={settings.narrationSpeed}
              onRateChange={(rate) => handleUpdateSettings({ narrationSpeed: rate })}
              volume={settings.volume ?? 1.0}
              isMuted={settings.isMuted ?? false}
              onVolumeChange={handleVolumeChange}
              onMuteToggle={handleMuteToggle}
              progressPct={audioProgressPct}
              currentTimeSec={audioCurrentTime}
              durationSec={audioDuration}
              currentSlideIndex={currentSlideIndex}
              totalSlides={totalReaderSteps}
              onPrevSlide={handlePrevSlide}
              onNextSlide={handleNextSlide}
              onOpenQuiz={() => setIsQuizOpen(true)}
              isLastSlide={isLastSlide}
            />
          )}
        </div>
      )}

      {/* Tap-to-define Dictionary Modal */}
      <DictionaryModal
        definition={selectedWordDef}
        isOpen={isDictOpen}
        onClose={() => setIsDictOpen(false)}
        onSaveWord={handleSaveWord}
        onRemoveSavedWord={handleRemoveSavedWord}
        isWordSaved={isCurrentWordSaved}
        storyTitle={activeStory?.title}
        slideNumber={isTitleSlide ? 0 : currentSlideIndex}
      />

      {/* Reader Settings Drawer */}
      <ReaderSettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Word Bank & Flashcards View */}
      {isWordBankOpen && (
        <WordBankView
          savedWords={savedWords}
          onRemoveWord={handleRemoveSavedWord}
          onSaveWord={handleSaveWord}
          onUpdateWord={handleUpdateSavedWord}
          onOpenDefinition={(def) => {
            setSelectedWordDef(def);
            setIsDictOpen(true);
          }}
          onClose={() => setIsWordBankOpen(false)}
        />
      )}

      {/* Story End Comprehension Quiz */}
      {activeStory && (
        <ComprehensionQuizModal
          isOpen={isQuizOpen}
          onClose={() => setIsQuizOpen(false)}
          story={activeStory}
          onReread={() => {
            setCurrentSlideIndex(0);
            setIsQuizOpen(false);
          }}
          onBackToLibrary={handleBackToLibrary}
        />
      )}

      {/* Slide Thumb Jumper Drawer */}
      {activeStory && (
        <SlideJumperDrawer
          isOpen={isSlideJumperOpen}
          onClose={() => setIsSlideJumperOpen(false)}
          story={activeStory}
          currentSlideIndex={currentSlideIndex}
          onSelectSlide={handleSelectSlideIndex}
        />
      )}

      {/* Full-Screen Illustration Inspector Modal */}
      {inspectImage && (
        <ImageModal
          isOpen={Boolean(inspectImage)}
          onClose={() => setInspectImage(null)}
          imageUrl={inspectImage.url}
          caption={inspectImage.caption}
        />
      )}
    </MobileFrame>
    </>
  );
}
