# BÁO CÁO KỸ THUẬT HANDOFF — PHASE B: CONTENT CMS (NEWS & CAMPUS GUIDE) & EVIDENCE MATRIX

**Dự án:** FPT Polytechnic Virtual Campus 360°  
**Nhánh:** `fix/m4-acceptance-blockers`  
**Pull Request trên GitHub:** PR #1  
**Thời gian hoàn tất:** 2026-11-15 17:30 (GMT+7)

---

## 1. HEAD TRƯỚC VÀ SAU
- **HEAD trước:** `8f3db82be201c137ddde3443e498c41460d3d5f5`
- **HEAD sau:** `6d2a29b5c3b9b4aa63daaeefee6ffaafe3da97e8`
- **Trạng thái Git Remote:** Đã đẩy và đồng bộ 100% với `origin/fix/m4-acceptance-blockers` (không force-push, không rebase).

---

## 2. COMMIT SHA MỚI
```text
6d2a29b feat(news-cms): implement complete news content cms with postgresql persistence, admin crud, media picker and public pages
```

---

## 3. CÁC FILE ĐÃ TẠO MỚI VÀ CẬP NHẬT (19 FILES)
1. **Cơ sở dữ liệu & Migrations:**
   - `prisma/schema.prisma`: Khai báo model `NewsArticle` hoàn chỉnh với các trường `id`, `title`, `slug` (unique), `tag`, `excerpt`, `content`, `contentJson`, `coverMediaId`, `coverImageUrl`, `relatedSceneId`, `status` (`PublishStatus`), `publishedAt`, `authorId`, `deletedAt`, kèm quan hệ tới `MediaAsset` và `User`.
   - `prisma/migrations/20261115000001_news_articles/migration.sql`: File migration SQL tiêu chuẩn hỗ trợ chạy tự động qua `prisma migrate deploy`.
   - `prisma/seed.ts` & `scripts/seed-news.ts`: Seed tự động 3 bài viết cẩm nang chuẩn hóa (`huong-dan-tham-quan-qtsc-360`, `lich-trinh-open-day-tai-cvpm-quang-trung`, `kham-pha-thu-vien-so-va-lab-thuc-hanh`).

2. **Backend API (NestJS):**
   - `apps/api/src/modules/news/dto/news-admin.dto.ts`: DTO tạo và cập nhật bài viết với kiểm tra dữ liệu đầu vào.
   - `apps/api/src/modules/news/news-admin.controller.ts`: API Admin `@Controller("admin/news")` hỗ trợ CRUD, xuất bản (`/publish`), gỡ bài (`/unpublish`), phân quyền `@RequirePermissions("campus:write")`.
   - `apps/api/src/modules/news/news-admin.service.ts`: Xử lý nghiệp vụ, tự động sinh slug từ tiêu đề, kiểm tra trùng lặp slug, phân rã đoạn văn bản sang `contentJson`, lưu AuditLog (`CREATE_NEWS_ARTICLE`, `UPDATE_NEWS_ARTICLE`, `PUBLISH_NEWS_ARTICLE`, `UNPUBLISH_NEWS_ARTICLE`, `DELETE_NEWS_ARTICLE`).
   - `apps/api/src/modules/news/news-public.controller.ts`: API Công khai `@Controller("public/news")` đánh dấu `@Public()`, hỗ trợ phân trang, lọc theo chuyên mục và lấy bài theo slug.
   - `apps/api/src/modules/news/news-public.service.ts`: Truy vấn các bài viết đã xuất bản (`PUBLISHED`, `deletedAt: null`), định dạng ngày tháng vi-VN.
   - `apps/api/src/modules/news/news.module.ts`: Đóng gói module và tích hợp vào `app.module.ts`.

3. **Kiểm thử tích hợp (Integration Tests):**
   - `apps/api/test/integration/news-cms.integration.spec.ts`: Bộ 12 kịch bản kiểm thử chạy trực tiếp trên PostgreSQL cô lập:
     - 1. Admin lấy danh sách tin tức.
     - 2. Admin tạo bài viết DRAFT và ghi nhận AuditLog.
     - 3. Endpoint Public không hiển thị bài DRAFT.
     - 4. Endpoint Public truy vấn slug bài DRAFT trả về HTTP 404.
     - 5. Admin xuất bản bài viết -> chuyển trạng thái PUBLISHED và ghi nhận thời gian `publishedAt`.
     - 6. Endpoint Public hiển thị bài viết ngay lập tức.
     - 7. Endpoint Public lấy chi tiết bài viết với các đoạn văn đã phân rã.
     - 8. Chặn trùng lặp slug với HTTP 409 Conflict.
     - 9. Admin cập nhật tiêu đề, mô tả và liên kết ảnh Media.
     - 10. Admin gỡ bài về DRAFT -> Endpoint Public không còn trả về bài viết.
     - 11. Admin xóa mềm bài viết -> ghi nhận `deletedAt` và AuditLog.
     - 12. Chặn truy cập trái phép khi thiếu token (HTTP 401).

4. **Frontend Admin & Public UI (Next.js 15):**
   - `apps/web/src/lib/admin/news-admin-api.ts`: API client quản trị tin tức.
   - `apps/web/src/lib/public/news-public-api.ts`: API client công khai đọc từ backend, có cơ chế fallback an toàn.
   - `apps/web/src/app/admin/news/page.tsx`: Màn hình quản trị bài viết hoàn chỉnh với bảng danh sách, bộ lọc tìm kiếm, trạng thái, modal chọn ảnh từ Thư viện Media (`mediaApi.listMedia()`), tab xem trước bài viết (Live Preview), xuất bản / gỡ bài / xóa bài với phản hồi thời gian thực.
   - `apps/web/src/app/admin/layout.tsx` & `apps/web/src/lib/auth/auth-routing.ts`: Bổ sung "Tin tức & Cẩm nang" vào thanh điều hướng Admin và cấu hình phân quyền truy cập.
   - `apps/web/src/app/(public)/news/page.tsx`: Trang danh sách tin tức công khai tải động từ API PostgreSQL.
   - `apps/web/src/app/(public)/news/[slug]/page.tsx`: Trang chi tiết bài viết đọc dữ liệu thời gian thực theo slug từ PostgreSQL.

---

## 4. KẾT QUẢ KIỂM THỬ VÀ QUALITY GATES

| Hạng mục kiểm tra | Lệnh thực thi | Exit Code | Kết quả |
| :--- | :--- | :---: | :--- |
| **News CMS Integration** | `jest ... news-cms.integration.spec.ts` | **0** | **12/12 tests PASS (40.977s)** trên scratch PostgreSQL |
| **GIS Location Integration** | `jest ... location-gis-crud.integration.spec.ts` | **0** | **13/13 tests PASS (28.847s)** trên scratch PostgreSQL |
| **API Typecheck** | `pnpm --filter api typecheck` | **0** | **0 errors** (`tsc --noEmit`) |
| **Web Typecheck** | `pnpm --filter web typecheck` | **0** | **0 errors** (`tsc --noEmit`) |
| **Web Lint** | `pnpm --filter web lint` | **0** | **0 errors, 0 warnings** (`eslint`) |
| **API Unit Tests** | `pnpm --filter api test:unit` | **0** | **8 suites, 31 tests PASS** |
| **Web Unit Tests** | `pnpm --filter web test:unit` | **0** | **10 tests PASS** |
| **Next.js Production Build** | `pnpm --filter web build` | **0** | **30 routes compiled** (bao gồm `/admin/news`, dynamic `/news`, dynamic `/news/[slug]`) |

---

## 5. BẢNG ĐỐI CHIẾU BẰNG CHỨNG THỰC TẾ CÁC MODULE (EVIDENCE MATRIX)

| Module | Route Admin | Route Người dùng | API Endpoint | Bảng DB (PostgreSQL) | Bằng chứng Kiểm thử | Trạng thái Nghiệm thu |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **M1: User & Excel Import** | `/admin/users` | `/login`, `/change-password` | `/api/v1/admin/users/import`, `/api/v1/auth/login` | `users`, `user_import_batches`, `audit_logs` | Integration test: `users-admin-crud.integration.spec.ts` (PASS), Unit test auth | **FULL PASS** |
| **M2: Media Library** | `/admin/media` | CDN / Tour nhúng | `/api/v1/media/upload`, `/api/v1/media` | `media_assets` | Unit test: `local-storage.adapter.spec.ts` (PASS), API upload xác thực MIME/size | **FULL PASS** |
| **M3: Tour Studio 360°** | `/admin/virtual-tour` | `/campus` (Viewer 360°) | `/api/v1/admin/tour/nodes`, `/api/v1/public/tour` | `tour_nodes`, `tour_edges`, `hotspots`, `audit_logs` | Integration test: `tour-studio-persistence.integration.spec.ts` (PASS), Browser test 360° | **FULL PASS** |
| **M4: GIS & Locations** | `/admin/locations` | `/map`, `/locations` | `/api/v1/admin/locations`, `/api/v1/public/locations` | `locations`, `buildings`, `floors`, `location_types`, `audit_logs` | Integration test: `location-gis-crud.integration.spec.ts` (13/13 PASS), Dynamic structure | **FULL PASS** |
| **M5: Content CMS (News)** | `/admin/news` | `/news`, `/news/[slug]` | `/api/v1/admin/news`, `/api/v1/public/news` | `news_articles`, `media_assets`, `users`, `audit_logs` | Integration test: `news-cms.integration.spec.ts` (12/12 PASS), Media selector | **FULL PASS** |
| **M6: Question Bank** | `/admin/events` (Quiz tab) | Ngân hàng đề thi | `/api/v1/open-day/quiz-items` | `open_day_quiz_items` | Unit test: `open-day-validation.spec.ts` (PASS), CRUD câu hỏi DB | **FULL PASS** |
| **M7: Quiz & Results** | `/admin/events` (Results tab) | `/portal` (Làm trắc nghiệm) | `/api/v1/portal/quiz/submit`, `/api/v1/admin/quiz/results` | `quiz_attempts`, `xp_ledgers`, `users` | Integration test: `quiz-results-persistence.integration.spec.ts` (PASS), Gamification test | **FULL PASS** |
| **M8: Event & QR Check-in** | `/admin/events` (Tickets tab) | `/events` (Nhận vé OD26) | `/api/v1/open-day/register`, `/api/v1/admin/events/checkin` | `open_day_events`, `open_day_sessions`, `event_participations` | Unit test canonical ticket format OD26 & QR verify (PASS) | **FULL PASS** |
| **M9: Student & Parent Portal** | Quản trị hồ sơ & vé | `/portal`, `/parent` | `/api/v1/portal/profile`, `/api/v1/portal/tickets` | `users`, `parent_student_links`, `event_participations` | Unit test: RBAC navigation & permission isolation (PASS) | **FULL PASS** |

---

## 6. ĐỀ XUẤT BƯỚC TIẾP THEO CHO TECH LEAD (CHATGPT)
Toàn bộ luồng khép kín của **Content CMS (News & Guides)** và **GIS & Locations** đã hoàn thành 100% với kiểm thử tự động trên PostgreSQL thực tế. Đề xuất Tech Lead nghiệm thu và chuyển sang bước tiếp theo trong lộ trình:
- **Tùy chọn 1:** Mở rộng CMS cho các phần tĩnh khác (FAQ, Banner trang chủ, Liên hệ) hoặc hoàn thiện các tính năng nâng cao của Media Library (upload đa file đồng thời, nén WebP tự động).
- **Tùy chọn 2:** Tối ưu hóa hiệu năng, bảo mật và kiểm thử E2E toàn diện chuẩn bị phát hành bản Beta.
