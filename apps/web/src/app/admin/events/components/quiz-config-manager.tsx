"use client";

import React, { useCallback, useEffect, useState } from "react";
import type {
  AdminOpenDayEventDto,
  QuestionBankItemDto,
  QuizConfigurationDto,
  QuizConfigStatus,
} from "@fpt-campus/shared";
import {
  Badge,
  Button,
  DataTable,
  DataTableColumn,
  EmptyState,
  Input,
  LoadingState,
  Modal,
  SearchInput,
  Textarea,
} from "@/components/ui";
import {
  ApiClientError,
  questionsApi,
  quizConfigApi,
} from "@/lib/auth/api-client";

interface QuizConfigManagerProps {
  selectedEventId: string | null;
  events: AdminOpenDayEventDto[];
  onShowToast: (message: string, type: "success" | "error" | "info") => void;
}

export function QuizConfigManager({
  selectedEventId,
  events,
  onShowToast,
}: QuizConfigManagerProps) {
  // List state
  const [configs, setConfigs] = useState<QuizConfigurationDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Create / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configForm, setConfigForm] = useState<{
    title: string;
    description: string;
    eventId: string;
    timeLimitMinutes: number;
    passingScore: number;
    maxAttempts: number;
    isShuffleQuestions: boolean;
    isShuffleOptions: boolean;
  }>({
    title: "",
    description: "",
    eventId: "",
    timeLimitMinutes: 15,
    passingScore: 70,
    maxAttempts: 3,
    isShuffleQuestions: true,
    isShuffleOptions: true,
  });

  // Question Snapshot Manager Drawer/Modal state
  const [isQuestionManagerOpen, setIsQuestionManagerOpen] = useState(false);
  const [activeConfig, setActiveConfig] = useState<QuizConfigurationDto | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<
    Array<{
      questionBankItemId: string;
      questionText: string;
      topic: string;
      difficulty: string;
      options: string[];
      correctIndex: number;
    }>
  >([]);
  const [isLoadingActiveConfig, setIsLoadingActiveConfig] = useState(false);
  const [isSavingQuestions, setIsSavingQuestions] = useState(false);
  const [isPublishingActive, setIsPublishingActive] = useState(false);

  // Question Bank Picker state
  const [availableQuestions, setAvailableQuestions] = useState<QuestionBankItemDto[]>([]);
  const [isLoadingBank, setIsLoadingBank] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [bankTopic, setBankTopic] = useState("");

  // Refresh quiz configurations without showing full loading spinner
  const refreshConfigs = useCallback(async () => {
    try {
      const res = await quizConfigApi.list({
        eventId: selectedEventId || undefined,
        status: statusFilter !== "ALL" ? (statusFilter as QuizConfigStatus) : undefined,
        q: searchQuery.trim() || undefined,
      });
      setConfigs(res.items);
    } catch (err) {
      onShowToast(
        err instanceof Error ? err.message : "Lỗi tải danh sách cấu hình bài thi",
        "error",
      );
    }
  }, [selectedEventId, statusFilter, searchQuery, onShowToast]);

  useEffect(() => {
    let cancelled = false;
    quizConfigApi
      .list({
        eventId: selectedEventId || undefined,
        status: statusFilter !== "ALL" ? (statusFilter as QuizConfigStatus) : undefined,
        q: searchQuery.trim() || undefined,
      })
      .then((res) => {
        if (!cancelled) {
          setConfigs(res.items);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          onShowToast(
            err instanceof Error ? err.message : "Lỗi tải danh sách cấu hình bài thi",
            "error",
          );
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedEventId, statusFilter, searchQuery, onShowToast]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingConfigId(null);
    setConfigForm({
      title: "",
      description: "",
      eventId: selectedEventId || (events[0]?.id ?? ""),
      timeLimitMinutes: 15,
      passingScore: 70,
      maxAttempts: 3,
      isShuffleQuestions: true,
      isShuffleOptions: true,
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (cfg: QuizConfigurationDto) => {
    setEditingConfigId(cfg.id);
    setConfigForm({
      title: cfg.title,
      description: cfg.description || "",
      eventId: cfg.eventId || "",
      timeLimitMinutes: cfg.timeLimitMinutes,
      passingScore: cfg.passingScore,
      maxAttempts: cfg.maxAttempts,
      isShuffleQuestions: cfg.isShuffleQuestions,
      isShuffleOptions: cfg.isShuffleOptions,
    });
    setIsModalOpen(true);
  };

  // Save Config
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configForm.title.trim()) {
      onShowToast("Vui lòng nhập tiêu đề bài thi", "error");
      return;
    }

    setIsSavingConfig(true);
    try {
      if (editingConfigId) {
        await quizConfigApi.update(editingConfigId, {
          title: configForm.title.trim(),
          description: configForm.description.trim() || undefined,
          eventId: configForm.eventId || null,
          timeLimitMinutes: Number(configForm.timeLimitMinutes),
          passingScore: Number(configForm.passingScore),
          maxAttempts: Number(configForm.maxAttempts),
          isShuffleQuestions: Boolean(configForm.isShuffleQuestions),
          isShuffleOptions: Boolean(configForm.isShuffleOptions),
        });
        onShowToast("Cập nhật cấu hình bài thi thành công!", "success");
      } else {
        await quizConfigApi.create({
          title: configForm.title.trim(),
          description: configForm.description.trim() || undefined,
          eventId: configForm.eventId || undefined,
          timeLimitMinutes: Number(configForm.timeLimitMinutes),
          passingScore: Number(configForm.passingScore),
          maxAttempts: Number(configForm.maxAttempts),
          isShuffleQuestions: Boolean(configForm.isShuffleQuestions),
          isShuffleOptions: Boolean(configForm.isShuffleOptions),
        });
        onShowToast("Tạo mới cấu hình bài thi thành công!", "success");
      }
      setIsModalOpen(false);
      void refreshConfigs();
    } catch (err) {
      if (err instanceof ApiClientError) {
        onShowToast(err.message, "error");
      } else {
        onShowToast(
          err instanceof Error ? err.message : "Lỗi lưu cấu hình bài thi",
          "error",
        );
      }
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Open Question Manager
  const handleOpenQuestionManager = async (cfg: QuizConfigurationDto) => {
    setActiveConfig(cfg);
    setIsQuestionManagerOpen(true);
    setIsLoadingActiveConfig(true);
    try {
      const fullDetail = await quizConfigApi.getById(cfg.id);
      setActiveConfig(fullDetail);
      if (fullDetail.questions && fullDetail.questions.length > 0) {
        setSelectedQuestions(
          fullDetail.questions.map((q) => ({
            questionBankItemId: q.questionBankItemId || q.id,
            questionText: q.questionText,
            topic: q.topic,
            difficulty: q.difficulty,
            options: q.options,
            correctIndex: q.correctIndex,
          })),
        );
      } else {
        setSelectedQuestions([]);
      }
    } catch (err) {
      onShowToast(
        err instanceof Error ? err.message : "Lỗi tải chi tiết câu hỏi bài thi",
        "error",
      );
    } finally {
      setIsLoadingActiveConfig(false);
    }

    // Load available approved questions
    void loadAvailableQuestions("", "");
  };

  // Load available approved questions from M6 Question Bank
  const loadAvailableQuestions = async (search: string, topic: string) => {
    setIsLoadingBank(true);
    try {
      const res = await questionsApi.listQuestions({
        status: "APPROVED",
        q: search.trim() || undefined,
        topic: topic.trim() || undefined,
        limit: 50,
      });
      setAvailableQuestions(res.items);
    } catch (err) {
      onShowToast(
        err instanceof Error ? err.message : "Lỗi tải danh sách ngân hàng câu hỏi",
        "error",
      );
    } finally {
      setIsLoadingBank(false);
    }
  };

  // Add question to selected list
  const handleAddQuestion = (q: QuestionBankItemDto) => {
    if (selectedQuestions.some((sq) => sq.questionBankItemId === q.id)) {
      onShowToast("Câu hỏi này đã có trong danh sách bài thi", "info");
      return;
    }
    setSelectedQuestions((prev) => [
      ...prev,
      {
        questionBankItemId: q.id,
        questionText: q.questionText,
        topic: q.topic,
        difficulty: q.difficulty,
        options: q.options,
        correctIndex: q.correctIndex,
      },
    ]);
  };

  // Remove question from selected list
  const handleRemoveQuestion = (idx: number) => {
    setSelectedQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  // Reorder questions (Move Up / Move Down)
  const handleMoveQuestion = (idx: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= selectedQuestions.length) return;
    const updated = [...selectedQuestions];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setSelectedQuestions(updated);
  };

  // Save questions snapshot
  const handleSaveQuestionsSnapshot = async () => {
    if (!activeConfig) return;
    setIsSavingQuestions(true);
    try {
      const ids = selectedQuestions.map((q) => q.questionBankItemId);
      const updated = await quizConfigApi.manageQuestions(activeConfig.id, ids);
      setActiveConfig(updated);
      onShowToast(
        `Đã lưu và đóng gói snapshot ${ids.length} câu hỏi thành công!`,
        "success",
      );
      void refreshConfigs();
    } catch (err) {
      if (err instanceof ApiClientError) {
        onShowToast(err.message, "error");
      } else {
        onShowToast(
          err instanceof Error ? err.message : "Lỗi lưu câu hỏi bài thi",
          "error",
        );
      }
    } finally {
      setIsSavingQuestions(false);
    }
  };

  // Publish Quiz
  const handlePublishQuiz = async (configId: string) => {
    setIsPublishingActive(true);
    try {
      const res = await quizConfigApi.publish(configId);
      if (activeConfig && activeConfig.id === configId) {
        setActiveConfig(res);
      }
      onShowToast(
        `Đã xuất bản bài thi "${res.title}" thành công! Snapshot câu hỏi đã được khóa bất biến.`,
        "success",
      );
      void refreshConfigs();
    } catch (err) {
      if (err instanceof ApiClientError) {
        onShowToast(err.message, "error");
      } else {
        onShowToast(
          err instanceof Error ? err.message : "Lỗi khi xuất bản bài thi",
          "error",
        );
      }
    } finally {
      setIsPublishingActive(false);
    }
  };

  // Archive Quiz
  const handleArchiveQuiz = async (configId: string) => {
    try {
      const res = await quizConfigApi.archive(configId);
      onShowToast(`Đã lưu trữ bài thi "${res.title}".`, "info");
      void refreshConfigs();
    } catch (err) {
      onShowToast(
        err instanceof Error ? err.message : "Lỗi lưu trữ bài thi",
        "error",
      );
    }
  };

  // Delete Quiz
  const handleDeleteQuiz = async (configId: string, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài thi "${title}"?`)) {
      return;
    }
    try {
      await quizConfigApi.delete(configId);
      onShowToast(`Đã xóa bài thi "${title}" thành công.`, "success");
      void refreshConfigs();
    } catch (err) {
      onShowToast(
        err instanceof Error ? err.message : "Lỗi xóa bài thi",
        "error",
      );
    }
  };

  // Columns for Quiz Config Table
  const columns: DataTableColumn<QuizConfigurationDto>[] = [
    {
      key: "title",
      header: "Tên bài thi & Sự kiện",
      render: (row) => (
        <div className="space-y-1 max-w-sm">
          <p className="font-bold text-on-surface text-sm">{row.title}</p>
          {row.description && (
            <p className="text-xs text-secondary line-clamp-1">{row.description}</p>
          )}
          {row.eventTitle ? (
            <Badge variant="brand">{row.eventTitle}</Badge>
          ) : (
            <span className="text-[11px] text-secondary italic">Bài thi độc lập</span>
          )}
        </div>
      ),
    },
    {
      key: "specs",
      header: "Thông số thi",
      render: (row) => (
        <div className="space-y-0.5 text-xs text-secondary">
          <div>
            Thời gian: <strong className="text-on-surface">{row.timeLimitMinutes} phút</strong>
          </div>
          <div>
            Điểm đạt: <strong className="text-on-surface">{row.passingScore}%</strong> | Max lượt:{" "}
            <strong className="text-on-surface">{row.maxAttempts}</strong>
          </div>
          <div className="text-[11px] text-tertiary">
            Trộn đề: {row.isShuffleQuestions ? "Có" : "Không"} | Trộn đáp án:{" "}
            {row.isShuffleOptions ? "Có" : "Không"}
          </div>
        </div>
      ),
    },
    {
      key: "questions",
      header: "Số câu hỏi (Snapshot)",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-[18px]">
            quiz
          </span>
          <span className="font-mono text-xs font-bold text-on-surface">
            {row.questionsCount} câu
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (row) => {
        if (row.status === "PUBLISHED") {
          return <Badge variant="success">ĐÃ XUẤT BẢN</Badge>;
        }
        if (row.status === "ARCHIVED") {
          return <Badge variant="neutral">ĐÃ LƯU TRỮ</Badge>;
        }
        return <Badge variant="warning">BẢN NHÁP</Badge>;
      },
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            icon="checklist"
            onClick={() => handleOpenQuestionManager(row)}
            title="Quản lý câu hỏi & Đóng gói Snapshot"
          >
            Câu hỏi ({row.questionsCount})
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon="edit"
            onClick={() => handleOpenEditModal(row)}
            title="Sửa cấu hình bài thi"
          >
            Sửa
          </Button>
          {row.status === "DRAFT" && (
            <Button
              size="sm"
              variant="primary"
              icon="publish"
              onClick={() => handlePublishQuiz(row.id)}
              title="Xuất bản bài thi"
            >
              Xuất bản
            </Button>
          )}
          {row.status === "PUBLISHED" && (
            <Button
              size="sm"
              variant="outline"
              icon="archive"
              onClick={() => handleArchiveQuiz(row.id)}
              title="Lưu trữ bài thi"
            >
              Lưu trữ
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            icon="delete"
            className="text-error hover:bg-error-container/20"
            onClick={() => handleDeleteQuiz(row.id, row.title)}
            title="Xóa cấu hình bài thi"
          >
            Xóa
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">
              settings_suggest
            </span>
            <span>Cấu hình Bài thi &amp; Đóng gói Snapshot (M7.1)</span>
          </h2>
          <p className="text-xs text-secondary mt-0.5">
            Tuyển chọn câu hỏi từ Ngân hàng câu hỏi (M6), sắp xếp thứ tự và đóng gói Snapshot bất biến cho các kỳ thi Open Day &amp; Thử thách.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon="add_circle"
          onClick={handleOpenCreateModal}
        >
          Tạo bài thi mới
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery("")}
          placeholder="Tìm theo tên bài thi, mô tả..."
          containerClassName="w-full sm:max-w-xs"
        />

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-secondary whitespace-nowrap">
            Lọc trạng thái:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-surface-container border border-surface-container-high text-xs font-semibold text-on-surface"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="DRAFT">Bản nháp (DRAFT)</option>
            <option value="PUBLISHED">Đã xuất bản (PUBLISHED)</option>
            <option value="ARCHIVED">Đã lưu trữ (ARCHIVED)</option>
          </select>
        </div>
      </div>

      {/* Table of Quiz Configurations */}
      {isLoading ? (
        <div className="p-8 flex justify-center">
          <LoadingState label="Đang tải danh sách bài thi..." />
        </div>
      ) : configs.length === 0 ? (
        <EmptyState
          title="Chưa có cấu hình bài thi nào"
          description="Bấm 'Tạo bài thi mới' để thiết lập bài trắc nghiệm và chọn câu hỏi từ Ngân hàng câu hỏi M6."
          actionLabel="Tạo bài thi mới"
          onAction={handleOpenCreateModal}
        />
      ) : (
        <DataTable columns={columns} data={configs} rowKey={(r) => r.id} />
      )}

      {/* Create / Edit Configuration Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingConfigId ? "Chỉnh sửa cấu hình bài thi" : "Tạo mới cấu hình bài thi"}
      >
        <form onSubmit={handleSaveConfig} className="space-y-4 pt-2">
          <Input
            id="quiz-title"
            label="Tiêu đề bài thi"
            placeholder="Ví dụ: Đấu trường Rung Chuông Vàng - Open Day 2026"
            required
            value={configForm.title}
            onChange={(e) => setConfigForm({ ...configForm, title: e.target.value })}
          />

          <Textarea
            id="quiz-desc"
            label="Mô tả / Hướng dẫn thí sinh"
            placeholder="Hướng dẫn quy chế thi, số điểm cần đạt để nhận quà..."
            rows={2}
            value={configForm.description}
            onChange={(e) => setConfigForm({ ...configForm, description: e.target.value })}
          />

          {events.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface block">
                Gắn với Sự kiện Open Day
              </label>
              <select
                value={configForm.eventId}
                onChange={(e) => setConfigForm({ ...configForm, eventId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-surface-container text-xs text-on-surface font-semibold"
              >
                <option value="">-- Không gắn sự kiện cụ thể (Bài thi độc lập) --</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.eventDate ? new Date(ev.eventDate).toLocaleDateString("vi-VN") : "Chưa đặt ngày"})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              id="quiz-timelimit"
              label="Thời gian (phút)"
              type="number"
              min={1}
              max={180}
              required
              value={String(configForm.timeLimitMinutes)}
              onChange={(e) =>
                setConfigForm({
                  ...configForm,
                  timeLimitMinutes: Math.max(1, parseInt(e.target.value, 10) || 1),
                })
              }
            />
            <Input
              id="quiz-passingscore"
              label="Điểm đạt (%)"
              type="number"
              min={1}
              max={100}
              required
              value={String(configForm.passingScore)}
              onChange={(e) =>
                setConfigForm({
                  ...configForm,
                  passingScore: Math.min(
                    100,
                    Math.max(1, parseInt(e.target.value, 10) || 1),
                  ),
                })
              }
            />
            <Input
              id="quiz-maxattempts"
              label="Số lượt làm tối đa"
              type="number"
              min={1}
              max={10}
              required
              value={String(configForm.maxAttempts)}
              onChange={(e) =>
                setConfigForm({
                  ...configForm,
                  maxAttempts: Math.max(1, parseInt(e.target.value, 10) || 1),
                })
              }
            />
          </div>

          <div className="space-y-2 pt-1 border-t border-surface-container">
            <label className="text-xs font-bold text-on-surface block">
              Tùy chọn xáo trộn đề thi
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-on-surface font-medium">
                <input
                  type="checkbox"
                  checked={configForm.isShuffleQuestions}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, isShuffleQuestions: e.target.checked })
                  }
                  className="rounded border-surface-container text-primary focus:ring-primary w-4 h-4"
                />
                <span>Trộn ngẫu nhiên thứ tự câu hỏi khi phát đề</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-on-surface font-medium">
                <input
                  type="checkbox"
                  checked={configForm.isShuffleOptions}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, isShuffleOptions: e.target.checked })
                  }
                  className="rounded border-surface-container text-primary focus:ring-primary w-4 h-4"
                />
                <span>Trộn phương án (A, B, C, D)</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsModalOpen(false)}
            >
              Hủy
            </Button>
            <Button variant="primary" type="submit" loading={isSavingConfig}>
              {editingConfigId ? "Lưu thay đổi" : "Tạo bài thi"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Question Selection & Snapshot Manager Modal */}
      <Modal
        open={isQuestionManagerOpen}
        onClose={() => setIsQuestionManagerOpen(false)}
        title={`Quản lý câu hỏi & Đóng gói Snapshot: ${activeConfig?.title ?? ""}`}
      >
        <div className="space-y-4 pt-1 max-w-4xl">
          {/* Status banner */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-on-surface flex items-start gap-2.5">
            <span className="material-symbols-outlined text-amber-600 text-[20px] shrink-0 mt-0.5">
              lock
            </span>
            <div>
              <p className="font-bold text-amber-900">
                Nguyên tắc Snapshot Bất biến (Immutable Snapshot Engine):
              </p>
              <p className="text-secondary mt-0.5">
                Các câu hỏi chọn vào bài thi sẽ được sao chép toàn bộ nội dung, phương án và đáp án đúng thành một bản snapshot độc lập trong cơ sở dữ liệu PostgreSQL. Mọi sửa đổi hay xóa câu hỏi tại Ngân hàng câu hỏi M6 sau này sẽ tuyệt đối không làm thay đổi bài thi đã xuất bản.
              </p>
            </div>
          </div>

          {isLoadingActiveConfig ? (
            <div className="p-8 flex justify-center">
              <LoadingState label="Đang tải dữ liệu câu hỏi bài thi..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Column: Selected Questions in Quiz */}
              <div className="space-y-3 p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex flex-col h-[520px]">
                <div className="flex items-center justify-between pb-2 border-b border-surface-container shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-on-surface uppercase tracking-wide">
                      Câu hỏi trong bài thi ({selectedQuestions.length})
                    </span>
                    {activeConfig?.status === "PUBLISHED" && (
                      <Badge variant="success">ĐÃ KHÓA</Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    icon="save"
                    loading={isSavingQuestions}
                    disabled={isSavingQuestions}
                    onClick={handleSaveQuestionsSnapshot}
                  >
                    Lưu danh sách ({selectedQuestions.length})
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {selectedQuestions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <span className="material-symbols-outlined text-secondary text-[36px] mb-1">
                        quiz
                      </span>
                      <p className="text-xs font-semibold text-secondary">
                        Chưa có câu hỏi nào trong bài thi
                      </p>
                      <p className="text-[11px] text-tertiary mt-0.5">
                        Chọn các câu hỏi đã được phê duyệt từ bảng bên phải để đưa vào bài thi.
                      </p>
                    </div>
                  ) : (
                    selectedQuestions.map((q, idx) => (
                      <div
                        key={`${q.questionBankItemId}-${idx}`}
                        className="p-2.5 rounded-lg bg-white border border-surface-container space-y-1.5 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-1.5 min-w-0">
                            <span className="font-mono text-xs font-bold text-primary shrink-0">
                              #{idx + 1}
                            </span>
                            <p className="text-xs font-semibold text-on-surface line-clamp-2">
                              {q.questionText}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveQuestion(idx, "up")}
                              className="p-1 rounded text-secondary hover:text-on-surface hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                              title="Di chuyển lên trên"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                arrow_upward
                              </span>
                            </button>
                            <button
                              type="button"
                              disabled={idx === selectedQuestions.length - 1}
                              onClick={() => handleMoveQuestion(idx, "down")}
                              className="p-1 rounded text-secondary hover:text-on-surface hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                              title="Di chuyển xuống dưới"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                arrow_downward
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestion(idx)}
                              className="p-1 rounded text-error hover:bg-error-container/20 cursor-pointer"
                              title="Xóa khỏi bài thi"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                close
                              </span>
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-surface-container text-secondary font-mono">
                            {q.topic}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-surface-container text-secondary font-mono">
                            {q.difficulty}
                          </span>
                          <span className="text-emerald-700 font-semibold ml-auto">
                            Đáp án: {String.fromCharCode(65 + q.correctIndex)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Bottom Quick Publish Bar */}
                {activeConfig && (
                  <div className="pt-2 border-t border-surface-container flex items-center justify-between shrink-0">
                    <span className="text-xs text-secondary">
                      Trạng thái: <strong>{activeConfig.status}</strong>
                    </span>
                    {activeConfig.status === "DRAFT" && (
                      <Button
                        size="sm"
                        variant="primary"
                        icon="rocket_launch"
                        loading={isPublishingActive}
                        disabled={selectedQuestions.length === 0 || isPublishingActive}
                        onClick={() => handlePublishQuiz(activeConfig.id)}
                      >
                        Xuất bản ngay
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Pick from Question Bank M6 */}
              <div className="space-y-3 p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex flex-col h-[520px]">
                <div className="flex items-center justify-between pb-2 border-b border-surface-container shrink-0">
                  <span className="font-bold text-xs text-on-surface uppercase tracking-wide">
                    Ngân hàng câu hỏi đã duyệt (M6)
                  </span>
                  <Badge variant="brand">APPROVED</Badge>
                </div>

                {/* Search & Topic Filter */}
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    value={bankSearch}
                    onChange={(e) => {
                      setBankSearch(e.target.value);
                      void loadAvailableQuestions(e.target.value, bankTopic);
                    }}
                    placeholder="Tìm câu hỏi..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-surface-container text-xs text-on-surface"
                  />
                  <input
                    type="text"
                    value={bankTopic}
                    onChange={(e) => {
                      setBankTopic(e.target.value);
                      void loadAvailableQuestions(bankSearch, e.target.value);
                    }}
                    placeholder="Chủ đề..."
                    className="w-28 px-3 py-1.5 rounded-lg bg-white border border-surface-container text-xs text-on-surface"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {isLoadingBank ? (
                    <div className="p-8 flex justify-center">
                      <LoadingState label="Đang tải câu hỏi..." />
                    </div>
                  ) : availableQuestions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <p className="text-xs font-semibold text-secondary">
                        Không tìm thấy câu hỏi đã duyệt
                      </p>
                    </div>
                  ) : (
                    availableQuestions.map((q) => {
                      const isAlreadySelected = selectedQuestions.some(
                        (sq) => sq.questionBankItemId === q.id,
                      );
                      return (
                        <div
                          key={q.id}
                          className="p-2.5 rounded-lg bg-white border border-surface-container space-y-1.5 shadow-2xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-on-surface line-clamp-2">
                              {q.questionText}
                            </p>
                            <Button
                              size="sm"
                              variant={isAlreadySelected ? "ghost" : "outline"}
                              icon={isAlreadySelected ? "check" : "add"}
                              disabled={isAlreadySelected}
                              onClick={() => handleAddQuestion(q)}
                            >
                              {isAlreadySelected ? "Đã chọn" : "Chọn"}
                            </Button>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="px-1.5 py-0.5 rounded bg-surface-container text-secondary font-mono">
                              {q.topic}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-surface-container text-secondary font-mono">
                              {q.difficulty}
                            </span>
                            <span className="text-secondary ml-auto">
                              Đáp án: {String.fromCharCode(65 + q.correctIndex)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end pt-2 border-t border-surface-container">
            <Button
              variant="outline"
              onClick={() => setIsQuestionManagerOpen(false)}
            >
              Đóng
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
