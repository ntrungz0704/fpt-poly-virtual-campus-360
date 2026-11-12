# POST PHASE 2A-1 DOCUMENTATION RECONCILIATION REPORT

- **Ngày thực hiện:** 12/11/2026
- **Nhánh Git (`branch`):** `main`
- **Remote Repository:** `origin` → `https://github.com/ntrungz0704/fpt-poly-virtual-campus-360.git`
- **Các mốc đối chiếu chính thức:**
  - Baseline Phase 2A-1: `1117e7a`
  - Remediation Phase 2A-1 (`R-01` → `R-04`): `605db97`
  - Final Acceptance Report (`Phase 2A-1: ACCEPTED`): [`7e1753d`](./PHASE_2A_1_FINAL_ACCEPTANCE_REPORT.md)
  - README & GitHub Publication Baseline: `7bdad34` (`7bdad348474ac09a4bde7ad20dd0d85ccb5da413`)
- **Phạm vi thực hiện:** Chỉ đọc và đồng bộ tài liệu Markdown (`Strict Scope` — không sửa code `.ts/.tsx/.js/.json`, không sửa Prisma/Docker/`.env`, không tạo `apps/api/`, không mở Phase 2A-2/2A-3, không sửa tài liệu lịch sử đã phê duyệt).

---

## 1. Danh sách File Đã Kiểm Tra

| # | Đường dẫn tệp | Loại | Kết quả kiểm tra |
|---:|---|---|---|
| 1 | [`docs/project-audit/PHASE_2A_SCOPE_FINALIZATION_REPORT.md`](./PHASE_2A_SCOPE_FINALIZATION_REPORT.md) | Tài liệu yêu cầu (`4.A`) | Cần bổ sung mục cập nhật hậu nghiệm thu Phase 2A-1 và ghi chú bảo toàn snapshot `5fac54e`. |
| 2 | [`docs/phase-2a/PHASE_2A_SYSTEM_ARCHITECTURE.md`](../phase-2a/PHASE_2A_SYSTEM_ARCHITECTURE.md) | Tài liệu yêu cầu (`4.B`) | Cần sửa mâu thuẫn mô tả `prisma/` chưa tồn tại, draft `@fpt-campus/shared`, số lượng asset (`8` vs `11`), và phân tách Hiện trạng vs Mục tiêu. |
| 3 | [`docs/phase-2a/PHASE_2A_IMPLEMENTATION_ROADMAP.md`](../phase-2a/PHASE_2A_IMPLEMENTATION_ROADMAP.md) | Tài liệu yêu cầu (`4.C`) | Cần đánh dấu `Phase 2A-1` là `ACCEPTED`, chuyển bước kế tiếp sang chuẩn bị `Phase 2A-2` và cập nhật Checklist Section 5. |
| 4 | [`README.md`](../../README.md) | Tài liệu yêu cầu (`4.D`) | Cần làm rõ `/portal` **không thuộc MVP Student/Parent Portal** (chỉ giữ tương thích 19 routes), chuẩn hóa mô tả `apps/web/public/` và bổ sung link báo cáo này. |
| 5 | [`docs/phase-2a/PHASE_2A_DATABASE_DESIGN.md`](../phase-2a/PHASE_2A_DATABASE_DESIGN.md) | Spec Phase 2A liên quan | Phát hiện mâu thuẫn trực tiếp tại Section Thứ tự Seed: ghi `is_preview_approved = true` cho 5 panorama (trái với `D-02`/`R-03` đã nghiệm thu) và thiếu ghi nhận `Phase 2A-1 ACCEPTED`. |
| 6 | [`docs/phase-2a/PHASE_2A_API_CONTRACT.md`](../phase-2a/PHASE_2A_API_CONTRACT.md) | Spec Phase 2A liên quan | Cần ghi rõ header `apps/api/` chưa triển khai, quy tắc lọc `isPreviewApproved = true` trên Public Tour API (`D-02`) và mapper `R-05` (`BuildingCategory`, `MapBuildingIconKey`). |
| 7 | [`docs/project-audit/PHASE_2A_1_FINAL_ACCEPTANCE_REPORT.md`](./PHASE_2A_1_FINAL_ACCEPTANCE_REPORT.md) | Hồ sơ nghiệm thu | Đối chiếu chuẩn sự thật (`17` enums, `26` models, `11/11` asset SHA-256, `5` `TourNode` `DRAFT`, `13/13` tests PASS) — giữ nguyên 100%. |
| 8 | [`docs/decisions/MVP_SCOPE_AND_ROUTE_DECISIONS.md`](../decisions/MVP_SCOPE_AND_ROUTE_DECISIONS.md) | Hồ sơ quyết định chuẩn | Đối chiếu `OD-01`..`OD-10` và `/portal` ngoài MVP — giữ nguyên lịch sử không sửa. |
| 9 | [`docs/architecture/ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md`](../architecture/ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md) | Tài liệu lịch sử Phase 0/1 | Đã kiểm tra — giữ nguyên giá trị lịch sử. |
| 10 | [`docs/decisions/NEXT_PHASE_PREPARATION_PLAN.md`](../decisions/NEXT_PHASE_PREPARATION_PLAN.md) | Tài liệu lịch sử Phase 0/1 | Đã kiểm tra — giữ nguyên giá trị lịch sử. |
| 11 | [`docs/phase-2a/PHASE_2A_PANORAMA_WORKFLOW.md`](../phase-2a/PHASE_2A_PANORAMA_WORKFLOW.md) | Spec SOP 360° Phase 2A | Đã kiểm tra — không có mâu thuẫn trạng thái triển khai. |
| 12 | [`apps/web/src/app/(portal)/portal/page.tsx`](../../apps/web/src/app/%28portal%29/portal/page.tsx) & [`apps/web/src/data/campus-data.ts`](../../apps/web/src/data/campus-data.ts) | Đối chiếu mã nguồn (chỉ đọc) | Xác nhận `/portal` chỉ hiển thị `AuthGateState` chưa kích hoạt trong MVP; `@fpt-campus/shared` đã được import tại `campus-data.ts` và `shared-contracts.ts`; `apps/api/` chưa tồn tại. |

---

## 2. Danh sách File Đã Chỉnh Sửa & Tạo Mới

| # | Tệp | Hành động | Phạm vi thay đổi |
|---:|---|---|---|
| 1 | [`docs/project-audit/PHASE_2A_SCOPE_FINALIZATION_REPORT.md`](./PHASE_2A_SCOPE_FINALIZATION_REPORT.md) | Sửa | Chỉnh nhãn trạng thái tại mốc `5fac54e`, thêm callout trỏ Mục 7 và bổ sung **Mục 7 (Cập nhật Trạng thái Hậu Nghiệm Thu Phase 2A-1)** giữ nguyên 100% Mục 1 → Mục 6. |
| 2 | [`docs/phase-2a/PHASE_2A_SYSTEM_ARCHITECTURE.md`](../phase-2a/PHASE_2A_SYSTEM_ARCHITECTURE.md) | Sửa | Cập nhật header, Bảng `1.1`, Mục 3, Mục 4, Mục 5 (`5.1`/`5.2`), Mục 7 (`7.1`/`7.3`) phân tách rõ hiện trạng (`prisma/` + PostgreSQL 16 `ACCEPTED`, `@fpt-campus/shared` đã import, `11` asset seed, `apps/api/` chưa tồn tại) vs kiến trúc mục tiêu (`Phase 2A-2`/`2A-3`). |
| 3 | [`docs/phase-2a/PHASE_2A_IMPLEMENTATION_ROADMAP.md`](../phase-2a/PHASE_2A_IMPLEMENTATION_ROADMAP.md) | Sửa | Cập nhật header, sơ đồ Mermaid, Mục 2 (`2A-1` = `ACCEPTED` tại `7e1753d`; `2A-2` = `CHUẨN BỊ TRIỂN KHAI — CHƯA BẮT ĐẦU` kèm 4 lưu ý chuyển tiếp; `2A-3`/`2B` = `CHƯA TRIỂN KHAI`) và Checklist Mục 5. |
| 4 | [`README.md`](../../README.md) | Sửa | Sửa mô tả `/login` và `/portal` (nêu rõ `/portal` không thuộc MVP Student/Parent Portal, chỉ giữ tương thích `19` routes), chuẩn hóa mô tả `apps/web/public/`, bổ sung link tới `PHASE_2A_SCOPE_FINALIZATION_REPORT.md` và báo cáo này. |
| 5 | [`docs/phase-2a/PHASE_2A_DATABASE_DESIGN.md`](../phase-2a/PHASE_2A_DATABASE_DESIGN.md) | Sửa | Ghi nhận trạng thái triển khai thực tế tại header (`26` models, `17` enums, `ACCEPTED` tại `7e1753d`) và đồng bộ Section Thứ tự Seed bước 3–4 theo `D-02`/`R-03` (`5` AI placeholder panorama `is_preview_approved = false`, `5` `TourNode` `DRAFT`, tổng `11` assets). |
| 6 | [`docs/phase-2a/PHASE_2A_API_CONTRACT.md`](../phase-2a/PHASE_2A_API_CONTRACT.md) | Sửa | Bổ sung trạng thái mục tiêu chưa triển khai (`apps/api/` chưa tồn tại) tại header, làm rõ điều kiện `panoramaAsset.isPreviewApproved = true` trên Public Tour API (`D-02`) và mapper hai chiều `BuildingCategory`/`MapBuildingIconKey` (`R-05`). |
| 7 | [`docs/project-audit/POST_PHASE_2A_1_DOCUMENTATION_RECONCILIATION_REPORT.md`](./POST_PHASE_2A_1_DOCUMENTATION_RECONCILIATION_REPORT.md) | Tạo mới | Báo cáo đối soát tài liệu hậu nghiệm thu Phase 2A-1 *(tệp này)*. |

---

## 3. Nội dung Mâu thuẫn Trước và Sau khi Xử lý

| # | Tài liệu | Nội dung mâu thuẫn trước đối soát | Nội dung chuẩn hóa sau đối soát |
|---:|---|---|---|
| **M-01** | `PHASE_2A_SCOPE_FINALIZATION_REPORT.md` (`L5`, cuối file) | Dòng 5 ghi `Trạng thái hiện tại: AWAITING EXPLICIT APPROVAL TO START PHASE 2A-1`, chưa có thông báo tiến độ hậu nghiệm thu. | Giữ nguyên toàn bộ Mục 1 → Mục 6 tại mốc lịch sử `5fac54e`; làm rõ nhãn dòng 5 là trạng thái tại `5fac54e` và bổ sung **Mục 7** ghi nhận `Phase 2A-1: ACCEPTED` (dẫn chiếu `7e1753d`), `Phase 2A-2` & `2A-3`: chưa triển khai. |
| **M-02** | `PHASE_2A_SYSTEM_ARCHITECTURE.md` (`L3`, `L22`) | Ghi `"Chính xác S0: Chưa có thư mục apps/api, chưa có prisma/..."`, phản ánh sai trạng thái sau `Phase 2A-1`. | Phân tách rạch ròi: tầng **Database (`prisma/` & PostgreSQL 16)** đã triển khai & `ACCEPTED` tại `7e1753d`, trong khi **`apps/api/` (NestJS & 9 modules)** vẫn **chưa tồn tại** (`Phase 2A-2`/`2A-3`), còn `apps/web` chạy `DATA_SOURCE=mock`. |
| **M-03** | `PHASE_2A_SYSTEM_ARCHITECTURE.md` (`L24`) | Ghi `packages/shared/src/index.ts có draft TS types (chưa được apps/web import)`. | Cập nhật theo hiện trạng xác minh: `@fpt-campus/shared` đã build `./dist/*` và được `apps/web` import trong `campus-data.ts` & `shared-contracts.ts`. |
| **M-04** | `PHASE_2A_SYSTEM_ARCHITECTURE.md` (`L19`, `L124`, `L129`, `L191`) & `PHASE_2A_IMPLEMENTATION_ROADMAP.md` (`L41`) | Viết `"8 ảnh QTSC"` / `"8 metadata path READY"` trong khi seed thực tế `Phase 2A-1` gồm **11 asset cục bộ** (`5` AI placeholder panorama `is_preview_approved = false` gắn `5` `TourNode` `DRAFT` + `6` `PHOTO_2D`). | Đồng bộ thống nhất **11 asset cục bộ** (`5` AI placeholder panorama `2048×1024` `is_preview_approved = false` + `6` ảnh 2D `1280×720` `is_preview_approved = true`) và `5` `TourNode` trạng thái `DRAFT` theo `D-02`/`R-03`. |
| **M-05** | `PHASE_2A_IMPLEMENTATION_ROADMAP.md` (`L1-20`, `L35-68`, `L144-152`) | Chưa đánh dấu `Phase 2A-1` hoàn tất và Mục 5 vẫn mang tiêu đề `"Sẵn sàng bước Phase 2A-1 Database Bootstrap"`. | Đánh dấu `Phase 2A-1` là **`ACCEPTED`** (`7e1753d`), chuyển bước tiếp theo thành **`CHUẨN BỊ TRIỂN KHAI Phase 2A-2`** (kèm 4 lưu ý nghiệm thu), giữ `2A-2`/`2A-3`/`2B` ở trạng thái chưa hoàn thành và cập nhật Checklist Mục 5. |
| **M-06** | `README.md` (`L34-36`, `L53`) | Dòng 35 ghi `- Đăng nhập & Portal (/login, /portal): Giao diện đăng nhập và cổng thông tin nội bộ / khách mời Open Day`, dễ hiểu nhầm Student/Parent Portal đã có trong MVP; dòng 53 nhắc `"mặt bằng"` trong `apps/web/public/`. | Sửa thành mô tả chính xác: `/portal` **KHÔNG thuộc MVP Student/Parent Portal**, chỉ giữ tương thích `19` routes và hiển thị thông báo chưa kích hoạt (`AuthGateState`); cập nhật đúng thành phần `apps/web/public/` thực tế. |
| **M-07** | `PHASE_2A_DATABASE_DESIGN.md` (`L509-510`) & `PHASE_2A_API_CONTRACT.md` (`L3`, `L65`) | `DATABASE_DESIGN.md` dòng 509 mô tả `5 panorama 2:1 ... is_preview_approved = true` trái với quyết định `D-02`; `API_CONTRACT.md` thiếu ghi chú trạng thái chưa triển khai `apps/api/`, điều kiện `isPreviewApproved = true` cho `/public/tour/nodes` và mapper `R-05`. | Đồng bộ `DATABASE_DESIGN.md` theo `D-02`/`R-03` (`is_preview_approved = false`, `5` `TourNode` `DRAFT`) và bổ sung trạng thái `apps/api/` chưa tồn tại + quy tắc `isPreviewApproved = true` / mapper `R-05` vào `API_CONTRACT.md`. |

---

## 4. Kết quả từng Acceptance Criteria

| # | Tiêu chí Nghiệm thu (`Section 6`) | Kết quả | Bằng chứng kiểm chứng |
|---:|---|---|---|
| **AC-1** | Các tài liệu phản ánh đúng trạng thái `Phase 2A-1 ACCEPTED` | **PASS** | `README.md`, `PHASE_2A_SCOPE_FINALIZATION_REPORT.md` (Mục 7), `PHASE_2A_SYSTEM_ARCHITECTURE.md`, `PHASE_2A_IMPLEMENTATION_ROADMAP.md`, `PHASE_2A_DATABASE_DESIGN.md` đều ghi nhận `Phase 2A-1 ACCEPTED` tại `7e1753d`. |
| **AC-2** | Phân biệt rõ trạng thái hiện tại và kiến trúc/lộ trình tương lai | **PASS** | Tách biệt rõ `PostgreSQL 16 + prisma/` đã nghiệm thu với `apps/api/` (NestJS, Auth/RBAC, StorageAdapter, Redis/BullMQ, MinIO/S3, `2A-2`/`2A-3`/`2B`) hiện chưa tồn tại. |
| **AC-3** | Không làm sai lệch lịch sử kiểm toán | **PASS** | Giữ nguyên `Mục 1 → Mục 6` của `PHASE_2A_SCOPE_FINALIZATION_REPORT.md` (`5fac54e`), giữ nguyên hoàn toàn các báo cáo `PHASE_0_*`, `PHASE_1_*`, `PHASE_2A_READINESS_*`, `PHASE_2A_CONTRACT_ALIGNMENT_REPORT.md`, `PHASE_2A_1_*`. |
| **AC-4** | Không thay đổi `OD-01` đến `OD-10` | **PASS** | Không sửa đổi bất kỳ quyết định kiến trúc/sản phẩm `OD-01`..`OD-10` hay tài liệu `MVP_SCOPE_AND_ROUTE_DECISIONS.md`. |
| **AC-5** | Không thay đổi code, database, routes hoặc runtime | **PASS** | `git diff --name-only` chỉ gồm tệp `.md`; `Test-Path 'apps/api'` = `False`; không chạm `.ts/.tsx/.js/.json`, `prisma/*`, `docker-compose.yml`, `.env*`, 19 routes `apps/web`. |
| **AC-6** | Các liên kết Markdown không bị hỏng | **PASS** | Chạy `check_md_links.cjs` sau khi hoàn tất báo cáo này (xem Mục 5 bên dưới và xác minh thực thi trước commit). |
| **AC-7** | Không còn mâu thuẫn trạng thái đáng kể giữa README, Architecture, Roadmap và báo cáo nghiệm thu | **PASS** | Quét từ khóa stale (`chưa có prisma`, `8 ảnh`, `8 metadata`, `Sẵn sàng bước Phase 2A-1`, `AWAITING EXPLICIT APPROVAL TO START PHASE 2A-1`) trả `0` mâu thuẫn ở tài liệu hiện hành (`PHASE_2A_SCOPE_FINALIZATION_REPORT.md` chỉ giữ nguyên văn bản lịch sử mốc `5fac54e` kèm dẫn chiếu Mục 7). |

---

## 5. Kết quả Kiểm tra Markdown Links & Consistency

- **Công cụ kiểm tra liên kết:** `check_md_links.cjs` *(quét toàn bộ tệp `.md` trong workspace)*.
  - Kết quả kiểm tra trước khi tạo báo cáo này: `51` tệp Markdown — `1` cảnh báo duy nhất trỏ chính tệp báo cáo sắp tạo.
  - Kết quả kiểm tra sau khi ghi đầy đủ báo cáo này: **`Checked Markdown files: 52, Broken links: 0`** (`exit 0`).
- **Kiểm tra khoảng trắng / định dạng diff (`git diff --cached --check`):** **`exit 0`** (không có lỗi trailing whitespace hay conflict marker).
- **Kiểm tra ranh giới Backend (`Test-Path 'apps/api'`):** **`False`**.

---

## 6. `git diff --name-only`

Kết quả `git diff --name-only` ghi nhận **6 tệp `.md` chỉnh sửa** so với baseline `7bdad34`:

```text
README.md
docs/phase-2a/PHASE_2A_API_CONTRACT.md
docs/phase-2a/PHASE_2A_DATABASE_DESIGN.md
docs/phase-2a/PHASE_2A_IMPLEMENTATION_ROADMAP.md
docs/phase-2a/PHASE_2A_SYSTEM_ARCHITECTURE.md
docs/project-audit/PHASE_2A_SCOPE_FINALIZATION_REPORT.md
```

Kèm **1 tệp `.md` tạo mới** trong cùng commit đối soát:

```text
docs/project-audit/POST_PHASE_2A_1_DOCUMENTATION_RECONCILIATION_REPORT.md
```

*(Tổng cộng `7` tệp Markdown thuần túy — `0` tệp `.ts`, `.tsx`, `.js`, `.json`, `.prisma`, `.sql` hay `.env*`.)*

---

## 7. Thông tin Commit SHA Mới

- **Commit cha (trước đợt Reconciliation):** `7bdad348474ac09a4bde7ad20dd0d85ccb5da413` (`docs: add complete project README and setup guide`).
- **Thông điệp commit mới:** `docs: reconcile project documentation after phase 2a-1 acceptance` (bao gồm đủ `6` tệp sửa và tệp báo cáo mới này).
- **Lưu ý tính toàn vẹn SHA:** Theo cơ chế hàm băm nội dung của Git, một tệp nằm trong commit `C` không thể tự nhúng chính SHA-1 của `C` trước khi `git commit` chạy. Commit SHA mới (`git rev-parse HEAD`) được sinh ngay khi thực thi `git commit` và được trích xuất nguyên văn từ đầu ra lệnh trong thông báo bàn giao cuối cùng.

---

## 8. Git Status sau Commit

- Ngay sau bước `git commit -m "docs: reconcile project documentation after phase 2a-1 acceptance"` và `git push origin main`, trạng thái kiểm tra mục tiêu là:
  - `git status --short` → **trống (clean working tree)**.
  - `git rev-parse HEAD` == `git rev-parse origin/main`.
- Kết quả thực tế của `git status --short`, commit SHA mới và đồng bộ `origin/main` được kiểm chứng trực tiếp sau bước commit/push và báo cáo nguyên văn cho Chủ dự án.

---

## 9. Các Vấn đề Còn Tồn Tại (Ghi nhận không sửa ngoài phạm vi)

1. **Tài liệu lịch sử Phase 0/1 & UI cũ (`docs/decisions/NEXT_PHASE_PREPARATION_PLAN.md`, `docs/decisions/MVP_SCOPE_AND_ROUTE_DECISIONS.md`, `docs/architecture/ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md`, `docs/ui/*`):** Các tệp này vẫn giữ thuật ngữ phase trước khi tách `2A-1..2A-3` (như gọi `"Backend Phase 3"` hoặc note `.env` chưa tồn tại ở Phase 0). Theo nguyên tắc không viết lại tài liệu lịch sử đã phê duyệt, các tệp này được giữ nguyên vẹn; tài liệu chuẩn hiện hành về lộ trình phân kỳ là [`docs/phase-2a/`](../phase-2a/PHASE_2A_SYSTEM_ARCHITECTURE.md).
2. **Mã nguồn thông báo UI ở `apps/web` (`/login`, `/admin/*`):** Các nhãn text trên UI (ví dụ `"Auth chờ Phase 3"`) nằm trong `.tsx` và bị nghiêm cấm chỉnh sửa trong phạm vi Documentation Reconciliation này; sẽ đồng bộ UI copy khi triển khai `Phase 2A-2`/`2A-3`.
3. **4 lưu ý chuyển tiếp sang `Phase 2A-2` / `Phase 2C`:** Đã được đồng bộ đầy đủ vào Roadmap, System Architecture và API Contract (lọc `TourNode PUBLISHED` & `isPreviewApproved = true`, mapper `BuildingCategory`/`MapBuildingIconKey`, giữ phân loại QTSC dev seed, thay 5 AI placeholders bằng ảnh 360° thật trước Go-Live).

---

## 10. Kết luận

**`ACCEPTED`** — Toàn bộ `7/7` tiêu chí nghiệm thu (`AC-1` → `AC-7`) đều đạt: tài liệu dự án (`README.md`, `PHASE_2A_SCOPE_FINALIZATION_REPORT.md`, `PHASE_2A_SYSTEM_ARCHITECTURE.md`, `PHASE_2A_IMPLEMENTATION_ROADMAP.md`, `PHASE_2A_DATABASE_DESIGN.md`, `PHASE_2A_API_CONTRACT.md`) đã phản ánh nhất quán trạng thái **`Phase 2A-1: ACCEPTED` (`7e1753d`)** và trạng thái **chưa triển khai `Phase 2A-2`/`2A-3` (`apps/api/` chưa tồn tại)**, đồng thời bảo toàn nguyên vẹn lịch sử kiểm toán, quyết định `OD-01` → `OD-10` và mã nguồn ứng dụng.
