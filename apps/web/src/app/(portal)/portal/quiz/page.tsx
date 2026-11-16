"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type {
  PortalAttemptQuestionDto,
  PortalQuizAttemptDto,
  PortalQuizSummaryDto,
  QuizAttemptStatus,
  StudentQuizHistoryDetailDto,
  StudentQuizHistoryItemDto,
  SubmitQuizAttemptResponseDto,
} from "@fpt-campus/shared";
import { Badge, Button, EmptyState, ErrorState, LoadingState, Modal } from "@/components/ui";
import { portalApi } from "@/lib/portal/portal-api";

export default function StudentQuizPage() {
  const [quizzes, setQuizzes] = useState<PortalQuizSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab navigation (M7.5)
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  // History state (M7.5)
  const [historyItems, setHistoryItems] = useState<StudentQuizHistoryItemDto[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit] = useState(10);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>("ALL");
  const [historyPassedFilter, setHistoryPassedFilter] = useState<string>("ALL");
  const [historyQuizFilter, setHistoryQuizFilter] = useState<string>("ALL");

  // Detail Review state (M7.5)
  const [selectedHistoryDetail, setSelectedHistoryDetail] = useState<StudentQuizHistoryDetailDto | null>(null);
  const [loadingHistoryDetail, setLoadingHistoryDetail] = useState(false);
  const [historyDetailError, setHistoryDetailError] = useState<string | null>(null);

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
  const lastSaveErrorRef = useRef<Error | null>(null);
  const isSubmittingRef = useRef(false);

  // Submission & Scoring state (M7.4)
  const [submissionResult, setSubmissionResult] = useState<SubmitQuizAttemptResponseDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  // Fetch student quiz history (M7.5)
  const fetchHistory = useCallback(
    async (pageToLoad = 1) => {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const res = await portalApi.getStudentQuizHistory({
          page: pageToLoad,
          limit: historyLimit,
          quizConfigId: historyQuizFilter !== "ALL" ? historyQuizFilter : undefined,
          status:
            historyStatusFilter !== "ALL"
              ? (historyStatusFilter as QuizAttemptStatus)
              : undefined,
          passed:
            historyPassedFilter === "PASSED"
              ? true
              : historyPassedFilter === "FAILED"
                ? false
                : undefined,
        });
        setHistoryItems(res.items);
        setHistoryTotal(res.total);
        setHistoryPage(res.page);
        setHistoryTotalPages(res.totalPages);
      } catch (err) {
        setHistoryError(
          err instanceof Error
            ? err.message
            : "Không thể tải lịch sử làm bài thi.",
        );
      } finally {
        setHistoryLoading(false);
      }
    },
    [historyLimit, historyQuizFilter, historyStatusFilter, historyPassedFilter],
  );

  useEffect(() => {
    if (activeTab !== "history") return;
    let active = true;
    portalApi
      .getStudentQuizHistory({
        page: historyPage,
        limit: historyLimit,
        quizConfigId: historyQuizFilter !== "ALL" ? historyQuizFilter : undefined,
        status:
          historyStatusFilter !== "ALL"
            ? (historyStatusFilter as QuizAttemptStatus)
            : undefined,
        passed:
          historyPassedFilter === "PASSED"
            ? true
            : historyPassedFilter === "FAILED"
              ? false
              : undefined,
      })
      .then((res) => {
        if (!active) return;
        setHistoryItems(res.items);
        setHistoryTotal(res.total);
        setHistoryTotalPages(res.totalPages);
        setHistoryLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setHistoryError(
          err instanceof Error
            ? err.message
            : "Không thể tải lịch sử làm bài thi.",
        );
        setHistoryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeTab, historyPage, historyLimit, historyQuizFilter, historyStatusFilter, historyPassedFilter]);

  // View history detail modal (M7.5)
  const handleViewHistoryDetail = async (attemptId: string) => {
    setSelectedHistoryDetail(null);
    setLoadingHistoryDetail(true);
    setHistoryDetailError(null);
    try {
      const detail = await portalApi.getStudentQuizHistoryDetail(attemptId);
      setSelectedHistoryDetail(detail);
    } catch (err) {
      setHistoryDetailError(
        err instanceof Error
          ? err.message
          : "Không thể tải chi tiết kết quả lượt thi.",
      );
    } finally {
      setLoadingHistoryDetail(false);
    }
  };

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
      if (attempt.status === "SUBMITTED") {
        try {
          const res = await portalApi.submitQuizAttempt(attempt.id);
          setSubmissionResult(res);
        } catch {
          // ignore
        }
      } else {
        setSubmissionResult(null);
      }
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
    isSubmittingRef.current = false;
    setActiveAttempt(null);
    setSubmissionResult(null);
    setAttemptError(null);
    setSubmitError(null);
    setShowConfirmModal(false);
    setSaveStatus("idle");
    setSaveError(null);
    void portalApi.getActiveQuizzes().then(setQuizzes).catch(() => null);
  };

  // Submit attempt for grading & XP award (M7.4)
  const handleSubmitQuiz = async () => {
    if (!activeAttempt || submitting || isSubmittingRef.current) return;
    // B02: Khóa ngay lập tức mọi thao tác chọn đáp án và enqueue mới ở cấp độ ref đồng bộ lẫn state
    isSubmittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      // 1. Flush autosave queue: chờ toàn bộ các request lưu đáp án trước thời điểm này hoàn tất (B02)
      await saveQueueRef.current;

      // 2. Kiểm tra nếu autosave gần nhất bị lỗi: không được nuốt lỗi mà phải hủy submit
      if (lastSaveErrorRef.current) {
        throw new Error(
          `Không thể nộp bài vì lưu câu trả lời chưa thành công: ${lastSaveErrorRef.current.message}. Vui lòng thử lại.`,
        );
      }

      // 3. Toàn bộ đáp án đã được đồng bộ an toàn lên PostgreSQL -> Gửi submit
      const res = await portalApi.submitQuizAttempt(activeAttempt.id);
      setSubmissionResult(res);
      setActiveAttempt((prev) => (prev ? { ...prev, status: "SUBMITTED" } : null));
      setShowConfirmModal(false);
    } catch (err) {
      // B02: Mở khóa nếu submit thất bại để sinh viên có thể tiếp tục làm bài hoặc thử lại
      isSubmittingRef.current = false;
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra khi nộp bài thi. Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
      // Nếu đã submit thành công thì không reset ref để giữ trạng thái chốt bài
    }
  };

  // Select an option and auto-save directly to PostgreSQL with strict serial ordering (B02)
  const handleSelectOption = (questionId: string, optionIndex: number) => {
    // B02: Chặn ngay lập tức cả đồng bộ ref lẫn state nếu đang submit hoặc đã kết thúc
    if (
      !activeAttempt ||
      activeAttempt.status !== "IN_PROGRESS" ||
      remainingSeconds <= 0 ||
      submitting ||
      isSubmittingRef.current
    ) {
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
          lastSaveErrorRef.current = null;
        }
        if (res.isExpired) {
          setActiveAttempt((prev) => (prev ? { ...prev, status: "EXPIRED" } : null));
        }
      })
      .catch((err) => {
        const errObj = err instanceof Error ? err : new Error(String(err));
        lastSaveErrorRef.current = errObj;
        if (seq === latestSequenceRef.current) {
          setSaveStatus("error");
          setSaveError(
            errObj.message || "Lỗi lưu câu trả lời vào máy chủ.",
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

  // 3. Quiz Result View (M7.4 Submission & Scoring Engine)
  if (submissionResult) {
    const summary = submissionResult.summary;
    const xp = submissionResult.xp;
    const isPassed = summary.passed;

    return (
      <div className="max-w-4xl mx-auto space-y-6" data-testid="quiz-result-view">
        {/* Result Header & Score Banner */}
        <div className="ui-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
            <div className="space-y-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToList}
                className="text-xs h-8 px-2.5 mb-2"
                data-testid="result-back-btn"
              >
                ← Quay lại danh sách bài thi
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
                Kết quả bài thi trắc nghiệm
              </h1>
              <p className="text-xs text-secondary">
                Thời gian nộp bài: {new Date(submissionResult.submittedAt).toLocaleString("vi-VN")}
              </p>
            </div>
            <Badge
              variant={isPassed ? "success" : "error"}
              className="text-sm px-3.5 py-1.5 self-start sm:self-auto font-bold flex items-center gap-1.5"
              data-testid="result-pass-badge"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isPassed ? "check_circle" : "cancel"}
              </span>
              <span>{isPassed ? "KẾT QUẢ: ĐẠT (PASS)" : "KẾT QUẢ: CHƯA ĐẠT (FAIL)"}</span>
            </Badge>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-surface-container/60 border border-outline-variant/30 text-center space-y-1">
              <span className="text-xs text-secondary font-medium">Điểm số</span>
              <p
                className={`text-2xl sm:text-3xl font-extrabold ${
                  isPassed ? "text-success" : "text-error"
                }`}
                data-testid="result-score-percent"
              >
                {summary.scorePercent}%
              </p>
              <span className="text-[11px] text-secondary">
                Chuẩn đạt: ≥{summary.passingScore}%
              </span>
            </div>

            <div className="p-4 rounded-xl bg-surface-container/60 border border-outline-variant/30 text-center space-y-1">
              <span className="text-xs text-secondary font-medium">Số câu đúng</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-primary" data-testid="result-correct-count">
                {summary.correctCount} / {summary.totalQuestions}
              </p>
              <span className="text-[11px] text-secondary">
                Đã trả lời: {summary.answeredCount} câu
              </span>
            </div>

            <div className="p-4 rounded-xl bg-surface-container/60 border border-outline-variant/30 text-center space-y-1">
              <span className="text-xs text-secondary font-medium">XP nhận được</span>
              <p
                className={`text-2xl sm:text-3xl font-extrabold ${
                  xp.isXpAwarded ? "text-warning" : "text-secondary"
                }`}
                data-testid="result-awarded-xp"
              >
                +{xp.awardedXp} XP
              </p>
              <span className="text-[11px] text-secondary">
                {xp.isXpAwarded ? "Cộng vào ví tích lũy" : "Đã nhận ở lần thi trước"}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-surface-container/60 border border-outline-variant/30 text-center space-y-1">
              <span className="text-xs text-secondary font-medium">Trạng thái</span>
              <p className="text-xl sm:text-2xl font-bold text-on-surface pt-1">
                {isPassed ? "Hoàn thành" : "Cần cải thiện"}
              </p>
              <span className="text-[11px] text-secondary">
                Lượt thi đã chốt
              </span>
            </div>
          </div>

          {/* XP Breakdown Card */}
          {xp.isXpAwarded ? (
            <div
              className="p-4 rounded-xl bg-gradient-to-r from-warning/10 via-primary/10 to-surface-container border border-warning/30 flex items-center gap-3.5"
              data-testid="result-xp-card"
            >
              <div className="w-10 h-10 rounded-full bg-warning/20 text-warning flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">stars</span>
              </div>
              <div className="space-y-0.5 text-xs">
                <p className="font-bold text-sm text-on-surface">
                  Chúc mừng! Bạn đã nhận được +{xp.awardedXp} XP
                </p>
                <p className="text-secondary">
                  XP cơ bản: <strong>+{xp.baseXp} XP</strong> ({summary.correctCount} câu đúng × 10)
                  {xp.bonusXp > 0 && (
                    <span>
                      {" "}+ Thưởng đạt bài thi: <strong>+{xp.bonusXp} XP</strong>
                    </span>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div
              className="p-4 rounded-xl bg-surface-container/50 border border-outline-variant/30 flex items-center gap-3 text-xs text-secondary"
              data-testid="result-no-xp-card"
            >
              <span className="material-symbols-outlined text-[20px] text-secondary">info</span>
              <span>
                Bài thi này đã hoàn tất chấm điểm. Theo chính sách, mỗi sinh viên nhận thưởng XP một lần duy nhất cho mỗi bài thi.
              </span>
            </div>
          )}
        </div>

        {/* Detailed Questions Review */}
        <div className="ui-card p-6 space-y-5" data-testid="result-questions-review">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
            <h2 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">
                checklist
              </span>
              <span>Chi tiết đáp án & Giải thích</span>
            </h2>
            <span className="text-xs text-secondary font-medium">
              {submissionResult.results.length} câu hỏi
            </span>
          </div>

          <div className="space-y-4">
            {submissionResult.results.map((res, idx) => {
              const matchingQ = activeAttempt?.questions.find((q) => q.id === res.questionId);
              const questionText = matchingQ?.questionText || `Câu hỏi số ${idx + 1}`;
              const options = matchingQ?.options || [];

              return (
                <div
                  key={res.questionId}
                  className={`p-4 rounded-xl border space-y-3 transition-colors ${
                    res.isCorrect
                      ? "border-success/30 bg-success/5"
                      : "border-error/30 bg-error/5"
                  }`}
                  data-testid={`result-question-item-${idx + 1}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          res.isCorrect
                            ? "bg-success/20 text-success"
                            : "bg-error/20 text-error"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-secondary">
                        Câu {idx + 1}
                      </span>
                    </div>
                    <Badge variant={res.isCorrect ? "success" : "error"} className="text-[11px]">
                      {res.isCorrect ? "Chính xác" : "Chưa chính xác"}
                    </Badge>
                  </div>

                  <p className="text-sm font-medium text-on-surface leading-relaxed">
                    {questionText}
                  </p>

                  {/* Options list if available */}
                  {options.length > 0 && (
                    <div className="space-y-1.5 pt-1 text-xs">
                      {options.map((opt, optIdx) => {
                        const isStudentChoice = res.selectedOptionIndex === optIdx;
                        const isCorrectAnswer = res.correctOptionIndex === optIdx;
                        const letters = ["A", "B", "C", "D", "E", "F"];
                        const letter = letters[optIdx] || `${optIdx + 1}`;

                        return (
                          <div
                            key={optIdx}
                            className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                              isCorrectAnswer
                                ? "border-success/50 bg-success/10 text-success font-medium"
                                : isStudentChoice
                                  ? "border-error/50 bg-error/10 text-error font-medium"
                                  : "border-outline-variant/30 text-secondary bg-surface-container/30"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded flex items-center justify-center bg-surface font-bold text-[10px]">
                                {letter}
                              </span>
                              <span>{opt}</span>
                            </span>
                            {isCorrectAnswer && (
                              <span className="text-[10px] uppercase font-bold text-success flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">check</span>
                                Đáp án đúng
                              </span>
                            )}
                            {isStudentChoice && !isCorrectAnswer && (
                              <span className="text-[10px] uppercase font-bold text-error flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">close</span>
                                Lựa chọn của bạn
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Explanation if available */}
                  {res.explanation && (
                    <div className="p-3 rounded-lg bg-surface-container/80 border border-outline-variant/30 text-xs space-y-1 text-secondary">
                      <strong className="text-on-surface flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-primary">
                          lightbulb
                        </span>
                        Giải thích chi tiết:
                      </strong>
                      <p>{res.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-outline-variant/30 flex justify-end">
            <Button variant="primary" onClick={handleBackToList} data-testid="result-finish-btn">
              Hoàn tất & Quay lại
            </Button>
          </div>
        </div>
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
                {!isExpired && (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={submitting}
                    onClick={() => setShowConfirmModal(true)}
                    className="text-xs h-8 px-3 flex items-center gap-1.5"
                    data-testid="header-submit-quiz-btn"
                  >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    <span>Nộp bài thi</span>
                  </Button>
                )}
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
                const isOptionDisabled = isExpired || submitting;

                return (
                  <button
                    key={optIdx}
                    type="button"
                    disabled={isOptionDisabled}
                    onClick={() => handleSelectOption(currentQ.id, optIdx)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3.5 ${
                      isOptionDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
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

          {/* Submit Action in Palette */}
          {!isExpired && (
            <div className="pt-3 border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-secondary">
                Đã trả lời: <strong>{activeAttempt.answeredQuestions}</strong> / {questions.length} câu
              </span>
              <Button
                variant="primary"
                size="sm"
                disabled={submitting}
                onClick={() => setShowConfirmModal(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4"
                data-testid="palette-submit-quiz-btn"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Nộp bài thi ngay</span>
              </Button>
            </div>
          )}
        </div>

        {/* Submit Confirmation Modal (M7.4) */}
        {showConfirmModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
            data-testid="submit-confirm-modal"
          >
            <div className="ui-card p-6 max-w-md w-full space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2.5 text-on-surface">
                <span className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </span>
                <h3 className="text-lg font-bold">Xác nhận nộp bài thi</h3>
              </div>

              <div className="space-y-2 text-sm text-secondary">
                <p>
                  Bạn đã trả lời <strong>{activeAttempt.answeredQuestions}</strong> / {questions.length} câu hỏi.
                </p>
                {activeAttempt.answeredQuestions < questions.length && (
                  <p className="p-2.5 rounded-lg bg-warning/10 border border-warning/30 text-warning text-xs font-medium">
                    ⚠️ Chú ý: Bạn còn {questions.length - activeAttempt.answeredQuestions} câu chưa chọn đáp án. Các câu bỏ trống sẽ tính là 0 điểm.
                  </p>
                )}
                <p className="text-xs">
                  Sau khi nộp, hệ thống sẽ chốt bài làm, tính điểm trên máy chủ và cập nhật điểm thưởng XP tích lũy.
                </p>
              </div>

              {submitError && (
                <div
                  className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-xs"
                  data-testid="submit-error-banner"
                >
                  {submitError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/30">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={submitting}
                  onClick={() => setShowConfirmModal(false)}
                >
                  Xem lại bài làm
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={submitting}
                  onClick={handleSubmitQuiz}
                  className="flex items-center gap-1.5"
                  data-testid="confirm-submit-btn"
                >
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">
                        sync
                      </span>
                      <span>Đang nộp bài...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">check</span>
                      <span>Xác nhận nộp bài</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 4. Default View: Active Quizzes List & Student Quiz History (M7.5)
  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="student-quiz-portal">
      {/* Header */}
      <div className="ui-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[28px]">
                quiz
              </span>
              <span>Bài thi trắc nghiệm trực tuyến</span>
            </h1>
            <p className="text-sm text-secondary">
              Làm bài thi trắc nghiệm, theo dõi lịch sử kết quả và tích lũy điểm thưởng XP
            </p>
          </div>
        </div>

        {/* Tab Navigation (M7.5) */}
        <div className="flex border-b border-outline-variant/30 gap-2 pt-1" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "active"}
            onClick={() => setActiveTab("active")}
            className={`pb-2.5 px-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "active"
                ? "border-primary text-primary"
                : "border-transparent text-secondary hover:text-on-surface"
            }`}
            data-testid="tab-active-quizzes"
          >
            <span className="material-symbols-outlined text-[18px]">play_circle</span>
            <span>Bài thi đang mở</span>
            <Badge variant="primary" className="text-[10px]">
              {quizzes.length}
            </Badge>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "history"}
            onClick={() => {
              setActiveTab("history");
              void fetchHistory(1);
            }}
            className={`pb-2.5 px-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "history"
                ? "border-primary text-primary"
                : "border-transparent text-secondary hover:text-on-surface"
            }`}
            data-testid="tab-quiz-history"
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
            <span>Lịch sử làm bài</span>
            {historyTotal > 0 && (
              <Badge variant="neutral" className="text-[10px]">
                {historyTotal}
              </Badge>
            )}
          </button>
        </div>
      </div>

      {/* Tab 1: Active Quizzes List */}
      {activeTab === "active" && (
        <>
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
                        Lượt tối đa: <strong>{quiz.maxAttempts}</strong>
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
        </>
      )}

      {/* Tab 2: Quiz History List (M7.5-A) */}
      {activeTab === "history" && (
        <div className="space-y-4" data-testid="student-quiz-history-panel">
          {/* Filters Bar */}
          <div className="ui-card p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-secondary">Bộ lọc:</span>
              <select
                aria-label="Lọc theo bài thi"
                value={historyQuizFilter}
                onChange={(e) => {
                  setHistoryQuizFilter(e.target.value);
                  setHistoryPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-outline-variant/50 bg-surface text-on-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                data-testid="history-filter-quiz"
              >
                <option value="ALL">Tất cả bài thi</option>
                {quizzes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>

              <select
                aria-label="Lọc theo trạng thái"
                value={historyStatusFilter}
                onChange={(e) => {
                  setHistoryStatusFilter(e.target.value);
                  setHistoryPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-outline-variant/50 bg-surface text-on-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                data-testid="history-filter-status"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="SUBMITTED">Đã hoàn thành</option>
                <option value="IN_PROGRESS">Đang làm bài</option>
                <option value="EXPIRED">Quá hạn</option>
              </select>

              <select
                aria-label="Lọc theo kết quả đạt hoặc chưa đạt"
                value={historyPassedFilter}
                onChange={(e) => {
                  setHistoryPassedFilter(e.target.value);
                  setHistoryPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-outline-variant/50 bg-surface text-on-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                data-testid="history-filter-passed"
              >
                <option value="ALL">Tất cả kết quả</option>
                <option value="PASSED">Đạt yêu cầu (PASS)</option>
                <option value="FAILED">Chưa đạt (FAIL)</option>
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchHistory(historyPage)}
              disabled={historyLoading}
              className="flex items-center gap-1.5"
            >
              <span className={`material-symbols-outlined text-[16px] ${historyLoading ? "animate-spin" : ""}`}>
                refresh
              </span>
              <span>Làm mới</span>
            </Button>
          </div>

          {/* History Content */}
          {historyLoading ? (
            <div className="p-8 flex justify-center">
              <LoadingState label="Đang tải lịch sử bài thi..." />
            </div>
          ) : historyError ? (
            <ErrorState
              title="Không thể tải lịch sử làm bài"
              description={historyError}
              actionLabel="Thử lại"
              onAction={() => void fetchHistory(historyPage)}
            />
          ) : historyItems.length === 0 ? (
            <EmptyState
              title="Chưa có lượt thi nào"
              description="Bạn chưa thực hiện lượt làm bài nào phù hợp với bộ lọc hiện tại."
            />
          ) : (
            <div className="space-y-3">
              {historyItems.map((item) => {
                const isSubmitted = item.status === "SUBMITTED";
                const isPassed = item.passed === true;

                return (
                  <div
                    key={item.id}
                    className="ui-card p-4 hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    data-testid={`history-item-${item.id}`}
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-sm sm:text-base text-on-surface truncate">
                          {item.quizTitle}
                        </h3>

                        {item.isRetake ? (
                          <Badge variant="warning" className="text-[10px]">
                            Thi lại (Lượt {item.attemptNumber}/{item.maxAttempts})
                          </Badge>
                        ) : (
                          <Badge variant="primary" className="text-[10px]">
                            Lượt 1/{item.maxAttempts}
                          </Badge>
                        )}

                        {item.status === "SUBMITTED" ? (
                          <Badge variant="success" className="text-[10px]">
                            Đã hoàn thành
                          </Badge>
                        ) : item.status === "IN_PROGRESS" ? (
                          <Badge variant="warning" className="text-[10px]">
                            Đang làm dở
                          </Badge>
                        ) : (
                          <Badge variant="neutral" className="text-[10px]">
                            Quá hạn
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-secondary">
                        <span>
                          Bắt đầu: {new Date(item.startedAt).toLocaleString("vi-VN")}
                        </span>
                        {item.submittedAt && (
                          <span>
                            Nộp bài: {new Date(item.submittedAt).toLocaleString("vi-VN")}
                          </span>
                        )}
                        <span>
                          Số câu: {item.answeredCount}/{item.totalQuestions}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-outline-variant/30">
                      {isSubmitted ? (
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-base font-mono font-bold text-on-surface">
                              {item.scorePercent}%
                            </span>
                            {isPassed ? (
                              <Badge variant="success" className="text-[10px] font-bold">
                                ĐẠT
                              </Badge>
                            ) : (
                              <Badge variant="error" className="text-[10px] font-bold">
                                CHƯA ĐẠT
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-secondary">
                            {item.correctCount}/{item.totalQuestions} câu đúng (Sàn: {item.passingScore}%)
                          </div>
                        </div>
                      ) : (
                        <div className="text-right text-xs text-secondary">
                          <span>Chưa có điểm</span>
                        </div>
                      )}

                      <div className="text-right">
                        {item.awardedXp !== null && item.awardedXp > 0 ? (
                          <Badge variant="warning" className="text-xs font-bold font-mono">
                            +{item.awardedXp} XP
                          </Badge>
                        ) : item.isRetake ? (
                          <span className="text-[11px] text-secondary block" title="Lượt thi lại không cấp thêm XP">
                            0 XP (Thi lại)
                          </span>
                        ) : item.status === "SUBMITTED" ? (
                          <span className="text-[11px] text-secondary block" title="Lần đầu nộp bài nhưng đạt 0 điểm">
                            0 XP
                          </span>
                        ) : (
                          <span className="text-[11px] text-secondary block">--</span>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewHistoryDetail(item.id)}
                        className="flex items-center gap-1"
                        data-testid={`view-detail-btn-${item.id}`}
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        <span className="hidden sm:inline">Chi tiết</span>
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {historyTotalPages > 1 && (
                <div className="flex items-center justify-between pt-2 px-1 text-xs text-secondary">
                  <span>
                    Trang {historyPage} / {historyTotalPages} (Tổng cộng {historyTotal} lượt thi)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={historyPage <= 1 || historyLoading}
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    >
                      Trang trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={historyPage >= historyTotalPages || historyLoading}
                      onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                    >
                      Trang sau
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* History Detail Review Modal (M7.5-B) */}
      <Modal
        open={Boolean(selectedHistoryDetail || loadingHistoryDetail || historyDetailError)}
        onClose={() => {
          setSelectedHistoryDetail(null);
          setLoadingHistoryDetail(false);
          setHistoryDetailError(null);
        }}
        title="Chi tiết bài làm trắc nghiệm"
        size="xl"
      >
        {loadingHistoryDetail ? (
          <div className="p-8 flex justify-center">
            <LoadingState label="Đang tải chi tiết bài làm..." />
          </div>
        ) : historyDetailError ? (
          <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error text-xs space-y-3">
            <p>{historyDetailError}</p>
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoryDetailError(null)}
              >
                Đóng
              </Button>
            </div>
          </div>
        ) : selectedHistoryDetail ? (
          <div className="space-y-6 pt-2" data-testid="student-history-detail-modal">
            {/* Summary Header Card */}
            <div className="p-4 rounded-xl bg-surface-container/60 border border-outline-variant/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-base text-on-surface">
                    {selectedHistoryDetail.quizTitle}
                  </h3>
                  <p className="text-xs text-secondary mt-0.5">
                    {selectedHistoryDetail.isRetake
                      ? `Lượt thi lại #${selectedHistoryDetail.attemptNumber}`
                      : "Lượt thi đầu tiên"} • Bắt đầu: {new Date(selectedHistoryDetail.startedAt).toLocaleString("vi-VN")}
                    {selectedHistoryDetail.submittedAt && (
                      <> • Nộp bài: {new Date(selectedHistoryDetail.submittedAt).toLocaleString("vi-VN")}</>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedHistoryDetail.status === "SUBMITTED" ? (
                    <Badge variant={selectedHistoryDetail.passed ? "success" : "error"} className="text-xs">
                      {selectedHistoryDetail.passed ? "ĐẠT YÊU CẦU" : "CHƯA ĐẠT"}
                    </Badge>
                  ) : (
                    <Badge variant="neutral" className="text-xs">
                      {selectedHistoryDetail.status}
                    </Badge>
                  )}
                </div>
              </div>

              {/* KPI metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-outline-variant/20 text-center">
                <div className="p-2 rounded-lg bg-surface">
                  <span className="text-[11px] text-secondary block">Điểm số</span>
                  <span className="text-lg font-bold font-mono text-on-surface">
                    {selectedHistoryDetail.scorePercent !== null ? `${selectedHistoryDetail.scorePercent}%` : "--"}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-surface">
                  <span className="text-[11px] text-secondary block">Số câu đúng</span>
                  <span className="text-lg font-bold font-mono text-on-surface">
                    {selectedHistoryDetail.correctCount !== null ? `${selectedHistoryDetail.correctCount} / ${selectedHistoryDetail.totalQuestions}` : "--"}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-surface">
                  <span className="text-[11px] text-secondary block">Điểm sàn đạt</span>
                  <span className="text-lg font-bold font-mono text-on-surface">
                    {selectedHistoryDetail.passingScore}%
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-surface">
                  <span className="text-[11px] text-secondary block">XP tích lũy</span>
                  <span className="text-lg font-bold font-mono text-amber-600">
                    +{selectedHistoryDetail.awardedXp ?? 0} XP
                  </span>
                </div>
              </div>

              {selectedHistoryDetail.xpReason && (
                <div className="text-[11px] text-secondary text-center pt-1">
                  Chính sách thưởng:{" "}
                  <strong>
                    {selectedHistoryDetail.xpReason === "FIRST_QUIZ_SUBMISSION"
                      ? "Đã cấp điểm thưởng XP cho lần submit đầu tiên"
                      : selectedHistoryDetail.xpReason === "ALREADY_AWARDED_OR_RETAKE"
                        ? "Lượt thi lại (Retake) không tích lũy thêm điểm thưởng XP"
                        : selectedHistoryDetail.xpReason === "FIRST_SUBMIT_ZERO_XP"
                          ? "Lần submit đầu tiên đạt 0 điểm (đã ghi nhận quyền thi)"
                          : selectedHistoryDetail.xpReason}
                  </strong>
                </div>
              )}
            </div>

            {/* Questions Review or Zero-leak Guard */}
            {selectedHistoryDetail.status === "SUBMITTED" ? (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    fact_check
                  </span>
                  <span>Xem lại chi tiết từng câu hỏi & đáp án</span>
                </h4>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                  {selectedHistoryDetail.results?.map((item, idx) => {
                    const isCorrect = item.isCorrect === true;
                    return (
                      <div
                        key={item.questionId}
                        className={`p-4 rounded-xl border transition-all ${
                          isCorrect
                            ? "border-emerald-500/40 bg-emerald-500/5"
                            : "border-red-500/40 bg-red-500/5"
                        }`}
                        data-testid={`review-question-${item.displayedOrder}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span className="font-bold text-xs px-2 py-0.5 rounded-md bg-surface text-secondary">
                            Câu {idx + 1}
                          </span>
                          {isCorrect ? (
                            <Badge variant="success" className="text-[10px] flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">check</span>
                              <span>Chính xác</span>
                            </Badge>
                          ) : (
                            <Badge variant="error" className="text-[10px] flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">close</span>
                              <span>Chưa đúng</span>
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm font-medium text-on-surface mb-3 whitespace-pre-wrap">
                          {item.questionText}
                        </p>

                        <div className="space-y-2">
                          {item.options.map((opt, optIdx) => {
                            const isSelected = item.selectedOptionIndex === optIdx;
                            const isCorrectOpt = item.correctOptionIndex === optIdx;

                            let optStyle =
                              "border-outline-variant/30 bg-surface text-secondary";
                            if (isSelected && isCorrect) {
                              optStyle =
                                "border-emerald-500 bg-emerald-500/15 text-emerald-700 font-semibold";
                            } else if (isSelected && !isCorrect) {
                              optStyle =
                                "border-red-500 bg-red-500/15 text-red-700 font-semibold";
                            } else if (isCorrectOpt) {
                              optStyle =
                                "border-emerald-500/60 bg-emerald-500/10 text-emerald-700 font-medium";
                            }

                            return (
                              <div
                                key={optIdx}
                                className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${optStyle}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-bold uppercase w-5 text-center">
                                    {String.fromCharCode(65 + optIdx)}.
                                  </span>
                                  <span>{opt}</span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
                                  {isSelected && (
                                    <span className="italic font-medium">
                                      (Bạn đã chọn)
                                    </span>
                                  )}
                                  {isCorrectOpt && (
                                    <span className="inline-flex items-center gap-0.5 text-emerald-600 font-bold">
                                      <span className="material-symbols-outlined text-[14px]">
                                        check_circle
                                      </span>
                                      <span>Đáp án đúng</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {item.explanation && (
                          <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs space-y-1">
                            <span className="font-bold text-primary flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">
                                lightbulb
                              </span>
                              <span>Giải thích đáp án:</span>
                            </span>
                            <p className="text-secondary">{item.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Zero-leak invariant: Không hiển thị đáp án cho bài chưa SUBMITTED
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 space-y-2 text-warning text-xs">
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  <span className="material-symbols-outlined text-[18px]">
                    shield
                  </span>
                  <span>Bảo mật nội dung bài thi</span>
                </div>
                <p>
                  Lượt thi này đang ở trạng thái <strong>{selectedHistoryDetail.status}</strong>. Nhằm đảm bảo tính công bằng và bảo mật tuyệt đối cho bài kiểm tra, đáp án và lời giải chi tiết chỉ được phép hiển thị sau khi thí sinh đã nộp bài thành công (SUBMITTED).
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-outline-variant/30">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedHistoryDetail(null)}
              >
                Đóng
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
