# KẾ HOẠCH CHUẨN BỊ PHASE 1 & PHASE 2 (PREPARATION ONLY — CHƯA TRIỂN KHAI)

**Mục đích:** Chuẩn bị phạm vi tệp, phụ thuộc, rủi ro và tiêu chí nghiệm thu cho các bước tiếp theo ngay sau khi Phase 0 được nghiệm thu. **Tài liệu này chỉ phục vụ phê duyệt — không có nội dung nào dưới đây được sửa đổi trong code ở Phase 0.**

---

## 1. Kế hoạch 1 — Admin Auth Remediation & Architecture Readiness (Phase 1 → Phase 3)

- **Phạm vi file (Phase 1 — Gỡ rủi ro lộ credential client-side):**
  - `apps/web/src/lib/prototype-auth.ts` *(đã gỡ ở Phase 1)*
  - `apps/web/src/app/(auth)/login/page.tsx` *(chuyển sang màn hình thông báo Auth chờ Phase 3)*
  - `apps/web/src/app/(portal)/portal/page.tsx` & `layout.tsx` *(gỡ `sessionStorage` & `/login?next=/portal`)*
  - `apps/web/src/app/admin/layout.tsx` *(gắn banner cảnh báo Admin Preview nội bộ trên mọi `/admin/*`)*
  - `apps/web/src/app/admin/layout.tsx`
- **Phụ thuộc:** Phê duyệt hướng xử lý tạm trong Phase 1 từ Chủ dự án (ví dụ: gỡ bỏ `ADMIN_ACCOUNT_CONFIG` plaintext password và hiển thị trạng thái bảo trì/nội bộ cho màn `/login` cho tới Phase 3 Backend Auth, thay vì giữ mật khẩu hardcoded hay dựng cookie giả).
- **Rủi ro & Kiểm soát:**
  - *Rủi ro:* Khi gỡ login mẫu khỏi `prototype-auth.ts`, nhóm phát triển không thể bấm nút đăng nhập `/login` để chuyển hướng UI `/admin` nếu muốn kiểm thử giao diện local.
  - *Kiểm soát:* Tách rõ môi trường dev local (`localhost` UI preview trực tiếp tới URL `/admin/*` kèm banner cảnh báo `"INTERNAL PROTOTYPE — NO SERVER AUTH YET"`) và tuyệt đối cấm triển khai public Internet trước Phase 3 (theo Phương án 1 đã duyệt).
- **Tiêu chí nghiệm thu (Phase 1):**
  - Grep toàn bộ `apps/web/src/` tìm `Fpoly@2026` hoặc mật khẩu plaintext = **0 kết quả**.
  - Không có logic xác thực giả / bypass cookie tự cấp ở frontend.

---

## 2. Kế hoạch 2 — MVP Content & `/portal` Reference Cleanup (Phase 1)

- **Phạm vi file dự kiến (đã xác minh trực tiếp qua grep trong Phase 0):**
  1. `apps/web/src/components/home/OpenDayBanner.tsx` (dòng 35–36: nhắc đăng nhập `/portal` lấy QR)
  2. `apps/web/src/app/(public)/about/page.tsx` (dòng 147–150: mô tả tài khoản Open Day `/portal`)
  3. `apps/web/src/app/(public)/events/page.tsx` (dòng 33) + `apps/web/src/components/events/EventPillarGrid.tsx` (dòng 22–29) + `apps/web/src/components/events/OpenDayScheduleTimeline.tsx` (dòng 79)
  4. `apps/web/src/components/news/news-items.ts` (dòng 21, 36, 41–42: hướng dẫn dùng mật khẩu tạm mở thẻ QR tại `/portal` & số scene cũ `"5 góc nhìn"`)
  5. `apps/web/src/components/quiz/QuizLeaderboard.tsx` (dòng 27: nhắc QR Open Day)
  6. `apps/web/src/components/ui/StateFeedback.tsx` (dòng 170–178: `AuthGateState` mặc định `actionHref="/login?next=/portal"`)
  7. `apps/web/src/app/(portal)/portal/page.tsx` (dòng 59–71: đổi CTA/mô tả trên cổng dự phòng để không dẫn sang `/login?next=/portal` như cổng sinh viên công khai)
  8. `apps/web/src/data/campus-data.ts` (dòng 822, 874, 913, 919: FAQ & sessions nhắc nhận mật khẩu tạm qua Zalo/Email để mở `/portal`)
- **Ràng buộc bảo toàn:**
  - **Không xóa** route `/portal` hoặc thư mục `apps/web/src/app/(portal)/` và `components/portal/`.
  - **Không tự ý xóa** nghiệp vụ/dữ liệu lịch Open Day công khai trên `/events`, hoặc tái cấu trúc code `/admin/events` và `/admin/users` sang Backend thật khi chưa vào Phase 3 (chỉ làm sạch copy gây hiểu nhầm QR/Zalo/mật khẩu tạm ở Phase 1).
- **Tiêu chí nghiệm thu:**
  - Grep `next=/portal` trong toàn `apps/web/src/` = **0 kết quả**.
  - Không còn trang public nào hướng dẫn khách tham quan/học sinh đăng nhập `/login` để lấy mã QR.
  - `pnpm build`, `pnpm lint`, `pnpm typecheck` đều PASS và HTTP 19 routes trả `200`.

---

## 3. Kế hoạch 3 — Verified Test Artifacts, Dead Asset & Config Cleanup (Phase 1)

- **Phạm vi file dự kiến (tất cả đều đã xác minh 0 sử dụng hoặc là artifact test):**
  1. **Gỡ dữ liệu/ảnh test công khai:**
     - `apps/web/src/data/campus-data.ts` (gỡ hotspot `hs-to-tang1-test` L529–535, gỡ 2 scene `tang-1-sanh-ong-vang` & `tang-2-dich-vu-sv` L714–799, gỡ `med-09`/`med-10` L1066–1085).
     - `apps/web/public/images/panoramas/tang-1.jpg` & `tang-2.jpg` (chuyển ra thư mục sample ngoài `public/` hoặc xóa khỏi public serve).
     - Cập nhật lại `news-items.ts` / `AdminDashboardMetrics.tsx` nếu hiển thị sai số đếm scene hoặc đồng bộ `INITIAL_MEDIA_ASSETS` khớp với 6 ảnh thực tế trong `apps/web/public/images/locations/`.
  2. **Kiểm kê file chưa dùng & báo cáo đề xuất cho Chủ dự án (KHÔNG tự ý xóa/sửa trong Phase 1):**
     - `apps/web/public/images/fpoly-campus-aerial.jpg` (`509.2 KB`, ảnh chụp QTSC có chú thích `Tòa nhà T/P/F`, hiện 0 tham chiếu trong `src/`): giữ nguyên ở Phase 1, ghi kết luận kiểm tra và đề xuất để Chủ dự án quyết định giữ làm poster/hero dự phòng hay xóa.
     - Dependency `"lucide-react": "^1.71.0"` trong `apps/web/package.json` (`0` import trong toàn repo) — gỡ bằng `pnpm --filter web remove lucide-react` để cập nhật sạch `pnpm-lock.yaml`.
  3. **Sửa lỗi cấu hình tĩnh & điều tra `/sitemap.xml`:**
     - `apps/web/next.config.ts`: gỡ `remotePatterns` thừa (`lh3.googleusercontent.com`, `images.unsplash.com`).
     - `apps/web/public/manifest.json`: sửa câu mô tả `"bản đồ 3D tương tác"` thành mô tả đúng định hướng `GIS + Floor Plan + 360°`.
     - `/sitemap.xml` trả `HTTP 404` vì `apps/web/public/robots.txt` trỏ `Sitemap: https://virtualcampus.poly.edu.vn/sitemap.xml` nhưng chưa có `sitemap.ts` hoặc `sitemap.xml`: **chưa tự tạo `sitemap.ts` ở Phase 1**, báo cáo rõ nguyên nhân, danh sách URL public MVP (loại trừ `/portal`, `/admin`, `/login`) và phương án xử lý để Chủ dự án duyệt.
  4. **Các mục CSS chết / Refactor nhẹ (ĐỂ RIÊNG, không gộp vào security cleanup):**
     - Chỉ kiểm tra lại và tách thành PR/bước riêng sau khi Phase 1 MVP Cleanup đã verify pass (`.home-reveal*`, `.shadow-cta-glow`, `.glass-hud`, `.ui-dropdown-menu`, `.ui-state-success`, `.animate-fade-in` trong `globals.css`; `formatNumber`/`formatDate` trong `utils.ts`; tách CTA lặp trong `CampusGISMap.tsx`).
- **Rủi ro & Kiểm soát:**
  - Nếu xóa scene `tang-1`/`tang-2` mà sót liên kết từ một location/card nào đó → kiểm tra grep mọi ID `tang-1-sanh-ong-vang`, `tang-2-dich-vu-sv`, `tang-1.jpg`, `tang-2.jpg` và verify `pnpm build` clean.
- **Tiêu chí nghiệm thu Phase 1:**
  - `/campus` không còn hotspot `"Test Ảnh Thực tế Tầng 1"` hay chuỗi `"(Test)"`/`"MAE"`.
  - Grep source & compiled client bundle = `0` credential (`Fpoly@2026`), `0` fake session (`fpoly_vc_admin_session_v1`), `0` `/login?next=/portal`, `0` Zalo/QR/mật khẩu tạm; `pnpm typecheck`, `pnpm lint`, `pnpm build` PASS `EXIT 0`.

---

## 4. Kế hoạch 4 — Phase 2 Shared Architecture & Data Contract (`@fpt-campus/shared`)

- **Mục tiêu:** Chốt mô hình dữ liệu chuẩn xác trước khi viết bất kỳ module NestJS/Prisma hay màn hình Admin Campus Studio nào.
- **Phạm vi file dự kiến:**
  - `packages/shared/src/index.ts` (và tách submodule trong `packages/shared/src/` nếu cần: `campus.ts`, `floor-plan.ts`, `tour.ts`, `auth.ts`, `events.ts`, `api.ts`).
  - `packages/shared/package.json`, `apps/web/package.json` (`"@fpt-campus/shared": "workspace:*"`), `apps/web/tsconfig.json`.
  - Tham chiếu chuẩn đối soát: `docs/phase-2a/PHASE_2A_DATABASE_DESIGN.md` & `docs/phase-2a/PHASE_2A_API_CONTRACT.md`.
- **Những thực thể bắt buộc phải chốt hợp đồng trong Phase 2:**
  1. `Campus` (`id`, `code: "QTSC-Q12"`, `name`, `address`, `defaultEntryNodeSlug`)
  2. `Building` (tòa nhà động thay thế union type cứng: `id`, `campusId`, `code`, `slug`, `name`, `category`, `gisX`, `gisY`, `lat`, `lng`, `coverMediaId`)
  3. `Floor` (đa tầng: `id`, `buildingId`, `code`, `name`, `levelIndex` sắp xếp âm/trệt/lầu, `activeFloorPlanId`)
  4. `FloorPlan` (`id`, `floorId`, `version`, `sourceFormat: 'PNG'|'JPG'|'SVG'|'PDF'`, `sourcePageNumber`, `renderUrl`, `thumbUrl`, `renderWidth`, `renderHeight`, `northOffsetDeg`, `alignmentStatus: 'PENDING_REVIEW'|'CONFIRMED'`)
  5. `Location` (gắn với `buildingId` & `floorId`, tọa độ chuẩn hóa 2D `[0..1]`: `floorNormX`, `floorNormY`, `floorPolygonNorm`, `locationType`, `isPublicAccessible`, `primaryNodeId`)
  6. `TourNode` (quan hệ **`Location (1) — (N) TourNode`**, giữ nguyên query `/campus?scene={slug}` tương thích: `id`, `locationId`, `floorId`, `slug`, `title`, `floorNormX`, `floorNormY`, `initialYaw`, `initialPitch`, `initialFov`, `headingOffsetDeg`, `panoramaAssetId`, `needsRealignment`, `status`)
  7. `TourEdge` & `Hotspot` (tách rõ đồ thị liên thông `fromNodeId -> toNodeId`, `edgeType: 'WALKWAY'|'DOORWAY'|'STAIRS'|'ELEVATOR'|'OUTDOOR_LINK'`, `targetEntryYaw`, `targetEntryPitch`, ngoại lệ phê duyệt `isOneWayApproved` + `Hotspot` tọa độ cầu `(yaw, pitch)`, `hotspotType: 'SCENE_LINK'|'INFO'|'QUIZ_TRIGGER'`)
  8. Quy tắc đồng bộ 3 hệ tọa độ (`GIS % / lat-lng` ↔ `FloorPlan [0..1]` ↔ `Spherical yaw/pitch/fov`) và luật Graph Validation (BFS/DFS kiểm tra node cô lập, ngõ cụt `isTerminalApproved`, cạnh trỏ node chưa publish).
  9. **Hợp đồng Tài khoản, Cấp phát Kép & Import Excel/CSV (`auth.ts`, `users.ts` — Bổ sung theo quyết định mới):**
     - Phân tách rõ `UserType` (`ADMIN | STAFF | STUDENT | PARENT`), `RBAC Role/Permission`, `AccountStatus`, `ActivationStatus`, `ProvisioningMethod` (`BOOTSTRAP | ADMIN_DIRECT | EMAIL_SMS_INVITATION`), và `EventParticipation` (`1 User — N Open Day Events`).
     - Hỗ trợ cấp thủ công & **Import `.xlsx`/`.csv` 5 bước** (Upload → Ánh xạ cột → Preview/Validate → Confirm → Báo cáo từng dòng), **cấm lưu file Excel gốc / tên file / đường dẫn file gốc** trong DB hay Object Storage; cấp phát kép bằng link/mã kích hoạt 1 lần (`ADMIN_DIRECT`) hoặc lời mời `EMAIL_SMS_INVITATION` (`INVITATION_PENDING | SENT | EXPIRED | ACTIVATED | FAILED` + `Resend`) — **tuyệt đối không dùng mật khẩu mặc định chung hay plaintext**. Khách tham quan tự do không cần tài khoản; Student/Parent Portal vẫn nằm ngoài MVP.
- **Rủi ro & Kiểm soát:**
  - *Rủi ro:* Thay đổi kiểu dữ liệu làm gãy `apps/web/src/data/campus-data.ts` khi chưa có Backend API ở Phase 2.
  - *Kiểm soát:* Tách lớp DTO mới trong `@fpt-campus/shared` kèm hàm mapper/adapter tại `apps/web/src/data/` để toàn bộ Frontend vẫn build sạch với dữ liệu QTSC tĩnh trong lúc chờ Phase 3 Backend API.
- **Tiêu chí nghiệm thu:**
  - Tài liệu đặc tả Data Contract & Studio Workflow được Chủ dự án ký duyệt.
  - `apps/web` import trực tiếp `@fpt-campus/shared`, `pnpm typecheck` & `pnpm build` đạt `EXIT 0`, và schema khớp 100% với `docs/phase-2a/PHASE_2A_DATABASE_DESIGN.md`.
