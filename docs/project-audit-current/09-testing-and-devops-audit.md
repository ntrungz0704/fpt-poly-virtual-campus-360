# KIỂM TOÁN HỆ THỐNG KIỂM THỬ & DEVOPS (09-TESTING-AND-DEVOPS-AUDIT)
## FPT Polytechnic Virtual Campus 360°

---

## 1. Bảng Kết Quả Thực Thi Kiểm Thử Tự Động Toàn Dự Án

| Lệnh Thực Thi (Test Command) | Phạm Vi Kiểm Thử | Số Lượng Test | Kết Quả | Chi Tiết / Ghi Chú |
|---|---|---|---|---|
| `pnpm typecheck` | Kiểm tra TypeScript toàn bộ monorepo | `@fpt-campus/shared`, `web` | **PASS (Exit 0)** | 0 lỗi kiểu dữ liệu. |
| `pnpm --filter web lint` | Kiểm tra cú pháp & React rules | `apps/web` (ESLint) | **PASS (Exit 0)** | 0 errors, 0 warnings. Đã dọn sạch unused vars và set-state-in-effect. |
| `pnpm --filter web test:unit` | Unit test các hàm tiện ích web | `apps/web/tests/unit/*.test.ts` | **PASS (10/10)** | Test RBAC, routing, password policy, phone, QR format. |
| `pnpm db:test` | Kiểm thử toàn vẹn PostgreSQL 16 | `prisma/verify-db-integrity.ts` | **PASS (14/14)** | Primary DB, Argon2id, CHECK constraints, Soft-delete, SHA-256 disk checksums. |
| `pnpm --filter web exec playwright test e2e/portal-flow.spec.ts` | Playwright E2E Cổng Sinh viên & Phụ huynh (M4) | 6 kịch bản kiểm thử E2E | **PASS (6/6)** | Hoàn tất trong 6.6s qua 1 phiên đăng nhập duy nhất. |
| `pnpm --filter web exec playwright test e2e/open-day-flow.spec.ts` | Playwright E2E Luồng Open Day & Check-in (M3C) | 5 kịch bản kiểm thử E2E | **PASS (5/5)** | Đăng ký vé, xem QR SVG, tra cứu vé, chặn duplicate check-in. |
| `pnpm --filter api test` | Kiểm thử tích hợp NestJS API (Jest) | 16 test suites | **15 PASS / 1 FAIL** (62/64 tests pass) | 1 lỗi do `mustChangePassword` trong seed đổi thành `false` sau đợt cấu hình single admin. |
| `pnpm --filter web build` | Biên dịch Next.js 16 Production Build | 29 Routes | **PASS (Exit 0)** | Sinh mã tĩnh và dynamic routes thành công. |

---

## 2. Kiểm Toán Môi Trường Vận Hành (DevOps & Infrastructure)

- **Docker Compose:**
  - File `docker-compose.yml` định nghĩa service `postgres:16-alpine` ánh xạ cổng `5432:5432`, cấu hình biến môi trường chuẩn xác và volume bền vững `pgdata`.
- **Quy trình Quản lý Tiến trình (Process Management):**
  - Backend API NestJS chạy tại cổng `4000` (`http://localhost:4000/api/v1`).
  - Web Server Next.js chạy tại cổng `3000` (`http://localhost:3000`).
  - Hỗ trợ đầy đủ cờ tắt tiến trình an toàn (`enableShutdownHooks`).
- **CI/CD Workflows:**
  - Cấu hình GitHub Actions tại `.github/workflows/` tự động kích hoạt `pnpm install`, `pnpm typecheck`, `pnpm db:test` và `pnpm build` trên mỗi Pull Request và commit vào nhánh `main`.
