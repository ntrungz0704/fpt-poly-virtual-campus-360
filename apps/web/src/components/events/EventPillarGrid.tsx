import React from "react";
import { OPEN_DAY_FAQ } from "@/data/campus-data";
import {
  AnimatedContent,
  BlurText,
  SpotlightCard,
} from "@/components/animations";

const ACCESS_STEPS = [
  {
    step: "01",
    icon: "explore",
    title: "Xem lịch công khai & khuôn viên tự do",
    description:
      "Mọi khách ghé thăm đều xem được khung giờ chung, bản đồ QTSC và tham quan Tour 360° không giới hạn.",
  },
  {
    step: "02",
    icon: "mark_email_read",
    title: "Nhận tài khoản mời từ Ban Tổ Chức",
    description:
      "Khách mời tham gia workshop chuyên sâu nhận mã tài khoản và mật khẩu tạm qua Zalo, SMS hoặc Email.",
  },
  {
    step: "03",
    icon: "qr_code_2",
    title: "Đăng nhập để nhận QR & lịch cá nhân",
    description:
      "Đổi mật khẩu bảo mật ở lần đăng nhập đầu, mở thẻ Check-in QR tại Sảnh Innovation và theo dõi trạm hoạt động.",
  },
];

export function EventPillarGrid() {
  return (
    <div className="space-y-12">
      <section aria-labelledby="how-it-works-heading" className="space-y-5">
        <div className="space-y-1">
          <p className="type-label text-primary">Quy trình tham gia</p>
          <BlurText
            as="h2"
            id="how-it-works-heading"
            text="Phân tách trải nghiệm Công khai & Tài khoản mời"
            className="type-h2 text-on-surface"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {ACCESS_STEPS.map((item, index) => (
            <AnimatedContent
              key={item.step}
              delay={index * 0.08}
              distance={26}
              className="h-full"
            >
              <SpotlightCard className="rounded-2xl h-full">
                <div className="ui-card p-6 space-y-3 h-full">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
                      <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                        {item.icon}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-secondary">
                      Bước {item.step}
                    </span>
                  </div>
                  <h3 className="type-h3 text-on-surface">{item.title}</h3>
                  <p className="type-body-sm text-secondary leading-relaxed">{item.description}</p>
                </div>
              </SpotlightCard>
            </AnimatedContent>
          ))}
        </div>
      </section>

      <section aria-labelledby="faq-heading" className="space-y-5">
        <div className="space-y-1">
          <p className="type-label text-primary">Giải đáp thường gặp</p>
          <BlurText
            as="h2"
            id="faq-heading"
            text="Câu hỏi về Open Day & Tài khoản tham dự"
            className="type-h2 text-on-surface"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {OPEN_DAY_FAQ.map((faq, index) => (
            <AnimatedContent
              key={faq.id}
              delay={Math.min(index * 0.06, 0.24)}
              distance={22}
              className="h-full"
            >
              <SpotlightCard className="rounded-2xl h-full">
                <div className="ui-card p-5 space-y-2 h-full">
                  <h3 className="text-sm font-bold text-on-surface">{faq.question}</h3>
                  <p className="type-body-sm text-secondary leading-relaxed">{faq.answer}</p>
                </div>
              </SpotlightCard>
            </AnimatedContent>
          ))}
        </div>
      </section>
    </div>
  );
}
