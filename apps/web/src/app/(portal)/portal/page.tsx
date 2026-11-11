"use client";

import React, { useState, useSyncExternalStore } from "react";
import { OPEN_DAY_QUIZ_QUESTIONS } from "@/data/campus-data";
import {
  PrototypeParticipantSession,
  readPrototypeSession,
  writePrototypeSession,
} from "@/lib/prototype-auth";
import {
  AuthGateState,
  Button,
  Input,
  LoadingState,
  StatusToast,
} from "@/components/ui";
import {
  DigitalPassCard,
  PersonalItineraryTimeline,
  PortalTabKey,
  StudentProfileHeader,
} from "@/components/portal";
import { CampusQuizStepper } from "@/components/quiz";

const emptySubscribe = () => () => {};

export default function OpenDayPortalPage() {
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [sessionOverride, setSessionOverride] = useState<
    PrototypeParticipantSession | null | undefined
  >(undefined);
  const [activeTab, setActiveTab] = useState<PortalTabKey>("program");

  const [currentPw, setCurrentPw] = useState("");
  const [nextPw, setNextPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const session = !hydrated
    ? null
    : sessionOverride !== undefined
    ? sessionOverride
    : readPrototypeSession();

  if (!hydrated) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <LoadingState label="Đang tải Không gian Tham dự Open Day..." />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <AuthGateState
          title="Khu vực dành cho khách mời Open Day"
          description="Bạn cần đăng nhập bằng tài khoản do Ban Tổ Chức QTSC cấp qua Zalo/Email để xem thẻ Check-in QR, lịch trình cá nhân và tham gia hoạt động trong ngày hội."
          actionLabel="Đăng nhập Open Day"
          actionHref="/login?next=/portal"
          secondaryLabel="Xem lịch trình công khai"
          secondaryHref="/events"
        />
      </div>
    );
  }

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);

    if (!currentPw.trim()) {
      setPwError("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (nextPw.length < 6) {
      setPwError("Mật khẩu mới cần tối thiểu 6 ký tự.");
      return;
    }
    if (nextPw !== confirmPw) {
      setPwError("Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    const updated: PrototypeParticipantSession = {
      ...session,
      mustChangePassword: false,
      updatedPasswordAt: new Date().toLocaleTimeString("vi-VN"),
    };
    writePrototypeSession(updated);
    setSessionOverride(updated);
    setCurrentPw("");
    setNextPw("");
    setConfirmPw("");
    setToastMessage("Đã cập nhật mật khẩu cá nhân thành công (UI Prototype).");
    setToastOpen(true);
  };

  return (
    <div className="space-y-6">
      <StudentProfileHeader
        session={session}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="min-h-[580px]">
        {activeTab === "program" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8">
              <PersonalItineraryTimeline />
            </div>
            <div className="lg:col-span-4">
              <DigitalPassCard session={session} />
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="max-w-3xl mx-auto">
            <CampusQuizStepper
              questions={OPEN_DAY_QUIZ_QUESTIONS}
              ctaHref="/campus"
              ctaLabel="Mở Tour 360° trải nghiệm thực tế"
            />
          </div>
        )}

        {activeTab === "password" && (
        <div className="max-w-lg mx-auto ui-card p-6 sm:p-8 space-y-5">
          <div className="space-y-1">
            <h2 className="type-h2 text-on-surface">Cập nhật mật khẩu tài khoản</h2>
            <p className="type-body-sm text-secondary">
              Thay đổi mật khẩu đăng nhập cho mã tài khoản{" "}
              <span className="font-mono font-semibold text-on-surface">
                {session.accountCode}
              </span>
              .
            </p>
          </div>

          {pwError && (
            <div
              role="alert"
              className="rounded-xl bg-error-container border border-error p-3.5 text-xs text-on-error-container"
            >
              {pwError}
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <Input
              label="Mật khẩu hiện tại"
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="Nhập mật khẩu đang sử dụng"
            />
            <Input
              label="Mật khẩu mới"
              type="password"
              value={nextPw}
              onChange={(e) => setNextPw(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
            />
            <Input
              label="Xác nhận mật khẩu mới"
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
            />

            <Button type="submit" variant="primary" size="md" icon="save" className="w-full">
              Lưu mật khẩu mới
            </Button>
          </form>
        </div>
        )}
      </div>

      <StatusToast
        open={toastOpen}
        type="success"
        message={toastMessage}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
}
