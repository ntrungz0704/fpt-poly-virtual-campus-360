export function getRedesignPageImagePlan() {
  return `# 14 — KẾ HOẠCH TẠO ẢNH GIAO DIỆN MỚI (REDESIGN PAGE INVENTORY & IMAGE PLAN)

## 1. Danh Sách Mã Định Danh Trang (Page IDs) & Chỉ Mục Tạo Ảnh UI

Để việc sinh ảnh giao diện bằng AI (như Midjourney, DALL-E, Imagen hoặc Figma AI) đạt chất lượng cao nhất, mỗi màn hình được chuẩn hóa mã ID và chia thành **18 ảnh UI độc lập**:

| Mã ID | Tên màn hình | Tuyến đường | Nhóm phân hệ | Layout chính | Mức ưu tiên | Đề xuất tạo ảnh |
|:---:|---|---|---|---|:---:|---|
| **PUB-001** | Trang chủ Virtual Campus | \`/\` | Public | Portal Landing | **Cao nhất (P0)** | Ảnh Hero banner 3D Campus, khối thống kê và lối vào Tour 360°. |
| **PUB-002** | Giới thiệu trường | \`/about\` | Public | Content Storytelling | **P1** | Bố cục câu chuyện lịch sử, cơ sở vật chất và triết lý đào tạo. |
| **PUB-003** | Liên hệ tuyển sinh | \`/contact\` | Public | Split Form & Map | **P2** | Form liên hệ hiện đại kèm thông tin đường đi cơ sở QTSC. |
| **PUB-004** | Sự kiện Open Day | \`/events\` | Public | Event Showcase | **P0** | Lịch trình tương tác, diễn giả và nút đăng ký nhận vé. |
| **PUB-005** | Minigame & Quay số | \`/games\` | Public | Gamification Arcade | **P1** | Bàn quay số may mắn neon/công nghệ, bảng thành tích. |
| **PUB-006** | Danh mục địa điểm | \`/locations\` | Public | Grid Filter | **P1** | Thẻ địa điểm (lab, hội trường) với ảnh đẹp và tag phân loại. |
| **PUB-007** | Bảng tin tức | \`/news\` | Public | Magazine Grid | **P2** | Lưới tin tức chia cột với bài viết tiêu điểm lớn. |
| **AUTH-001**| Đăng nhập tập trung | \`/login\` | Auth | Split Auth Screen | **P0** | Cột trái ảnh campus công nghệ, cột phải form nhập sang trọng. |
| **AUTH-002**| Buộc đổi mật khẩu | \`/change-password\` | Auth | Focused Security Card | **P1** | Thẻ bảo mật giữa màn hình với checklist độ mạnh mật khẩu. |
| **CAMP-001**| Tour tương tác 360° | \`/campus\` | Immersive | Immersive Canvas | **P0** | Tràn viền 100%, floating control dock, radar bản đồ góc dưới. |
| **CAMP-002**| Bản đồ số GIS khuôn viên | \`/map\` | Immersive | GIS Map View | **P0** | Bản đồ số QTSC với các khối tòa nhà 3D isometric nổi bật. |
| **STUD-001**| Dashboard sinh viên | \`/portal\` | Student | Student Dashboard | **P0** | Lời chào sinh viên, thẻ điểm XP, widget vé sắp tới. |
| **STUD-002**| Hồ sơ & Tiến trình XP | \`/portal/profile\` | Student | Profile & Level Badge | **P1** | Thẻ sinh viên điện tử, thanh cấp độ (Level 2) và lịch sử XP. |
| **STUD-003**| Vé Open Day & QR | \`/portal/tickets\` | Student | Boarding Pass Ticket | **P0** | Thẻ vé phong cách sự kiện quốc tế, mã QR to nét để check-in. |
| **PRNT-001**| Cổng phụ huynh | \`/parent\` | Parent | Family Guardian View | **P0** | Thẻ con em liên kết, tiến độ học tập và nút gửi yêu cầu. |
| **ADMN-001**| Dashboard quản trị | \`/admin\` | Admin | SaaS Overview | **P0** | Thống kê số lượng sinh viên, vé check-in, biểu đồ trực quan. |
| **ADMN-002**| Quản lý dữ liệu bảng | \`/admin/locations\` | Admin | Enterprise Data Table | **P1** | Bảng dữ liệu SaaS chuẩn chỉnh với bộ lọc, search và Drawer. |
| **ADMN-003**| Studio biên tập 360° | \`/admin/virtual-tour\` | Admin | 3-Column Studio | **P0** | Không gian studio 3 cột: Cây địa điểm - Canvas 360 - Bảng thuộc tính. |

---

## 2. Kế Hoạch 7 UI States Quan Trọng Cần Tạo Ảnh Chi Tiết

1. **STATE-01:** Modal Quét mã QR Check-in cổng sự kiện (Dành cho cán bộ lễ tân).
2. **STATE-02:** Drawer Nhập liệu thêm mới địa điểm/phòng học (Dành cho Admin).
3. **STATE-03:** Modal Phụ huynh nhập mã sinh viên để gửi yêu cầu liên kết.
4. **STATE-04:** Modal Sinh viên nhận thông báo và duyệt liên kết từ phụ huynh.
5. **STATE-05:** Mobile Drawer Menu trượt từ cạnh phải cho thiết bị di động.
6. **STATE-06:** Modal Làm bài thi trắc nghiệm Quiz trực tiếp với đồng hồ đếm ngược.
7. **STATE-07:** Toast & Pháo hoa chúc mừng thăng cấp XP / Quay trúng thưởng.`;
}

export function getRedesignStrategy() {
  return `# 15 — CHIẾN LƯỢC TÁI THIẾT KẾ TOÀN DIỆN (COMPLETE REDESIGN STRATEGY)

## 1. Định Vị Bản Sắc Thị Giác (Brand Identity & Visual Direction)

- **Thông điệp cốt lõi:** *"FPT Polytechnic Virtual Campus — Nơi công nghệ dẫn lối trải nghiệm học tập thực chiến."*
- **Phong cách chủ đạo:** **Modern EdTech meets Immersive Space**. 
  - Đậm chất nhận diện thương hiệu giáo dục FPT (màu cam nhiệt huyết).
  - Kết hợp chiều sâu công nghệ (mặt kính mờ glassmorphism, tương tác không gian thực tế ảo 360°, bản đồ số GIS hiện đại).
  - Tối ưu hóa triệt để cho thiết bị di động (Mobile-First responsive).

---

## 2. Chiến Lược Thiết Kế Theo Từng Phân Hệ (Sub-system Design Principles)

### 2.1 Public Website (Khách vãng lai, thí sinh, phụ huynh)
- **Mục tiêu:** Tạo ấn tượng choáng ngợp về cơ sở vật chất hiện đại của FPT Polytechnic QTSC ngay từ cái nhìn đầu tiên.
- **Giải pháp:**
  - Hero Section sử dụng video hoặc góc quay 360° tương tác nhanh.
  - Phân luồng điều hướng rõ ràng: Nút "Khám phá 360°" và "Đăng ký Open Day" nổi bật.
  - Sử dụng các thẻ bo góc lớn (\`rounded-2xl\`), đổ bóng nhẹ (\`shadow-sm\` $\rightarrow$ \`shadow-md\` khi hover).

### 2.2 Virtual Campus (Tour 360° & Bản đồ số)
- **Mục tiêu:** Tập trung 100% sự chú ý của người xem vào không gian ảo, loại bỏ mọi yếu tố gây phân tâm.
- **Giải pháp:**
  - Toàn bộ thanh công cụ chuyển thành Floating Glass Dock (thanh nổi trong suốt phía dưới).
  - Tích hợp radar bản đồ mini ở góc trái, tự động xoay theo hướng nhìn 360°.
  - Điểm ghim Hotspot thiết kế dạng vòng tròn phát sáng đa lớp (pulsing pulse ring) có nhãn tiếng Việt rõ ràng.

### 2.3 Student & Parent Portal (Cổng sinh viên & phụ huynh)
- **Mục tiêu:** Tối giản, thân thiện, dễ tra cứu, tôn vinh thành tích cá nhân.
- **Giải pháp:**
  - Trang chủ Portal hiển thị thẻ thành viên điện tử (Virtual Student ID Card) với ảnh đại diện và mã QR.
  - Thẻ vé sự kiện Open Day thiết kế theo cảm hứng Boarding Pass (vé máy bay) với đường đục lỗ trang trí.
  - Phụ huynh được xem thẻ thông tin con em với màu sắc ấm áp, chữ to dễ đọc trên điện thoại.

### 2.4 Admin Console (Hệ thống quản trị)
- **Mục tiêu:** Chuyên nghiệp, tốc độ thao tác nhanh, mật độ thông tin tối ưu (tương tự Linear / Stripe).
- **Giải pháp:**
  - Thanh Sidebar cố định viền trái màu xám đậm (\`#0F172A\`).
  - Bảng dữ liệu có sẵn thanh tìm kiếm tức thì, bộ lọc theo cột và phân trang gọn gàng.
  - Màn hình Studio biên tập Tour 360° chia 3 cột cố định, không để xảy ra cuộn trang ngoài ý muốn.`;
}

export function getRedesignRoadmap() {
  return `# 16 — LỘ TRÌNH TRIỂN KHAI REDESIGN THEO TỪNG PHA (IMPLEMENTATION ROADMAP)

## 10 Pha Triển Khai Tuần Tự (Không Phá Vỡ Logic Hiện Có)

| Pha | Tên giai đoạn | Mục tiêu cốt lõi | Phạm vi màn hình | Thời lượng dự kiến | Tiêu chí nghiệm thu (Acceptance Criteria) |
|:---:|---|---|---|:---:|---|
| **Phase 1** | **Design Foundation & Tokens** | Xây dựng bộ Design Tokens (màu sắc, font, spacing) và thư viện component dùng chung | \`packages/ui\` hoặc \`apps/web/src/components/ui\` | 3 ngày | Bảng tra cứu token Tailwind v4 hoạt động, bộ button/input/card/badge mới pass kiểm thử. |
| **Phase 2** | **Core Layouts & Navigations** | Tái cấu trúc 6 layouts chính (Root, Public, Auth, Immersive, Portal, Admin) | 6 layouts | 2 ngày | Header/Footer mới hiển thị chuẩn xác, thanh điều hướng mobile trượt mượt mà. |
| **Phase 3** | **Public Website Redesign** | Làm mới toàn bộ 9 trang công cộng | \`/\`, \`/about\`, \`/contact\`, \`/events\`, \`/games\`, \`/locations/*\`, \`/news/*\` | 4 ngày | 9 trang public đạt chuẩn responsive, form đăng ký Open Day hoạt động mượt mà. |
| **Phase 4** | **Authentication Redesign** | Nâng cấp màn hình Đăng nhập và Buộc đổi mật khẩu | \`/login\`, \`/change-password\` | 1 ngày | Bố cục split-screen sang trọng, validate mật khẩu 12 ký tự trực quan. |
| **Phase 5** | **Immersive Canvas 360 & Map**| Làm mới giao diện Tour thực tế ảo và Bản đồ GIS | \`/campus\`, \`/map\` | 3 ngày | Tràn viền 100%, không xuất hiện thanh cuộn dọc ngoài ý muốn, floating dock mượt. |
| **Phase 6** | **Student Portal Redesign** | Thiết kế lại 5 trang cổng sinh viên | \`/portal/*\` (Overview, Profile, Progress, Schedule, Tickets) | 3 ngày | Thẻ vé QR Boarding Pass đẹp mắt, tiến trình XP và cấp độ hiển thị rõ ràng. |
| **Phase 7** | **Parent Portal Redesign** | Làm mới trang cổng phụ huynh | \`/parent\` | 2 ngày | Danh sách con em và luồng duyệt yêu cầu liên kết hiển thị mạch lạc, dễ dùng. |
| **Phase 8** | **Admin CMS Redesign** | Chuẩn hóa giao diện quản trị chuẩn SaaS | \`/admin/*\` (Dashboard, Events, Locations, Media, Users, Tour Studio) | 4 ngày | Màn hình Studio biên tập Tour 3 cột cố định, các bảng dữ liệu quản lý mượt mà. |
| **Phase 9** | **Responsive & Edge Cases** | Kiểm tra hiển thị trên Tablet (768px), Mobile (390px, 360px), Laptop (1280px) | Toàn bộ 25 màn hình | 2 ngày | 0 lỗi cuộn ngang (horizontal overflow) trên toàn bộ các kích thước màn hình. |
| **Phase 10**| **Full Verification & QA** | Chạy kiểm thử tự động toàn diện Playwright E2E, Unit tests và bàn giao nghiệm thu | Toàn dự án | 2 ngày | 100% test E2E xanh, Typecheck 0 lỗi, Turbopack build thành công. |

---

## Tổng Thời Lượng Dự Kiến: 26 Ngày Làm Việc.`;
}

export function getRiskAndTechnicalDebt() {
  return `# 17 — RỦI RO & QUẢN TRỊ NỢ KỸ THUẬT (RISK & TECHNICAL DEBT AUDIT)

## 1. Các Rủi Ro Tiềm Ẩn Trong Quá Trình Redesign

1. **Rủi ro phá vỡ hợp đồng API (API Contract Breakage):**
   - *Nguyên nhân:* Khi thiết kế giao diện mới, lập trình viên có thể vô tình đổi tên trường dữ liệu hoặc cấu trúc props của component.
   - *Biện pháp kiểm soát:* Nghiêm cấm sửa đổi các DTOs tại \`packages/shared\`. Toàn bộ dữ liệu hiển thị trên UI mới phải lấy trực tiếp từ các trường sẵn có.
2. **Rủi ro lỗi Hydration Mismatch:**
   - *Nguyên nhân:* Việc sử dụng các thư viện canvas (Leaflet, Marzipano 360) hoặc truy cập trực tiếp đối tượng \`window\`/\`localStorage\` trong quá trình render Server-Side.
   - *Biện pháp kiểm soát:* Bắt buộc bọc các component tương tác sâu trong \`next/dynamic\` với \`{ ssr: false }\` và kiểm tra kỹ cờ \`mounted\` trước khi đọc LocalStorage.
3. **Rủi ro phát sinh thanh cuộn dọc ngoài ý muốn (Unintended Scrollbars):**
   - *Nguyên nhân:* Dùng nhầm \`100vh\` thay vì \`100dvh\` hoặc padding cộng dồn khiến chiều cao tổng thể vượt quá chiều cao cửa sổ trình duyệt.
   - *Biện pháp kiểm soát:* Tuân thủ nghiêm ngặt phân loại trang: Các trang \`IMMERSIVE_CANVAS\` phải có \`h-screen overflow-hidden\` ở container cha, chỉ để các dock công cụ nổi bên trên.

---

## 2. Nợ Kỹ Thuật Đã Được Giải Quyết Triệt Để Trước Redesign

-  Đã giải quyết dứt điểm lỗi IDOR rò rỉ dữ liệu giữa Phụ huynh và Sinh viên tại Milestone M4.
-  Đã chuẩn hóa cơ chế băm mật khẩu Argon2id và xoay vòng Refresh Token Cookie an toàn.
-  Đã loại bỏ toàn bộ dữ liệu mock ở các phân hệ cốt lõi, thay thế bằng dữ liệu thật từ cơ sở dữ liệu PostgreSQL 16.`;
}

export function getEvidenceIndex() {
  return `# 18 — MỤC LỤC BẰNG CHỨNG KIỂM CHỨNG (EVIDENCE INDEX)

Dưới đây là bảng tra cứu chính xác các tệp mã nguồn, dòng lệnh và vị trí logic phục vụ công tác đối soát nghiệm thu:

| Hạng mục kiểm toán | Tệp mã nguồn liên quan | Vị trí / Chi tiết kiểm chứng | Kết quả kiểm chứng |
|---|---|---|:---:|
| **Xác thực mật khẩu Argon2id** | \`apps/api/src/modules/auth/auth.service.ts\` | Dòng 50-80: \`argon2.verify\`, \`argon2.hash\` |  PASS |
| **Xoay vòng Refresh Token Cookie** | \`apps/api/src/modules/auth/auth.service.ts\` | Dòng 140-190: Xử lý reuse detection và revoke |  PASS |
| **Bảo vệ Endpoint Cổng Sinh Viên** | \`apps/api/src/modules/portal/portal.controller.ts\`| Dòng 40-48: \`enforceStudentRole\` |  PASS |
| **Chống IDOR Cổng Phụ Huynh** | \`apps/api/src/modules/portal/portal.service.ts\` | Dòng 480-530: Kiểm tra trạng thái \`APPROVED\` |  PASS |
| **Bộ Fixtures E2E Tài Khoản Thật** | \`apps/web/e2e/portal-fixtures.ts\` | Khởi tạo 5 tài khoản độc lập (Student A/B, Parent A/B/C) |  PASS |
| **Suite E2E Playwright M4** | \`apps/web/e2e/portal-flow.spec.ts\` | 6/6 kịch bản kiểm thử phân quyền sâu |  PASS |
| **Định Tuyến 29 Routes Turbopack** | \`apps/web/src/app\` | Biên dịch Turbopack tự động qua \`pnpm run build\` |  PASS |
| **Bộ 50 Ảnh Chụp Giao Diện Thực Tế**| \`docs/project-redesign-audit/screenshots/\` | 25 màn hình x 2 viewports (Desktop & Mobile) |  PASS |`;
}
