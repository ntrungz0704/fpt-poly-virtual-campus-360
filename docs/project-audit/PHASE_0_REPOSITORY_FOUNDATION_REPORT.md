# BÁO CÁO NGHIỆM THU PHASE 0 — REPOSITORY FOUNDATION & CLEANUP PREPARATION

**Ngày thực hiện:** 11/11/2026  
**Giai đoạn:** Phase 0 — Repository Foundation (Chuẩn hóa Git, `pnpm` Workspace, Tổ chức Tài liệu & Thiết kế Kiến trúc Bảo mật)  
**Trạng thái:** Đã hoàn tất phạm vi Phase 0 (chỉ chuẩn hóa hạ tầng repo & tài liệu — **0 tệp mã nguồn ứng dụng `apps/web/src/**` hoặc tài nguyên `apps/web/public/**` bị thay đổi**).

---

## 1. Danh sách Tệp đã Tạo mới, Chỉnh sửa, Di dời và Xóa

So với mốc Baseline Commit (`20f85ad78231bdd085abe603220a96a3ef27b70e`), tổng phạm vi thay đổi của Phase 0 chỉ tác động tới cấu hình workspace và kho tài liệu:

### 1.1. Tệp tạo mới ở Baseline Commit (`20f85ad78231bdd085abe603220a96a3ef27b70e`)
- [`.gitignore`](../../.gitignore) — Bổ sung bộ quy tắc ignore chuẩn monorepo ở thư mục gốc trước khi tạo baseline commit (`node_modules/`, `.pnpm-store/`, `.env`, `.env.*` trừ `!.env.example`, `*.pem`, `*.key`, `.next/`, `out/`, `dist/`, `build/`, `*.tsbuildinfo`, `next-env.d.ts`, `coverage/`, `tmp-*`, logs, file hệ điều hành).

### 1.2. Tệp tạo mới trong Phase 0
- [`package.json`](../../package.json) — File root workspace monorepo (`fpt-virtual-campus-monorepo@0.1.0`, `"packageManager": "pnpm@10.33.2"`, các script gốc `dev`, `build`, `start`, `lint`, `typecheck`, `capture`).
- [`pnpm-lock.yaml`](../../pnpm-lock.yaml) — Lockfile thống nhất toàn workspace cho `pnpm` (`lockfileVersion: '9.0'`, `147.683 B`).
- [`docs/architecture/ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md`](../architecture/ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md) — Kiến trúc xác thực Admin mục tiêu (Phương án 1 — Design-First), kiểm kê chi tiết các vị trí lộ credential/route thiếu bảo vệ, thiết kế Argon2id + Access/Refresh Token Rotation + CSRF/Origin defense + NestJS RBAC Guards.
- [`docs/decisions/MVP_SCOPE_AND_ROUTE_DECISIONS.md`](../decisions/MVP_SCOPE_AND_ROUTE_DECISIONS.md) — Nguồn chuẩn ghi nhận các quyết định MVP đã duyệt (360° Homepage tự xoay sau 3s, GIS + Floor Plan + Panorama, ẩn 3D WebGL, animation Desktop-only, quy ước 19 routes `/login`, `/games`, `/portal`, `/admin`, thứ tự Phase 0 → Phase 5).
- [`docs/decisions/NEXT_PHASE_PREPARATION_PLAN.md`](../decisions/NEXT_PHASE_PREPARATION_PLAN.md) — Kế hoạch chuẩn bị chi tiết phạm vi file, phụ thuộc, rủi ro và tiêu chí nghiệm thu cho Phase 1 & Phase 2 *(chưa viết code)*.
- [`docs/project-audit/PHASE_0_REPOSITORY_FOUNDATION_REPORT.md`](./PHASE_0_REPOSITORY_FOUNDATION_REPORT.md) — Báo cáo nghiệm thu Phase 0 (tài liệu này).

### 1.3. Tệp chỉnh sửa trong Phase 0
- [`apps/web/package.json`](../../apps/web/package.json) — Chỉ bổ sung script `"typecheck": "tsc --noEmit"` (giữ nguyên toàn bộ danh sách `dependencies` và `devDependencies`).
- [`packages/shared/package.json`](../../packages/shared/package.json) — Chỉ bổ sung script `"typecheck": "tsc --noEmit"` (giữ nguyên cấu hình gói).
- [`README.md`](../../README.md) — Cập nhật mô tả monorepo `pnpm`, thông tin QTSC Quận 12 và liên kết tới hệ thống tài liệu `docs/` mới.
- [`PROJECT_STATUS.md`](../../PROJECT_STATUS.md) — Bổ sung khung ghi chú dẫn nguồn hiện trạng mới nhất và cập nhật liên kết sang `docs/_archive/project-audit/*` cho bản phụ lục lịch sử 11:11 AM.
- [`docs/phase-2a/PHASE_2A_SYSTEM_ARCHITECTURE.md`](../phase-2a/PHASE_2A_SYSTEM_ARCHITECTURE.md) — Cập nhật liên kết tham chiếu `[06-database-audit.md]` trỏ đúng về [`../_archive/project-audit/06-database-audit.md`](../_archive/project-audit/06-database-audit.md).
- [`docs/_archive/project-audit/02-current-project-status.md`](../_archive/project-audit/02-current-project-status.md) — Thay đường dẫn `file:///e:/...` cứng trỏ tới `05-backend-audit.md` bằng đường dẫn tương đối `./05-backend-audit.md`.

### 1.4. Tệp di dời qua `git mv` (`43` tệp tài liệu & ảnh tham chiếu cũ)
- `docs/ui-roadmap/*.md` (bộ mới **5 tệp**) → `docs/ui/`:
  - `UI_DESIGN_SYSTEM.md`, `UI_IMPLEMENTATION_ROADMAP.md`, `UI_PAGE_BLUEPRINT.md`, `UI_ROUTE_MIGRATION_MAPPING.md`, `UI_UX_AUDIT.md`.
- `docs/ui-roadmap/*.md` (bản nháp cũ **4 tệp**) → `docs/_archive/ui-roadmap-drafts/`:
  - `DESIGN_SYSTEM_AND_BLUEPRINT.md`, `ROUTE_MIGRATION_MAPPING.md`, `UI_DESIGN_MAPPING.md`, `UI_FULL_INVENTORY.md`.
- `docs/*.md` (tài liệu Stitch đời đầu **7 tệp**) → `docs/_archive/legacy-stitch/`:
  - `ORIGINAL_DESIGN_SPEC.md`, `component-architecture.md`, `design-audit.md`, `design-system.md`, `migration-report.md`, `page-mapping.md`, `standardization-and-cleanup.md`.
- `docs/project-audit/01..14*.md` (hồ sơ kiểm toán lịch sử **14 tệp**) → `docs/_archive/project-audit/`:
  - `01-executive-summary.md` → `14-project-architecture.md`.
- `docs/stitch-references/*.png` (**13 tệp ảnh** Stitch UI) → `docs/_archive/stitch-references/`:
  - `fpt_polytechnic_virtual_campus_360_trang_ch.png`, `page_03_virtual_campus_360_exploration_mobile.png`, `page_04_*` (2 tệp), `page_05_*` (2 tệp), `page_06_*` (2 tệp), `page_07_fpt_polytechnic_open_day_desktop.png`, `page_09_*` (2 tệp), `page_10_*` (2 tệp).

### 1.5. Tệp đã xóa
- `apps/web/package-lock.json` — Đã gỡ qua `git rm apps/web/package-lock.json` **chỉ sau khi** hoàn tất tạo `pnpm-lock.yaml`, chạy `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint` và `pnpm build` thành công với `exit 0`.

### 1.6. Cam kết Bất biến Mã nguồn & Tài sản Công khai (`Phase 0`)
- Kiểm tra bằng `git diff --name-only 20f85ad78231bdd085abe603220a96a3ef27b70e -- apps/web/src apps/web/public` trả về **`0` tệp** (`SRC_PUBLIC_DIFF_COUNT=0`). Toàn bộ code giao diện, dữ liệu mẫu, CSS, favicon, ảnh 360° và route hiện hữu được giữ nguyên 100%.

---

## 2. Trạng thái Git Repository & Baseline Commit

- **Thư mục Git Root:** `E:\Virtual Campus FPT Poly\.git` (đã xác minh trước khởi tạo rằng thư mục cha `E:\.git` và thư mục con không có `.git` trùng lặp).
- **Nhánh mặc định:** `main`
- **Cấu hình Git cục bộ đã có:** `user.name = Ntrungz07`, `user.email = ntrungz0704@gmail.com` (`git 2.56.0.windows.4`).
- **Baseline Commit SHA (trạng thái nguyên bản trước mọi thay đổi Phase 0):**
  - `20f85ad78231bdd085abe603220a96a3ef27b70e` — `chore: initialize git repository and baseline snapshot before phase 0`
- **Kiểm soát tệp không theo dõi (Ignored / Untracked Check):**
  - Không có tệp `.env`, khóa riêng (`*.pem`, `*.key`), `node_modules/`, `.next/`, `dist/`, hay `tsconfig.tsbuildinfo` nào được commit vào Baseline hay Phase 0.
  - Thư mục build `packages/shared/dist/` (tạo ra khi chạy `pnpm build`) được `.gitignore` loại trừ sạch khỏi tracking (`git status`).

---

## 3. Quyết định Package Manager (`pnpm`) & Bằng chứng Kỹ thuật

- **Quyết định:** Chuẩn hóa toàn monorepo dùng **`pnpm`** (`pnpm@10.33.2`, Node.js `v22.23.4`) để đồng bộ với tệp [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml) (`packages: ['apps/*', 'packages/*']`) vốn đã tồn tại trong repo từ đầu và phục vụ mở rộng `apps/api` + `@fpt-campus/shared` từ Phase 2 trở đi.
- **Bằng chứng cấu hình & thay thế:**
  1. Root [`package.json`](../../package.json) khai báo `"packageManager": "pnpm@10.33.2"` và `"engines": { "node": ">=20.0.0", "pnpm": ">=10.0.0" }`.
  2. Toàn bộ lệnh root (`pnpm dev`, `pnpm build`, `pnpm start`, `pnpm lint`, `pnpm typecheck`, `pnpm capture`) chạy qua bộ lọc workspace `--filter`.
  3. Sinh mới [`pnpm-lock.yaml`](../../pnpm-lock.yaml) (`lockfileVersion: '9.0'`), giữ nguyên toàn bộ dải phiên bản phụ thuộc hiện tại của `apps/web/package.json` và `packages/shared/package.json` (không nâng cấp framework hay thư viện ngoài phạm vi).
  4. Đối soát các package cốt lõi đang cài đặt dưới `apps/web/node_modules` sau chuẩn hóa `pnpm`:
     - `next@16.4.6`, `react@19.3.0`, `react-dom@19.3.0`, `three@0.187.0`, `leaflet@1.9.4`, `motion@14.12.0`, `tailwindcss@4.3.3`, `@tailwindcss/turbopack@4.3.3`, `typescript@5.9.3`, `eslint@9.39.5`, `eslint-config-next@16.4.6`, `puppeteer@25.17.0`.
     - Toàn bộ `19/20` dependencies & devDependencies của `apps/web` giữ nguyên chính xác từng bản vá (`patch version`) như trước khi chuyển sang `pnpm`; riêng package chưa dùng `lucide-react` (`"^1.71.0"`) được `pnpm` giải quyết lên bản tương thích mới nhất trong dải semver là `1.72.0` (so với `1.71.0` trước đó; gói này sẽ được đề xuất gỡ ở Phase 1 vì có `0` import).
  5. Đã xóa `apps/web/package-lock.json` sau khi chứng minh toàn bộ kiểm tra `pnpm` PASS.

---

## 4. Kết quả Cài đặt Workspace (`pnpm install --frozen-lockfile`)

- **Kết quả thực thi:** `Command exited with code 0` — `Scope: all 3 workspace projects` (`root`, `apps/web`, `packages/shared`).
- **Liên kết Workspace Package:** Đã xác minh thư mục `packages/shared/node_modules` được khởi tạo hợp lệ (`SHARED_NM=True`).
- **Cảnh báo minh bạch từ `pnpm`:**
  - `pnpm install --frozen-lockfile` ghi nhận: `Ignored build scripts: puppeteer@25.17.0. Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.`
  - Nguyên nhân: `pnpm v10` mặc định chặn script cài đặt tự động của dependency (`puppeteer@25.17.0` chỉ dùng cho script QA nội bộ `pnpm capture`). Điều này **không ảnh hưởng** tới `pnpm typecheck`, `pnpm lint`, `pnpm build` hay `pnpm dev`; nếu sau này chạy `pnpm capture` trên máy chưa cache trình duyệt Puppeteer, có thể xử lý bằng `pnpm approve-builds` hoặc trỏ biến môi trường trình duyệt cục bộ.

---

## 5. Cấu trúc Kho Tài liệu `docs/` Sau khi Tổ chức Lại

```text
docs/
├── architecture/                       # Kiến trúc kỹ thuật cốt lõi (Phase 0+)
│   └── ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md
├── decisions/                          # Quyết định sản phẩm, route & kế hoạch duyệt từng giai đoạn
│   ├── MVP_SCOPE_AND_ROUTE_DECISIONS.md
│   └── NEXT_PHASE_PREPARATION_PLAN.md
├── phase-2a/                           # Đặc tả Backend, Database ERD, API Contract & Panorama Workflow
│   ├── PHASE_2A_API_CONTRACT.md
│   ├── PHASE_2A_DATABASE_DESIGN.md
│   ├── PHASE_2A_IMPLEMENTATION_ROADMAP.md
│   ├── PHASE_2A_PANORAMA_WORKFLOW.md
│   └── PHASE_2A_SYSTEM_ARCHITECTURE.md
├── project-audit/                      # Báo cáo kiểm toán hiện trạng & nghiệm thu từng Phase
│   ├── PHASE_0_REPOSITORY_FOUNDATION_REPORT.md
│   └── PROJECT_HEALTH_CHECK_AND_REPOSITORY_CLEANUP_AUDIT_2026-11-11.md
├── ui/                                 # Bộ UI Spec mới nhất để tham khảo tokens/layout
│   ├── UI_DESIGN_SYSTEM.md
│   ├── UI_IMPLEMENTATION_ROADMAP.md
│   ├── UI_PAGE_BLUEPRINT.md
│   ├── UI_ROUTE_MIGRATION_MAPPING.md
│   └── UI_UX_AUDIT.md
└── _archive/                           # Lưu trữ lịch sử nguyên vẹn (chỉ để đối chiếu quá khứ)
    ├── legacy-stitch/                  # 7 tài liệu Stitch đời đầu
    ├── project-audit/                  # 14 báo cáo audit mốc 11:11 AM (01..14)
    ├── stitch-references/              # 13 ảnh chụp UI Stitch tham chiếu
    └── ui-roadmap-drafts/              # 4 bản nháp UI roadmap trùng lặp đầu giờ
```

---

## 6. Kiểm tra & Cập nhật Liên kết Markdown

- Đã cập nhật toàn bộ các liên kết nội bộ bị ảnh hưởng sau di dời trong:
  - [`README.md`](../../README.md) (trỏ về `docs/decisions/`, `docs/architecture/`, `docs/phase-2a/`, `docs/ui/`, `docs/project-audit/` và `docs/_archive/`)
  - [`PROJECT_STATUS.md`](../../PROJECT_STATUS.md) (cập nhật 15+ liên kết sang `docs/_archive/project-audit/` và thêm liên kết tài liệu hiện hành)
  - [`docs/phase-2a/PHASE_2A_SYSTEM_ARCHITECTURE.md`](../phase-2a/PHASE_2A_SYSTEM_ARCHITECTURE.md) (`../_archive/project-audit/06-database-audit.md`)
  - [`docs/_archive/project-audit/02-current-project-status.md`](../_archive/project-audit/02-current-project-status.md) (`./05-backend-audit.md` thay cho đường dẫn tuyệt đối `file:///e:/...`)
- Đã chạy script kiểm tra toàn bộ **53** liên kết tương đối trên tất cả **44** tệp `.md` trong repo (sau khi tạo báo cáo này) — kết quả **`0` liên kết lỗi (`broken = 0`)**.

---

## 7. Trạng thái Đánh giá Bảo mật (Security Review Status)

- **Chưa sửa code ứng dụng trong Phase 0 (theo đúng Phương án 1 đã duyệt).**
- **Đã hoàn tất kiểm kê & tài liệu hóa toàn bộ dấu vết Auth / Secrets trong [`ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md`](../architecture/ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md):**
  - Ghi nhận mức rủi ro `CRITICAL` hiện hữu tại `apps/web/src/lib/prototype-auth.ts` (nhúng `username: "admin"`, plaintext `password: "Fpoly@2026"` và lưu phiên qua `window.sessionStorage`), cùng `6` trang `/admin/*` đang mở không có guard.
  - Xác nhận `.env` thật không tồn tại trên đĩa và không bị đưa vào Git; `.env.example` và `docker-compose.yml` chỉ là mẫu dev cục bộ (đã cảnh báo không tái sử dụng chuỗi mẫu ở Staging/Production).
  - Xác nhận **không dựng cơ chế session/cookie giả** bằng `middleware.ts` ở Frontend; kiến trúc Auth thật (`Argon2id + HttpOnly Refresh Rotation + In-Memory JWT + RBAC NestJS Guards`) đã sẵn sàng cho Phase 3.

---

## 8. Kết quả Chạy Kiểm tra Build / Typecheck / Lint Thực tế

Toàn bộ lệnh dưới đây được chạy qua `pnpm` từ thư mục gốc `E:\Virtual Campus FPT Poly` **sau khi xóa `apps/web/package-lock.json` và trước/sau khi hoàn thiện Phase 0**:

| Kiểm tra | Lệnh thực thi | Kết quả (`Exit Code`) | Phạm vi & Ghi chú thực tế |
|---|---|---:|---|
| Cài đặt workspace khóa phiên bản | `pnpm install --frozen-lockfile` | **PASS (`0`)** | 3/3 workspace projects (`root`, `apps/web`, `packages/shared`), `pnpm-lock.yaml` khớp sạch; có warning `Ignored build scripts: puppeteer@25.17.0` |
| Kiểm tra kiểu TypeScript | `pnpm typecheck` | **PASS (`0`)** | Chạy `tsc --noEmit` ở cả `@fpt-campus/shared` và `web`; `0` lỗi type |
| Kiểm tra quy tắc ESLint | `pnpm lint` | **PASS (`0`)** | Chạy `eslint` trên `apps/web` *(giữ nguyên cấu hình `eslint.config.mjs` gốc, chưa thay đổi rule nào ở Phase 0)* |
| Production Build | `pnpm build` | **PASS (`0`)** | Build `@fpt-campus/shared` (`tsc`) → `web` (`Next.js 16.4.6 Turbopack`); tạo đủ 28 trang tĩnh/SSG & toàn bộ 19 routes (`/`, `/about`, `/campus`, `/map`, `/locations`, `/locations/[slug]`, `/events`, `/news`, `/news/[slug]`, `/contact`, `/games`, `/login`, `/portal`, `/admin`, `/admin/*`) |
| Kiểm tra bất biến `src/` & `public/` | `git diff --name-only 20f85ad... -- apps/web/src apps/web/public` | **PASS (`0` files)** | Không có bất kỳ chỉnh sửa nào trên code UI, dữ liệu hay tài sản media |

*(Ghi chú: Script chụp ảnh Puppeteer `pnpm capture` chưa cần chạy lại trong Phase 0 vì không có dòng mã nguồn UI, CSS hay asset hình ảnh nào bị thay đổi.)*

---

## 9. Các Vấn đề Còn Tồn đọng (Giữ Nguyên Chờ Phase 1 → Phase 5)

Toàn bộ danh sách dưới đây **cố ý chưa chạm tới trong Phase 0** để giữ ranh giới kiểm soát sạch:

1. **Bảo mật Prototype (`CRITICAL — Phase 1 + Phase 3`):**
   - `apps/web/src/lib/prototype-auth.ts` vẫn chứa `ADMIN_ACCOUNT_CONFIG` (`Fpoly@2026`); `/admin/*` vẫn chưa có server guard.
2. **Xung đột Nội dung MVP `/portal` & Open Day QR (`HIGH — Phase 1`):**
   - `8+` thành phần (`OpenDayBanner.tsx`, `about/page.tsx`, `events/page.tsx`, `EventPillarGrid.tsx`, `OpenDayScheduleTimeline.tsx`, `news-items.ts`, `QuizLeaderboard.tsx`, `StateFeedback.tsx`, `portal/page.tsx`, `campus-data.ts`) vẫn còn chuỗi/CTA trỏ `/login?next=/portal` hoặc nhắc nhận mật khẩu tạm qua Zalo/QR.
3. **Dữ liệu Test & Tài sản/Cấu hình Dư thừa (`MEDIUM-HIGH — Phase 1`):**
   - Hai ảnh test `tang-1.jpg`, `tang-2.jpg` và hotspot `"Test Ảnh Thực tế Tầng 1"` trong `campus-data.ts` (`L529-535`, `L714-799`, `L1066-1085`); ảnh mồ côi `fpoly-campus-aerial.jpg`; gói chưa dùng `lucide-react`; `next.config.ts` còn `remotePatterns` cũ; `manifest.json` còn chữ `"bản đồ 3D"`; `/sitemap.xml` hiện trả `404` dù `robots.txt` có khai báo.
4. **Hợp đồng Dữ liệu & Kiến trúc Đa tầng (`Phase 2`):**
   - `packages/shared/src/index.ts` vẫn là bản nháp cũ (`0` consumer); `campus-data.ts` chưa có mô hình `Building → Floor → FloorPlan → Location (1–N) → TourNode → Hotspot & TourEdge`.
5. **Backend, Database, Storage & Admin Campus Studio (`Phase 3 → Phase 5`):**
   - `apps/api/`, Prisma schema thật, PostgreSQL + Redis + MinIO, Upload bản vẽ mặt bằng (`PNG/JPG/SVG/PDF`) và kiểm thử tự động Vitest/Playwright vẫn chưa được khởi tạo (`0%`).

---

## 10. Các Điểm Cần Chủ Dự án Phê duyệt Tiếp theo Trước khi Mở Phase 1

Trước khi chuyển sang **Phase 1: Security & MVP Cleanup**, đề nghị Chủ dự án xác nhận 3 điểm sau:

1. **Cách xử lý màn hình `/login` & `/admin` trong Phase 1 (khi chưa có Backend Phase 3):**
   - Xác nhận gỡ bỏ hoàn toàn `Fpoly@2026` khỏi `prototype-auth.ts` và đặt `/login` ở trạng thái biểu mẫu nội bộ đang chờ kết nối Backend Auth (không còn nút/mật khẩu hardcode trong client bundle), đồng thời giữ quyền xem preview UI cục bộ của `/admin/*` kèm banner cảnh báo `"CHẾ ĐỘ PROTOTYPE NỘI BỘ — CHƯA KẾT NỐI AUTH SERVER"` theo đúng Phương án 1.
2. **Phạm vi Dọn Nội dung MVP & Tài sản Test (`Phase 1`):**
   - Xác nhận sửa copy ở `OpenDayBanner`, `/about`, `/events`, `/news`, `/games`, `StateFeedback`, `/portal` (vẫn giữ nguyên file route `/portal`, chỉ bỏ mọi lời mời khách đăng nhập `/login?next=/portal`); và đồng ý gỡ `tang-1.jpg`/`tang-2.jpg` khỏi `TOUR_SCENES` công khai, xóa `fpoly-campus-aerial.jpg`, gỡ `lucide-react`, dọn `next.config.ts`, `manifest.json` và bổ sung `sitemap.ts` (hoặc gỡ dòng `Sitemap` khỏi `robots.txt`).
3. **Thứ tự Khởi tạo Thiết kế (`Phase 2`):**
   - Xác nhận hoàn thành Phase 1 kiểm chứng sạch 19 routes rồi mới bước sang **Phase 2: Shared Architecture & Data Contract (`@fpt-campus/shared`)** trước khi dựng Backend/Database ở Phase 3.
