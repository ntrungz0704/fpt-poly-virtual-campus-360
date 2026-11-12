# PHASE 2A-2 — FINAL ACCEPTANCE CLARIFICATION (`8f96a67`)

**Ngày xác minh:** 12/11/2026  
**Nhánh Git:** `feat/phase-2a-2-core-backend`  
**HEAD đã xác minh:** `8f96a678f300e17f9408daca1c5a899888a26ea0` (`8f96a67`)  
**Chế độ thực hiện:** **READ-ONLY** — Không sửa code, test, schema hay tài liệu cũ; không tạo commit; không chạy lại bộ test; không push/merge; không mở Phase 2A-3.

---

## Kết luận Trạng thái

**`BLOCKED`**

- **Điểm 2 — Git Ancestry & Verification Integrity:** **`VERIFIED (PASS)`** — Lịch sử commit sạch, `1eb2528` là tổ tiên trực tiếp của `8f96a67`, chỉ có duy nhất file báo cáo được thêm giữa `1eb2528` và `8f96a67`, và toàn bộ 7 bước hậu kiểm đã chạy nguyên vẹn trên đúng `HEAD 8f96a67`.
- **Điểm 1 — Public Quiz Verification Security (`POST /api/v1/public/quiz/verify`):** **`BLOCKED`** — Tuy `GET /api/v1/public/events` đã ngừng liệt kê `quizItems` (`[]`), endpoint công khai `POST /api/v1/public/quiz/verify` vẫn cho phép xác minh trực tiếp các `OpenDayQuizItem` `PUBLISHED` không có quan hệ tới `OpenDayEvent` và trả ra `isCorrect`, `correctIndex`, `explanation` trong HTTP `200` response.

---

## 1. Xác minh Public Quiz Verification Security (`POST /api/v1/public/quiz/verify`)

### 1.1. Bằng chứng Code & Schema trực tiếp
- **Routing công khai:** [`PublicController.verifyQuiz`](../../apps/api/src/modules/public/public.controller.ts#L31-L93) gắn `@Public()` ở cấp controller (`L31`) và mở `@Post("quiz/verify")` (`L89-L93`), nhận [`QuizVerifyDto`](../../apps/api/src/modules/public/dto/public-query.dto.ts#L65-L82) (`items: [{ questionId: UUID, selectedIndex: 0..20 }]`).
- **Schema thực tế ([`prisma/schema.prisma:694-710`](../../prisma/schema.prisma#L694-L710)):** `OpenDayQuizItem` chỉ có `tourNodeId` (`TourNode?`), không có cột `eventId` hoặc FK tới `OpenDayEvent`.
- **Truy vấn & Trả kết quả trong [`PublicService.verifyQuiz`](../../apps/api/src/modules/public/public.service.ts#L1108-L1166):**
  - `L1111-1123`: chỉ lọc `where: { id: { in: questionIds }, status: PublishStatus.PUBLISHED, deletedAt: null }` và select `id`, `optionsJson`, `correctIndex`, `explanation`. Không kiểm tra bất kỳ quan hệ `OpenDayEvent` nào.
  - `L1132-1137`: nếu `!quiz` (`DRAFT`, `deletedAt != null`, hoặc UUID không tồn tại), ném `NotFoundException({ code: "NOT_FOUND", message: ... })` (`HTTP 404`).
  - `L1147-1158`: khi tìm thấy quiz `PUBLISHED && deletedAt === null`, tính `isCorrect = item.selectedIndex === quiz.correctIndex` và trả về trong `results`: `{ questionId, selectedIndex, isCorrect, correctIndex: quiz.correctIndex, explanation: quiz.explanation }` (`HTTP 200`).

### 1.2. Trả lời 4 Câu hỏi Trọng tâm

| Câu hỏi cần làm rõ | Kết luận | Bằng chứng cụ thể (Code & Integration Test) |
|---|---|---|
| **1. Quiz `PUBLISHED` nhưng không có quan hệ Event FK có thể được xác minh qua API không?** | **CÓ** | [`public.service.ts:1111-1116`](../../apps/api/src/modules/public/public.service.ts#L1111-L1116) chỉ yêu cầu `status === PUBLISHED && deletedAt === null`. Chính test [`public-isolation.integration.spec.ts:154-166`](../../apps/api/test/integration/public-isolation.integration.spec.ts#L154-L166) gửi `POST /api/v1/public/quiz/verify` với `seededPublishedQuizzes[0].id` / `[1].id` (các quiz seed `PUBLISHED` không có Event FK) và assert `.expect(200)`. |
| **2. Quiz `DRAFT` và soft-deleted có bị từ chối không?** | **CÓ** | [`public.service.ts:1114-1115,1132-1137`](../../apps/api/src/modules/public/public.service.ts#L1114-L1137) lọc cứng `PUBLISHED` + `deletedAt: null` và ném `404 NOT_FOUND`. Được chứng minh bởi negative tests [`public-isolation.integration.spec.ts:688-708`](../../apps/api/test/integration/public-isolation.integration.spec.ts#L688-L708) (`draftQuiz.id` → `404`, `deletedQuiz.id` → `404`, không chứa `SECRET_DRAFT_QUIZ_EXPLANATION`, `SECRET_DELETED_QUIZ_EXPLANATION` hay `correctIndex`). |
| **3. Response có thể làm lộ `correctIndex`, đáp án, `explanation` hoặc thông tin nhạy cảm khác không?** | **CÓ (đối với mọi Quiz `PUBLISHED` thiếu Event FK)** | Khi gửi một `questionId` UUID của quiz `PUBLISHED` (`deletedAt === null`) kèm `selectedIndex` hợp lệ (VD: `0`), [`public.service.ts:1152-1158`](../../apps/api/src/modules/public/public.service.ts#L1152-L1158) trả thẳng `isCorrect`, `correctIndex` và `explanation` trong HTTP `200` (`public-isolation.integration.spec.ts:165-166`). Đối với `DRAFT` và soft-deleted (`404`), không lộ thông tin đáp án. |
| **4. Nếu Quiz không có Event FK, API có bảo đảm nó không thể được sử dụng như một Quiz công khai hợp lệ không?** | **KHÔNG** | Dù `GET /api/v1/public/events` đã ngừng phát danh sách `quizItems` (`[]`), endpoint `@Public()` `POST /api/v1/public/quiz/verify` vẫn cho phép mọi caller gửi `questionId` UUID (nếu biết từ trước, đoán hoặc nhận qua kênh khác) xác minh bình thường như một Quiz công khai hợp lệ và thu về đáp án + giải thích. |

### 1.3. Mô tả Blocker & Đề xuất Remediation Tối thiểu *(Không tự sửa)*
- **Vị trí blocker:**
  - Logic: [`apps/api/src/modules/public/public.service.ts:1108-1166`](../../apps/api/src/modules/public/public.service.ts#L1108-L1166) (`verifyQuiz`)
  - Test hiện khẳng định HTTP `200` trên quiz không có Event FK: [`apps/api/test/integration/public-isolation.integration.spec.ts:153-167`](../../apps/api/test/integration/public-isolation.integration.spec.ts#L153-L167)
  - Tài liệu đặc tả: [`PHASE_2A_2_IMPLEMENTATION_PLAN.md:164`](../phase-2a/PHASE_2A_2_IMPLEMENTATION_PLAN.md#L164), [`PHASE_2A_API_CONTRACT.md:203-205`](../phase-2a/PHASE_2A_API_CONTRACT.md#L203-L205)
- **Đề xuất remediation tối thiểu (giữ nguyên Prisma schema & không xóa DB):**
  1. Trong `verifyQuiz()` (`public.service.ts`), vì `OpenDayQuizItem` trong schema hiện tại chưa có quan hệ Event an toàn để xác định quyền công khai, từ chối mọi yêu cầu xác minh quiz chưa xác định được quan hệ Event công khai hợp lệ với `HTTP 404 NOT_FOUND` (nhất quán với hành vi `GET /api/v1/public/events` trả `quizItems: []`, tuyệt đối không trả `isCorrect`, `correctIndex`, `explanation`).
  2. Cập nhật [`public-isolation.integration.spec.ts:153-167`](../../apps/api/test/integration/public-isolation.integration.spec.ts#L153-L167) thành negative test chứng minh gọi trực tiếp `POST /api/v1/public/quiz/verify` bằng ID của quiz `PUBLISHED` không có Event FK (`seededPublishedQuizzes[0].id`, `publishedUnlinkedQuiz.id`) bị từ chối `404 NOT_FOUND` và không rò rỉ `isCorrect`, `correctIndex`, `explanation`.
  3. Đồng bộ ghi chú có chủ đích cho `POST /api/v1/public/quiz/verify` trong `PHASE_2A_2_IMPLEMENTATION_PLAN.md` và `PHASE_2A_API_CONTRACT.md` (giữ nguyên toàn bộ `prisma/schema.prisma`, migration, seed và dữ liệu quiz trong PostgreSQL).

---

## 2. Xác minh Git Ancestry & Tính Toàn vẹn Hậu kiểm (`1eb2528` → `8f96a67`)

### 2.1. Kết quả Lệnh Git Thực tế

```text
$ git log --oneline --decorate -5
8f96a67 (HEAD -> feat/phase-2a-2-core-backend) docs(phase-2a-2): add remediation and re-verification report for 1eb2528
1eb2528 fix(api): withhold unlinked quiz items in public events and complete isolation tests
19f6596 docs(phase-2a-2): add final acceptance evidence review of 3a13178
3a13178 feat(api): implement phase 2a-2 core backend, auth, rbac and public isolation
ae83c32 docs(phase-2a-2): lock D-2A2-01..04 decisions and sync api contract

$ git merge-base --is-ancestor 1eb2528 8f96a67
IS_ANCESTOR_EXIT=0

$ git diff --stat 1eb2528..8f96a67
 docs/project-audit/PHASE_2A_2_REMEDIATION_REPORT.md | 113 +++++++++++++++++++++
 1 file changed, 113 insertions(+)

$ git diff --name-status 1eb2528..8f96a67
A	docs/project-audit/PHASE_2A_2_REMEDIATION_REPORT.md

$ git rev-parse HEAD
8f96a678f300e17f9408daca1c5a899888a26ea0

$ git branch -a -v
* feat/phase-2a-2-core-backend 8f96a67 docs(phase-2a-2): add remediation and re-verification report for 1eb2528
  main                         8b6c206 docs: reconcile project documentation after phase 2a-1 acceptance
  remotes/origin/main          8b6c206 docs: reconcile project documentation after phase 2a-1 acceptance
```

### 2.2. Đối chiếu Toàn vẹn Lịch sử & Bằng chứng Hậu kiểm trên `HEAD 8f96a67`
- **Quan hệ Ancestry & Diff:** `1eb2528` (`1eb2528fd1c03508a35d716b52b7261d4af3ae1f`) là cha trực tiếp của `8f96a67` (`IS_ANCESTOR_EXIT=0`). Giữa `1eb2528` và `8f96a67` **chỉ có duy nhất 1 file mới** (`A docs/project-audit/PHASE_2A_2_REMEDIATION_REPORT.md`), **không có bất kỳ chỉnh sửa code, test, Prisma schema/migration hay tài liệu hợp đồng nào chen vào giữa**.
- **Working tree trước khi xuất báo cáo này:** `git status --short` hoàn toàn sạch (`0` file thay đổi/chưa theo dõi); sau khi tạo file này chỉ phát sinh duy nhất file chưa commit `docs/project-audit/PHASE_2A_2_FINAL_ACCEPTANCE_CLARIFICATION.md`.
- **Bằng chứng hậu kiểm trên đúng `HEAD 8f96a67` (log `task-7272`, kết thúc lúc `2026-11-12T05:04:45Z` / `12:04:45 +07:00`):**
  - Log [`steps/7272/output.txt`](file:///C:/Users/ntrun/.gemini/antigravity/brain/b1c1c017-dff8-412c-9a6d-ed4eb843b48d/.system_generated/steps/7272/output.txt) ghi nhận `FINAL_HEAD=8f96a678f300e17f9408daca1c5a899888a26ea0` trước khi chạy và `FINAL_END_HEAD=8f96a678f300e17f9408daca1c5a899888a26ea0` sau khi kết thúc, `git reflog -5` xác nhận không có commit hay amend nào được tạo thêm sau `8f96a67`.
  - Kết quả ghi nhận trực tiếp trên `8f96a67`: `pnpm build` (`29/29` routes PASS), `pnpm --filter api typecheck` PASS, `pnpm --filter api lint` PASS, `pnpm --filter api build` PASS, `pnpm --filter api test` (`10/10` suites, `35/35` tests, `0` failed, `0` skipped, `85.887 s`), `pnpm db:test` (`13/13` checks PASS), live API smoke test PASS (`DB_BEFORE=DB_AFTER=1|1|5|11|1|6|4|3`), `git status --short` sạch.

---

## 3. Khuyến nghị Dừng & Bước Tiếp theo

- **Kết luận cuối cùng:** **`BLOCKED`** — Không đủ điều kiện nghiệm thu cho tới khi Chủ dự án quyết định xử lý lỗ hổng ranh giới công khai trên `POST /api/v1/public/quiz/verify` (khóa xác minh quiz thiếu Event FK hay mở rộng thiết kế schema ở đợt sau).
- Nhánh `feat/phase-2a-2-core-backend` giữ nguyên ở `8f96a67` (**chưa merge, chưa push, chưa mở Phase 2A-3**), dừng chờ quyết định của Chủ dự án.
