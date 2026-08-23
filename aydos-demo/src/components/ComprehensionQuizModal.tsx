import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Award,
  RotateCcw,
  BookOpen,
  ArrowRight,
  X,
  Check,
  HelpCircle,
  ListFilter,
  Eye,
  Send,
  MessageSquareQuote,
  Flame,
  Star,
} from "lucide-react";
import { Story, QuizQuestion, StudentQuizSubmission } from "../types";

interface ComprehensionQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: Story;
  onReread: () => void;
  onBackToLibrary: () => void;
}

export const ComprehensionQuizModal: React.FC<ComprehensionQuizModalProps> = ({
  isOpen,
  onClose,
  story,
  onReread,
  onBackToLibrary,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submissions, setSubmissions] = useState<StudentQuizSubmission[]>([]);

  // Current Question Interactive State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [selectedBoolean, setSelectedBoolean] = useState<boolean | null>(null);
  const [openResponseText, setOpenResponseText] = useState("");
  const [isOpenSubmitted, setIsOpenSubmitted] = useState(false);

  // Overall View State: 'taking' | 'results' | 'review'
  const [quizPhase, setQuizPhase] = useState<"taking" | "results" | "review">("taking");
  const [reviewFilter, setReviewFilter] = useState<"all" | "incorrect" | "correct">("all");

  const questions: QuizQuestion[] = story.quizQuestions || [];
  const currentQ: QuizQuestion | undefined = questions[currentQuestionIndex];
  const qType = currentQ?.type || "multiple_choice";

  // Reset quiz on open
  useEffect(() => {
    if (isOpen) {
      setCurrentQuestionIndex(0);
      setSubmissions([]);
      setSelectedOption(null);
      setSelectedBoolean(null);
      setOpenResponseText("");
      setIsOpenSubmitted(false);
      setQuizPhase("taking");
      setReviewFilter("all");
    }
  }, [isOpen, story]);

  // Handle Multiple Choice Option Selection
  const handleSelectOption = (idx: number) => {
    if (!currentQ || selectedOption !== null) return;
    setSelectedOption(idx);

    const isCorrect = idx === currentQ.correctIndex;
    const submission: StudentQuizSubmission = {
      questionId: currentQ.id,
      type: "multiple_choice",
      selectedOptionIndex: idx,
      isCorrect,
    };

    setSubmissions((prev) => [...prev.filter((s) => s.questionId !== currentQ.id), submission]);
  };

  // Handle True / False Selection
  const handleSelectBoolean = (val: boolean) => {
    if (!currentQ || selectedBoolean !== null) return;
    setSelectedBoolean(val);

    const isCorrect = val === currentQ.correctBoolean;
    const submission: StudentQuizSubmission = {
      questionId: currentQ.id,
      type: "true_false",
      selectedBoolean: val,
      isCorrect,
    };

    setSubmissions((prev) => [...prev.filter((s) => s.questionId !== currentQ.id), submission]);
  };

  // Handle Open Response Submission
  const handleOpenResponseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQ || !openResponseText.trim() || isOpenSubmitted) return;

    setIsOpenSubmitted(true);
    const submission: StudentQuizSubmission = {
      questionId: currentQ.id,
      type: "open_response",
      writtenResponse: openResponseText.trim(),
      isCorrect: true, // Award credit for thoughtful open response submission
    };

    setSubmissions((prev) => [...prev.filter((s) => s.questionId !== currentQ.id), submission]);
  };

  // Check if current question has been answered
  const hasAnsweredCurrent = () => {
    if (!currentQ) return false;
    if (qType === "multiple_choice") return selectedOption !== null;
    if (qType === "true_false") return selectedBoolean !== null;
    if (qType === "open_response") return isOpenSubmitted;
    return false;
  };

  // Advance to next question or show results
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      setSelectedOption(null);
      setSelectedBoolean(null);
      setOpenResponseText("");
      setIsOpenSubmitted(false);
    } else {
      // Finished all questions!
      setQuizPhase("results");
      const correctCount = submissions.filter((s) => s.isCorrect).length;
      const pct = (correctCount / Math.max(1, questions.length)) * 100;
      if (pct >= 60) {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    }
  };

  // Restart Quiz
  const handleRetakeQuiz = () => {
    setCurrentQuestionIndex(0);
    setSubmissions([]);
    setSelectedOption(null);
    setSelectedBoolean(null);
    setOpenResponseText("");
    setIsOpenSubmitted(false);
    setQuizPhase("taking");
    setReviewFilter("all");
  };

  if (!isOpen) return null;

  // Compute Score Stats
  const totalQuestions = questions.length;
  const correctAnswers = submissions.filter((s) => s.isCorrect).length;
  const scorePercent = Math.round((correctAnswers / Math.max(1, totalQuestions)) * 100);

  // Motivational badge text
  let scoreBadge = "Great Reader! 🌟";
  if (scorePercent === 100) scoreBadge = "Perfect Score! 🏆";
  else if (scorePercent >= 80) scoreBadge = "Comprehension Star! ⭐️";
  else if (scorePercent >= 60) scoreBadge = "Good Effort! 📖";
  else scoreBadge = "Keep Reading & Practicing! 💡";

  // Filtered review list
  const filteredQuestions = questions.filter((q) => {
    const sub = submissions.find((s) => s.questionId === q.id);
    if (reviewFilter === "incorrect") return sub && !sub.isCorrect;
    if (reviewFilter === "correct") return sub && sub.isCorrect;
    return true;
  });

  return (
    <div
      id="quiz-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="quiz-modal-content"
        className="w-full max-w-lg bg-[#0e1b45] rounded-3xl shadow-2xl border border-white/15 p-5 sm:p-6 max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP BAR */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/15 text-white border border-white/20 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-white" /> Story Comprehension Quiz
            </span>
          </div>
          <button
            id="close-quiz-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close Quiz"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ======================================================== */}
        {/* PHASE 1: ACTIVE QUIZ TAKING                               */}
        {/* ======================================================== */}
        {quizPhase === "taking" && currentQ && (
          <div className="flex-1 overflow-y-auto pt-4 pb-2 space-y-4 pr-1">
            {/* Progress and Score Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-blue-200 font-mono">
                <span className="font-bold text-white">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </span>
                <span className="text-white font-bold">
                  {qType === "multiple_choice"
                    ? `Multiple Choice (${(currentQ.options || []).length} choices)`
                    : qType === "true_false"
                    ? "True / False"
                    : "Open Response"}
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-300 to-white transition-all duration-300 rounded-full"
                  style={{
                    width: `${((currentQuestionIndex + (hasAnsweredCurrent() ? 1 : 0)) / totalQuestions) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#08102b] border border-white/10 space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-white font-serif italic leading-snug">
                {currentQ.question}
              </h3>
            </div>

            {/* 1. Multiple Choice Options */}
            {qType === "multiple_choice" && currentQ.options && (
              <div className="space-y-2">
                {currentQ.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQ.correctIndex;
                  const answered = selectedOption !== null;

                  let btnClass = "bg-[#08102b] border-white/10 text-blue-100 hover:bg-[#101e46] hover:border-white/30";
                  if (answered) {
                    if (isCorrect) {
                      btnClass = "bg-emerald-950/60 border-emerald-400 text-emerald-100 font-bold shadow-md shadow-emerald-500/20";
                    } else if (isSelected) {
                      btnClass = "bg-red-950/60 border-red-400 text-red-100 font-bold shadow-md shadow-red-500/20";
                    } else {
                      btnClass = "opacity-35 bg-[#08102b] border-white/5 text-blue-300";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={answered}
                      className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-start gap-3 cursor-pointer ${btnClass}`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 ${
                          answered && isCorrect
                            ? "bg-emerald-500 text-neutral-950 border-emerald-400"
                            : answered && isSelected
                            ? "bg-red-500 text-white border-red-400"
                            : "bg-white/10 text-white border-white/20"
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1 font-serif pt-0.5 leading-relaxed">{option}</span>
                      {answered && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      {answered && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 2. True / False Options */}
            {qType === "true_false" && (
              <div className="grid grid-cols-2 gap-3">
                {[true, false].map((val) => {
                  const label = val ? "True" : "False";
                  const isSelected = selectedBoolean === val;
                  const isCorrect = val === currentQ.correctBoolean;
                  const answered = selectedBoolean !== null;

                  let btnClass = "bg-[#08102b] border-white/10 text-blue-100 hover:bg-[#101e46] hover:border-white/30";
                  if (answered) {
                    if (isCorrect) {
                      btnClass = "bg-emerald-950/60 border-emerald-400 text-emerald-100 font-bold shadow-md shadow-emerald-500/20";
                    } else if (isSelected) {
                      btnClass = "bg-red-950/60 border-red-400 text-red-100 font-bold shadow-md shadow-red-500/20";
                    } else {
                      btnClass = "opacity-35 bg-[#08102b] border-white/5 text-blue-300";
                    }
                  }

                  return (
                    <button
                      key={String(val)}
                      onClick={() => handleSelectBoolean(val)}
                      disabled={answered}
                      className={`p-5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${btnClass}`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                          answered && isCorrect
                            ? "bg-emerald-500 text-neutral-950 border-emerald-400"
                            : answered && isSelected
                            ? "bg-red-500 text-white border-red-400"
                            : "bg-white/10 border-white/20 text-white"
                        }`}
                      >
                        {val ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                      </div>
                      <span className="text-sm font-bold font-serif">{label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 3. Open Response Text Input */}
            {qType === "open_response" && (
              <div className="space-y-3">
                {!isOpenSubmitted ? (
                  <form onSubmit={handleOpenResponseSubmit} className="space-y-3">
                    <label className="text-xs font-semibold text-blue-100 flex items-center justify-between">
                      <span>Type your answer below:</span>
                      <span className="text-[10px] text-blue-200/70 font-mono">
                        {openResponseText.length} characters
                      </span>
                    </label>
                    <textarea
                      rows={4}
                      value={openResponseText}
                      onChange={(e) => setOpenResponseText(e.target.value)}
                      placeholder="Write your explanation or thoughts based on the story..."
                      className="w-full p-3.5 rounded-2xl bg-[#08102b] border border-white/15 text-white text-xs sm:text-sm font-serif leading-relaxed focus:outline-hidden focus:ring-1 focus:ring-white"
                      required
                    />
                    <button
                      type="submit"
                      disabled={!openResponseText.trim()}
                      className="w-full py-3 rounded-xl bg-white hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed text-blue-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-white/20 transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" /> Submit Response
                    </button>
                  </form>
                ) : (
                  <div className="space-y-3 p-4 rounded-2xl bg-[#08102b] border border-emerald-500/40 animate-in fade-in">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Response Recorded!</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0e1b45] border border-white/10 text-xs font-serif text-blue-100 italic">
                      "{openResponseText}"
                    </div>
                    {currentQ.sampleAnswer && (
                      <div className="p-3 rounded-xl bg-blue-900/40 border border-white/20 text-xs space-y-1">
                        <span className="text-[11px] uppercase tracking-wider font-bold text-white block">
                          Ideal Sample Response / Key Points:
                        </span>
                        <p className="font-serif text-blue-100 leading-relaxed">
                          {currentQ.sampleAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Explanation and Next Button */}
            {hasAnsweredCurrent() && (
              <div className="p-4 rounded-2xl bg-[#08102b] border border-white/15 space-y-3 animate-in fade-in">
                {currentQ.explanation && (
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-100 font-serif italic leading-relaxed">
                      <span className="font-sans font-bold text-white not-italic">Story Fact: </span>
                      {currentQ.explanation}
                    </p>
                  </div>
                )}

                <button
                  id="quiz-next-btn"
                  onClick={handleNextQuestion}
                  className="w-full py-3 rounded-xl bg-white hover:bg-neutral-100 text-blue-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-white/20 transition-all active:scale-98 cursor-pointer"
                >
                  {currentQuestionIndex < totalQuestions - 1 ? (
                    <>
                      <span>Next Question</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>View Final Score & Results</span>
                      <Award className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* PHASE 2: SCORE & RESULTS SUMMARY                         */}
        {/* ======================================================== */}
        {quizPhase === "results" && (
          <div className="flex-1 overflow-y-auto py-4 space-y-5 text-center">
            {/* Score Ring & Badge */}
            <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 mx-auto flex items-center justify-center shadow-xl">
              <Award className="w-10 h-10 text-white" />
            </div>

            <div className="space-y-1.5">
              <span className="inline-block px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white text-xs font-bold font-mono">
                {scoreBadge}
              </span>
              <h2 className="text-2xl font-bold text-white font-serif italic">
                Quiz Completed!
              </h2>
              <p className="text-xs text-blue-200/80 max-w-xs mx-auto font-sans">
                Great job completing the comprehension check for <span className="text-white italic">"{story.title}"</span>.
              </p>
            </div>

            {/* Score Display Card */}
            <div className="p-5 rounded-2xl bg-[#08102b] border border-white/15 max-w-sm mx-auto grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-[#0e1b45] border border-white/10">
                <span className="text-[10px] text-blue-200 uppercase font-mono tracking-wider block">
                  Score
                </span>
                <span className="text-2xl font-bold text-white font-mono">
                  {correctAnswers} / {totalQuestions}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#0e1b45] border border-white/10">
                <span className="text-[10px] text-blue-200 uppercase font-mono tracking-wider block">
                  Accuracy
                </span>
                <span className="text-2xl font-bold text-emerald-400 font-mono">
                  {scorePercent}%
                </span>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-2.5 max-w-sm mx-auto pt-2">
              {/* Review Answers Button */}
              <button
                id="review-answers-btn"
                onClick={() => setQuizPhase("review")}
                className="w-full py-3 rounded-xl bg-white hover:bg-neutral-100 text-blue-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-white/20 transition-all active:scale-98 cursor-pointer"
              >
                <Eye className="w-4 h-4" /> Review Answers & View Correct Solutions
              </button>

              {/* Retake Quiz */}
              <button
                id="retake-quiz-btn"
                onClick={handleRetakeQuiz}
                className="w-full py-2.5 rounded-xl bg-[#08102b] hover:bg-[#101e46] text-white border border-white/15 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-white" /> Retake Quiz
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    onClose();
                    onReread();
                  }}
                  className="py-2.5 rounded-xl bg-[#08102b] hover:bg-[#101e46] text-blue-100 border border-white/10 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-white" /> Re-read Story
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onBackToLibrary();
                  }}
                  className="py-2.5 rounded-xl bg-[#08102b] hover:bg-[#101e46] text-blue-100 border border-white/10 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Library</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PHASE 3: COMPREHENSIVE ANSWER REVIEW                    */}
        {/* ======================================================== */}
        {quizPhase === "review" && (
          <div className="flex-1 overflow-y-auto pt-3 pb-2 space-y-4 pr-1">
            {/* Review Header Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuizPhase("results")}
                  className="text-xs text-white hover:underline flex items-center gap-1 font-bold cursor-pointer"
                >
                  ← Results Summary
                </button>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 bg-[#08102b] p-1 rounded-xl border border-white/10">
                {(["all", "incorrect", "correct"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setReviewFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      reviewFilter === f
                        ? "bg-white text-blue-950 font-bold"
                        : "text-blue-200 hover:text-white"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions Review List */}
            <div className="space-y-4">
              {filteredQuestions.map((q, idx) => {
                const sub = submissions.find((s) => s.questionId === q.id);
                const isCorrect = sub?.isCorrect;
                const type = q.type || "multiple_choice";

                return (
                  <div
                    key={q.id}
                    className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 transition-all ${
                      isCorrect
                        ? "bg-[#0b1b36] border-emerald-500/40"
                        : "bg-[#25101a] border-red-500/40"
                    }`}
                  >
                    {/* Header line with question type and correctness */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-blue-200">
                        Question {idx + 1} •{" "}
                        <span className="text-white font-bold">
                          {type === "multiple_choice"
                            ? "Multiple Choice"
                            : type === "true_false"
                            ? "True / False"
                            : "Open Response"}
                        </span>
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isCorrect
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-red-500/20 text-red-300 border border-red-500/30"
                        }`}
                      >
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Correct
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Incorrect
                          </>
                        )}
                      </span>
                    </div>

                    {/* Question Prompt */}
                    <h4 className="text-sm sm:text-base font-bold text-white font-serif italic leading-snug">
                      {q.question}
                    </h4>

                    {/* 1. Multiple Choice Review */}
                    {type === "multiple_choice" && q.options && (
                      <div className="space-y-1.5 pt-1">
                        {q.options.map((opt, optIdx) => {
                          const isStudentPick = sub?.selectedOptionIndex === optIdx;
                          const isCorrectPick = optIdx === q.correctIndex;

                          let itemClass = "bg-[#08102b] border-white/5 text-blue-200";
                          if (isCorrectPick) {
                            itemClass = "bg-emerald-950/60 border-emerald-400 text-emerald-100 font-bold";
                          } else if (isStudentPick && !isCorrectPick) {
                            itemClass = "bg-red-950/60 border-red-400 text-red-100 font-semibold";
                          }

                          return (
                            <div
                              key={optIdx}
                              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${itemClass}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-mono text-[10px] font-bold">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="font-serif">{opt}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] font-mono shrink-0">
                                {isCorrectPick && (
                                  <span className="text-emerald-300 flex items-center gap-0.5 font-bold">
                                    <Check className="w-3 h-3" /> Correct Answer
                                  </span>
                                )}
                                {isStudentPick && !isCorrectPick && (
                                  <span className="text-red-300 flex items-center gap-0.5">
                                    <X className="w-3 h-3" /> Your Choice
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 2. True / False Review */}
                    {type === "true_false" && (
                      <div className="space-y-2 pt-1">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div
                            className={`p-3 rounded-xl border text-center font-bold font-serif ${
                              q.correctBoolean === true
                                ? "bg-emerald-950/60 border-emerald-400 text-emerald-100"
                                : sub?.selectedBoolean === true
                                ? "bg-red-950/60 border-red-400 text-red-100"
                                : "bg-[#08102b] border-white/5 text-blue-200"
                            }`}
                          >
                            True {q.correctBoolean === true && "✓ (Correct Answer)"}
                            {sub?.selectedBoolean === true && q.correctBoolean !== true && " (Your Choice)"}
                          </div>
                          <div
                            className={`p-3 rounded-xl border text-center font-bold font-serif ${
                              q.correctBoolean === false
                                ? "bg-emerald-950/60 border-emerald-400 text-emerald-100"
                                : sub?.selectedBoolean === false
                                ? "bg-red-950/60 border-red-400 text-red-100"
                                : "bg-[#08102b] border-white/5 text-blue-200"
                            }`}
                          >
                            False {q.correctBoolean === false && "✓ (Correct Answer)"}
                            {sub?.selectedBoolean === false && q.correctBoolean !== false && " (Your Choice)"}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. Open Response Review */}
                    {type === "open_response" && (
                      <div className="space-y-2 text-xs pt-1">
                        <div className="p-3 rounded-xl bg-[#08102b] border border-white/5 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-blue-200 tracking-wider block">
                            Your Written Response:
                          </span>
                          <p className="font-serif text-blue-100 italic">
                            "{sub?.writtenResponse || "No response provided"}"
                          </p>
                        </div>
                        {q.sampleAnswer && (
                          <div className="p-3 rounded-xl bg-blue-900/40 border border-white/20 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-white tracking-wider block">
                              Author's Sample Answer / Key Points:
                            </span>
                            <p className="font-serif text-blue-100 leading-relaxed">
                              {q.sampleAnswer}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="p-3 rounded-xl bg-white/10 border border-white/10 text-xs font-serif italic text-blue-100">
                        <span className="font-sans font-bold text-white not-italic">Explanation: </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions in Review */}
            <div className="pt-3 pb-1 flex items-center justify-between gap-2">
              <button
                onClick={handleRetakeQuiz}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#08102b] hover:bg-[#101e46] text-white border border-white/15 font-bold text-xs transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-white" /> Retake Quiz
              </button>
              <button
                onClick={() => {
                  onClose();
                  onBackToLibrary();
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-blue-950 font-bold text-xs transition-all cursor-pointer"
              >
                <span>Done</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

