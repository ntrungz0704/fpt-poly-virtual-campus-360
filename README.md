# FPT Polytechnic Virtual Campus 360° (Cơ sở QTSC Quận 12)

Nền tảng tham quan khuôn viên số 360°, bản đồ GIS khuôn viên và cổng thông tin sự kiện Open Day dành cho sinh viên, tân sinh viên và phụ huynh tại **FPT Polytechnic TP.HCM — Cơ sở Công viên Phần mềm Quang Trung (QTSC), Quận 12**.

- **Repository GitHub:** [`ntrungz0704/fpt-poly-virtual-campus-360`](https://github.com/ntrungz0704/fpt-poly-virtual-campus-360)
- **Kiến trúc workspace:** Monorepo `fpt-virtual-campus-monorepo` (`pnpm` workspace: `apps/*`, `packages/*`)

---

## 1. Trạng thái Giai đoạn Dự án (Milestone Status)

| Giai đoạn | Phạm vi | Trạng thái |
|---|---|---|
| **Phase 0 & Phase 1** | Chuẩn hóa monorepo, rà soát bảo mật, làm sạch nguyên mẫu MVP | **Đã hoàn tất & nghiệm thu** |
| **Phase 2A (`OD-01 → OD-10`)** | Khóa hợp đồng dữ liệu (`@fpt-campus/shared`) và tách phạm vi triển khai | **Đã khóa phạm vi** |
| **Phase 2A-1 — Database Bootstrap** | PostgreSQL 16 (Docker), Prisma 6 (`26` models, `17` enums), migrations, idempotent seed, kiểm thử toàn vẹn DB & file ảnh trên đĩa | **Đã nghiệm thu (`ACCEPTED` · 12/11/2026)** |
| **Phase 2A-2 & 2A-3** | Core Backend (`apps/api/` — NestJS), Auth/RBAC, Upload/StorageAdapter và kết nối dữ liệu thật lên `apps/web` | **Kế hoạch tiếp theo** *(hiện `apps/web` chạy với `DATA_SOURCE=mock`)* |
| **Phase 2B & 2C** | Admin Studio 3 vùng hoàn chỉnh, đo đạc tọa độ QTSC thực địa & chụp ảnh Panorama 360°×180° thực tế | **Chưa triển khai** |

> **Lưu ý hiện tại:** Ứng dụng web trong `apps/web` đang chạy độc lập ở chế độ `DATA_SOURCE=mock` để trình diễn giao diện và luồng người dùng, trong khi nền tảng PostgreSQL 16 + Prisma tại `prisma/` đã sẵn sàng phục vụ Backend `apps/api/` ở Phase 2A-2.

---

## 2. Tính năng Chính trên Ứng dụng Web (`apps/web`)

### Trải nghiệm Công khai & Nhập vai
- **Trang chủ giới thiệu (`/`)**: Hero 360°, tổng quan 3 lối khám phá khuôn viên, cụm không gian nổi bật và banner Open Day.
- **Tham quan Khuôn viên 360° (`/campus`)**: Trình xem không gian 360° dựng bằng `Three.js` kết hợp chọn tòa nhà, tầng và điểm tham quan (`TourNode`).
- **Bản đồ GIS Khuôn viên (`/map`)**: Bản đồ tương tác `Leaflet` (tọa độ `WGS84`), bộ lọc danh mục tòa nhà, tìm kiếm địa điểm, thẻ chi tiết tòa nhà và ước lượng khoảng cách đi bộ.
- **Danh mục Không gian & Địa điểm (`/locations`, `/locations/[slug]`)**: Lọc theo nhóm không gian (Không gian chung, Phòng Lab CNTT, Studio & Đồ họa), tòa nhà và mở nhanh sang tour 360° hoặc chi tiết phòng.
- **Sự kiện Open Day & Định hướng Ngành (`/events`, `/games`)**: Lịch trình Open Day, câu hỏi thường gặp và mini-game Quiz định hướng chuyên ngành (stateless).
- **Tin tức, Giới thiệu & Liên hệ (`/news`, `/news/[slug]`, `/about`, `/contact`)**: Thông tin tuyển sinh, bài viết khuôn viên và kênh hỗ trợ.

### Xác thực, Route Tương thích & Khu vực Quản trị (UI Preview)
- **Trạng thái Xác thực (`/login`)**: Màn hình thông báo cổng xác thực đang chờ triển khai Backend Auth ở `Phase 2A-2` (chưa có đăng nhập giả phía client và không có tính năng tự đăng ký cho khách).
- **Route `/portal` *(Ngoài phạm vi MVP Student/Parent Portal — Giữ tương thích)*:** **Student/Parent Portal KHÔNG thuộc phạm vi MVP.** Route `/portal` chỉ được giữ lại nguyên trạng trong mã nguồn để bảo toàn tập `19` routes tương thích (không xóa hoặc gắn redirect), hiện hiển thị thông báo chưa kích hoạt và điều hướng người dùng về trải nghiệm công khai `/campus` hoặc `/events`.
- **Khu vực Quản trị (`/admin`, `/admin/locations`, `/admin/events`, `/admin/media`, `/admin/virtual-tour`, `/admin/users`)**: Giao diện Admin UI Preview nội bộ (sẽ kết nối API & RBAC thực tế ở `Phase 2A-2` / `Phase 2A-3`; chưa mở công khai Internet khi chưa có Server Auth).

---

## 3. Công nghệ Sử dụng & Cấu trúc Monorepo

### Stack kỹ thuật
- **Frontend:** `Next.js 16.4.6` (App Router, Turbopack), `React 19.3.0`, `TypeScript 5`, `Tailwind CSS 4.3.3` (`@tailwindcss/turbopack`), `Motion 14.12.0`, `Leaflet 1.9.4`, `Three.js 0.187.0`.
- **Shared Contracts:** `@fpt-campus/shared` (`packages/shared/src/*.ts`).
- **Database Layer:** `PostgreSQL 16` (`postgres:16-alpine`), `Prisma 6.19.3`, `Argon2` (`argon2`), `pg`, `tsx`.
- **Package Manager:** `pnpm@10.33.2` (Monorepo workspace).

### Cấu trúc thư mục
```text
fpt-poly-virtual-campus-360/
├── apps/
│   └── web/                      # Ứng dụng Next.js 16 (App Router)
│       ├── public/               # Ảnh 2D địa điểm, 5 panorama placeholder, icons, manifest.json, robots.txt
│       ├── scripts/              # Script hỗ trợ chụp/kiểm tra UI (capture-pages.mjs)
│       └── src/
│           ├── app/              # 19 routes App Router (public, immersive, auth, portal, admin)
│           ├── components/       # UI components, 360 viewer, Leaflet GIS map
│           ├── data/             # Dữ liệu mẫu tĩnh cho chế độ DATA_SOURCE=mock
│           └── lib/              # Utilities & helpers frontend
├── packages/
│   └── shared/                   # Gói @fpt-campus/shared (api, auth, campus, common, events, location, tour)
├── prisma/
│   ├── migrations/               # Migration SQL chuẩn PostgreSQL 16 (20261111175635_init)
│   ├── schema.prisma             # Lược đồ Prisma (26 models, 17 enums)
│   ├── seed.ts                   # Script seed dữ liệu idempotent (kiểm tra checksum & Argon2id)
│   └── verify-db-integrity.ts    # Bộ kiểm tra toàn vẹn DB, quan hệ FK & asset media trên đĩa
├── samples/                      # Mẫu ảnh minh họa tham khảo phục vụ kiểm chứng kỹ thuật
├── docs/                         # Tài liệu kiến trúc, hợp đồng API/DB, UI & báo cáo nghiệm thu
├── docker-compose.yml            # Dịch vụ PostgreSQL 16 (container: fpt_virtual_campus_db)
├── .env.example                  # Mẫu biến môi trường (không chứa bí mật thật)
└── package.json                  # Scripts điều phối root monorepo
```

---

## 4. Hướng dẫn Cài đặt & Chạy Dự án

### Yêu cầu hệ thống (Prerequisites)
- **Node.js:** `>= 20.x`
- **pnpm:** `>= 10.x` (khớp `packageManager: pnpm@10.33.2`; có thể kích hoạt qua `corepack enable`)
- **Docker / Docker Desktop:** Bắt buộc nếu chạy PostgreSQL 16 cục bộ cho tầng Database (`Phase 2A-1`)

### Bước 1 — Clone mã nguồn & cài đặt thư viện
```bash
git clone https://github.com/ntrungz0704/fpt-poly-virtual-campus-360.git
cd fpt-poly-virtual-campus-360
pnpm install --frozen-lockfile
```

### Bước 2 — Thiết lập file môi trường (`.env`)
Sao chép từ mẫu `.env.example` (file `.env` đã được khai báo trong `.gitignore`, **tuyệt đối không** đưa lên Git):

- **Windows PowerShell:**
  ```powershell
  Copy-Item .env.example .env
  ```
- **Bash / macOS / Linux:**
  ```bash
  cp .env.example .env
  ```

Mở `.env` và cập nhật các giá trị phù hợp trên máy của bạn:

| Biến môi trường | Mục đích & Lưu ý cấu hình |
|---|---|
| `DATA_SOURCE` | Giữ `mock` để chạy giao diện `apps/web` độc lập ở giai đoạn hiện tại |
| `PORT` / `NEXT_PUBLIC_APP_URL` | Cổng và URL web frontend (mặc định `3000` / `http://localhost:3000`) |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` | Thông số PostgreSQL 16 trong `docker-compose.yml` (`POSTGRES_PASSWORD` **bắt buộc** khác rỗng) |
| `DATABASE_URL` | Chuỗi kết nối Prisma tới PostgreSQL (user/pass/port/db phải khớp với 4 biến `POSTGRES_*` ở trên) |
| `ADMIN_BOOTSTRAP_PASSWORD` | **Bắt buộc** nếu chạy `pnpm db:seed` khi chưa có tài khoản `admin`: tối thiểu **12 ký tự**, **không** bắt đầu bằng `CHANGE_ME_`, và không trùng mật khẩu mẫu yếu bị chặn |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Chuỗi ký JWT chuẩn bị cho `apps/api/` (Phase 2A-2) |
| `STORAGE_DRIVER`, `LOCAL_MEDIA_ROOT` | Cấu hình lưu trữ media cục bộ (`local`) hoặc S3 (`S3_*`) cho Backend |

---

### Bước 3A — Chạy nhanh Website (`apps/web`)
Nếu bạn chỉ muốn mở giao diện website (`DATA_SOURCE=mock`):

1. **Chế độ phát triển (Hot Reload):**
   ```bash
   pnpm dev
   ```
2. **Chế độ Production build & start:**
   ```bash
   pnpm build
   pnpm start
   ```
   *(Hoặc chạy trực tiếp web workspace khi đã build sẵn: `pnpm --filter web start`)*

Mở trình duyệt tại: **`http://localhost:3000`**

---

### Bước 3B — Khởi tạo & Kiểm thử PostgreSQL 16 + Prisma (`Phase 2A-1`)
Thực hiện theo đúng thứ tự sau để khởi chạy CSDL thật, nạp dữ liệu mẫu và xác minh toàn vẹn tệp ảnh:

1. **Khởi động PostgreSQL 16 qua Docker Compose:**
   ```bash
   docker compose up -d
   docker compose ps
   ```
   Đảm bảo container `fpt_virtual_campus_db` đạt trạng thái `Up (healthy)` ở cổng `5432`.

2. **Sinh Prisma Client & chạy Migration:**
   ```bash
   pnpm db:generate
   pnpm db:migrate:deploy
   pnpm db:status
   ```

3. **Nạp dữ liệu khởi tạo (Idempotent Seed):**
   *(Đảm bảo đã đặt `ADMIN_BOOTSTRAP_PASSWORD` hợp lệ `>= 12` ký tự trong `.env`)*
   ```bash
   pnpm db:seed
   ```
   > Có thể chạy lại `pnpm db:seed` nhiều lần an toàn; mật khẩu tài khoản `admin` đã tồn tại sẽ được giữ nguyên (`PRESERVED_EXISTING_ADMIN_PASSWORD`).

4. **Chạy bộ kiểm thử toàn vẹn DB & Asset Media trên đĩa:**
   ```bash
   pnpm db:test
   ```
   Kiểm tra đồng bộ `17` enums, `26` models, quan hệ khóa ngoại và đối chiếu thực tế kích thước/SHA-256 của 11 tệp ảnh trong `apps/web/public/` cùng các ca test âm tính (`AC-07-NEG`).

5. **Xem dữ liệu trực quan bằng Prisma Studio (tùy chọn):**
   ```bash
   pnpm db:studio
   ```

---

## 5. Bảng Tham chiếu Lệnh (`package.json`)

| Lệnh | Tác dụng |
|---|---|
| `pnpm dev` | Chạy Next.js dev server (`apps/web`) |
| `pnpm build` | Build `@fpt-campus/shared` và `apps/web` production |
| `pnpm start` | Chạy `apps/web` ở chế độ production (`next start`) |
| `pnpm typecheck` | Kiểm tra kiểu TypeScript trên `@fpt-campus/shared` và `apps/web` |
| `pnpm lint` | Chạy ESLint trên `apps/web` |
| `pnpm capture` | Chạy `apps/web/scripts/capture-pages.mjs` |
| `pnpm db:generate` | Sinh `@prisma/client` từ `prisma/schema.prisma` |
| `pnpm db:migrate:dev` | Tạo & áp dụng migration phát triển local |
| `pnpm db:migrate:deploy` | Áp dụng migration đã commit lên PostgreSQL |
| `pnpm db:seed` | Chạy `prisma/seed.ts` (idempotent seed) |
| `pnpm db:status` | Kiểm tra trạng thái migration Prisma |
| `pnpm db:studio` | Mở giao diện Prisma Studio |
| `pnpm db:test` | Chạy bộ kiểm thử toàn vẹn `prisma/verify-db-integrity.ts` |

---

## 6. Lưu ý Bảo mật & Nguồn gốc Dữ liệu

- **Quản lý bí mật:** Không bao giờ commit file `.env`, volume `postgres_data`, API key hoặc mật khẩu `ADMIN_BOOTSTRAP_PASSWORD` lên Git.
- **Nguồn gốc dữ liệu QTSC (`R-06`):** Tọa độ GPS, thông tin tòa nhà, phòng học và sự kiện Open Day trong `prisma/seed.ts` là **dữ liệu phát triển ban đầu** dựng từ nguyên mẫu thiết kế, cần được xác minh thực địa tại QTSC trước khi xuất bản chính thức (Phase 2C).
- **Trạng thái ảnh Panorama 360° (`D-02` / `R-03`):** Cả 5 tệp `PANORAMA_2_1` (`2048×1024`) trong dữ liệu seed hiện là **AI synthetic placeholder** (`is_preview_approved = false`), và 5 `TourNode` tương ứng được giữ ở trạng thái `DRAFT`. Cần thay bằng ảnh chụp 360°×180° thực tế trước khi go-live.

---

## 7. Tài liệu Kiến trúc & Kiểm toán (`docs/`)

- [Quyết định phạm vi MVP & Routes](docs/decisions/MVP_SCOPE_AND_ROUTE_DECISIONS.md)
- [Kiến trúc Xác thực Admin & Bảo mật](docs/architecture/ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md)
- [Kiến trúc Hệ thống Phase 2A](docs/phase-2a/PHASE_2A_SYSTEM_ARCHITECTURE.md)
- [Thiết kế Cơ sở dữ liệu Phase 2A](docs/phase-2a/PHASE_2A_DATABASE_DESIGN.md)
- [Đặc tả API Contract Phase 2A](docs/phase-2a/PHASE_2A_API_CONTRACT.md)
- [Quy trình xử lý Panorama 360°](docs/phase-2a/PHASE_2A_PANORAMA_WORKFLOW.md)
- [Lộ trình Triển khai Phase 2A](docs/phase-2a/PHASE_2A_IMPLEMENTATION_ROADMAP.md)
- [Hệ thống Thiết kế Giao diện (UI Design System)](docs/ui/UI_DESIGN_SYSTEM.md)
- [Báo cáo Chốt phạm vi Phase 2A & Cập nhật Trạng thái](docs/project-audit/PHASE_2A_SCOPE_FINALIZATION_REPORT.md)
- [Báo cáo Nghiệm thu Phase 2A-1](docs/project-audit/PHASE_2A_1_FINAL_ACCEPTANCE_REPORT.md)
- [Báo cáo Đối soát Tài liệu Hậu Phase 2A-1](docs/project-audit/POST_PHASE_2A_1_DOCUMENTATION_RECONCILIATION_REPORT.md)
