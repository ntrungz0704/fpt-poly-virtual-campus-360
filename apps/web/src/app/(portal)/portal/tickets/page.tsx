"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { PortalTicketDto } from "@fpt-campus/shared";
import { Badge, Button, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { QRCodeSVG } from "@/components/ui/QRCodeSVG";
import { portalApi } from "@/lib/portal/portal-api";

export default function StudentTicketsPage() {
  const [tickets, setTickets] = useState<PortalTicketDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<PortalTicketDto | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await portalApi.getTickets();
        if (!active) return;
        setTickets(data);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Không thể tải danh sách vé.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <LoadingState label="Đang tải danh sách vé sự kiện của bạn..." className="max-w-2xl mx-auto py-12" />;
  }

  if (error) {
    return (
      <ErrorState
        title="Lỗi tải danh sách vé"
        description={error}
        actionLabel="Thử lại"
        onAction={() => window.location.reload()}
        className="max-w-xl mx-auto py-12"
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6" data-testid="student-tickets-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-h2 text-on-surface">Vé Open Day của tôi</h1>
          <p className="type-body-sm text-secondary mt-0.5">
            Quản lý vé tham dự và mã QR điểm danh tại các phiên sự kiện Open Day FPT Polytechnic.
          </p>
        </div>
        <Link href="/events" className="ui-btn ui-btn-primary min-h-[42px] px-4 py-2 text-xs">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            add_circle
          </span>
          <span>Đăng ký thêm sự kiện</span>
        </Link>
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          icon="confirmation_number"
          title="Bạn chưa có vé tham dự Open Day nào"
          description="Hãy khám phá các sự kiện Open Day sắp tới tại FPT Polytechnic QTSC Quận 12 để đăng ký nhận vé và mã QR."
          actionLabel="Xem lịch sự kiện Open Day"
          actionHref="/events"
          className="ui-card p-10"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tickets.map((t) => {
            const isCheckedIn = t.participationStatus === "CHECKED_IN";
            return (
              <div
                key={t.id}
                className="ui-card ui-card-hover p-6 flex flex-col justify-between gap-5 border border-surface-container-high"
                data-testid={`ticket-card-${t.ticketCode}`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs font-bold text-primary px-2.5 py-1 rounded-md bg-primary-fixed">
                      {t.ticketCode}
                    </span>
                    <Badge variant={isCheckedIn ? "success" : "brand"}>
                      {isCheckedIn ? "Đã Check-in" : "Hợp lệ / Sẵn sàng"}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <h3 className="type-h3 text-on-surface line-clamp-2">{t.eventTitle}</h3>
                    <p className="text-xs text-secondary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">
                        schedule
                      </span>
                      <span>
                        {t.eventDateLabel} · {t.eventTimeLabel}
                      </span>
                    </p>
                  </div>

                  {t.sessions.length > 0 && (
                    <div className="pt-3 border-t border-surface-container space-y-1.5">
                      <p className="text-xs font-semibold text-on-surface">Phiên hoạt động đã chọn:</p>
                      <ul className="space-y-1 text-xs text-secondary">
                        {t.sessions.map((s) => (
                          <li key={s.id} className="flex items-center gap-1.5 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            <span className="font-medium text-on-surface truncate">{s.title}</span>
                            <span className="text-[11px] shrink-0">({s.location})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-surface-container flex items-center justify-between gap-3">
                  <div className="text-xs text-secondary">
                    Người tham dự: <strong className="text-on-surface">{t.attendeeName}</strong>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    icon="qr_code"
                    onClick={() => setSelectedTicket(t)}
                    data-testid={`view-qr-btn-${t.ticketCode}`}
                  >
                    Mở mã QR
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Modal */}
      {selectedTicket && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="ui-card max-w-sm w-full p-6 sm:p-8 space-y-5 bg-surface text-center shadow-2xl relative">
            <button
              type="button"
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 text-secondary hover:text-on-surface p-1 rounded-lg"
              aria-label="Đóng"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="space-y-1 text-center">
              <Badge variant="brand">{selectedTicket.ticketCode}</Badge>
              <h3 className="type-h3 text-on-surface pt-1">{selectedTicket.eventTitle}</h3>
              <p className="text-xs text-secondary">{selectedTicket.attendeeName}</p>
            </div>

            <div className="flex justify-center p-4 bg-white rounded-2xl border-2 border-primary/20 shadow-inner">
              <QRCodeSVG value={selectedTicket.qrPayload} size={200} />
            </div>

            <p className="text-xs text-secondary leading-relaxed">
              Xuất trình mã QR này tại bàn lễ tân hoặc phòng hội trường CVPM Quang Trung để Check-in nhận quà và tích điểm XP.
            </p>

            <Button variant="primary" size="md" className="w-full" onClick={() => setSelectedTicket(null)}>
              Đã hiểu
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
