# BÁO CÁO KỸ THUẬT HANDOFF — M7.2: QUIZ DELIVERY & ZERO-LEAK SECURITY ENGINE

**Dự án:** FPT Polytechnic Virtual Campus 360°  
**Nhánh:** `fix/m4-acceptance-blockers`  
**Pull Request trên GitHub:** PR #1  
**Thời gian hoàn tất:** 2026-11-15 21:29 (GMT+7)

---

## 1. ĐỐI CHIẾU COMMIT SHA CHÍNH XÁC (FULL SHA TỪ GITHUB)
- **M7.1 Final Code Commit (B01-RACE):** `c6dc56e0ff2e11eb30d3bc09bda4825dac0145ce` (*Đã được Tech Lead nghiệm thu FULL PASS*)
- **M7.1 Final Docs Commit:** `5238946a937a003d5d33cfb503ccfe5938524478` (*Đã được Tech Lead nghiệm thu FULL PASS*)
- **M7.2 Code Commit:** `eaa718d6e45f6cc24723a053ac4ff94fa19b39fa` (`feat(quiz-delivery): implement secure quiz delivery api and portal view with zero-leak guarantee (M7.2)`)
- **M7.2 Docs Commit:** Đi kèm và đồng bộ trực tiếp trên nhánh `fix/m4-acceptance-blockers` ngay sau code commit `eaa718d6e45f6cc24723a053ac4ff94fa19b39fa`.
- **Quy chuẩn Git:** Tuân thủ 100% nguyên tắc tách biệt Code commit và Docs commit, không force-push, remote tip đồng bộ tuyệt đối với local HEAD.

---

## 2. DISCOVERY FINDINGS & QUY TẮC NGHIỆP VỤ XÁC MINH

1. **Cơ chế xác thực & Phân quyền Student Portal:**
   - Sử dụng `JwtAuthGuard` toàn cục kết hợp `@CurrentUser()` decorator.
   - Mọi endpoint tại `/api/v1/portal/quiz/*` đều thực thi kiểm tra nghiêm ngặt `user.userType === "STUDENT"`.
   - Nếu chưa đăng nhập -> `401 Unauthorized`.
   - Nếu tài khoản có vai trò khác (như `PARENT`, `STAFF`) -> `403 Forbidden` (`FORBIDDEN_STUDENT_ONLY`).

2. **Quy tắc Đủ điều kiện Tham gia (Eligibility):**
   - **Bài thi Toàn trường (`eventId === null`):** Tất cả sinh viên đã kích hoạt tài khoản hợp lệ đều có quyền xem và truy cập làm bài thi.
   - **Bài thi Sự kiện (`eventId !== null`):** Sinh viên bắt buộc phải có bản ghi tham gia sự kiện `EventParticipation` tương ứng với `participationStatus !== "CANCELLED"`.
   - Nếu sinh viên chưa đăng ký sự kiện mà cố tình truy cập bài thi gắn với sự kiện đó qua URL ID -> Hệ thống chặn ngay lập tức với `403 Forbidden` (`FORBIDDEN_NOT_ELIGIBLE: "Bạn chưa đăng ký tham gia sự kiện tương ứng với bài thi này."`).

3. **Vòng đời Cấu hình Bài thi (Lifecycle Isolation):**
   - Chỉ các bài thi có `status === "PUBLISHED"` và `deletedAt === null` mới xuất hiện trong danh sách phát đề và cho phép truy cập chi tiết.
   - Bài thi `DRAFT` và `ARCHIVED` bị loại trừ hoàn toàn khỏi danh sách hoạt động và trả về `404 Not Found` khi truy vấn trực tiếp qua ID.
   - Bài thi đã bị xóa mềm (`deletedAt !== null`) trả về `404 Not Found`.

---

## 3. KIẾN TRÚC BẢO MẬT ZERO-LEAK & RESPONSE CONTRACT

### 🔴 Nguyên tắc Tối thượng: Bảo mật Đề thi Khảo thí
Payload gửi về client tuyệt đối không chứa bất kỳ manh mối nào có thể suy ra đáp án trước hoặc trong khi làm bài:
1. **Loại bỏ hoàn toàn ở mức cơ sở dữ liệu:**
   - Service sử dụng Prisma `select` tường minh, **KHÔNG BAO GIỜ** select trường `correctIndex`, `explanation` hay `questionBankItemId`.
2. **Loại bỏ qua Allowlist Response Mapper:**
   - Dữ liệu câu hỏi được map nghiêm ngặt qua `PortalQuizQuestionDeliveryDto`:
     ```ts
     export interface PortalQuizQuestionDeliveryDto {
       id: string; // ID snapshot của câu hỏi
       sortOrder: number;
       questionText: string;
       options: string[]; // Danh sách các phương án [A, B, C, D]
       topic: string;
       difficulty: QuestionDifficulty;
     }
     ```
   - Trường `correctIndex`: **UNDEFINED (100% không xuất hiện trong JSON)**.
   - Trường `explanation`: **UNDEFINED (100% không xuất hiện trong JSON)**.
   - Trường `questionBankItemId`: **UNDEFINED**.
   - Bất kỳ alias hay trường nội bộ nào của Prisma / PostgreSQL: **UNDEFINED**.

### 🟢 API Endpoints Triển khai:
1. **`GET /api/v1/portal/quiz/active`:**
   - Trả về danh sách bài thi đang mở mà sinh viên đủ điều kiện truy cập.
   - DTO: `PortalQuizSummaryDto[]` (chứa `id, title, description, eventId, eventName, timeLimitMinutes, passingScore, maxAttempts, totalQuestions, isShuffleQuestions, isShuffleOptions, publishedAt`).
2. **`GET /api/v1/portal/quiz/:id`:**
   - Trả về chi tiết bài thi và bộ câu hỏi snapshot chuẩn hóa.
   - DTO: `PortalQuizDetailDeliveryDto` (kế thừa summary + danh sách `questions: PortalQuizQuestionDeliveryDto[]`).

---

## 4. CHI TIẾT CÁC FILE THAY ĐỔI & THÊM MỚI

### Backend API:
- `apps/api/src/modules/portal/portal-quiz.controller.ts`: Controller phục vụ các endpoint `/portal/quiz/active` và `/portal/quiz/:id`, bảo vệ bởi `JwtAuthGuard` và kiểm tra quyền `STUDENT`.
- `apps/api/src/modules/portal/portal-quiz.service.ts`: Service xử lý logic lọc đề thi theo quyền, kiểm tra eligibility sự kiện, query snapshot từ PostgreSQL và map dữ liệu allowlist an toàn.
- `apps/api/src/modules/portal/portal.module.ts`: Đăng ký `PortalQuizController` và `PortalQuizService`.
- `apps/api/test/integration/quiz-delivery.integration.spec.ts`: Bộ 10 integration tests chuyên sâu chạy trên PostgreSQL thực tế.

### Frontend Web:
- `apps/web/src/components/portal/PortalNavTabs.tsx`: Bổ sung tab điều hướng `/portal/quiz` (Bài thi trắc nghiệm).
- `apps/web/src/lib/portal/portal-api.ts`: Bổ sung client methods `getActiveQuizzes()` và `getQuizDelivery(quizId)`.
- `apps/web/src/app/(portal)/portal/quiz/page.tsx`: Giao diện phát đề thi trực tuyến cho sinh viên, hỗ trợ đầy đủ Loading, Empty, Error, danh sách bài thi đang mở và màn hình xem đề thi chi tiết với options A-B-C-D bảo mật.

### Shared Package:
- `packages/shared/src/quiz-config.ts`: Khai báo các interface `PortalQuizQuestionDeliveryDto`, `PortalQuizSummaryDto`, `PortalQuizDetailDeliveryDto`.

---

## 5. BẰNG CHỨNG KIỂM THỬ POSTGRESQL (10/10 TESTS PASS)

Bộ integration test `quiz-delivery.integration.spec.ts` được thực thi trực tiếp trên cơ sở dữ liệu PostgreSQL biệt lập:
```
PASS test/integration/quiz-delivery.integration.spec.ts (33.535 s)
  Quiz Delivery Integration Suite (M7.2)
    √ Test 1 [Authentication Security]: Unauthenticated request is rejected (401) (15 ms)
    √ Test 2 [Role Authorization]: Non-student role (PARENT) is rejected (403) (10 ms)
    √ Test 3 [Active Quizzes Delivery]: Returns eligible PUBLISHED quizzes; excludes DRAFT, ARCHIVED, Soft-deleted (14 ms)
    √ Test 4 [Safe Detail Delivery]: Returns questions with ZERO LEAK of correctIndex, explanation, or internal IDs (13 ms)
    √ Test 5 [Event Eligibility]: Student not registered for event is rejected (403) (20 ms)
    √ Test 6 [Lifecycle Guard]: DRAFT and ARCHIVED quizzes reject detail access (404) (15 ms)
    √ Test 7 [Soft-Delete Guard]: Soft-deleted quiz rejects detail access (404) (8 ms)
    √ Test 8 [ID Validation]: Invalid UUID returns 400; non-existent UUID returns 404 (14 ms)
    √ Test 9 [Snapshot Immutability]: Modifying or deleting QuestionBankItem does not change delivered quiz (40 ms)
    √ Test 10 [Regression Guard]: Existing OpenDayQuizItem remains unaffected (38 ms)

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
Snapshots:   0 total
Time:        33.769 s
```

---

## 6. KẾT QUẢ QUALITY GATES TOÀN DỰ ÁN

| Quality Gate | Command | Exit Code | Kết quả chi tiết |
| :--- | :--- | :---: | :--- |
| **M7.2 Integration Tests** | `pnpm --filter api exec jest test/integration/quiz-delivery.integration.spec.ts --runInBand` | **0** | **10/10 tests PASS (33.77s)** trên PostgreSQL |
| **Shared Package Build** | `pnpm --filter shared build` | **0** | `tsc` biên dịch thành công, types cập nhật |
| **API Typecheck** | `pnpm --filter api typecheck` | **0** | `tsc --noEmit` 0 errors |
| **Web Typecheck** | `pnpm --filter web typecheck` | **0** | `tsc --noEmit` 0 errors |
| **API Lint** | `pnpm --filter api lint` | **0** | `eslint` 0 errors |
| **Web Lint** | `pnpm --filter web lint` | **0** | `eslint` 0 errors |
| **API Unit Tests** | `pnpm --filter api test:unit` | **0** | 8 suites, 31 tests PASS (5.69s) |
| **Web Unit Tests** | `pnpm --filter web test:unit` | **0** | 10 tests PASS (139ms) |
| **Production Build** | `pnpm --filter web build` | **0** | 28 static/dynamic routes compiled successfully |

---

## 7. BẢNG ĐỐI CHIẾU TIẾN ĐỘ 9 MODULE (STANDARDIZED EVIDENCE MATRIX)

| Module | Route Admin | Route Người dùng | API Endpoint | Bảng DB (PostgreSQL) | Bằng chứng Kiểm thử Thực tế | Trạng thái Nghiệm thu |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **M1: Users & Excel** | `/admin/users` | `/login`, `/auth/me` | `/api/v1/admin/users/import`, `/api/v1/auth/*` | `users`, `audit_logs` | 13/13 Integration tests PASS | **FULL PASS** *(đã nghiệm thu)* |
| **M2: Media & Tour Studio** | `/admin/media`, `/admin/virtual-tour` | `/campus` | `/api/v1/admin/media`, `/api/v1/admin/scenes` | `media_assets`, `tour_nodes`, `hotspots` | Pre-flight check & integrity test PASS | **FULL PASS** *(đã nghiệm thu)* |
| **M3: Open Day Events** | `/admin/events` | `/events`, `/tickets` | `/api/v1/admin/events`, `/api/v1/public/events` | `open_day_events`, `open_day_sessions`, `tickets` | 15/15 Integration tests PASS | **FULL PASS** *(đã nghiệm thu)* |
| **M4: GIS & Locations** | `/admin/locations` | `/map`, `/locations` | `/api/v1/admin/locations`, `/api/v1/public/locations` | `locations`, `buildings`, `floors`, `location_types`, `audit_logs` | 13/13 Integration tests PASS | **FULL PASS** *(đã nghiệm thu)* |
| **M5: Content CMS (News)** | `/admin/news` | `/news`, `/news/[slug]` | `/api/v1/admin/news`, `/api/v1/public/news` | `news_articles`, `media_assets`, `users`, `audit_logs` | 16/16 Integration tests PASS | **FULL PASS** *(đã nghiệm thu)* |
| **M6: Question Bank** | `/admin/questions` | Ngân hàng câu hỏi trắc nghiệm | `/api/v1/admin/questions` | `question_bank_items`, `users`, `audit_logs` | 12/12 Integration tests PASS: strict enum, trust boundary | **FULL PASS** *(đã nghiệm thu)* |
| **M7.1: Quiz Configuration** | `/admin/events` (Cấu hình Bài thi) | Bộ đề thi chuẩn hóa | `/api/v1/admin/quiz-configs` | `quiz_configurations`, `quiz_config_questions`, `audit_logs` | 13/13 Integration tests PASS: B01-RACE atomic conditional tx | **FULL PASS** *(đã nghiệm thu)* |
| **M7.2: Quiz Delivery** | `/admin/events` | `/portal/quiz` (Phát đề thi) | `/api/v1/portal/quiz/active`, `/api/v1/portal/quiz/:id` | `quiz_configurations`, `quiz_config_questions`, `event_participations` | **10/10 Integration tests PASS (33.77s)**: Zero-leak guarantee | **HOÀN TẤT TRIỂN KHAI — SẴN SÀNG FULL PASS** |
| **M7.3: Quiz Attempt** | Giám sát phòng thi | `/portal/quiz/:attemptId` | `/api/v1/portal/quiz/start`, `/api/v1/portal/quiz/save-progress` | `quiz_attempts`, `quiz_attempt_answers` | Chờ M7.2 nghiệm thu | **PENDING (Kế tiếp)** |
| **M7.4: Scoring & XP** | Thống kê điểm thi | Chấm điểm tự động & Nhận XP | `/api/v1/portal/quiz/submit` | `quiz_attempts`, `xp_ledgers` | Chờ M7.3 hoàn tất | **PENDING** |
| **M7.5: Results & Recovery**| Báo cáo kết quả bài thi | Lịch sử thi & Chứng nhận | `/api/v1/portal/quiz/history` | `quiz_attempts` | Chờ M7.4 hoàn tất | **PENDING** |
| **M8: Open Day Check-in** | Quét QR Check-in | Vé điện tử & Vòng quay may mắn | `/api/v1/admin/check-in`, `/api/v1/portal/gamification/*` | `event_participations`, `user_spin_histories`, `xp_ledgers` | Baseline đã hoạt động | **SẴN SÀNG ĐÓNG GÓI** |
| **M9: Student & Parent** | Quản lý liên kết phụ huynh | `/portal/*`, `/parent/*` | `/api/v1/portal/*`, `/api/v1/parent/*` | `parent_student_links`, `users` | 13/13 Integration tests PASS | **SẴN SÀNG ĐÓNG GÓI** |

---

## 8. BẢO CHỨNG PHẠM VI (SCOPE GUARD)
- Tuyệt đối chỉ triển khai phạm vi của M7.2: phát đề thi an toàn, kiểm soát quyền truy cập, không rò rỉ đáp án.
- Không triển khai trước M7.3 (Quiz Attempt), M7.4 (Scoring & XP) hay M7.5 (Results).
- Giữ nguyên vẹn 100% tính năng OpenDayQuizItem và các module đã nghiệm thu M1–M7.1.
- Sẵn sàng kích hoạt M7.3 (Quiz Attempt) ngay khi Tech Lead ký nghiệm thu FULL PASS!

---

## 9. GIẢI TRÌNH NGHIỆP VỤ & BẰNG CHỨNG HỒI QUY THEO YÊU CẦU TECH LEAD (B01 & B02)

### B01. PHÂN TÍCH CHÍNH SÁCH ĐIỀU KIỆN DỰ THI THEO SỰ KIỆN (EVENT ELIGIBILITY POLICY)
Qua rà soát toàn bộ codebase và cấu trúc Enum `ParticipationStatus` (`INVITED`, `CONFIRMED`, `CHECKED_IN`, `CANCELLED`), hệ thống ghi nhận hiện trạng nghiệp vụ như sau:
- `CONFIRMED`: Sinh viên đăng ký tham gia sự kiện công khai qua trang web (`public.service.ts`).
- `CHECKED_IN`: Sinh viên đã quét mã QR tại cổng sự kiện Open Day (`open-day.service.ts`).
- `INVITED`: Sinh viên thuộc danh sách được ban tổ chức gửi thư mời trực tiếp qua hệ thống quản trị (`users-rbac.service.ts`).
- `CANCELLED`: Sinh viên đã chủ động hủy tham gia hoặc bị ban tổ chức thu hồi vé.

**Hai phương án nghiệp vụ theo góc nhìn kiến trúc:**
- **Phương án A (Hiện tại - Inclusive):** `participationStatus: { not: "CANCELLED" }`. Cho phép sinh viên có trạng thái `CONFIRMED`, `CHECKED_IN`, và `INVITED` được tiếp cận và làm bài thi liên kết sự kiện. Ưu điểm: Đảm bảo sinh viên được ban tổ chức mời đặc cách (`INVITED`) không bị chặn oan khi sự kiện chưa mở cổng check-in; sinh viên đã đăng ký (`CONFIRMED`) có thể làm bài khảo sát chuẩn bị trước sự kiện.
- **Phương án B (Strict):** `participationStatus: { in: ["CONFIRMED", "CHECKED_IN"] }`. Chỉ cho phép sinh viên đã chủ động xác nhận đăng ký hoặc đã có mặt thực tế tại hội trường làm bài thi.
- **Hành động & Bảo chứng:** Nhằm tôn trọng quyết định của Product Owner / Tech Lead mà không tự ý áp đặt, mã nguồn hiện tại giữ **Phương án A** làm mặc định, đồng thời đã cập nhật **Test 5** trong `quiz-delivery.integration.spec.ts` kiểm thử toàn diện toàn bộ ma trận 5 trường hợp (`CONFIRMED` -> 200, `CHECKED_IN` -> 200, `INVITED` -> 200, `CANCELLED` -> 403, Chưa đăng ký -> 403). Nếu PO chỉ định chuyển sang Phương án B, chỉ cần thay đổi 1 dòng điều kiện query mà không gây bất kỳ tác động phụ nào.

### B02. BẰNG CHỨNG CHẠY THẬT BỘ TEST HỒI QUY (POSTGRESQL REAL DB)
Tất cả 3 bộ test tích hợp liên quan trực tiếp đến Question Bank và Quiz Engine đã được chạy tuần tự độc lập trên PostgreSQL:

1. **M7.2 Quiz Delivery Integration Suite (`quiz-delivery.integration.spec.ts`):**
   - Lệnh: `pnpm --filter api exec jest test/integration/quiz-delivery.integration.spec.ts --runInBand`
   - Exit code: **0**
   - Kết quả: **10/10 tests PASS** (27.03 s)
   - Chi tiết: Test 5 kiểm tra đầy đủ cả 5 trạng thái sinh viên (`CONFIRMED`, `CHECKED_IN`, `INVITED`, `CANCELLED`, Unregistered). Test 4 bảo chứng Zero-leak 100%.

2. **M7.1 Quiz Configuration Integration Suite (`quiz-config.integration.spec.ts`):**
   - Lệnh: `pnpm --filter api exec jest test/integration/quiz-config.integration.spec.ts --runInBand`
   - Exit code: **0**
   - Kết quả: **13/13 tests PASS** (30.34 s)
   - Chi tiết: Toàn bộ kiểm thử bất biến cấu hình, concurrency race condition (B01-RACE) đều đạt tuyệt đối.

3. **M6 Question Bank Integration Suite (`question-bank.integration.spec.ts`):**
   - Lệnh: `pnpm --filter api exec jest test/integration/question-bank.integration.spec.ts --runInBand`
   - Exit code: **0**
   - Kết quả: **12/12 tests PASS** (25.69 s)
   - Chi tiết: Nghiệm thu hoàn tất import Excel, strict enum difficulty/status, và server-side validation.

