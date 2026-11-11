import React from "react";
import { CampusGISMap } from "@/components/map";

export const metadata = {
  title: "Bản đồ Khuôn viên GIS | FPT Polytechnic Virtual Campus QTSC",
  description:
    "Bản đồ mặt bằng trực quan các khối nhà Innovation, Tòa T, Tòa F, Tòa P và Khu Thể thao tại CVPM Quang Trung, Quận 12.",
};

interface MapPageProps {
  searchParams: Promise<{ building?: string }>;
}

export default async function CampusMapPage({ searchParams }: MapPageProps) {
  const { building } = await searchParams;

  return <CampusGISMap key={building ?? "qtsc-map"} initialBuildingParam={building} />;
}
