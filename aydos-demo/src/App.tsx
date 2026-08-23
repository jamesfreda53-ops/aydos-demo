import React, { useState, useEffect, useCallback } from "react";
import { Story, WordDefinition, SavedWord, ReaderSettings } from "./types";
import { STORIES } from "./data/stories";
import { hydrateAllStories, hydrateStoryWithTextFile } from "./utils/storyTextLoader";
import { lookupWord, getInstantWordDefinition, lookupAndEnrichWord, isPlaceholderDefinition } from "./data/dictionary";
import { audioEngine } from "./utils/audioPlayer";

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
import { StoryAssetManagerModal } from "./components/StoryAssetManagerModal";
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

  // Custom User-Created Stories (stored in localStorage)
  const [customStories, setCustomStories] = useState<Story[]>(() => {
    try {
      const stored = localStorage.getItem("storyread_custom_stories");
      if (stored) return JSON.parse(stored);
    } catch {
      // Ignore
    }
    return [];
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
  const [isAssetManagerOpen, setIsAssetManagerOpen] = useState(false);
  const [assetManagerStory, setAssetManagerStory] = useState<Story | null>(null);
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
    hydrateAllStories(STORIES).then((hydrated) => {
      if (isMounted) {
        setBuiltInStories(hydrated);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Combined stories list (Default built-in + Custom user stories)
  const allStories = [...builtInStories, ...customStories];

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
    setCustomStories((prev) => {
      const existingIdx = prev.findIndex((s) => s.id === story.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = story;
        return updated;
      }
      return [story, ...prev];
    });
    setCurrentView("library");
  };

  const handleDeleteCustomStory = (storyId: string) => {
    setCustomStories((prev) => prev.filter((s) => s.id !== storyId));
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
  const handleOpenAssetManager = (story?: Story) => {
    setAssetManagerStory(story || activeStory || allStories[0]);
    setIsAssetManagerOpen(true);
  };

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
          onOpenAssetManager={handleOpenAssetManager}
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
            onOpenAssetManager={() => handleOpenAssetManager(activeStory)}
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

      {/* Chapter Asset Manager & Uploader Modal */}
      {assetManagerStory && (
        <StoryAssetManagerModal
          isOpen={isAssetManagerOpen}
          onClose={() => setIsAssetManagerOpen(false)}
          story={assetManagerStory}
          onAssetsUpdated={() => {
            // Force refresh thumbnail state if needed
          }}
        />
      )}
    </MobileFrame>
    </>
  );
}
