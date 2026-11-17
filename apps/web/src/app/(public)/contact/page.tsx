"use client";

import React, { useState } from "react";
import Link from "next/link";
import { OFFICIAL_CAMPUS_INFO } from "@/data/campus-data";

export default function ContactPage() {
  const [submittedNotice, setSubmittedNotice] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    province: "TP. Hồ Chí Minh",
    major: "cntt",
    admissionType: "hoc-ba",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedNotice(true);
  };

  return (
    <div className="bg-surface min-h-screen py-10 sm:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-secondary">
          <Link href="/" className="hover:text-primary">Trang chủ</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-on-surface font-bold">Liên hệ &amp; Tư vấn Tuyển sinh 2026</span>
        </div>

        {/* Hero Header */}
        <div className="bg-gradient-to-r from-slate-900 via-[#0A2540] to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-2xl relative z-10 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary/20 text-primary-fixed text-xs font-bold border border-primary/30">
              <span className="material-symbols-outlined text-[16px]">school</span>
              <span>Tuyển sinh Khóa 22.3 (Năm 2026)</span>
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading leading-tight">
              Kết nối cùng FPT Polytechnic — Sẵn sàng cho Tương lai Công nghệ
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Đội ngũ cán bộ tư vấn sẵn sàng giải đáp 100% thắc mắc về phương thức xét tuyển học bạ, học phí trọn gói, cam kết việc làm và trải nghiệm thực tế cơ sở vật chất.
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-semibold pt-2">
              <a
                href={OFFICIAL_CAMPUS_INFO.officialContactUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/20 transition"
              >
                <span className="material-symbols-outlined text-primary">public</span>
                <span>Cổng Liên hệ: caodang.fpt.edu.vn/lien-he</span>
              </a>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2.5 rounded-xl border border-white/10">
                <span className="material-symbols-outlined text-primary">location_on</span> QTSC Quận 12, TP.HCM
              </div>
            </div>
          </div>
        </div>

        {/* Form & Campus Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Consultation Form (7 Cols) */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-3xl p-8 sm:p-10 border border-surface-container shadow-sm">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-surface-container-low">
              <div>
                <h2 className="text-xl font-bold font-heading text-on-surface">Đăng ký Tư vấn &amp; Nhận Học bổng</h2>
                <p className="text-xs text-secondary mt-1">Điền thông tin để nhận tài liệu tuyển sinh và hướng dẫn tham quan Campus</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                Đang nhận hồ sơ
              </span>
            </div>

            {/* Online Channel Limitation Notice */}
            <div
              role="note"
              className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950 flex items-start gap-3"
              data-testid="contact-online-limitation"
            >
              <span
                className="material-symbols-outlined text-[20px] text-amber-700 shrink-0 mt-0.5"
                aria-hidden="true"
              >
                info
              </span>
              <div className="space-y-1">
                <p className="font-bold">Kênh tiếp nhận trực tuyến đang được hoàn thiện</p>
                <p className="leading-relaxed text-amber-900">
                  Hệ thống tiếp nhận biểu mẫu trực tuyến hiện chưa tích hợp endpoint lưu trữ cơ sở dữ liệu.
                  Để được hỗ trợ hồ sơ và giải đáp thông tin chính xác nhất, quý thí sinh vui lòng liên hệ trực tiếp
                  qua Cổng thông tin chính thức tại <a href={OFFICIAL_CAMPUS_INFO.officialContactUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold">caodang.fpt.edu.vn/lien-he</a> hoặc đến Văn phòng Tuyển sinh tại <strong>Toà nhà Innovation (QTSC Quận 12)</strong>.
                </p>
              </div>
            </div>

            {submittedNotice && (
              <div
                role="status"
                className="mb-6 p-5 rounded-2xl bg-surface-container border border-surface-container-high text-center space-y-3"
                data-testid="contact-submission-notice"
              >
                <span className="material-symbols-outlined text-3xl text-primary" aria-hidden="true">
                  public
                </span>
                <h3 className="text-sm font-bold text-on-surface font-heading">
                  Vui lòng truy cập Cổng Thông tin Tuyển sinh Chính thức
                </h3>
                <p className="text-xs text-secondary leading-relaxed max-w-md mx-auto">
                  Biểu mẫu trực tuyến chưa hỗ trợ gửi tự động qua hệ thống. Quý phụ huynh và thí sinh {formData.fullName ? `(${formData.fullName}) ` : ""}vui lòng truy cập Cổng liên hệ chính thức <strong>{OFFICIAL_CAMPUS_INFO.officialContactUrl}</strong> hoặc cổng trường <strong>{OFFICIAL_CAMPUS_INFO.officialSiteUrl}</strong> để cán bộ tuyển sinh hỗ trợ trực tiếp.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmittedNotice(false)}
                  className="ui-btn ui-btn-outline text-xs px-3.5 py-1.5 cursor-pointer"
                >
                  Đóng thông báo
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-2">Họ và tên thí sinh *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Hoàng Long"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="ui-input"
                    data-testid="contact-name-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-2">Số điện thoại liên hệ *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ví dụ: 0912345678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="ui-input"
                    data-testid="contact-phone-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-2">Email cá nhân *</label>
                  <input
                    type="email"
                    required
                    placeholder="Ví dụ: hoanglong@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="ui-input"
                    data-testid="contact-email-input"
                  />
                </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-2">Tỉnh / Thành phố</label>
                    <select
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      className="ui-input"
                    >
                      <option>TP. Hồ Chí Minh</option>
                      <option>Bình Dương</option>
                      <option>Đồng Nai</option>
                      <option>Tây Ninh</option>
                      <option>Long An</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-2">Ngành học quan tâm nhất *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className={`p-3.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                      formData.major === "cntt" ? "border-primary bg-primary-fixed/40 text-primary font-bold" : "border-surface-container hover:border-primary-container"
                    }`}>
                      <input
                        type="radio"
                        name="major"
                        checked={formData.major === "cntt"}
                        onChange={() => setFormData({ ...formData, major: "cntt" })}
                        className="text-primary"
                      />
                      <span className="text-xs">Công nghệ Thông tin</span>
                    </label>

                    <label className={`p-3.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                      formData.major === "do-hoa" ? "border-primary bg-primary-fixed/40 text-primary font-bold" : "border-surface-container hover:border-primary-container"
                    }`}>
                      <input
                        type="radio"
                        name="major"
                        checked={formData.major === "do-hoa"}
                        onChange={() => setFormData({ ...formData, major: "do-hoa" })}
                        className="text-primary"
                      />
                      <span className="text-xs">Thiết kế Đồ họa</span>
                    </label>

                    <label className={`p-3.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                      formData.major === "marketing" ? "border-primary bg-primary-fixed/40 text-primary font-bold" : "border-surface-container hover:border-primary-container"
                    }`}>
                      <input
                        type="radio"
                        name="major"
                        checked={formData.major === "marketing"}
                        onChange={() => setFormData({ ...formData, major: "marketing" })}
                        className="text-primary"
                      />
                      <span className="text-xs">Digital Marketing</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-2">Hình thức xét tuyển mong muốn</label>
                  <select
                    value={formData.admissionType}
                    onChange={(e) => setFormData({ ...formData, admissionType: e.target.value })}
                    className="ui-input"
                  >
                    <option value="hoc-ba">Xét tuyển Học bạ THPT (Lớp 11 hoặc HK1 Lớp 12)</option>
                    <option value="tot-nghiep">Xét kết quả kỳ thi Tốt nghiệp THPT 2026</option>
                    <option value="chuyen-tiep">Chuyển tiếp đại học / Cao đẳng khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-2">Câu hỏi hoặc yêu cầu cần tư vấn thêm</label>
                  <textarea
                    rows={3}
                    placeholder="Nhập câu hỏi về chính sách học bổng, ký túc xá, hoặc lịch Open Day gần nhất..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="ui-input py-2.5"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D9580F] to-[#F26F21] text-white font-heading font-bold text-sm shadow-md shadow-orange-500/25 hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[19px]">send</span>
                  <span>Gửi Đăng Ký Tư Vấn Miễn Phí</span>
                </button>
                <p className="text-[11px] text-center text-secondary mt-1">
                  Thông tin của bạn được cam kết bảo mật theo tiêu chuẩn an toàn dữ liệu FPT Education.
                </p>
              </form>
          </div>

          {/* Campus Address & Transport Guide (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-surface-container-lowest rounded-3xl p-7 border border-surface-container shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-surface-container-low">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">apartment</span>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-on-surface">Cơ sở CVPM Quang Trung</h3>
                  <p className="text-xs text-secondary">Trung tâm đào tạo công nghệ cao hàng đầu</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3 p-3.5 bg-surface-container-low rounded-xl">
                  <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">pin_drop</span>
                  <div>
                    <span className="font-bold text-on-surface block mb-0.5">Địa chỉ cụ thể:</span>
                    <span className="text-secondary leading-relaxed">{OFFICIAL_CAMPUS_INFO.address}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-surface-container-low rounded-xl">
                  <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">schedule</span>
                  <div>
                    <span className="font-bold text-on-surface block mb-0.5">Giờ làm việc văn phòng tuyển sinh:</span>
                    <span className="text-secondary leading-relaxed">{OFFICIAL_CAMPUS_INFO.supportHours}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-surface-container-low rounded-xl">
                  <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">directions_bus</span>
                  <div>
                    <span className="font-bold text-on-surface block mb-0.5">Chỉ dẫn phương tiện công cộng:</span>
                    <span className="text-secondary leading-relaxed">
                      Tuyến xe bus 55, 48, 24 ghé trạm trước cổng chính QTSC; bãi gửi xe sinh viên sức chứa 2.000 xe máy.
                    </span>
                  </div>
                </div>
              </div>

              {/* Mini Map Box */}
              <div className="rounded-2xl overflow-hidden border border-surface-container relative">
                <div className="h-36 bg-slate-900 flex items-center justify-center relative">
                  <div className="text-center px-4">
                    <span className="material-symbols-outlined text-3xl text-primary animate-bounce">location_on</span>
                    <span className="block text-xs font-bold text-white mt-1">FPT Polytechnic TP.HCM (Tòa T)</span>
                    <span className="text-[11px] text-slate-400 font-mono">{OFFICIAL_CAMPUS_INFO.coordinatesLabel}</span>
                  </div>
                </div>
                <div className="p-3.5 bg-surface-container-low flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface">Mở trên Bản đồ số GIS</span>
                  <Link href="/map" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                    <span>Xem chi tiết</span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Assistance banner */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100/60 rounded-3xl p-6 border border-primary/20 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-2xl text-primary">public</span>
                <span className="font-heading font-bold text-sm text-on-surface">Cổng Hỗ trợ Tuyển sinh Trực tuyến</span>
              </div>
              <p className="text-xs text-secondary">Truy cập cổng tuyển sinh chính thức để nộp hồ sơ xét tuyển và liên hệ tư vấn viên.</p>
              <div className="flex gap-3 pt-1">
                <a
                  href={OFFICIAL_CAMPUS_INFO.officialContactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-primary text-white text-xs font-bold text-center shadow-xs"
                >
                  Cổng Liên Hệ Tuyển Sinh
                </a>
                <a
                  href={OFFICIAL_CAMPUS_INFO.officialSiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-white border border-surface-container text-on-surface text-xs font-bold text-center"
                >
                  caodang.fpt.edu.vn
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-surface-container-lowest rounded-3xl p-8 sm:p-10 border border-surface-container shadow-sm space-y-6">
          <h3 className="text-xl font-bold font-heading text-on-surface">Câu hỏi thường gặp về Tuyển sinh</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-container">
              <h4 className="font-bold text-sm text-on-surface mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">help</span> Hồ sơ xét tuyển gồm những gì?
              </h4>
              <p className="text-xs text-secondary leading-relaxed">
                Chỉ cần bản chụp/photo Học bạ THPT, Giấy chứng nhận tốt nghiệp tạm thời (hoặc bằng tốt nghiệp) và bản sao CCCD gắn chip.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-container">
              <h4 className="font-bold text-sm text-on-surface mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">help</span> Tham quan 360° có cần tài khoản không?
              </h4>
              <p className="text-xs text-secondary leading-relaxed">
                Hoàn toàn không cần tài khoản! Bạn chỉ cần vào mục &quot;Tour 360°&quot; trên thanh menu để xoay góc nhìn tự do trên mọi thiết bị.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-container">
              <h4 className="font-bold text-sm text-on-surface mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">help</span> Học phí FPT Polytechnic tính ra sao?
              </h4>
              <p className="text-xs text-secondary leading-relaxed">
                Học phí thu theo từng học kỳ (tổng 7 kỳ, thời gian 2 năm 4 tháng), cam kết không phát sinh phụ phí đột xuất.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-container">
              <h4 className="font-bold text-sm text-on-surface mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">help</span> Vé mời Open Day 2026 có mất phí không?
              </h4>
              <p className="text-xs text-secondary leading-relaxed">
                Hoàn toàn miễn phí 100%! Sau khi đăng ký trực tuyến, mã QR vé sẽ được gửi ngay đến bạn để check-in tại cổng trường.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
