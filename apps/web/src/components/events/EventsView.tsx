"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type {
  OpenDayTicketDto,
  PublicEventsResponseDto,
} from "@fpt-campus/shared";
import { Badge, Button, ErrorState, LoadingState } from "@/components/ui";
import { BlurText, FadeContent } from "@/components/animations";
import { OFFICIAL_CAMPUS_INFO } from "@/data/campus-data";
import { FALLBACK_OPEN_DAY_EVENTS, fetchPublicEvents } from "@/lib/public/public-api";
import { OpenDayScheduleTimeline } from "./OpenDayScheduleTimeline";
import { EventPillarGrid } from "./EventPillarGrid";
import { TicketRegistrationModal } from "./TicketRegistrationModal";

const LOCAL_STORAGE_TICKET_KEY = "fpoly_openday_ticket";

function getInitialSavedTicket(): { hasTicket: boolean; code: string | null } {
  if (typeof window === "undefined") return { hasTicket: false, code: null };
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_TICKET_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as OpenDayTicketDto;
      if (parsed?.ticketCode) {
        return { hasTicket: true, code: parsed.ticketCode };
      }
    }
  } catch {
    // ignore
  }
  return { hasTicket: false, code: null };
}

export function EventsView() {
  const [data, setData] = useState<PublicEventsResponseDto | null>(FALLBACK_OPEN_DAY_EVENTS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [savedTicket, setSavedTicket] = useState(getInitialSavedTicket);

  // Sync saved ticket when modal closes
  const handleModalClose = () => {
    setModalOpen(false);
    setSavedTicket(getInitialSavedTicket());
  };

  const loadEvents = () => {
    setIsLoading(true);
    setError(null);
    fetchPublicEvents()
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Không thể tải dữ liệu sự kiện.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    let cancelled = false;
    fetchPublicEvents()
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Không thể tải dữ liệu sự kiện.");
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <LoadingState label="Đang tải lịch trình và thông tin Open Day..." />
      </div>
    );
  }

  if (error || !data || !data.event) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <ErrorState
          title="Không thể tải sự kiện Open Day"
          description={error ?? "Sự kiện hiện chưa được mở công khai trên hệ thống."}
          actionLabel="Thử lại"
          onAction={loadEvents}
        />
      </div>
    );
  }

  const { event, sessions, faqs } = data;

  return (
    <div className="bg-surface min-h-screen">
      {/* Editorial Header with Registration Action */}
      <section className="bg-slate-900 text-white py-12 sm:py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-4 max-w-2xl rb-desktop-rise">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand">Sự kiện tại QTSC Quận 12</Badge>
              <span className="text-xs font-mono text-slate-300">
                {event.dateLabel} · {event.timeLabel}
              </span>
            </div>

            <h1 className="type-h1 sm:text-4xl text-white">
              {event.title}
            </h1>
            <p className="type-body text-slate-300 leading-relaxed">
              {event.subtitle ||
                `Địa điểm: ${OFFICIAL_CAMPUS_INFO.address}. Khách tham quan tự do theo dõi lịch trình bên dưới và định hướng trước vị trí các khu vực bằng Bản đồ GIS & Tham quan 360°.`}
            </p>

            {/* Live Countdown Timer Widget */}
            <div className="pt-2 flex items-center gap-2.5 sm:gap-3 text-center">
              <div className="bg-white/10 backdrop-blur rounded-xl px-3.5 py-2 border border-white/10 min-w-[62px]">
                <span className="font-heading text-xl sm:text-2xl font-black text-primary block leading-none">12</span>
                <span className="text-[10px] text-slate-300 uppercase font-semibold">Ngày</span>
              </div>
              <span className="text-xl font-bold text-slate-400">:</span>
              <div className="bg-white/10 backdrop-blur rounded-xl px-3.5 py-2 border border-white/10 min-w-[62px]">
                <span className="font-heading text-xl sm:text-2xl font-black text-white block leading-none">08</span>
                <span className="text-[10px] text-slate-300 uppercase font-semibold">Giờ</span>
              </div>
              <span className="text-xl font-bold text-slate-400">:</span>
              <div className="bg-white/10 backdrop-blur rounded-xl px-3.5 py-2 border border-white/10 min-w-[62px]">
                <span className="font-heading text-xl sm:text-2xl font-black text-white block leading-none">45</span>
                <span className="text-[10px] text-slate-300 uppercase font-semibold">Phút</span>
              </div>
              <span className="text-xl font-bold text-slate-400">:</span>
              <div className="bg-white/10 backdrop-blur rounded-xl px-3.5 py-2 border border-white/10 min-w-[62px]">
                <span className="font-heading text-xl sm:text-2xl font-black text-amber-400 block leading-none">30</span>
                <span className="text-[10px] text-slate-300 uppercase font-semibold">Giây</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 rb-desktop-rise-delay">
            {/* Primary CTA: Ticket Registration or View Saved Ticket */}
            <Button
              variant="primary"
              size="md"
              icon={savedTicket.hasTicket ? "confirmation_number" : "qr_code_2"}
              onClick={() => setModalOpen(true)}
              className="font-bold min-h-[46px] shadow-lg shadow-primary/20"
            >
              {savedTicket.hasTicket
                ? `Xem vé của tôi (${savedTicket.code})`
                : "Đăng ký nhận vé QR"}
            </Button>

            <Link
              href="/campus"
              className="ui-btn min-h-[46px] px-4 py-2.5 text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors inline-flex items-center gap-2"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                360
              </span>
              <span>Tham quan 360°</span>
            </Link>

            <Link
              href="/map?building=INNOVATION"
              className="ui-btn min-h-[46px] px-4 py-2.5 text-sm font-semibold bg-white/10 text-white border border-white/20 hover:bg-white/15"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                map
              </span>
              <span>Bản đồ đón tiếp</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-14">
        {/* Schedule Section */}
        <section aria-labelledby="schedule-heading" className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <p className="type-label text-primary">Thời khóa biểu ngày hội</p>
              <BlurText
                as="h2"
                id="schedule-heading"
                text="Lịch trình dự kiến Open Day"
                className="type-h2 text-on-surface"
              />
            </div>

            <FadeContent delay={0.1}>
              <div className="flex items-center gap-4">
                <p className="text-xs text-secondary">
                  Cần tư vấn ngành học hoặc đăng ký tuyển sinh?{" "}
                  <a
                    href={OFFICIAL_CAMPUS_INFO.officialAdmissionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-primary hover:underline"
                  >
                    Truy cập caodang.fpt.edu.vn
                  </a>
                </p>
              </div>
            </FadeContent>
          </div>

          <OpenDayScheduleTimeline sessions={sessions} />
        </section>

        {/* FAQs Section */}
        {faqs && faqs.length > 0 && (
          <section aria-labelledby="faqs-heading" className="space-y-6 pt-4 border-t border-surface-container-low">
            <div className="space-y-1">
              <p className="type-label text-primary">Giải đáp thắc mắc</p>
              <h2 id="faqs-heading" className="type-h2 text-on-surface">
                Câu hỏi thường gặp về Open Day &amp; Khuôn viên
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="p-5 rounded-2xl bg-surface-container-low border border-surface-container space-y-2"
                >
                  <h3 className="font-bold text-sm text-on-surface flex items-start gap-2">
                    <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">
                      help
                    </span>
                    <span>{faq.question}</span>
                  </h3>
                  <p className="text-xs text-secondary leading-relaxed pl-6">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <EventPillarGrid />
      </div>

      {/* Registration & QR Ticket Modal */}
      {event && (
        <TicketRegistrationModal
          open={modalOpen}
          onClose={handleModalClose}
          eventId={event.id}
          eventTitle={event.title}
          eventDateLabel={event.dateLabel}
          eventTimeLabel={event.timeLabel}
        />
      )}
    </div>
  );
}
