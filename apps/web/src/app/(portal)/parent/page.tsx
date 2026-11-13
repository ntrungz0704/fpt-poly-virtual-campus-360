"use client";

import React, { useCallback, useEffect, useState } from "react";
import type {
  CreateLinkRequest,
  ParentStudentDetailDto,
  ParentStudentSummaryDto,
  StudentLinkRequestItemDto,
} from "@fpt-campus/shared";
import { Badge, Button, EmptyState, ErrorState, Input, LoadingState } from "@/components/ui";
import { portalApi } from "@/lib/portal/portal-api";

export default function ParentPortalPage() {
  const [students, setStudents] = useState<ParentStudentSummaryDto[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<StudentLinkRequestItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Link modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentIdentifier, setStudentIdentifier] = useState("");
  const [relationship, setRelationship] = useState("Phụ huynh");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Detail view
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentDetail, setStudentDetail] = useState<ParentStudentDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const reloadData = useCallback(async () => {
    try {
      const [studentsData, incoming] = await Promise.all([
        portalApi.getLinkedStudents(),
        portalApi.getStudentLinkRequests(),
      ]);
      setStudents(studentsData);
      setIncomingRequests(incoming);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu Cổng Phụ huynh.");
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        setLoading(true);
        setError(null);
        const [studentsData, incoming] = await Promise.all([
          portalApi.getLinkedStudents(),
          portalApi.getStudentLinkRequests(),
        ]);
        if (!active) return;
        setStudents(studentsData);
        setIncomingRequests(incoming);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Không thể tải dữ liệu Cổng Phụ huynh.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void init();
    return () => {
      active = false;
    };
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !studentIdentifier.trim()) return;

    setSubmitting(true);
    setSuccessMsg(null);
    try {
      const payload: CreateLinkRequest = {
        studentIdentifier: studentIdentifier.trim(),
        relationship: relationship.trim() || null,
        notes: notes.trim() || null,
      };
      await portalApi.createLinkRequest(payload);
      setSuccessMsg("Yêu cầu liên kết đã được gửi! Vui lòng chờ sinh viên xác nhận.");
      setStudentIdentifier("");
      setNotes("");
      setShowAddModal(false);
      void reloadData();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gửi yêu cầu liên kết thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespondRequest = async (linkId: string, action: "APPROVE" | "REJECT") => {
    try {
      await portalApi.respondLinkRequest(linkId, action);
      void reloadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xử lý yêu cầu thất bại.");
    }
  };

  const handleViewDetail = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setDetailLoading(true);
    try {
      const detail = await portalApi.getLinkedStudentDetail(studentId);
      setStudentDetail(detail);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể tải chi tiết sinh viên.");
      setSelectedStudentId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) {
    return <LoadingState label="Đang tải dữ liệu Cổng Phụ huynh..." className="max-w-2xl mx-auto py-12" />;
  }

  if (error) {
    return (
      <ErrorState
        title="Lỗi Cổng Phụ huynh"
        description={error}
        actionLabel="Thử lại"
        onAction={() => void reloadData()}
        className="max-w-xl mx-auto py-12"
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6" data-testid="parent-portal-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-h2 text-on-surface">Cổng thông tin Phụ huynh & Gia đình</h1>
          <p className="type-body-sm text-secondary mt-0.5">
            Theo dõi hành trình trải nghiệm Open Day, tiến độ tích lũy điểm và sự kiện của con em tại FPT Polytechnic.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon="person_add"
          onClick={() => setShowAddModal(true)}
          data-testid="add-student-link-btn"
        >
          Liên kết sinh viên mới
        </Button>
      </div>

      {successMsg && (
        <div
          role="status"
          className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs sm:text-sm text-emerald-950 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px] text-emerald-600" aria-hidden="true">
            check_circle
          </span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Incoming requests for Student (if any) */}
      {incomingRequests.filter((r) => r.status === "PENDING").length > 0 && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50/70 p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
            <span className="material-symbols-outlined text-[18px] text-amber-600">notifications_active</span>
            <span>Yêu cầu liên kết từ Phụ huynh đang chờ bạn duyệt:</span>
          </div>
          <div className="space-y-2">
            {incomingRequests
              .filter((r) => r.status === "PENDING")
              .map((req) => (
                <div
                  key={req.linkId}
                  className="bg-white rounded-xl p-3.5 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-on-surface">{req.parentName}</p>
                    <p className="text-secondary">
                      Email: {req.parentEmail} · Quan hệ: {req.relationship || "Phụ huynh"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleRespondRequest(req.linkId, "APPROVE")}
                    >
                      Đồng ý
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRespondRequest(req.linkId, "REJECT")}
                    >
                      Từ chối
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Linked Students List */}
      <section className="space-y-4">
        <h2 className="type-h3 text-on-surface">Danh sách sinh viên đã liên kết</h2>

        {students.length === 0 ? (
          <EmptyState
            icon="family_restroom"
            title="Chưa có sinh viên nào được liên kết với tài khoản này"
            description="Bạn có thể gửi yêu cầu liên kết tới email hoặc mã số sinh viên của con em mình để bắt đầu đồng hành."
            actionLabel="Gửi yêu cầu liên kết ngay"
            onAction={() => setShowAddModal(true)}
            className="ui-card p-10"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.map((s) => {
              const isApproved = s.status === "APPROVED";
              return (
                <div
                  key={s.linkId}
                  className="ui-card ui-card-hover p-6 flex flex-col justify-between gap-4 border border-surface-container"
                  data-testid={`linked-student-${s.studentId}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-secondary">
                        Quan hệ: {s.relationship || "Phụ huynh"}
                      </span>
                      <Badge variant={isApproved ? "success" : "neutral"}>
                        {isApproved ? "Đã liên kết" : "Chờ xác nhận"}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="type-h3 text-on-surface">{s.studentName}</h3>
                      <p className="text-xs text-secondary font-mono">
                        {s.studentCode ? `MSSV: ${s.studentCode}` : s.studentEmail || "Chưa có MSSV"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-container text-xs">
                      <div>
                        <span className="text-secondary font-medium">Điểm tích lũy</span>
                        <p className="font-bold text-primary font-mono text-sm">{s.totalXp} XP</p>
                      </div>
                      <div>
                        <span className="text-secondary font-medium">Vé sự kiện</span>
                        <p className="font-bold text-on-surface text-sm">{s.ticketsCount} vé</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-surface-container flex items-center justify-between">
                    <span className="text-[11px] text-secondary">
                      Chuyên ngành: <strong>{s.major || "Chưa cập nhật"}</strong>
                    </span>
                    {isApproved && (
                      <Button
                        variant="outline"
                        size="sm"
                        loading={detailLoading && selectedStudentId === s.studentId}
                        onClick={() => handleViewDetail(s.studentId)}
                        data-testid={`view-student-${s.studentId}`}
                      >
                        Xem chi tiết
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Add Link Modal */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="ui-card max-w-md w-full p-6 sm:p-8 space-y-5 bg-surface shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-secondary hover:text-on-surface p-1 rounded-lg"
              aria-label="Đóng"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="space-y-1">
              <h3 className="type-h2 text-on-surface">Liên kết sinh viên</h3>
              <p className="type-body-sm text-secondary">
                Nhập email hoặc mã sinh viên của con em bạn để gửi yêu cầu phê duyệt liên kết.
              </p>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <Input
                label="Email hoặc Mã số Sinh viên"
                value={studentIdentifier}
                onChange={(e) => setStudentIdentifier(e.target.value)}
                placeholder="Ví dụ: student1@poly.edu.vn"
                required
              />
              <Input
                label="Mối quan hệ"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="Ví dụ: Bố, Mẹ, Người bảo hộ..."
              />
              <Input
                label="Ghi chú (Tùy chọn)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Lời nhắn cho con em..."
              />

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                  Hủy
                </Button>
                <Button type="submit" variant="primary" size="sm" loading={submitting}>
                  Gửi yêu cầu
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudentId && studentDetail && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="ui-card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 bg-surface shadow-2xl relative">
            <button
              type="button"
              onClick={() => {
                setSelectedStudentId(null);
                setStudentDetail(null);
              }}
              className="absolute top-4 right-4 text-secondary hover:text-on-surface p-1 rounded-lg"
              aria-label="Đóng"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="brand">{studentDetail.relationship || "Phụ huynh"}</Badge>
                <Badge variant="success">Liên kết hợp lệ</Badge>
              </div>
              <h2 className="type-h2 text-on-surface">{studentDetail.student.fullName}</h2>
              <p className="text-xs text-secondary font-mono">{studentDetail.student.email}</p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl bg-surface-container-low p-3 space-y-0.5">
                <span className="text-secondary">Điểm kinh nghiệm</span>
                <p className="text-base font-bold text-primary font-mono">{studentDetail.gamification.totalXp} XP</p>
              </div>
              <div className="rounded-xl bg-surface-container-low p-3 space-y-0.5">
                <span className="text-secondary">Cấp bậc</span>
                <p className="text-base font-bold text-on-surface">Cấp {studentDetail.gamification.level}</p>
              </div>
              <div className="rounded-xl bg-surface-container-low p-3 space-y-0.5">
                <span className="text-secondary">Vé Open Day</span>
                <p className="text-base font-bold text-on-surface">{studentDetail.tickets.length} vé</p>
              </div>
            </div>

            {/* Tickets */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-on-surface">Vé sự kiện đã đăng ký:</h3>
              {studentDetail.tickets.length === 0 ? (
                <p className="text-xs text-secondary">Sinh viên chưa đăng ký vé sự kiện nào.</p>
              ) : (
                <ul className="space-y-2">
                  {studentDetail.tickets.map((t) => (
                    <li
                      key={t.id}
                      className="p-3 rounded-xl border border-surface-container bg-surface-container-low/40 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-medium">
                        <span className="font-bold text-on-surface">{t.eventTitle}</span>
                        <Badge variant="brand">{t.ticketCode}</Badge>
                      </div>
                      <p className="text-secondary">
                        {t.eventDateLabel} · {t.eventTimeLabel} · Trạng thái: {t.participationStatus}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button
              variant="outline"
              size="md"
              className="w-full"
              onClick={() => {
                setSelectedStudentId(null);
                setStudentDetail(null);
              }}
            >
              Đóng chi tiết
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
