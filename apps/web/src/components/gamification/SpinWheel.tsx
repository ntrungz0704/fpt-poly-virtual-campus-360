"use client";

import React, { useEffect, useRef, useState } from "react";
import type { SpinSliceDto, SpinWheelResultDto } from "@fpt-campus/shared";
import { Button } from "@/components/ui";
import { executeSpinWheel, fetchSpinConfig } from "@/lib/public/gamification-api";

interface SpinWheelProps {
  attendeeName: string;
  ticketCode?: string;
  spinsRemaining: number;
  onSpinComplete?: (result: SpinWheelResultDto) => void;
  onGoToQuiz?: () => void;
}

export function SpinWheel({
  attendeeName,
  ticketCode,
  spinsRemaining,
  onSpinComplete,
  onGoToQuiz,
}: SpinWheelProps) {
  const [slices, setSlices] = useState<SpinSliceDto[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [wonReward, setWonReward] = useState<SpinWheelResultDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const wheelRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadConfig() {
      try {
        setLoadingConfig(true);
        const res = await fetchSpinConfig();
        if (mounted && res.slices.length > 0) {
          setSlices(res.slices);
        }
      } catch (err) {
        if (mounted) {
          setErrorMessage(
            err instanceof Error ? err.message : "Không thể tải danh sách phần thưởng.",
          );
        }
      } finally {
        if (mounted) setLoadingConfig(false);
      }
    }
    loadConfig();
    return () => {
      mounted = false;
    };
  }, []);

  const sliceCount = slices.length || 8;
  const sliceAngle = 360 / sliceCount;

  const handleSpin = async () => {
    if (isSpinning || spinsRemaining <= 0) return;

    setErrorMessage(null);
    setWonReward(null);
    setIsSpinning(true);

    try {
      const result = await executeSpinWheel({
        attendeeName: attendeeName || "Khách tham quan",
        ticketCode: ticketCode || undefined,
      });

      // Calculate target angle so pointer at TOP (270 deg or 0 deg) lands on result.sliceIndex
      // With pointer at top (0 degrees): slice i covers angles [i*sliceAngle, (i+1)*sliceAngle]
      // To bring slice center under top pointer, rotate by (360 - (sliceIndex * sliceAngle + sliceAngle / 2))
      const extraSpins = 5; // 5 full rotations for suspense
      const targetSliceCenter = result.sliceIndex * sliceAngle + sliceAngle / 2;
      const finalAngle = extraSpins * 360 + (360 - targetSliceCenter);

      // Add to current rotation so it always spins forward
      const currentFullTurns = Math.ceil(rotationDegrees / 360) * 360;
      setRotationDegrees(currentFullTurns + finalAngle);

      // Wait for CSS animation to finish (4s)
      setTimeout(() => {
        setIsSpinning(false);
        setWonReward(result);
        if (onSpinComplete) {
          onSpinComplete(result);
        }
      }, 4200);
    } catch (err: unknown) {
      setIsSpinning(false);
      setErrorMessage(
        (err as Error)?.message || "Không thể thực hiện lượt quay. Vui lòng thử lại sau.",
      );
    }
  };

  if (loadingConfig) {
    return (
      <div className="ui-card p-8 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-secondary">Đang nạp vòng quay may mắn...</p>
      </div>
    );
  }

  const cx = 170;
  const cy = 170;
  const r = 160;

  return (
    <div className="ui-card p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 border-b border-surface-container pb-4">
        <div>
          <span className="type-label text-primary">Mini-game Đổi Thưởng</span>
          <h2 className="type-h2 text-on-surface">Vòng Quay May Mắn QTSC</h2>
        </div>
        <div className="text-right">
          <span className="text-xs text-secondary block">Lượt quay còn lại</span>
          <span
            className={`text-lg font-black ${
              spinsRemaining > 0 ? "text-primary" : "text-slate-400"
            }`}
          >
            {spinsRemaining} lượt
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Interactive Wheel Graphic */}
      <div className="relative max-w-[340px] mx-auto py-4 flex flex-col items-center">
        {/* Top Pointer Indicator */}
        <div className="absolute top-2 z-20 flex flex-col items-center pointer-events-none drop-shadow-md">
          <div className="w-6 h-7 bg-amber-400 border-2 border-white rounded-b-md shadow-lg transform -translate-y-1">
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-amber-400 mx-auto mt-4" />
          </div>
        </div>

        {/* The SVG Wheel */}
        <div className="relative w-[340px] h-[340px] drop-shadow-2xl">
          <svg
            ref={wheelRef}
            viewBox="0 0 340 340"
            className="w-full h-full transform-gpu"
            style={{
              transform: `rotate(${rotationDegrees}deg)`,
              transition: isSpinning
                ? "transform 4.0s cubic-bezier(0.12, 0.8, 0.2, 1)"
                : "none",
            }}
          >
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="#0F172A"
              stroke="#F27024"
              strokeWidth="6"
            />

            {slices.map((slice, i) => {
              const startAngleRad = ((i * sliceAngle - 90) * Math.PI) / 180;
              const endAngleRad = (((i + 1) * sliceAngle - 90) * Math.PI) / 180;

              const x1 = cx + r * Math.cos(startAngleRad);
              const y1 = cy + r * Math.sin(startAngleRad);
              const x2 = cx + r * Math.cos(endAngleRad);
              const y2 = cy + r * Math.sin(endAngleRad);

              const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;

              // Text position along middle of slice
              const midAngle = i * sliceAngle + sliceAngle / 2;
              const midRad = ((midAngle - 90) * Math.PI) / 180;
              const textR = r * 0.65;
              const tx = cx + textR * Math.cos(midRad);
              const ty = cy + textR * Math.sin(midRad);

              return (
                <g key={slice.id}>
                  <path
                    d={pathData}
                    fill={slice.colorHex}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    opacity={0.92}
                  />
                  <text
                    x={tx}
                    y={ty}
                    fill="#FFFFFF"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="central"
                    transform={`rotate(${midAngle + 90}, ${tx}, ${ty})`}
                    className="select-none tracking-tight shadow-sm"
                  >
                    {slice.label.length > 15
                      ? slice.label.slice(0, 13) + "…"
                      : slice.label}
                  </text>
                </g>
              );
            })}

            {/* Inner Center Hub */}
            <circle
              cx={cx}
              cy={cy}
              r="34"
              fill="#FFFFFF"
              stroke="#F27024"
              strokeWidth="4"
              className="drop-shadow-md"
            />
            <text
              x={cx}
              y={cy - 5}
              fill="#F27024"
              fontSize="10"
              fontWeight="900"
              textAnchor="middle"
            >
              FPT
            </text>
            <text
              x={cx}
              y={cy + 9}
              fill="#1E293B"
              fontSize="8"
              fontWeight="bold"
              textAnchor="middle"
            >
              POLY
            </text>
          </svg>
        </div>
      </div>

      {/* Won Reward Alert Card */}
      {wonReward && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-center space-y-2 animate-fadeIn">
          <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto shadow-md">
            <span className="material-symbols-outlined text-[24px]">celebration</span>
          </div>
          <p className="type-label text-amber-600 dark:text-amber-400">
            Xin chúc mừng!
          </p>
          <h3 className="type-h3 text-on-surface">{wonReward.rewardLabel}</h3>
          <p className="type-body-sm text-secondary">{wonReward.message}</p>
        </div>
      )}

      {/* Controls & CTA */}
      <div className="space-y-3 pt-2">
        {spinsRemaining > 0 ? (
          <Button
            variant="primary"
            size="lg"
            className="w-full text-base font-black tracking-wide shadow-lg"
            disabled={isSpinning}
            onClick={handleSpin}
          >
            {isSpinning ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang quay vòng may mắn...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[20px]">
                  casino
                </span>
                <span>QUAY NGAY ({spinsRemaining} LƯỢT)</span>
              </span>
            )}
          </Button>
        ) : (
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container text-center space-y-2">
            <p className="type-body-sm text-secondary">
              Bạn đã hết lượt quay may mắn. Làm bài Quiz tìm hiểu khuôn viên hoặc Check-in tại sự kiện Open Day để nhận thêm lượt!
            </p>
            {onGoToQuiz && (
              <Button
                variant="outline"
                size="md"
                className="w-full"
                onClick={onGoToQuiz}
                icon="quiz"
              >
                Làm bài trắc nghiệm nhận thêm lượt quay
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
