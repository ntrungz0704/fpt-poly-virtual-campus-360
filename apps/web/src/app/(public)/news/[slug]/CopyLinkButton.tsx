"use client";

import React, { useState } from "react";
import { Button, StatusToast } from "@/components/ui";

export function CopyLinkButton() {
  const [toastOpen, setToastOpen] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
      }
      setToastOpen(true);
    } catch {
      setToastOpen(true);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        icon="share"
        onClick={handleCopy}
        className="min-h-[44px]"
      >
        Sao chép liên kết
      </Button>
      <StatusToast
        open={toastOpen}
        type="success"
        message="Đã sao chép đường dẫn bài hướng dẫn."
        onClose={() => setToastOpen(false)}
      />
    </>
  );
}
