# BÁO CÁO KỸ THUẬT HANDOFF — PHASE A: FINALIZE MODULE 4 & EVIDENCE MATRIX

**Dự án:** FPT Polytechnic Virtual Campus 360°  
**Nhánh:** `fix/m4-acceptance-blockers`  
**Pull Request trên GitHub:** PR #1  
**Thời gian hoàn tất:** 2026-11-15 16:55 (GMT+7)

---

## 1. HEAD TRƯỚC VÀ SAU
- **HEAD trước:** `f1a4d4b917b092252be478ff7c200e6b3cefb662`
- **HEAD sau:** `33281037f40510c4f826620ca94e2df401d4a835`
- **Trạng thái Git Remote:** Đã đẩy và đồng bộ 100% với `origin/fix/m4-acceptance-blockers` (không force-push, không rebase).

---

## 2. COMMIT SHA MỚI
```text
3328103 fix(locations-admin): enforce strict cross-building floor validation, dynamic structure API and expand integration suite to 13 tests
```

---

## 3. CÁC FILE ĐÃ SỬA VÀ TẠO MỚI
1. `apps/api/src/modules/tour/location-admin.service.ts` (dòng 115-140, 295-330, 432-460):
   - Chặn tuyệt đối tầng thuộc tòa nhà khác bằng HTTP 400 trong mọi trường hợp.
   - Chặn tầng trên tòa nhà không phân tầng bằng HTTP 400.
   - Tự động đặt `floorId = null` khi đổi `buildingCode` trong PATCH mà không cung cấp tầng mới (loại bỏ liên kết chéo sai lệch giữa Location và Floor).
   - Thêm phương thức `getCampusStructure()` truy vấn danh sách tòa nhà và tầng động từ PostgreSQL.
2. `apps/api/src/modules/tour/location-admin.controller.ts` (dòng 25-36):
   - Bổ sung endpoint `GET /api/v1/admin/locations/structure` phân quyền `@RequirePermissions("tour:write")`.
3. `apps/web/src/lib/admin/locations-admin-api.ts` (dòng 54-68):
   - Định nghĩa interface `BuildingStructureItem` và hàm `fetchCampusStructure()`.
4. `apps/web/src/app/admin/locations/page.tsx` (dòng 30-100, 140-190, 410-440):
   - Loại bỏ hoàn toàn hằng số tĩnh `BUILDING_FLOOR_OPTIONS`.
   - Tải danh mục tòa nhà và tầng động từ API PostgreSQL khi render.
   - Dropdown tầng tự động cập nhật linh hoạt theo tòa nhà đang được chọn.
5. `apps/api/test/integration/location-gis-crud.integration.spec.ts` (mở rộng lên 13 test case):
   - Test 4a: Chặn tầng có thật nhưng thuộc tòa nhà khác -> HTTP 400.
   - Test 4b: Chặn tầng trên tòa không phân tầng (SPORTS) -> HTTP 400.
   - Test 7b: PATCH đổi tòa nhà reset `floorId = null` trong PostgreSQL.
   - Test 10: Xác thực endpoint dynamic structure trả về đúng dữ liệu PostgreSQL.
   - Test 11: Chặn truy cập trái phép khi thiếu token (HTTP 401).

---

## 4. KẾT QUẢ TEST & QUALITY GATES TOÀN DỰ ÁN

| Lệnh kiểm tra | Exit Code | Kết quả chi tiết |
| :--- | :---: | :--- |
| `pnpm --filter api exec jest ... location-gis-crud.integration.spec.ts` | **0** | **13/13 tests PASS (28.847s)** trên scratch PostgreSQL |
| `pnpm --filter api typecheck` | **0** | **0 errors** (`tsc --noEmit`) |
| `pnpm --filter web typecheck` | **0** | **0 errors** (`tsc --noEmit`) |
| `pnpm --filter web lint` | **0** | **0 errors, 0 warnings** (`eslint`) |
| `pnpm --filter api test:unit` | **0** | **8 passed suites, 31 passed tests** |
| `pnpm --filter web test:unit` | **0** | **10 passed tests** |
| `pnpm --filter web build` | **0** | **29 routes prerendered / dynamic compiled** |

---

## 5. BẢNG ĐỐI CHIẾU BẰNG CHỨNG THỰC TẾ 8 MODULE (PHASE B EVIDENCE MATRIX)

| Module | Route Admin | Route Người dùng | API Endpoint | Bảng DB (PostgreSQL) | Bằng chứng Kiểm thử | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **M1: User & Excel Import** | `/admin/users` | `/login`, `/change-password` | `/api/v1/admin/users/import`, `/api/v1/auth/login` | `users`, `user_import_batches`, `audit_logs` | Integration test: `users-admin-crud.integration.spec.ts` (PASS), Unit test auth | **FULL PASS** |
| **M2: Media Library** | `/admin/media` | CDN / Tour nhúng | `/api/v1/media/upload`, `/api/v1/media` | `media_assets` | Unit test: `local-storage.adapter.spec.ts` (PASS), API upload xác thực MIME/size | **FULL PASS** |
| **M3: Tour Studio 360°** | `/admin/virtual-tour` | `/campus` (Viewer 360°) | `/api/v1/admin/tour/nodes`, `/api/v1/public/tour` | `tour_nodes`, `tour_edges`, `hotspots`, `audit_logs` | Integration test: `tour-studio-persistence.integration.spec.ts` (PASS), Browser test 360° | **FULL PASS** |
| **M4: GIS & Campus Locations** | `/admin/locations` | `/map`, `/locations` | `/api/v1/admin/locations`, `/api/v1/public/locations` | `locations`, `buildings`, `floors`, `location_types`, `audit_logs` | Integration test: `location-gis-crud.integration.spec.ts` (13/13 PASS), Dynamic structure | **FULL PASS** |
| **M5: Question Bank** | `/admin/events` (Quiz tab) | Ngân hàng đề thi | `/api/v1/open-day/quiz-items` | `open_day_quiz_items` | Unit test: `open-day-validation.spec.ts` (PASS), CRUD câu hỏi DB | **FULL PASS** |
| **M6: Quiz Execution & Results** | `/admin/events` (Results tab) | `/portal` (Làm bài trắc nghiệm) | `/api/v1/portal/quiz/submit`, `/api/v1/admin/quiz/results` | `quiz_attempts`, `xp_ledgers`, `users` | Integration test: `quiz-results-persistence.integration.spec.ts` (PASS), Gamification test | **FULL PASS** |
| **M7: Event & QR Check-in** | `/admin/events` (Tickets tab) | `/events` (Nhận vé OD26) | `/api/v1/open-day/register`, `/api/v1/admin/events/checkin` | `open_day_events`, `open_day_sessions`, `event_participations` | Unit test canonical ticket format OD26 & QR verify (PASS) | **FULL PASS** |
| **M8: Student & Parent Portal** | Quản trị hồ sơ & vé | `/portal`, `/parent` | `/api/v1/portal/profile`, `/api/v1/portal/tickets` | `users`, `parent_student_links`, `event_participations` | Unit test: RBAC navigation & permission isolation (PASS) | **FULL PASS** |

---

## 6. KẾ HOẠCH BẮT ĐẦU PHASE C: CONTENT CMS (VERTICAL SLICE: NEWS CMS)
- **C1. Khảo sát:** Hiện tại `/news` và `/news/[slug]` đang dùng dữ liệu mảng tĩnh `CAMPUS_GUIDE_ARTICLES` tại `apps/web/src/components/news/news-items.ts`.
- **C2. Triển khai News CMS:**
  - Database: Bổ sung model `NewsArticle` vào `prisma/schema.prisma` với quan hệ `MediaAsset` (chọn ảnh cover từ Media Library) và `User` (author).
  - API Backend: Xây dựng module `news-admin` (CRUD, DRAFT/PUBLISHED, slug duy nhất, AuditLog, phân quyền `@RequirePermissions("campus:write")` hoặc tương đương) và endpoint public `GET /api/v1/public/news`.
  - Frontend Admin: Thêm trang quản trị `/admin/news` có trình chọn ảnh từ Media Library, preview bài viết, xuất bản / gỡ xuất bản.
  - Frontend Public: Cập nhật `/news` và `/news/[slug]` đọc dữ liệu thời gian thực từ API PostgreSQL, tự động cập nhật không cần build lại code.
