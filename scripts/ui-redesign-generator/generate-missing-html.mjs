import fs from 'node:fs';
import path from 'node:path';

const cacheDir = path.join(process.cwd(), 'docs', 'stitch-cache');
fs.mkdirSync(cacheDir, { recursive: true });

const COMMON_HEAD = (title) => `<!DOCTYPE html>
<html lang="vi" class="scroll-smooth">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | FPT Polytechnic Virtual Campus 360°</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: {
              orange: '#F26F21',
              'orange-dark': '#D9580F',
              'orange-light': '#FFF5EE',
              navy: '#0D47A1',
              'navy-dark': '#0A2540',
              slate: '#0F172A',
              muted: '#64748B',
              bg: '#F8FAFC'
            }
          },
          fontFamily: {
            heading: ['"Plus Jakarta Sans"', 'sans-serif'],
            sans: ['Inter', 'sans-serif']
          }
        }
      }
    }
  </script>
  <style>
    body { font-family: 'Inter', sans-serif; background: #F8FAFC; color: #0F172A; }
    h1, h2, h3, h4, h5, h6, .font-heading { font-family: 'Plus Jakarta Sans', sans-serif; }
    .glass-nav { background: rgba(255, 255, 255, 0.92); backdrop-filter: blur(16px); }
  </style>
</head>
<body class="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
  <!-- Public Global Header -->
  <header class="sticky top-0 z-50 glass-nav border-b border-slate-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#D9580F] to-[#F26F21] flex items-center justify-center text-white font-heading font-black text-2xl shadow-lg shadow-orange-500/25">P</div>
        <div>
          <span class="font-heading font-black text-xl text-slate-900 tracking-tight block">FPT POLYTECHNIC</span>
          <span class="text-xs font-semibold text-[#F26F21] uppercase tracking-wider">Virtual Campus 360°</span>
        </div>
      </div>
      <nav class="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
        <a href="/" class="hover:text-[#F26F21] transition">Trang chủ</a>
        <a href="/about" class="hover:text-[#F26F21] transition">Giới thiệu</a>
        <a href="/virtual-campus" class="hover:text-[#F26F21] transition flex items-center gap-1.5 text-[#F26F21]">
          <span class="material-symbols-outlined text-[18px]">view_in_ar</span> Tour 360°
        </a>
        <a href="/map" class="hover:text-[#F26F21] transition">Bản đồ GIS</a>
        <a href="/locations" class="hover:text-[#F26F21] transition">Cơ sở vật chất</a>
        <a href="/events" class="hover:text-[#F26F21] transition">Sự kiện Open Day</a>
        <a href="/games" class="hover:text-[#F26F21] transition">Minigame</a>
        <a href="/news" class="hover:text-[#F26F21] transition">Tin tức</a>
        <a href="/contact" class="hover:text-[#F26F21] transition">Tuyển sinh</a>
      </nav>
      <div class="flex items-center gap-3">
        <a href="/login" class="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-100 transition">Đăng nhập</a>
        <a href="/events" class="px-5 py-2.5 rounded-xl bg-[#F26F21] text-white text-sm font-bold shadow-md shadow-orange-500/20 hover:bg-[#D9580F] transition flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[18px]">confirmation_number</span> Nhận vé Open Day
        </a>
      </div>
    </div>
  </header>
`;

const COMMON_FOOTER = `
  <!-- Public Global Footer -->
  <footer class="bg-slate-900 text-slate-400 py-16 border-t border-slate-800 mt-auto">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
      <div>
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-[#F26F21] flex items-center justify-center text-white font-heading font-black text-xl">P</div>
          <span class="font-heading font-bold text-lg text-white">FPT POLYTECHNIC</span>
        </div>
        <p class="text-xs leading-relaxed text-slate-400 mb-4">Trường Cao đẳng FPT Polytechnic cơ sở TP.HCM. Triết lý Thực học - Thực nghiệp, tiên phong ứng dụng công nghệ thực tế ảo 360° trong giáo dục số.</p>
        <p class="text-xs text-slate-500">© 2026 FPT Polytechnic. All rights reserved.</p>
      </div>
      <div>
        <h4 class="font-heading font-bold text-sm text-white uppercase tracking-wider mb-4">Khám phá Campus</h4>
        <ul class="space-y-2.5 text-xs">
          <li><a href="/virtual-campus" class="hover:text-[#F26F21] transition">Không gian 360° Toàn cảnh</a></li>
          <li><a href="/map" class="hover:text-[#F26F21] transition">Bản đồ số GIS & Phân tầng</a></li>
          <li><a href="/locations" class="hover:text-[#F26F21] transition">Xưởng thực hành & Phòng Lab</a></li>
          <li><a href="/events" class="hover:text-[#F26F21] transition">Ngày hội trải nghiệm Open Day</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-heading font-bold text-sm text-white uppercase tracking-wider mb-4">Hệ thống Cổng thông tin</h4>
        <ul class="space-y-2.5 text-xs">
          <li><a href="/portal/student" class="hover:text-[#F26F21] transition">Cổng Sinh viên & Thẻ điện tử</a></li>
          <li><a href="/portal/parent" class="hover:text-[#F26F21] transition">Cổng Phụ huynh theo dõi</a></li>
          <li><a href="/admin" class="hover:text-[#F26F21] transition">Hệ thống Quản trị CMS 360°</a></li>
          <li><a href="/games" class="hover:text-[#F26F21] transition">Minigame & Tích lũy XP</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-heading font-bold text-sm text-white uppercase tracking-wider mb-4">Liên hệ & Tuyển sinh</h4>
        <p class="text-xs leading-relaxed text-slate-400 mb-2">Tòa nhà T, Công viên phần mềm Quang Trung, Phường Tân Chánh Hiệp, Quận 12, TP.HCM</p>
        <p class="text-xs text-slate-300 font-semibold mb-1">Hotline: 1900 633 540 - 0981 725 836</p>
        <p class="text-xs text-slate-300">Email: tuyensinhpoly@fpt.edu.vn</p>
      </div>
    </div>
  </footer>
</body>
</html>`;

// 1. PUB-003: Admissions Contact
const pub003Html = `${COMMON_HEAD('Liên hệ Tuyển sinh & Tư vấn Cơ sở')}
  <main class="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-6">
      <a href="/" class="hover:text-[#F26F21]">Trang chủ</a>
      <span class="material-symbols-outlined text-xs">chevron_right</span>
      <span class="text-slate-900 font-bold">Liên hệ & Tư vấn Tuyển sinh 2026</span>
    </div>

    <!-- Hero Header -->
    <div class="bg-gradient-to-r from-slate-900 via-[#0A2540] to-slate-900 rounded-3xl p-8 sm:p-12 text-white mb-12 shadow-xl relative overflow-hidden">
      <div class="absolute -right-10 -bottom-10 w-96 h-96 bg-[#F26F21]/20 rounded-full blur-3xl pointer-events-none"></div>
      <div class="max-w-2xl relative z-10">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F26F21]/20 text-[#F26F21] text-xs font-bold border border-[#F26F21]/30 mb-4">
          <span class="material-symbols-outlined text-[16px]">school</span> Tuyển sinh Khóa 22.3 (Năm 2026)
        </span>
        <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 font-heading leading-tight">
          Kết nối cùng FPT Polytechnic — Sẵn sàng cho Tương lai Công nghệ
        </h1>
        <p class="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
          Đội ngũ cán bộ tư vấn sẵn sàng giải đáp 100% thắc mắc về phương thức xét tuyển học bạ, học phí trọn gói, cam kết việc làm và trải nghiệm thực tế cơ sở vật chất.
        </p>
        <div class="flex flex-wrap gap-4 text-xs font-semibold">
          <div class="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2.5 rounded-xl border border-white/10">
            <span class="material-symbols-outlined text-[#F26F21]">call</span> Hotline 24/7: 1900 633 540
          </div>
          <div class="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2.5 rounded-xl border border-white/10">
            <span class="material-symbols-outlined text-[#F26F21]">location_on</span> QTSC Quận 12, TP.HCM
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content: Form + Campus Info -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-16">
      <!-- Consultation Form (7 Cols) -->
      <div class="lg:col-span-7 bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm">
        <div class="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
          <div>
            <h2 class="text-xl font-bold font-heading text-slate-900">Đăng ký Tư vấn & Nhận Học bổng</h2>
            <p class="text-xs text-slate-500 mt-1">Điền thông tin để nhận tài liệu tuyển sinh và vé mời tham quan Campus trực tiếp</p>
          </div>
          <span class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">Đang nhận hồ sơ</span>
        </div>

        <form class="space-y-5" onsubmit="return false;">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-2">Họ và tên thí sinh <span class="text-red-500">*</span></label>
              <input type="text" value="Nguyễn Văn An" class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#F26F21] focus:border-transparent outline-none transition">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-2">Số điện thoại liên hệ <span class="text-red-500">*</span></label>
              <input type="tel" value="0987 654 321" class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#F26F21] focus:border-transparent outline-none transition">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-2">Email cá nhân / Phụ huynh <span class="text-red-500">*</span></label>
              <input type="email" value="an.nguyen@gmail.com" class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#F26F21] focus:border-transparent outline-none transition">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-2">Tỉnh / Thành phố đang sống</label>
              <select class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#F26F21] outline-none">
                <option>TP. Hồ Chí Minh</option>
                <option>Bình Dương</option>
                <option>Đồng Nai</option>
                <option>Tây Ninh</option>
                <option>Long An</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-2">Ngành học bạn đang quan tâm nhất <span class="text-red-500">*</span></label>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label class="border-2 border-[#F26F21] bg-orange-50/50 p-3.5 rounded-xl flex items-center gap-2 cursor-pointer">
                <input type="radio" name="major" checked class="text-[#F26F21] focus:ring-0">
                <span class="text-xs font-bold text-slate-900">Công nghệ Thông tin</span>
              </label>
              <label class="border border-slate-200 p-3.5 rounded-xl flex items-center gap-2 cursor-pointer hover:border-slate-300">
                <input type="radio" name="major" class="text-[#F26F21] focus:ring-0">
                <span class="text-xs font-semibold text-slate-700">Thiết kế Đồ họa & Game</span>
              </label>
              <label class="border border-slate-200 p-3.5 rounded-xl flex items-center gap-2 cursor-pointer hover:border-slate-300">
                <input type="radio" name="major" class="text-[#F26F21] focus:ring-0">
                <span class="text-xs font-semibold text-slate-700">Digital Marketing</span>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-2">Hình thức xét tuyển mong muốn</label>
            <select class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#F26F21] outline-none">
              <option>Xét tuyển Học bạ THPT (Lớp 11 hoặc HK1 Lớp 12)</option>
              <option>Xét kết quả kỳ thi Tốt nghiệp THPT 2026</option>
              <option>Chuyển tiếp đại học / Cao đẳng khác</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-2">Câu hỏi hoặc yêu cầu cần tư vấn thêm</label>
            <textarea rows="3" placeholder="Nhập câu hỏi về chính sách học bổng, ký túc xá, hoặc lịch Open Day gần nhất..." class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#F26F21] outline-none"></textarea>
          </div>

          <button type="submit" class="w-full py-4 rounded-xl bg-gradient-to-r from-[#D9580F] to-[#F26F21] text-white font-heading font-bold text-base shadow-lg shadow-orange-500/25 hover:opacity-95 transition flex items-center justify-center gap-2">
            <span class="material-symbols-outlined">send</span> Gửi đăng ký tư vấn miễn phí
          </button>
          <p class="text-[11px] text-center text-slate-500 mt-2">Thông tin của bạn được cam kết bảo mật theo tiêu chuẩn an toàn dữ liệu FPT Education.</p>
        </form>
      </div>

      <!-- Campus Address & Transport Guide (5 Cols) -->
      <div class="lg:col-span-5 space-y-6">
        <!-- Campus Info Card -->
        <div class="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-12 h-12 rounded-2xl bg-orange-100 text-[#F26F21] flex items-center justify-center">
              <span class="material-symbols-outlined text-2xl">apartment</span>
            </div>
            <div>
              <h3 class="font-heading font-bold text-base text-slate-900">Cơ sở Công viên Phần mềm Quang Trung</h3>
              <p class="text-xs text-slate-500">Trung tâm đào tạo công nghệ cao hàng đầu</p>
            </div>
          </div>

          <div class="space-y-4 text-xs">
            <div class="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl">
              <span class="material-symbols-outlined text-[#F26F21] text-base shrink-0 mt-0.5">pin_drop</span>
              <div>
                <span class="font-bold text-slate-800 block mb-0.5">Địa chỉ cụ thể:</span>
                <span class="text-slate-600 leading-relaxed">Tòa nhà Innovation (Tòa T) & Tòa F, CVPM Quang Trung, P. Tân Chánh Hiệp, Q. 12, TP.HCM</span>
              </div>
            </div>
            <div class="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl">
              <span class="material-symbols-outlined text-[#F26F21] text-base shrink-0 mt-0.5">schedule</span>
              <div>
                <span class="font-bold text-slate-800 block mb-0.5">Giờ làm việc văn phòng tuyển sinh:</span>
                <span class="text-slate-600 leading-relaxed">Thứ Hai - Thứ Bảy: 07:30 - 18:30 (Chủ Nhật mở cửa tư vấn sáng)</span>
              </div>
            </div>
            <div class="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl">
              <span class="material-symbols-outlined text-[#F26F21] text-base shrink-0 mt-0.5">directions_bus</span>
              <div>
                <span class="font-bold text-slate-800 block mb-0.5">Chỉ dẫn phương tiện công cộng:</span>
                <span class="text-slate-600 leading-relaxed">Tuyến xe bus 55, 48, 24 ghé trạm trước cổng chính QTSC; bãi gửi xe sinh viên sức chứa 2.000 xe.</span>
              </div>
            </div>
          </div>

          <!-- Mini Map Preview Box -->
          <div class="mt-6 rounded-2xl overflow-hidden border border-slate-200 relative group">
            <div class="h-44 bg-slate-800 flex items-center justify-center relative">
              <!-- Visual placeholder for campus map -->
              <div class="absolute inset-0 bg-gradient-to-tr from-slate-900 to-slate-800 opacity-90"></div>
              <div class="relative z-10 text-center px-4">
                <span class="material-symbols-outlined text-4xl text-[#F26F21] animate-bounce">location_on</span>
                <span class="block text-xs font-bold text-white mt-1">FPT Polytechnic TP.HCM (Tòa T)</span>
                <span class="text-[11px] text-slate-400">10.8532° N, 106.6261° E</span>
              </div>
            </div>
            <div class="p-4 bg-slate-50 flex items-center justify-between">
              <span class="text-xs font-bold text-slate-700">Mở trên Bản đồ số GIS 360°</span>
              <a href="/map" class="text-xs font-bold text-[#F26F21] hover:underline flex items-center gap-1">
                Xem chi tiết <span class="material-symbols-outlined text-xs">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Hotlines & Social -->
        <div class="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-3xl p-6 border border-orange-200 text-slate-800">
          <div class="flex items-center gap-3 mb-3">
            <span class="material-symbols-outlined text-2xl text-[#F26F21]">headset_mic</span>
            <span class="font-heading font-bold text-sm">Hỗ trợ Trực tuyến Zalo & Hotline</span>
          </div>
          <p class="text-xs text-slate-600 mb-4">Gặp gỡ trực tiếp tư vấn viên qua Zalo Official Account hoặc hotline ưu tiên.</p>
          <div class="flex gap-3">
            <a href="tel:1900633540" class="flex-1 py-2.5 px-3 rounded-xl bg-[#F26F21] text-white text-xs font-bold text-center shadow-sm">Gọi 1900 633 540</a>
            <a href="#" class="flex-1 py-2.5 px-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-bold text-center">Chat Zalo Tuyển sinh</a>
          </div>
        </div>
      </div>
    </div>

    <!-- FAQ Accordion -->
    <div class="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm mb-12">
      <h3 class="text-xl font-bold font-heading text-slate-900 mb-6">Câu hỏi thường gặp về Tuyển sinh & Virtual Campus</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200/60">
          <h4 class="font-bold text-sm text-slate-900 mb-2 flex items-center gap-2">
            <span class="material-symbols-outlined text-[#F26F21] text-lg">help</span> Hồ sơ xét tuyển gồm những giấy tờ gì?
          </h4>
          <p class="text-xs text-slate-600 leading-relaxed">Chỉ cần bản chụp/photo Học bạ THPT, Giấy chứng nhận tốt nghiệp tạm thời (hoặc bằng tốt nghiệp THPT) và bản sao CCCD gắn chip.</p>
        </div>
        <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200/60">
          <h4 class="font-bold text-sm text-slate-900 mb-2 flex items-center gap-2">
            <span class="material-symbols-outlined text-[#F26F21] text-lg">help</span> Làm sao để tham quan trường bằng thực tế ảo 360°?
          </h4>
          <p class="text-xs text-slate-600 leading-relaxed">Bạn chỉ cần truy cập vào mục "Tour 360°" trên thanh menu, hỗ trợ tốt trên máy tính, điện thoại di động và kính thực tế ảo VR.</p>
        </div>
        <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200/60">
          <h4 class="font-bold text-sm text-slate-900 mb-2 flex items-center gap-2">
            <span class="material-symbols-outlined text-[#F26F21] text-lg">help</span> Học phí FPT Polytechnic được tính như thế nào?
          </h4>
          <p class="text-xs text-slate-600 leading-relaxed">Học phí thu theo từng học kỳ (tổng cộng 7 kỳ học, thời gian 2 năm 4 tháng), cam kết không tăng học phí đột ngột trong suốt khóa học.</p>
        </div>
        <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200/60">
          <h4 class="font-bold text-sm text-slate-900 mb-2 flex items-center gap-2">
            <span class="material-symbols-outlined text-[#F26F21] text-lg">help</span> Vé mời Open Day 2026 có thu phí không?
          </h4>
          <p class="text-xs text-slate-600 leading-relaxed">Hoàn toàn miễn phí 100%! Sau khi đăng ký trực tuyến, mã QR vé sẽ được gửi trực tiếp qua SMS, Email và hiển thị trong mục Vé của bạn.</p>
        </div>
      </div>
    </div>
  </main>
${COMMON_FOOTER}`;

// 2. PUB-005: Minigame & Lucky Wheel
const pub005Html = `${COMMON_HEAD('Minigame Vòng Quay May Mắn & Thợ Săn XP')}
  <main class="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-6">
      <a href="/" class="hover:text-[#F26F21]">Trang chủ</a>
      <span class="material-symbols-outlined text-xs">chevron_right</span>
      <span class="text-slate-900 font-bold">Gamification & Vòng Quay May Mắn 2026</span>
    </div>

    <!-- Gamification Status Bar -->
    <div class="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm mb-8 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-[#F26F21] flex items-center justify-center text-white text-2xl shadow-md shadow-orange-500/20">
          <span class="material-symbols-outlined text-3xl">casino</span>
        </div>
        <div>
          <h1 class="text-xl sm:text-2xl font-bold font-heading text-slate-900">Vòng Quay May Mắn FPT Poly</h1>
          <p class="text-xs text-slate-500">Khám phá không gian thực tế ảo, săn mã quà tặng và tích lũy điểm XP</p>
        </div>
      </div>
      <div class="flex items-center gap-4 sm:gap-6 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-200">
        <div>
          <span class="text-[11px] font-semibold text-slate-500 block">Lượt quay hôm nay:</span>
          <span class="font-heading font-black text-lg text-[#F26F21]">3 / 3 lượt</span>
        </div>
        <div class="w-px h-8 bg-slate-200"></div>
        <div>
          <span class="text-[11px] font-semibold text-slate-500 block">Ví điểm thưởng:</span>
          <span class="font-heading font-black text-lg text-emerald-600">1,450 XP</span>
        </div>
        <div class="w-px h-8 bg-slate-200"></div>
        <div>
          <span class="text-[11px] font-semibold text-slate-500 block">Hạng hiện tại:</span>
          <span class="font-heading font-black text-sm text-indigo-600">#4 Vàng 🏆</span>
        </div>
      </div>
    </div>

    <!-- Main Game Grid: Wheel + Live Winners -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
      <!-- Lucky Wheel Arena (7 Cols) -->
      <div class="lg:col-span-7 bg-gradient-to-b from-slate-900 via-[#0A2540] to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden flex flex-col items-center justify-center border border-slate-800">
        <div class="text-center mb-8">
          <span class="px-4 py-1.5 rounded-full bg-[#F26F21]/20 text-[#F26F21] text-xs font-bold border border-[#F26F21]/30">VÒNG QUAY CÔNG NGHỆ 360°</span>
          <h2 class="text-2xl font-bold font-heading mt-2">Bấm Quay Để Nhận Quà Ngay</h2>
        </div>

        <!-- Wheel Graphic Visual -->
        <div class="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center mb-8">
          <!-- Outer Neon Ring -->
          <div class="absolute inset-0 rounded-full border-8 border-dashed border-[#F26F21]/60 animate-spin" style="animation-duration: 30s;"></div>
          <!-- Wheel Body -->
          <div class="w-72 h-72 sm:w-84 sm:h-84 rounded-full bg-gradient-to-tr from-slate-800 to-slate-900 border-4 border-amber-400 shadow-2xl relative overflow-hidden flex items-center justify-center">
            <!-- 8 Segments SVG Graphic -->
            <svg class="w-full h-full" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="48" fill="#1E293B" stroke="#F26F21" stroke-width="1.5" />
              <!-- Wedge slices -->
              <path d="M50 50 L50 2 A48 48 0 0 1 84 16 Z" fill="#F26F21" opacity="0.9" />
              <path d="M50 50 L84 16 A48 48 0 0 1 98 50 Z" fill="#0D47A1" opacity="0.9" />
              <path d="M50 50 L98 50 A48 48 0 0 1 84 84 Z" fill="#F59E0B" opacity="0.9" />
              <path d="M50 50 L84 84 A48 48 0 0 1 50 98 Z" fill="#10B981" opacity="0.9" />
              <path d="M50 50 L50 98 A48 48 0 0 1 16 84 Z" fill="#8B5CF6" opacity="0.9" />
              <path d="M50 50 L16 84 A48 48 0 0 1 2 50 Z" fill="#EC4899" opacity="0.9" />
              <path d="M50 50 L2 50 A48 48 0 0 1 16 16 Z" fill="#F26F21" opacity="0.8" />
              <path d="M50 50 L16 16 A48 48 0 0 1 50 2 Z" fill="#3B82F6" opacity="0.8" />
            </svg>
            <!-- Center Spinner Cap -->
            <button class="absolute z-20 w-24 h-24 rounded-full bg-gradient-to-tr from-[#D9580F] to-[#F26F21] text-white font-heading font-black text-sm uppercase shadow-2xl flex flex-col items-center justify-center border-4 border-white hover:scale-105 transition cursor-pointer active:scale-95">
              <span class="material-symbols-outlined text-2xl">play_arrow</span>
              <span>QUAY</span>
            </button>
          </div>
          <!-- Wheel Pointer Indicator -->
          <div class="absolute -top-3 z-30 w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[28px] border-t-amber-400 drop-shadow-md"></div>
        </div>

        <!-- Wheel Prize Labels List -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full text-center text-xs font-semibold">
          <div class="bg-white/10 rounded-xl py-2 px-3">🎁 Áo thun Poly</div>
          <div class="bg-white/10 rounded-xl py-2 px-3">🎒 Balo Tech 2026</div>
          <div class="bg-white/10 rounded-xl py-2 px-3">⭐ 500 XP Campus</div>
          <div class="bg-white/10 rounded-xl py-2 px-3">🎟️ Vé VIP Open Day</div>
        </div>
      </div>

      <!-- Live Leaderboard & Recent Winners (5 Cols) -->
      <div class="lg:col-span-5 space-y-6">
        <!-- Leaderboard -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-amber-500 text-2xl">military_tech</span>
              <h3 class="font-heading font-bold text-base text-slate-900">Bảng Xếp Hạng Tuần</h3>
            </div>
            <span class="text-xs font-bold text-[#F26F21]">Cập nhật 5 phút trước</span>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 rounded-2xl bg-amber-50/80 border border-amber-200">
              <div class="flex items-center gap-3">
                <span class="w-7 h-7 rounded-full bg-amber-400 text-slate-900 font-bold text-xs flex items-center justify-center">1</span>
                <div>
                  <span class="font-bold text-xs text-slate-900 block">Lê Hoàng Nam</span>
                  <span class="text-[10px] text-slate-500">Chuyên ngành Lập trình Web</span>
                </div>
              </div>
              <span class="font-heading font-black text-xs text-amber-700">4,850 XP</span>
            </div>

            <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div class="flex items-center gap-3">
                <span class="w-7 h-7 rounded-full bg-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center">2</span>
                <div>
                  <span class="font-bold text-xs text-slate-900 block">Trần Thị Bích Ngọc</span>
                  <span class="text-[10px] text-slate-500">Thiết kế Đồ họa</span>
                </div>
              </div>
              <span class="font-heading font-black text-xs text-slate-700">4,200 XP</span>
            </div>

            <div class="flex items-center justify-between p-3 rounded-2xl bg-orange-50/60 border border-orange-200">
              <div class="flex items-center gap-3">
                <span class="w-7 h-7 rounded-full bg-orange-300 text-slate-900 font-bold text-xs flex items-center justify-center">3</span>
                <div>
                  <span class="font-bold text-xs text-slate-900 block">Đặng Quang Huy</span>
                  <span class="text-[10px] text-slate-500">Ứng dụng Phần mềm</span>
                </div>
              </div>
              <span class="font-heading font-black text-xs text-orange-700">3,950 XP</span>
            </div>

            <div class="flex items-center justify-between p-3 rounded-2xl bg-blue-50/70 border border-blue-200 ring-2 ring-blue-400/30">
              <div class="flex items-center gap-3">
                <span class="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">4</span>
                <div>
                  <span class="font-bold text-xs text-blue-900 block">Bạn (Nguyễn Văn An)</span>
                  <span class="text-[10px] text-blue-600">Thí sinh tiềm năng</span>
                </div>
              </div>
              <span class="font-heading font-black text-xs text-blue-700">1,450 XP</span>
            </div>
          </div>
        </div>

        <!-- Recent Winners Ticker -->
        <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <div class="flex items-center gap-2 mb-4">
            <span class="material-symbols-outlined text-emerald-600">celebration</span>
            <h4 class="font-heading font-bold text-sm text-slate-900">Người trúng thưởng gần đây</h4>
          </div>
          <div class="space-y-2 text-xs">
            <div class="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
              <span class="font-semibold text-slate-700">Nguyễn *** Tuấn (0908***12)</span>
              <span class="font-bold text-[#F26F21]">Áo thun FPT Poly</span>
            </div>
            <div class="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
              <span class="font-semibold text-slate-700">Phạm *** Linh (0971***88)</span>
              <span class="font-bold text-emerald-600">+1000 XP thưởng</span>
            </div>
            <div class="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
              <span class="font-semibold text-slate-700">Vũ *** Minh (0933***45)</span>
              <span class="font-bold text-indigo-600">Bình nước giữ nhiệt</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Daily Campus Quizzes Section -->
    <div class="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm mb-12">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h3 class="text-xl font-bold font-heading text-slate-900">Thử Thách Trắc Nghiệm Campus — Nhận Thêm Lượt Quay</h3>
          <p class="text-xs text-slate-500 mt-1">Trả lời đúng 3 câu hỏi về khuôn viên trường để nhận thêm 2 lượt quay may mắn</p>
        </div>
        <span class="px-4 py-2 rounded-xl bg-orange-100 text-[#F26F21] text-xs font-bold">+2 Lượt / Ngày</span>
      </div>

      <div class="bg-slate-50 rounded-2xl p-6 border border-slate-200 max-w-3xl">
        <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Câu hỏi 1 / 3</span>
        <h4 class="text-base font-bold text-slate-900 mb-4">Tòa nhà nào tại CVPM Quang Trung tập trung các phòng thực hành công nghệ cao AI và Studio 360° của FPT Polytechnic?</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold">
          <button class="p-3.5 rounded-xl border-2 border-[#F26F21] bg-orange-50 text-left text-slate-900 flex items-center justify-between">
            <span>A. Tòa nhà Innovation (Tòa T)</span>
            <span class="material-symbols-outlined text-[#F26F21] text-base">check_circle</span>
          </button>
          <button class="p-3.5 rounded-xl border border-slate-200 bg-white text-left text-slate-700 hover:border-slate-300">
            <span>B. Tòa nhà Thư viện trung tâm</span>
          </button>
          <button class="p-3.5 rounded-xl border border-slate-200 bg-white text-left text-slate-700 hover:border-slate-300">
            <span>C. Khu ký túc xá QTSC</span>
          </button>
          <button class="p-3.5 rounded-xl border border-slate-200 bg-white text-left text-slate-700 hover:border-slate-300">
            <span>D. Tòa nhà Điều hành chung</span>
          </button>
        </div>
      </div>
    </div>
  </main>
${COMMON_FOOTER}`;

// 3. PUB-007: Location Detail & Lab
const pub007Html = `${COMMON_HEAD('Phòng Thực Hành AI & Robotics Innovation Lab — Tòa T')}
  <main class="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-6">
      <a href="/" class="hover:text-[#F26F21]">Trang chủ</a>
      <span class="material-symbols-outlined text-xs">chevron_right</span>
      <a href="/locations" class="hover:text-[#F26F21]">Cơ sở vật chất</a>
      <span class="material-symbols-outlined text-xs">chevron_right</span>
      <span class="text-slate-900 font-bold">AI & Robotics Innovation Lab (Phòng T302)</span>
    </div>

    <!-- Location Header Banner -->
    <div class="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-10">
      <div class="flex flex-wrap items-start justify-between gap-6 pb-6 border-b border-slate-100">
        <div>
          <div class="flex items-center gap-2 mb-3">
            <span class="px-3 py-1 rounded-full bg-orange-100 text-[#F26F21] text-xs font-bold">Tòa nhà T — Tầng 3</span>
            <span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">Đang mở cửa học tập</span>
            <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">Mã phòng: T302</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900">
            Phòng Thực Hành AI, Robotics & Studio Đồ Họa 3D
          </h1>
          <p class="text-xs sm:text-sm text-slate-500 mt-2">
            Không gian nghiên cứu ứng dụng Trí tuệ nhân tạo, vi xử lý IoT và kỹ thuật dựng hình đồ họa cao cấp của sinh viên ngành CNTT.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <a href="/virtual-campus?node=t302" class="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#D9580F] to-[#F26F21] text-white font-heading font-bold text-sm shadow-lg shadow-orange-500/25 hover:opacity-95 transition flex items-center gap-2">
            <span class="material-symbols-outlined text-xl">360</span> Bật Tour 360° Phòng Này
          </a>
          <a href="/map?pin=t302" class="px-5 py-3 rounded-2xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition flex items-center gap-2">
            <span class="material-symbols-outlined text-xl">map</span> Xem vị trí trên GIS
          </a>
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 text-center sm:text-left">
        <div>
          <span class="text-xs text-slate-400 font-semibold block">Sức chứa tối đa</span>
          <span class="text-xl font-heading font-black text-slate-900 mt-1 block">60 Sinh viên</span>
        </div>
        <div>
          <span class="text-xs text-slate-400 font-semibold block">Hệ thống máy trạm</span>
          <span class="text-xl font-heading font-black text-slate-900 mt-1 block">60 RTX 4080</span>
        </div>
        <div>
          <span class="text-xs text-slate-400 font-semibold block">Diện tích sàn</span>
          <span class="text-xl font-heading font-black text-slate-900 mt-1 block">180 m²</span>
        </div>
        <div>
          <span class="text-xs text-slate-400 font-semibold block">Thời lượng mở cửa</span>
          <span class="text-xl font-heading font-black text-[#F26F21] mt-1 block">07:00 - 21:30</span>
        </div>
      </div>
    </div>

    <!-- Media Gallery & Panorama Viewport -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
      <!-- 360 Panorama Interactive Simulation Preview (8 Cols) -->
      <div class="lg:col-span-8 bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-xl relative group">
        <div class="h-96 sm:h-[480px] bg-slate-950 flex items-center justify-center relative overflow-hidden">
          <!-- Background Visual Simulator -->
          <div class="absolute inset-0 bg-cover bg-center opacity-70" style="background-image: radial-gradient(#1E293B 2px, transparent 2px), radial-gradient(#0F172A 2px, #020617 2px); background-size: 40px 40px;"></div>
          <!-- 360 HUD Overlay -->
          <div class="relative z-10 text-center px-6">
            <div class="w-20 h-20 rounded-full bg-[#F26F21]/20 border-2 border-[#F26F21] text-[#F26F21] flex items-center justify-center mx-auto mb-4 backdrop-blur shadow-2xl animate-pulse">
              <span class="material-symbols-outlined text-4xl">view_in_ar</span>
            </div>
            <h3 class="font-heading font-bold text-xl text-white">Toàn Cảnh 360° Ultra HD — T302 Innovation Lab</h3>
            <p class="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">Khám phá góc nhìn tự do 360 độ, kiểm tra thông số máy trạm đồ họa, bảng điện tử và dàn cánh tay robot thực tế.</p>
            <a href="/virtual-campus?node=t302" class="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-[#F26F21] text-white font-bold text-xs shadow-lg shadow-orange-500/30 hover:bg-[#D9580F] transition">
              <span class="material-symbols-outlined text-base">fullscreen</span> Tương tác góc nhìn 360° ngay
            </a>
          </div>
          <!-- Compass Badge -->
          <div class="absolute top-4 left-4 z-20 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-700 text-white text-xs font-semibold flex items-center gap-2">
            <span class="material-symbols-outlined text-sm text-[#F26F21]">explore</span> Hướng Bắc 45°
          </div>
        </div>
      </div>

      <!-- Facility Specs & Lab Schedule (4 Cols) -->
      <div class="lg:col-span-4 space-y-6">
        <!-- Specs List -->
        <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm">
          <h3 class="font-heading font-bold text-base text-slate-900 mb-4 pb-3 border-b border-slate-100">Trang Thiết Bị Kỹ Thuật</h3>
          <ul class="space-y-3.5 text-xs">
            <li class="flex items-start gap-2.5">
              <span class="material-symbols-outlined text-[#F26F21] text-base shrink-0">memory</span>
              <div>
                <span class="font-bold text-slate-800 block">60 Bộ Máy Trạm AI Workstation</span>
                <span class="text-slate-500">Core i9-14900K, 64GB RAM DDR5, GPU NVIDIA RTX 4080 16GB</span>
              </div>
            </li>
            <li class="flex items-start gap-2.5">
              <span class="material-symbols-outlined text-[#F26F21] text-base shrink-0">vrpano</span>
              <div>
                <span class="font-bold text-slate-800 block">Hệ Thống Kính VR Meta Quest 3</span>
                <span class="text-slate-500">10 bộ kính trải nghiệm thực tế ảo chuyên dụng</span>
              </div>
            </li>
            <li class="flex items-start gap-2.5">
              <span class="material-symbols-outlined text-[#F26F21] text-base shrink-0">tv</span>
              <div>
                <span class="font-bold text-slate-800 block">Màn Hình Tương Tác 86 Inch</span>
                <span class="text-slate-500">Độ phân giải 4K cảm ứng đa điểm hỗ trợ giảng dạy trực tiếp</span>
              </div>
            </li>
            <li class="flex items-start gap-2.5">
              <span class="material-symbols-outlined text-[#F26F21] text-base shrink-0">wifi</span>
              <div>
                <span class="font-bold text-slate-800 block">Hạ Tầng Mạng Wifi 6E Mesh</span>
                <span class="text-slate-500">Tốc độ truyền tải 2.5 Gbps riêng biệt cho phòng thực hành</span>
              </div>
            </li>
          </ul>
        </div>

        <!-- Today Timetable -->
        <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h4 class="font-heading font-bold text-sm text-slate-900">Lịch Học & Thực Hành Hôm Nay</h4>
            <span class="text-[11px] font-bold text-emerald-600">Thứ Bảy</span>
          </div>
          <div class="space-y-2.5 text-xs">
            <div class="p-3 rounded-xl bg-orange-50/70 border border-orange-200">
              <div class="flex justify-between font-bold text-slate-900">
                <span>Ca 1 (07:30 - 09:30)</span>
                <span class="text-[#F26F21]">Đang diễn ra</span>
              </div>
              <span class="text-slate-600 block mt-1">Lập trình Nhập môn AI (GV. ThS. Trần Minh Đức)</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div class="flex justify-between font-bold text-slate-900">
                <span>Ca 2 (09:45 - 11:45)</span>
                <span class="text-slate-500">Sắp tới</span>
              </div>
              <span class="text-slate-600 block mt-1">Xử lý Ngôn ngữ Tự nhiên & Thị giác Máy tính</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div class="flex justify-between font-bold text-slate-900">
                <span>Ca Chiều (13:30 - 17:30)</span>
                <span class="text-emerald-600 font-semibold">Tự học mở (Open Access)</span>
              </div>
              <span class="text-slate-600 block mt-1">Dành riêng cho đồ án tốt nghiệp sinh viên K20 & K21</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
${COMMON_FOOTER}`;

// 4. AUTH-002: Force Password Change
const auth002Html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Đổi Mật Khẩu Lần Đầu | FPT Polytechnic Virtual Campus 360°</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: { orange: '#F26F21', 'orange-dark': '#D9580F', navy: '#0D47A1', 'navy-dark': '#0A2540', slate: '#0F172A' }
          },
          fontFamily: {
            heading: ['"Plus Jakarta Sans"', 'sans-serif'],
            sans: ['Inter', 'sans-serif']
          }
        }
      }
    }
  </script>
</head>
<body class="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
  <!-- Tech Grid Background -->
  <div class="absolute inset-0 bg-gradient-to-tr from-slate-950 via-[#0A2540] to-slate-900"></div>
  <div class="absolute -top-32 -left-32 w-96 h-96 bg-[#F26F21]/15 rounded-full blur-3xl"></div>
  <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl"></div>

  <div class="relative z-10 w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-100">
    <div class="text-center mb-8">
      <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#D9580F] to-[#F26F21] text-white flex items-center justify-center font-heading font-black text-2xl mx-auto shadow-lg shadow-orange-500/25 mb-4">
        P
      </div>
      <span class="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">Bảo mật tài khoản bắt buộc</span>
      <h1 class="text-2xl font-bold font-heading text-slate-900 mt-2">Cập Nhật Mật Khẩu Mới</h1>
      <p class="text-xs text-slate-500 mt-1 leading-relaxed">
        Tài khoản sinh viên/cán bộ đăng nhập lần đầu tiên hoặc có yêu cầu đặt lại mật khẩu từ quản trị viên.
      </p>
    </div>

    <!-- User Mini Badge -->
    <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3 mb-6">
      <div class="w-10 h-10 rounded-full bg-[#0D47A1] text-white font-bold text-xs flex items-center justify-center shrink-0">
        PS
      </div>
      <div class="min-w-0">
        <span class="font-bold text-xs text-slate-900 block truncate">nguyenvanan.ps24859@fpt.edu.vn</span>
        <span class="text-[11px] text-slate-500">Mã sinh viên: PS24859 (K19.3)</span>
      </div>
    </div>

    <form class="space-y-4" onsubmit="return false;">
      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1.5">Mật khẩu tạm thời hiện tại</label>
        <div class="relative">
          <input type="password" value="FptPoly@2026Temp" class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#F26F21] outline-none">
          <span class="material-symbols-outlined absolute right-3 top-3 text-slate-400 text-xl cursor-pointer">visibility</span>
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1.5">Mật khẩu mới</label>
        <div class="relative">
          <input type="password" placeholder="Tối thiểu 8 ký tự, có chữ hoa, số & ký tự đặc biệt" class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#F26F21] outline-none">
          <span class="material-symbols-outlined absolute right-3 top-3 text-slate-400 text-xl cursor-pointer">visibility</span>
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1.5">Xác nhận lại mật khẩu mới</label>
        <div class="relative">
          <input type="password" placeholder="Nhập lại chính xác mật khẩu mới" class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#F26F21] outline-none">
          <span class="material-symbols-outlined absolute right-3 top-3 text-slate-400 text-xl cursor-pointer">visibility</span>
        </div>
      </div>

      <!-- Password Strength Checklist -->
      <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1.5 text-slate-600">
        <div class="flex items-center gap-2 text-emerald-600 font-semibold">
          <span class="material-symbols-outlined text-sm">check_circle</span> Ít nhất 8 ký tự
        </div>
        <div class="flex items-center gap-2 text-emerald-600 font-semibold">
          <span class="material-symbols-outlined text-sm">check_circle</span> Có ít nhất 1 chữ hoa và 1 chữ thường
        </div>
        <div class="flex items-center gap-2 text-slate-400">
          <span class="material-symbols-outlined text-sm">radio_button_unchecked</span> Có ít nhất 1 chữ số và 1 ký tự đặc biệt (!@#$)
        </div>
      </div>

      <button type="submit" class="w-full py-3.5 rounded-xl bg-[#F26F21] text-white font-heading font-bold text-sm shadow-lg shadow-orange-500/25 hover:bg-[#D9580F] transition mt-2">
        Xác Nhận & Truy Cập Virtual Campus
      </button>
    </form>

    <div class="text-center mt-6 pt-4 border-t border-slate-100">
      <a href="/login" class="text-xs font-semibold text-slate-500 hover:text-[#F26F21]">← Quay lại trang đăng nhập</a>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(cacheDir, 'PUB-003.html'), pub003Html, 'utf8');
fs.writeFileSync(path.join(cacheDir, 'PUB-005.html'), pub005Html, 'utf8');
fs.writeFileSync(path.join(cacheDir, 'PUB-007.html'), pub007Html, 'utf8');
fs.writeFileSync(path.join(cacheDir, 'AUTH-002.html'), auth002Html, 'utf8');

console.log('Successfully generated missing high-fidelity templates: PUB-003, PUB-005, PUB-007, AUTH-002');
