import React from "react";
import { PublicHeader } from "@/components/navigation/PublicHeader";
import { PublicFooter } from "@/components/navigation/PublicFooter";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between overflow-x-clip">
      <PublicHeader />

      {/* Centered Auth Content below unified 64px PublicHeader */}
      <main className="flex-1 flex items-center justify-center pt-24 pb-14 px-4">
        {children}
      </main>

      {/* Official Campus Public Footer */}
      <PublicFooter />
    </div>
  );
}
