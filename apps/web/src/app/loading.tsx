import React from "react";
import { LoadingState } from "@/components/ui";

export default function GlobalLoadingPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 bg-surface">
      <div className="max-w-sm w-full">
        <LoadingState label="Đang tải không gian Virtual Campus..." />
      </div>
    </div>
  );
}
