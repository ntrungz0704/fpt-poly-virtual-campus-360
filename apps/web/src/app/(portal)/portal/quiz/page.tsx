"use client";

import React, { useEffect, useRef, useState } from "react";
import type {
  PortalAttemptQuestionDto,
  PortalQuizAttemptDto,
  PortalQuizSummaryDto,
} from "@fpt-campus/shared";
import { Badge, Button, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { portalApi } from "@/lib/portal/portal-api";

export default function StudentQuizPage() {
  const [quizzes, setQuizzes] = useState<PortalQuizSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active attempt exam room state (M7.3)
  const [activeAttempt, setActiveAttempt] = useState<PortalQuizAttemptDto | null>(null);
  const [loadingAttempt, setLoadingAttempt] = useState(false);
  const [attemptError, setAttemptError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Server-synchronized countdown timer
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // Auto-save progress state
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Autosave serialization refs (B02 Remediation - Strict FIFO Order)
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const latestSequenceRef = useRef(0);
  const questionLatestSeqRef = useRef<Record<string, number>>({});

  // Fetch active quizzes on mount
  useEffect(() => {
    let active = true;

    async function fetchQuizzes() {
      try {
        setError(null);
        const data = await portalApi.getActiveQuizzes();
        if (!active) return;
        setQuizzes(data);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách bài thi đang mở.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void fetchQuizzes();

    return () => {
      active = false;
    };
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!activeAttempt || activeAttempt.status !== "IN_PROGRESS") {
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setActiveAttempt((cur) => (cur ? { ...cur, status: "EXPIRED", remainingSeconds: 0 } : null));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [activeAttempt]);

  // Start or resume attempt
  const handleStartOrResume = async (quizConfigId: string) => {
    setLoadingAttempt(true);
    setAttemptError(null);
    try {
      const attempt = await portalApi.startOrResumeQuizAttempt(quizConfigId);
      setActiveAttempt(attempt);
      setCurrentQuestionIndex(0);
      setRemainingSeconds(attempt.remainingSeconds);
    } catch (err) {
      setAttemptError(
        err instanceof Error
          ? err.message
          : "Không thể bắt đầu lượt thi từ máy chủ.",
      );
    } finally {
      setLoadingAttempt(false);
    }
  };

  // Exit exam room back to quiz list
  const handleBackToList = () => {
    setActiveAttempt(null);
    setAttemptError(null);
    setSaveStatus("idle");
    setSaveError(null);
    void portalApi.getActiveQuizzes().then(setQuizzes).catch(() => null);
  };

  // Select an option and auto-save directly to PostgreSQL with strict serial ordering (B02)
  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (!activeAttempt || activeAttempt.status !== "IN_PROGRESS" || remainingSeconds <= 0) {
      return;
    }

    const currentAttemptId = activeAttempt.id;

    // 1. Optimistic local update: immediate responsive UI feedback
    setActiveAttempt((prev) => {
      if (!prev) return null;
      const updatedQuestions = prev.questions.map((q) =>
        q.id === questionId ? { ...q, selectedOptionIndex: optionIndex } : q,
      );
      const answeredCount = updatedQuestions.filter((q) => q.selectedOptionIndex !== null).length;
      return {
        ...prev,
        questions: updatedQuestions,
        answeredQuestions: answeredCount,
      };
    });

    // 2. Track request sequence for this question and globally
    const seq = ++latestSequenceRef.current;
    questionLatestSeqRef.current[questionId] = seq;

    setSaveStatus("saving");
    setSaveError(null);

    // 3. Chain onto saveQueueRef to ensure strict FIFO serialization in PostgreSQL
    saveQueueRef.current = saveQueueRef.current
      .then(async () => {
        // If a newer click occurred for this exact question while waiting in queue, skip sending outdated payload
        if (questionLatestSeqRef.current[questionId] > seq) {
          return;
        }

        const res = await portalApi.saveQuizProgress(currentAttemptId, [
          { quizConfigQuestionId: questionId, selectedOptionIndex: optionIndex },
        ]);

        // Only mark "saved" if this was the latest global save request
        if (seq === latestSequenceRef.current) {
          setSaveStatus("saved");
          setLastSavedTime(new Date().toLocaleTimeString("vi-VN"));
        }
        if (res.isExpired) {
          setActiveAttempt((prev) => (prev ? { ...prev, status: "EXPIRED" } : null));
        }
      })
      .catch((err) => {
        if (seq === latestSequenceRef.current) {
          setSaveStatus("error");
          setSaveError(
            err instanceof Error ? err.message : "Lỗi lưu câu trả lời vào máy chủ.",
          );
        }
      });
  };

  // Format seconds to mm:ss
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // 1. Loading active quizzes
  if (loading) {
    return (
      <LoadingState
        label="Đang tải danh sách bài thi trực tuyến..."
        className="max-w-2xl mx-auto py-12"
      />
    );
  }

  // 2. Error loading quizzes
  if (error) {
    return (
      <ErrorState
        title="Lỗi tải danh sách bài thi"
        description={error}
        actionLabel="Thử lại"
        onAction={() => window.location.reload()}
        className="max-w-xl mx-auto py-12"
      />
    );
  }

  // 3. Quiz Exam Room View (M7.3 Attempt Engine)
  if (loadingAttempt) {
    return (
      <LoadingState
        label="Đang kết nối phòng thi và đồng bộ câu hỏi từ PostgreSQL..."
        className="max-w-3xl mx-auto py-12"
      />
    );
  }

  if (attemptError) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 py-8">
        <Button variant="outline" size="sm" onClick={handleBackToList}>
          ← Quay lại danh sách
        </Button>
        <ErrorState
          title="Không thể bắt đầu làm bài"
          description={attemptError}
          actionLabel="Quay lại"
          onAction={handleBackToList}
        />
      </div>
    );
  }

  if (activeAttempt) {
    const questions = activeAttempt.questions;
    const currentQ = questions[currentQuestionIndex] as PortalAttemptQuestionDto | undefined;
    const isExpired = activeAttempt.status === "EXPIRED" || remainingSeconds <= 0;
    const progressPercent = questions.length > 0
      ? Math.round((activeAttempt.answeredQuestions / questions.length) * 100)
      : 0;

    return (
      <div className="max-w-4xl mx-auto space-y-6" data-testid="quiz-exam-room-view">
        {/* Exam Header & Live Timer */}
        <div className="ui-card p-4 sm:p-6 space-y-4 sticky top-16 z-10 bg-surface/95 backdrop-blur-md shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToList}
                  className="text-xs h-8 px-2.5"
                  data-testid="exit-exam-room-btn"
                >
                  ← Thoát phòng thi
                </Button>
                <Badge variant={isExpired ? "error" : "primary"} className="text-xs">
                  {isExpired ? "Hết thời gian" : `Lượt thi: ${activeAttempt.attemptNumber}/${activeAttempt.maxAttempts}`}
                </Badge>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-on-surface line-clamp-1">
                {activeAttempt.quizTitle}
              </h1>
            </div>

            {/* Countdown Clock */}
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-base sm:text-lg shrink-0 ${
                isExpired
                  ? "border-error/40 bg-error/10 text-error"
                  : remainingSeconds < 120
                    ? "border-warning/40 bg-warning/10 text-warning animate-pulse"
                    : "border-primary/30 bg-primary/10 text-primary"
              }`}
              data-testid="exam-countdown-timer"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isExpired ? "timer_off" : "timer"}
              </span>
              <span>{isExpired ? "00:00 (Hết giờ)" : formatTimer(remainingSeconds)}</span>
            </div>
          </div>

          {/* Progress Bar & Auto-save Status */}
          <div className="space-y-2 pt-2 border-t border-outline-variant/30 text-xs">
            <div className="flex items-center justify-between text-secondary">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="material-symbols-outlined text-[16px] text-primary">
                  fact_check
                </span>
                <span>
                  Đã trả lời: <strong>{activeAttempt.answeredQuestions}</strong> / {questions.length} câu ({progressPercent}%)
                </span>
              </span>

              {/* Real-time Save Indicator */}
              <div className="flex items-center gap-1 text-[11px]" data-testid="auto-save-indicator">
                {saveStatus === "saving" && (
                  <span className="text-secondary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] animate-spin">
                      sync
                    </span>
                    <span>Đang lưu vào PostgreSQL...</span>
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span className="text-success flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      check_circle
                    </span>
                    <span>Đã lưu lúc {lastSavedTime}</span>
                  </span>
                )}
                {saveStatus === "error" && (
                  <span className="text-error flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      error
                    </span>
                    <span>{saveError ?? "Lỗi lưu kết nối"}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Expiry Warning Banner */}
        {isExpired && (
          <div
            className="p-4 rounded-xl bg-error/10 border border-error/30 text-error flex items-center gap-3"
            data-testid="exam-expired-alert"
          >
            <span className="material-symbols-outlined text-[24px]">alarm_off</span>
            <div>
              <p className="font-bold text-sm">Thời gian làm bài thi đã kết thúc!</p>
              <p className="text-xs text-error/80">
                Toàn bộ câu trả lời của bạn đã được chốt và bảo vệ an toàn trên cơ sở dữ liệu.
              </p>
            </div>
          </div>
        )}

        {/* Current Question View */}
        {currentQ ? (
          <div className="ui-card p-6 space-y-6" data-testid="active-question-card">
            {/* Question Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold">
                  {currentQ.displayedOrder}
                </span>
                <span className="text-sm font-semibold text-secondary">
                  Câu hỏi số {currentQ.displayedOrder}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs px-2.5 py-1 rounded-md bg-surface-container font-medium text-secondary">
                  {currentQ.topic}
                </span>
                <span
                  className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                    currentQ.difficulty === "HARD"
                      ? "bg-error/10 text-error"
                      : currentQ.difficulty === "EASY"
                        ? "bg-success/10 text-success"
                        : "bg-warning/10 text-warning"
                  }`}
                >
                  {currentQ.difficulty}
                </span>
              </div>
            </div>

            {/* Question Text */}
            <p className="text-base sm:text-lg font-medium text-on-surface leading-relaxed">
              {currentQ.questionText}
            </p>

            {/* Shuffled Options */}
            <div className="space-y-3 pt-2">
              {currentQ.options.map((option, optIdx) => {
                const isSelected = currentQ.selectedOptionIndex === optIdx;
                const optionLetters = ["A", "B", "C", "D", "E", "F"];
                const letter = optionLetters[optIdx] || `${optIdx + 1}`;

                return (
                  <button
                    key={optIdx}
                    type="button"
                    disabled={isExpired}
                    onClick={() => handleSelectOption(currentQ.id, optIdx)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3.5 ${
                      isExpired ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                    } ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary shadow-xs font-medium"
                        : "border-outline-variant/50 hover:border-outline-variant hover:bg-surface-container-low text-on-surface"
                    }`}
                    data-testid={`option-button-${optIdx}`}
                  >
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                        isSelected
                          ? "bg-primary text-white"
                          : "bg-surface-container text-secondary"
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="text-sm sm:text-base leading-normal flex-1">
                      {option}
                    </span>
                    {isSelected && (
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        check_circle
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Question Navigation Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-outline-variant/30">
              <Button
                variant="outline"
                size="sm"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
                className="flex items-center gap-1"
                data-testid="prev-question-btn"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                <span>Câu trước</span>
              </Button>

              <span className="text-xs text-secondary font-medium">
                Câu {currentQuestionIndex + 1} / {questions.length}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={currentQuestionIndex >= questions.length - 1}
                onClick={() => setCurrentQuestionIndex((i) => Math.min(questions.length - 1, i + 1))}
                className="flex items-center gap-1"
                data-testid="next-question-btn"
              >
                <span>Câu tiếp theo</span>
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </Button>
            </div>
          </div>
        ) : null}

        {/* Question Palette (Quick Jump Grid) */}
        <div className="ui-card p-5 space-y-3" data-testid="question-palette-card">
          <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">
              grid_view
            </span>
            <span>Bảng chuyển câu hỏi nhanh</span>
          </h3>

          <div className="flex flex-wrap gap-2">
            {questions.map((q, idx) => {
              const isAnswered = q.selectedOptionIndex !== null;
              const isCurrent = idx === currentQuestionIndex;

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-9 h-9 rounded-lg font-bold text-xs flex items-center justify-center border transition-all cursor-pointer ${
                    isCurrent
                      ? "ring-2 ring-primary ring-offset-2 border-primary"
                      : ""
                  } ${
                    isAnswered
                      ? "bg-primary text-white border-primary"
                      : "bg-surface-container text-secondary border-outline-variant/40 hover:border-outline-variant"
                  }`}
                  data-testid={`jump-question-btn-${idx + 1}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 4. Default View: Active Quizzes List
  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="student-quiz-portal">
      {/* Header */}
      <div className="ui-card p-6 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[28px]">
                quiz
              </span>
              <span>Bài thi trắc nghiệm trực tuyến</span>
            </h1>
            <p className="text-sm text-secondary">
              Danh sách bài thi, khảo sát và kiểm tra kiến thức đã phát hành dành riêng cho sinh viên
            </p>
          </div>
          <Badge variant="primary" className="self-start sm:self-auto text-xs">
            {quizzes.length} bài thi đang mở
          </Badge>
        </div>
      </div>

      {/* Quizzes List */}
      {quizzes.length === 0 ? (
        <EmptyState
          title="Chưa có bài thi nào đang mở"
          description="Hiện tại chưa có bài thi nào được phát hành cho tài khoản của bạn. Vui lòng quay lại sau."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="ui-card p-5 flex flex-col justify-between gap-4 hover:border-primary/50 transition-all hover:shadow-sm"
              data-testid={`quiz-card-${quiz.id}`}
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-base text-on-surface line-clamp-2">
                    {quiz.title}
                  </h3>
                  <Badge variant="success" className="text-[11px] shrink-0">
                    Đang mở
                  </Badge>
                </div>

                {quiz.description && (
                  <p className="text-xs text-secondary line-clamp-2">
                    {quiz.description}
                  </p>
                )}

                {quiz.eventName && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-primary font-medium">
                    <span className="material-symbols-outlined text-[14px]">event</span>
                    <span className="truncate">{quiz.eventName}</span>
                  </span>
                )}
              </div>

              <div className="space-y-3 pt-3 border-t border-outline-variant/30">
                <div className="flex items-center justify-between text-xs text-secondary">
                  <span>
                    <strong>{quiz.totalQuestions}</strong> câu hỏi
                  </span>
                  <span>
                    <strong>{quiz.timeLimitMinutes}</strong> phút
                  </span>
                  <span>
                    Lượt thi tối đa: <strong>{quiz.maxAttempts}</strong>
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleStartOrResume(quiz.id)}
                  className="w-full justify-center flex items-center gap-2"
                  data-testid={`start-quiz-btn-${quiz.id}`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    play_circle
                  </span>
                  <span>Vào làm bài thi</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
