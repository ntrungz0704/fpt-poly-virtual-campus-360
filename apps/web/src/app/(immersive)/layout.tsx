import React from "react";
import { PublicHeader } from "@/components/navigation/PublicHeader";

/**
 * ImmersiveTourLayout shares the exact unified white PublicHeader (h-16)
 * so the logo position, branding, nav links, and active state stay pixel-consistent
 * across Homepage (/), 360° Tour (/campus), GIS Map (/map), and all public pages.
 */
export default function ImmersiveTourLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative w-full h-screen supports-[height:100dvh]:h-dvh overflow-hidden bg-slate-950 text-white select-none">
      <PublicHeader />

      {/* Main Full-Bleed Viewport below unified 64px header */}
      <main className="w-full h-full pt-16 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
