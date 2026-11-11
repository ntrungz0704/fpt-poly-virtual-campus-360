import React from "react";
import {
  Hero360Viewer,
  CampusOrientationSection,
  FeaturedFacilities,
  OpenDayBanner,
} from "@/components/home";

export default function HomePage() {
  return (
    <div className="w-full overflow-x-clip">
      <Hero360Viewer />
      <CampusOrientationSection />
      <FeaturedFacilities />
      <OpenDayBanner />
    </div>
  );
}
