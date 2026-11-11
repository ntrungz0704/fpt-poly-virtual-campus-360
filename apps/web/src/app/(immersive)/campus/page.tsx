import React from "react";
import { VirtualTourViewer } from "@/components/tour";

export const metadata = {
  title: "Tour 360° Khuôn viên QTSC | FPT Polytechnic Virtual Campus",
  description:
    "Tham quan tự do toàn cảnh 360 độ các tòa nhà, thư viện số, phòng Lab CNTT và Studio Đồ họa tại FPT Polytechnic CVPM Quang Trung.",
};

interface CampusTourPageProps {
  searchParams: Promise<{ scene?: string }>;
}

export default async function CampusTourPage({
  searchParams,
}: CampusTourPageProps) {
  const { scene } = await searchParams;

  return <VirtualTourViewer initialSceneId={scene} />;
}
