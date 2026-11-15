"use client";

import React, { useEffect, useState } from "react";
import type {
  PortalQuizDetailDeliveryDto,
  PortalQuizSummaryDto,
} from "@fpt-campus/shared";
import { Badge, Button, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { portalApi } from "@/lib/portal/portal-api";

export default function StudentQuizPage() {
  const [quizzes, setQuizzes] = useState<PortalQuizSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected quiz delivery state
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizDetail, setQuizDetail] = useState<PortalQuizDetailDeliveryDto | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Selected answers for preview/interaction (client-only demonstration in M7.2)
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, number>>({});

  useEffect(() => {
    let active = true;

    async function loadActiveQuizzes() {
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

    void loadActiveQuizzes();

    return () => {
      active = false;
    };
  }, []);

  const handleSelectQuiz = async (quizId: string) => {
    setSelectedQuizId(quizId);
    setLoadingDetail(true);
    setDetailError(null);
    setPreviewAnswers({});

    try {
      const detail = await portalApi.getQuizDelivery(quizId);
      setQuizDetail(detail);
    } catch (err) {
      setDetailError(
        err instanceof Error
          ? err.message
          : "Không thể phát đề thi từ máy chủ.",
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleBackToList = () => {
    setSelectedQuizId(null);
    setQuizDetail(null);
    setDetailError(null);
    setPreviewAnswers({});
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

  // 3. Quiz Delivery View (Detailed view of selected quiz)
  if (selectedQuizId) {
    if (loadingDetail) {
      return (
        <LoadingState
          label="Đang tải nội dung và phát đề thi an toàn từ PostgreSQL..."
          className="max-w-3xl mx-auto py-12"
        />
      );
    }

    if (detailError || !quizDetail) {
      return (
        <div className="max-w-3xl mx-auto space-y-4 py-8">
          <Button variant="outline" size="sm" onClick={handleBackToList}>
            ← Quay lại danh sách
          </Button>
          <ErrorState
            title="Không thể nhận đề thi"
            description={detailError ?? "Đề thi không khả dụng hoặc bạn không đủ điều kiện."}
            actionLabel="Thử lại"
            onAction={() => handleSelectQuiz(selectedQuizId)}
          />
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto space-y-6" data-testid="quiz-delivery-view">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToList}
            className="flex items-center gap-1.5"
            data-testid="back-to-quiz-list-btn"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Danh sách bài thi</span>
          </Button>
          <Badge variant="primary" className="text-xs">
            Đề thi chính thức
          </Badge>
        </div>

        {/* Quiz Information Card */}
        <div className="ui-card p-6 space-y-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
              {quizDetail.title}
            </h1>
            {quizDetail.description && (
              <p className="text-sm text-secondary">{quizDetail.description}</p>
            )}
            {quizDetail.eventName && (
              <p className="text-xs text-primary font-medium flex items-center gap-1 pt-1">
                <span className="material-symbols-outlined text-[16px]">event</span>
                <span>Sự kiện: {quizDetail.eventName}</span>
              </p>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-outline-variant/30 text-xs">
            <div className="bg-surface-container-low p-3 rounded-xl space-y-0.5">
              <span className="text-secondary block">Thời gian làm bài</span>
              <span className="font-bold text-on-surface text-sm">
                {quizDetail.timeLimitMinutes} phút
              </span>
            </div>
            <div className="bg-surface-container-low p-3 rounded-xl space-y-0.5">
              <span className="text-secondary block">Điểm đạt yêu cầu</span>
              <span className="font-bold text-on-surface text-sm">
                {quizDetail.passingScore}%
              </span>
            </div>
            <div className="bg-surface-container-low p-3 rounded-xl space-y-0.5">
              <span className="text-secondary block">Tổng số câu hỏi</span>
              <span className="font-bold text-on-surface text-sm">
                {quizDetail.totalQuestions} câu
              </span>
            </div>
            <div className="bg-surface-container-low p-3 rounded-xl space-y-0.5">
              <span className="text-secondary block">Lượt thi tối đa</span>
              <span className="font-bold text-on-surface text-sm">
                {quizDetail.maxAttempts} lượt
              </span>
            </div>
          </div>

          {/* Security Banner */}
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-primary flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">
              verified_user
            </span>
            <div className="space-y-0.5">
              <span className="font-semibold block">Đề thi bảo mật trực tiếp từ máy chủ</span>
              <span className="text-secondary">
                Toàn bộ câu hỏi được tải theo phiên bản xuất bản chuẩn. Đáp án đúng được bảo vệ tuyệt đối và không lưu trữ trên thiết bị người học.
              </span>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">
              list_alt
            </span>
            <span>Nội dung câu hỏi ({quizDetail.questions.length})</span>
          </h2>

          {quizDetail.questions.length === 0 ? (
            <EmptyState
              title="Đề thi chưa có câu hỏi"
              description="Hiện chưa có câu hỏi nào được gán vào đề thi này."
            />
          ) : (
            <div className="space-y-4" data-testid="quiz-questions-list">
              {quizDetail.questions.map((q, qIndex) => {
                const currentAnswer = previewAnswers[q.id];

                return (
                  <div
                    key={q.id}
                    className="ui-card p-5 sm:p-6 space-y-4"
                    data-testid={`quiz-question-card-${qIndex + 1}`}
                  >
                    {/* Question Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/30 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {qIndex + 1}
                        </span>
                        <span className="text-xs font-semibold text-secondary">
                          Câu hỏi {qIndex + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-surface-container font-medium text-secondary">
                          {q.topic}
                        </span>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                            q.difficulty === "HARD"
                              ? "bg-error/10 text-error"
                              : q.difficulty === "EASY"
                                ? "bg-success/10 text-success"
                                : "bg-warning/10 text-warning"
                          }`}
                        >
                          {q.difficulty}
                        </span>
                      </div>
                    </div>

                    {/* Question Text */}
                    <p className="text-sm sm:text-base font-medium text-on-surface leading-relaxed">
                      {q.questionText}
                    </p>

                    {/* Options Grid */}
                    <div className="space-y-2 pt-1">
                      {q.options.map((option, optIndex) => {
                        const isSelected = currentAnswer === optIndex;
                        const optionLetters = ["A", "B", "C", "D", "E", "F"];
                        const letter = optionLetters[optIndex] || `${optIndex + 1}`;

                        return (
                          <button
                            key={optIndex}
                            type="button"
                            onClick={() =>
                              setPreviewAnswers((prev) => ({
                                ...prev,
                                [q.id]: optIndex,
                              }))
                            }
                            className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                              isSelected
                                ? "border-primary bg-primary/5 text-primary shadow-xs"
                                : "border-outline-variant/50 hover:border-outline-variant hover:bg-surface-container-low text-on-surface"
                            }`}
                          >
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                                isSelected
                                  ? "bg-primary text-white"
                                  : "bg-surface-container text-secondary"
                              }`}
                            >
                              {letter}
                            </span>
                            <span className="text-sm font-normal leading-normal">
                              {option}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                    Đạt: <strong>{quiz.passingScore}%</strong>
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSelectQuiz(quiz.id)}
                  className="w-full justify-center"
                  data-testid={`view-quiz-btn-${quiz.id}`}
                >
                  Xem đề thi
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
