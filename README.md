# FPT Polytechnic Virtual Campus 360° (Cơ sở QTSC Quận 12)

[![NestJS](https://img.shields.io/badge/Backend-NestJS%2011-ea2845?style=flat&logo=nestjs)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-black?style=flat&logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma%206-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/E2E-Playwright-45ba4b?style=flat&logo=playwright)](https://playwright.dev/)

> **Virtual Campus 360°** là hệ sinh thái số hóa toàn diện khuôn viên trường học dành cho sinh viên, tân sinh viên, phụ huynh và ban giám hiệu tại **FPT Polytechnic TP.HCM — Cơ sở Công viên Phần mềm Quang Trung (QTSC), Quận 12**. Nền tảng kết hợp công nghệ ảnh toàn cảnh 360° WebGL, bản đồ GIS định vị không gian thực, cổng sự kiện Open Day trực tuyến và hệ thống phân quyền quản trị doanh nghiệp đa cấp.

---

## 🏛️ Kiến Trúc Tổng Thể (System Architecture)

Hệ thống được phát triển theo mô hình **Monorepo** chuẩn mực với `pnpm workspace`, tách biệt rõ ràng giữa tầng hiển thị, nghiệp vụ Backend, hợp đồng dữ liệu dùng chung và cơ sở dữ liệu:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Virtual Campus Ecosystem                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌──────────────────────┐                         ┌───────────────────────┐
│   Next.js 16 Web     │                         │   NestJS 11 Backend   │
│   (Port 3000)        │◄─── REST API / Cookie ──►   (Port 4000)         │
│  - App Router        │      Credentials:       │  - Modular Monolith   │
│  - React 19          │      "include"          │  - Fastify / Express  │
│  - Tailwind CSS 4    │                         │  - Argon2id & JWT     │
│  - Three.js & Leaflet│                         │  - RBAC & Throttler   │
└──────────┬───────────┘                         └───────────┬───────────┘
           │                                                 │
           └────────────────────────┬────────────────────────┘
                                    ▼
                     ┌─────────────────────────────┐
                     │    @fpt-campus/shared       │
                     │  - Typed Contracts & DTOs   │
                     │  - Enums, Roles & Validations
                     └──────────────┬──────────────┘
                                    ▼
                     ┌─────────────────────────────┐
                     │   PostgreSQL 16 Database    │
                     │  - Prisma ORM 6 (26 Models) │
                     │  - Full FK & Spatial Indexes│
                     └─────────────────────────────┘
```

### Điểm nhấn công nghệ (Tech Stack Highlights)
- **Frontend (`apps/web`):** Next.js 16 (Turbopack, App Router), React 19, Tailwind CSS 4, Three.js WebGL (360° viewer), Leaflet (GIS map), Motion.
- **Backend API (`apps/api`):** NestJS 11 Modular Monolith, Prisma ORM 6, Passport JWT, Argon2id password hashing, Throttler rate-limiting.
- **Shared Contract (`packages/shared`):** Typesafe API schemas, DTOs, Enums, Error response envelopes, Role-Permission mappings.
- **Database:** PostgreSQL 16 (Dockerized container `fpt_virtual_campus_db`), Prisma migrations, checksum-verified idempotent seed.

---

## ✨ Tính Năng Nổi Bật (Key Features)

### 1. 🌐 Trải Nghiệm Khám Phá Nhập Vai (Public & Immersive Experience)
- **Tham quan 360° WebGL (`/campus`):** Trình xem ảnh panorama toàn cảnh tỷ lệ chuẩn 2:1 dựng trên nền WebGL Three.js, hỗ trợ xoay góc nhìn 360° × 180°, chuyển đổi giữa các tầng, tòa nhà và tương tác hotspot.
- **Bản đồ GIS Khuôn viên (`/map`):** Bản đồ tương tác định vị chuẩn tọa độ WGS-84, phân tầng không gian (Tòa Innovation, Tòa T, Hội trường, Thư viện, Khu thể thao), tính toán khoảng cách đi bộ và thời gian di chuyển thực tế từ Cổng QTSC.
- **Danh mục Địa điểm & Cơ sở vật chất (`/locations`, `/locations/[slug]`):** Phân loại theo chuyên khoa (Lab CNTT, Studio Đồ họa & iMac, Thư viện số, Hội trường), xem chi tiết phòng, sức chứa và thiết bị.
- **Cổng Sự kiện Open Day (`/events`, `/games`):** Xem lịch trình chi tiết sự kiện tham quan trường học, tham gia Mini-game Quiz định hướng nghề nghiệp và xác thực điểm số trực tiếp từ máy chủ.

### 2. 🔐 Hệ Thống Xác Thực & Phân Quyền Bảo Mật Doanh Nghiệp (Enterprise Auth & RBAC)
- **Kiến trúc Dual-Token an toàn cao:**
  - `accessToken` (thời hạn ngắn) chỉ lưu trong bộ nhớ RAM (`in-memory memory store`), **tuyệt đối không lưu trong localStorage hay sessionStorage** để triệt tiêu lỗ hổng XSS đánh cắp phiên.
  - `refreshToken` (thời hạn 7 ngày) được bảo vệ bằng Cookie an toàn: `HttpOnly`, `SameSite=Lax`, `Path=/api/v1/auth`.
- **Cơ chế chống Race Condition đa luồng (Single-Flight Mutex):** Giải quyết triệt để xung đột làm mới token khi nhiều component hoặc nhiều tab trình duyệt gọi đồng thời.
- **Quy trình Đổi mật khẩu Bắt buộc (`/change-password`):** Tài khoản mới được cấp hoặc có cờ `mustChangePassword` bắt buộc phải đổi mật khẩu tối thiểu 12 ký tự (chữ hoa, chữ thường, số, ký tự đặc biệt) ngay lần đăng nhập đầu tiên. Backend từ chối mọi quyền truy cập tài nguyên nghiệp vụ cho tới khi đổi mật khẩu thành công.
- **Phân quyền 5 cấp bậc (RBAC):**
  1. `SUPER_ADMIN`: Toàn quyền quản trị hệ thống, quản lý người dùng và cấp phát quyền.
  2. `CAMPUS_ADMIN`: Quản lý không gian tòa nhà, địa điểm, phòng học và tour 360°.
  3. `EVENT_OPERATOR`: Quản lý sự kiện Open Day, điểm danh check-in và tổ chức mini-game.
  4. `CONTENT_STAFF`: Quản lý tin tức, truyền thông và bài viết giới thiệu.
  5. `STUDENT`: Truy cập Cổng thông tin cá nhân (Student Portal), lịch sử tham gia Open Day và điểm danh.

---

## 📁 Cấu Trúc Mã Nguồn (Repository Layout)

```text
fpt-poly-virtual-campus-360/
├── apps/
│   ├── api/                      # Backend API (NestJS 11 Modular Monolith)
│   │   ├── src/
│   │   │   ├── modules/          # Auth, Users/RBAC, Public, Audit-Log, Events, Storage
│   │   │   ├── guards/           # JwtAuthGuard, ForcePasswordGuard, PermissionsGuard
│   │   │   └── main.ts           # Cấu hình CORS, CookieParser, Global Pipes
│   │   └── test/                 # Test tích hợp (Integration & Regression test suites)
│   └── web/                      # Frontend Web App (Next.js 16 App Router)
│       ├── e2e/                  # Bộ kịch bản Playwright E2E Runner & Specs
│       ├── public/               # Ảnh 2D khuôn viên, panorama, icons, manifest.json
│       └── src/
│           ├── app/              # Routes: (public), (auth), (portal), admin
│           ├── components/       # AuthProvider, ProtectedRoute, 360 Viewer, GIS Map
│           └── lib/              # Auth routing, api-client, session management
├── packages/
│   └── shared/                   # Gói hợp đồng dùng chung @fpt-campus/shared
│       └── src/                  # DTOs, Enums, Roles, Error codes, API contracts
├── prisma/
│   ├── migrations/               # Lịch sử Prisma Database Migrations
│   ├── schema.prisma             # Lược đồ quan hệ dữ liệu 26 models chuẩn 3NF
│   ├── seed.ts                   # Dữ liệu mẫu khởi tạo chuẩn hóa (Argon2id)
│   └── verify-db-integrity.ts    # Kiểm tra toàn vẹn DB & tài nguyên đĩa
└── docker-compose.yml            # Dịch vụ PostgreSQL 16
```

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy (Getting Started)

### Yêu cầu môi trường (Prerequisites)
- **Node.js:** `>= 20.18.0` (Khuyến nghị Node.js v22 LTS)
- **pnpm:** `>= 10.0.0` (`corepack enable` hoặc `npm install -g pnpm`)
- **Docker & Docker Desktop:** Chạy PostgreSQL 16 container

### 1. Khởi tạo Cơ sở dữ liệu (PostgreSQL 16)
Khởi động container cơ sở dữ liệu qua Docker Compose:
```bash
docker compose up -d
```
> Database `virtual_campus_360` sẽ chạy tại cổng `localhost:5432` với user/password mặc định: `postgres:postgres`.

### 2. Cài đặt Dependencies & Build Shared Package
```bash
pnpm install --frozen-lockfile
pnpm --filter @fpt-campus/shared build
```

### 3. Đồng bộ Schema & Nạp Dữ liệu Mẫu (Prisma)
```bash
pnpm db:migrate
pnpm db:seed
```

### 4. Khởi chạy Ứng dụng ở Chế độ Phát triển (Development)
Chạy đồng thời cả Backend API và Frontend Web qua lệnh:
```bash
pnpm dev
```
- **Frontend Web:** [`http://localhost:3000`](http://localhost:3000)
- **Backend API:** [`http://localhost:4000/api/v1`](http://localhost:4000/api/v1)
- **Swagger API Docs:** [`http://localhost:4000/docs`](http://localhost:4000/docs)

---

## 🔑 Tài Khoản Thử Nghiệm Mặc Định (Seed Test Accounts)

| Vai trò (Role) | Tên đăng nhập / Email | Mật khẩu mặc định | Ghi chú |
|---|---|---|---|
| **Super Admin** | `admin@poly.edu.vn` | `Admin@123456` | Toàn quyền truy cập `/admin/*` |
| **Event Operator** | `operator@poly.edu.vn` | `Admin@123456` | Quản lý sự kiện Open Day & Check-in |
| **Content Staff** | `staff@poly.edu.vn` | `Admin@123456` | Quản trị tin tức & nội dung địa điểm |
| **Student** | `student1@poly.edu.vn` | `Student@123456` | Đăng nhập Portal `/portal` (Không vào được `/admin`) |
| **First-Login User** | `firstlogin@poly.edu.vn`| `Temp@123456` | Bắt buộc chuyển hướng đến `/change-password` |

---

## 🧪 Kiểm Thử & Đảm Bảo Chất Lượng (Quality Assurance)

Dự án áp dụng quy trình kiểm thử nghiêm ngặt đa tầng, đảm bảo 100% không có lỗi type hoặc gãy luồng nghiệp vụ:

```bash
# 1. Kiểm tra Typecheck toàn monorepo
pnpm typecheck

# 2. Kiểm tra Lint code chuẩn Clean Code
pnpm --filter web lint

# 3. Chạy Unit Tests Frontend
pnpm --filter web test:unit

# 4. Chạy Integration Tests Backend API (14 suites, 47 tests)
pnpm --filter api test

# 5. Chạy Playwright E2E Suite kiểm thử toàn diện luồng Auth (Trình duyệt Chromium thật)
node apps/web/e2e/run-e2e.mjs
```

### Kết quả kiểm thử tự động (Playwright E2E Results)
- ✅ **Test 1:** Chặn người dùng ẩn danh truy cập `/portal` & `/admin` và chuyển hướng an toàn về `/login`.
- ✅ **Test 2:** Xác thực biểu mẫu đăng nhập, từ chối thông tin sai và xử lý hiển thị lỗi backend chuẩn xác.
- ✅ **Test 3:** Đăng nhập Sinh viên thành công, duy trì phiên khi F5 tải lại trang, chặn 403 khi vào Admin và Đăng xuất sạch phiên.
- ✅ **Test 4:** Phát hiện tài khoản cần đổi mật khẩu lần đầu, chặn bypass URL, đổi mật khẩu thành công và kiểm tra RBAC Event Operator.
- ✅ **Test 5:** Khôi phục tự động qua Silent Refresh khi access token hết hạn (401), xử lý đơn luồng single-flight mutex và đăng xuất khi token bị thu hồi.

---

## 🔒 Tiêu Chuẩn Bảo Mật (Security Compliance)
- **OWASP Top 10 Aligned:** Phòng chống IDOR, XSS, CSRF và SQL Injection.
- **Argon2id:** Mã hóa mật khẩu một chiều với salt ngẫu nhiên chuẩn công nghiệp.
- **Single-Flight Refresh Mutex:** Đảm bảo tính duy nhất và bảo vệ chống replay attack đối với Refresh Token Rotation.
- **Zero Mock / 100% Real PostgreSQL:** Mọi thao tác đều ghi nhận và đối chiếu trực tiếp trên cơ sở dữ liệu thật.

---

## 📄 Bản quyền (License)
Dự án được phát triển phục vụ mục đích học thuật và chuyển đổi số khuôn viên trường học tại **FPT Polytechnic TP.HCM**.
Mọi quyền sở hữu trí tuệ thuộc về nhóm phát triển và FPT Polytechnic.
