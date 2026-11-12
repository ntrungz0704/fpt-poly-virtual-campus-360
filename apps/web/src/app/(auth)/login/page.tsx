import type { Metadata } from "next";
import Link from "next/link";
import { OFFICIAL_CAMPUS_INFO } from "@/data/campus-data";

export const metadata: Metadata = {
  title: "Trạng thái Xác thực",
  description:
    "Thông báo trạng thái cổng xác thực Virtual Campus FPT Polytechnic QTSC Quận 12 trong giai đoạn MVP.",
};

export default function LoginStatusPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between px-4 py-10 sm:px-6">
      <header className="max-w-3xl w-full mx-auto flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-navy-900 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            arrow_back
          </span>
          <span>Về Trang chủ</span>
        </Link>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-900/10 px-3 py-1 text-xs font-semibold text-navy-900">
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
            shield_lock
          </span>
          <span>Chờ kết nối Phase 2B</span>
        </span>
      </header>

      <main className="max-w-2xl w-full mx-auto my-8">
        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[26px]" aria-hidden="true">
                lock_clock
              </span>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                {OFFICIAL_CAMPUS_INFO.shortName} · {OFFICIAL_CAMPUS_INFO.campusLabel}
              </p>
              <h1 className="type-h2 text-on-surface">
                Cổng Đăng nhập đang chờ tích hợp giao diện (Phase 2B)
              </h1>
            </div>
          </div>

          <p className="type-body-sm text-secondary leading-relaxed">
            Trong bản xem trước hiện tại, nền tảng tập trung vào trải nghiệm công khai không cần đăng nhập
            (<strong>Tham quan 360°</strong>, <strong>Bản đồ GIS</strong> và <strong>Thông tin Địa điểm</strong>).
            API xác thực phía máy chủ đã hoàn thiện ở Backend; giao diện biểu mẫu đăng nhập và kích hoạt tài khoản
            sẽ được nối trong <strong>Phase 2B</strong>.
          </p>

          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 space-y-3 text-sm text-on-surface">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-primary mt-0.5 shrink-0" aria-hidden="true">
                public
              </span>
              <p className="text-secondary leading-relaxed">
                <strong className="text-on-surface">Khách tham quan tự do:</strong> Không cần tài khoản hay đăng nhập.
                Hệ thống không mở chức năng tự đăng ký cho khách công khai.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-primary mt-0.5 shrink-0" aria-hidden="true">
                mark_email_read
              </span>
              <p className="text-secondary leading-relaxed">
                <strong className="text-on-surface">Tài khoản Khách tham dự, Sinh viên &amp; Nhân sự:</strong> Quy trình
                kích hoạt tài khoản tham dự Open Day (liên kết dùng một lần) và đăng nhập chung một cổng cho khách hàng,
                sinh viên lẫn cán bộ quản lý sẽ được mở khi kết nối giao diện <strong>Phase 2B</strong>.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-amber-700 mt-0.5 shrink-0" aria-hidden="true">
                info
              </span>
              <p className="text-secondary leading-relaxed">
                <strong className="text-on-surface">Lưu ý kỹ thuật:</strong> Toàn bộ biểu mẫu đăng nhập và dữ liệu tài khoản
                thử nghiệm phía trình duyệt đã được gỡ bỏ. Khu vực <code className="font-mono text-xs">/admin/*</code> hiện chỉ là
                giao diện Preview nội bộ và chưa được bảo vệ bởi Authentication.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/campus"
              className="ui-btn ui-btn-primary min-h-[44px] px-5 py-2.5 text-sm inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                360
              </span>
              <span>Khám phá Tham quan 360°</span>
            </Link>

            <Link
              href="/map"
              className="ui-btn ui-btn-outline min-h-[44px] px-4 py-2.5 text-sm inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                map
              </span>
              <span>Bản đồ GIS khuôn viên</span>
            </Link>

            <Link
              href="/events"
              className="ui-btn ui-btn-ghost min-h-[44px] px-4 py-2.5 text-sm inline-flex items-center gap-2"
            >
              <span>Xem lịch Open Day</span>
            </Link>
          </div>
        </div>
      </main>

      <footer className="max-w-3xl w-full mx-auto text-center text-xs text-secondary">
        {OFFICIAL_CAMPUS_INFO.address}
      </footer>
    </div>
  );
}
