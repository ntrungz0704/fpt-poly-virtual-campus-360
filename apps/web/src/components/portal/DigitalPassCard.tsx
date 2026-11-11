"use client";

import React, { useMemo, useState } from "react";
import { OFFICIAL_CAMPUS_INFO } from "@/data/campus-data";
import { PortalParticipantPreview } from "./portal-types";
import { Button, StatusToast } from "@/components/ui";

interface DigitalPassCardProps {
  session: PortalParticipantPreview;
}

/** Deterministic high-contrast visual matrix derived from ticketCode */
function buildMatrix(seed: string): boolean[][] {
  const size = 15;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const grid: boolean[][] = [];
  for (let r = 0; r < size; r += 1) {
    const row: boolean[] = [];
    for (let c = 0; c < size; c += 1) {
      const inTL = r < 5 && c < 5;
      const inTR = r < 5 && c >= size - 5;
      const inBL = r >= size - 5 && c < 5;
      if (inTL || inTR || inBL) {
        const lr = r < 5 ? r : r - (size - 5);
        const lc = c < 5 ? c : c - (size - 5);
        const isBorder = lr === 0 || lr === 4 || lc === 0 || lc === 4;
        const isCenter = lr === 2 && lc === 2;
        row.push(isBorder || isCenter);
      } else {
        hash = Math.imul(hash ^ (r * 31 + c), 16777619);
        row.push((hash & 1) === 0);
      }
    }
    grid.push(row);
  }
  return grid;
}

export function DigitalPassCard({ session }: DigitalPassCardProps) {
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const matrix = useMemo(() => buildMatrix(session.ticketCode), [session.ticketCode]);

  const handleCopyTicket = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(session.ticketCode);
      }
      setToastMsg(`Đã sao chép mã vé ${session.ticketCode}`);
      setToastOpen(true);
    } catch {
      setToastMsg(`Mã vé của bạn: ${session.ticketCode}`);
      setToastOpen(true);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="ui-card overflow-hidden">
      {/* Dark Crisp Ticket Header */}
      <div className="bg-slate-900 text-white p-5 space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-orange-300">
          Thẻ Check-in Open Day
        </p>
        <h2 className="type-h3 text-white">{session.fullName}</h2>
        <p className="text-xs text-slate-300 font-mono">
          {session.accountCode} · {session.eventBatch}
        </p>
      </div>

      {/* High-Contrast Pass Matrix Block */}
      <div className="p-6 flex flex-col items-center gap-4 text-center bg-surface">
        <div
          className="p-4 rounded-2xl bg-white border-2 border-slate-900 shadow-xs"
          aria-label={`Mã tham dự Open Day ${session.ticketCode}`}
        >
          <svg
            width="150"
            height="150"
            viewBox="0 0 15 15"
            shapeRendering="crispEdges"
            role="img"
            aria-label={`Mã định danh ${session.ticketCode}`}
          >
            <rect width="15" height="15" fill="#FFFFFF" />
            {matrix.map((row, r) =>
              row.map((filled, c) =>
                filled ? (
                  <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#0F172A" />
                ) : null
              )
            )}
          </svg>
        </div>

        <div className="space-y-1">
          <p className="font-mono text-sm font-bold text-on-surface tracking-wide">
            {session.ticketCode}
          </p>
          <p className="text-xs text-secondary">
            Mã tham dự tại Sảnh Đón tiếp Innovation · {OFFICIAL_CAMPUS_INFO.openDayDateLabel}
          </p>
        </div>

        <div className="w-full pt-2 flex flex-col sm:flex-row gap-2.5">
          <Button
            variant="outline"
            size="md"
            icon="content_copy"
            onClick={handleCopyTicket}
            className="flex-1"
          >
            Sao chép mã
          </Button>
          <Button
            variant="primary"
            size="md"
            icon="print"
            onClick={handlePrint}
            className="flex-1"
          >
            In thẻ tham dự
          </Button>
        </div>
      </div>

      <StatusToast
        open={toastOpen}
        type="success"
        message={toastMsg}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
}
