import React from "react";
import { EventsView } from "@/components/events";

export const metadata = {
  title: "FPoly Open Day tại CVPM Quang Trung | FPT Polytechnic Virtual Campus",
  description:
    "Lịch trình công khai Open Day QTSC Quận 12, đăng ký tham gia nhận vé QR và hướng dẫn trải nghiệm khuôn viên.",
};

export default function EventsPage() {
  return <EventsView />;
}
