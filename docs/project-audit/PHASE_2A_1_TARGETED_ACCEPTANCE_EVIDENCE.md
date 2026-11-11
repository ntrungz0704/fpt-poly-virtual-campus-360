# PHASE 2A-1 — TARGETED ACCEPTANCE EVIDENCE REPORT (FORENSIC VERIFICATION)

**Ngày lập báo cáo:** 12/11/2026  
**Mục tiêu kiểm tra:** Xác minh thực chứng có đối chiếu hai vấn đề `P1` trong đợt thẩm định sơ bộ [`PHASE_2A_1_DATABASE_BOOTSTRAP_REPORT.md`](./PHASE_2A_1_DATABASE_BOOTSTRAP_REPORT.md) (`HEAD = 1117e7a`, nhánh `main`): (1) Sai khác số lượng Prisma Enum `17` vs `18`, và (2) Tính hợp lệ 360° equirectangular thực tế của 5 ảnh panorama trong seed PostgreSQL QTSC.  
**Phạm vi thực hiện:** Chỉ đọc, kiểm tra chéo tài liệu/Git/PostgreSQL/tệp ảnh trên đĩa và xuất duy nhất tài liệu bằng chứng này — **không sửa mã nguồn, schema, migration, seed, ảnh hay tài liệu cũ; không tạo commit; chưa mở Phase 2A-2**.

---

## 1. Executive Summary

| Hạng mục trọng tâm | Kết quả thực chứng trực tiếp | Trạng thái đánh giá |
|---|---|---|
| **Vấn đề `P1-1`: Số lượng Enum (`17` vs `18`)** | Tài liệu đặc tả nguồn [`PHASE_2A_DATABASE_DESIGN.md`](../phase-2a/PHASE_2A_DATABASE_DESIGN.md) Mục 4, [`prisma/schema.prisma`](../../prisma/schema.prisma), [`migration.sql`](../../prisma/migrations/20261111175635_init/migration.sql) và PostgreSQL sống (`pg_type` `typtype = 'e'`) đều khớp **17 enums**. Con số `"18"` trong 4 tài liệu tổng hợp phát sinh do lỗi cộng nhầm `13 + 5 = 18` từ câu liệt kê 5 tên tại `OD-06` trong khi `PublishStatus` đã có sẵn trong nhóm 13 enum gốc (`13 + 4 = 17` enum thực tăng). Không thiếu enum nghiệp vụ nào. | **VERIFIED** *(kỹ thuật 17 là nhất quán)* + **OWNER DECISION REQUIRED** *(chốt chuẩn hóa text `"18"` → `"17"`)* |
| **Vấn đề `P1-2`: 5 Panorama 360° trong seed QTSC** | Cả 5 tệp đều đạt pixel container `2048×1024` (`2:1`), nên `is_valid_2_to_1 = true` về mặt kích thước tệp JPEG; **tuy nhiên 0/5 tệp là ảnh chụp panorama 360°×180° thực tế tại QTSC**. Cả 5 đều là ảnh AI `16:9` (`1376×768`) được kéo giãn sang `2048×1024` kèm làm mờ nối mép `128px`, **không có EXIF/XMP `GPano`**, lộ đường ghép dọc ở biên `±180°`, thiếu cực đỉnh/đáy, `auditorium-360.jpg` thực chất là ảnh phối cảnh thẳng (`rectilinear`) dùng chung nguồn 16:9 với `auditorium-hall.jpg`, còn `it-lab-360.jpg` chứa chữ AI biến dạng. | **UNVERIFIED (FAIL chuẩn 360°×180° & QTSC thực)** + **OWNER DECISION REQUIRED** *(phê duyệt thay bằng ảnh thật hay gắn nhãn mock/exception tạm thời)* |
| **Phát hiện mới (Bug dữ liệu `P1` trong Phase 2A-1)** | **`imac-studio-360.jpg` lệch SHA-256 giữa `prisma/seed.ts:279` (`CHAR(64)` chỉ 63 ký tự hex + 1 khoảng trắng đệm) và file thực tế trên đĩa**, vì [`prisma/verify-db-integrity.ts`](../../prisma/verify-db-integrity.ts) (`AC-07`, `L648-659`) chỉ kiểm tra tiền tố `"/images/"`, chưa đối chiếu SHA-256 với tệp trên đĩa. Đồng thời `seed.ts` gán cứng `is_preview_approved = true` và `camera_metadata.ProjectionType = "equirectangular"` dù dữ liệu ảnh không đạt. | **VERIFIED BUG IN `1117e7a`** |
| **Đề xuất nghiệm thu Phase 2A-1** | **NEEDS REVISION** — Chưa nghiệm thu đóng mốc `1117e7a` và chưa mở Phase 2A-2 cho tới khi vá bug SHA-256 trong `seed.ts`, bổ sung kiểm tra disk/checksum trong `verify-db-integrity.ts`, chỉnh trạng thái duyệt/metadata cho 5 panorama demo và có quyết định của Chủ dự án về 2 điểm cần chốt. | **NEEDS REVISION** |

---

## 2. Enum Reconciliation — Bảng đối chiếu `17` / `18`

### 2.1. Bằng chứng nguồn gốc con số `"18"` qua lịch sử Git

Truy vết trực tiếp qua lịch sử Git xác nhận **không có enum nào bị bỏ sót trong Prisma**; con số `"18"` chỉ là lỗi cộng số học ở tầng văn bản tổng hợp khi đồng bộ hợp đồng `v2A.2`:

1. **Mốc Baseline [`20f85ad`](../../docs/phase-2a/PHASE_2A_DATABASE_DESIGN.md):** Mục 4 của `PHASE_2A_DATABASE_DESIGN.md` có **7 enums** (`PublishStatus`, `ProcessingStatus`, `FloorPlanFormat`, `MediaKind`, `TourEdgeType`, `AlignmentStatus`, `HotspotType`).
2. **Mốc Phase 1 ([`5c9fea0`](../project-audit/PHASE_1_SECURITY_AND_MVP_CLEANUP_REPORT.md)):** Bổ sung **6 enums** cho Auth/Provisioning (`UserType`, `AccountStatus`, `ActivationStatus`, `ProvisioningMethod`, `InvitationChannel`, `InvitationStatus`) → tổng **13 enums** (`7 + 6 = 13`).
3. **Mốc Kiểm toán Readiness (`d331ae7` — [`PHASE_2A_READINESS_AND_DATA_CONTRACT_VERIFICATION.md`](./PHASE_2A_READINESS_AND_DATA_CONTRACT_VERIFICATION.md)):**
   - Tại `L106` và `L143`, báo cáo ghi đúng thực trạng gốc gồm **13 Prisma enums**:
     > `- **13 Prisma enums đã khai báo tường minh trong Mục 4 (L307-393):** PublishStatus, ProcessingStatus, FloorPlanFormat, MediaKind, TourEdgeType, AlignmentStatus, HotspotType, UserType, AccountStatus, ActivationStatus, ProvisioningMethod, InvitationChannel, InvitationStatus.`
   - Tại `L148` ghi chú các bảng Open Day thiếu khai báo kiểu `PublishStatus` rõ ràng, và tại `L319` (`OD-06`, lặp lại tại `L371`) viết câu liệt kê gồm **5 tên**:
     > `5. Thiếu enum SessionPeriod, ParticipationStatus, BuildingCategory, MapBuildingIconKey, PublishStatus trên Open Day tables.`
4. **Mốc Contract Alignment (`dbbc6d6` → `5fac54e`):** Do `PublishStatus` đã tồn tại từ nhóm 13 enum gốc, khi cập nhật Mục 4 của `PHASE_2A_DATABASE_DESIGN.md` chỉ có **4 enum mới thực sự được thêm** (`BuildingCategory`, `MapBuildingIconKey`, `SessionPeriod`, `ParticipationStatus`), nâng tổng số lên **`13 + 4 = 17` enums**. Tuy nhiên phần prose tổng kết lại đếm 5 cái tên trong câu của `OD-06` rồi cộng `13 + 5 = 18`, làm lan truyền chuỗi `"18 Prisma enums"` / `"18 enums"` sang 4 tài liệu sau:
   - [`PHASE_2A_CONTRACT_ALIGNMENT_REPORT.md`](./PHASE_2A_CONTRACT_ALIGNMENT_REPORT.md) (`L29`, `L70`, `L96`, `L180`)
   - [`PHASE_2A_SYSTEM_ARCHITECTURE.md`](../phase-2a/PHASE_2A_SYSTEM_ARCHITECTURE.md) (`L180`)
   - [`PHASE_2A_IMPLEMENTATION_ROADMAP.md`](../phase-2a/PHASE_2A_IMPLEMENTATION_ROADMAP.md) (`L40`)
   - [`PHASE_2A_SCOPE_FINALIZATION_REPORT.md`](./PHASE_2A_SCOPE_FINALIZATION_REPORT.md) (`L16`, `L31`)

**Trích dẫn nguyên văn yêu cầu `"18"` trong Scope Finalization (mốc `5fac54e`):**
- [`PHASE_2A_SCOPE_FINALIZATION_REPORT.md`](./PHASE_2A_SCOPE_FINALIZATION_REPORT.md) (`L16`): *`Giữ nguyên toàn bộ 18 enums, bảng, cột và quyết định OD-01..OD-10...`*
- [`PHASE_2A_SCOPE_FINALIZATION_REPORT.md`](./PHASE_2A_SCOPE_FINALIZATION_REPORT.md) (`L31`): *`• Tạo SQL migrations với đủ **18 Prisma enums**, indexes, **partial unique indexes (\`WHERE deleted_at IS NULL\`) trong SQL migration**, và **\`hotspots CHECK\` constraint trong SQL migration**.`*

### 2.2. Đối chiếu đầy đủ 17 PostgreSQL Enums trên 4 lớp hệ thống

Kiểm tra trực tiếp bằng lệnh `psql` trên database `virtual_campus_360` (`pg_type` `JOIN` `pg_namespace` lọc `t.typtype = 'e' AND n.nspname = 'public'`) trả về chính xác **`17` enum types**, khớp 100% với [`PHASE_2A_DATABASE_DESIGN.md`](../phase-2a/PHASE_2A_DATABASE_DESIGN.md) (`L374-489`), [`prisma/schema.prisma`](../../prisma/schema.prisma) (`L20-131`), và [`migration.sql`](../../prisma/migrations/20261111175635_init/migration.sql) (`L1-50`):

| # | Tên Enum (Prisma / PG `typtype='e'`) | Vị trí khai báo & sử dụng trong `prisma/schema.prisma` | Giá trị trong PostgreSQL `pg_enum` | Khớp `@fpt-campus/shared` | Ghi chú |
|---:|---|---|---|---|---|
| 1 | `PublishStatus` | Khai báo `L20`; dùng tại `L145, L183, L206, L301, L387, L632, L662, L683, L702` | `DRAFT, PUBLISHED, ARCHIVED` | `PublishStatus` ([`common.ts:4`](../../packages/shared/src/common.ts)) | Đã có từ 7 enum gốc (nêu nhầm lại ở `OD-06`) |
| 2 | `ProcessingStatus` | Khai báo `L26`; dùng tại `L232, L333` | `PENDING, PROCESSING, READY, FAILED` | `ProcessingStatus` ([`common.ts:6`](../../packages/shared/src/common.ts)) | 7 enum gốc |
| 3 | `FloorPlanFormat` | Khai báo `L33`; dùng tại `L223` (`source_format`) | `PNG, JPG, SVG, PDF` | `FloorPlanFormat` ([`common.ts:8`](../../packages/shared/src/common.ts)) | 7 enum gốc |
| 4 | `MediaKind` | Khai báo `L40`; dùng tại `L319` (`asset_kind`) | `PANORAMA_2_1, PHOTO_2D, THUMBNAIL` | `MediaKind` ([`common.ts:10`](../../packages/shared/src/common.ts)) | 7 enum gốc |
| 5 | `BuildingCategory` | Khai báo `L46`; dùng tại `L166` (`buildings.category`) | `ACADEMIC, LAB, FACILITY` | `BuildingCategory` ([`campus.ts:20`](../../packages/shared/src/campus.ts)) | Thêm ở `v2A.2` *(PG lưu UPPERCASE; shared UI type đang viết `"academic" \| "lab" \| "facility"`)* |
| 6 | `MapBuildingIconKey` | Khai báo `L52`; dùng tại `L176` (`map_icon_key`) | `INNOVATION, IT_BUILDING, DESIGN_STUDIO, ACADEMIC_HALL, SPORTS` | `MapBuildingIconKey` ([`campus.ts:22`](../../packages/shared/src/campus.ts)) | Thêm ở `v2A.2` |
| 7 | `TourEdgeType` | Khai báo `L60`; dùng tại `L411` (`edge_type`) | `WALKWAY, DOORWAY, STAIRS, ELEVATOR, OUTDOOR_LINK` | `TourEdgeType` ([`tour.ts:15`](../../packages/shared/src/tour.ts)) | 7 enum gốc |
| 8 | `AlignmentStatus` | Khai báo `L68`; dùng tại `L254` (`alignment_status`) | `PENDING_REVIEW, CONFIRMED` | `AlignmentStatus` ([`common.ts:12`](../../packages/shared/src/common.ts)) | 7 enum gốc |
| 9 | `HotspotType` | Khai báo `L73`; dùng tại `L430` (`hotspot_type`) | `SCENE_LINK, INFO, QUIZ_TRIGGER` | `HotspotType` ([`tour.ts:13`](../../packages/shared/src/tour.ts)) | 7 enum gốc |
| 10 | `UserType` | Khai báo `L79`; dùng tại `L456, L568` | `ADMIN, STAFF, STUDENT, PARENT` | `UserType` ([`auth.ts:4`](../../packages/shared/src/auth.ts)) | Thêm ở Phase 1 (`+6`) |
| 11 | `AccountStatus` | Khai báo `L86`; dùng tại `L457` | `ACTIVE, LOCKED, SUSPENDED, ARCHIVED` | `AccountStatus` ([`auth.ts:20`](../../packages/shared/src/auth.ts)) | Thêm ở Phase 1 (`+6`) |
| 12 | `ActivationStatus` | Khai báo `L93`; dùng tại `L458` | `PENDING_ACTIVATION, INVITATION_SENT, ACTIVATED, EXPIRED, REVOKED` | `ActivationStatus` ([`auth.ts:22`](../../packages/shared/src/auth.ts)) | Thêm ở Phase 1 (`+6`) |
| 13 | `ProvisioningMethod` | Khai báo `L101`; dùng tại `L459, L569` | `BOOTSTRAP, ADMIN_DIRECT, EMAIL_SMS_INVITATION` | `ProvisioningMethod` ([`auth.ts:29`](../../packages/shared/src/auth.ts)) | Thêm ở Phase 1 (`+6`) |
| 14 | `InvitationChannel` | Khai báo `L107`; dùng tại `L531` | `DIRECT_LINK, EMAIL, SMS` | `InvitationChannel` ([`auth.ts:34`](../../packages/shared/src/auth.ts)) | Thêm ở Phase 1 (`+6`) |
| 15 | `InvitationStatus` | Khai báo `L113`; dùng tại `L533` | `INVITATION_PENDING, SENT, EXPIRED, ACTIVATED, FAILED` | `InvitationStatus` ([`auth.ts:36`](../../packages/shared/src/auth.ts)) | Thêm ở Phase 1 (`+6`) |
| 16 | `SessionPeriod` | Khai báo `L121`; dùng tại `L653` (`open_day_sessions`) | `MORNING, NOON, AFTERNOON` | `SessionPeriod` ([`events.ts:4`](../../packages/shared/src/events.ts)) | Thêm ở `v2A.2` |
| 17 | `ParticipationStatus` | Khai báo `L127`; dùng tại `L552` (`event_participations`) | `INVITED, CONFIRMED, CANCELLED` | `ParticipationStatus` ([`events.ts:9`](../../packages/shared/src/events.ts)) | Thêm ở `v2A.2` |

### 2.3. Giải thích các Union Type còn lại trong `@fpt-campus/shared` & cột `VARCHAR` trong DB

Kiểm tra toàn bộ 31 exported types trong `packages/shared/src/*.ts` cho thấy phần còn lại không bị thiếu trong migration mà thuộc 2 nhóm chủ đích:

- **5 union ánh xạ vào cột `VARCHAR` + lookup table trong thiết kế Mục 3 của [`PHASE_2A_DATABASE_DESIGN.md`](../phase-2a/PHASE_2A_DATABASE_DESIGN.md):**
  - `RoleCode` ([`auth.ts:6`](../../packages/shared/src/auth.ts)) → `roles.code VARCHAR(48)` ([`schema.prisma:486`](../../prisma/schema.prisma))
  - `PermissionCode` ([`auth.ts:8`](../../packages/shared/src/auth.ts)) → `permissions.code VARCHAR(80)` ([`schema.prisma:498`](../../prisma/schema.prisma))
  - `LocationTypeCode` ([`location.ts:4`](../../packages/shared/src/location.ts)) → `location_types.code VARCHAR(40)` ([`schema.prisma:272`](../../prisma/schema.prisma))
  - `LocationCategoryGroup` ([`location.ts:19`](../../packages/shared/src/location.ts)) → `location_types.filter_group VARCHAR(24)` ([`schema.prisma:273`](../../prisma/schema.prisma))
  - `TourNodeCategory` ([`tour.ts:11`](../../packages/shared/src/tour.ts)) → `tour_nodes.category VARCHAR(24)` ([`schema.prisma:373`](../../prisma/schema.prisma))
- **9 union thuần tầng ứng dụng / API DTO / config (chưa từng được thiết kế thành PG Enum):** `ApiErrorCode` ([`api.ts:1`](../../packages/shared/src/api.ts)), `ImportRowResolutionStatus` ([`auth.ts:103`](../../packages/shared/src/auth.ts)), `BuildingCode` ([`campus.ts:13`](../../packages/shared/src/campus.ts)), `StorageDriver` ([`common.ts:14`](../../packages/shared/src/common.ts)), `SessionAccessType` ([`events.ts:6`](../../packages/shared/src/events.ts)), `LocationCategoryKey` ([`location.ts:17`](../../packages/shared/src/location.ts)), `TourValidationSeverity` ([`tour.ts:22`](../../packages/shared/src/tour.ts)), `TourValidationRuleCode` ([`tour.ts:24`](../../packages/shared/src/tour.ts)), `TourValidationScope` ([`tour.ts:33`](../../packages/shared/src/tour.ts)).

---

## 3. Panorama Asset Verification — Bằng chứng cho từng ảnh (đủ 5 ảnh)

### 3.1. Bảng đối chiếu tổng hợp DB ↔ Đĩa ↔ Metadata ↔ Đo lường kỹ thuật

Toàn bộ 5 bản ghi `asset_kind = 'PANORAMA_2_1'` trong PostgreSQL đều được [`prisma/seed.ts`](../../prisma/seed.ts) (`L1298-1319`) gán chung: `is_valid_2_to_1 = true`, `is_preview_approved = true`, `processing_status = 'READY'`, và `camera_metadata = {"SeedSource": "QTSC-Static", "ProjectionType": "equirectangular"}`; toàn bộ 5 `TourNode` tương ứng đều ở trạng thái `PUBLISHED`. Tuy nhiên kiểm tra nhị phân JPEG, chỉ số mép biên `±180°` (Python `PIL`) và soi trực quan cho thấy:

| # | File ảnh (`apps/web/public/images/panoramas/`) | `media_assets.id` & `TourNode.slug` | Kích thước (`bytes`) & Pixel (`tỷ lệ`) | SHA-256 trên đĩa vs DB (`CHAR(64)`) | EXIF / XMP `GPano` | Chỉ số biên & cực (`PIL`) | Nguồn gốc thực tế (`git` & log tạo ảnh) |
|---:|---|---|---:|---|---|---|---|
| **1** | [`campus-courtyard-360.jpg`](../../apps/web/public/images/panoramas/campus-courtyard-360.jpg) | `7f8c70a5-218a-4d24-86fb-4c16a782db02` · `cong-chao-qtsc` | `477,371 B` · `2048×1024` (`2.0000`) | `d0e9add7...900bb594` · **Khớp 64 hex** (`Match`) | `EXIF=false` · `GPano/XMP=false` | `seam_MAE=10.51` · `rows_diff>25=10.1%` · `zenith_std=1.5` · `nadir_std=46.7` · `horizon_std=65.5` | Ảnh AI `16:9` (`1376×768`) tạo 11/11 (`51a9adb5`) → kéo giãn & blend mép `128px` bằng `prep_assets.py:63`, commit lần đầu tại `20f85ad` |
| **2** | [`auditorium-360.jpg`](../../apps/web/public/images/panoramas/auditorium-360.jpg) | `660a99dc-2806-4edb-89e7-e97e753e37aa` · `sanh-innovation` | `397,578 B` · `2048×1024` (`2.0000`) | `facd64dc...f2950e9b` · **Khớp 64 hex** (`Match`) | `EXIF=false` · `GPano/XMP=false` | `seam_MAE=15.76` · `rows_diff>25=13.8%` · `zenith_std=42.7` · `nadir_std=44.6` · `horizon_std=47.0` | **Dùng chung nguồn 16:9 thẳng** `auditorium_hall_empty_1794380806291.jpg` (`f6f0d6c4`) với ảnh 2D [`auditorium-hall.jpg`](../../apps/web/public/images/locations/auditorium-hall.jpg) (`prep_assets.py:61,67,72`) |
| **3** | [`library-360.jpg`](../../apps/web/public/images/panoramas/library-360.jpg) | `8986419f-5a67-493e-82d6-1d0eb89099f7` · `thu-vien` | `400,694 B` · `2048×1024` (`2.0000`) | `ff61132e...01e43433` · **Khớp 64 hex** (`Match`) | `EXIF=false` · `GPano/XMP=false` | `seam_MAE=13.41` · `rows_diff>25=17.9%` · `zenith_std=31.9` · `nadir_std=10.7` · `horizon_std=49.1` | Ảnh AI `16:9` (`1376×768`) tạo 11/11 (`a77dcf73`) → kéo giãn & blend mép `128px` bằng `prep_assets.py:64`, commit lần đầu tại `20f85ad` |
| **4** | [`it-lab-360.jpg`](../../apps/web/public/images/panoramas/it-lab-360.jpg) | `a84854a8-ed75-48a4-b4de-a973ce062a27` · `lab-it` | `317,163 B` · `2048×1024` (`2.0000`) | `37a09a47...ad390dc` · **Khớp 64 hex** (`Match`) | `EXIF=false` · `GPano/XMP=false` | `seam_MAE=22.63` · `rows_diff>25=30.4%` · `zenith_std=6.0` · `nadir_std=19.0` · `horizon_std=45.1` | Ảnh AI `16:9` v1 (`1376×768`) tạo 11/11 (`e5b55c6d`) → kéo giãn & blend mép `128px` bằng `prep_assets.py:65` *(bỏ qua bản v2 của subagent)* |
| **5** | [`imac-studio-360.jpg`](../../apps/web/public/images/panoramas/imac-studio-360.jpg) | `f0712921-5e50-4245-abd1-cd825299bb15` · `studio-imac` | `344,948 B` · `2048×1024` (`2.0000`) | **MISMATCH:** DB = `fbab55dc257eb12981fbe37043c19549ed3f8b6bce31d008def115fb618c142 ` (**63 hex + space** tại `seed.ts:279`) ≠ Disk = `fbab55dc2257eb12981fbe37043c19549ed3f8b6bce31d008def115fb618c142` | `EXIF=false` · `GPano/XMP=false` | `seam_MAE=25.95` · `rows_diff>25=39.9%` · `zenith_std=23.5` · `nadir_std=12.9` · `horizon_std=73.8` | Ảnh AI `16:9` (`1376×768`) tạo 11/11 (`a81e3a63`) → kéo giãn & blend mép `128px` bằng `prep_assets.py:66`, commit lần đầu tại `20f85ad` |

*(Ghi chú bổ sung về 6 tệp `PHOTO_2D` trong `apps/web/public/images/locations/`: toàn bộ 6 tệp `1280×720` khớp byte length và SHA-256 64 ký tự với bản ghi `media_assets` trong PostgreSQL).*

### 3.2. Chi tiết bằng chứng kỹ thuật & đánh giá trực quan từng ảnh

1. **[`campus-courtyard-360.jpg`](../../apps/web/public/images/panoramas/campus-courtyard-360.jpg) (`cong-chao-qtsc`)**
   - **Đặc điểm thị giác & kỹ thuật:** Cảnh sân campus dựng bằng AI, bầu trời xanh đều phần trên (`zenith_std=1.5`), phần đáy sân lát gạch bị bôi nhòe và đứt gãy (`nadir_std=46.7`). Chữ biển hiệu tòa nhà không phải chụp thật QTSC. Mặc dù qua thuật toán crossfade `128px` của `make_seamless_pano`, biên `±180°` vẫn lệch `seam_MAE=10.51` (`10.1%` hàng pixel lệch `ΔRGB > 25`).
   - **Kết luận ảnh:** Đạt kích thước `2048×1024` (`2:1`), **không phải ảnh chụp thật QTSC, không phải ảnh cầu 360°×180° từ camera 360°**.

2. **[`auditorium-360.jpg`](../../apps/web/public/images/panoramas/auditorium-360.jpg) (`sanh-innovation`)**
   - **Đặc điểm thị giác & kỹ thuật:** Quan sát trực tiếp cả [`auditorium-360.jpg`](../../apps/web/public/images/panoramas/auditorium-360.jpg) và [`auditorium-hall.jpg`](../../apps/web/public/images/locations/auditorium-hall.jpg) cho thấy **đây là cùng một bức phối cảnh nội thất hội trường nhìn thẳng một hướng**, chỉ khác tỷ lệ kéo/crop (`2048×1024` vs `1280×720`). Truy vết `prep_assets.py` (`L61, L67, L72`) xác nhận cùng dùng tệp nguồn `auditorium_hall_empty_1794380806291.jpg` từ subagent `f6f0d6c4-fb49-4337-ba53-41dac4cbec6e` (mà prompt gốc yêu cầu *"crisp 16:9 interior architectural photograph"* cho ảnh 2D, còn subagent `6e2e8c73` cho `innovation-hall-360` không trả kết quả). Không có trường nhìn 360° phía sau, `seam_MAE=15.76` (`13.8%` hàng `ΔRGB > 25`), trần/sàn bị cắt cụt theo khung hình `16:9` (`zenith_std=42.7`, `nadir_std=44.6`).
   - **Kết luận ảnh:** **Không phải equirectangular 360°**, là ảnh rectilinear `16:9` kéo thành `2:1` → hiển thị trên `Three.js` sphere trong [`PanoramaStage.tsx`](../../apps/web/src/components/tour/PanoramaStage.tsx) sẽ bị méo nặng và lộ vệt ghép thẳng đứng ở sau lưng camera.

3. **[`library-360.jpg`](../../apps/web/public/images/panoramas/library-360.jpg) (`thu-vien`)**
   - **Đặc điểm thị giác & kỹ thuật:** Cảnh thư viện AI `16:9` được kéo dọc/ngang thành `2048×1024`. Cấu trúc không gian chứa lỗi phối cảnh nặng (cầu thang kính tầng lửng đâm vào sau quầy lễ tân), hai cực trần/sàn không khép kín theo phép chiếu cầu (`zenith_std=31.9`, `nadir_std=10.7`), đường nối `±180°` lệch `seam_MAE=13.41` (`17.9%` hàng `ΔRGB > 25`).
   - **Kết luận ảnh:** Chỉ đạt hình thức `2:1`, **không đạt phép chiếu equirectangular 360°×180° và không phải ảnh thực tế QTSC**.

4. **[`it-lab-360.jpg`](../../apps/web/public/images/panoramas/it-lab-360.jpg) (`lab-it`)**
   - **Đặc điểm thị giác & kỹ thuật:** Ngoài việc xuất phát từ ảnh AI `16:9` không có view phía sau và không khép kín 2 cực, ngay phía trên bảng trắng còn hiển thị lỗi chữ AI biến dạng rõ rệt: **`"FPT FHUYDGIST"` / `"FPT CHISCGITY - COMPUIER SCIENCE LAB"`** (dù subagent `e5b55c6d-09f7-4895-9452-15adeaf980e9` từng tạo bản `v2` để sửa lỗi chữ, `prep_assets.py:65` đã lấy bản `v1`). Biên `±180°` lệch lớn (`seam_MAE=22.63`, `30.4%` hàng `ΔRGB > 25`).
   - **Kết luận ảnh:** **Không đạt cả về chuẩn equirectangular lẫn chất lượng hiển thị thị giác** (lỗi văn bản thương hiệu giả).

5. **[`imac-studio-360.jpg`](../../apps/web/public/images/panoramas/imac-studio-360.jpg) (`studio-imac`)**
   - **Đặc điểm thị giác & kỹ thuật:** Ảnh AI `16:9` dựng phòng iMac được kéo giãn thành `2048×1024`, biên trái/phải có nội dung không đối xứng dẫn đến độ lệch ghép cao nhất trong 5 ảnh (**`seam_MAE=25.95`**, **`39.9%` hàng pixel ở mép `±180°` lệch `ΔRGB > 25`**), hai cực trần/sàn không khép cầu.
   - **Lỗi toàn vẹn dữ liệu phát hiện thêm:** Bảng `media_assets` lưu `sha256_checksum = "fbab55dc257eb12981fbe37043c19549ed3f8b6bce31d008def115fb618c142 "` (**thiếu 1 ký tự `'2'` ở vị trí index 8**, PostgreSQL `CHAR(64)` tự đệm 1 dấu cách ở cuối), không khớp với SHA-256 thực tế trên đĩa `"fbab55dc2257eb12981fbe37043c19549ed3f8b6bce31d008def115fb618c142"`.

### 3.3. Đối chiếu lịch sử Phase 1 (`tang-1.jpg`, `tang-2.jpg`) & Schema (`is_valid_2_to_1` / `is_preview_approved`)

- **Nghịch lý dữ liệu từ Phase 1 (`5c9fea0`):** Kiểm tra `git log` và mở xem trực tiếp [`samples/panoramas/tang-1.jpg`](../../samples/panoramas/tang-1.jpg) (`2170×725`, `2.993:1`, `301,797 B`) và [`samples/panoramas/tang-2.jpg`](../../samples/panoramas/tang-2.jpg) (`2172×724`, `3.000:1`, `350,140 B`) xác nhận **2 ảnh này mới là ảnh chụp nội thất thực tế tại FPT Polytechnic** (hiển thị logo tường *"FPT POLYTECHNIC"*, tủ trưng bày Ong Vàng, quầy *"DỊCH VỤ SINH VIÊN"*). Ở Phase 1 (`5c9fea0`), cả 2 bị di chuyển khỏi `apps/web/public/images/panoramas/` sang `samples/panoramas/` vì gắn với scene `(Test)` và có tỷ lệ `3:1` (thiếu nắp trần/đáy), khiến toàn bộ thư mục `public/images/panoramas/` chỉ còn lại 5 ảnh AI `16:9` giả lập `2:1` đã có từ baseline `20f85ad`.
- **Tên cột Schema & Ý nghĩa thực tế:**
  - Trong [`prisma/schema.prisma`](../../prisma/schema.prisma) (`L326-327`) **không tồn tại cột `is_valid_panorama`** (tìm toàn bộ repository cho `0` kết quả); lược đồ chỉ có **`is_valid_2_to_1`** và **`is_preview_approved`**.
  - Theo [`PHASE_2A_DATABASE_DESIGN.md`](../phase-2a/PHASE_2A_DATABASE_DESIGN.md) và [`PHASE_2A_PANORAMA_WORKFLOW.md`](../phase-2a/PHASE_2A_PANORAMA_WORKFLOW.md) (`L57`, `L65-76`), quy trình cấm AI bịa không gian trường và dùng **`is_preview_approved`** làm cổng duyệt thị giác trước khi xuất bản. Việc `prisma/seed.ts:1307` gán cứng `isPreviewApproved: true` cho cả 5 ảnh AI kéo giãn từ `16:9` (trong đó 1 ảnh còn là phối cảnh thẳng và 1 ảnh sai chính tả tên trường) khiến trạng thái `PUBLISHED` + `is_preview_approved = true` trong DB mâu thuẫn trực tiếp với chất lượng thực tế của ảnh.

---

## 4. Các sai khác hoặc rủi ro được phát hiện

| Mã | Mức độ | Sai khác / Rủi ro thực tế | Bằng chứng cụ thể | Tác động nếu bỏ qua |
|---|---|---|---|---|
| **R-01** | **P1 (Bug xác thực)** | **Sai SHA-256 của `imac-studio-360.jpg` trong `seed.ts` & báo cáo sai trong `PHASE_2A_1_DATABASE_BOOTSTRAP_REPORT.md`** | [`prisma/seed.ts`](../../prisma/seed.ts) (`L279`) thiếu ký tự `'2'` (`"fbab55dc257eb..."` 63 hex → PG `CHAR(64)` đệm space); báo cáo Phase 2A-1 (`L110`) lại ghi cả 11 ảnh *"khớp byte/SHA-256 thực tế"*. | Verify checksum ở `StorageAdapter` (Phase 2A-2) hoặc audit toàn vẹn file sẽ báo hỏng asset `imac-studio-360.jpg`. |
| **R-02** | **P1 (Lỗ hổng kiểm thử)** | **`verify-db-integrity.ts` (`AC-07`) không đọc đĩa để kiểm tra SHA-256/kích thước thật** | [`prisma/verify-db-integrity.ts`](../../prisma/verify-db-integrity.ts) (`L648-659`) chỉ assert `original_object_key.startsWith("/images/")`, không tính `crypto.createHash('sha256')` trên file ở `apps/web/public/`. | Lỗi `R-01` lọt qua `pnpm db:test` (`12/12 PASS`) mà không bị phát hiện. |
| **R-03** | **P1 (Sai chuẩn 360° & metadata)** | **5 panorama `PANORAMA_2_1` là ảnh AI `16:9` kéo giãn, `auditorium-360.jpg` không phải ảnh cầu, `camera_metadata` ghi sai sự thật** | `EXIF=false`, `GPano=false`, `auditorium-360.jpg` trùng nguồn `16:9` với `auditorium-hall.jpg`, `it-lab-360.jpg` lỗi chữ, nhưng `seed.ts:1307,1314` vẫn gán `isPreviewApproved: true` và `ProjectionType: "equirectangular", SeedSource: "QTSC-Static"`. | Trình xem Three.js (`PanoramaStage.tsx`) lộ méo hình/vệt cắt sau lưng; gây hiểu nhầm dữ liệu đã đạt chuẩn thật trước Phase 2A-2/2C. |
| **R-04** | **P1 (Lệch số liệu tài liệu)** | **4 tài liệu tổng hợp ghi `"18 Prisma enums"` trong khi thiết kế nguồn & DB dùng `17` enums** | `PHASE_2A_SCOPE_FINALIZATION_REPORT.md` (`L16, L31`), `PHASE_2A_CONTRACT_ALIGNMENT_REPORT.md` (`L29, L70, L96, L180`), `PHASE_2A_SYSTEM_ARCHITECTURE.md` (`L180`), `PHASE_2A_IMPLEMENTATION_ROADMAP.md` (`L40`). | Dễ gây nghi ngờ thiếu migration hoặc tranh cãi phạm vi ở các đợt audit sau. |
| **R-05** | **P2 (Đồng bộ Shared ↔ DB)** | **`BuildingCategory` trong `@fpt-campus/shared` viết thường (`"academic" \| "lab" \| "facility"`), PostgreSQL enum viết hoa (`ACADEMIC, LAB, FACILITY`)** | [`packages/shared/src/campus.ts:20`](../../packages/shared/src/campus.ts) vs [`prisma/schema.prisma:46-50`](../../prisma/schema.prisma). | Cần mapper rõ ràng trong DTO/Service của `apps/api` ở Phase 2A-2 để không phát sinh lỗi validate/serialization. |
| **R-06** | **P2 (Dữ liệu nghiệp vụ QTSC)** | **Tọa độ GPS, thông số tòa nhà & sự kiện Open Day vẫn là bộ dữ liệu khởi tạo tĩnh từ prototype ban đầu, chưa đối chiếu thực địa QTSC** | Tài liệu lộ trình [`PHASE_2A_IMPLEMENTATION_ROADMAP.md`](../phase-2a/PHASE_2A_IMPLEMENTATION_ROADMAP.md) (`L17`) đã tách phần dữ liệu thực địa sang Phase 2C, nhưng cần xác nhận ranh giới rõ cho dataset seed của Phase 2A. | Tránh hiểu nhầm seed bootstrap là dữ liệu công bố chính thức cuối cùng. |

---

## 5. Kết luận cho từng vấn đề

| Vấn đề | Kết luận chính thức | Giải thích ngắn gọn |
|---|---|---|
| **P1-1: `17` vs `18` Prisma Enums** | **VERIFIED** *(về kỹ thuật schema/PG = 17)* & **OWNER DECISION REQUIRED** *(về chuẩn hóa tài liệu)* | DB, Prisma schema, SQL migration và Mục 4 của `PHASE_2A_DATABASE_DESIGN.md` đồng nhất hoàn toàn ở **17 enums**. Con số `"18"` xuất hiện do cộng nhầm `PublishStatus` (đã có sẵn) thêm lần nữa trong prose. Cần Chủ dự án phê duyệt đính chính 4 file tài liệu tổng hợp về `17` enums (hoặc chọn thêm enum mới nếu muốn). |
| **P1-2a: Nguồn gốc & tính chất 360° thật của 5 Panorama** | **UNVERIFIED (KHÔNG ĐẠT chuẩn ảnh chụp 360°×180° QTSC thật)** | Cả 5 ảnh không phải ảnh chụp thực tế tại QTSC và không đạt chuẩn equirectangular 360°×180° (lộ biên `±180°`, thiếu đỉnh/đáy, 1 ảnh là khung `16:9` phẳng, 1 ảnh lỗi chữ AI, 0 EXIF/XMP `GPano`). |
| **P1-2b: Toàn vẹn kỹ thuật `seed.ts` ↔ file trên đĩa (`imac-studio-360.jpg` & `verify-db-integrity.ts`)** | **UNVERIFIED — PHÁT HIỆN BUG (`R-01`, `R-02`)** | 4/5 panorama và 6/6 ảnh 2D khớp SHA-256 trên đĩa, **riêng `imac-studio-360.jpg` sai SHA-256 trong `prisma/seed.ts:279` (63 ký tự hex)** và chưa bị `verify-db-integrity.ts` bắt lỗi. |
| **P1-2c: Phân loại dữ liệu 5 ảnh seed trong Phase 2A (`Synthetic Placeholder` vs thay ảnh 360° thật ngay)** | **OWNER DECISION REQUIRED** | Cần Chủ dự án quyết định hướng xử lý cho 5 asset này (và 2 ảnh thật `tang-1.jpg` / `tang-2.jpg` đang ở `samples/panoramas/`) trước khi mở Phase 2A-2. |
| **P2: Bộ dữ liệu QTSC tĩnh (`GPS`, tòa nhà, Open Day, `is_preview_approved`)** | **OWNER DECISION REQUIRED** | Cần Chủ dự án xác nhận mức chấp nhận đối với seed QTSC phục vụ phát triển Phase 2A trước khi thay dữ liệu thật tại Phase 2C. |

---

## 6. Đề xuất nghiệm thu Phase 2A-1

**Khuyến nghị chính thức:** **`NEEDS REVISION`** *(Chưa nghiệm thu `1117e7a` và chưa mở Phase 2A-2).*

### Lý do không thể chọn `ACCEPT` ở hiện tại
1. Tồn tại **lỗi dữ liệu xác thực có thật** trong code vừa commit ([`prisma/seed.ts:279`](../../prisma/seed.ts) sai SHA-256 `imac-studio-360.jpg`), chứng minh kết luận *"khớp byte/SHA-256 thực tế"* ở `PHASE_2A_1_DATABASE_BOOTSTRAP_REPORT.md:110` chưa được [`verify-db-integrity.ts`](../../prisma/verify-db-integrity.ts) kiểm chứng thực sự trên đĩa.
2. Cả 5 ảnh panorama trong DB đang mang trạng thái `is_preview_approved = true` và `camera_metadata = { ProjectionType: "equirectangular", SeedSource: "QTSC-Static" }`, gây mâu thuẫn với bản chất ảnh AI `16:9` kéo giãn (đặc biệt `auditorium-360.jpg` là ảnh phẳng `16:9` và `it-lab-360.jpg` có chữ AI lỗi).
3. Cần quyết định chính thức của Chủ dự án để khóa nhất quán hai câu hỏi `17` vs `18` enums và quy chế dữ liệu panorama seed trước khi Phase 2A-2 xây `StorageAdapter` và Public APIs đọc chính bảng `media_assets` này.

### Hai quyết định cần Chủ dự án chốt (để tiến hành bản sửa Phase 2A-1)
1. **Quyết định `D-01` (Enum count):** Chấp thuận **`17` Prisma enums** là nguồn chuẩn duy nhất theo [`PHASE_2A_DATABASE_DESIGN.md`](../phase-2a/PHASE_2A_DATABASE_DESIGN.md) Mục 4 và cho phép đính chính text `"18"` → `"17"` trong 4 tài liệu tổng hợp (`SCOPE_FINALIZATION`, `CONTRACT_ALIGNMENT`, `SYSTEM_ARCHITECTURE`, `IMPLEMENTATION_ROADMAP`), **không** thêm enum thừa vào PostgreSQL.
2. **Quyết định `D-02` (5 Panorama Seed cho Phase 2A):** Chọn một trong hai phương án:
   - **Phương án A (Khuyến nghị nếu chưa có ảnh Ricoh/Insta360 thật từ trường ngay lúc này):** Giữ 5 tệp tạm ở `apps/web/public/images/panoramas/` để không vỡ UI 3D trong quá trình phát triển Phase 2A-2/2A-3, nhưng trong `seed.ts` **đổi metadata phản ánh đúng sự thật** (`SeedSource: "AI-16x9-Stretched-Placeholder"`, ghi rõ `is_synthetic_placeholder: true`, đánh dấu lại trạng thái/ghi chú tránh ngộ nhận đã duyệt ảnh 360° thật) và mở ticket thay bằng ảnh 360°×180° thật từ camera trước khi go-live / Phase 2C *(có thể nghiên cứu phục hồi `tang-1.jpg` / `tang-2.jpg` bằng padding đỉnh/đáy thành `2:1` thật nếu Chủ dự án muốn ưu tiên ảnh thật)*.
   - **Phương án B:** Cung cấp bộ 5 ảnh equirectangular `2:1` thật (hoặc ảnh `3:1` có nadir/zenith cap chuẩn) để thay ngay trước khi đóng Phase 2A-1.

### Danh sách hạng mục bắt buộc trong bản sửa Phase 2A-1 (sau khi Chủ dự án chốt `D-01`, `D-02`)
1. Sửa checksum SHA-256 của `imac-studio-360.jpg` tại [`prisma/seed.ts:279`](../../prisma/seed.ts) thành chuỗi 64 hex chuẩn (`fbab55dc2257eb12981fbe37043c19549ed3f8b6bce31d008def115fb618c142`) và chạy lại seed.
2. Nâng cấp [`prisma/verify-db-integrity.ts`](../../prisma/verify-db-integrity.ts) (`AC-07`) để **đọc trực tiếp từng tệp trên đĩa dưới `apps/web/public`** và `assert` khớp `fileSizeBytes`, `sha256Checksum` (đủ đúng 64 ký tự hex không có khoảng trắng đệm), `width/height` JPEG/PNG thực tế.
3. Cập nhật metadata/trạng thái 5 panorama trong `prisma/seed.ts` theo đúng quyết định `D-02` và đính chính số enum trong 4 tài liệu tổng hợp theo `D-01`.
4. Chạy lại `pnpm db:seed`, `pnpm db:test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` và cập nhật báo cáo Phase 2A-1 trước khi xin duyệt mở Phase 2A-2.
