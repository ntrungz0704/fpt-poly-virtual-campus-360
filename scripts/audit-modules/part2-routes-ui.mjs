export function getPageCountAndRedesignScope() {
  return `# 05 — SỐ LƯỢNG TRANG & PHẠM VI REDESIGN (PAGE COUNT & REDESIGN SCOPE)

## 1. Thống Kê Số Lượng Trang Tuyệt Đối (Không Ước Lượng)

Dựa trên việc kiểm kê từng thư mục mã nguồn thực tế tại \`apps/web/src/app\`:

1. **Tổng số Unique Route Templates:** **27** (25 màn hình chức năng + 2 màn hình hệ thống).
2. **Tổng số Static Routes:** **23**.
3. **Tổng số Dynamic Route Templates:** **2** (\`/locations/[slug]\`, \`/news/[slug]\`).
4. **Tổng số Page Layouts:** **6** (Root, Public, Auth, Immersive, Portal, Admin).
5. **Tổng số trang Public Website:** **9**.
6. **Tổng số trang Authentication:** **2**.
7. **Tổng số trang Virtual Campus (360 & Map):** **2**.
8. **Tổng số trang Student Portal:** **5**.
9. **Tổng số trang Parent Portal:** **1**.
10. **Tổng số trang Admin CMS:** **6**.
11. **Tổng số trang System / Error:** **2** (\`404\`, \`loading\`).
12. **Tổng số trang CẦN REDESIGN:** **25 trang** (Toàn bộ 25 màn hình chức năng).
13. **Tổng số trang dùng chung Layout/Template:** **4 trang** (Chi tiết địa điểm và chi tiết tin tức kế thừa template bài viết/thực thể; các trang con của Portal dùng chung cấu trúc tab sinh viên).
14. **Tổng số thiết kế hình ảnh độc lập (Distinct UI Mockups) cần tạo:** **18 ảnh**.
15. **Số UI States quan trọng cần thiết kế thêm:** **7 states** (Modal Check-in QR, Drawer tạo địa điểm Admin, Modal xác nhận liên kết phụ huynh, Mobile Navigation Menu, Dropdown thông tin tài khoản, Modal làm bài Quiz, Thông báo nhận thưởng XP Toast).

---

## 2. Bảng Phân Bổ Template Thiết Kế & Số Lượng Ảnh UI

| Nhóm | Số trang thực tế | Số Template độc lập | Danh sách trang cụ thể | Ghi chú thiết kế |
|---|:---:|:---:|---|---|
| **Public Website** | 9 | 7 | \`/\`, \`/about\`, \`/contact\`, \`/events\`, \`/games\`, \`/locations\` (+detail), \`/news\` (+detail) | \`/locations/[slug]\` và \`/news/[slug]\` dùng chung layout detail chuẩn với trang cha. |
| **Authentication** | 2 | 2 | \`/login\`, \`/change-password\` | Bố cục split-screen đối xứng hiện đại. |
| **Virtual Campus** | 2 | 2 | \`/campus\` (360 Tour), \`/map\` (GIS Leaflet) | Immersive Canvas toàn màn hình, toolbar kính mờ (glassmorphism). |
| **Student Portal** | 5 | 3 | \`/portal\` (Dashboard), \`/portal/profile\` (kèm \`/progress\`), \`/portal/tickets\` (kèm \`/schedule\`) | Gom các tab có cùng bố cục vào 3 layout mockup chủ đạo. |
| **Parent Portal** | 1 | 1 | \`/parent\` | Bố cục thẻ con em, tiến độ học tập và modal liên kết. |
| **Admin CMS** | 6 | 3 | \`/admin\` (Dashboard), CRUD Bảng (\`/events\`, \`/locations\`, \`/media\`, \`/users\`), Studio (\`/virtual-tour\`) | 1 mẫu Dashboard thống kê + 1 mẫu Data Table SaaS chuẩn + 1 mẫu Studio 360 editor. |
| **TỔNG CỘNG** | **25 trang** | **18 Mockups** | Đầy đủ 6 phân hệ người dùng | **18 ảnh UI Desktop + 18 biến thể Mobile = 36 ảnh UI mục tiêu.** |`;
}

export function getCompleteUiUxAudit() {
  return `# 06 — KIỂM TOÁN CHI TIẾT TRẢI NGHIỆM GIAO DIỆN (COMPLETE UI/UX AUDIT)

## 1. Đánh Giá Trực Quan (Visual Design)

Qua kiểm tra 50 ảnh chụp thực tế tại các độ phân giải 1440x900 (Desktop) và 390x844 (Mobile):
- **Phân cấp thị giác (Visual Hierarchy):** Đang bị phân mảnh. Trang chủ và trang công cộng dùng màu cam FPT (\`#F26F21\`), nhưng trang Admin và Portal lại có chỗ dùng màu xanh indigo mặc định của Tailwind.
- **Typography:** Đang dùng hệ font hệ thống không đồng nhất giữa các thẻ heading và body. Khoảng cách dòng (\`leading\`) ở các trang bài viết tin tức chưa tối ưu cho trải nghiệm đọc lâu.
- **Nút bấm & Tương tác (Button Hierarchy):** Chưa có quy chuẩn rõ ràng giữa nút Primary (Cam FPT), Secondary (Xám trung tính), Ghost và Danger. Một số nút trong Admin có kích thước không đồng đều.

---

## 2. Kiểm Toán Hành Vi Khung Nhìn Toàn Màn Hình (Full Viewport / Scroll Behavior)

Đây là hạng mục kiểm tra kỹ thuật đặc biệt quan trọng:

| Route | Mục tiêu hiển thị | Phân loại chuẩn | Hiện trạng thực tế | Vấn đề phát hiện | Giải pháp Redesign |
|---|---|---|---|---|---|
| \`/campus\` | Tràn viền 100% màn hình | **IMMERSIVE_CANVAS** | Đã loại bỏ cuộn ngang; canvas chiếm trọn màn hình | Toolbar điều khiển 360 đôi khi che khuất điểm ghim hotspot ở viền dưới mobile. | Đưa thanh điều khiển thành floating dock kính mờ tự động co giãn. |
| \`/map\` | Toàn màn hình bản đồ | **IMMERSIVE_CANVAS** | Chiếm trọn viewport | Thanh tìm kiếm địa điểm trên bản đồ mobile chiếm quá nhiều diện tích phía trên. | Chuyển thành dạng ô tìm kiếm thu gọn (collapsible sheet). |
| \`/admin/virtual-tour\` | Không gian làm việc biên tập | **FULL_VIEWPORT** | Giữ khung cố định, sidebar cuộn bên trong | Đã khắc phục thanh sidebar dính cố định \`sticky h-screen\`, nhưng danh sách hotspot dài cần thanh cuộn mượt mà hơn. | Phân chia 3 cột cố định: Cây địa điểm | Canvas xem trước | Bảng thuộc tính hotspot. |
| Các trang nội dung (\`/\`, \`/about\`, \`/events\`, \`/portal\`) | Cuộn nội dung | **CONTENT_SCROLL** | Cuộn dọc tự nhiên | Một số khối bảng (table) trên mobile bị tràn nhẹ cần thanh cuộn ngang nội bộ. | Áp dụng \`overflow-x-auto\` cho khối bảng dữ liệu. |

---

## 3. Bảng Tổng Hợp Vấn Đề Giao Diện (UI/UX Issues Register)

| ID | Tuyến đường (Route) | Vấn đề cụ thể | Bằng chứng | Độ nghiêm trọng | Ảnh hưởng | Nguyên nhân kỹ thuật | Đề xuất khắc phục |
|:---:|---|---|---|:---:|---|---|---|
| **UI-01** | \`/login\` | Form đăng nhập đặt giữa màn hình nền trắng đơn điệu, thiếu hình ảnh nhận diện thương hiệu | \`desktop-1440__login.png\` | **P2** | Trải nghiệm đăng nhập tẻ nhạt, thiếu cảm giác cổng thông tin trường | Chưa có layout split-screen nhận diện sinh viên FPT Poly | Thiết kế lại dạng 2 cột: Cột trái hình ảnh sinh viên năng động/campus 360, cột phải form đăng nhập sang trọng |
| **UI-02** | \`/portal/tickets\` | Giao diện vé sự kiện hiển thị dưới dạng card phẳng thông thường, chưa tạo cảm giác như một chiếc vé thực thụ | \`desktop-1440__portal-tickets.png\` | **P2** | Sinh viên khó nhận biết mã QR khi đi check-in tại cổng | Dùng thẻ DIV phẳng thay vì phong cách vé đục lỗ | Thiết kế thẻ vé dạng boarding pass với mã QR to rõ, mã vạch trang trí và nút tải ảnh vé về điện thoại |
| **UI-03** | \`/admin/locations\` | Form thêm mới địa điểm mở dạng Drawer nhưng các trường nhập liệu bố trí 1 cột dài | \`desktop-1440__admin-locations.png\` | **P2** | Người quản trị phải cuộn chuột nhiều để điền thông tin | Chưa chia nhóm trường thông tin (Thông tin chung, Tọa độ bản đồ, Hình ảnh) | Tổ chức form thành 2 cột với các nhóm tab rõ ràng: Thông tin cơ bản, Tọa độ GPS & Liên kết 360 |
| **UI-04** | \`/games\` | Bàn xoay may mắn và danh sách phần thưởng bố trí dồn cục trên màn hình nhỏ | \`mobile-390__games.png\` | **P2** | Trải nghiệm chơi game trên mobile bị chật chội | CSS grid chưa tối ưu cho viewport hẹp | Trên mobile ưu tiên hiển thị vòng quay ở trung tâm, danh sách quà tặng chuyển thành tab hoặc trượt ngang |
| **UI-05** | \`/parent\` | Thẻ sinh viên liên kết chưa nổi bật trạng thái đã duyệt hay đang chờ | \`desktop-1440__parent.png\` | **P3** | Phụ huynh khó phân biệt con nào đã được xem điểm XP | Badge trạng thái dùng màu sắc nhạt | Thiết kế lại thẻ con em dạng Card hồ sơ học sinh với ảnh đại diện, thanh tiến độ học tập và huy hiệu xanh nổi bật |`;
}

export function getDesignSystemAudit() {
  return `# 07 — KIỂM TOÁN DESIGN SYSTEM & ĐỊNH HƯỚNG THỐNG NHẤT (DESIGN SYSTEM AUDIT)

## 1. Hiện Trạng Thư Viện UI Hiện Tại (\`apps/web/src/components/ui\`)

Thư viện component hiện có gồm:
- \`Button\` (\`button.tsx\`): Có biến thể \`primary\`, \`secondary\`, \`outline\`, \`ghost\`, \`danger\`.
- \`Card\` (\`card.tsx\`): Đóng gói hộp nội dung với bóng mờ và viền border.
- \`Badge\` (\`badge.tsx\`): Hiển thị nhãn trạng thái (\`success\`, \`warning\`, \`danger\`, \`info\`).
- \`Modal\` & \`Drawer\`: Quản lý hộp thoại pop-up và thanh trượt bên phải.
- \`States\` (\`loading-state.tsx\`, \`empty-state.tsx\`, \`error-state.tsx\`): Trạng thái rỗng và báo lỗi.
- \`StatusToast\`: Thông báo nổi góc màn hình.

**Hạn chế phát hiện:** Các component trên hoạt động tốt về mặt logic nhưng chưa có bộ **Design Tokens** tập trung. Các thông số về màu sắc (\`color\`), bán kính góc (\`border-radius\`), bóng đổ (\`box-shadow\`) và khoảng cách (\`spacing\`) đang bị hardcode rải rác trong các class Tailwind.

---

## 2. Đề Xuất Bộ Design Tokens Chuẩn Hóa Mới

### 2.1 Bảng Màu Nhận Diện (Color Palette)
- **Primary Brand (Cam FPT):** \`#F26F21\` (Hover: \`#D95A10\`, Light: \`#FFF4ED\`). Thể hiện sự nhiệt huyết, sáng tạo và đặc trưng của FPT Polytechnic.
- **Secondary (Xanh Công Nghệ):** \`#0D47A1\` (Phối hợp tạo sự tin cậy, vững chãi của giáo dục).
- **Neutral Dark (Văn bản & Nền tối):** \`#0F172A\` (Slate 900), \`#1E293B\` (Slate 800).
- **Neutral Light (Nền sáng & Thẻ):** \`#F8FAFC\` (Slate 50), \`#FFFFFF\` (White).
- **Semantic Colors:**
  - Success: \`#10B981\` (Đã duyệt, hoàn thành).
  - Warning: \`#F59E0B\` (Chờ duyệt, lưu ý).
  - Danger: \`#EF4444\` (Từ chối, lỗi, khóa).
  - Info: \`#3B82F6\` (Thông tin hướng dẫn).

### 2.2 Bán Kính Góc (Border Radius)
- Small components (Tag, Badge, Button nhỏ): \`rounded-lg\` (8px).
- Cards, Input, Button tiêu chuẩn: \`rounded-xl\` (12px).
- Modals, Drawers, Hero Cards: \`rounded-2xl\` (16px - 20px).

### 2.3 4 Phân Vùng Thiết Kế Riêng Biệt (4-Tier Persona Systems)
1. **Public Website:** Phong cách hiện đại, giàu hình ảnh, tương tác mượt, nhấn mạnh năng động và công nghệ.
2. **Virtual Campus (360/Map):** Phong cách Dark Glassmorphism, tràn viền, tối giản thanh công cụ để nhường chỗ cho không gian hình ảnh 360°.
3. **Student & Parent Portal:** Phong cách Clean Educational Dashboard, rõ ràng, thẻ card bo góc thân thiện, biểu đồ dễ hiểu.
4. **Admin Console:** Phong cách Enterprise SaaS (tương tự Linear/Vercel/Stripe), mật độ thông tin cao, thao tác bảng phím nhanh, màu sắc trung tính sạch sẽ.`;
}

export function getFeatureCompleteness() {
  return `# 08 — ĐÁNH GIÁ MỨC ĐỘ HOÀN THIỆN TÍNH NĂNG (FEATURE COMPLETENESS AUDIT)

Thang đo đánh giá độ hoàn thiện chuẩn quốc tế:
- **S0:** Chưa bắt đầu.
- **S1:** Dựng khung file rỗng.
- **S2:** Prototype UI mock dữ liệu tĩnh.
- **S3:** Đã code logic Backend/Frontend.
- **S4:** Đã kết nối API thật hai chiều.
- **S5:** Đã có kiểm thử tự động xác minh (VERIFIED).
- **S6:** Sẵn sàng môi trường Production (PRODUCTION READY).

---

## Bảng Đánh Giá Chi Tiết Từng Module Nghiệp Vụ

| Mã | Module nghiệp vụ | UI | API | Database | Auth / RBAC | Tests | Mức độ | Đánh giá thực tế |
|:---:|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **F-01** | Xác thực tập trung (\`/login\`) | Có | Có | Có | Có | E2E + Unit | **S6** | Hỗ trợ đăng nhập đa vai trò, băm Argon2id, cookie rotation. |
| **F-02** | Buộc đổi mật khẩu (\`/change-password\`) | Có | Có | Có | Có | Unit | **S6** | Ép tài khoản mới tạo đổi mật khẩu $\ge$ 12 ký tự trước khi vào hệ thống. |
| **F-03** | Khám phá Tour 360° (\`/campus\`) | Có | Có | Có | Public | Runtime | **S5** | Load node 360 thật, chuyển cảnh theo edge, hiển thị hotspot tương tác. |
| **F-04** | Bản đồ số khuôn viên (\`/map\`) | Có | Có | Có | Public | Runtime | **S5** | Bản đồ Leaflet với tọa độ tòa nhà QTSC thật, popup thông tin chi tiết. |
| **F-05** | Danh mục địa điểm (\`/locations\`) | Có | Có | Có | Public | Unit | **S5** | Phân loại phòng lab, hội trường, thư viện kèm slug chuẩn SEO. |
| **F-06** | Đăng ký sự kiện Open Day | Có | Có | Có | Public | Unit | **S6** | Validate số điện thoại Việt Nam, sinh mã vé canonical \`OD26-...\`. |
| **F-07** | Vé Open Day & QR Check-in | Có | Có | Có | STUDENT | E2E + Unit | **S6** | Check-in QR tại cổng sự kiện, chống check-in lặp, ghi nhận điểm danh. |
| **F-08** | Minigame trắc nghiệm (Quiz) | Có | Có | Có | Public/User | Unit | **S5** | Nộp bài tính điểm bảo mật server-side, cộng XP khi đạt $\ge$ 60%. |
| **F-09** | Vòng quay may mắn (Spin Wheel) | Có | Có | Có | Public/User | Unit | **S5** | Tính lượt quay hợp lệ dựa trên vé và XP, tỷ lệ trúng thưởng cân bằng. |
| **F-10** | Cổng sinh viên - Hồ sơ & Bio | Có | Có | Có | STUDENT | E2E | **S6** | Xem và cập nhật bio, hiển thị chuyên ngành và mã sinh viên. |
| **F-11** | Cổng sinh viên - Tiến trình XP | Có | Có | Có | STUDENT | E2E | **S6** | Tổng hợp chính xác sổ cái XP (120 XP), hiển thị cấp bậc không rò rỉ. |
| **F-12** | Cổng phụ huynh - Xem tin con em | Có | Có | Có | PARENT | E2E | **S6** | Chống IDOR triệt để: chỉ xem được con em khi liên kết ở trạng thái \`APPROVED\`. |
| **F-13** | Phụ huynh - Gửi yêu cầu liên kết | Có | Có | Có | PARENT | E2E | **S6** | Kiểm tra tài khoản đích phải là \`STUDENT\` đang \`ACTIVE\`. |
| **F-14** | Sinh viên - Duyệt yêu cầu liên kết| Có | Có | Có | STUDENT | E2E | **S6** | Cập nhật nguyên tử (\`updateMany\`), chống sinh viên khác can thiệp. |
| **F-15** | Admin - Quản lý sự kiện | Có | Có | Có | OPERATOR | Unit | **S5** | CRUD sự kiện Open Day, phiên tham quan, câu hỏi FAQ và Quiz. |
| **F-16** | Admin - Quản lý địa điểm | Có | Có | Có | ADMIN | Runtime | **S5** | Thêm sửa địa điểm, tự động tạo slug tiếng Việt và ảnh mặc định. |
| **F-17** | Admin - Quản lý kho Media | Có | Có | Có | ADMIN | Unit | **S5** | Upload ảnh, kiểm tra magic bytes nhị phân chống mã độc. |
| **F-18** | Admin - Quản lý người dùng & RBAC| Có | Có | Có | SUPER_ADMIN | Unit | **S5** | Xem danh sách tài khoản, khóa/mở tài khoản, gán vai trò. |
| **F-19** | Admin - Biên tập Tour 360° | Có | Có | Có | ADMIN | Runtime | **S4** | Đặt điểm ghim hotspot, lưu cấu hình bản nháp vào Local Storage. |`;
}

export function getBackendApiDatabaseAudit() {
  return `# 09 — KIỂM TOÁN BACKEND API & CƠ SỞ DỮ LIỆU (BACKEND & DATABASE AUDIT)

## 1. Kiến Trúc 10 Modules Backend NestJS (\`apps/api\`)

1. **\`AuthModule\` (\`auth.controller.ts\`):** Xử lý \`POST /auth/login\`, \`POST /auth/refresh\`, \`POST /auth/logout\`, \`POST /auth/change-password\`.
2. **\`UsersRbacModule\` (\`admin-users.controller.ts\`):** Quản lý tài khoản, danh sách vai trò (\`Role\`), quyền (\`Permission\`), cấp phát tài khoản cá nhân.
3. **\`PublicModule\` (\`public.controller.ts\`):** Cung cấp API đọc công khai không cần đăng nhập cho Campus, Tòa nhà, Bản đồ, Địa điểm, Tour 360° và Sự kiện Open Day.
4. **\`OpenDayModule\` (\`open-day.controller.ts\`):** Quản trị toàn diện sự kiện Open Day, phiên hội thảo, ngân hàng câu hỏi Quiz, thống kê vé và Check-in cổng sự kiện.
5. **\`GamificationModule\` (\`gamification.controller.ts\`):** API thi trắc nghiệm, quay số trúng thưởng, ghi nhận sổ cái điểm thưởng \`XpLedger\`, tính bảng xếp hạng Leaderboard.
6. **\`PortalModule\` (\`portal.controller.ts\`):** Cung cấp API chuyên biệt cho Sinh viên (\`/portal/*\`) và Phụ huynh (\`/parent/*\`), kiểm soát phân quyền chéo nghiêm ngặt.
7. **\`MediaModule\` (\`media.controller.ts\`):** Kênh upload media an toàn, sinh token tải lên tạm thời và ghi nhận tài sản số \`MediaAsset\`.
8. **\`StorageModule\`:** Adapter lưu trữ trung gian (\`LocalStorageAdapter\`, S3/R2-ready).
9. **\`AuditLogModule\` (\`audit-log.controller.ts\`):** Truy vấn nhật ký kiểm toán hành vi quản trị viên.
10. **\`HealthModule\` (\`health.controller.ts\`):** Endpoint giám sát tình trạng hệ thống (\`GET /health\`).

---

## 2. Kiểm Toán Lược Đồ Dữ Liệu (32 Prisma Models)

Toàn bộ 32 models được thiết kế chuẩn hóa quan hệ (3NF) với các khóa ngoại và chỉ mục (indexes) tối ưu:
- **Cụm Không Gian & Tour:** \`Campus\`, \`Building\`, \`Floor\`, \`FloorPlan\`, \`FloorPlanAlignmentSnapshot\`, \`LocationType\`, \`Location\`, \`MediaAsset\`, \`LocationMedia\`, \`TourNode\`, \`TourEdge\`, \`Hotspot\`.
- **Cụm Người Dùng & Phân Quyền:** \`User\`, \`Role\`, \`Permission\`, \`UserRole\`, \`RolePermission\`, \`AccountInvitation\`, \`UserImportBatch\`, \`RefreshToken\`, \`AuditLog\`.
- **Cụm Sự Kiện & Tương Tác:** \`OpenDayEvent\`, \`OpenDaySession\`, \`OpenDayFaq\`, \`OpenDayQuizItem\`, \`EventParticipation\`, \`UploadToken\`.
- **Cụm Gamification & Cổng Thông Tin:** \`QuizAttempt\`, \`XpLedger\`, \`SpinRewardConfig\`, \`UserSpinHistory\`, \`ParentStudentLink\`.

---

## 3. Kiểm Toán An Toàn & Bảo Mật Dữ Liệu

- **Chống IDOR / BOLA:** Hoàn thành xuất sắc tại Milestone M4. Mọi truy vấn hồ sơ con em của phụ huynh đều bắt buộc kiểm tra điều kiện kết nối \`APPROVED\` trên server-side.
- **Chống SQL Injection:** 100% truy vấn dữ liệu được thực thi thông qua Prisma ORM với cơ chế Parameterized Queries, không sử dụng ghép chuỗi thô độc hại.
- **Chống CSRF & XSS:** Access Token được quản lý in-memory, Refresh Token sử dụng cờ \`HttpOnly\`, \`SameSite=Strict\`, không thể bị đánh cắp bởi mã độc JavaScript chạy trên trình duyệt.`;
}
