import React from "react";
import { Badge } from "@/components/ui";

const RECENT_OPERATIONS = [
  {
    id: "op-1",
    action: "Đồng bộ bộ ảnh equirectangular 2:1 (5 cảnh) vào thư mục nội bộ",
    actor: "Điều phối viên QTSC",
    time: "11/11/2026 · 08:30",
    badge: "Media",
  },
  {
    id: "op-2",
    action: "Cập nhật hotspot chuyển cảnh giữa Hội trường Innovation và Thư viện Số T2",
    actor: "Điều phối viên QTSC",
    time: "11/11/2026 · 08:15",
    badge: "Tour 360°",
  },
  {
    id: "op-3",
    action: "Chuẩn hóa cổng quản trị về tài khoản Admin duy nhất (admin)",
    actor: "Quản trị viên",
    time: "11/11/2026 · 08:45",
    badge: "Tài khoản",
  },
  {
    id: "op-4",
    action: "Xuất bản lịch trình Open Day (6 phiên sáng/trưa/chiều) tại CVPM Quang Trung",
    actor: "Ban Tổ Chức Open Day",
    time: "10/11/2026 · 15:40",
    badge: "Open Day",
  },
];

export function AdminRecentActivityLog() {
  return (
    <div className="ui-card overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-container bg-surface-container-low/40 flex items-center justify-between gap-2">
        <div>
          <h2 className="type-h3 text-on-surface">Nhật ký thao tác gần đây</h2>
          <p className="text-xs text-secondary mt-0.5">
            Theo dõi các cập nhật dữ liệu không gian và danh sách tham dự QTSC.
          </p>
        </div>
      </div>

      <div className="divide-y divide-surface-container">
        {RECENT_OPERATIONS.map((item) => (
          <div
            key={item.id}
            className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          >
            <div className="space-y-0.5 min-w-0">
              <p className="text-sm font-medium text-on-surface">{item.action}</p>
              <p className="text-xs text-secondary">
                {item.actor} · {item.time}
              </p>
            </div>
            <Badge variant="neutral" className="self-start sm:self-center shrink-0">
              {item.badge}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
