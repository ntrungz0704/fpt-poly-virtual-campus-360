"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { QuizSubmissionResultDto } from "@fpt-campus/shared";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { submitQuizAnswers } from "@/lib/public/gamification-api";

export interface QuizQuestionItem {
  id: string;
  questionText: string;
  options: string[];
  tourNodeSlug?: string | null;
}

interface CampusQuizStepperProps {
  eventId?: string;
  questions: QuizQuestionItem[];
  attendeeName?: string;
  ticketCode?: string;
  ctaHref?: string;
  ctaLabel?: string;
  onQuizCompleted?: (result: QuizSubmissionResultDto) => void;
  onGoToSpinWheel?: () => void;
}

export function CampusQuizStepper({
  eventId = "4173b76b-8e00-4276-9309-98ac372eb928",
  questions,
  attendeeName = "Khách tham quan",
  ticketCode,
  ctaHref = "/campus",
  ctaLabel = "Khám phá tiếp trong Tour 360°",
  onQuizCompleted,
  onGoToSpinWheel,
}: CampusQuizStepperProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<QuizSubmissionResultDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If questions empty, render fallback
  if (!questions || questions.length === 0) {
    return (
      <div className="ui-card p-6 sm:p-8 text-center space-y-4">
        <span className="material-symbols-outlined text-[36px] text-secondary">
          quiz
        </span>
        <p className="type-body text-secondary">
          Đang nạp bộ câu hỏi trắc nghiệm khuôn viên...
        </p>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const isLastQuestion = currentIdx === questions.length - 1;
  const currentSelected = selectedAnswers[currentIdx] ?? null;

  const handleSelectOption = (optIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIdx]: optIndex,
    }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (currentSelected === null) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const items = questions.map((q, idx) => ({
      questionId: q.id,
      selectedIndex: selectedAnswers[idx] ?? 0,
    }));

    try {
      const result = await submitQuizAnswers({
        eventId,
        attendeeName,
        ticketCode: ticketCode || undefined,
        items,
      });

      setSubmissionResult(result);
      if (onQuizCompleted) {
        onQuizCompleted(result);
      }
    } catch (err: unknown) {
      setErrorMessage(
        (err as Error)?.message || "Không thể nộp bài trắc nghiệm. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedAnswers({});
    setSubmissionResult(null);
    setErrorMessage(null);
  };

  // ---------------------------------------------------------------------------
  // View 1: Quiz Completed (Authoritative Backend Result)
  // ---------------------------------------------------------------------------
  if (submissionResult) {
    const isHighPassing = submissionResult.scorePercent >= 60;

    return (
      <div className="ui-card p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-3">
          <div
            className={cn(
              "w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-md",
              isHighPassing
                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400",
            )}
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[34px]">
              {isHighPassing ? "military_tech" : "assignment_turned_in"}
            </span>
          </div>

          <div className="space-y-1">
            <span className="type-label text-primary">Kết quả Đã Xác Thực Từ Hệ Thống</span>
            <h2 className="type-h1 text-on-surface">
              Đúng {submissionResult.correctCount} / {submissionResult.totalQuestions} câu ({submissionResult.scorePercent}%)
            </h2>
            <p className="type-body text-secondary max-w-lg mx-auto">
              {submissionResult.message}
            </p>
          </div>

          {submissionResult.scoreXp > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-sm">
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              <span>+ {submissionResult.scoreXp} XP đã được cộng vào tài khoản!</span>
            </div>
          )}
        </div>

        {/* Detailed question review with authoritative explanations */}
        <div className="space-y-3 pt-2">
          <h4 className="type-label text-secondary">Chi tiết đáp án & Giải thích:</h4>
          {submissionResult.results.map((r, i) => {
            const qObj = questions.find((q) => q.id === r.questionId);
            return (
              <div
                key={r.questionId}
                className={cn(
                  "p-4 rounded-xl border text-sm space-y-2",
                  r.isCorrect
                    ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                    : "bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-800",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-on-surface">
                    Câu {i + 1}: {qObj?.questionText}
                  </p>
                  <span
                    className={cn(
                      "shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1",
                      r.isCorrect
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
                    )}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {r.isCorrect ? "check" : "close"}
                    </span>
                    {r.isCorrect ? "Đúng" : "Chưa đúng"}
                  </span>
                </div>

                <p className="text-xs text-secondary">
                  <strong>Đáp án đúng:</strong> {qObj?.options[r.correctIndex]}
                </p>
                <p className="text-xs text-secondary/90 italic">
                  💡 {r.explanation}
                </p>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-surface-container">
          <Button variant="outline" size="md" icon="refresh" onClick={handleRestart}>
            Làm lại bài thi
          </Button>

          <div className="flex items-center gap-2">
            {onGoToSpinWheel && (
              <Button
                variant="primary"
                size="md"
                icon="casino"
                onClick={onGoToSpinWheel}
              >
                Quay Thưởng May Mắn
              </Button>
            )}
            <Link
              href={ctaHref}
              className="ui-btn ui-btn-outline min-h-[40px] px-4 py-2 text-xs font-bold flex items-center gap-1"
            >
              <span>{ctaLabel}</span>
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // View 2: Taking the Quiz
  // ---------------------------------------------------------------------------
  return (
    <div className="ui-card p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 border-b border-surface-container pb-4">
        <div>
          <span className="type-label text-primary">
            Câu hỏi {currentIdx + 1} / {questions.length}
          </span>
          <p className="text-xs text-secondary mt-0.5">
            Người tham gia: <strong className="text-on-surface">{attendeeName}</strong>
            {ticketCode && (
              <span className="ml-1 text-primary">({ticketCode})</span>
            )}
          </p>
        </div>
        <div className="flex gap-1.5">
          {questions.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-colors",
                idx === currentIdx
                  ? "bg-primary scale-125"
                  : selectedAnswers[idx] !== undefined
                    ? "bg-primary/40"
                    : "bg-surface-container-high",
              )}
            />
          ))}
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <h2 className="type-h2 text-on-surface">{currentQ.questionText}</h2>

      <div className="space-y-2.5">
        {currentQ.options.map((opt, idx) => {
          const isChosen = currentSelected === idx;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => handleSelectOption(idx)}
              className={cn(
                "w-full min-h-[48px] px-4 py-3 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between gap-3 cursor-pointer",
                isChosen
                  ? "bg-primary/10 border-primary text-primary font-bold shadow-sm"
                  : "bg-surface border-surface-container hover:border-primary/50 hover:bg-surface-container-low text-on-surface",
              )}
            >
              <span>{opt}</span>
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                  isChosen
                    ? "border-primary bg-primary text-white"
                    : "border-surface-container-high",
                )}
              >
                {isChosen && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 pt-4 border-t border-surface-container">
        <Button
          variant="outline"
          size="md"
          icon="arrow_back"
          disabled={currentIdx === 0 || isSubmitting}
          onClick={handlePrev}
        >
          Câu trước
        </Button>

        {isLastQuestion ? (
          <Button
            variant="primary"
            size="md"
            icon="send"
            disabled={currentSelected === null || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Đang tính điểm..." : "Nộp bài & Nhận XP"}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            icon="arrow_forward"
            disabled={currentSelected === null}
            onClick={handleNext}
          >
            Câu tiếp theo
          </Button>
        )}
      </div>
    </div>
  );
}
