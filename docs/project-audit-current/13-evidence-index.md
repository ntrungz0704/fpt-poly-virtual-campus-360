# CHỈ MỤC BẰNG CHỨNG KIỂM TOÁN THỰC TẾ (13-EVIDENCE-INDEX)
## FPT Polytechnic Virtual Campus 360°

---

## 1. Danh Sách Commit & Bằng Chứng Git

- **Commit `b894982`:** `fix(admin): pin sidebar sticky 100vh and add save tour and hotspot buttons (M4-hotfix)`
  - File: `apps/web/src/app/admin/layout.tsx` (dòng 80-86)
  - File: `apps/web/src/app/admin/virtual-tour/page.tsx` (dòng 186-200, 381-420)
- **Commit `1913be2`:** `feat(portal): implement student and parent portal with live database integration (M4)`
  - 18 files changed, 2444 insertions
  - Migration: `prisma/migrations/20261113000003_m4_portal_parent_student/migration.sql`
- **Commit `d03b55a`:** `fix(auth): enforce single super admin credentials and reconcile seed with db integrity`
- **Commit `a893b93`:** `feat(gamification): implement quiz XP rewards and leaderboard (M3D)`
- **Commit `f9a0672`:** `feat(events): complete Open Day registration and QR check-in (M3C)`

---

## 2. Bằng Chứng Mã Nguồn & Tầng Dữ Liệu (Source Code Lines)

1. **Argon2id Hash & Xác thực:**
   - `apps/api/src/modules/auth/auth.service.ts`: Dòng 86-175 (Hàm `login`, xác thực Argon2id, lockout 5 lần).
2. **Quản lý Token & Thu hồi Token Tái sử dụng (Token Reuse):**
   - `apps/api/src/modules/auth/auth.service.ts`: Dòng 228-315 (Hàm `refresh`, kiểm tra `familyId`, xoay vòng token).
3. **Mã QR SVG Thuần TypeScript (Zero-dependency):**
   - `apps/web/src/components/ui/QRCodeSVG.tsx`: Dòng 1-120 (Thuật toán sinh mã QR SVG chuẩn).
4. **Bảo toàn Cấu trúc Liên kết Sinh viên - Phụ huynh:**
   - `prisma/schema.prisma`: Dòng 852-882 (Model `ParentStudentLink`, `enum LinkStatus`).
5. **Ghim Sidebar 100vh Sticky Viewport:**
   - `apps/web/src/app/admin/layout.tsx`: Dòng 80-86 (`lg:sticky lg:top-0 lg:h-screen lg:self-start`).

---

## 3. Bằng Chứng Thực Thi Lệnh & Nhật Ký Kiểm Thử (Command Outputs)

1. **Kiểm thử Database Integrity:**
   - Lệnh: `pnpm db:test` (`tsx prisma/verify-db-integrity.ts`)
   - Kết quả: **PASS (14/14 checks pass)**, Exit code: 0.
2. **Kiểm thử Playwright E2E M4:**
   - Lệnh: `pnpm --filter web exec playwright test e2e/portal-flow.spec.ts`
   - Kết quả: **PASS (6/6 tests pass in 6.6s)**, Exit code: 0.
3. **Kiểm thử Playwright E2E M3C:**
   - Lệnh: `pnpm --filter web exec playwright test e2e/open-day-flow.spec.ts`
   - Kết quả: **PASS (5/5 tests pass in 7.4s)**, Exit code: 0.
4. **Kiểm thử Unit Tests:**
   - Lệnh: `pnpm --filter web test:unit`
   - Kết quả: **PASS (10/10 tests pass)**, Exit code: 0.
5. **Kiểm thử TypeScript & ESLint:**
   - Lệnh: `pnpm typecheck` → Exit code: 0.
   - Lệnh: `pnpm --filter web lint` → Exit code: 0 (0 errors, 0 warnings).
6. **Biên dịch Production Build:**
   - Lệnh: `pnpm --filter web build`
   - Kết quả: Biên dịch thành công 29/29 routes trong 47s, Exit code: 0.
