# BÁO CÁO KỸ THUẬT HANDOFF — PHASE B: CONTENT CMS (NEWS CMS) FINAL CLOSURE & CONCURRENCY REMEDIATION

**Dự án:** FPT Polytechnic Virtual Campus 360°  
**Nhánh:** `fix/m4-acceptance-blockers`  
**Pull Request trên GitHub:** PR #1  
**Thời gian hoàn tất:** 2026-11-15 18:05 (GMT+7)

---

## 1. ĐỐI CHIẾU COMMIT SHA CHÍNH XÁC (FULL SHA TỪ GITHUB)
- **Code commit vòng trước:** `0d4f49428f995a1008dd74142d1cdc3102efebd1` (`fix(news-cms): remove static fallback...`)
- **Docs commit vòng trước:** `b80232f274e39617288c9830cef622f6caa7049e` (`docs(handoff): standardize evidence matrix...`)
- **Code commit hiện tại (Remediation):** `c88a16b172f278d72b651e2f0f00340c0bbbb0cf` (`fix(news-cms): handle prisma p2002 slug unique constraint and add concurrency integration tests`)
- **Trạng thái GitHub Remote Tip:** Lệnh `git ls-remote origin fix/m4-acceptance-blockers` xác nhận nhánh đã trỏ chính xác đến:
  `c88a16b172f278d72b651e2f0f00340c0bbbb0cf` (Đồng bộ 100%, không force-push, không rebase).

---

## 2. CÁC FILE ĐÃ SỬA ĐỔI THỰC TẾ
1. `apps/api/src/modules/news/news-admin.service.ts`:
   - Bổ sung hàm kiểm tra chuyên biệt `isPrismaP2002SlugError(err: unknown): boolean` bắt chính xác mã lỗi `P2002` (Unique Constraint Violation) của Prisma liên quan đến trường `slug`, không che giấu các lỗi cơ sở dữ liệu khác.
   - Bọc toàn bộ transaction tạo (`createArticle`) và cập nhật (`updateArticle`) bài viết trong khối try-catch.
   - Khi xảy ra xung đột `P2002` tại thời điểm ghi dữ liệu (do race condition / request đồng thời), tự động chuyển đổi thành `HTTP 409 ConflictException` với thông điệp rõ ràng (`Slug "..." đã được sử dụng bởi một bài viết khác trong cơ sở dữ liệu.`).
   - Đảm bảo tính nguyên tử (Atomicity): Prisma `$transaction` tự động rollback hoàn toàn khi ném ngoại lệ, không lưu bài viết dở dang và không ghi nhận AuditLog sai lệch.
2. `apps/api/test/integration/news-cms.integration.spec.ts`:
   - Mở rộng bộ kiểm thử tích hợp lên **16 kịch bản hoàn chỉnh** chạy trực tiếp trên scratch PostgreSQL:
     - **Test 4:** Kiểm tra HTTP 404 cho bài viết DRAFT VÀ slug hoàn toàn không tồn tại (`/api/v1/public/news/slug-hoan-toan-khong-ton-tai-xyz-404`).
     - **Test 13:** Kiểm tra phân trang chính xác 2x2: Seed 3 bài + tạo xuất bản bài thứ 4 (`total: 4`). Kiểm tra `resPage1` trả về đúng 2 bài (`page: 1, limit: 2, total: 4`), `resPage2` trả về đúng 2 bài (`page: 2, limit: 2, total: 4`), không trùng lặp slug (`Set.size === 4`).
     - **Test 15 (Concurrency Creation):** Bắn 2 request tạo bài viết cùng slug đồng thời (`Promise.all`). Kết quả: 1 request thành công `HTTP 201 Created`, 1 request nhận `HTTP 409 Conflict`. Cơ sở dữ liệu PostgreSQL xác nhận chỉ tồn tại đúng 1 bài viết, và AuditLog chỉ ghi nhận đúng 1 bản ghi `CREATE_NEWS_ARTICLE`. Không có mã lỗi 500.
     - **Test 16 (Concurrency Update):** Tạo 2 bài viết riêng biệt, sau đó bắn 2 request cập nhật cùng hướng tới 1 slug mục tiêu đồng thời (`Promise.all`). Kết quả: 1 request thành công `HTTP 200 OK`, 1 request nhận `HTTP 409 Conflict`. Cơ sở dữ liệu PostgreSQL xác nhận chỉ đúng 1 bài viết sở hữu slug mục tiêu. Không có mã lỗi 500.

---

## 3. PHÂN BIỆT PHẠM VI BẰNG CHỨNG (API VS BROWSER UI)
- **API Integration Test:** Đã kiểm chứng 100% bằng 16 kịch bản tự động trên PostgreSQL thực tế thông qua NestJS Test Suite & Supertest.
- **Frontend / Browser E2E:** 
  - Code Frontend Next.js 15 đã triển khai đầy đủ cơ chế: không fallback tĩnh (`news-public-api.ts`), phân trang động kèm giao diện (`/news/page.tsx`), gọi `notFound()` hiển thị trang chuẩn 404 (`/news/[slug]/page.tsx`), và đồng bộ route permission `anyOf: ["campus:write"]` (`auth-routing.ts`).
  - Next.js Production Build biên dịch thành công 30 routes (gồm static `/admin/news`, dynamic `ƒ /news`, dynamic `ƒ /news/[slug]`).
  - *Lưu ý minh bạch:* Hiện chưa chạy kiểm thử browser tự động bằng Playwright E2E cho luồng click UI do phạm vi task này tập trung vào Backend/API và Contract Integration; việc nghiệm thu E2E UI sẽ thực hiện tại giai đoạn Release Readiness.

---

## 4. KẾT QUẢ KIỂM THỬ THỰC TẾ & QUALITY GATES

| Hạng mục kiểm tra | Lệnh thực thi | Exit Code | Kết quả thực tế |
| :--- | :--- | :---: | :--- |
| **News CMS Integration Test** | `jest --runInBand test/integration/news-cms.integration.spec.ts` | **0** | **16/16 tests PASS (27.046s)** trên scratch PostgreSQL |
| **GIS Location Integration Test** | `jest --runInBand test/integration/location-gis-crud.integration.spec.ts` | **0** | **13/13 tests PASS (28.847s)** trên scratch PostgreSQL |
| **API Typecheck** | `pnpm --filter api typecheck` | **0** | **0 errors** (`tsc --noEmit`) |
| **Web Typecheck** | `pnpm --filter web typecheck` | **0** | **0 errors** (`tsc --noEmit`) |
| **API Lint** | `pnpm --filter api lint` | **0** | **0 errors, 0 warnings** (`eslint "src/**/*.ts" "test/**/*.ts"`) |
| **Web Lint** | `pnpm --filter web lint` | **0** | **0 errors, 0 warnings** (`eslint`) |
| **API Unit Tests** | `pnpm --filter api test:unit` | **0** | **8 suites, 31 tests PASS (5.813s)** |
| **Web Unit Tests** | `pnpm --filter web test:unit` | **0** | **10 tests PASS (143ms)** |
| **Next.js Production Build** | `pnpm --filter web build` | **0** | **30 routes compiled** (`next build`) |

---

## 5. BẢNG ĐỐI CHIẾU BẰNG CHỨNG THỰC TẾ 9 MODULE (STANDARDIZED EVIDENCE MATRIX)

| Module | Route Admin | Route Người dùng | API Endpoint | Bảng DB (PostgreSQL) | Bằng chứng Kiểm thử Thực tế | Trạng thái Nghiệm thu |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **M1: User & Excel Import** | `/admin/users` | `/login`, `/change-password` | `/api/v1/admin/users/import`, `/api/v1/auth/login` | `users`, `user_import_batches`, `audit_logs` | Integration test `users-admin-crud.integration.spec.ts` (PASS), Unit test auth | **FULL PASS** *(giữ nguyên trạng thái)* |
| **M2: Media Library** | `/admin/media` | CDN / Tour nhúng | `/api/v1/media/upload`, `/api/v1/media` | `media_assets` | Unit test: `local-storage.adapter.spec.ts` (PASS), API upload xác thực MIME/size. *Chưa có upload đồng thời nhiều file & WebP compression.* | **PARTIAL** |
| **M3: Tour Studio 360°** | `/admin/virtual-tour` | `/campus` (Viewer 360°) | `/api/v1/admin/tour/nodes`, `/api/v1/public/tour` | `tour_nodes`, `tour_edges`, `hotspots`, `audit_logs` | Integration test `tour-studio-persistence.integration.spec.ts` (PASS), Three.js 360° verified | **FULL PASS** *(giữ nguyên trạng thái)* |
| **M4: GIS & Locations** | `/admin/locations` | `/map`, `/locations` | `/api/v1/admin/locations`, `/api/v1/public/locations` | `locations`, `buildings`, `floors`, `location_types`, `audit_logs` | 13/13 Integration tests `location-gis-crud.integration.spec.ts` (PASS) trên cấu trúc tòa nhà/tầng động và chống lệch tầng | **FULL PASS** *(giữ nguyên trạng thái)* |
| **M5: Content CMS (News)** | `/admin/news` | `/news`, `/news/[slug]` | `/api/v1/admin/news`, `/api/v1/public/news` | `news_articles`, `media_assets`, `users`, `audit_logs` | **16/16 Integration tests PASS**: Xử lý P2002 unique constraint, concurrency race-condition create/update, zero static fallback, phân trang 2x2 chuẩn hóa, strict 404, RBAC 401/403/200, soft-delete slug policy | **FULL PASS** *(đủ điều kiện đóng nghiệm thu)* |
| **M6: Question Bank** | `/admin/events` (Quiz tab) | Ngân hàng đề thi | `/api/v1/open-day/quiz-items` | `open_day_quiz_items` | Unit test `open-day-validation.spec.ts` (PASS), CRUD câu hỏi DB cơ bản. *Chưa có giao diện soạn đề thi tổng hợp.* | **PARTIAL** |
| **M7: Quiz & Results** | `/admin/events` (Results tab) | `/portal` (Làm bài) | `/api/v1/portal/quiz/submit`, `/api/v1/admin/quiz/results` | `quiz_attempts`, `xp_ledgers`, `users` | Integration test submit điểm & XP ledger PASS. *Cần hoàn thiện giao diện làm bài trực quan theo thời gian thực.* | **PARTIAL** |
| **M8: Event & QR Check-in** | `/admin/events` (Tickets tab) | `/events` (Nhận vé OD26) | `/api/v1/open-day/register`, `/api/v1/admin/events/checkin` | `open_day_events`, `open_day_sessions`, `event_participations` | Unit test định dạng vé chuẩn OD26 & QR verify (PASS). *Cần hoàn thiện máy quét camera trực tiếp tại bàn lễ tân.* | **PARTIAL** |
| **M9: Student & Parent Portal** | Quản trị hồ sơ & vé | `/portal`, `/parent` | `/api/v1/portal/profile`, `/api/v1/portal/tickets` | `users`, `parent_student_links`, `event_participations` | Unit test phân luồng định tuyến và bảo vệ route (PASS). *Cần kết nối sâu thêm API lịch trình cá nhân hóa.* | **PARTIAL** |

---

## 6. ĐỀ XUẤT CHO BƯỚC TIẾP THEO
Kính đề nghị Tech Lead nghiệm thu **FULL PASS cho Module 5 (News Content CMS)** và chỉ đạo chuyển sang **Module 2: Media Library nâng cao** (hỗ trợ upload đa file đồng thời, nén WebP tự động, phân loại tag phục vụ Tour Studio 360°).
