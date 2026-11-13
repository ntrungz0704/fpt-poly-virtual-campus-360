# TIẾN ĐỘ THỰC TẾ & LỊCH SỬ PHÁT TRIỂN DỰ ÁN (01-PROJECT-PROGRESS)
## FPT Polytechnic Virtual Campus 360°

- **Authoritative HEAD Commit:** `b894982`
- **Nhánh Git:** `main`

---

## 1. Bảng Tổng Hợp Tiến Độ Các Phase & Milestone

| Phase / Milestone | Tên Module / Hạng mục | Commit SHA | Trạng thái Thực tế | Mức độ Hoàn thành |
|---|---|---|---|---|
| **Phase 0** | Khởi tạo Repository, Workspace & Công cụ | `7bdad34` | **S6 — PRODUCTION READY** | 100% |
| **Phase 1** | Dọn dẹp Auth giả, Mock Data & 19 Routes UI | `9062c58` | **S6 — PRODUCTION READY** | 100% |
| **Phase 2A-1** | Database Bootstrap (PostgreSQL 16, Prisma, Argon2id, Seed) | `7e1753d` | **S6 — PRODUCTION READY** | 100% |
| **Phase 2A-2** | Core Backend (NestJS, JWT Session, Public Read, Isolation) | `ff13f14` | **S6 — PRODUCTION READY** | 100% |
| **Phase 2A-3 M1** | Shared Contracts, Quiz-Event FK, UploadToken Constraints | `6fcf4dc` | **S6 — PRODUCTION READY** | 100% |
| **Phase 2A-3 M2** | Open Day Admin CRUD, Public Quiz Verification, Rate Limit | `131de78` | **S6 — PRODUCTION READY** | 100% |
| **Phase 2B** | Authentication & RBAC Frontend Integration, Guards | `39d722a` | **S6 — PRODUCTION READY** | 100% |
| **Milestone M3A** | Media Storage (Local & S3 Adapter, Magic Bytes, Upload Token) | `d4913ed` | **S5 — VERIFIED** | 95% (Local verified, Cloud config pending) |
| **Milestone M3B** | Public API Integration (Tour 360, GIS Map, Locations) | `3268a72` | **S5 — VERIFIED** | 100% |
| **Milestone M3C** | Open Day Registration, SVG QR Ticket & Check-in Flow | `f9a0672` | **S6 — PRODUCTION READY** | 100% |
| **Milestone M3D** | Gamification (Quiz Scoring, XP Ledger, Spin Wheel, Leaderboard)| `a893b93` | **S6 — PRODUCTION READY** | 100% |
| **Milestone M4** | Student & Parent Portal (Profile, Tickets, Schedule, Linking) | `1913be2` / `b894982` | **S4 — INTEGRATED** | 90% (Chờ remediation B1–B6) |
| **Milestone M5** | News & Contact CMS (PostgreSQL Storage, Real Forms, Admin CRUD)| *Chưa bắt đầu* | **S0 — NOT STARTED** | 0% (Kế hoạch tiếp theo) |
| **Milestone M6** | 3D Digital Twin & Three-Zone Asset Delivery Pipeline | *Chưa bắt đầu* | **S1 — SCAFFOLDED** | 20% |
| **Milestone M7** | Production Hardening, Load Testing & Final Acceptance | *Chưa bắt đầu* | **S0 — NOT STARTED** | 0% |

---

## 2. Chi Tiết Từng Mốc Phát Triển & Bằng Chứng Mã Nguồn

### Phase 2A-1: Database Bootstrap
- **Mục tiêu:** Thiết lập schema chuẩn 3NF, áp dụng migrations, chống trùng lặp, bảo đảm tính toàn vẹn khóa ngoại và ràng buộc CHECK trên PostgreSQL 16.
- **Bằng chứng:** 
  - `prisma/migrations/20261111175635_init/migration.sql`
  - `prisma/verify-db-integrity.ts` thực thi 14/14 checks PASS trên database thật.

### Phase 2A-2: Core Backend & Auth/Public Read
- **Mục tiêu:** Khởi tạo kiến trúc NestJS Modular Monolith, tích hợp PrismaService, mã hóa Argon2id, quản lý phiên qua HttpOnly Refresh Token và bảo vệ endpoint công khai.
- **Bằng chứng:**
  - `apps/api/src/modules/auth/auth.service.ts`
  - `apps/api/test/integration/public-isolation.integration.spec.ts`

### Phase 2B: Authentication & RBAC Frontend
- **Mục tiêu:** Xây dựng luồng đăng nhập thực tế `/login`, lưu access token an toàn trong bộ nhớ (`inMemoryAccessToken`), xử lý refresh token tự động và phân quyền trang quản trị (`ProtectedRoute`, `AdminModulePermissionGuard`).
- **Bằng chứng:**
  - `apps/web/src/components/auth/AuthProvider.tsx`
  - `apps/web/src/components/auth/LoginForm.tsx`
  - `apps/web/e2e/auth-integration.spec.ts`

### Milestone M3A: Media Storage
- **Mục tiêu:** Xây dựng pipeline lưu trữ tệp đa vùng (Three-Zone Storage), xác thực mã kiểm tra SHA-256, kiểm tra magic bytes tệp ảnh (JPEG/PNG) và cấp UploadToken có thời hạn.
- **Bằng chứng:**
  - `apps/api/src/modules/media/media.service.ts`
  - `apps/web/src/app/admin/media/page.tsx`

### Milestone M3B: Public API Integration
- **Mục tiêu:** Kết nối giao diện công khai `/campus`, `/map`, `/locations` với API thật `GET /api/v1/public/*`.
- **Bằng chứng:**
  - `apps/web/src/app/(immersive)/campus/page.tsx`
  - `apps/web/src/app/(immersive)/map/page.tsx`

### Milestone M3C: Open Day Flow & QR Check-in
- **Mục tiêu:** Người tham dự đăng ký sự kiện Open Day nhận vé điện tử định dạng `OD26-XXXX-XXXX`, hiển thị mã QR SVG, tra cứu vé và ban tổ chức thực hiện quét điểm danh trên `/admin/events`.
- **Bằng chứng:**
  - `apps/api/src/modules/open-day/open-day.service.ts`
  - `apps/web/e2e/open-day-flow.spec.ts` (5/5 PASS)

### Milestone M3D: Gamification
- **Mục tiêu:** Đấu trường Quiz kiểm tra kiến thức chấm điểm phía server, cộng điểm thưởng XP vào sổ cái `XpLedger`, tính cấp bậc người dùng và Vòng quay may mắn trúng thưởng có kiểm soát số lượng.
- **Bằng chứng:**
  - `apps/api/src/modules/gamification/gamification.service.ts`
  - `apps/web/src/app/(public)/games/page.tsx`

### Milestone M4: Student & Parent Portal
- **Mục tiêu:** Cung cấp không gian tài khoản riêng biệt cho Sinh viên (`/portal/*`) và Phụ huynh (`/parent`), cho phép chỉnh sửa hồ sơ, xem vé sự kiện, theo dõi lịch trình, xem bảng tiến trình XP và quản lý yêu cầu liên kết.
- **Bằng chứng:**
  - `prisma/migrations/20261113000003_m4_portal_parent_student/migration.sql`
  - `apps/api/src/modules/portal/portal.service.ts`
  - `apps/web/e2e/portal-flow.spec.ts` (6/6 PASS)
  - Commit `1913be2` & Hotfix commit `b894982`

---

## 3. Các Công Việc Còn Thiếu Trước Khi Đóng M4
Theo đánh giá của GPT Mentor, cần thực hiện 6 hạng mục Remediation trước khi chuyển sang M5:
1. **B1:** Kiểm tra chặt chẽ `userType === "STUDENT"` cho Cổng Sinh viên và `userType === "PARENT"` cho Cổng Phụ huynh tại Backend.
2. **B2:** Tái cấu trúc hàm `getGamification()` dùng `prisma.xpLedger.aggregate` tính tổng XP trên 100% dữ liệu lịch sử thay vì cộng dồn 10 bản ghi gần nhất.
3. **B3:** Mở rộng kịch bản kiểm thử E2E với các tài khoản thử nghiệm mang role Student và Parent riêng biệt.
4. **B4:** Xóa bỏ fallback mật khẩu cứng trong các file E2E spec.
5. **B5:** Loại bỏ cơ chế ghép dữ liệu theo tên/email mập mờ trong `getTickets()` và `getSchedule()`.
6. **B6:** Ghi nhận rõ trạng thái bản nháp của tính năng lưu cấu hình Tour trong `localStorage` hoặc bổ sung API lưu backend.
