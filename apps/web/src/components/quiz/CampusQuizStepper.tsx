"use client";

import React, { useState } from "react";
import Link from "next/link";
import { OpenDayQuizQuestion } from "@/data/campus-data";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface CampusQuizStepperProps {
  questions: OpenDayQuizQuestion[];
  ctaHref?: string;
  ctaLabel?: string;
}

export function CampusQuizStepper({
  questions,
  ctaHref = "/campus",
  ctaLabel = "Khám phá tiếp trong Tour 360°",
}: CampusQuizStepperProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const currentQ = questions[currentIdx];

  if (!currentQ) {
    return null;
  }

  const handleSelectOption = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    if (idx === currentQ.correctIndex) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setCorrectCount(0);
    setQuizFinished(false);
  };

  if (quizFinished) {
    return (
      <div className="ui-card p-6 sm:p-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-primary-fixed text-primary mx-auto flex items-center justify-center">
          <span aria-hidden="true" className="material-symbols-outlined text-[32px]">
            task_alt
          </span>
        </div>

        <div className="space-y-1.5">
          <p className="type-label text-primary">Hoàn thành câu hỏi QTSC</p>
          <h2 className="type-h1 text-on-surface">
            Đúng {correctCount} / {questions.length} câu hỏi
          </h2>
          <p className="type-body-sm text-secondary max-w-md mx-auto">
            Bạn đã nắm được các khu vực chính tại Tòa Innovation, Tòa T và Tòa F trong khuôn viên CVPM Quang Trung.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button variant="outline" size="md" icon="refresh" onClick={handleRestart}>
            Làm lại bộ câu hỏi
          </Button>
          <Link href={ctaHref} className="ui-btn ui-btn-primary min-h-[44px] px-5 py-2 text-sm font-bold">
            <span>{ctaLabel}</span>
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
              arrow_forward
            </span>
          </Link>
        </div>
      </div>
    );
  }

  const hasAnswered = selectedOption !== null;
  const isCorrectAnswer = selectedOption === currentQ.correctIndex;

  return (
    <div className="ui-card p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 border-b border-surface-container-low pb-4">
        <span className="type-label text-primary">
          Câu hỏi {currentIdx + 1} / {questions.length}
        </span>
        <span className="text-xs font-semibold text-secondary">
          Đúng: {correctCount} câu
        </span>
      </div>

      <h2 className="type-h2 text-on-surface">{currentQ.question}</h2>

      <div className="space-y-2.5">
        {currentQ.options.map((opt, idx) => {
          const isChosen = selectedOption === idx;
          const isRight = idx === currentQ.correctIndex;
          return (
            <button
              key={opt}
              type="button"
              disabled={hasAnswered}
              onClick={() => handleSelectOption(idx)}
              className={cn(
                "w-full min-h-[48px] px-4 py-3 rounded-xl border text-left text-sm font-medium transition-colors flex items-center justify-between gap-3 cursor-pointer disabled:cursor-default",
                !hasAnswered && "bg-surface border-outline-variant hover:border-primary hover:bg-primary-fixed/30",
                hasAnswered && isRight && "bg-success-container border-success text-on-success-container font-semibold",
                hasAnswered && isChosen && !isRight && "bg-error-container border-error text-on-error-container font-semibold",
                hasAnswered && !isChosen && !isRight && "bg-surface-container-low border-surface-container text-secondary opacity-70"
              )}
            >
              <span>{opt}</span>
              {hasAnswered && isRight && (
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                  check_circle
                </span>
              )}
              {hasAnswered && isChosen && !isRight && (
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                  cancel
                </span>
              )}
            </button>
          );
        })}
      </div>

      {hasAnswered && (
        <div className="rounded-xl bg-surface-container-low border border-surface-container p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
            <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-primary">
              info
            </span>
            <span>{isCorrectAnswer ? "Chính xác!" : "Ghi chú đáp án đúng:"}</span>
          </div>
          <p className="type-body-sm text-secondary">{currentQ.explanation}</p>
          <div className="pt-1 flex justify-end">
            <Button variant="primary" size="md" onClick={handleNext} icon="arrow_forward">
              {currentIdx < questions.length - 1 ? "Câu tiếp theo" : "Xem tổng kết"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
