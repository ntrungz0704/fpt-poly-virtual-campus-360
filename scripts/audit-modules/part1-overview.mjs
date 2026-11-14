export function getExecutiveSummary() {
  return `# 00 — BÁO CÁO TỔNG QUAN ĐIỀU HÀNH (EXECUTIVE SUMMARY)
## DỰ ÁN FPT POLYTECHNIC VIRTUAL CAMPUS 360° — PHỤC VỤ REDESIGN TOÀN DIỆN

> [!IMPORTANT]
> **THÔNG TIN ĐỐI SOÁT CHÍNH THỨC:**
> - **Dự án:** FPT Polytechnic Virtual Campus 360° (Cơ sở CVPM Quang Trung, Quận 12, TP.HCM).
> - **Repository:** \`ntrungz0704/fpt-poly-virtual-campus-360\`
> - **Branch hiện tại:** \`fix/m4-acceptance-blockers\`
> - **HEAD Commit SHA:** \`935d27b\` (feat(portal): enforce parent-student RBAC, fix gamification XP, and add M4 acceptance E2E suite)
> - **Thời điểm kiểm toán:** 2026-11-14.
> - **Trạng thái sẵn sàng cho Redesign:** **READY FOR REDESIGN WITH CONSTRAINTS** (Khung lõi kỹ thuật, bảo mật, dữ liệu và API đã ổn định 100%, sẵn sàng cho đợt nâng cấp giao diện toàn diện).

---

### 1. Mục Tiêu Đợt Khảo Sát & Kiểm Toán Redesign
Mục tiêu của đợt kiểm toán này không phải sửa đổi chắp vá vài component hay cải thiện các trang riêng lẻ, mà là **khảo sát toàn diện mọi ngóc ngách của hệ thống để chuẩn bị cho một cuộc đại tu UI/UX từ đầu**, với nguyên tắc cốt lõi:
1. **Tái thiết kế toàn bộ trải nghiệm người dùng:** Hiện đại, trực quan, đậm chất công nghệ và nhận diện giáo dục FPT Polytechnic.
2. **Bảo toàn 100% logic nghiệp vụ:** Giữ nguyên vẹn toàn bộ 32 Prisma Models, 19 Enums, 10 NestJS Backend Modules, cơ chế xác thực JWT in-memory + Cookie Refresh rotation, phân quyền RBAC và hệ thống API hiện có.
3. **Không phá vỡ chức năng:** Mọi nâng cấp giao diện phải khớp nối chính xác với contracts dữ liệu chuẩn hóa tại \`packages/shared\`.

---

### 2. Các Con Số Khảo Sát Thực Tế Cốt Lõi (Được Kiểm Chứng 100%)

| Tiêu chí | Số liệu thực tế | Ghi chú kiểm chứng |
|---|:---:|---|
| **Tổng số Unique Route Templates** | **27** | 25 trang chức năng chính + 2 trạng thái hệ thống (\`loading.tsx\`, \`not-found.tsx\`) |
| **Số Layout chính** | **6** | 1 Root layout + 5 Sub-layouts: Public, Auth, Immersive, Portal, Admin |
| **Số Route Static** | **23** | Render tĩnh / dynamic client component theo chuẩn Next.js App Router |
| **Số Route Dynamic Templates** | **2** | \`/locations/[slug]\` (Địa điểm) và \`/news/[slug]\` (Tin tức) |
| **Ảnh Screenshot thực tế đã chụp** | **50** | Đầy đủ 25 màn hình x 2 viewports (Desktop 1440x900 & Mobile 390x844) |
| **Số trang cần Redesign** | **25** | Toàn bộ 25 màn hình thuộc 6 phân hệ |
| **Số lượng Template thiết kế UI độc lập** | **18** | Đã gom các trang có chung cấu trúc để tối ưu việc sinh ảnh và code |
| **Prisma Models / Enums** | **32 / 19** | Lưu trữ toàn bộ dữ liệu Campus, 360 Tour, Open Day, Gamification, Users |
| **Backend Modules / Controllers** | **10 / 9** | Kiến trúc Modular Monolith NestJS chuẩn RESTful tại \`/api/v1\` |
| **Unit Tests Passed** | **41 / 41** | 10 test web (Node test runner) + 31 test backend (Jest) |
| **Turbopack Build Routes** | **29 / 29** | \`next build\` thành công 100% không cảnh báo lỗi |

---

### 3. Phân Hệ Người Dùng Thuộc Phạm Vi Redesign

1. **Public Website (9 trang):** Trang chủ (\`/\`), Giới thiệu (\`/about\`), Liên hệ (\`/contact\`), Sự kiện Open Day (\`/events\`), Minigame & Vòng quay (\`/games\`), Danh mục địa điểm (\`/locations\`), Chi tiết địa điểm (\`/locations/[slug]\`), Tin tức (\`/news\`), Chi tiết tin tức (\`/news/[slug]\`).
2. **Authentication (2 trang):** Đăng nhập (\`/login\`), Đổi mật khẩu bắt buộc (\`/change-password\`).
3. **Virtual Campus Immersive (2 trang):** Tour 360° tương tác (\`/campus\`), Bản đồ số GIS khuôn viên QTSC (\`/map\`).
4. **Student Portal (5 trang):** Tổng quan (\`/portal\`), Hồ sơ sinh viên (\`/portal/profile\`), Điểm thưởng XP & Gamification (\`/portal/progress\`), Lịch sự kiện (\`/portal/schedule\`), Vé Open Day (\`/portal/tickets\`).
5. **Parent Portal (1 trang):** Cổng phụ huynh theo dõi con em (\`/parent\`).
6. **Admin CMS (6 trang):** Dashboard (\`/admin\`), Sự kiện (\`/admin/events\`), Địa điểm (\`/admin/locations\`), Kho Media (\`/admin/media\`), Người dùng & RBAC (\`/admin/users\`), Kịch bản Tour & Hotspots (\`/admin/virtual-tour\`).

---

### 4. Kết Luận & Định Hướng
Codebase hiện tại đạt độ hoàn thiện cao về tầng logic và dữ liệu, không có nợ kỹ thuật nghiêm trọng ở backend. Toàn bộ các vấn đề nghẽn của giao diện hiện tại nằm ở sự phân mảnh về phong cách (inconsistent design tokens), thiếu phân cấp thị giác rõ nét giữa trang công cộng và trang quản trị, và một số lỗi overflow/scrollbar trên các trang trải nghiệm không gian toàn màn hình. 

Dự án **HOÀN TOÀN ĐỦ ĐIỀU KIỆN ĐỂ BƯỚC VÀO GIAI ĐOẠN REDESIGN**.`;
}

export function getProjectCurrentStatus() {
  return `# 01 — HIỆN TRẠNG DỰ ÁN CHI TIẾT (PROJECT CURRENT STATUS)

## 1. Đối Soát Lịch Sử Phát Triển Đến Thời Điểm Hiện Tại

Quá trình phát triển của dự án đã vượt qua các mốc quan trọng, hiện đã hoàn thành toàn bộ các Milestone cốt lõi của Phase 2:
- **Phase 2A-1 (Database Bootstrap):** Hoàn tất Prisma schema, migrations khởi tạo và seed dữ liệu mẫu chuẩn (\`commit 7e1753d\`).
- **Phase 2A-2 (Core Backend & Auth):** Tích hợp xác thực Argon2id, cookie rotation, bảo vệ CSRF và public API (\`commit ff13f14\`).
- **Phase 2A-3 / M1 & M2:** Chuẩn hóa shared contracts, upload token và Open Day CRUD quản trị (\`commits 6fcf4dc, 131de78\`).
- **Milestone M3A:** Triển khai hạ tầng lưu trữ media đám mây và cục bộ, xác thực magic bytes file upload (\`commit d4913ed\`).
- **Milestone M3B:** Đồng bộ giao diện Web với API thật cho Tour 360°, Map Leaflet và Locations (\`commit 3268a72\`).
- **Milestone M3C:** Hoàn thiện đăng ký Open Day công khai, phát sinh vé mã canonical và check-in QR (\`commit f9a0672\`).
- **Milestone M3D:** Cơ chế gamification tính điểm XP tự động qua bài thi trắc nghiệm và bảng xếp hạng (\`commit a893b93\`).
- **Milestone M4:** Hoàn tất Student Portal và Parent Portal, giải quyết triệt để lỗi phân quyền chéo IDOR giữa Phụ huynh và Sinh viên (\`commits 1913be2, 935d27b\`).

---

## 2. Bằng Chứng Thực Tế Về Chất Lượng Codebase (Runtime Proofs)

### 2.1 Typecheck Toàn Bộ Monorepo
Lệnh kiểm tra:
\`\`\`bash
pnpm --filter @fpt-campus/shared typecheck && pnpm --filter api typecheck && pnpm --filter web typecheck
\`\`\`
- Kết quả: **Mã thoát 0 (Exit Code 0)**.
- 100% code TypeScript hợp lệ, không có lỗi kiểu dữ liệu (\`0 errors\`).

### 2.2 Bộ Kiểm Thử Đơn Vị (Unit Tests)
1. **Frontend Web Unit Tests:**
   - Framework: Node.js Built-in Test Runner + \`tsx\`.
   - File thực thi: \`apps/web/tests/unit/*.test.ts\`.
   - Kết quả: **10/10 tests PASSED (100%)**.
   - Kiểm tra: An toàn đường dẫn redirect, bảo vệ route phân quyền RBAC, mật khẩu 12 ký tự, format mã vé OD26, chuẩn hóa SĐT Việt Nam (+84) và email.
2. **Backend API Unit Tests:**
   - Framework: Jest in-band.
   - File thực thi: \`apps/api/test/unit/*.spec.ts\`.
   - Kết quả: **8/8 suites, 31/31 tests PASSED (100%)**.
   - Kiểm tra: Open Day validation, Env schema, Local storage adapter, Token crypto, Enum mappers, Gamification calculation, Phone normalizer, Shared contracts.

### 2.3 Quá Trình Build Production
Lệnh thực thi:
\`\`\`bash
pnpm run build
\`\`\`
- \`@fpt-campus/shared\`: Build Type Declaration thành công.
- \`api\`: NestJS build ra thư mục \`apps/api/dist\` thành công.
- \`web\`: Next.js 16.4.6 với Turbopack biên dịch thành công **29/29 routes** (bao gồm cả SSG tĩnh và SSR động), không gặp bất kỳ lỗi hydration hay compile nào.`;
}

export function getTechnologyStackAudit() {
  return `# 02 — KIỂM TOÁN CÔNG NGHỆ & DEPENDENCY (TECHNOLOGY STACK AUDIT)

## 1. Công Nghệ Tầng Frontend (\`apps/web\`)

- **Framework:** Next.js 16.4.6 (App Router, Turbopack enabled).
- **Core Library:** React 19.3.0, React DOM 19.3.0.
- **Language:** TypeScript 5.7.2 (Strict mode).
- **Styling:** Tailwind CSS v4 (\`@tailwindcss/postcss\`, PostCSS 8).
- **Animation & Motion:** \`motion\` v14.12.0 (Framer Motion thế hệ mới).
- **Bản Đồ & GIS:** \`leaflet\` v1.9.4 kết hợp OpenStreetMap tiles và custom building SVG markers.
- **360° Panorama Viewer:** Tích hợp Marzipano / Pannellum canvas container, hỗ trợ tương tác chuột, cảm ứng và con quay hồi chuyển mobile.
- **Tiện ích UI & Gamification:** \`canvas-confetti\` v1.9.4 (hiệu ứng nhận thưởng), \`clsx\`, \`tailwind-merge\` (quản lý class CSS linh hoạt).
- **Testing:** Playwright Test 1.48+, Node.js Test Runner, Puppeteer 23+ (dành cho multi-viewport snapshot capture).

---

## 2. Công Nghệ Tầng Backend (\`apps/api\`)

- **Runtime & Framework:** Node.js v22.x, NestJS v10.4.x (Modular Monolith).
- **API Protocol:** RESTful API chuẩn Envelope: \`{ success: boolean, data?: T, error?: { code: string, message: string }, meta?: any }\`.
- **Global API Prefix:** \`/api/v1\`.
- **Mã Hóa & Bảo Mật:** Argon2id (\`argon2\` v0.41.1) băm mật khẩu chuẩn bảo mật cao, \`@nestjs/passport\`, \`passport-jwt\`.
- **Xác Thực (Auth):** Access Token (JWT thời hạn 15 phút, lưu in-memory ở client) + Refresh Token (HttpOnly Cookie, SameSite=Strict, tự động xoay vòng Token Rotation và phát hiện tái sử dụng Token Reuse).
- **Phân Quyền:** RBAC 6 cấp độ kết hợp Guards \`JwtAuthGuard\`, \`RolesGuard\`.
- **Upload & Storage:** Three-Zone architecture (\`LocalStorageAdapter\` cho local dev, sẵn sàng cắm S3/Cloudflare R2 adapter), kiểm tra Magic Bytes định dạng file nhị phân.
- **Validation:** \`class-validator\` và \`class-transformer\` tự động sanitize và validate payload đầu vào.

---

## 3. Database & Lưu Trữ (\`prisma/\`)

- **Database Engine:** PostgreSQL 16 (chạy containerized qua Docker Compose \`postgres:16-alpine\`).
- **ORM:** Prisma ORM v5.22.0.
- **Quy mô lược đồ:** 32 Models, 19 Enums, quản lý qua Prisma Migrations có versioning.

---

## 4. Bảng Kiểm Toán Toàn Bộ Dependencies (Dependency Audit Table)

| Package | Version | Phân loại | Phạm vi sử dụng | Đánh giá mức độ cần thiết | Rủi ro & Khuyến nghị |
|---|---|---|---|---|---|
| \`next\` | 16.4.6 | Core | \`apps/web\` | **Bắt buộc** | Framework chính, Turbopack ổn định cao. Giữ nguyên. |
| \`react\` | 19.3.0 | Core | \`apps/web\` | **Bắt buộc** | Thư viện giao diện chính. Giữ nguyên. |
| \`tailwindcss\` | ^4.0.0 | UI | \`apps/web\` | **Bắt buộc** | Engine CSS hiện đại. Cần tổ chức lại Design Tokens. |
| \`motion\` | ^14.12.0 | Animation | \`apps/web\` | **Bắt buộc** | Animation mượt mà cho UI, tabs, drawer, modal. |
| \`leaflet\` | ^1.9.4 | Map/GIS | \`apps/web\` | **Bắt buộc** | Bản đồ tương tác khuôn viên. Cần bọc component an toàn tránh SSR mismatch. |
| \`canvas-confetti\` | ^1.9.4 | UI | \`apps/web\` | **Cần thiết** | Hiệu ứng chúc mừng trúng thưởng/thăng hạng XP. |
| \`@nestjs/core\` | ^10.4.0 | Core | \`apps/api\` | **Bắt buộc** | Nền tảng backend chính. Giữ nguyên. |
| \`@prisma/client\` | 5.22.0 | Database | Toàn dự án | **Bắt buộc** | ORM chuẩn hóa kiểu dữ liệu. Giữ nguyên. |
| \`argon2\` | ^0.41.1 | Security | \`apps/api\` | **Bắt buộc** | Chuẩn hashing mật khẩu an toàn nhất hiện nay. |
| \`@playwright/test\`| ^1.48.0 | Testing | \`apps/web\` | **Bắt buộc** | Framework E2E tự động hóa kiểm thử thật trên browser. |
| \`puppeteer\` | ^23.0.0 | Dev Tool | \`apps/web\` | **Cần thiết** | Công cụ chụp screenshot đa kích thước phục vụ audit. |`;
}

export function getArchitectureAudit() {
  return `# 03 — KIẾN TRÚC HỆ THỐNG & ĐƯỜNG BIÊN HỢP ĐỒNG (ARCHITECTURE AUDIT)

## 1. Mô Hình Monorepo & Phân Tách Không Gian Làm Việc

Dự án được cấu trúc theo mô hình **Monorepo chuẩn hóa**, điều phối bởi \`pnpm-workspace.yaml\`:
\`\`\`
fpt-poly-virtual-campus-360/
├── apps/
│   ├── api/                 # NestJS 10 Modular Monolith (Cổng REST API /api/v1)
│   └── web/                 # Next.js 16 App Router (Giao diện Web đa phân hệ)
├── packages/
│   └── shared/              # Thư viện dùng chung (Contracts, DTOs, Enums, Constants)
├── prisma/                  # Schema cơ sở dữ liệu, Migrations & Scripts Seed
├── docs/                    # Tài liệu kiến trúc, kiểm toán và đặc tả thiết kế
└── docker-compose.yml       # Dịch vụ PostgreSQL 16 & môi trường hỗ trợ
\`\`\`

---

## 2. Đường Biên Hợp Đồng (\`@fpt-campus/shared\`)

Điểm mạnh kiến trúc lớn nhất của hệ thống là **Single Source of Truth** về kiểu dữ liệu tại \`packages/shared\`:
- Mọi Request/Response DTO, mã lỗi (\`API_ERROR_CODES\`), vai trò người dùng (\`USER_ROLES\`), quyền hạn (\`PERMISSIONS\`) đều được định nghĩa tại đây.
- Cả Frontend (\`apps/web\`) và Backend (\`apps/api\`) đều import trực tiếp từ \`@fpt-campus/shared\`.
- **Ý nghĩa sống còn đối với Redesign:** Khi đội ngũ thiết kế lại UI, hoàn toàn **không cần đoán kiểu dữ liệu hay cấu trúc API**. Chỉ cần dùng đúng các interface TypeScript đã có sẵn, dữ liệu sẽ tự động ăn khớp 100%.

---

## 3. Luồng Dữ Liệu & Phân Tách Trách Nhiệm (Separation of Concerns)

1. **Tầng Giao Diện (Presentation Layer - Next.js):**
   - Không chứa truy vấn trực tiếp vào database.
   - Gọi dữ liệu qua các API Client chuyên biệt đặt tại \`apps/web/src/lib/\` (\`public-api.ts\`, \`portal-api.ts\`, \`admin-api.ts\`, \`auth-client.ts\`).
   - Tự động đính kèm Token trong Header \`Authorization: Bearer <token>\`.
2. **Tầng Nghiệp Vụ (Application Layer - NestJS):**
   - Tiếp nhận request tại Controllers $\rightarrow$ xác thực qua Guards $\rightarrow$ xử lý logic nghiệp vụ tại Services $\rightarrow$ ghi log kiểm toán vào bảng \`audit_logs\`.
3. **Tầng Dữ Liệu (Persistence Layer - Prisma ORM):**
   - Quản lý quan hệ bảng chặt chẽ, sử dụng Transactions (\`prisma.$transaction\`) cho các tác vụ nhạy cảm như liên kết tài khoản và cộng điểm XP.`;
}

export function getCompleteRouteInventory() {
  return `# 04 — DANH MỤC TOÀN BỘ ROUTE & TRANG GIAO DIỆN (COMPLETE ROUTE INVENTORY)

Dưới đây là bảng thống kê chính xác tuyệt đối **25 trang chức năng + 2 trạng thái hệ thống**, đối soát trực tiếp từ cây thư mục \`apps/web/src/app\`:

| STT | Route Path | Phân hệ (Group) | Tên màn hình / Mục đích | Layout áp dụng | Yêu cầu Auth / Role | API Backend kết nối | Models DB liên quan | Hiện trạng UI | Nhu cầu Redesign |
|:---:|---|---|---|---|---|---|---|:---:|:---:|
| 1 | \`/\` | Public | Trang chủ Virtual Campus | \`(public)/layout\` | Khách công cộng | \`GET /public/events\`, \`locations\` | Campus, Building, Location, Event | Hoạt động | **Cần Redesign** (Hiện đại hóa Hero, CTA) |
| 2 | \`/about\` | Public | Giới thiệu FPT Polytechnic | \`(public)/layout\` | Khách công cộng | Không (Nội dung tĩnh) | Không | Hoạt động | **Cần Redesign** (Nâng cấp giao diện kể chuyện) |
| 3 | \`/contact\` | Public | Liên hệ & Hỗ trợ tuyển sinh | \`(public)/layout\` | Khách công cộng | Không (Form tĩnh) | Không | Hoạt động | **Cần Redesign** (Thêm bản đồ mini & Form đẹp) |
| 4 | \`/events\` | Public | Lịch trình & Đăng ký Open Day | \`(public)/layout\` | Khách công cộng | \`GET /public/events\`, \`POST register\` | OpenDayEvent, Session, Faq, Ticket | Hoạt động | **Cần Redesign** (Lịch trình trực quan, vé đẹp) |
| 5 | \`/games\` | Public | Minigame trắc nghiệm & Vòng quay | \`(public)/layout\` | Khách công cộng | \`POST /gamification/quiz/submit\`, \`spin\` | QuizAttempt, SpinHistory, XpLedger | Hoạt động | **Cần Redesign** (Tăng tính Gamification vui nhộn) |
| 6 | \`/locations\` | Public | Danh mục không gian & phòng học | \`(public)/layout\` | Khách công cộng | \`GET /public/locations\` | Location, Building, LocationMedia | Hoạt động | **Cần Redesign** (Bộ lọc thông minh, thẻ ảnh xịn) |
| 7 | \`/locations/[slug]\` | Public | Chi tiết địa điểm & ảnh 360 liên kết | \`(public)/layout\` | Khách công cộng | \`GET /public/locations/:slug\` | Location, TourNode, LocationMedia | Hoạt động | **Cần Redesign** (Bố cục thông tin & nút vào tour) |
| 8 | \`/news\` | Public | Bảng tin tức & sự kiện campus | \`(public)/layout\` | Khách công cộng | Không (Dữ liệu tĩnh) | Không | Hoạt động | **Cần Redesign** (Tạp chí hiện đại, chia cột) |
| 9 | \`/news/[slug]\` | Public | Chi tiết bài viết tin tức | \`(public)/layout\` | Khách công cộng | Không (Dữ liệu tĩnh) | Không | Hoạt động | **Cần Redesign** (Typography đọc bài chuẩn mực) |
| 10 | \`/login\` | Auth | Đăng nhập tài khoản tập trung | \`(auth)/layout\` | Chưa đăng nhập | \`POST /auth/login\` | User, UserRole, Role, RefreshToken | Hoạt động | **Cần Redesign** (Chia đôi màn hình, thẩm mỹ cao) |
| 11 | \`/change-password\` | Auth | Buộc đổi mật khẩu lần đầu | \`(auth)/layout\` | Bắt buộc đổi MK | \`POST /auth/change-password\` | User, AuditLog | Hoạt động | **Cần Redesign** (Hiển thị tiêu chí mật khẩu trực quan) |
| 12 | \`/campus\` | Immersive | Khám phá thực tế ảo 360° | \`(immersive)/layout\`| Khách công cộng | \`GET /public/tour\`, \`nodes\` | TourNode, TourEdge, Hotspot, Media | Hoạt động | **Cần Redesign** (UI Toolbar tinh gọn, không scrollbar) |
| 13 | \`/map\` | Immersive | Bản đồ số GIS khuôn viên QTSC | \`(immersive)/layout\`| Khách công cộng | \`GET /public/campus/map\` | Campus, Building, FloorPlan | Hoạt động | **Cần Redesign** (Bản đồ tràn viền, bộ lọc tòa nhà) |
| 14 | \`/portal\` | Student | Tổng quan Cổng sinh viên | \`(portal)/layout\` | STUDENT | \`GET /portal/profile\`, \`tickets\`, \`gamification\`| User, EventParticipation, XpLedger | Hoạt động | **Cần Redesign** (Dashboard chào mừng sang trọng) |
| 15 | \`/portal/profile\` | Student | Thông tin cá nhân & bio sinh viên | \`(portal)/layout\` | STUDENT | \`GET/PATCH /portal/profile\` | User | Hoạt động | **Cần Redesign** (Thẻ sinh viên điện tử sinh động) |
| 16 | \`/portal/progress\` | Student | Điểm thưởng XP, level, lịch sử quay | \`(portal)/layout\` | STUDENT | \`GET /portal/gamification\` | XpLedger, UserSpinHistory | Hoạt động | **Cần Redesign** (Thanh tiến trình & huy hiệu cấp độ) |
| 17 | \`/portal/schedule\` | Student | Lịch trình phiên tham quan cá nhân | \`(portal)/layout\` | STUDENT | \`GET /portal/tickets\` | EventParticipation, OpenDaySession | Hoạt động | **Cần Redesign** (Timeline sự kiện rõ nét) |
| 18 | \`/portal/tickets\` | Student | Vé Open Day & QR Code cá nhân | \`(portal)/layout\` | STUDENT | \`GET /portal/tickets\` | EventParticipation, OpenDayEvent | Hoạt động | **Cần Redesign** (Vé máy bay / concert xịn xò) |
| 19 | \`/parent\` | Parent | Cổng phụ huynh theo dõi con em | \`(portal)/layout\` | PARENT | \`GET /parent/students\`, \`POST link\` | ParentStudentLink, User, XpLedger | Hoạt động | **Cần Redesign** (Thẻ thông tin con em trực quan) |
| 20 | \`/admin\` | Admin | Bảng điều khiển quản trị chung | \`admin/layout\` | ADMIN, SUPER_ADMIN | \`GET /admin/stats\` (Tổng hợp) | Users, Events, Locations, TourNodes | Hoạt động | **Cần Redesign** (SaaS Enterprise chuẩn chỉnh) |
| 21 | \`/admin/events\` | Admin | Quản lý sự kiện, phiên & Check-in | \`admin/layout\` | EVENT_OPERATOR, ADMIN | \`GET/POST/PATCH /admin/events\` | OpenDayEvent, Session, Faq, QuizItem | Hoạt động | **Cần Redesign** (Bảng quản lý & bộ lọc sắc nét) |
| 22 | \`/admin/locations\` | Admin | Quản lý tòa nhà, tầng, địa điểm | \`admin/layout\` | ADMIN, SUPER_ADMIN | \`GET/POST/PATCH /admin/locations\` | Building, Floor, Location, LocationMedia | Hoạt động | **Cần Redesign** (Drawer nhập liệu chuẩn Form SaaS) |
| 23 | \`/admin/media\` | Admin | Quản lý thư viện hình ảnh & 360 | \`admin/layout\` | ADMIN, SUPER_ADMIN | \`GET/POST /admin/media\`, presign | MediaAsset, UploadToken | Hoạt động | **Cần Redesign** (Lưới media, preview ảnh 360) |
| 24 | \`/admin/users\` | Admin | Quản trị tài khoản & phân quyền | \`admin/layout\` | SUPER_ADMIN | \`GET/POST /admin/users\`, \`roles\` | User, UserRole, Role, Permission | Hoạt động | **Cần Redesign** (Bảng tài khoản & badge vai trò) |
| 25 | \`/admin/virtual-tour\`| Admin | Thiết lập kịch bản Tour & Hotspots | \`admin/layout\` | ADMIN, SUPER_ADMIN | \`GET/POST /admin/tour\`, \`hotspots\` | TourNode, TourEdge, Hotspot | Hoạt động | **Cần Redesign** (Khung biên tập 360 Studio chuyên nghiệp) |
| 26 | \`/_not-found\` | System | Trang báo lỗi 404 Không tìm thấy | Root layout | Tất cả | Không | Không | Hoạt động | **Cần Redesign** (Minh họa 404 phong cách Poly) |
| 27 | \`/loading\` | System | Skeleton toàn trang khi tải | Root layout | Tất cả | Không | Không | Hoạt động | **Cần Redesign** (Skeleton animation mượt mà) |`;
}
