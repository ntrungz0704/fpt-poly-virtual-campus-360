import React from "react";
import { PublicHeader } from "@/components/navigation/PublicHeader";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between overflow-x-clip">
      <PublicHeader />

      {/* Centered Auth Content below unified 64px PublicHeader */}
      <main className="flex-1 flex items-center justify-center pt-24 pb-10 px-4">
        {children}
      </main>

      {/* Truthful Minimal Footer */}
      <footer className="py-4 px-4 sm:px-gutter text-center text-secondary font-body-sm text-xs border-t border-surface-container bg-surface-container-lowest">
        © 2025 - 2026 Trường Cao đẳng FPT Polytechnic TP.HCM — Virtual Campus (CVPM Quang Trung, Quận 12).
      </footer>
    </div>
  );
}
