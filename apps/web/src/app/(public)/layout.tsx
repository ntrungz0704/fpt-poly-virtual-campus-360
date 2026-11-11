import React from "react";
import { PublicHeader } from "@/components/navigation/PublicHeader";
import { PublicFooter } from "@/components/navigation/PublicFooter";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-surface text-on-surface overflow-x-clip">
      <PublicHeader />

      <main className="flex-1 w-full pt-16">
        {children}
      </main>

      <PublicFooter />
    </div>
  );
}
