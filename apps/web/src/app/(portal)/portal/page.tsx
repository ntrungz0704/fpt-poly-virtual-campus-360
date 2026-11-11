"use client";

import React from "react";
import { AuthGateState } from "@/components/ui";
import { OFFICIAL_CAMPUS_INFO } from "@/data/campus-data";

export default function ParticipantPortalPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 space-y-6">
      <AuthGateState
        title="Cổng Tham dự Open Day chưa kích hoạt trong MVP"
        description={`Student/Parent Portal và luồng đăng nhập tài khoản mời đang nằm ngoài phạm vi MVP và sẽ được triển khai ở giai đoạn Backend Auth tiếp theo. Bạn vẫn có thể xem toàn bộ lịch trình Open Day công khai và trải nghiệm khuôn viên ${OFFICIAL_CAMPUS_INFO.campusLabel} tự do.`}
        actionLabel="Khám phá Tham quan 360°"
        actionHref="/campus"
        secondaryLabel="Xem lịch Open Day công khai"
        secondaryHref="/events"
      />
    </div>
  );
}
