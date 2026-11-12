# Báo cáo Khắc phục Bảo mật `POST /api/v1/public/quiz/verify` & Tái kiểm chứng Cuối Phase 2A-2

**Trạng thái Đề xuất:** **`READY_FOR_FINAL_ACCEPTANCE`**  
**Nhánh làm việc:** `feat/phase-2a-2-core-backend` (chưa push, chưa merge vào `main`)  
**Mốc `main` gốc:** `8b6c20682d978cc8afc3abbafdabf791171f458c` (`8b6c206`)  
**Commit khắc phục mã nguồn, test & tài liệu:** `04fa094914d212590e5ded9785d4dd2ac22a47c1` (`04fa094`)  
**Commit đối soát trước đó:** `a4c6bb06fd7b4208db9230ba0ee61f9226778932` (`a4c6bb0`, bổ sung `PHASE_2A_2_FINAL_ACCEPTANCE_CLARIFICATION.md` trên nền `8f96a678f300e17f9408daca1c5a899888a26ea0`)

---

## 1. Tóm tắt Nguyên nhân Gốc & Quyết định Khắc phục

Tại báo cáo đối soát [PHASE_2A_2_FINAL_ACCEPTANCE_CLARIFICATION.md](./PHASE_2A_2_FINAL_ACCEPTANCE_CLARIFICATION.md), đánh giá tái nghiệm thu đã chỉ ra blocker còn lại trên nhánh `feat/phase-2a-2-core-backend`:

- Dù `GET /api/v1/public/events` đã ẩn toàn bộ `quizItems: []` theo `D-2A2-03 §3.4`, phương thức `PublicService.verifyQuiz` vẫn truy vấn bảng `open_day_quiz_items` theo `status = PUBLISHED && deletedAt IS NULL` và trả về `isCorrect`, `correctIndex`, `explanation` qua `POST /api/v1/public/quiz/verify` cho các quiz chưa có quan hệ khóa ngoại tới `OpenDayEvent`.
- Để khóa triệt để ranh giới dữ liệu công khai mà không sửa Prisma schema, migration, seed hoặc suy diễn quan hệ Event:
  1. Vô hiệu hóa tạm thời `PublicService.verifyQuiz` sao cho **mọi request** gửi tới `POST /api/v1/public/quiz/verify` bị từ chối ngay lập tức bằng `404 NOT_FOUND` trước khi truy vấn database `open_day_quiz_items` hoặc xử lý đáp án.
  2. Giữ nguyên route `POST /api/v1/public/quiz/verify` và DTO validation (`QuizVerifyDto`), không thêm endpoint mới và không ảnh hưởng tới `OpenDayEvent`, `OpenDaySession`, `OpenDayFaq`, RBAC, Auth hay `apps/web`.
  3. Cập nhật integration tests chứng minh không rò rỉ đáp án/giải thích và không phát sinh truy vấn DB vào `openDayQuizItem`.
  4. Đồng bộ tài liệu kiến trúc/kế hoạch/contract để ghi nhận giới hạn có chủ đích này và giữ nguyên lịch sử quyết định `D-2A2-03`.

---

## 2. Chi tiết Thay đổi trong Commit `04fa094914d212590e5ded9785d4dd2ac22a47c1`

### 2.1. Mã nguồn Backend
- [public.service.ts](../../apps/api/src/modules/public/public.service.ts#L1098-L1108):
  - `PublicService.verifyQuiz(_dto: QuizVerifyDto): Promise<QuizVerifyResponse>` ném trực tiếp `NotFoundException({ code: "NOT_FOUND", message: "Chức năng kiểm tra quiz công khai tạm thời không khả dụng." })` ngay đầu hàm.
  - Không thực hiện bất kỳ truy vấn `openDayQuizItem.findMany` / `findFirst` / `findUnique` nào, không parse `optionsJson`, không kiểm tra `correctIndex`, và không trả `isCorrect`, `correctIndex`, `explanation` hay dữ liệu câu hỏi trong response lỗi.
  - Loại bỏ import dư (`BadRequestException`, `QuizVerifyItemResultDto`) để đảm bảo `tsc --noEmit` và `eslint` sạch 100%.
- [public.controller.ts](../../apps/api/src/modules/public/public.controller.ts#L89-L93) & [public-query.dto.ts](../../apps/api/src/modules/public/dto/public-query.dto.ts):
  - Route `POST /api/v1/public/quiz/verify` và validation DTO giữ nguyên tương thích hợp đồng API.

### 2.2. Integration Tests
- [public-isolation.integration.spec.ts](../../apps/api/test/integration/public-isolation.integration.spec.ts#L153-L187) (Baseline QTSC seed):
  - Gửi `POST /api/v1/public/quiz/verify` với ID các câu hỏi seed `PUBLISHED` (`seededPublishedQuizzes[0].id`, `seededPublishedQuizzes[1].id`, `selectedIndex` hợp lệ `0`/`1`) -> xác nhận `404` (`error.code === "NOT_FOUND"`), không có thuộc tính `data`, serialized body không chứa `isCorrect`, `correctIndex`, `explanation`, `questionText` hay `explanation` của seed.
  - Dùng `jest.spyOn` trên `prisma.openDayQuizItem.findMany`, `findFirst`, `findUnique` xác nhận `not.toHaveBeenCalled()`.
- [public-isolation.integration.spec.ts](../../apps/api/test/integration/public-isolation.integration.spec.ts#L708-L789) (Controlled Publish Matrix):
  - Kiểm thử đầy đủ 4 trường hợp âm tính trên cùng endpoint:
    1. Quiz `PUBLISHED` không có Event FK (`publishedUnlinkedQuiz.id`, `selectedIndex: 0`) -> `404 NOT_FOUND`, không lộ `SECRET_UNLINKED_QUIZ_EXPLANATION` / `questionText` / `isCorrect` / `correctIndex` / `explanation`.
    2. Quiz `DRAFT` (`draftQuiz.id`, `selectedIndex: 0`) -> `404 NOT_FOUND`, không lộ `SECRET_DRAFT_QUIZ_EXPLANATION`.
    3. Quiz soft-deleted (`deletedQuiz.id`, `selectedIndex: 0`) -> `404 NOT_FOUND`, không lộ `SECRET_DELETED_QUIZ_EXPLANATION`.
    4. UUID hợp lệ không tồn tại (`00000000-0000-4000-8000-000000000099`, `selectedIndex: 0`) -> `404 NOT_FOUND`, không lộ cấu trúc đáp án.
  - Xác nhận cả 3 spy (`findMany`, `findFirst`, `findUnique`) trên `prisma.openDayQuizItem` đều `not.toHaveBeenCalled()`.

### 2.3. Đồng bộ Tài liệu
- [PHASE_2A_2_IMPLEMENTATION_PLAN.md](../phase-2a/PHASE_2A_2_IMPLEMENTATION_PLAN.md):
  - Giữ nguyên lịch sử phê duyệt quyết định `D-2A2-03` trong bảng quyết định.
  - Cập nhật Mục `3.3` khoản 4 và bảng endpoint Mục `5` nêu rõ: `GET /api/v1/public/events` trả `quizItems: []`; `POST /api/v1/public/quiz/verify` tạm thời trả `404 NOT_FOUND` cho mọi request trước khi truy vấn DB, đây là giới hạn có chủ đích cho đến khi có thiết kế quan hệ Event an toàn và phê duyệt riêng để khôi phục.
- [PHASE_2A_API_CONTRACT.md](../phase-2a/PHASE_2A_API_CONTRACT.md):
  - Cập nhật Mục `2.5` làm rõ trạng thái tạm thời vô hiệu hóa (`404 NOT_FOUND` cho mọi request) và điều kiện khôi phục `200 QuizVerifyResponse` trong tương lai.

---

## 3. Bằng chứng Kiểm chứng Trực tiếp trên Commit `04fa094914d212590e5ded9785d4dd2ac22a47c1`

Toàn bộ 7 hạng mục kiểm tra được chạy trực tiếp trên mã nguồn đã commit tại `04fa094914d212590e5ded9785d4dd2ac22a47c1`:

| STT | Hạng mục Kiểm tra | Lệnh / Cơ chế Thực thi | Kết quả Quan sát |
|---|---|---|---|
| 1 | Workspace build (`@fpt-campus/shared` + `web`) | `pnpm build` | **PASS** — `shared` `tsc` thành công; `web` Next.js 16.4.6 (Turbopack) biên dịch và sinh 29/29 trang thành công |
| 2 | API TypeScript typecheck | `pnpm --filter api typecheck` | **PASS** — `tsc --noEmit` thoát mã `0`, không lỗi |
| 3 | API ESLint check | `pnpm --filter api lint` | **PASS** — `eslint "src/**/*.ts" "test/**/*.ts"` thoát mã `0`, không cảnh báo/lỗi |
| 4 | API NestJS production build | `pnpm --filter api build` | **PASS** — `nest build` tạo `apps/api/dist/main.js` thành công |
| 5 | Toàn bộ Unit & Integration Tests (`apps/api`) | `pnpm --filter api test` (`jest --runInBand`) | **PASS** — **10/10 test suites**, **35/35 test cases PASS** (gồm `public-isolation`, `rbac-provisioning-activation`, `auth-session`, `health`, `csrf-cors` và 5 unit suites) |
| 6 | Kiểm định Toàn vẹn PostgreSQL Seed & Ràng buộc | `pnpm db:test` (`tsx prisma/verify-db-integrity.ts`) | **PASS** — **13/13 checks PASS** (`0 failed`), `11/11` file local khớp SHA-256 & kích thước, `14/14` AC-07 negative assertions PASS |
| 7 | Live API Smoke Test (`apps/api/dist/main.js` trên port `4099`) | Khởi chạy `node apps/api/dist/main.js` kết nối PostgreSQL chính trên `:5432` | **PASS** — xem chi tiết HTTP & DB bên dưới |

### Chi tiết Live API Smoke Test (`04fa094`)
- `GET /api/v1/health`: HTTP `200`, `data.status = "ok"`.
- `GET /api/v1/public/events`: HTTP `200`, `sessions` gồm đúng `4` phiên công khai, `quizItems: []`, `eventsHasForbidden: false` (không có `correctIndex` hay `explanation`).
- `POST /api/v1/public/quiz/verify` (với `questionId` thực tế `PUBLISHED` lấy từ `open_day_quiz_items`, `selectedIndex: 0`): HTTP `404`, `error.code = "NOT_FOUND"`, `error.message = "Chức năng kiểm tra quiz công khai tạm thời không khả dụng."`, `verifyRealLeaks = false`.
- `POST /api/v1/public/quiz/verify` (với UUID hợp lệ không tồn tại `00000000-0000-4000-8000-000000000099`, `selectedIndex: 0`): HTTP `404`, `error.code = "NOT_FOUND"`.
- `GET /api/v1/admin/users` (không gửi token): HTTP `401`, `error.code = "UNAUTHORIZED"`.
- Đối soát số lượng bản ghi DB chính (`users|audit_logs|tour_nodes|media_assets|open_day_events|open_day_sessions|open_day_faqs|open_day_quiz_items`): `1|1|5|11|1|6|4|3` (không đổi).

---

## 4. Đối chiếu Phạm vi & Tiêu chí Tái nghiệm thu

- **Public quiz isolation:** Đạt — `GET /api/v1/public/events` trả `quizItems: []`; `POST /api/v1/public/quiz/verify` trả `404 NOT_FOUND` cho mọi request (kể cả item `PUBLISHED` thiếu Event FK) trước khi truy vấn DB.
- **Event/Session isolation:** Đạt — kiểm chứng trong `public-isolation.integration.spec.ts` (`5/5 PASS`) và live smoke test (`sessions.length === 4`).
- **Quiz privacy:** Đạt — không rò rỉ `isCorrect`, `correctIndex`, `explanation`, câu hỏi hay đáp án trên cả `GET /public/events` lẫn `POST /public/quiz/verify`.
- **RBAC & CSRF & Regression:** Đạt — toàn bộ `10/10` test suites (`35/35` tests) và `13/13` `db:test` PASS trên commit khắc phục `04fa094`.
- **Scope:** Đạt — `git diff main..04fa094 -- prisma/ apps/web/` trống (`0` thay đổi tại `prisma/` hoặc `apps/web/`); không thêm endpoint/package mới, không bật Redis/BullMQ/MinIO/S3, chưa push và chưa merge vào `main`.
- **Lưu ý hậu kiểm commit tài liệu:** Ngay sau khi commit báo cáo này trên nhánh `feat/phase-2a-2-core-backend`, toàn bộ 7 bước kiểm chứng và kiểm tra liên kết Markdown được chạy lại trên `HEAD` cuối cùng trước khi kết thúc tác vụ.
