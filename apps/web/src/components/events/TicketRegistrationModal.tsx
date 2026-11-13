"use client";

import React, { useEffect, useState } from "react";
import type { OpenDayTicketDto } from "@fpt-campus/shared";
import { Badge, Button, Input, Modal, QRCodeSVG } from "@/components/ui";
import { fetchPublicTicketByCode, registerPublicOpenDay } from "@/lib/public/public-api";
import { ApiClientError } from "@/lib/auth/api-client";

interface TicketRegistrationModalProps {
  open: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  eventDateLabel: string;
  eventTimeLabel: string;
}

const LOCAL_STORAGE_TICKET_KEY = "fpoly_openday_ticket";

export function TicketRegistrationModal({
  open,
  onClose,
  eventId,
  eventTitle,
  eventDateLabel,
  eventTimeLabel,
}: TicketRegistrationModalProps) {
  const [ticket, setTicket] = useState<OpenDayTicketDto | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Load existing ticket from localStorage on mount or open
  useEffect(() => {
    if (!open) return;
    try {
      const savedTicketJson = localStorage.getItem(LOCAL_STORAGE_TICKET_KEY);
      if (savedTicketJson) {
        const saved = JSON.parse(savedTicketJson) as OpenDayTicketDto;
        if (saved && saved.ticketCode) {
          // Verify with server in background to get latest check-in status
          fetchPublicTicketByCode(saved.ticketCode)
            .then((fresh) => {
              setTicket(fresh);
              localStorage.setItem(LOCAL_STORAGE_TICKET_KEY, JSON.stringify(fresh));
            })
            .catch(() => {
              setTicket(saved);
            });
        }
      }
    } catch {
      // Local storage unreadable or corrupt
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setErrorMessage("Vui lòng nhập họ và tên của bạn.");
      return;
    }

    if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setErrorMessage("Địa chỉ email không đúng định dạng.");
      return;
    }

    if (!trimmedPhone || !/^0[1-9][0-9]{8}$/.test(trimmedPhone)) {
      setErrorMessage("Số điện thoại không hợp lệ (yêu cầu số điện thoại Việt Nam 10 chữ số, ví dụ: 0912345678).");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerPublicOpenDay({
        eventId,
        fullName: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        notes: notes.trim() || undefined,
      });

      setTicket(result);
      try {
        localStorage.setItem(LOCAL_STORAGE_TICKET_KEY, JSON.stringify(result));
      } catch {
        // Local storage quota or disabled
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.status === 409) {
          setErrorMessage("Email này đã được đăng ký tham gia sự kiện trước đó. Vui lòng kiểm tra lại hộp thư.");
        } else {
          setErrorMessage(err.message || "Không thể hoàn tất đăng ký. Vui lòng thử lại.");
        }
      } else {
        setErrorMessage("Lỗi kết nối tới hệ thống. Vui lòng thử lại sau.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = async () => {
    if (!ticket) return;
    try {
      await navigator.clipboard.writeText(ticket.ticketCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Clipboard write failed
    }
  };

  const handleResetForNewTicket = () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_TICKET_KEY);
    } catch {
      // ignore
    }
    setTicket(null);
    setErrorMessage(null);
    setFullName("");
    setEmail("");
    setPhone("");
    setNotes("");
  };

  const isCheckedIn = ticket?.participationStatus === "CHECKED_IN";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={ticket ? "Thẻ Tham Quan Open Day 2026" : "Đăng Ký Tham Gia Open Day"}
      size="md"
    >
      {ticket ? (
        // Ticket View
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg border border-slate-700/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-primary/20 blur-2xl" />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
              <div className="space-y-3 flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <Badge variant={isCheckedIn ? "success" : "brand"}>
                    {isCheckedIn ? "ĐÃ CHECK-IN TẠI QUẦY" : "VÉ HỢP LỆ (CONFIRMED)"}
                  </Badge>
                  <span className="text-xs font-mono text-slate-300">
                    {ticket.eventDateLabel || eventDateLabel}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white leading-snug">
                  {ticket.eventTitle || eventTitle}
                </h3>

                <div className="space-y-1 text-xs text-slate-300">
                  <p>
                    <span className="text-slate-400">Khách tham quan:</span>{" "}
                    <strong className="text-white">{ticket.attendeeName}</strong>
                  </p>
                  <p>
                    <span className="text-slate-400">Email:</span> {ticket.attendeeEmail}
                  </p>
                  <p>
                    <span className="text-slate-400">Số điện thoại:</span> {ticket.attendeePhone}
                  </p>
                  <p>
                    <span className="text-slate-400">Khung giờ:</span> {ticket.eventTimeLabel || eventTimeLabel}
                  </p>
                  {ticket.checkedInAt && (
                    <p className="text-emerald-400 font-semibold">
                      ✓ Đã điểm danh vào: {new Date(ticket.checkedInAt).toLocaleString("vi-VN")}
                    </p>
                  )}
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="px-3 py-1 rounded-lg bg-white/10 font-mono text-sm font-bold tracking-wider text-primary-fixed">
                    {ticket.ticketCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer px-2 py-1 rounded bg-white/5 hover:bg-white/10"
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-[14px]">
                      {copiedCode ? "check" : "content_copy"}
                    </span>
                    <span>{copiedCode ? "Đã chép" : "Chép mã"}</span>
                  </button>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="shrink-0 p-3 bg-white rounded-xl shadow-md flex flex-col items-center">
                <QRCodeSVG
                  value={ticket.qrPayload || `TICKET:${ticket.ticketCode}`}
                  size={140}
                  className="rounded"
                />
                <span className="text-[10px] font-mono text-slate-600 mt-1 font-bold">
                  {ticket.ticketCode}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container text-xs text-secondary space-y-1">
            <p className="font-semibold text-on-surface">
              <span aria-hidden="true" className="material-symbols-outlined text-[16px] align-middle mr-1 text-primary">
                info
              </span>
              Hướng dẫn tham gia ngày hội:
            </p>
            <p>
              Vui lòng xuất trình mã QR này hoặc cung cấp mã vé <strong>{ticket.ticketCode}</strong> tại Bàn Đón Tiếp — Sảnh Innovation (CVPM Quang Trung Q.12) để nhân viên hỗ trợ check-in và nhận quà lưu niệm.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              icon="restart_alt"
              onClick={handleResetForNewTicket}
            >
              Đăng ký vé mới
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon="print"
                onClick={() => window.print()}
              >
                In / Lưu vé
              </Button>
              <Button variant="primary" size="sm" onClick={onClose}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Registration Form
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-secondary">
            Điền thông tin để nhận vé mời tham quan và mã QR check-in tại quầy đón tiếp QTSC.
          </p>

          {errorMessage && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[16px] shrink-0 text-red-600">
                error
              </span>
              <span>{errorMessage}</span>
            </div>
          )}

          <Input
            label="Họ và tên *"
            placeholder="Ví dụ: Nguyễn Văn An"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={isSubmitting}
          />

          <Input
            label="Địa chỉ Email *"
            type="email"
            placeholder="Ví dụ: an.nguyen@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
          />

          <Input
            label="Số điện thoại di động *"
            type="tel"
            placeholder="Ví dụ: 0912345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            disabled={isSubmitting}
          />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface">
              Nhu cầu tư vấn / Ghi chú (không bắt buộc)
            </label>
            <textarea
              rows={2}
              placeholder="Ngành học bạn đang quan tâm hoặc câu hỏi dành cho ban tổ chức..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-surface-container-low">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={isSubmitting ? "hourglass_empty" : "qr_code_2"}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang xử lý..." : "Nhận vé Open Day & QR"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
