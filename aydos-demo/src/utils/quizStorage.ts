import { QuizQuestion, Story } from "../types";

export interface QuizFetchResult {
  questions: QuizQuestion[];
  source: string; // "disk" | "github" | "none" | "error-fallback"
}

type QuizFolderRef = Pick<Story, "seriesFolder" | "chapterFolder" | "storyFolder">;

function buildQuizQuery(story: QuizFolderRef): string {
  const params = new URLSearchParams();
  if (story.seriesFolder && story.chapterFolder) {
    params.set("seriesFolder", story.seriesFolder);
    params.set("chapterFolder", story.chapterFolder);
  } else if (story.storyFolder) {
    params.set("storyFolder", story.storyFolder);
  }
  return params.toString();
}

/**
 * Fetches quiz.json for a story or series chapter from the server
 * (disk first, falling back to GitHub). Returns an empty array, not an
 * error, if no quiz.json exists yet for this story -- that's the normal
 * state for anything still using the generic placeholder question.
 */
export async function fetchQuizForStory(story: QuizFolderRef): Promise<QuizFetchResult> {
  const query = buildQuizQuery(story);
  if (!query) return { questions: [], source: "none" };

  try {
    const res = await fetch(`/api/quiz/file?${query}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.questions)) {
        return { questions: data.questions, source: data.source || "unknown" };
      }
    }
  } catch (err) {
    console.warn("Could not fetch quiz.json:", err);
  }
  return { questions: [], source: "none" };
}

/**
 * Saves quiz.json for a story or series chapter to disk + GitHub.
 * Requires the story to have either (seriesFolder + chapterFolder) or
 * storyFolder set -- without one of those there's no folder to write into.
 */
export async function saveQuizForStory(
  story: QuizFolderRef & Pick<Story, "title">,
  questions: QuizQuestion[]
): Promise<boolean> {
  const body: Record<string, unknown> = {
    questions,
    message: `Update quiz: ${story.title || "story"}`,
  };

  if (story.seriesFolder && story.chapterFolder) {
    body.seriesFolder = story.seriesFolder;
    body.chapterFolder = story.chapterFolder;
  } else if (story.storyFolder) {
    body.storyFolder = story.storyFolder;
  } else {
    console.warn("Cannot save quiz: story has no seriesFolder+chapterFolder or storyFolder set.");
    return false;
  }

  try {
    const res = await fetch("/api/quiz/file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to save quiz.json:", err);
    return false;
  }
}
