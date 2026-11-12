import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FPT Polytechnic TP.HCM (Cơ sở Quận 12) — Virtual Campus 360°",
  description:
    "Trải nghiệm không gian thực tế ảo 360°, bản đồ khuôn viên GIS và sự kiện Open Day tại Trường Cao đẳng FPT Polytechnic cơ sở CVPM Quang Trung, Quận 12, TP. Hồ Chí Minh.",
  keywords: [
    "FPT Polytechnic TP.HCM",
    "Virtual Campus Quận 12",
    "CVPM Quang Trung",
    "QTSC",
    "Open Day 2026",
  ],
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-fpt.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${inter.variable}`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body
        suppressHydrationWarning
        className="bg-surface font-body-md text-on-surface antialiased min-h-screen"
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
