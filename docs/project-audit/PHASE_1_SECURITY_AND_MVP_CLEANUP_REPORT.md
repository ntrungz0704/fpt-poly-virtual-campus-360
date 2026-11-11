# BÁO CÁO NGHIỆM THU PHASE 1 — SECURITY & MVP CLEANUP

**Ngày hoàn tất:** 11/11/2026  
**Nhánh Git:** `main`  
**Baseline trước Phase 1 (Phase 0 Commit):** `b4f1a94554cc7b85032167bad05c8a36404d7e3a` *(Baseline ban đầu trước Phase 0: `20f85ad78231bdd085abe603220a96a3ef27b70e`)*  
**Trạng thái kiểm tra:** **PASS toàn bộ kiểm định Phase 1 — Sẵn sàng chốt commit & chờ phê duyệt Phase 2**

> [!CAUTION]
> **Ranh giới bảo mật & triển khai bắt buộc:**
> - Khu vực `/admin/*` hiện vẫn là **Admin Preview nội bộ chưa có Authentication & Server Guard**. Banner cảnh báo (`role="alert"`) trên `/admin/*` chỉ mang tính thông tin và **không phải cơ chế bảo mật** — **không triển khai `/admin/*` lên Internet công khai** cho đến khi Auth Backend (Phase 3) hoàn tất.
> - Nếu mật khẩu mẫu `Fpoly@2026` từng được sử dụng trên bất kỳ tài khoản, máy chủ hoặc công cụ thử nghiệm thực tế nào ngoài prototype, cần **đổi mật khẩu ngay lập tức**.
> - Đúng theo chỉ đạo nghiệm thu Phase 1: chưa triển khai PostgreSQL, Prisma, `apps/api` (NestJS), Auth Backend hay tạo `/sitemap.xml` trong đợt này.

---

## 1. Điều tra sự cố `pnpm` & Khắc phục môi trường an toàn

### 1.1. Nguyên nhân gốc được xác minh
Quá trình kiểm tra thực tế trên workspace xác nhận lỗi không xuất phát từ `lucide-react` hay Git repo (`git fsck --no-dangling` đạt `exit 0`; `Get-Volume -DriveLetter E` báo ổ `NTFS / Healthy / OK`), mà do **hỏng dữ liệu package cục bộ tại shared store `E:\.pnpm-store\v10` và các thư mục `node_modules` hardlink trong workspace**:
1. `pnpm --filter web remove lucide-react` trước đó thất bại với `ERR_PNPM_READ_FROM_STORE: Unexpected token ' ', "\t i D k"... is not valid JSON`.
2. `pnpm store status` trên store cũ báo `ENOENT` tại tệp index của `@babel/helper-module-imports`.
3. `pnpm install --frozen-lockfile` báo `ERR_PNPM_BAD_PACKAGE_JSON` trong `node_modules/.pnpm/motion@...` (`tslib/package.json` chứa chuỗi hash thay vì JSON hợp lệ).
4. `pnpm typecheck` trên `apps/web` thất bại hàng loạt với `TS1490: File appears to be binary` trong `node_modules/.pnpm/@types+three@0.187.0/.../*.d.ts`.
5. `pnpm lint` thất bại với `SyntaxError: Unexpected token '}'` trong `eslint/lib/linter/apply-disable-directives.js` (nội dung file bị lẫn mã rút gọn khác).
6. `pnpm build` thất bại với `ERR_INVALID_PACKAGE_CONFIG` ở `@next/env/package.json`.

### 1.2. Phạm vi cô lập & Biện pháp xử lý an toàn
Kiểm tra cây thư mục gốc ổ `E:\` phát hiện nhiều dự án khác đang tồn tại song song (`sachplus-smart-laundry`, `SellerMargin`, `Tham-quan-FPOLY`, `demo`, `my-project`, `FCO`) cùng các thư mục khôi phục hệ thống `found.000`–`found.099`. Vì `E:\.pnpm-store` nằm ngoài workspace và có khả năng được dùng chung:
- **Không xóa `E:\.pnpm-store`:** Giữ nguyên hoàn toàn thư mục store ngoài workspace để không làm ảnh hưởng các dự án khác.
- **Chỉ xóa `node_modules` thuộc workspace Virtual Campus:** Xóa sạch `node_modules`, `apps/web/node_modules`, và `packages/shared/node_modules`.
- **Cấu hình store riêng cho dự án:** Tạo tệp cấu hình gốc [`.npmrc`](../../.npmrc) với `store-dir=.pnpm-store` (thư mục `.pnpm-store/` và `**/.pnpm-store/` đã được khai báo trong [`.gitignore`](../../.gitignore)).
- **Cài đặt sạch & gỡ `lucide-react`:** Chạy cài đặt lại toàn bộ từ npm registry vào `E:\Virtual Campus FPT Poly\.pnpm-store\v10` và gỡ `"lucide-react": "^1.71.0"` bằng lệnh `pnpm --filter web remove lucide-react` (`393` packages, `Done in 12m 16.3s` dùng `pnpm v10.33.2`; lưu ý cảnh báo bình thường `Ignored build scripts: puppeteer@25.17.0`).
- **Xác minh lại cấu hình store:**
  - `pnpm store path` (chạy tại root và trong `apps/web`) đều trỏ về `E:\Virtual Campus FPT Poly\.pnpm-store\v10`.
  - `pnpm store status` -> `Packages in the store are untouched` (`exit 0`).
  - `pnpm install --frozen-lockfile` -> `Lockfile is up to date, resolution step is skipped / Already up to date / Done in 1.1s` (`exit 0`).

---

## 2. Danh mục Thay đổi Đã thực hiện trong Phase 1

### 2.1. Hạng mục A — Loại bỏ Credential Client-side, Fake Session & Cảnh báo `/admin/*`

| Hạng mục | Tệp thực hiện | Thay đổi cụ thể |
|---|---|---|
| Xóa cấu hình & giả lập Auth | `apps/web/src/lib/prototype-auth.ts` *(đã xóa)* | **Đã xóa (`git rm`)**: Gỡ bỏ `ADMIN_ACCOUNT_CONFIG`, mật khẩu plaintext `Fpoly@2026`, `authenticateAdminAccount`, `SESSION_KEY = "fpoly_vc_admin_session_v1"`, và toàn bộ giả lập `sessionStorage`. |
| Chuyển `/login` thành trạng thái chờ Auth | [`apps/web/src/app/(auth)/login/page.tsx`](../../apps/web/src/app/%28auth%29/login/page.tsx) | Thay form đăng nhập/tài khoản demo/luồng đổi mật khẩu giả bằng màn hình thông báo trung thực **"Hệ thống Đăng nhập & Xác thực chưa được triển khai"** (chờ Backend Phase 3), nêu rõ khách tham quan tự do không cần tài khoản và không mở tự đăng ký công khai. Không có `<input type="password">`. |
| Gắn banner Admin Preview nội bộ | [`apps/web/src/app/admin/layout.tsx`](../../apps/web/src/app/admin/layout.tsx) | Gỡ bỏ kiểm tra/đăng xuất `sessionStorage` từ `prototype-auth`; giữ nguyên giao diện Preview `/admin/*`; bổ sung banner `role="alert"` cố định cảnh báo rõ đây là **Admin Preview nội bộ · Chưa có Authentication & Server Guard**, không triển khai public Internet và không phải lớp bảo mật. |
| Làm sạch route dự phòng `/portal` | [`apps/web/src/app/(portal)/portal/page.tsx`](../../apps/web/src/app/%28portal%29/portal/page.tsx)<br>[`apps/web/src/app/(portal)/layout.tsx`](../../apps/web/src/app/%28portal%29/layout.tsx)<br>[`apps/web/src/components/portal/portal-types.ts`](../../apps/web/src/components/portal/portal-types.ts)<br>[`apps/web/src/components/portal/DigitalPassCard.tsx`](../../apps/web/src/components/portal/DigitalPassCard.tsx)<br>[`apps/web/src/components/portal/StudentProfileHeader.tsx`](../../apps/web/src/components/portal/StudentProfileHeader.tsx) | Giữ nguyên route `/portal` (không xóa, không redirect), gỡ bỏ mọi phụ thuộc `sessionStorage` và CTA `/login?next=/portal`; hiển thị thông báo rõ Student/Parent Portal nằm ngoài phạm vi MVP và gợi ý quay lại `/campus` hoặc `/events`. Tạo type `PortalParticipantPreview` thay thế dependency vào `prototype-auth`. |

### 2.2. Hạng mục B — Làm sạch Copy QR/Zalo/Mật khẩu tạm & Gỡ Dữ liệu/Ảnh Test Công khai

| Hạng mục | Tệp thực hiện | Thay đổi cụ thể |
|---|---|---|
| Dỡ copy mời `/login?next=/portal`, QR, Zalo, mật khẩu tạm | [`OpenDayBanner.tsx`](../../apps/web/src/components/home/OpenDayBanner.tsx), [`about/page.tsx`](../../apps/web/src/app/%28public%29/about/page.tsx), [`events/page.tsx`](../../apps/web/src/app/%28public%29/events/page.tsx), [`EventPillarGrid.tsx`](../../apps/web/src/components/events/EventPillarGrid.tsx), [`games/page.tsx`](../../apps/web/src/app/%28public%29/games/page.tsx), [`news-items.ts`](../../apps/web/src/components/news/news-items.ts), [`QuizLeaderboard.tsx`](../../apps/web/src/components/quiz/QuizLeaderboard.tsx), [`StateFeedback.tsx`](../../apps/web/src/components/ui/StateFeedback.tsx) | Loại bỏ toàn bộ chuỗi dẫn hướng sang `/login?next=/portal`, `"Check-in QR"`, `"Zalo"`, `"mật khẩu tạm"`; cập nhật mô tả phản ánh đúng trải nghiệm công khai không cần đăng nhập trên `/`, `/campus`, `/map`, `/events`. |
| Làm sạch Admin Preview & Metrics | [`admin/page.tsx`](../../apps/web/src/app/admin/page.tsx), [`admin/events/page.tsx`](../../apps/web/src/app/admin/events/page.tsx), [`admin/users/page.tsx`](../../apps/web/src/app/admin/users/page.tsx), [`AdminDashboardMetrics.tsx`](../../apps/web/src/components/admin/AdminDashboardMetrics.tsx) | Đồng bộ số đếm scene hiển thị (5 góc nhìn công khai), gỡ các câu mô tả QR/Zalo/mật khẩu tạm cũ và cập nhật nhãn bản ghi Preview ở trạng thái chờ kích hoạt / lời mời Email-SMS. |
| Xóa 2 test scene & test images khỏi public | [`apps/web/src/data/campus-data.ts`](../../apps/web/src/data/campus-data.ts)<br>`apps/web/public/images/panoramas/tang-1.jpg` *(đã xóa bằng `git rm`)*<br>`apps/web/public/images/panoramas/tang-2.jpg` *(đã xóa bằng `git rm`)*<br>`samples/panoramas/tang-1.jpg`, `tang-2.jpg` *(lưu bản mẫu ngoài `public/`)* | Gỡ `hs-to-tang1-test`, `tang-1-sanh-ong-vang`, `tang-2-dich-vu-sv`, `med-09`, `med-10`, và làm sạch copy trong `loc-sanh-innovation`, `od-01`, `od-05`, `faq-2`, `faq-3`, `INITIAL_ADMIN_USERS` (chỉ giữ 1 bản ghi mẫu `admin`). |

### 2.3. Hạng mục C — Dependency, Cấu hình & Đồng bộ Tài liệu Kiến trúc

| Hạng mục | Tệp thực hiện | Thay đổi cụ thể |
|---|---|---|
| Dependency & Workspace Store | [`apps/web/package.json`](../../apps/web/package.json), [`pnpm-lock.yaml`](../../pnpm-lock.yaml), [`.npmrc`](../../.npmrc) | Gỡ `"lucide-react"` (0 lượt import), khóa `store-dir=.pnpm-store` trong `.npmrc` để tách biệt khỏi store dùng chung ngoài workspace. |
| Cấu hình Next.js & PWA | [`apps/web/next.config.ts`](../../apps/web/next.config.ts), [`apps/web/public/manifest.json`](../../apps/web/public/manifest.json) | Gỡ `images.remotePatterns` (`lh3.googleusercontent.com`, `images.unsplash.com`) không còn dùng; cập nhật mô tả `manifest.json` từ `"bản đồ 3D tương tác"` sang GIS + 360°. |
| Đồng bộ 7 tài liệu Yêu cầu & Phase 2A *(chỉ cập nhật docs, chưa code Backend)* | [`ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md`](../architecture/ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md), [`MVP_SCOPE_AND_ROUTE_DECISIONS.md`](../decisions/MVP_SCOPE_AND_ROUTE_DECISIONS.md), [`NEXT_PHASE_PREPARATION_PLAN.md`](../decisions/NEXT_PHASE_PREPARATION_PLAN.md), [`PHASE_2A_SYSTEM_ARCHITECTURE.md`](../phase-2a/PHASE_2A_SYSTEM_ARCHITECTURE.md), [`PHASE_2A_DATABASE_DESIGN.md`](../phase-2a/PHASE_2A_DATABASE_DESIGN.md), [`PHASE_2A_API_CONTRACT.md`](../phase-2a/PHASE_2A_API_CONTRACT.md), [`PHASE_2A_IMPLEMENTATION_ROADMAP.md`](../phase-2a/PHASE_2A_IMPLEMENTATION_ROADMAP.md) | Chuẩn hóa 3 nhóm người dùng (`ADMIN`/`STAFF`, `STUDENT`/`PARENT` Open Day hỗ trợ nhiều sự kiện, Khách tham quan tự do không cần tài khoản); tách `UserType`/`RBAC`/`AccountStatus`/`ActivationStatus`/`ProvisioningMethod`; bổ sung Dual Provisioning (`ADMIN_DIRECT` & `EMAIL_SMS_INVITATION`, không mật khẩu dùng chung/plaintext); Import `.xlsx`/`.csv` 5 bước không lưu file/tên/đường dẫn gốc; xác nhận Student/Parent Portal (`/portal`) vẫn ngoài MVP. |

### 2.4. Phạm vi Được bảo toàn nguyên vẹn
- **Giữ nguyên toàn bộ 19 routes (`page.tsx`)** trong `apps/web/src/app/` (không xóa, đổi tên hay redirect).
- **Giữ `/games`** tương thích, vẫn ẩn khỏi menu chính (`PublicHeader`).
- **Giữ `/portal`** và `components/portal/` chờ quyết định chính thức ở giai đoạn sau.
- **Giữ `apps/web/public/images/fpoly-campus-aerial.jpg`**, giữ `apps/web/public/robots.txt`, chưa tự tạo `/sitemap.xml`, và chưa triển khai PostgreSQL/Prisma/NestJS/API.

---

## 3. Kết quả Kiểm định Thực tế Sau Chỉnh sửa Cuối cùng

### 3.1. Kiểm tra Package, Build, TypeScript, ESLint & Scan Mã nguồn / Bundle

| Hạng mục kiểm tra | Lệnh thực thi | Kết quả | Chi tiết ghi nhận |
|---|---|---|---|
| Cài đặt theo lockfile | `pnpm install --frozen-lockfile` | **PASS (`exit 0`)** | 3 workspace projects, lockfile khớp, dùng `.pnpm-store\v10`, hoàn tất `1.1s` |
| Tính toàn vẹn store | `pnpm store status` | **PASS (`exit 0`)** | `Packages in the store are untouched` |
| TypeScript Workspace | `pnpm typecheck` | **PASS (`exit 0`)** | `@fpt-campus/shared` & `web` đều `tsc --noEmit` sạch lỗi |
| ESLint Web | `pnpm lint` | **PASS (`exit 0`)** | `eslint` trên `apps/web` không lỗi |
| Production Build | `pnpm build` | **PASS (`exit 0`)** | `@fpt-campus/shared` build sạch; Next.js `16.4.6` (Turbopack) biên dịch trong `12.2s`, tạo `28/28` static pages |
| Quét source & public | `rg -n "tang-1\|tang-2\|Fpoly@2026\|..." apps/web/src apps/web/public apps/web/next.config.ts` | **PASS (`0` match)** | `SRC_SCAN_EXIT=1` (0 kết quả trùng) |
| Quét compiled JS chunks | `rg -n --no-ignore -i "..." apps/web/.next/static/chunks` | **PASS (`0` match)** | Kiểm tra trên toàn bộ `33` file chunk đã build (`CHUNK_SCAN_EXIT=1`, `EXTRA_SCAN=1`) |

### 3.2. Kiểm tra Runtime Đủ 19 Routes (Production Build & Dev Server)
Thực thi probe HTTP trực tiếp tới cả bản dựng Production (`next start -p 3005`, trước khi tắt tiến trình test tạm) và bản Dev đang phục vụ người dùng tại `http://localhost:3000`:

| # | Route (`page.tsx`) | Loại Next.js Build | Production `:3005` HTTP | Live Dev `:3000` HTTP | Kiểm tra nội dung |
|---:|---|---|---:|---:|---|
| 1 | `/` | `Static` (`○`) | `200` | `200` | Không chứa `next=/portal`, QR, mật khẩu tạm |
| 2 | `/campus` | `Dynamic` (`ƒ`) | `200` | `200` | Không chứa `tang-1-sanh-ong-vang`, `tang-2-dich-vu-sv`, `hs-to-tang1-test` |
| 3 | `/map` | `Dynamic` (`ƒ`) | `200` | `200` | Hoạt động bình thường |
| 4 | `/locations` | `Dynamic` (`ƒ`) | `200` | `200` | Hoạt động bình thường |
| 5 | `/locations/[slug]` (`/locations/sanh-innovation`, `/locations/lab-lap-trinh-t301`) | `SSG` (`●`) | `200` | `200` | Hoạt động bình thường |
| 6 | `/events` | `Static` (`○`) | `200` | `200` | Không chứa QR / Zalo / mật khẩu tạm |
| 7 | `/news` | `Static` (`○`) | `200` | `200` | Hoạt động bình thường |
| 8 | `/news/[slug]` (`/news/huong-dan-tham-quan-qtsc-360`) | `SSG` (`●`) | `200` | `200` | Hoạt động bình thường |
| 9 | `/about` | `Static` (`○`) | `200` | `200` | Hoạt động bình thường |
| 10 | `/contact` | `Static` (`○`) | `200` | `200` | Hoạt động bình thường |
| 11 | `/games` | `Static` (`○`) | `200` | `200` | Giữ tương thích, không ở menu chính |
| 12 | `/login` | `Static` (`○`) | `200` | `200` | Có thông báo chờ Auth Phase 3; không có `<input type="password">` |
| 13 | `/portal` | `Static` (`○`) | `200` | `200` | Không dẫn `/login?next=/portal` |
| 14 | `/admin` | `Static` (`○`) | `200` | `200` | Có banner `role="alert"` cảnh báo Preview nội bộ |
| 15 | `/admin/locations` | `Static` (`○`) | `200` | `200` | Có banner cảnh báo Preview nội bộ |
| 16 | `/admin/events` | `Static` (`○`) | `200` | `200` | Có banner cảnh báo Preview nội bộ |
| 17 | `/admin/users` | `Static` (`○`) | `200` | `200` | Có banner `role="alert"` cảnh báo Preview nội bộ |
| 18 | `/admin/media` | `Static` (`○`) | `200` | `200` | Có banner cảnh báo Preview nội bộ |
| 19 | `/admin/virtual-tour` | `Static` (`○`) | `200` | `200` | Có banner cảnh báo Preview nội bộ |

Kiểm tra các endpoint phụ trên Production `:3005`:
- `/robots.txt` → `200`
- `/manifest.json` → `200`
- `/sitemap.xml` → **`404`** *(xác nhận đúng hiện trạng chưa triển khai)*
- `/khong-ton-tai-404` → `404`

---

## 4. Kết luận Tài sản Tồn đọng & Đề xuất Chờ Phê duyệt

### 4.1. Về `apps/web/public/images/fpoly-campus-aerial.jpg`
- **Hiện trạng xác minh:** Tệp tồn tại trên đĩa (`521.451 bytes` ≈ `509,2 KB`, kích thước được ghi nhận ở báo cáo kiểm toán trước là `1024×576`). Kết quả grep toàn workspace cho thấy **0 tham chiếu đang chạy** trong `apps/web/src/**`; chỉ có tài liệu thiết kế cũ (`docs/ui/UI_PAGE_BLUEPRINT.md`) từng nhắc như tùy chọn poster dự phòng.
- **Đề xuất:**
  - *Phương án 1 (Khuyến nghị nếu không dùng lại):* Xóa hoặc di chuyển sang `samples/` ngoài `public/` để giảm ~509 KB dung lượng đóng gói web.
  - *Phương án 2:* Nếu giữ làm ảnh poster dự phòng lúc tải ảnh 360° hoặc ảnh chia sẻ Open Graph, gắn vào nơi sử dụng cụ thể trong UI.

### 4.2. Về lỗi `HTTP 404` của `/sitemap.xml`
- **Nguyên nhân:** [`apps/web/public/robots.txt`](../../apps/web/public/robots.txt) dòng 6 khai báo `Sitemap: https://virtualcampus.poly.edu.vn/sitemap.xml`, nhưng trong mã nguồn **chưa tồn tại `apps/web/src/app/sitemap.ts` lẫn `apps/web/public/sitemap.xml`** nên yêu cầu `/sitemap.xml` trả về `404`. *(Lưu ý phụ: `robots.txt` hiện `Disallow: /admin` và `Disallow: /portal`, chưa chặn `/login`; đồng thời tên miền trong `robots.txt` là `virtualcampus.poly.edu.vn`, khác với biến mẫu `S3_PUBLIC_DOMAIN=https://media.virtualcampus.polytechnic.edu.vn` trong `.env.example`.)*
- **Danh sách URL Public MVP đề xuất đưa vào `sitemap.ts`:**
  - Tuyến tĩnh public: `/`, `/campus`, `/map`, `/locations`, `/events`, `/news`, `/about`, `/contact` *(tùy chọn giữ/bỏ `/games` vì là route phụ ẩn khỏi menu chính)*.
  - Tuyến động public SSG hiện tại: 6 địa điểm `/locations/{sanh-innovation, thu-vien-so-t2, hoi-truong-innovation, lab-lap-trinh-t301, studio-imac-f402, khu-the-thao-qtsc}` + 3 bài hướng dẫn `/news/{huong-dan-tham-quan-qtsc-360, lich-trinh-open-day-tai-cvpm-quang-trung, kham-pha-thu-vien-so-va-lab-thuc-hanh}`.
  - **Loại trừ khỏi sitemap:** `/admin`, `/admin/*`, `/portal`, `/login`.
- **Đề xuất:** Bổ sung `apps/web/src/app/sitemap.ts` (App Router Metadata API tự sinh động theo danh sách tòa nhà/địa điểm/tin tức) + rà soát đồng bộ domain chuẩn với `NEXT_PUBLIC_APP_URL` và thêm `Disallow: /login` trong `robots.txt`.

### 4.3. Vệ sinh Tài liệu Lịch sử & Chi tiết Nhỏ
- Tệp [`PROJECT_STATUS.md`](../../PROJECT_STATUS.md) ở thư mục gốc hiện vẫn là bản ghi lịch sử 11:11 AM (nội dung phần bảng dưới còn vết lỗi hiển thị ký tự và phản ánh trạng thái build lỗi cũ) dù đã có ghi chú dẫn sang `docs/project-audit/`. Nên chuyển vào `docs/_archive/project-audit/` hoặc cập nhật bản tóm tắt chuẩn ở đợt tài liệu kế tiếp.
- Trong [`PHASE_2A_DATABASE_DESIGN.md`](../phase-2a/PHASE_2A_DATABASE_DESIGN.md) mục `location_types.icon_name` vẫn còn cụm mô tả *"Tên icon Lucide tương ứng"*, trong khi Frontend đã gỡ `lucide-react` và sử dụng hoàn toàn `material-symbols-outlined` — cần đổi mô tả cột này thành tên icon Material Symbols khi bước vào Phase 2.
