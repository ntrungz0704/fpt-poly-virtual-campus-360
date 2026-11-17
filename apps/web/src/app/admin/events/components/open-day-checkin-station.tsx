"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import type {
  AdminOpenDayEventDto,
  OpenDayAttendanceStatsDto,
} from "@fpt-campus/shared";
import { Badge, Button } from "@/components/ui";
import {
  extractTicketCodeFromQr,
  shouldAcceptScanDetection,
  type CheckInOutcomeView,
} from "@/lib/admin/qr-scanner-utils";
import { cn } from "@/lib/utils";

type CameraState =
  | "idle"
  | "requesting"
  | "active"
  | "permission-denied"
  | "not-supported"
  | "error";

interface NativeBarcodeDetector {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue?: string }>>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): NativeBarcodeDetector;
}

interface OpenDayCheckInStationProps {
  selectedEvent: AdminOpenDayEventDto | null;
  stats: OpenDayAttendanceStatsDto | null;
  isLoadingStats: boolean;
  isCheckingIn: boolean;
  lastOutcome: CheckInOutcomeView | null;
  recentOutcomes: CheckInOutcomeView[];
  onClearOutcome: () => void;
  onRefreshStats: () => void;
  onSubmitCheckIn: (rawCode: string, source: "camera" | "manual") => Promise<void>;
}

export function OpenDayCheckInStation({
  selectedEvent,
  stats,
  isLoadingStats,
  isCheckingIn,
  lastOutcome,
  recentOutcomes,
  onClearOutcome,
  onRefreshStats,
  onSubmitCheckIn,
}: OpenDayCheckInStationProps) {
  const [quickTicketCode, setQuickTicketCode] = useState("");
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [cameraErrorDetail, setCameraErrorDetail] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameCheckRef = useRef<number>(0);
  const lastAcceptedScanRef = useRef<{ code: string; atMs: number } | null>(null);
  const detectorRef = useRef<NativeBarcodeDetector | null>(null);

  // Refs synced with latest props via effect so animation loop never reads stale state
  const isCheckingInRef = useRef(isCheckingIn);
  const isReviewHoldRef = useRef(Boolean(lastOutcome));
  const submitRef = useRef(onSubmitCheckIn);

  useEffect(() => {
    isCheckingInRef.current = isCheckingIn;
    isReviewHoldRef.current = Boolean(lastOutcome);
    submitRef.current = onSubmitCheckIn;
  }, [isCheckingIn, lastOutcome, onSubmitCheckIn]);

  const stopCameraStream = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(
    async (requestedFacing: "environment" | "user") => {
      if (
        typeof window === "undefined" ||
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== "function"
      ) {
        setCameraState("not-supported");
        setCameraErrorDetail(
          typeof window !== "undefined" && !window.isSecureContext
            ? "Trình duyệt chặn camera trên kết nối không bảo mật (cần HTTPS hoặc localhost). Vui lòng nhập mã vé thủ công hoặc dùng máy quét QR cổng USB."
            : "Thiết bị hoặc trình duyệt hiện tại không hỗ trợ truy cập Camera WebRTC.",
        );
        return;
      }

      stopCameraStream();
      setCameraState("requesting");
      setCameraErrorDetail(null);

      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: requestedFacing },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        } catch (constraintErr) {
          // Fallback to generic video constraint if specific facingMode is unsupported on desktop webcams
          const errName =
            constraintErr instanceof DOMException ? constraintErr.name : "";
          if (errName === "OverconstrainedError" || errName === "ConstraintNotSatisfiedError") {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
          } else {
            throw constraintErr;
          }
        }

        streamRef.current = stream;

        if (navigator.mediaDevices.enumerateDevices) {
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter((d) => d.kind === "videoinput");
            setHasMultipleCameras(videoInputs.length > 1);
          } catch {
            // ignore enumerate error
          }
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }

        setCameraState("active");
      } catch (err) {
        stopCameraStream();
        const errName = err instanceof DOMException ? err.name : "";

        if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
          setCameraState("permission-denied");
          setCameraErrorDetail(
            "Quyền truy cập camera đã bị từ chối. Hãy bấm vào biểu tượng ổ khóa / camera trên thanh địa chỉ trình duyệt để cấp quyền, sau đó bấm 'Thử lại'.",
          );
        } else if (
          errName === "NotFoundError" ||
          errName === "DevicesNotFoundError"
        ) {
          setCameraState("not-supported");
          setCameraErrorDetail(
            "Không tìm thấy camera khả dụng trên thiết bị này. Bạn vẫn có thể check-in bằng ô nhập mã vé hoặc máy quét QR cầm tay.",
          );
        } else {
          setCameraState("error");
          setCameraErrorDetail(
            err instanceof Error && err.message
              ? `Không thể khởi động camera (${err.message}).`
              : "Không thể khởi động camera. Vui lòng kiểm tra ứng dụng khác có đang chiếm camera không.",
          );
        }
      }
    },
    [stopCameraStream],
  );

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Attach stream whenever video element mounts while active
  useEffect(() => {
    if (cameraState === "active" && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        void videoRef.current.play().catch(() => undefined);
      }
    }
  }, [cameraState]);

  // Real QR decoding loop (BarcodeDetector + jsQR universal fallback)
  useEffect(() => {
    if (cameraState !== "active") {
      return;
    }

    if (!detectorRef.current && typeof window !== "undefined") {
      const globalWithDetector = window as unknown as {
        BarcodeDetector?: BarcodeDetectorConstructor;
      };
      if (typeof globalWithDetector.BarcodeDetector === "function") {
        try {
          detectorRef.current = new globalWithDetector.BarcodeDetector({
            formats: ["qr_code"],
          });
        } catch {
          detectorRef.current = null;
        }
      }
    }

    let cancelled = false;

    const scanTick = async (timestamp: number) => {
      if (cancelled) return;

      // Throttle decoding to ~8 FPS to preserve mobile CPU & battery
      if (
        timestamp - lastFrameCheckRef.current >= 120 &&
        !isCheckingInRef.current &&
        !isReviewHoldRef.current &&
        videoRef.current &&
        videoRef.current.readyState >= 2 &&
        videoRef.current.videoWidth > 0 &&
        videoRef.current.videoHeight > 0
      ) {
        lastFrameCheckRef.current = timestamp;
        const video = videoRef.current;

        if (!canvasRef.current) {
          canvasRef.current = document.createElement("canvas");
        }
        const canvas = canvasRef.current;
        const maxDim = 720;
        const scale = Math.min(
          1,
          maxDim / Math.max(video.videoWidth, video.videoHeight),
        );
        const width = Math.max(1, Math.floor(video.videoWidth * scale));
        const height = Math.max(1, Math.floor(video.videoHeight * scale));

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
          let rawPayload: string | null = null;

          if (detectorRef.current) {
            try {
              const detected = await detectorRef.current.detect(canvas);
              const firstValue = detected.find((d) => Boolean(d.rawValue))?.rawValue;
              if (firstValue) {
                rawPayload = firstValue;
              }
            } catch {
              // Fallback to jsQR below
            }
          }

          if (!rawPayload) {
            const imgData = ctx.getImageData(0, 0, width, height);
            const qrResult = jsQR(imgData.data, width, height, {
              inversionAttempts: "dontInvert",
            });
            if (qrResult?.data) {
              rawPayload = qrResult.data;
            }
          }

          if (rawPayload && !cancelled) {
            const extractedCode = extractTicketCodeFromQr(rawPayload);
            const nowMs = Date.now();
            if (
              shouldAcceptScanDetection(
                extractedCode,
                lastAcceptedScanRef.current,
                nowMs,
                3500,
              )
            ) {
              lastAcceptedScanRef.current = {
                code: extractedCode,
                atMs: nowMs,
              };
              await submitRef.current(extractedCode, "camera");
            }
          }
        }
      }

      if (!cancelled) {
        rafRef.current = requestAnimationFrame((ts) => {
          void scanTick(ts);
        });
      }
    };

    rafRef.current = requestAnimationFrame((ts) => {
      void scanTick(ts);
    });

    return () => {
      cancelled = true;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [cameraState]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const extracted = extractTicketCodeFromQr(quickTicketCode);
    if (!extracted) {
      onShowManualEmpty();
      return;
    }
    await onSubmitCheckIn(extracted, "manual");
    setQuickTicketCode("");
  };

  const onShowManualEmpty = () => {
    inputRef.current?.focus();
  };

  const handleContinueNextScan = () => {
    onClearOutcome();
    lastAcceptedScanRef.current = null;
    if (cameraState !== "active") {
      inputRef.current?.focus();
    }
  };

  const handleSwitchCamera = () => {
    const nextFacing = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextFacing);
    void startCamera(nextFacing);
  };

  const isStatsReady = stats !== null;
  const validTickets = stats?.totalValidTickets ?? 0;
  const checkedInCount = stats?.totalCheckedIn ?? 0;
  const notCheckedInCount = stats?.totalNotCheckedIn ?? 0;
  const cancelledCount = stats?.totalCancelled ?? 0;
  const attendanceRate = stats?.attendanceRate ?? 0;

  return (
    <div className="space-y-5" data-testid="open-day-checkin-station">
      {/* Phase E: Real PostgreSQL Attendance Dashboard */}
      <section
        aria-label="Thống kê tham dự sự kiện Open Day"
        data-testid="attendance-dashboard"
        className="ui-card p-4 sm:p-5 space-y-4 border border-surface-container"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-primary text-[20px]"
              >
                analytics
              </span>
              <h2 className="text-sm sm:text-base font-bold text-on-surface">
                Thống kê tham dự thực tế
              </h2>
              {selectedEvent && (
                <Badge variant={selectedEvent.status === "PUBLISHED" ? "success" : "warning"}>
                  {selectedEvent.status}
                </Badge>
              )}
            </div>
            <p className="text-xs text-secondary mt-0.5">
              {selectedEvent
                ? `${selectedEvent.title} · ${selectedEvent.dateLabel}`
                : "Chọn một sự kiện để xem số liệu điểm danh"}
              {" · "}
              <span className="font-medium">
                Công thức: Đã check-in / Tổng vé hợp lệ × 100% (không tính vé hủy)
              </span>
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            icon="refresh"
            loading={isLoadingStats}
            onClick={onRefreshStats}
            data-testid="refresh-attendance-stats-btn"
          >
            Làm mới số liệu
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="rounded-2xl p-3.5 bg-surface-container-low border border-surface-container space-y-1">
            <p className="text-[11px] font-semibold text-secondary uppercase tracking-wider">
              Tổng vé hợp lệ
            </p>
            <p
              className="text-2xl font-extrabold font-mono text-on-surface"
              data-testid="stat-total-valid"
            >
              {isStatsReady ? validTickets : "--"}
            </p>
            <p className="text-[11px] text-secondary">
              Xác nhận: {isStatsReady ? stats.totalConfirmed : "--"} · Mời: {isStatsReady ? stats.totalInvited : "--"}
            </p>
          </div>

          <div className="rounded-2xl p-3.5 bg-emerald-50/70 border border-emerald-200 space-y-1">
            <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
              Đã check-in
            </p>
            <p
              className="text-2xl font-extrabold font-mono text-emerald-700"
              data-testid="stat-checked-in"
            >
              {isStatsReady ? checkedInCount : "--"}
            </p>
            <p className="text-[11px] text-emerald-700">Đã có mặt tại sảnh</p>
          </div>

          <div className="rounded-2xl p-3.5 bg-amber-50/70 border border-amber-200 space-y-1">
            <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
              Chưa check-in
            </p>
            <p
              className="text-2xl font-extrabold font-mono text-amber-700"
              data-testid="stat-not-checked-in"
            >
              {isStatsReady ? notCheckedInCount : "--"}
            </p>
            <p className="text-[11px] text-amber-700">Vé hợp lệ đang chờ</p>
          </div>

          <div className="rounded-2xl p-3.5 bg-slate-50 border border-slate-200 space-y-1">
            <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Vé bị hủy
            </p>
            <p
              className="text-2xl font-extrabold font-mono text-slate-700"
              data-testid="stat-cancelled"
            >
              {isStatsReady ? cancelledCount : "--"}
            </p>
            <p className="text-[11px] text-slate-500">Không tính vào vé hợp lệ</p>
          </div>

          <div className="col-span-2 lg:col-span-1 rounded-2xl p-3.5 bg-primary-fixed/50 border border-primary/25 space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                Tỷ lệ tham dự
              </p>
              <span
                className="text-lg font-extrabold font-mono text-primary"
                data-testid="stat-attendance-rate"
              >
                {isStatsReady ? `${attendanceRate}%` : "--"}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/80 overflow-hidden border border-primary/15">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, attendanceRate))}%` }}
              />
            </div>
            <p className="text-[11px] text-secondary">
              {isStatsReady ? `${checkedInCount} / ${validTickets} vé hợp lệ` : "Đang tải từ PostgreSQL..."}
            </p>
          </div>
        </div>
      </section>

      {/* Phase D: Responsive Mobile-First QR Scanner & Check-in Station */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Live Camera QR Scanner */}
        <div className="lg:col-span-6 ui-card p-4 sm:p-5 space-y-4 border border-surface-container">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-primary text-[22px]"
              >
                qr_code_scanner
              </span>
              <div>
                <h3 className="text-sm font-bold text-on-surface">
                  Quét mã QR bằng Camera
                </h3>
                <p className="text-[11px] text-secondary">
                  Ưu tiên camera sau trên điện thoại tại cổng đón tiếp
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cameraState === "active" && hasMultipleCameras && (
                <Button
                  size="sm"
                  variant="outline"
                  icon="cameraswitch"
                  onClick={handleSwitchCamera}
                >
                  Đổi camera
                </Button>
              )}
              {cameraState === "active" ? (
                <Button
                  size="sm"
                  variant="outline"
                  icon="videocam_off"
                  onClick={() => {
                    stopCameraStream();
                    setCameraState("idle");
                  }}
                  data-testid="stop-camera-btn"
                >
                  Tắt Camera
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="primary"
                  icon="photo_camera"
                  loading={cameraState === "requesting"}
                  onClick={() => void startCamera(facingMode)}
                  data-testid="start-camera-btn"
                >
                  {cameraState === "requesting"
                    ? "Đang xin quyền..."
                    : "Bật Camera Quét QR"}
                </Button>
              )}
            </div>
          </div>

          {/* Camera Viewport */}
          <div
            className={cn(
              "relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center",
              cameraState === "active"
                ? "aspect-[4/3] sm:aspect-video"
                : "min-h-[280px] sm:aspect-video py-2",
            )}
          >
            {cameraState === "active" && (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="w-full h-full object-cover"
                  data-testid="qr-camera-video"
                />
                {/* Target Brackets Overlay */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 sm:w-56 sm:h-56 relative">
                    <span className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                    <span className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                    <span className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                    <span className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-primary rounded-br-lg" />
                  </div>
                </div>

                {/* Paused / In-flight Banner inside Camera Viewport */}
                {(isCheckingIn || lastOutcome) && (
                  <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center text-white gap-3">
                    {isCheckingIn ? (
                      <>
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs font-semibold">
                          Đang xác thực mã vé với máy chủ...
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-slate-200">
                          Đã nhận diện xong vé. Bấm &ldquo;Quét vé tiếp theo&rdquo; để tiếp tục nhận diện QR.
                        </p>
                        <Button
                          size="md"
                          variant="primary"
                          icon="qr_code_scanner"
                          onClick={handleContinueNextScan}
                        >
                          Quét vé tiếp theo
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {cameraState === "idle" && (
              <div className="p-6 text-center space-y-3 text-slate-200 max-w-sm">
                <div className="w-12 h-12 rounded-2xl bg-white/10 mx-auto flex items-center justify-center text-primary">
                  <span aria-hidden="true" className="material-symbols-outlined text-[28px]">
                    qr_code_2
                  </span>
                </div>
                <p className="text-sm font-bold text-white">
                  Sẵn sàng quét vé QR sinh viên / khách mời
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Bấm <strong>Bật Camera Quét QR</strong> để cấp quyền camera hoặc dùng trực tiếp ô nhập mã vé / máy quét cầm tay bên cạnh.
                </p>
                <Button
                  size="md"
                  variant="primary"
                  icon="photo_camera"
                  onClick={() => void startCamera(facingMode)}
                  className="w-full sm:w-auto"
                >
                  Bật Camera ngay
                </Button>
              </div>
            )}

            {cameraState === "requesting" && (
              <div
                className="p-6 text-center space-y-3 text-white max-w-sm"
                data-testid="camera-requesting-state"
              >
                <div className="w-9 h-9 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-bold">Đang xin quyền truy cập camera...</p>
                <p className="text-xs text-slate-300">
                  Vui lòng chọn <strong>Cho phép (Allow)</strong> trên hộp thoại trình duyệt để bắt đầu quét mã QR.
                </p>
              </div>
            )}

            {cameraState === "permission-denied" && (
              <div
                className="p-6 text-center space-y-3 text-white max-w-sm"
                data-testid="camera-permission-denied-state"
              >
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
                  <span aria-hidden="true" className="material-symbols-outlined text-[26px]">
                    no_photography
                  </span>
                </div>
                <p className="text-sm font-bold text-red-300">
                  Quyền Camera bị từ chối
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {cameraErrorDetail}
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="primary"
                    icon="refresh"
                    onClick={() => void startCamera(facingMode)}
                  >
                    Thử cấp quyền lại
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon="keyboard"
                    onClick={() => inputRef.current?.focus()}
                  >
                    Nhập mã thủ công
                  </Button>
                </div>
              </div>
            )}

            {(cameraState === "not-supported" || cameraState === "error") && (
              <div
                className="p-6 text-center space-y-3 text-white max-w-sm"
                data-testid={
                  cameraState === "not-supported"
                    ? "camera-not-supported-state"
                    : "camera-error-state"
                }
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 mx-auto flex items-center justify-center">
                  <span aria-hidden="true" className="material-symbols-outlined text-[26px]">
                    videocam_off
                  </span>
                </div>
                <p className="text-sm font-bold text-amber-200">
                  {cameraState === "not-supported"
                    ? "Thiết bị không hỗ trợ Camera"
                    : "Lỗi khởi động Camera"}
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {cameraErrorDetail}
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    icon="keyboard"
                    onClick={() => inputRef.current?.focus()}
                  >
                    Chuyển sang nhập mã vé
                  </Button>
                  {cameraState === "error" && (
                    <Button
                      size="sm"
                      variant="primary"
                      icon="refresh"
                      onClick={() => void startCamera(facingMode)}
                    >
                      Thử lại
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Manual / Keyboard Scanner Input & Authoritative API Result Card */}
        <div className="lg:col-span-6 space-y-4">
          <div className="ui-card p-4 sm:p-5 space-y-4 border border-surface-container">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-on-surface">
                  Nhập mã vé hoặc máy quét QR cổng USB
                </h3>
                <p className="text-[11px] text-secondary">
                  Hỗ trợ cả định dạng <code className="font-mono">OD26-XXXX-XXXX</code> và <code className="font-mono">TICKET:OD26-...</code>
                </p>
              </div>
            </div>

            {selectedEvent ? (
              <div
                data-testid="locked-event-scope-banner"
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-container-low border border-surface-container text-xs"
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-primary text-[18px] shrink-0"
                >
                  lock
                </span>
                <span className="text-on-surface font-medium">
                  Quầy đang khóa kiểm tra đúng sự kiện:{" "}
                  <strong className="text-primary">{selectedEvent.title}</strong>
                </span>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
                Chưa chọn sự kiện đích — không thể thực hiện check-in.
              </div>
            )}

            <form onSubmit={(e) => void handleManualSubmit(e)} className="flex flex-col sm:flex-row gap-2.5">
              <input
                ref={inputRef}
                type="text"
                value={quickTicketCode}
                onChange={(e) => setQuickTicketCode(e.target.value.toUpperCase())}
                placeholder="Nhập mã vé ví dụ: OD26-A1B2-C3D4..."
                disabled={isCheckingIn || !selectedEvent}
                autoComplete="off"
                aria-label="Mã vé check-in Open Day"
                className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl bg-white border border-surface-container font-mono text-sm uppercase placeholder:font-sans placeholder:normal-case focus:outline-hidden focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                icon={isCheckingIn ? "hourglass_empty" : "check"}
                loading={isCheckingIn}
                disabled={isCheckingIn || !selectedEvent || !quickTicketCode.trim()}
                className="min-h-[46px] shrink-0"
              >
                {isCheckingIn ? "Đang xác thực..." : "Xác nhận Check-in"}
              </Button>
            </form>
          </div>

          {/* Authoritative API Check-in Result Card */}
          {isCheckingIn && (
            <div
              role="status"
              data-testid="checkin-verifying-state"
              className="ui-card p-5 border-2 border-primary/30 bg-primary-fixed/30 flex items-center gap-3"
            >
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
              <div className="text-xs sm:text-sm">
                <p className="font-bold text-on-surface">
                  Đang xác thực vé với máy chủ PostgreSQL...
                </p>
                <p className="text-secondary text-xs">
                  Hệ thống chỉ xác nhận check-in sau khi giao dịch DB hoàn tất.
                </p>
              </div>
            </div>
          )}

          {!isCheckingIn && lastOutcome && (
            <CheckInResultCard
              outcome={lastOutcome}
              onContinue={handleContinueNextScan}
            />
          )}

          {/* Session Check-in Log */}
          {recentOutcomes.length > 0 && (
            <div className="ui-card p-4 border border-surface-container space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">
                  Lịch sử quét phiên này ({recentOutcomes.length})
                </h4>
              </div>
              <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                {recentOutcomes.map((item, idx) => (
                  <li
                    key={`${item.ticketCode}-${item.receivedAt}-${idx}`}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-surface-container-low text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-mono font-bold text-on-surface mr-2">
                        {item.ticketCode}
                      </span>
                      {item.attendeeName && (
                        <span className="text-secondary truncate">
                          {item.attendeeName}
                        </span>
                      )}
                    </div>
                    <Badge
                      variant={
                        item.kind === "CHECKED_IN_SUCCESS"
                          ? "success"
                          : item.kind === "ALREADY_CHECKED_IN" || item.kind === "EVENT_MISMATCH"
                            ? "warning"
                            : "error"
                      }
                    >
                      {item.kind === "CHECKED_IN_SUCCESS"
                        ? item.xpReward?.awarded
                          ? `+${item.xpReward.amountXp} XP`
                          : "Hợp lệ"
                        : item.kind}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function CheckInResultCard({
  outcome,
  onContinue,
}: {
  outcome: CheckInOutcomeView;
  onContinue: () => void;
}) {
  const styles: Record<
    CheckInOutcomeView["kind"],
    {
      container: string;
      icon: string;
      iconColor: string;
      badgeVariant: "success" | "warning" | "error";
      title: string;
    }
  > = {
    CHECKED_IN_SUCCESS: {
      container: "border-emerald-300 bg-emerald-50/90",
      icon: "check_circle",
      iconColor: "text-emerald-600",
      badgeVariant: "success",
      title: "CHECK-IN THÀNH CÔNG",
    },
    ALREADY_CHECKED_IN: {
      container: "border-amber-300 bg-amber-50/90",
      icon: "warning",
      iconColor: "text-amber-600",
      badgeVariant: "warning",
      title: "VÉ ĐÃ CHECK-IN TRƯỚC ĐÓ",
    },
    CANCELLED_TICKET: {
      container: "border-red-300 bg-red-50/90",
      icon: "cancel",
      iconColor: "text-red-600",
      badgeVariant: "error",
      title: "VÉ ĐÃ BỊ HỦY",
    },
    EVENT_MISMATCH: {
      container: "border-orange-300 bg-orange-50/90",
      icon: "event_busy",
      iconColor: "text-orange-600",
      badgeVariant: "warning",
      title: "VÉ KHÔNG KHỚP SỰ KIỆN",
    },
    INVALID_EVENT_STATUS: {
      container: "border-orange-300 bg-orange-50/90",
      icon: "event_busy",
      iconColor: "text-orange-600",
      badgeVariant: "warning",
      title: "SỰ KIỆN CHƯA MỞ CHECK-IN",
    },
    INVALID_TICKET_STATUS: {
      container: "border-red-300 bg-red-50/90",
      icon: "error",
      iconColor: "text-red-600",
      badgeVariant: "error",
      title: "TRẠNG THÁI VÉ KHÔNG HỢP LỆ",
    },
    INVALID_TICKET: {
      container: "border-red-300 bg-red-50/90",
      icon: "gpp_bad",
      iconColor: "text-red-600",
      badgeVariant: "error",
      title: "VÉ KHÔNG HỢP LỆ / KHÔNG TỒN TẠI",
    },
    FORBIDDEN: {
      container: "border-red-300 bg-red-50/90",
      icon: "lock",
      iconColor: "text-red-600",
      badgeVariant: "error",
      title: "KHÔNG CÓ QUYỀN CHECK-IN",
    },
    NETWORK_ERROR: {
      container: "border-red-300 bg-red-50/90",
      icon: "wifi_off",
      iconColor: "text-red-600",
      badgeVariant: "error",
      title: "LỖI KẾT NỐI MÁY CHỦ",
    },
  };

  const cfg = styles[outcome.kind];

  return (
    <div
      role="region"
      aria-live="polite"
      data-testid="checkin-result-card"
      data-outcome-kind={outcome.kind}
      className={cn("ui-card p-5 border-2 space-y-4 shadow-sm", cfg.container)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className={cn("material-symbols-outlined text-[28px] shrink-0", cfg.iconColor)}
          >
            {cfg.icon}
          </span>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={cfg.badgeVariant}>{outcome.kind}</Badge>
              <span className="font-mono text-xs font-bold text-on-surface bg-white/80 px-2 py-0.5 rounded-md border border-black/10">
                {outcome.ticketCode}
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-extrabold text-on-surface">
              {cfg.title}
            </h4>
          </div>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-on-surface font-medium leading-relaxed">
        {outcome.message}
      </p>

      {(outcome.attendeeName || outcome.eventTitle || outcome.checkedInAt) && (
        <div className="rounded-xl bg-white/80 border border-black/5 p-3 space-y-1 text-xs">
          {outcome.attendeeName && (
            <p>
              <span className="text-secondary">Người tham dự:</span>{" "}
              <strong className="text-on-surface">{outcome.attendeeName}</strong>
            </p>
          )}
          {outcome.eventTitle && (
            <p>
              <span className="text-secondary">Sự kiện:</span>{" "}
              <strong className="text-on-surface">{outcome.eventTitle}</strong>
            </p>
          )}
          {outcome.checkedInAt && (
            <p>
              <span className="text-secondary">Thời điểm check-in:</span>{" "}
              <strong className="text-on-surface">
                {new Date(outcome.checkedInAt).toLocaleString("vi-VN")}
              </strong>
            </p>
          )}
        </div>
      )}

      {outcome.kind === "CHECKED_IN_SUCCESS" && outcome.xpReward && (
        <div
          data-testid="checkin-xp-banner"
          className={cn(
            "rounded-xl px-3.5 py-2.5 text-xs font-semibold flex items-center gap-2 border",
            outcome.xpReward.awarded
              ? "bg-amber-50 border-amber-300 text-amber-900"
              : "bg-slate-100 border-slate-300 text-slate-700",
          )}
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
            {outcome.xpReward.awarded ? "stars" : "person_off"}
          </span>
          <span>
            {outcome.xpReward.awarded
              ? `Đã cộng +${outcome.xpReward.amountXp} XP vào tài khoản sinh viên liên kết.`
              : "Vé chưa liên kết tài khoản sinh viên (userId = null) — Không tự ý gán XP."}
          </span>
        </div>
      )}

      <div className="pt-1 flex justify-end">
        <Button
          size="md"
          variant="primary"
          icon="qr_code_scanner"
          onClick={onContinue}
          data-testid="next-scan-btn"
          className="w-full sm:w-auto min-h-[44px]"
        >
          Quét vé tiếp theo
        </Button>
      </div>
    </div>
  );
}
