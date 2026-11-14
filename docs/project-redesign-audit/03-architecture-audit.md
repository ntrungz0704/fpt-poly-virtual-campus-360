# 03 — KIẾN TRÚC HỆ THỐNG & ĐƯỜNG BIÊN HỢP ĐỒNG (ARCHITECTURE AUDIT)

## 1. Mô Hình Monorepo & Phân Tách Không Gian Làm Việc

Dự án được cấu trúc theo mô hình **Monorepo chuẩn hóa**, điều phối bởi `pnpm-workspace.yaml`:
```
fpt-poly-virtual-campus-360/
├── apps/
│   ├── api/                 # NestJS 10 Modular Monolith (Cổng REST API /api/v1)
│   └── web/                 # Next.js 16 App Router (Giao diện Web đa phân hệ)
├── packages/
│   └── shared/              # Thư viện dùng chung (Contracts, DTOs, Enums, Constants)
├── prisma/                  # Schema cơ sở dữ liệu, Migrations & Scripts Seed
├── docs/                    # Tài liệu kiến trúc, kiểm toán và đặc tả thiết kế
└── docker-compose.yml       # Dịch vụ PostgreSQL 16 & môi trường hỗ trợ
```

---

## 2. Đường Biên Hợp Đồng (`@fpt-campus/shared`)

Điểm mạnh kiến trúc lớn nhất của hệ thống là **Single Source of Truth** về kiểu dữ liệu tại `packages/shared`:
- Mọi Request/Response DTO, mã lỗi (`API_ERROR_CODES`), vai trò người dùng (`USER_ROLES`), quyền hạn (`PERMISSIONS`) đều được định nghĩa tại đây.
- Cả Frontend (`apps/web`) và Backend (`apps/api`) đều import trực tiếp từ `@fpt-campus/shared`.
- **Ý nghĩa sống còn đối với Redesign:** Khi đội ngũ thiết kế lại UI, hoàn toàn **không cần đoán kiểu dữ liệu hay cấu trúc API**. Chỉ cần dùng đúng các interface TypeScript đã có sẵn, dữ liệu sẽ tự động ăn khớp 100%.

---

## 3. Luồng Dữ Liệu & Phân Tách Trách Nhiệm (Separation of Concerns)

1. **Tầng Giao Diện (Presentation Layer - Next.js):**
   - Không chứa truy vấn trực tiếp vào database.
   - Gọi dữ liệu qua các API Client chuyên biệt đặt tại `apps/web/src/lib/` (`public-api.ts`, `portal-api.ts`, `admin-api.ts`, `auth-client.ts`).
   - Tự động đính kèm Token trong Header `Authorization: Bearer <token>`.
2. **Tầng Nghiệp Vụ (Application Layer - NestJS):**
   - Tiếp nhận request tại Controllers $ightarrow$ xác thực qua Guards $ightarrow$ xử lý logic nghiệp vụ tại Services $ightarrow$ ghi log kiểm toán vào bảng `audit_logs`.
3. **Tầng Dữ Liệu (Persistence Layer - Prisma ORM):**
   - Quản lý quan hệ bảng chặt chẽ, sử dụng Transactions (`prisma.$transaction`) cho các tác vụ nhạy cảm như liên kết tài khoản và cộng điểm XP.
