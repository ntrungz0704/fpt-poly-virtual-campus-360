# 01 — HIỆN TRẠNG DỰ ÁN CHI TIẾT (PROJECT CURRENT STATUS)

## 1. Đối Soát Lịch Sử Phát Triển Đến Thời Điểm Hiện Tại

Quá trình phát triển của dự án đã vượt qua các mốc quan trọng, hiện đã hoàn thành toàn bộ các Milestone cốt lõi của Phase 2:
- **Phase 2A-1 (Database Bootstrap):** Hoàn tất Prisma schema, migrations khởi tạo và seed dữ liệu mẫu chuẩn (`commit 7e1753d`).
- **Phase 2A-2 (Core Backend & Auth):** Tích hợp xác thực Argon2id, cookie rotation, bảo vệ CSRF và public API (`commit ff13f14`).
- **Phase 2A-3 / M1 & M2:** Chuẩn hóa shared contracts, upload token và Open Day CRUD quản trị (`commits 6fcf4dc, 131de78`).
- **Milestone M3A:** Triển khai hạ tầng lưu trữ media đám mây và cục bộ, xác thực magic bytes file upload (`commit d4913ed`).
- **Milestone M3B:** Đồng bộ giao diện Web với API thật cho Tour 360°, Map Leaflet và Locations (`commit 3268a72`).
- **Milestone M3C:** Hoàn thiện đăng ký Open Day công khai, phát sinh vé mã canonical và check-in QR (`commit f9a0672`).
- **Milestone M3D:** Cơ chế gamification tính điểm XP tự động qua bài thi trắc nghiệm và bảng xếp hạng (`commit a893b93`).
- **Milestone M4:** Hoàn tất Student Portal và Parent Portal, giải quyết triệt để lỗi phân quyền chéo IDOR giữa Phụ huynh và Sinh viên (`commits 1913be2, 935d27b`).

---

## 2. Bằng Chứng Thực Tế Về Chất Lượng Codebase (Runtime Proofs)

### 2.1 Typecheck Toàn Bộ Monorepo
Lệnh kiểm tra:
```bash
pnpm --filter @fpt-campus/shared typecheck && pnpm --filter api typecheck && pnpm --filter web typecheck
```
- Kết quả: **Mã thoát 0 (Exit Code 0)**.
- 100% code TypeScript hợp lệ, không có lỗi kiểu dữ liệu (`0 errors`).

### 2.2 Bộ Kiểm Thử Đơn Vị (Unit Tests)
1. **Frontend Web Unit Tests:**
   - Framework: Node.js Built-in Test Runner + `tsx`.
   - File thực thi: `apps/web/tests/unit/*.test.ts`.
   - Kết quả: **10/10 tests PASSED (100%)**.
   - Kiểm tra: An toàn đường dẫn redirect, bảo vệ route phân quyền RBAC, mật khẩu 12 ký tự, format mã vé OD26, chuẩn hóa SĐT Việt Nam (+84) và email.
2. **Backend API Unit Tests:**
   - Framework: Jest in-band.
   - File thực thi: `apps/api/test/unit/*.spec.ts`.
   - Kết quả: **8/8 suites, 31/31 tests PASSED (100%)**.
   - Kiểm tra: Open Day validation, Env schema, Local storage adapter, Token crypto, Enum mappers, Gamification calculation, Phone normalizer, Shared contracts.

### 2.3 Quá Trình Build Production
Lệnh thực thi:
```bash
pnpm run build
```
- `@fpt-campus/shared`: Build Type Declaration thành công.
- `api`: NestJS build ra thư mục `apps/api/dist` thành công.
- `web`: Next.js 16.4.6 với Turbopack biên dịch thành công **29/29 routes** (bao gồm cả SSG tĩnh và SSR động), không gặp bất kỳ lỗi hydration hay compile nào.
