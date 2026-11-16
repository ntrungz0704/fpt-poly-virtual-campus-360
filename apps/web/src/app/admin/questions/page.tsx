"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type {
  CreateQuestionInputDto,
  QuestionBankItemDto,
  QuestionDifficulty,
  QuestionFilterQuery,
  QuestionImportPreviewResponse,
  QuestionReviewStatus,
  UpdateQuestionInputDto,
} from "@fpt-campus/shared";
import { formatAuthErrorMessage, questionsApi } from "@/lib/auth/api-client";

const TOPIC_SUGGESTIONS = [
  "Chung",
  "Lịch sử FPT",
  "Văn hóa FPT",
  "Công nghệ thông tin",
  "Thiết kế đồ họa",
  "Kinh tế & Marketing",
  "Kỹ năng mềm",
  "Đời sống sinh viên",
];

const DIFFICULTY_LABELS: Record<QuestionDifficulty, { label: string; badgeClass: string }> = {
  EASY: { label: "Dễ", badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  MEDIUM: { label: "Trung bình", badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  HARD: { label: "Khó", badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
};

const STATUS_LABELS: Record<QuestionReviewStatus, { label: string; badgeClass: string }> = {
  APPROVED: { label: "Đã duyệt", badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  IN_REVIEW: { label: "Chờ duyệt", badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20" },
  DRAFT: { label: "Bản nháp", badgeClass: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20" },
  REJECTED: { label: "Từ chối", badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
};

export default function AdminQuestionsPage() {
  const [items, setItems] = useState<QuestionBankItemDto[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<QuestionDifficulty | "">("");
  const [selectedStatus, setSelectedStatus] = useState<QuestionReviewStatus | "">("");

  // Toast notifications
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // Fetch Questions
  const loadQuestions = useCallback(async () => {
    try {
      const query: QuestionFilterQuery = {
        page,
        limit,
        q: searchQuery.trim() || undefined,
        topic: selectedTopic.trim() || undefined,
        difficulty: selectedDifficulty || undefined,
        status: selectedStatus || undefined,
      };
      const res = await questionsApi.listQuestions(query);
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setError(null);
    } catch (err) {
      const msg = formatAuthErrorMessage(err, "Không thể tải danh sách câu hỏi.");
      setError(msg);
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, selectedTopic, selectedDifficulty, selectedStatus, showToast]);

  useEffect(() => {
    let active = true;
    const query: QuestionFilterQuery = {
      page,
      limit,
      q: searchQuery.trim() || undefined,
      topic: selectedTopic.trim() || undefined,
      difficulty: selectedDifficulty || undefined,
      status: selectedStatus || undefined,
    };
    questionsApi
      .listQuestions(query)
      .then((res) => {
        if (active) {
          setItems(res.items);
          setTotal(res.total);
          setTotalPages(res.totalPages);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          const msg = formatAuthErrorMessage(err, "Không thể tải danh sách câu hỏi.");
          setError(msg);
          showToast("error", msg);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [page, limit, searchQuery, selectedTopic, selectedDifficulty, selectedStatus, showToast]);

  // Statistics calculation
  const stats = useMemo(() => {
    const approved = items.filter((i) => i.status === "APPROVED").length;
    const inReview = items.filter((i) => i.status === "IN_REVIEW" || i.status === "DRAFT").length;
    return {
      total,
      pageCount: items.length,
      approved,
      inReview,
    };
  }, [items, total]);

  // Modal Create / Edit Question
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QuestionBankItemDto | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formQuestionText, setFormQuestionText] = useState("");
  const [formOptionA, setFormOptionA] = useState("");
  const [formOptionB, setFormOptionB] = useState("");
  const [formOptionC, setFormOptionC] = useState("");
  const [formOptionD, setFormOptionD] = useState("");
  const [formCorrectIndex, setFormCorrectIndex] = useState(0);
  const [formExplanation, setFormExplanation] = useState("");
  const [formTopic, setFormTopic] = useState("Chung");
  const [formDifficulty, setFormDifficulty] = useState<QuestionDifficulty>("MEDIUM");
  const [formStatus, setFormStatus] = useState<QuestionReviewStatus>("DRAFT");
  const [formTags, setFormTags] = useState("");

  const questionTextInputId = useId();
  const optionAInputId = useId();
  const optionBInputId = useId();
  const optionCInputId = useId();
  const optionDInputId = useId();
  const topicInputId = useId();
  const difficultyInputId = useId();
  const statusInputId = useId();
  const explanationInputId = useId();
  const tagsInputId = useId();
  const importFileInputId = useId();

  const openCreateModal = () => {
    setEditingItem(null);
    setFormQuestionText("");
    setFormOptionA("");
    setFormOptionB("");
    setFormOptionC("");
    setFormOptionD("");
    setFormCorrectIndex(0);
    setFormExplanation("");
    setFormTopic("Chung");
    setFormDifficulty("MEDIUM");
    setFormStatus("DRAFT");
    setFormTags("");
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (item: QuestionBankItemDto) => {
    setEditingItem(item);
    setFormQuestionText(item.questionText);
    setFormOptionA(item.options[0] || "");
    setFormOptionB(item.options[1] || "");
    setFormOptionC(item.options[2] || "");
    setFormOptionD(item.options[3] || "");
    setFormCorrectIndex(item.correctIndex);
    setFormExplanation(item.explanation || "");
    setFormTopic(item.topic || "Chung");
    setFormDifficulty(item.difficulty);
    setFormStatus(item.status);
    setFormTags(item.tags ? item.tags.join(", ") : "");
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const qText = formQuestionText.trim();
    if (qText.length < 5) {
      setFormError("Nội dung câu hỏi phải có ít nhất 5 ký tự.");
      return;
    }

    const opts = [formOptionA.trim(), formOptionB.trim(), formOptionC.trim(), formOptionD.trim()];
    if (opts.some((o) => !o)) {
      setFormError("Vui lòng điền đầy đủ cả 4 phương án A, B, C, D.");
      return;
    }

    const parsedTags = formTags
      .split(/[,;]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    setFormSubmitting(true);
    try {
      if (editingItem) {
        const payload: UpdateQuestionInputDto = {
          questionText: qText,
          options: opts,
          correctIndex: formCorrectIndex,
          explanation: formExplanation.trim() || undefined,
          topic: formTopic.trim() || "Chung",
          difficulty: formDifficulty,
          status: formStatus,
          tags: parsedTags,
        };
        await questionsApi.updateQuestion(editingItem.id, payload);
        showToast("success", "Cập nhật câu hỏi thành công.");
      } else {
        const payload: CreateQuestionInputDto = {
          questionText: qText,
          options: opts,
          correctIndex: formCorrectIndex,
          explanation: formExplanation.trim() || undefined,
          topic: formTopic.trim() || "Chung",
          difficulty: formDifficulty,
          status: formStatus,
          tags: parsedTags,
        };
        await questionsApi.createQuestion(payload);
        showToast("success", "Tạo câu hỏi mới thành công.");
      }
      setIsFormModalOpen(false);
      loadQuestions();
    } catch (err) {
      const msg = formatAuthErrorMessage(err, "Lưu câu hỏi thất bại.");
      setFormError(msg);
      showToast("error", msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Quick Status Toggle
  const handleQuickStatusChange = async (item: QuestionBankItemDto, newStatus: QuestionReviewStatus) => {
    try {
      await questionsApi.updateStatus(item.id, { status: newStatus });
      showToast("success", `Đã chuyển trạng thái sang "${STATUS_LABELS[newStatus].label}".`);
      loadQuestions();
    } catch (err) {
      showToast("error", formatAuthErrorMessage(err, "Không thể cập nhật trạng thái."));
    }
  };

  // Soft Delete Question
  const [deletingItem, setDeletingItem] = useState<QuestionBankItemDto | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const confirmDelete = async () => {
    if (!deletingItem) return;
    setDeleteSubmitting(true);
    try {
      await questionsApi.deleteQuestion(deletingItem.id);
      showToast("success", "Đã xóa câu hỏi khỏi ngân hàng.");
      setDeletingItem(null);
      loadQuestions();
    } catch (err) {
      showToast("error", formatAuthErrorMessage(err, "Xóa câu hỏi thất bại."));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Excel Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<QuestionImportPreviewResponse | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importConfirming, setImportConfirming] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openImportModal = () => {
    setImportFile(null);
    setImportPreview(null);
    setImportError(null);
    setIsImportModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportError(null);
    setImportLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const buffer = event.target?.result as ArrayBuffer;
          const bytes = new Uint8Array(buffer);
          let binary = "";
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);
          const preview = await questionsApi.previewImport(base64);
          setImportPreview(preview);
        } catch (err) {
          const msg = formatAuthErrorMessage(err, "Không thể phân tích tệp Excel.");
          setImportError(msg);
        } finally {
          setImportLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setImportError(formatAuthErrorMessage(err, "Lỗi đọc tệp tin."));
      setImportLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview || importPreview.validRows === 0) return;
    setImportConfirming(true);
    setImportError(null);
    try {
      const res = await questionsApi.confirmImport(importPreview.rows);
      showToast("success", res.message);
      setIsImportModalOpen(false);
      loadQuestions();
    } catch (err) {
      const msg = formatAuthErrorMessage(err, "Nhập câu hỏi thất bại.");
      setImportError(msg);
      showToast("error", msg);
    } finally {
      setImportConfirming(false);
    }
  };

  const handleExportErrors = async () => {
    if (!importPreview) return;
    try {
      const blob = await questionsApi.exportErrors(importPreview.rows);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Bao_Cao_Loi_Cau_Hoi_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showToast("error", formatAuthErrorMessage(err, "Không thể tải báo cáo lỗi."));
    }
  };

  return (
    <div className="space-y-6 pb-12" data-testid="question-bank-page">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border animate-slide-in ${
            toast.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800"
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl border border-surface-container shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">help_outline</span>
            <h1 className="text-2xl font-bold font-headline text-on-surface">Ngân hàng câu hỏi trắc nghiệm</h1>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            Quản trị độc lập kho câu hỏi, phân loại chủ đề & độ khó, hỗ trợ import Excel phục vụ các kỳ thi Quiz.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={questionsApi.getTemplateDownloadUrl()}
            download="Mau_Cau_Hoi_Trac_Nghiem.xlsx"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-surface-container-high bg-surface-container-low hover:bg-surface-container text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Tải file mẫu (.xlsx)</span>
          </a>

          <button
            type="button"
            onClick={openImportModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-base">upload_file</span>
            <span>Import Excel</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary-hover text-on-primary shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Thêm câu hỏi mới</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container">
          <div className="text-xs font-medium text-on-surface-variant">Tổng số câu hỏi</div>
          <div className="text-2xl font-bold text-on-surface mt-1">{stats.total}</div>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container">
          <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Đã kiểm duyệt (Approved)</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.approved}</div>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container">
          <div className="text-xs font-medium text-sky-600 dark:text-sky-400">Chờ duyệt / Nháp</div>
          <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">{stats.inReview}</div>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container">
          <div className="text-xs font-medium text-on-surface-variant">Đang hiển thị trên trang</div>
          <div className="text-2xl font-bold text-on-surface mt-1">{stats.pageCount}</div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm kiếm câu hỏi, từ khóa, giải thích..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <select
          value={selectedTopic}
          onChange={(e) => {
            setSelectedTopic(e.target.value);
            setPage(1);
          }}
          className="text-xs px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Tất cả chủ đề</option>
          {TOPIC_SUGGESTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          value={selectedDifficulty}
          onChange={(e) => {
            setSelectedDifficulty(e.target.value as QuestionDifficulty | "");
            setPage(1);
          }}
          className="text-xs px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Tất cả độ khó</option>
          <option value="EASY">Dễ (EASY)</option>
          <option value="MEDIUM">Trung bình (MEDIUM)</option>
          <option value="HARD">Khó (HARD)</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value as QuestionReviewStatus | "");
            setPage(1);
          }}
          className="text-xs px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="APPROVED">Đã duyệt (APPROVED)</option>
          <option value="IN_REVIEW">Chờ duyệt (IN_REVIEW)</option>
          <option value="DRAFT">Bản nháp (DRAFT)</option>
          <option value="REJECTED">Từ chối (REJECTED)</option>
        </select>

        {(searchQuery || selectedTopic || selectedDifficulty || selectedStatus) && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedTopic("");
              setSelectedDifficulty("");
              setSelectedStatus("");
              setPage(1);
            }}
            className="text-xs px-3 py-2 rounded-xl border border-dashed border-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
          >
            Đặt lại bộ lọc
          </button>
        )}
      </div>

      {/* Questions List Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-surface-container overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-on-surface-variant space-y-3">
            <span className="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
            <div className="text-sm font-medium">Đang tải danh sách câu hỏi...</div>
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-rose-500">error</span>
            <div className="text-sm text-rose-600 font-medium">{error}</div>
            <button
              type="button"
              onClick={loadQuestions}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-on-primary hover:bg-primary-hover"
            >
              Thử lại
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant space-y-3">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">quiz</span>
            <div className="text-sm font-medium">Chưa có câu hỏi nào phù hợp với bộ lọc.</div>
            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-on-primary hover:bg-primary-hover"
            >
              Thêm câu hỏi đầu tiên
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-surface-container bg-surface-container-low text-on-surface-variant font-semibold">
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4 min-w-[280px]">Nội dung câu hỏi & 4 Phương án</th>
                  <th className="py-3.5 px-4 w-28">Chủ đề</th>
                  <th className="py-3.5 px-4 w-24 text-center">Độ khó</th>
                  <th className="py-3.5 px-4 w-28 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 w-32">Người tạo / Cập nhật</th>
                  <th className="py-3.5 px-4 w-36 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {items.map((item, idx) => {
                  const diff = DIFFICULTY_LABELS[item.difficulty] || DIFFICULTY_LABELS.MEDIUM;
                  const stat = STATUS_LABELS[item.status] || STATUS_LABELS.DRAFT;
                  const rowNumber = (page - 1) * limit + idx + 1;

                  return (
                    <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-4 px-4 text-center text-on-surface-variant font-medium">{rowNumber}</td>

                      <td className="py-4 px-4 space-y-2">
                        <div className="font-semibold text-on-surface text-sm leading-relaxed">{item.questionText}</div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          {item.options.map((opt, optIdx) => {
                            const isCorrect = optIdx === item.correctIndex;
                            const optionLetters = ["A", "B", "C", "D"];
                            return (
                              <div
                                key={optIdx}
                                className={`flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] leading-snug ${
                                  isCorrect
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200 font-semibold"
                                    : "bg-surface-container-low border-surface-container text-on-surface-variant"
                                }`}
                              >
                                <span
                                  className={`inline-flex items-center justify-center size-4 rounded-full text-[9px] font-bold shrink-0 ${
                                    isCorrect ? "bg-emerald-500 text-white" : "bg-surface-container text-on-surface-variant"
                                  }`}
                                >
                                  {optionLetters[optIdx]}
                                </span>
                                <span className="break-words">{opt}</span>
                                {isCorrect && (
                                  <span className="material-symbols-outlined text-[13px] text-emerald-500 ml-auto shrink-0">
                                    check
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {item.explanation && (
                          <div className="text-[11px] text-on-surface-variant italic bg-surface-container-low p-2 rounded-lg border border-surface-container/60">
                            <span className="font-semibold text-on-surface not-italic">Giải thích: </span>
                            {item.explanation}
                          </div>
                        )}

                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {item.tags.map((t, tIdx) => (
                              <span
                                key={tIdx}
                                className="px-1.5 py-0.5 rounded text-[10px] bg-surface-container text-on-surface-variant"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-container text-on-surface">
                          {item.topic}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${diff.badgeClass}`}>
                          {diff.label}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${stat.badgeClass}`}>
                          {stat.label}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-on-surface-variant text-[11px] space-y-0.5">
                        <div className="font-medium text-on-surface">{item.creatorName || "Hệ thống"}</div>
                        <div className="text-[10px] text-on-surface-variant/80">
                          {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {item.status !== "APPROVED" && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(item, "APPROVED")}
                              title="Duyệt câu hỏi"
                              className="size-7 rounded-lg hover:bg-emerald-500/10 text-emerald-600 flex items-center justify-center"
                            >
                              <span className="material-symbols-outlined text-base">check_circle</span>
                            </button>
                          )}

                          {item.status !== "REJECTED" && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(item, "REJECTED")}
                              title="Từ chối"
                              className="size-7 rounded-lg hover:bg-rose-500/10 text-rose-600 flex items-center justify-center"
                            >
                              <span className="material-symbols-outlined text-base">block</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            title="Chỉnh sửa"
                            className="size-7 rounded-lg hover:bg-surface-container text-on-surface flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingItem(item)}
                            title="Xóa mềm"
                            className="size-7 rounded-lg hover:bg-rose-500/10 text-rose-500 flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant">
            <div>
              Hiển thị trang <span className="font-bold text-on-surface">{page}</span> / {totalPages} (Tổng{" "}
              {total} câu hỏi)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-surface-container bg-surface-container-low hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                Trang trước
              </button>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-surface-container bg-surface-container-low hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                Trang tiếp
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Create / Edit Question */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-surface-container flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold font-headline text-on-surface">
                {editingItem ? "Chỉnh sửa câu hỏi trắc nghiệm" : "Tạo câu hỏi trắc nghiệm mới"}
              </h2>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="size-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="overflow-y-auto p-5 space-y-4 flex-1">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label htmlFor={questionTextInputId} className="block text-xs font-semibold text-on-surface mb-1">
                  Nội dung câu hỏi (*)
                </label>
                <textarea
                  id={questionTextInputId}
                  rows={3}
                  value={formQuestionText}
                  onChange={(e) => setFormQuestionText(e.target.value)}
                  placeholder="Nhập nội dung câu hỏi trắc nghiệm..."
                  className="w-full text-xs p-2.5 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={topicInputId} className="block text-xs font-semibold text-on-surface mb-1">
                    Chủ đề
                  </label>
                  <input
                    id={topicInputId}
                    type="text"
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    placeholder="Ví dụ: Lịch sử FPT, CNTT..."
                    className="w-full text-xs p-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label htmlFor={difficultyInputId} className="block text-xs font-semibold text-on-surface mb-1">
                    Độ khó
                  </label>
                  <select
                    id={difficultyInputId}
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as QuestionDifficulty)}
                    className="w-full text-xs p-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="EASY">Dễ (EASY)</option>
                    <option value="MEDIUM">Trung bình (MEDIUM)</option>
                    <option value="HARD">Khó (HARD)</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor={statusInputId} className="block text-xs font-semibold text-on-surface mb-1">
                  Trạng thái kiểm duyệt
                </label>
                <select
                  id={statusInputId}
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as QuestionReviewStatus)}
                  className="w-full text-xs p-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="DRAFT">Bản nháp (DRAFT)</option>
                  <option value="IN_REVIEW">Gửi chờ duyệt (IN_REVIEW)</option>
                  <option value="APPROVED">Đã duyệt (APPROVED)</option>
                  <option value="REJECTED">Từ chối (REJECTED)</option>
                </select>
              </div>

              {/* 4 Options with Radio Button for Correct Index */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-on-surface">
                  4 Phương án trả lời (*) <span className="text-[11px] text-primary font-normal">(Chọn nút tròn để chỉ định đáp án đúng)</span>
                </div>

                <div className="space-y-2">
                  {[
                    { letter: "A", idx: 0, val: formOptionA, setVal: setFormOptionA, inputId: optionAInputId },
                    { letter: "B", idx: 1, val: formOptionB, setVal: setFormOptionB, inputId: optionBInputId },
                    { letter: "C", idx: 2, val: formOptionC, setVal: setFormOptionC, inputId: optionCInputId },
                    { letter: "D", idx: 3, val: formOptionD, setVal: setFormOptionD, inputId: optionDInputId },
                  ].map((opt) => (
                    <div
                      key={opt.letter}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border transition-colors ${
                        formCorrectIndex === opt.idx
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-surface-container-low border-surface-container"
                      }`}
                    >
                      <input
                        type="radio"
                        name="correctOptionRadio"
                        checked={formCorrectIndex === opt.idx}
                        onChange={() => setFormCorrectIndex(opt.idx)}
                        className="size-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        title={`Chọn phương án ${opt.letter} làm đáp án đúng`}
                      />
                      <label htmlFor={opt.inputId} className="font-bold text-xs w-5 text-on-surface shrink-0">
                        {opt.letter}.
                      </label>
                      <input
                        id={opt.inputId}
                        type="text"
                        value={opt.val}
                        onChange={(e) => opt.setVal(e.target.value)}
                        placeholder={`Nội dung phương án ${opt.letter}...`}
                        className="flex-1 text-xs p-1.5 bg-transparent border-none text-on-surface focus:outline-none"
                        required
                      />
                      {formCorrectIndex === opt.idx && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          Đáp án đúng
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor={explanationInputId} className="block text-xs font-semibold text-on-surface mb-1">
                  Giải thích đáp án
                </label>
                <textarea
                  id={explanationInputId}
                  rows={2}
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  placeholder="Giải thích lý do đáp án đúng (hiển thị cho thí sinh sau khi nộp bài)..."
                  className="w-full text-xs p-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label htmlFor={tagsInputId} className="block text-xs font-semibold text-on-surface mb-1">
                  Tags / Từ khóa
                </label>
                <input
                  id={tagsInputId}
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="Ví dụ: lich_su, fpt, cntt (phân cách bằng dấu phẩy)"
                  className="w-full text-xs p-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="pt-3 border-t border-surface-container flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-surface-container hover:bg-surface-container text-on-surface"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-primary text-on-primary hover:bg-primary-hover disabled:opacity-50"
                >
                  {formSubmitting ? "Đang lưu..." : editingItem ? "Cập nhật câu hỏi" : "Tạo câu hỏi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Soft Delete Confirmation */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <span className="material-symbols-outlined text-2xl">warning</span>
              <h3 className="font-bold font-headline text-base text-on-surface">Xác nhận xóa mềm câu hỏi</h3>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Bạn có chắc chắn muốn xóa mềm câu hỏi:
              <br />
              <span className="font-semibold text-on-surface italic mt-1 block">
                &ldquo;{deletingItem.questionText}&rdquo;
              </span>
              <br />
              Dữ liệu sẽ được bảo toàn trong cơ sở dữ liệu với cờ <code className="text-[10px]">deleted_at</code> và không xuất hiện trong bài thi tiếp theo.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 text-xs font-medium rounded-xl border border-surface-container hover:bg-surface-container text-on-surface"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {deleteSubmitting ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Excel Bulk Import */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-surface-container flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">upload_file</span>
                <h2 className="text-lg font-bold font-headline text-on-surface">Import câu hỏi trắc nghiệm từ Excel</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="size-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {importError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs">
                  {importError}
                </div>
              )}

              {/* Upload Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-surface-container-high hover:border-primary/50 bg-surface-container-low/50 hover:bg-surface-container-low rounded-2xl p-6 text-center cursor-pointer transition-colors"
              >
                <input
                  id={importFileInputId}
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <span className="material-symbols-outlined text-4xl text-primary/70 mb-2">cloud_upload</span>
                <div className="text-xs font-semibold text-on-surface">
                  {importFile ? importFile.name : "Kéo thả hoặc nhấn để chọn file Excel (.xlsx)"}
                </div>
                <div className="text-[11px] text-on-surface-variant mt-1">
                  Đảm bảo cấu trúc cột đúng theo mẫu chuẩn của hệ thống.
                </div>
              </div>

              {importLoading && (
                <div className="p-8 text-center space-y-2">
                  <span className="material-symbols-outlined text-3xl animate-spin text-primary">progress_activity</span>
                  <div className="text-xs font-medium text-on-surface">Đang phân tích cấu trúc dữ liệu Excel...</div>
                </div>
              )}

              {/* Preview Result */}
              {importPreview && !importLoading && (
                <div className="space-y-4">
                  {/* Summary Counters */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-surface-container border border-surface-container text-center">
                      <div className="text-[11px] text-on-surface-variant">Tổng số dòng</div>
                      <div className="text-lg font-bold text-on-surface mt-0.5">{importPreview.totalRows}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400">Hợp lệ</div>
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {importPreview.validRows}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                      <div className="text-[11px] text-rose-600 dark:text-rose-400">Lỗi dữ liệu</div>
                      <div className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                        {importPreview.invalidRows}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                      <div className="text-[11px] text-amber-600 dark:text-amber-400">Trùng lặp</div>
                      <div className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                        {importPreview.duplicateRows}
                      </div>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-surface-container rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className="bg-surface-container-low sticky top-0 border-b border-surface-container">
                        <tr>
                          <th className="py-2 px-3 w-12 text-center">Dòng</th>
                          <th className="py-2 px-3">Nội dung câu hỏi</th>
                          <th className="py-2 px-3 w-28">Đáp án đúng</th>
                          <th className="py-2 px-3 w-24">Trạng thái</th>
                          <th className="py-2 px-3">Ghi chú kiểm tra</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container">
                        {importPreview.rows.map((r) => {
                          const isOk = r.validationStatus === "VALID";
                          const isDup = r.validationStatus === "DUPLICATE";
                          return (
                            <tr
                              key={r.rowNumber}
                              className={isOk ? "" : isDup ? "bg-amber-500/5" : "bg-rose-500/5"}
                            >
                              <td className="py-2 px-3 text-center font-medium text-on-surface-variant">
                                {r.rowNumber}
                              </td>
                              <td className="py-2 px-3 text-on-surface font-medium truncate max-w-[200px]">
                                {r.questionText || "(Trống)"}
                              </td>
                              <td className="py-2 px-3">
                                <span className="font-semibold text-emerald-600">
                                  {["A", "B", "C", "D"][r.correctIndex] || r.correctIndex}
                                </span>
                                : {r.options[r.correctIndex] || ""}
                              </td>
                              <td className="py-2 px-3">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                    isOk
                                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                      : isDup
                                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                      : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                  }`}
                                >
                                  {isOk ? "Hợp lệ" : isDup ? "Trùng lặp" : "Lỗi"}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-on-surface-variant">
                                {r.validationErrors.length > 0 ? (
                                  <span className="text-rose-500 font-medium">
                                    {r.validationErrors.join("; ")}
                                  </span>
                                ) : (
                                  <span className="text-emerald-500">Sẵn sàng nhập</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions for errors */}
                  {(importPreview.invalidRows > 0 || importPreview.duplicateRows > 0) && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200">
                      <span>
                        Có {importPreview.invalidRows + importPreview.duplicateRows} dòng không thể nhập. Bạn có thể tải báo cáo lỗi để chỉnh sửa.
                      </span>
                      <button
                        type="button"
                        onClick={handleExportErrors}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 shrink-0"
                      >
                        Tải báo cáo lỗi (.xlsx)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-surface-container flex items-center justify-between shrink-0">
              <a
                href={questionsApi.getTemplateDownloadUrl()}
                download="Mau_Cau_Hoi_Trac_Nghiem.xlsx"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>Tải tệp mẫu</span>
              </a>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-surface-container hover:bg-surface-container text-on-surface"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={!importPreview || importPreview.validRows === 0 || importConfirming}
                  onClick={handleConfirmImport}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-primary text-on-primary hover:bg-primary-hover disabled:opacity-50"
                >
                  {importConfirming
                    ? "Đang ghi vào DB..."
                    : `Xác nhận nhập (${importPreview?.validRows || 0} dòng hợp lệ)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
