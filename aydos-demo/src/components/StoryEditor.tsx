import React, { useState, useRef } from "react";
import {
  BookOpen,
  Bookmark,
  Layers,
  Upload,
  Image as ImageIcon,
  Volume2,
  Play,
  Pause,
  Plus,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Save,
  AlertCircle,
  FileCode,
  Eye,
  GraduationCap,
  Disc3,
  User,
  Music,
  Database,
  Check,
  CheckCircle2,
  HelpCircle,
  ListOrdered,
  ToggleLeft,
  ToggleRight,
  PenTool,
  SlidersHorizontal,
} from "lucide-react";
import { Story, Slide, QuizQuestion, QuizQuestionType, WordDefinition, TitleSlide } from "../types";
import { audioEngine } from "../utils/audioPlayer";
import { lookupWord } from "../data/dictionary";
import { DictionaryModal } from "./DictionaryModal";
import { DeveloperDictionaryModal } from "./DeveloperDictionaryModal";
import { ComprehensionQuizModal } from "./ComprehensionQuizModal";

interface StoryEditorProps {
  initialStory?: Story | null;
  onSaveStory: (story: Story) => void;
  onTestStory: (story: Story) => void;
  onCancel: () => void;
}

// 7-Slide Starter Template with square album art & Title slide
const STARTER_SAMPLE_STORY: Story = {
  id: "custom-sample-" + Date.now(),
  title: "The Clockwork Dragonfly",
  subtitle: "An inventive adventure in the Whispering Meadow",
  author: "Young Explorers Guild",
  coverImage:
    "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80",
  readingLevel: "Intermediate",
  levelBadge: "Intermediate",
  estimatedMinutes: 5,
  genre: "Mystery & Science",
  themeColor: "from-amber-600 to-orange-700",
  accentColor: "#f97316",
  summary:
    "In a hidden meadow, Milo discovers a mechanical dragonfly whose crystalline wings emit glowing harmonic chimes.",
  titleSlide: {
    title: "The Clockwork Dragonfly",
    subtitle: "An inventive adventure in the Whispering Meadow",
    author: "Young Explorers Guild",
    illustrationUrl:
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80",
    illustrationCaption: "The shimmering clockwork dragonfly poised in golden morning light.",
    introParagraph:
      "Deep in the Whispering Meadow, young Milo stumbled upon an extraordinary invention. Tap any word in the title or text to look up its definition, or listen along to the audio recording!",
  },
  slides: [
    {
      id: "sample-slide-1",
      slideNumber: 1,
      paragraph:
        "Deep inside the Whispering Meadow, golden sunlight filtered through towering emerald clover leaves. Milo knelt beside a mossy river stone, noticing a miniature metallic gleam hidden among the damp ferns.",
      illustrationUrl:
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
      illustrationCaption: "Milo searches through the emerald clover in the morning light.",
      keyWords: ["Whispering", "Emerald", "Metallic"],
    },
    {
      id: "sample-slide-2",
      slideNumber: 2,
      paragraph:
        "Resting upon the moss was a delicate clockwork dragonfly. Its brass gears spun silently in rhythm, while its iridescent wings shimmered with amethyst and sapphire light.",
      illustrationUrl:
        "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80",
      illustrationCaption: "The delicate brass dragonfly resting quietly upon the moss.",
      keyWords: ["Clockwork", "Iridescent", "Amethyst"],
    },
    {
      id: "sample-slide-3",
      slideNumber: 3,
      paragraph:
        "Milo gently extended his fingertip toward the tiny automaton. With a faint harmonic hum, the creature stepped onto his palm and vibrated its translucent gossamer wings.",
      illustrationUrl:
        "https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=800&auto=format&fit=crop&q=80",
      illustrationCaption: "The mechanical dragonfly stepping onto Milo's outstretched fingertip.",
      keyWords: ["Automaton", "Harmonic", "Gossamer"],
    },
    {
      id: "sample-slide-4",
      slideNumber: 4,
      paragraph:
        "Suddenly, the dragonfly lifted gracefully into the air, tracing bright spiral patterns of golden mist that illuminated the shadowed canopy above.",
      illustrationUrl:
        "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80",
      illustrationCaption: "Golden spiral trails illuminate the forest canopy.",
      keyWords: ["Canopy", "Illuminated", "Spiral"],
    },
    {
      id: "sample-slide-5",
      slideNumber: 5,
      paragraph:
        "Milo dashed across the cobblestone pathway, following the dragonfly's glowing trail toward the ancient observatory nestled between two weeping willows.",
      illustrationUrl:
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
      illustrationCaption: "The ancient observatory glowing between the weeping willows.",
      keyWords: ["Observatory", "Cobblestone", "Nestled"],
    },
    {
      id: "sample-slide-6",
      slideNumber: 6,
      paragraph:
        "Inside the observatory dome, thousands of antique star charts and brass telescopes rotated in unison, aligning with the constellation depicted on the dragonfly's back.",
      illustrationUrl:
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
      illustrationCaption: "Star charts and telescopes aligning within the observatory dome.",
      keyWords: ["Constellation", "Antique", "Unison"],
    },
    {
      id: "sample-slide-7",
      slideNumber: 7,
      paragraph:
        "A celestial map projected onto the ceiling, revealing unexplored galaxies. Milo smiled, realizing this was only the beginning of his cosmic journey.",
      illustrationUrl:
        "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80",
      illustrationCaption: "A celestial galaxy map projected across the starry dome ceiling.",
      keyWords: ["Celestial", "Galaxies", "Cosmic"],
    },
  ],
  quizQuestions: [
    {
      id: "sample-q1",
      type: "multiple_choice",
      question: "What mysterious object did Milo discover in the meadow?",
      options: [
        "A brass clockwork dragonfly",
        "A golden treasure chest",
        "A magical compass",
        "An ancient leather book",
      ],
      correctIndex: 0,
      explanation: "Milo discovered a delicate clockwork dragonfly with brass gears and iridescent sapphire wings.",
    },
    {
      id: "sample-q2",
      type: "multiple_choice",
      question: "Where did the glowing dragonfly lead Milo?",
      options: [
        "To an ancient observatory dome nestled between willows",
        "To a sunken river cave",
        "To a bustling city market",
      ],
      correctIndex: 0,
      explanation: "The dragonfly traced golden spirals toward the ancient copper observatory dome.",
    },
    {
      id: "sample-q3",
      type: "true_false",
      question: "The brass dragonfly spun silently and aligned with star charts inside the observatory.",
      correctBoolean: true,
      explanation: "Inside the observatory dome, instruments rotated in unison to match the constellation on the dragonfly.",
    },
    {
      id: "sample-q4",
      type: "multiple_choice",
      question: "What was projected onto the dome ceiling when the mechanisms aligned?",
      options: [
        "A celestial map of unexplored galaxies",
        "A warning storm message",
        "A historical clock face",
        "A compass rose",
      ],
      correctIndex: 0,
      explanation: "A brilliant celestial galaxy map lit up the entire dome ceiling.",
    },
    {
      id: "sample-q5",
      type: "open_response",
      question: "How did Milo's curiosity spark a wondrous discovery in the story?",
      sampleAnswer: "By exploring the meadow, examining the delicate dragonfly, and following its glowing golden spirals, Milo unlocked the ancient observatory's celestial map.",
      explanation: "Encourages students to connect Milo's curiosity with unlocking the stargazing observatory.",
    },
  ],
};

export const StoryEditor: React.FC<StoryEditorProps> = ({
  initialStory,
  onSaveStory,
  onTestStory,
  onCancel,
}) => {
  // Title Slide & Metadata State
  const [title, setTitle] = useState(initialStory?.title || "My New Story");
  const [subtitle, setSubtitle] = useState(
    initialStory?.subtitle || "An exciting interactive adventure"
  );
  const [author, setAuthor] = useState(initialStory?.author || "Author");
  const [genre, setGenre] = useState(initialStory?.genre || "Adventure");
  const [readingLevel, setReadingLevel] = useState<Story["readingLevel"]>(
    initialStory?.readingLevel || "Intermediate"
  );
  const [coverImage, setCoverImage] = useState(
    initialStory?.coverImage ||
      initialStory?.titleSlide?.illustrationUrl ||
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80"
  );
  const [titleIntroParagraph, setTitleIntroParagraph] = useState(
    initialStory?.titleSlide?.introParagraph ||
      initialStory?.summary ||
      "Welcome to this interactive story! Tap any word in the title or text to see its definition."
  );
  const [summary, setSummary] = useState(
    initialStory?.summary ||
      "Enter a brief, engaging summary describing the story theme and journey..."
  );

  // Optional Series Designation State
  const [isSeries, setIsSeries] = useState(
    Boolean(initialStory?.seriesTitle || initialStory?.seriesId)
  );
  const [seriesTitle, setSeriesTitle] = useState(
    initialStory?.seriesTitle || ""
  );
  const [chapterNumber, setChapterNumber] = useState(
    initialStory?.chapterNumber?.toString() || ""
  );
  const [chapterTitle, setChapterTitle] = useState(
    initialStory?.chapterTitle || ""
  );
  const [seriesDescription, setSeriesDescription] = useState(
    initialStory?.seriesDescription || ""
  );

  // Slides State (Initialized with 7 slides if new)
  const [slides, setSlides] = useState<Slide[]>(() => {
    if (initialStory && initialStory.slides.length > 0) {
      return initialStory.slides;
    }
    // Create initial 7 slide templates
    return Array.from({ length: 7 }, (_, i) => ({
      id: `slide-${Date.now()}-${i + 1}`,
      slideNumber: i + 1,
      paragraph:
        i === 0
          ? "Beyond the tranquil hills, where golden morning light illuminated the emerald meadows, a curious young explorer embarked on a brand new quest..."
          : `Paragraph for Slide ${i + 1}: Paste or type your paragraph here. Every single word will be interactively tappable for dictionary definitions and pronunciations!`,
      illustrationUrl:
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
      illustrationCaption: `Illustration for Slide ${i + 1}`,
      keyWords: ["Tranquil", "Illuminated", "Curious"],
    }));
  });

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Quiz Questions State (Defaults to 5 balanced comprehension questions)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(
    initialStory?.quizQuestions || [
      {
        id: "quiz-1",
        type: "multiple_choice",
        question: "What is the primary quest or central theme of this story?",
        options: [
          "An engaging journey of discovery and learning",
          "A quiet nap in the warm sun",
          "A competitive tournament",
          "A race against time",
        ],
        correctIndex: 0,
        explanation: "The story focuses on curiosity, adventure, and new discoveries.",
      },
      {
        id: "quiz-2",
        type: "multiple_choice",
        question: "What key setting or location did the characters explore?",
        options: [
          "An ancient, mysterious landscape full of wonder",
          "A busy supermarket",
          "A crowded underground subway station",
        ],
        correctIndex: 0,
        explanation: "The adventure takes place in a scenic and wonder-filled setting.",
      },
      {
        id: "quiz-3",
        type: "true_false",
        question: "The main character used careful observation and problem-solving to succeed.",
        correctBoolean: true,
        explanation: "Observing details and thinking carefully helped the characters overcome challenges.",
      },
      {
        id: "quiz-4",
        type: "multiple_choice",
        question: "How did the characters feel when their journey reached its conclusion?",
        options: [
          "Inspired, joyful, and ready for future adventures",
          "Confused and disappointed",
          "Frustrated and tired",
          "Indifferent and bored",
        ],
        correctIndex: 0,
        explanation: "The journey ended on an uplifting and inspiring note.",
      },
      {
        id: "quiz-5",
        type: "open_response",
        question: "What was the most memorable lesson or event in the story, and why?",
        sampleAnswer: "Students should describe a key scene and explain how it contributed to the character's growth or learning.",
        explanation: "Encourages personal reflection and evidence-based textual synthesis.",
      },
    ]
  );

  // Active Tab: 'titleSlide' | 'slides' | 'quiz' | 'json'
  const [activeTab, setActiveTab] = useState<"titleSlide" | "slides" | "quiz" | "json">(
    "titleSlide"
  );

  // Audio Testing in Editor
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioSourceType, setAudioSourceType] = useState<"upload" | "url">("upload");

  // Dictionary preview modal in Editor
  const [testWordDef, setTestWordDef] = useState<WordDefinition | null>(null);
  const [isDictModalOpen, setIsDictModalOpen] = useState(false);

  // Comprehension Quiz Test Preview Modal
  const [isTestQuizModalOpen, setIsTestQuizModalOpen] = useState(false);

  // Developer Dictionary Modal State
  const [isDevDictionaryOpen, setIsDevDictionaryOpen] = useState(false);

  // JSON Raw State
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");

  // Refs for hidden file inputs
  const titleImageInputRef = useRef<HTMLInputElement>(null);
  const slideImageInputRef = useRef<HTMLInputElement>(null);
  const slideAudioInputRef = useRef<HTMLInputElement>(null);

  const currentSlide = slides[activeSlideIndex] || slides[0];

  // Assemble full story object
  const buildStoryObject = (): Story => {
    const levelBadge = readingLevel;

    const titleSlideObj: TitleSlide = {
      title,
      subtitle,
      author,
      illustrationUrl: coverImage,
      illustrationCaption: `${title} - Title Album Artwork`,
      introParagraph: titleIntroParagraph,
    };

    const orderNum = parseInt(chapterNumber.replace(/[^0-9]/g, ""), 10);

    return {
      id: initialStory?.id || `custom-${Date.now()}`,
      title,
      subtitle,
      author,
      coverImage,
      titleSlide: titleSlideObj,
      readingLevel,
      levelBadge,
      estimatedMinutes: Math.max(2, Math.round(slides.length * 0.7)),
      genre,
      themeColor: initialStory?.themeColor || "from-amber-600 to-orange-700",
      accentColor: initialStory?.accentColor || "#f97316",
      summary: summary || titleIntroParagraph,
      slides: slides.map((s, idx) => ({ ...s, slideNumber: idx + 1 })),
      quizQuestions,

      // Series metadata
      seriesId: isSeries ? (seriesTitle.toLowerCase().replace(/[^a-z0-9]/g, "-") || "series") : undefined,
      seriesTitle: isSeries ? (seriesTitle.trim() || undefined) : undefined,
      chapterNumber: isSeries ? (chapterNumber.trim() || undefined) : undefined,
      chapterTitle: isSeries ? (chapterTitle.trim() || undefined) : undefined,
      seriesDescription: isSeries ? (seriesDescription.trim() || undefined) : undefined,
      seriesCoverImage: isSeries ? coverImage : undefined,
      seriesOrder: isSeries && !isNaN(orderNum) ? orderNum : undefined,
    };
  };

  // Save story to App
  const handleSave = () => {
    const story = buildStoryObject();
    onSaveStory(story);
  };

  // Test story in Reader
  const handleTest = () => {
    const story = buildStoryObject();
    onTestStory(story);
  };

  // Handle Slide Management
  const handleAddSlide = () => {
    if (slides.length >= 15) {
      alert("Stories are recommended to have 7–10 slides for optimal student engagement.");
      return;
    }
    const newSlide: Slide = {
      id: `slide-${Date.now()}-${slides.length + 1}`,
      slideNumber: slides.length + 1,
      paragraph: `Paragraph for Slide ${slides.length + 1}: Enter story text here.`,
      illustrationUrl:
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
      illustrationCaption: `Illustration for Slide ${slides.length + 1}`,
      keyWords: [],
    };
    setSlides([...slides, newSlide]);
    setActiveSlideIndex(slides.length);
  };

  const handleDuplicateSlide = (idx: number) => {
    const target = slides[idx];
    const duplicated: Slide = {
      ...target,
      id: `slide-${Date.now()}-copy`,
      slideNumber: slides.length + 1,
    };
    const newSlides = [...slides];
    newSlides.splice(idx + 1, 0, duplicated);
    setSlides(newSlides);
    setActiveSlideIndex(idx + 1);
  };

  const handleDeleteSlide = (idx: number) => {
    if (slides.length <= 1) {
      alert("A story must contain at least 1 content slide.");
      return;
    }
    const newSlides = slides.filter((_, i) => i !== idx);
    setSlides(newSlides);
    setActiveSlideIndex(Math.max(0, idx - 1));
  };

  // Update current slide field
  const updateCurrentSlide = (fields: Partial<Slide>) => {
    setSlides((prev) => {
      const updated = [...prev];
      if (updated[activeSlideIndex]) {
        updated[activeSlideIndex] = { ...updated[activeSlideIndex], ...fields };
      }
      return updated;
    });
  };

  // File Upload Handlers (converts local file to data URL for instant testing)
  const handleFileToDataUrl = (
    file: File,
    onSuccess: (dataUrl: string, fileName: string) => void
  ) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onSuccess(reader.result, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // Title Image Upload
  const handleTitleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileToDataUrl(file, (dataUrl) => {
        setCoverImage(dataUrl);
      });
    }
  };

  // Slide Image Upload
  const handleSlideImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileToDataUrl(file, (dataUrl) => {
        updateCurrentSlide({ illustrationUrl: dataUrl });
      });
    }
  };

  // Slide Audio Upload
  const handleSlideAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileToDataUrl(file, (dataUrl) => {
        updateCurrentSlide({ audioUrl: dataUrl });
      });
    }
  };

  // Test Play audio in editor
  const handleToggleTestAudio = (text: string, audioUrl?: string) => {
    if (isAudioPlaying) {
      audioEngine.stop();
      setIsAudioPlaying(false);
    } else {
      setIsAudioPlaying(true);
      audioEngine.playSlideAudio(text, audioUrl, () => {
        setIsAudioPlaying(false);
      });
    }
  };

  // Test word lookup from editor
  const handleTestWordClick = async (word: string, context: string) => {
    const cleanWord = word.replace(/[^a-zA-Z0-9'’-]/g, "");
    if (!cleanWord) return;
    const def = await lookupWord(cleanWord, context);
    setTestWordDef(def);
    setIsDictModalOpen(true);
  };

  // JSON Tab Handlers
  const handlePrepareJson = () => {
    const currentObj = buildStoryObject();
    setJsonText(JSON.stringify(currentObj, null, 2));
    setJsonError("");
    setActiveTab("json");
  };

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonText) as Story;
      if (!parsed.title || !Array.isArray(parsed.slides)) {
        throw new Error("Invalid Story structure: missing title or slides array.");
      }
      setTitle(parsed.title || "Untitled Story");
      setSubtitle(parsed.subtitle || "");
      setAuthor(parsed.author || "Author");
      setGenre(parsed.genre || "General");
      setReadingLevel(parsed.readingLevel || "Intermediate");
      setCoverImage(
        parsed.titleSlide?.illustrationUrl ||
          parsed.coverImage ||
          "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80"
      );
      setTitleIntroParagraph(
        parsed.titleSlide?.introParagraph || parsed.summary || ""
      );
      setSummary(parsed.summary || "");
      setIsSeries(Boolean(parsed.seriesTitle || parsed.seriesId));
      setSeriesTitle(parsed.seriesTitle || "");
      setChapterNumber(parsed.chapterNumber?.toString() || "");
      setChapterTitle(parsed.chapterTitle || "");
      setSeriesDescription(parsed.seriesDescription || "");
      setSlides(parsed.slides || []);
      setQuizQuestions(parsed.quizQuestions || []);
      setActiveSlideIndex(0);
      setActiveTab("slides");
    } catch (err: any) {
      setJsonError(err.message || "Failed to parse JSON.");
    }
  };

  const handleLoadSample = () => {
    if (
      window.confirm(
        "Load the 7-slide sample story 'The Clockwork Dragonfly'? Any unsaved edits will be replaced."
      )
    ) {
      setTitle(STARTER_SAMPLE_STORY.title);
      setSubtitle(STARTER_SAMPLE_STORY.subtitle);
      setAuthor(STARTER_SAMPLE_STORY.author);
      setGenre(STARTER_SAMPLE_STORY.genre);
      setReadingLevel(STARTER_SAMPLE_STORY.readingLevel);
      setCoverImage(STARTER_SAMPLE_STORY.coverImage);
      setTitleIntroParagraph(
        STARTER_SAMPLE_STORY.titleSlide?.introParagraph ||
          STARTER_SAMPLE_STORY.summary
      );
      setSummary(STARTER_SAMPLE_STORY.summary);
      setSlides(STARTER_SAMPLE_STORY.slides);
      setQuizQuestions(STARTER_SAMPLE_STORY.quizQuestions);
      setActiveSlideIndex(0);
    }
  };

  // Quiz Builder Helpers
  const handleAddQuestion = (type: QuizQuestionType = "multiple_choice", optionCount: 3 | 4 = 4) => {
    const newId = `quiz-${Date.now()}-${quizQuestions.length + 1}`;
    let newQ: QuizQuestion;
    if (type === "multiple_choice") {
      newQ = {
        id: newId,
        type: "multiple_choice",
        question: `Question ${quizQuestions.length + 1}: Enter comprehension prompt here...`,
        options:
          optionCount === 3
            ? ["First choice", "Second choice", "Third choice"]
            : ["First choice", "Second choice", "Third choice", "Fourth choice"],
        correctIndex: 0,
        explanation: "Explain why this answer is correct (presented to students during answer review).",
      };
    } else if (type === "true_false") {
      newQ = {
        id: newId,
        type: "true_false",
        question: `Statement ${quizQuestions.length + 1}: According to the story, [statement]...`,
        correctBoolean: true,
        explanation: "Explain why this statement is True or False according to the story.",
      };
    } else {
      newQ = {
        id: newId,
        type: "open_response",
        question: `Discussion Question ${quizQuestions.length + 1}: Describe in your own words how...`,
        sampleAnswer: "Example student answer demonstrating key understanding of the story.",
        explanation: "Key concepts, evidence, or vocabulary students should include.",
      };
    }
    setQuizQuestions([...quizQuestions, newQ]);
  };

  const handleDuplicateQuestion = (index: number) => {
    const target = quizQuestions[index];
    const copy: QuizQuestion = {
      ...target,
      id: `quiz-${Date.now()}`,
      options: target.options ? [...target.options] : undefined,
    };
    const updated = [...quizQuestions];
    updated.splice(index + 1, 0, copy);
    setQuizQuestions(updated);
  };

  const handleMoveQuestion = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === quizQuestions.length - 1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...quizQuestions];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setQuizQuestions(updated);
  };

  const handleTypeChange = (index: number, newType: QuizQuestionType) => {
    const updated = [...quizQuestions];
    const current = updated[index];
    if (newType === "multiple_choice") {
      updated[index] = {
        ...current,
        type: "multiple_choice",
        options:
          current.options && current.options.length >= 3
            ? current.options
            : ["Choice A", "Choice B", "Choice C", "Choice D"],
        correctIndex: typeof current.correctIndex === "number" ? current.correctIndex : 0,
      };
    } else if (newType === "true_false") {
      updated[index] = {
        ...current,
        type: "true_false",
        correctBoolean: typeof current.correctBoolean === "boolean" ? current.correctBoolean : true,
      };
    } else {
      updated[index] = {
        ...current,
        type: "open_response",
        sampleAnswer: current.sampleAnswer || "Example student response explaining key story details.",
      };
    }
    setQuizQuestions(updated);
  };

  const handleToggleMCOptionCount = (index: number, count: 3 | 4) => {
    const updated = [...quizQuestions];
    const current = updated[index];
    let opts = current.options ? [...current.options] : ["Choice A", "Choice B", "Choice C"];
    if (count === 3 && opts.length > 3) {
      opts = opts.slice(0, 3);
      if (current.correctIndex && current.correctIndex >= 3) {
        updated[index].correctIndex = 0;
      }
    } else if (count === 4 && opts.length < 4) {
      opts.push("Choice D");
    }
    updated[index].options = opts;
    setQuizQuestions(updated);
  };

  const handleLoadStandard5Quiz = () => {
    if (
      quizQuestions.length > 0 &&
      !window.confirm(
        "Replace current quiz questions with a standard 5-question template (Multiple Choice, True/False, Open Response) tailored to this story?"
      )
    ) {
      return;
    }
    setQuizQuestions([
      {
        id: `q-std-1`,
        type: "multiple_choice",
        question: `What was the primary goal or quest in "${title}"?`,
        options: [
          "To embark on an exciting journey of discovery and learning",
          "To find a quiet place to sleep",
          "To escape from a sudden storm",
          "To build a large clockwork machine",
        ],
        correctIndex: 0,
        explanation: "The story highlights curiosity, exploration, and learning.",
      },
      {
        id: `q-std-2`,
        type: "multiple_choice",
        question: "Which setting or discovery was central to the adventure?",
        options: [
          "A hidden marvel discovered during exploration",
          "A crowded city marketplace",
          "A noisy railway station",
        ],
        correctIndex: 0,
        explanation: "The story takes place in a scenic and wonder-filled setting.",
      },
      {
        id: `q-std-3`,
        type: "true_false",
        question: "The characters used careful observation and creative problem-solving to succeed.",
        correctBoolean: true,
        explanation: "Patience, observation, and thoughtfulness helped the characters overcome challenges.",
      },
      {
        id: `q-std-4`,
        type: "multiple_choice",
        question: "How did the adventure reach its memorable conclusion?",
        options: [
          "With inspiration, wonder, and excitement for future discoveries",
          "With regret and disappointment",
          "With an unresolved dilemma",
          "With the characters turning back early",
        ],
        correctIndex: 0,
        explanation: "The story concludes on an uplifting and inspiring note for readers.",
      },
      {
        id: `q-std-5`,
        type: "open_response",
        question: `How did the events in "${title}" encourage curiosity or courage? Provide an example from the text.`,
        sampleAnswer:
          "Students should reference a specific moment from the story and explain how the character demonstrated curiosity, bravery, or thoughtful observation.",
        explanation: "Encourages personal reflection and textual synthesis.",
      },
    ]);
  };

  return (
    <div className="w-full min-h-screen bg-[#0a0a0a] text-neutral-100 flex flex-col font-sans">
      {/* Top Studio Bar */}
      <header className="sticky top-0 z-30 bg-[#0c0c0c]/95 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#181818] hover:bg-[#252525] border border-white/10 text-xs font-semibold text-neutral-300 hover:text-white transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Library</span>
            </button>
            <div>
              <h1 className="text-sm font-bold text-white font-serif italic truncate max-w-[200px] sm:max-w-md">
                Story Studio: {title || "Untitled"}
              </h1>
              <p className="text-[10px] text-neutral-400 font-mono">
                Square Album Art • Title Slide + {slides.length} Content Slides
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Developer Button: Add Story Words to Local Dictionary */}
            <button
              id="dev-add-words-btn"
              onClick={() => setIsDevDictionaryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-950/40 hover:bg-orange-900/60 border border-orange-500/30 text-orange-300 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm shadow-orange-500/10"
              title="Developer: Add All Story Words to Shared Local Dictionary (dictionary.txt)"
            >
              <Database className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">Developer:</span>
              <span>Add Words to Dictionary</span>
            </button>

            {/* Test in Reader */}
            <button
              id="editor-test-story-btn"
              onClick={handleTest}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1a1a1a] hover:bg-[#252525] border border-white/10 text-neutral-200 hover:text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
              title="Launch instant live preview in Reader"
            >
              <Eye className="w-3.5 h-3.5 text-orange-400" />
              <span>Test Reader</span>
            </button>

            {/* Save Story */}
            <button
              id="editor-save-story-btn"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-orange-400 hover:bg-orange-500 text-neutral-950 text-xs font-bold shadow-lg shadow-orange-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Story</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Work Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-5 space-y-5">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-2xl bg-[#121212] border border-white/10">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {/* 1. Title Slide Tab */}
            <button
              onClick={() => setActiveTab("titleSlide")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "titleSlide"
                  ? "bg-orange-400 text-neutral-950 shadow-md shadow-orange-500/20"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Disc3 className="w-3.5 h-3.5" />
              <span>Title Slide (Cover)</span>
            </button>

            {/* 2. Content Slides Tab */}
            <button
              onClick={() => setActiveTab("slides")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "slides"
                  ? "bg-orange-400 text-neutral-950 shadow-md shadow-orange-500/20"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Story Slides ({slides.length})</span>
            </button>

            {/* 3. Quiz Tab */}
            <button
              onClick={() => setActiveTab("quiz")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "quiz"
                  ? "bg-orange-400 text-neutral-950 shadow-md shadow-orange-500/20"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Comprehension Quiz ({quizQuestions.length})</span>
            </button>

            {/* 4. JSON Studio Tab */}
            <button
              onClick={handlePrepareJson}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "json"
                  ? "bg-orange-400 text-neutral-950 shadow-md shadow-orange-500/20"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>JSON Studio</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDevDictionaryOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-[11px] font-mono text-orange-300 hover:text-orange-200 transition-all cursor-pointer"
              title="Add story words to local dictionary.txt"
            >
              <Database className="w-3 h-3 text-orange-400" />
              <span>Dictionary .TXT Sync</span>
            </button>

            <button
              onClick={handleLoadSample}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1e1e1e] hover:bg-[#262626] border border-white/5 text-[11px] font-mono text-orange-300 hover:text-orange-200 transition-all cursor-pointer"
              title="Populate with 7-slide sample story"
            >
              <Sparkles className="w-3 h-3 text-orange-400" />
              <span>Load 7-Slide Sample</span>
            </button>
          </div>
        </div>

        {/* TAB 1: TITLE SLIDE (COVER) EDITOR */}
        {activeTab === "titleSlide" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Title Slide Details & Text */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-5 rounded-3xl bg-[#141414] border border-white/5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Disc3 className="w-4 h-4 text-orange-400" />
                    <h3 className="font-bold text-sm text-white font-serif italic">
                      Title Slide Details
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-orange-300 font-bold bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
                    Slide 0 / Cover
                  </span>
                </div>

                {/* Story Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">
                    Story Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., The Whispering Oak of Eldoria"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1a1a1a] border border-white/10 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-orange-400 font-serif italic"
                  />
                </div>

                {/* Subtitle / Tagline */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">
                    Subtitle / Tagline
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g., A tale of magic, nature, and listening"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1a1a1a] border border-white/10 text-xs text-neutral-200 focus:outline-hidden focus:ring-1 focus:ring-orange-400"
                  />
                </div>

                {/* Author & Genre Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">
                      Author / Narrator
                    </label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="e.g., Elena Vance"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#1a1a1a] border border-white/10 text-xs text-neutral-200 focus:outline-hidden focus:ring-1 focus:ring-orange-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">
                      Genre / Category
                    </label>
                    <input
                      type="text"
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      placeholder="e.g., Fantasy & Nature"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#1a1a1a] border border-white/10 text-xs text-neutral-200 focus:outline-hidden focus:ring-1 focus:ring-orange-400"
                    />
                  </div>
                </div>

                {/* Reading Level */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">
                    Target Reading Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      "Beginner",
                      "Intermediate",
                      "Advanced",
                    ].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setReadingLevel(lvl as any)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          readingLevel === lvl
                            ? "bg-orange-400 text-neutral-950 border-orange-400 shadow-md shadow-orange-500/20"
                            : "bg-[#1a1a1a] text-neutral-400 border-white/10 hover:text-white"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Series Designation */}
                <div className="p-4 rounded-2xl bg-[#1a1a1a] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bookmark className="w-4 h-4 text-orange-400" />
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Series Designation (Optional)
                        </span>
                        <span className="text-[11px] text-neutral-400 block">
                          Group multiple chapter decks under a single library card (e.g., "The Odyssey")
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSeries(!isSeries)}
                      className={`p-1.5 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-bold ${
                        isSeries
                          ? "bg-orange-400 text-neutral-950 border-orange-400"
                          : "bg-white/5 text-neutral-400 border-white/10 hover:text-white"
                      }`}
                    >
                      {isSeries ? (
                        <>
                          <ToggleRight className="w-4 h-4" />
                          <span>Enabled</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4" />
                          <span>Standalone</span>
                        </>
                      )}
                    </button>
                  </div>

                  {isSeries && (
                    <div className="pt-3 border-t border-white/5 space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-neutral-300">
                          Series Title *
                        </label>
                        <input
                          type="text"
                          value={seriesTitle}
                          onChange={(e) => setSeriesTitle(e.target.value)}
                          placeholder="e.g., The Odyssey, Artemis Quest, Greek Myths..."
                          className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-orange-400 font-serif"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-neutral-300">
                            Chapter Designation
                          </label>
                          <input
                            type="text"
                            value={chapterNumber}
                            onChange={(e) => setChapterNumber(e.target.value)}
                            placeholder="e.g., Chapter 1, Part II, Act III..."
                            className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-orange-400 font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-neutral-300">
                            Chapter Sub-title
                          </label>
                          <input
                            type="text"
                            value={chapterTitle}
                            onChange={(e) => setChapterTitle(e.target.value)}
                            placeholder="e.g., The Lotus Eaters, The Sirens..."
                            className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-orange-400"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-neutral-300">
                          Series Overview / Lore (optional)
                        </label>
                        <input
                          type="text"
                          value={seriesDescription}
                          onChange={(e) => setSeriesDescription(e.target.value)}
                          placeholder="Short description of the overall series arc..."
                          className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-orange-400"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Title Slide Synopsis / Prologue Text */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                    <span>Title Slide Intro / Synopsis (Tappable Words)</span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {titleIntroParagraph.length} chars
                    </span>
                  </label>
                  <textarea
                    rows={4}
                    value={titleIntroParagraph}
                    onChange={(e) => {
                      setTitleIntroParagraph(e.target.value);
                      setSummary(e.target.value);
                    }}
                    placeholder="Enter an introductory synopsis. Every word will be interactively tappable for dictionary definitions!"
                    className="w-full p-3.5 rounded-2xl bg-[#1a1a1a] border border-white/10 text-xs sm:text-sm text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-orange-400 font-serif leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Square Title Image / Album Artwork Showcase */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-3xl bg-[#141414] border border-white/5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-orange-400" />
                    <h3 className="font-bold text-sm text-white font-serif italic">
                      Square Album Artwork (1:1 Ratio)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-orange-300 font-bold bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                    Aspect: Square
                  </span>
                </div>

                {/* Square Album Cover Preview Box */}
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#121212] border border-white/10 shadow-2xl group flex items-center justify-center">
                  <img
                    src={coverImage}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  {/* Vinyl Album Sheen Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-white/10 pointer-events-none" />

                  <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none">
                    <span className="text-[9px] uppercase tracking-widest text-orange-300 font-bold block">
                      {genre}
                    </span>
                    <h4 className="text-sm font-bold font-serif italic leading-tight truncate">
                      {title}
                    </h4>
                  </div>
                </div>

                {/* Image Upload & URL input */}
                <div className="space-y-2">
                  <input
                    type="file"
                    ref={titleImageInputRef}
                    onChange={handleTitleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  <button
                    onClick={() => titleImageInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-400/15 hover:bg-orange-400/25 border border-orange-400/30 text-orange-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Square Album Cover Image (PNG/JPG)</span>
                  </button>

                  <div className="relative">
                    <input
                      type="text"
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      placeholder="Or paste Image URL (https://...)"
                      className="w-full px-3 py-2 rounded-xl bg-[#1a1a1a] border border-white/10 text-xs text-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-orange-400 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONTENT SLIDES EDITOR (7-10 Slides) */}
        {activeTab === "slides" && (
          <div className="space-y-4">
            {/* Horizontal Slide Selector Bar */}
            <div className="p-3 rounded-2xl bg-[#141414] border border-white/5">
              <div className="flex items-center justify-between text-xs text-neutral-400 font-mono mb-2">
                <span className="flex items-center gap-1.5">
                  <span>Story Content Slides:</span>
                  <span className="text-orange-400 font-bold">
                    Slide {activeSlideIndex + 1} of {slides.length}
                  </span>
                </span>
                <span className="text-[11px] text-neutral-500">
                  Recommended: 7–10 slides
                </span>
              </div>

              {/* Slide Buttons Strip */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                {/* Title Slide shortcut button */}
                <button
                  onClick={() => setActiveTab("titleSlide")}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-white/10 bg-[#161616] text-neutral-400 hover:text-white cursor-pointer"
                  title="Edit Title Slide"
                >
                  <Disc3 className="w-3 h-3 text-orange-400" />
                  <span>Cover Slide</span>
                </button>

                {slides.map((s, idx) => {
                  const isActive = idx === activeSlideIndex;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveSlideIndex(idx)}
                      className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-orange-400 text-neutral-950 shadow-md shadow-orange-500/20"
                          : "bg-[#181818] hover:bg-[#222222] text-neutral-300 border border-white/5"
                      }`}
                    >
                      <span className="font-mono">{idx + 1}</span>
                      <span className="truncate max-w-[90px] font-serif">
                        {s.paragraph.slice(0, 16)}...
                      </span>
                    </button>
                  );
                })}

                {/* Add Slide Button */}
                <button
                  onClick={handleAddSlide}
                  className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl bg-orange-400/10 hover:bg-orange-400/20 text-orange-300 border border-orange-400/30 text-xs font-bold transition-all cursor-pointer"
                  title="Add new content slide"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Slide</span>
                </button>
              </div>
            </div>

            {/* Side-by-Side Slide Authoring Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Text & Tap-to-Define Preview */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-5 rounded-3xl bg-[#141414] border border-white/5 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-orange-400" />
                      <h3 className="font-bold text-sm text-white font-serif italic">
                        Slide {activeSlideIndex + 1} Paragraph Text
                      </h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDuplicateSlide(activeSlideIndex)}
                        className="p-1.5 rounded-lg bg-[#1e1e1e] hover:bg-[#282828] text-neutral-400 hover:text-white text-xs transition-all cursor-pointer"
                        title="Duplicate this slide"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSlide(activeSlideIndex)}
                        className="p-1.5 rounded-lg bg-[#1e1e1e] hover:bg-red-950/60 text-neutral-400 hover:text-red-400 text-xs transition-all cursor-pointer"
                        title="Delete this slide"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Paragraph Textarea */}
                  <div className="space-y-1.5">
                    <textarea
                      rows={5}
                      value={currentSlide.paragraph}
                      onChange={(e) => updateCurrentSlide({ paragraph: e.target.value })}
                      placeholder="Enter the paragraph for this slide..."
                      className="w-full p-4 rounded-2xl bg-[#1a1a1a] border border-white/10 text-neutral-100 text-sm sm:text-base leading-relaxed focus:outline-hidden focus:ring-1 focus:ring-orange-400 font-serif"
                    />
                  </div>

                  {/* Interactive Tap-to-Define Live Preview */}
                  <div className="p-4 rounded-2xl bg-[#101010] border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-orange-400">
                        <Sparkles className="w-3.5 h-3.5" /> Live Dictionary Preview
                      </span>
                      <span>Tap any word below</span>
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-300 font-serif leading-relaxed select-text">
                      {currentSlide.paragraph.split(" ").map((w, idx) => (
                        <span
                          key={idx}
                          onClick={() => handleTestWordClick(w, currentSlide.paragraph)}
                          className="cursor-pointer hover:bg-white/10 hover:text-orange-300 px-1 py-0.5 rounded-sm transition-all"
                        >
                          {w}{" "}
                        </span>
                      ))}
                    </p>
                  </div>
                </div>

                {/* Slide Audio Narration Box */}
                <div className="p-5 rounded-3xl bg-[#141414] border border-white/5 shadow-2xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-orange-400" />
                      <h3 className="font-bold text-sm text-white font-serif italic">
                        Slide {activeSlideIndex + 1} Audio Narration
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">
                      {currentSlide.audioUrl ? "Custom Audio Attached" : "Speech Synthesis Ready"}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400 font-serif leading-relaxed">
                    Upload an audio file (MP3/WAV) or let the app automatically narrate this slide with natural speech synthesis.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <input
                      type="file"
                      ref={slideAudioInputRef}
                      onChange={handleSlideAudioUpload}
                      accept="audio/*"
                      className="hidden"
                    />

                    <button
                      onClick={() => slideAudioInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-400/15 hover:bg-orange-400/25 border border-orange-400/30 text-orange-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Slide Audio (MP3/WAV)</span>
                    </button>

                    {currentSlide.audioUrl && (
                      <button
                        onClick={() => updateCurrentSlide({ audioUrl: "" })}
                        className="px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-950/70 border border-red-500/30 text-red-300 text-xs transition-all cursor-pointer"
                      >
                        Remove Audio File
                      </button>
                    )}

                    <button
                      onClick={() =>
                        handleToggleTestAudio(
                          currentSlide.paragraph,
                          currentSlide.audioUrl
                        )
                      }
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isAudioPlaying
                          ? "bg-[#1f1f1f] text-orange-400 border-orange-400/40"
                          : "bg-[#1a1a1a] hover:bg-[#252525] text-neutral-200 border-white/10"
                      }`}
                    >
                      {isAudioPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>Stop Audio</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Test Play Slide Narration</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Square Slide Illustration (Album Cover Style) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-5 rounded-3xl bg-[#141414] border border-white/5 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-orange-400" />
                      <h3 className="font-bold text-sm text-white font-serif italic">
                        Square Slide Artwork (1:1 Ratio)
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-orange-300 font-bold bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                      Aspect: Square
                    </span>
                  </div>

                  {/* Square Slide Illustration Box */}
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#121212] border border-white/10 shadow-2xl group flex items-center justify-center">
                    <img
                      src={currentSlide.illustrationUrl}
                      alt={currentSlide.illustrationCaption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    {/* Vinyl Sheen Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-transparent to-white/5 pointer-events-none" />

                    <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none">
                      <span className="text-[9px] uppercase tracking-widest text-orange-300 font-bold block">
                        Slide {activeSlideIndex + 1} Artwork
                      </span>
                      <p className="text-xs text-neutral-200 font-medium truncate">
                        {currentSlide.illustrationCaption}
                      </p>
                    </div>
                  </div>

                  {/* Image Upload & URL input */}
                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={slideImageInputRef}
                      onChange={handleSlideImageUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    <button
                      onClick={() => slideImageInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-400/15 hover:bg-orange-400/25 border border-orange-400/30 text-orange-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Square Image (PNG/JPG)</span>
                    </button>

                    <input
                      type="text"
                      value={currentSlide.illustrationUrl}
                      onChange={(e) =>
                        updateCurrentSlide({ illustrationUrl: e.target.value })
                      }
                      placeholder="Or paste Image URL (https://...)"
                      className="w-full px-3 py-2 rounded-xl bg-[#1a1a1a] border border-white/10 text-xs text-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-orange-400 font-mono"
                    />

                    <input
                      type="text"
                      value={currentSlide.illustrationCaption}
                      onChange={(e) =>
                        updateCurrentSlide({ illustrationCaption: e.target.value })
                      }
                      placeholder="Image caption / scene description"
                      className="w-full px-3 py-2 rounded-xl bg-[#1a1a1a] border border-white/10 text-xs text-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-orange-400 font-serif italic"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: QUIZ EDITOR */}
        {activeTab === "quiz" && (
          <div className="p-5 sm:p-6 rounded-3xl bg-[#141414] border border-white/5 shadow-2xl space-y-6">
            {/* Header & Quick Action Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-orange-400" />
                  <h3 className="font-bold text-base text-white font-serif italic">
                    Comprehension Quiz Studio ({quizQuestions.length} Questions)
                  </h3>
                </div>
                <p className="text-xs text-neutral-400">
                  Build 5-question comprehension quizzes featuring multiple choice (3 or 4 choices), True/False, and open response formats.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadStandard5Quiz}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all cursor-pointer"
                  title="Generate standard 5-question mix"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>5-Q Template</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsTestQuizModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all cursor-pointer"
                  title="Preview student quiz flow"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Test Quiz</span>
                </button>
              </div>
            </div>

            {/* Quick Add Question Bar */}
            <div className="p-3 rounded-2xl bg-[#181818] border border-white/5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-orange-400" />
                <span>Add Question:</span>
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddQuestion("multiple_choice", 4)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#222] hover:bg-[#2c2c2c] border border-white/10 hover:border-orange-500/40 text-xs font-medium text-neutral-200 hover:text-white transition-all cursor-pointer"
                >
                  <ListOrdered className="w-3.5 h-3.5 text-orange-400" />
                  <span>Multiple Choice (4)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddQuestion("multiple_choice", 3)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#222] hover:bg-[#2c2c2c] border border-white/10 hover:border-orange-500/40 text-xs font-medium text-neutral-200 hover:text-white transition-all cursor-pointer"
                >
                  <ListOrdered className="w-3.5 h-3.5 text-amber-400" />
                  <span>Multiple Choice (3)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddQuestion("true_false")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#222] hover:bg-[#2c2c2c] border border-white/10 hover:border-blue-500/40 text-xs font-medium text-neutral-200 hover:text-white transition-all cursor-pointer"
                >
                  <ToggleLeft className="w-3.5 h-3.5 text-blue-400" />
                  <span>True / False</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddQuestion("open_response")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#222] hover:bg-[#2c2c2c] border border-white/10 hover:border-emerald-500/40 text-xs font-medium text-neutral-200 hover:text-white transition-all cursor-pointer"
                >
                  <PenTool className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Open Response</span>
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-5">
              {quizQuestions.map((q, qIdx) => {
                const currentType: QuizQuestionType = q.type || (q.options ? "multiple_choice" : "open_response");

                return (
                  <div
                    key={q.id || `q-${qIdx}`}
                    className="p-5 rounded-2xl bg-[#1a1a1a] border border-white/10 hover:border-white/20 transition-all space-y-4 shadow-lg"
                  >
                    {/* Card Header & Format Selector */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        {/* Up/Down Reorder */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            disabled={qIdx === 0}
                            onClick={() => handleMoveQuestion(qIdx, "up")}
                            className="p-1 rounded bg-[#242424] hover:bg-[#303030] disabled:opacity-30 disabled:cursor-not-allowed text-neutral-400 hover:text-white cursor-pointer transition-colors"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={qIdx === quizQuestions.length - 1}
                            onClick={() => handleMoveQuestion(qIdx, "down")}
                            className="p-1 rounded bg-[#242424] hover:bg-[#303030] disabled:opacity-30 disabled:cursor-not-allowed text-neutral-400 hover:text-white cursor-pointer transition-colors"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="px-2.5 py-1 rounded-lg bg-orange-400/10 border border-orange-400/30 text-orange-400 font-mono font-bold text-xs">
                          Q{qIdx + 1}
                        </span>

                        {/* Format Dropdown / Pill Switcher */}
                        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#121212] border border-white/10">
                          <button
                            type="button"
                            onClick={() => handleTypeChange(qIdx, "multiple_choice")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                              currentType === "multiple_choice"
                                ? "bg-orange-400 text-neutral-950 shadow-sm"
                                : "text-neutral-400 hover:text-white"
                            }`}
                          >
                            Multiple Choice
                          </button>

                          <button
                            type="button"
                            onClick={() => handleTypeChange(qIdx, "true_false")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                              currentType === "true_false"
                                ? "bg-blue-400 text-neutral-950 shadow-sm"
                                : "text-neutral-400 hover:text-white"
                            }`}
                          >
                            True / False
                          </button>

                          <button
                            type="button"
                            onClick={() => handleTypeChange(qIdx, "open_response")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                              currentType === "open_response"
                                ? "bg-emerald-400 text-neutral-950 shadow-sm"
                                : "text-neutral-400 hover:text-white"
                            }`}
                          >
                            Open Response
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDuplicateQuestion(qIdx)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#252525] hover:bg-[#303030] text-neutral-400 hover:text-white text-xs transition-colors cursor-pointer"
                          title="Duplicate Question"
                        >
                          <Copy className="w-3 h-3" />
                          <span className="hidden sm:inline">Duplicate</span>
                        </button>

                        {quizQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setQuizQuestions(quizQuestions.filter((_, i) => i !== qIdx))
                            }
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs transition-colors cursor-pointer"
                            title="Delete Question"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Question Prompt Field */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                        <span>
                          {currentType === "true_false"
                            ? "Statement / Claim"
                            : currentType === "open_response"
                            ? "Discussion Prompt / Question"
                            : "Question Prompt"}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-normal">
                          Presented to students
                        </span>
                      </label>
                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => {
                          const updated = [...quizQuestions];
                          updated[qIdx].question = e.target.value;
                          setQuizQuestions(updated);
                        }}
                        placeholder={
                          currentType === "true_false"
                            ? "Enter a statement for students to evaluate as True or False..."
                            : "Enter the comprehension question text..."
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#121212] border border-white/10 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-orange-400 font-serif leading-relaxed"
                      />
                    </div>

                    {/* Type-Specific Answer Configuration */}
                    {currentType === "multiple_choice" && (
                      <div className="space-y-3 p-4 rounded-xl bg-[#141414] border border-white/5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />
                            <span>Answer Choices (Select radio to denote correct answer)</span>
                          </span>

                          {/* 3 vs 4 Choices Toggle */}
                          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#222] border border-white/10 text-[10px]">
                            <button
                              type="button"
                              onClick={() => handleToggleMCOptionCount(qIdx, 3)}
                              className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                                (q.options?.length || 4) === 3
                                  ? "bg-orange-400 text-neutral-950"
                                  : "text-neutral-400 hover:text-white"
                              }`}
                            >
                              3 Choices
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleMCOptionCount(qIdx, 4)}
                              className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                                (q.options?.length || 4) >= 4
                                  ? "bg-orange-400 text-neutral-950"
                                  : "text-neutral-400 hover:text-white"
                              }`}
                            >
                              4 Choices
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          {(q.options || ["Choice A", "Choice B", "Choice C", "Choice D"]).map((opt, optIdx) => {
                            const isCorrect = (q.correctIndex || 0) === optIdx;
                            const optionLetter = String.fromCharCode(65 + optIdx);

                            return (
                              <div
                                key={optIdx}
                                className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                                  isCorrect
                                    ? "bg-orange-400/10 border-orange-400/40"
                                    : "bg-[#181818] border-white/5"
                                }`}
                              >
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                  <input
                                    type="radio"
                                    name={`correct-${q.id || qIdx}`}
                                    checked={isCorrect}
                                    onChange={() => {
                                      const updated = [...quizQuestions];
                                      updated[qIdx].correctIndex = optIdx;
                                      setQuizQuestions(updated);
                                    }}
                                    className="accent-orange-400 w-4 h-4 cursor-pointer"
                                  />
                                  <span
                                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                                      isCorrect
                                        ? "bg-orange-400 text-neutral-950 shadow-sm"
                                        : "bg-white/10 text-neutral-400"
                                    }`}
                                  >
                                    {optionLetter}
                                  </span>
                                </label>

                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const updated = [...quizQuestions];
                                    const opts = [...(updated[qIdx].options || [])];
                                    opts[optIdx] = e.target.value;
                                    updated[qIdx].options = opts;
                                    setQuizQuestions(updated);
                                  }}
                                  placeholder={`Choice ${optionLetter}...`}
                                  className="flex-1 px-3 py-1.5 rounded-lg bg-[#111] border border-white/10 text-xs text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-orange-400"
                                />

                                {isCorrect && (
                                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-orange-400 shrink-0 pr-1">
                                    <Check className="w-3 h-3" />
                                    <span>Correct Answer</span>
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {currentType === "true_false" && (
                      <div className="p-4 rounded-xl bg-[#141414] border border-white/5 space-y-3">
                        <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1.5">
                          <ToggleLeft className="w-3.5 h-3.5 text-blue-400" />
                          <span>Denote Correct Answer (Click to select)</span>
                        </span>

                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...quizQuestions];
                              updated[qIdx].correctBoolean = true;
                              setQuizQuestions(updated);
                            }}
                            className={`p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                              q.correctBoolean === true
                                ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500/50"
                                : "bg-[#181818] border-white/10 text-neutral-400 hover:text-white"
                            }`}
                          >
                            <span className="font-bold text-sm font-serif">True</span>
                            {q.correctBoolean === true && (
                              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Correct</span>
                              </span>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...quizQuestions];
                              updated[qIdx].correctBoolean = false;
                              setQuizQuestions(updated);
                            }}
                            className={`p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                              q.correctBoolean === false
                                ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-md ring-1 ring-amber-500/50"
                                : "bg-[#181818] border-white/10 text-neutral-400 hover:text-white"
                            }`}
                          >
                            <span className="font-bold text-sm font-serif">False</span>
                            {q.correctBoolean === false && (
                              <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Correct</span>
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {currentType === "open_response" && (
                      <div className="p-4 rounded-xl bg-[#141414] border border-white/5 space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                            <PenTool className="w-3.5 h-3.5" />
                            <span>Sample / Ideal Student Response (Shown in Review)</span>
                          </label>
                          <textarea
                            rows={3}
                            value={q.sampleAnswer || ""}
                            onChange={(e) => {
                              const updated = [...quizQuestions];
                              updated[qIdx].sampleAnswer = e.target.value;
                              setQuizQuestions(updated);
                            }}
                            placeholder="Write an exemplary model answer for students to compare their written response against..."
                            className="w-full px-3.5 py-2 rounded-xl bg-[#111] border border-white/10 text-xs text-emerald-100 placeholder-neutral-600 focus:outline-hidden focus:ring-1 focus:ring-emerald-400 leading-relaxed font-serif"
                          />
                        </div>
                      </div>
                    )}

                    {/* Answer Explanation / Story Fact */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                        <span>Answer Explanation / Story Context</span>
                        <span className="text-[10px] text-neutral-500 font-normal">
                          Displayed on student review screen
                        </span>
                      </label>
                      <input
                        type="text"
                        value={q.explanation || ""}
                        onChange={(e) => {
                          const updated = [...quizQuestions];
                          updated[qIdx].explanation = e.target.value;
                          setQuizQuestions(updated);
                        }}
                        placeholder="Explain why this is correct or cite specific story evidence..."
                        className="w-full px-3.5 py-2 rounded-xl bg-[#121212] border border-white/10 text-xs text-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-orange-400 font-serif italic"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: JSON STUDIO TAB */}
        {activeTab === "json" && (
          <div className="p-5 rounded-3xl bg-[#141414] border border-white/5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-orange-400" />
                <h3 className="font-bold text-sm text-white font-serif italic">
                  Raw Story JSON Editor
                </h3>
              </div>
              <button
                onClick={handleApplyJson}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-400 hover:bg-orange-500 text-neutral-950 text-xs font-bold transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Apply JSON to Editor</span>
              </button>
            </div>

            {jsonError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{jsonError}</span>
              </div>
            )}

            <textarea
              rows={16}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full p-4 rounded-2xl bg-[#0c0c0c] border border-white/10 text-xs text-emerald-300 font-mono focus:outline-hidden focus:ring-1 focus:ring-orange-400 leading-relaxed"
            />
          </div>
        )}
      </main>

      {/* Dictionary Modal for testing in Editor */}
      {testWordDef && (
        <DictionaryModal
          definition={testWordDef}
          isOpen={isDictModalOpen}
          onClose={() => setIsDictModalOpen(false)}
          onSaveWord={() => {}}
          onRemoveSavedWord={() => {}}
          isWordSaved={false}
          storyTitle={title}
          slideNumber={activeSlideIndex + 1}
        />
      )}

      {/* Comprehension Quiz Test Modal in Editor */}
      {isTestQuizModalOpen && (
        <ComprehensionQuizModal
          story={buildStoryObject()}
          isOpen={isTestQuizModalOpen}
          onClose={() => setIsTestQuizModalOpen(false)}
          onCompleteQuiz={() => {}}
        />
      )}

      {/* Developer Shared Dictionary Modal */}
      <DeveloperDictionaryModal
        isOpen={isDevDictionaryOpen}
        onClose={() => setIsDevDictionaryOpen(false)}
        storyData={{
          title,
          subtitle,
          author,
          summary,
          titleSlide: { introParagraph: titleIntroParagraph },
          slides,
        }}
      />
    </div>
  );
};
