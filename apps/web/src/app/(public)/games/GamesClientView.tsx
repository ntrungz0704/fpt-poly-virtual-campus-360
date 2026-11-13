"use client";

import React, { useEffect, useState } from "react";
import type {
  GamificationProfileDto,
  PublicEventsResponseDto,
} from "@fpt-campus/shared";
import { Badge } from "@/components/ui";
import { CampusQuizStepper } from "@/components/quiz/CampusQuizStepper";
import { QuizLeaderboard } from "@/components/quiz/QuizLeaderboard";
import { SpinWheel, GamificationProfileHeader } from "@/components/gamification";
import { fetchGamificationProfile } from "@/lib/public/gamification-api";
import { fetchPublicEvents } from "@/lib/public/public-api";
import { OFFICIAL_CAMPUS_INFO } from "@/data/campus-data";

export function GamesClientView() {
  const [activeTab, setActiveTab] = useState<"quiz" | "spin">("quiz");
  const [eventsData, setEventsData] = useState<PublicEventsResponseDto | null>(null);
  const [profile, setProfile] = useState<GamificationProfileDto | null>(null);
  const [ticketCode, setTicketCode] = useState<string | undefined>(undefined);
  const [attendeeName, setAttendeeName] = useState<string>("Khách tham quan");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 1. Initial Load: check localStorage ticket & fetch public event
  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        // Check if attendee has an Open Day ticket from M3C
        let storedTicketCode: string | undefined;
        let storedAttendeeName = "Khách tham quan";

        if (typeof window !== "undefined") {
          const rawTicket = localStorage.getItem("fpoly_openday_ticket");
          if (rawTicket) {
            try {
              const parsed = JSON.parse(rawTicket);
              if (parsed?.ticketCode) {
                storedTicketCode = parsed.ticketCode;
                storedAttendeeName = parsed.attendeeName || "Khách tham quan";
              }
            } catch {
              // ignore parse errors
            }
          }
        }

        if (mounted) {
          setTicketCode(storedTicketCode);
          setAttendeeName(storedAttendeeName);
        }

        // Fetch event & quiz items
        const [evRes, profRes] = await Promise.allSettled([
          fetchPublicEvents(),
          fetchGamificationProfile(storedTicketCode, storedAttendeeName),
        ]);

        if (mounted) {
          if (evRes.status === "fulfilled") {
            setEventsData(evRes.value);
          }
          if (profRes.status === "fulfilled") {
            setProfile(profRes.value);
          }
        }
      } catch {
        // silent init fail
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  const refreshProfile = async () => {
    try {
      const updated = await fetchGamificationProfile(ticketCode, attendeeName);
      setProfile(updated);
      setRefreshTrigger((prev) => prev + 1);
    } catch {
      // silent refresh fail
    }
  };

  const handleQuizCompleted = () => {
    refreshProfile();
  };

  const handleSpinComplete = () => {
    refreshProfile();
  };

  const quizQuestions = eventsData?.quizItems?.map((q) => ({
    id: q.id,
    questionText: q.questionText,
    options: q.options,
    tourNodeSlug: q.tourNodeSlug,
  })) ?? [];

  return (
    <div className="space-y-8">
      {/* Page Title & Mission */}
      <div className="space-y-2 border-b border-surface-container pb-6">
        <Badge variant="brand">Mini-game & Điểm Thưởng QTSC</Badge>
        <h1 className="type-h1 text-on-surface">
          Đấu Trường Khám Phá {OFFICIAL_CAMPUS_INFO.campusLabel}
        </h1>
        <p className="type-body text-secondary max-w-3xl">
          Tham gia trả lời trắc nghiệm hiểu biết về các tòa nhà, tích lũy điểm kinh nghiệm (XP), nhận lượt quay may mắn và đua thứ hạng trên Bảng Vàng Poly 360!
        </p>
      </div>

      {/* Profile & XP Status Header */}
      <GamificationProfileHeader
        profile={profile}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Grid: Quiz / Spin Wheel on Left, Leaderboard on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
          {activeTab === "quiz" ? (
            <CampusQuizStepper
              eventId={eventsData?.event?.id}
              questions={quizQuestions}
              attendeeName={attendeeName}
              ticketCode={ticketCode}
              onQuizCompleted={handleQuizCompleted}
              onGoToSpinWheel={() => setActiveTab("spin")}
            />
          ) : (
            <SpinWheel
              attendeeName={attendeeName}
              ticketCode={ticketCode}
              spinsRemaining={profile?.spinsAvailable ?? 0}
              onSpinComplete={handleSpinComplete}
              onGoToQuiz={() => setActiveTab("quiz")}
            />
          )}
        </div>

        <div className="lg:col-span-4">
          <QuizLeaderboard
            attendeeName={attendeeName}
            ticketCode={ticketCode}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>
    </div>
  );
}
