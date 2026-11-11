# PHASE 2A-1 — FINAL ACCEPTANCE & REMEDIATION REPORT

**Ngày lập báo cáo:** 12/11/2026  
**Giai đoạn:** `Phase 2A-1` — Database Bootstrap (`PostgreSQL 16 + Prisma 6 + Migrations + Seed + Integrity`)  
**Nhánh Git (`branch`):** `main`  
**Baseline trước Remediation:** [`1117e7a42599e0197aa0df560398b66b4c479364`](../../prisma/migrations/20261111175635_init/migration.sql) (`1117e7a`)  
**Commit Remediation (`R-01` → `R-04` + Evidence):** `605db97905d4f552a7a8cd7bb983f10565174fc9` (`605db97`) *(báo cáo nghiệm thu cuối cùng này được ghi nhận ngay ở commit `docs(audit)` kế tiếp trên `main` để giữ Git working tree sạch)*  
**Tài liệu đối chiếu:** [`PHASE_2A_1_TARGETED_ACCEPTANCE_EVIDENCE.md`](./PHASE_2A_1_TARGETED_ACCEPTANCE_EVIDENCE.md) · [`PHASE_2A_DATABASE_DESIGN.md`](../phase-2a/PHASE_2A_DATABASE_DESIGN.md) (`v2A.2`)

---

## 1. Tóm tắt Kết quả Remediation (`R-01` → `R-04`)

Toàn bộ yêu cầu khắc phục theo hai quyết định được Chủ dự án phê duyệt (**`D-01`**, **`D-02`**) đã hoàn tất đầy đủ, không mở rộng sang `apps/api/`, Auth, NestJS hay sửa đổi Prisma schema/migration:

| Hạng mục | Phạm vi thực hiện & Khắc phục | Trạng thái |
|---|---|---|
| **`R-01`** | Sửa checksum SHA-256 của `imac-studio-360.jpg` tại [`prisma/seed.ts`](../../prisma/seed.ts) từ chuỗi 63 ký tự hex (`fbab55dc257eb...`) sang đủ **64 ký tự hex** (`fbab55dc2257eb12981fbe37043c19549ed3f8b6bce31d008def115fb618c142`). Xác minh trực tiếp trên đĩa bằng `Get-FileHash` và truy vấn PostgreSQL `length(sha256_checksum) = 64`, `length(trim(trailing ' ' from sha256_checksum)) = 64`, **0 khoảng trắng đệm**. | **DONE & VERIFIED** |
| **`R-02`** | Nâng cấp [`prisma/verify-db-integrity.ts`](../../prisma/verify-db-integrity.ts) (`PRIMARY-DB` + `AC-07` + `AC-07-NEG`): resolve đường dẫn an toàn dưới `apps/web/public/`, chặn path traversal & symlink escape & URI nguy hiểm, đối chiếu file tồn tại, dung lượng byte chính xác, SHA-256 64 hex trực tiếp từ đĩa (không whitespace/padding), magic bytes + kích thước pixel ảnh (JPEG/PNG/WebP), và chạy **14 ca test âm tính / contract** (`AC-07-NEG`) — bao gồm xử lý tách biệt asset `s3://` / `https://` không thuộc local filesystem. | **DONE & VERIFIED** |
| **`R-03`** | Cập nhật [`prisma/seed.ts`](../../prisma/seed.ts) cho cả 5 ảnh panorama (`campus-courtyard-360.jpg`, `auditorium-360.jpg`, `library-360.jpg`, `it-lab-360.jpg`, `imac-studio-360.jpg`): giữ file & kích thước `2048×1024` (`is_valid_2_to_1 = true` chỉ phản ánh tỷ lệ pixel), đặt **`is_preview_approved = false`**, thay `camera_metadata` thành khai báo trung thực (`assetOrigin: "AI_GENERATED_SYNTHETIC_PLACEHOLDER"`, `isTrueEquirectangular360x180: false`, `isRealQtscCapture: false`, `hasExif: false`, `hasGpanoXmp: false`, bỏ hoàn toàn `ProjectionType: "equirectangular"` và `SeedSource: "QTSC-Static"`), và chuyển toàn bộ 5 `TourNode` sang **`status = 'DRAFT'`** (`0` `PUBLISHED` placeholder). Giữ nguyên [`tang-1.jpg`](../../samples/panoramas/tang-1.jpg) & [`tang-2.jpg`](../../samples/panoramas/tang-2.jpg) trong `samples/panoramas/`. | **DONE & VERIFIED** |
| **`R-04`** | Đính chính toàn bộ 4 tài liệu tổng hợp về chuẩn **`17` Prisma enums** (`PublishStatus` bị đếm trùng trước đó), không thay đổi `OD-01..OD-10` hay nội dung kiến trúc khác. Quét lại bằng `Select-String` trả về `0` kết quả `"18 enums"` / `"18 Prisma enums"` trên 4 file. | **DONE & VERIFIED** |

---

## 2. Danh sách File Thay Đổi

### 2.1. Trong Commit Remediation (`605db97` — `7` files)

| File | Hành động | Nội dung thay đổi |
|---|---|---|
| [`prisma/seed.ts`](../../prisma/seed.ts) | Sửa | Vá SHA-256 64 hex cho `imac-studio-360.jpg` (`R-01`); thêm `isPreviewApproved` & `cameraMetadata` tường minh trên từng asset (`5` `PANORAMA_2_1` = `isPreviewApproved: false`, AI synthetic placeholder metadata; `6` `PHOTO_2D` = `isPreviewApproved: true`, metadata dev provenance `R-06`); chuyển 5 `TourNode` từ `PUBLISHED` sang `DRAFT` (`R-03`); bổ sung header/comment provenance `R-06`. |
| [`prisma/verify-db-integrity.ts`](../../prisma/verify-db-integrity.ts) | Sửa | Bổ sung `classifyAndResolveObjectKey`, `assertNoTraversalOrUnsafeChars`, `assertValidSha256Format`, `readImageDimensionsAndMime` (JPEG/PNG/WebP), `verifyMediaAssetRecord`, `runMediaAssetNegativeSuite`; nâng cấp `PRIMARY-DB` và `AC-07` đối chiếu 11/11 asset thật trên đĩa + thêm `AC-07-NEG` (`14` test âm tính/contract). |
| [`docs/project-audit/PHASE_2A_SCOPE_FINALIZATION_REPORT.md`](./PHASE_2A_SCOPE_FINALIZATION_REPORT.md) | Sửa (`R-04`) | Sửa `"18 enums"` / `"18 Prisma enums"` → `"17 enums"` / `"17 Prisma enums"` tại `L16`, `L31`. |
| [`docs/project-audit/PHASE_2A_CONTRACT_ALIGNMENT_REPORT.md`](./PHASE_2A_CONTRACT_ALIGNMENT_REPORT.md) | Sửa (`R-04`) | Sửa `"18 Prisma enums"` → `"17 Prisma enums"` tại `L29`, `L70`, `L96`, `L180`. |
| [`docs/phase-2a/PHASE_2A_SYSTEM_ARCHITECTURE.md`](../phase-2a/PHASE_2A_SYSTEM_ARCHITECTURE.md) | Sửa (`R-04`) | Sửa `"18 enums"` → `"17 enums"` tại `L180`. |
| [`docs/phase-2a/PHASE_2A_IMPLEMENTATION_ROADMAP.md`](../phase-2a/PHASE_2A_IMPLEMENTATION_ROADMAP.md) | Sửa (`R-04`) | Sửa `"18 Prisma enums"` → `"17 Prisma enums"` tại `L40`. |
| [`docs/project-audit/PHASE_2A_1_TARGETED_ACCEPTANCE_EVIDENCE.md`](./PHASE_2A_1_TARGETED_ACCEPTANCE_EVIDENCE.md) | Thêm mới | Hồ sơ điều tra forensic xác minh `17` vs `18` enums và nguồn gốc 5 panorama AI. |

### 2.2. File Báo Cáo Nghiệm Thu Cuối (Commit `docs(audit)` kế tiếp)

- [`docs/project-audit/PHASE_2A_1_FINAL_ACCEPTANCE_REPORT.md`](./PHASE_2A_1_FINAL_ACCEPTANCE_REPORT.md) *(file này)*.

---

## 3. Bằng chứng PostgreSQL (Truy vấn trực tiếp sau Seed)

### 3.1. Xác nhận đúng `17` Enum Types (`D-01`)

Truy vấn `docker exec fpt_virtual_campus_db psql -U fpt_admin -d virtual_campus_360`:

```sql
SELECT count(*), string_agg(t.typname, ', ' ORDER BY t.typname)
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE t.typtype = 'e' AND n.nspname = 'public';
```

**Kết quả thực tế:**

```text
17|AccountStatus, ActivationStatus, AlignmentStatus, BuildingCategory, FloorPlanFormat, HotspotType, InvitationChannel, InvitationStatus, MapBuildingIconKey, MediaKind, ParticipationStatus, ProcessingStatus, ProvisioningMethod, PublishStatus, SessionPeriod, TourEdgeType, UserType
```

### 3.2. Xác nhận `5` Panorama Placeholder `is_preview_approved = false` & `camera_metadata` đã sửa (`R-03`)

Truy vấn `camera_metadata::text` cho `asset_kind = 'PANORAMA_2_1'`:

```text
auditorium-360.jpg => {"hasExif": false, "assetOrigin": "AI_GENERATED_SYNTHETIC_PLACEHOLDER", "hasGpanoXmp": false, "sourceFormat": "AI_16_9_RECTILINEAR_STRETCHED_TO_2_1", "placeholderNote": "Rectilinear 16:9 AI hall render shared with locations/auditorium-hall.jpg and resized to 2:1; lacks spherical 360x180 wrap.", "projectionStatus": "UNVERIFIED_RECTILINEAR_PLACEHOLDER", "sourceDimensions": "1376x768", "isRealQtscCapture": false, "containerDimensions": "2048x1024", "isTrueEquirectangular360x180": false, "requiresReal360ReplacementBeforeGoLive": true}
campus-courtyard-360.jpg => {"hasExif": false, "assetOrigin": "AI_GENERATED_SYNTHETIC_PLACEHOLDER", "hasGpanoXmp": false, "sourceFormat": "AI_16_9_STRETCHED_TO_2_1", "placeholderNote": "AI-generated 16:9 courtyard render stretched/blended to 2:1 container for Phase 2A dev; not a 360x180 camera capture.", "projectionStatus": "UNVERIFIED_SYNTHETIC_PLACEHOLDER", "sourceDimensions": "1376x768", "isRealQtscCapture": false, "containerDimensions": "2048x1024", "isTrueEquirectangular360x180": false, "requiresReal360ReplacementBeforeGoLive": true}
imac-studio-360.jpg => {"hasExif": false, "assetOrigin": "AI_GENERATED_SYNTHETIC_PLACEHOLDER", "hasGpanoXmp": false, "sourceFormat": "AI_16_9_STRETCHED_TO_2_1", "placeholderNote": "AI-generated 16:9 studio render stretched/blended to 2:1 container with +/-180 deg seam mismatch; dev placeholder only.", "projectionStatus": "UNVERIFIED_SYNTHETIC_PLACEHOLDER", "sourceDimensions": "1376x768", "isRealQtscCapture": false, "containerDimensions": "2048x1024", "isTrueEquirectangular360x180": false, "requiresReal360ReplacementBeforeGoLive": true}
it-lab-360.jpg => {"hasExif": false, "assetOrigin": "AI_GENERATED_SYNTHETIC_PLACEHOLDER", "hasGpanoXmp": false, "sourceFormat": "AI_16_9_STRETCHED_TO_2_1", "placeholderNote": "AI-generated 16:9 lab render stretched/blended to 2:1 container (contains distorted AI wall text and seam discontinuities); dev placeholder only.", "projectionStatus": "UNVERIFIED_SYNTHETIC_PLACEHOLDER", "sourceDimensions": "1376x768", "isRealQtscCapture": false, "containerDimensions": "2048x1024", "isTrueEquirectangular360x180": false, "requiresReal360ReplacementBeforeGoLive": true}
library-360.jpg => {"hasExif": false, "assetOrigin": "AI_GENERATED_SYNTHETIC_PLACEHOLDER", "hasGpanoXmp": false, "sourceFormat": "AI_16_9_STRETCHED_TO_2_1", "placeholderNote": "AI-generated 16:9 library render stretched/blended to 2:1 container for Phase 2A dev; not a 360x180 camera capture.", "projectionStatus": "UNVERIFIED_SYNTHETIC_PLACEHOLDER", "sourceDimensions": "1376x768", "isRealQtscCapture": false, "containerDimensions": "2048x1024", "isTrueEquirectangular360x180": false, "requiresReal360ReplacementBeforeGoLive": true}
```

### 3.3. Xác nhận `5` `TourNode` placeholder ở trạng thái không công khai (`DRAFT`)

```text
      slug       | status | floor_plan_id |    original_filename     | is_valid_2_to_1 | is_preview_approved
-----------------+--------+---------------+--------------------------+-----------------+---------------------
 cong-chao-qtsc  | DRAFT  |               | campus-courtyard-360.jpg | t               | f
 sanh-innovation | DRAFT  |               | auditorium-360.jpg       | t               | f
 thu-vien        | DRAFT  |               | library-360.jpg          | t               | f
 lab-it          | DRAFT  |               | it-lab-360.jpg           | t               | f
 studio-imac     | DRAFT  |               | imac-studio-360.jpg      | t               | f
(5 rows)
```

*(Ghi chú giới hạn schema theo yêu cầu `R-03`: Bảng `media_assets` hiện chỉ có các cột `is_valid_2_to_1`, `is_preview_approved` và `camera_metadata` JSONB — chưa có cột boolean/enum tách biệt cho ảnh synthetic AI vs ảnh chụp camera thật. Đã biểu diễn trung thực qua `is_preview_approved = false`, `camera_metadata`, và `tour_nodes.status = 'DRAFT'` mà **không** tự ý thêm cột/enum vào `prisma/schema.prisma`.)*

---

## 4. Bằng chứng Checksum & File Integrity (`11/11` Asset Local + `14` Ca Test Âm Tính)

### 4.1. Đối chiếu trực tiếp Disk (`Get-FileHash` / `AC-07`) vs PostgreSQL `media_assets`

| # | `original_filename` | `asset_kind` | `file_size_bytes` (Disk = DB) | Pixel (`W×H`) | `raw_len` / `hex_len` | `is_valid_2_to_1` / `is_preview_approved` | SHA-256 (Disk = DB 64 hex) |
|---:|---|---|---:|---|---|---:|---|
| 1 | `campus-courtyard-360.jpg` | `PANORAMA_2_1` | `477,371` | `2048×1024` | `64 / 64` | `t / f` | `d0e9add7e38d3abaff67af1d27f56927a1140f6c91b789cb73cb4d40900bb594` |
| 2 | `auditorium-360.jpg` | `PANORAMA_2_1` | `397,578` | `2048×1024` | `64 / 64` | `t / f` | `facd64dc26f2b183e747cfabdf5c7be51ff6226456bc7d228c4ac231f2950e9b` |
| 3 | `library-360.jpg` | `PANORAMA_2_1` | `400,694` | `2048×1024` | `64 / 64` | `t / f` | `ff61132ed57d9f079418695b1172072beae348983fb075e720667e0101e43433` |
| 4 | `it-lab-360.jpg` | `PANORAMA_2_1` | `317,163` | `2048×1024` | `64 / 64` | `t / f` | `37a09a47bbd706ffb3ec36fe252de5cf1eaf285e8dac2706d5c14863fad390dc` |
| 5 | `imac-studio-360.jpg` | `PANORAMA_2_1` | `344,948` | `2048×1024` | `64 / 64` | `t / f` | **`fbab55dc2257eb12981fbe37043c19549ed3f8b6bce31d008def115fb618c142`** *(Fixed)* |
| 6 | `auditorium-hall.jpg` | `PHOTO_2D` | `208,411` | `1280×720` | `64 / 64` | `f / t` | `76791067d60f9e15323c0e857ea1434ea4f08a6a0facf2bfa59fdbffadf58f2c` |
| 7 | `building-innovation.jpg` | `PHOTO_2D` | `311,718` | `1280×720` | `64 / 64` | `f / t` | `0b365cfe6948f689eaf3bebe840d76ec71400d676aaeba1e58042d7f69a008bd` |
| 8 | `lab-it.jpg` | `PHOTO_2D` | `170,968` | `1280×720` | `64 / 64` | `f / t` | `5f77102615043258a9c55bf6807a13f9f2e295f9ab8331203db592f9e99fb02b` |
| 9 | `library-reading.jpg` | `PHOTO_2D` | `192,862` | `1280×720` | `64 / 64` | `f / t` | `2201c1479dbdf66e9d3f0c8bad8778d3d19d0133c9530a6c0e883e80105bade7` |
| 10 | `sports-complex.jpg` | `PHOTO_2D` | `313,369` | `1280×720` | `64 / 64` | `f / t` | `87ad930fa529e66abc86c27f64885c1a4674aba3c19779fe0bc7d5842407ff20` |
| 11 | `studio-imac.jpg` | `PHOTO_2D` | `180,931` | `1280×720` | `64 / 64` | `f / t` | `79cfbd26dfc140d7f9052c91cc4119beaa26b3ff186d131b790ad518b0c9b03d` |

### 4.2. Bằng chứng `AC-07-NEG` (`14/14` Test Âm Tính & Contract Non-Local PASS)

Chạy trong [`prisma/verify-db-integrity.ts`](../../prisma/verify-db-integrity.ts) trên thư mục cách ly tạm (`os.tmpdir()`):

- `missing-file` → ném lỗi `MISSING_FILE` khi file không tồn tại trên đĩa.
- `checksum-off-by-1-char` → ném lỗi `SHA256_MISMATCH` khi sai 1 ký tự cuối.
- `checksum-missing-char-63` → ném lỗi `INVALID_SHA256_FORMAT` khi thiếu ký tự (`length=63`).
- `checksum-trailing-whitespace` → ném lỗi `INVALID_SHA256_WHITESPACE` khi có khoảng trắng đệm kiểu `CHAR(64)`.
- `file-size-mismatch` → ném lỗi `FILE_SIZE_MISMATCH` khi `fileSizeBytes` lệch thực tế.
- `dimensions-mismatch` & `height-mismatch` → ném lỗi `DIMENSIONS_MISMATCH` khi sai `width` hoặc `height`.
- `path-traversal-dotdot`, `path-traversal-encoded` (`%2e%2e`), `path-traversal-backslash`, `forbidden-data-uri` → ném lỗi `PATH_TRAVERSAL` / `UNSAFE_OBJECT_KEY` / `FORBIDDEN_DATA_URI` và từ chối đọc ngoài `publicRoot` (kèm kiểm tra `fs.realpathSync`).
- `non-local-s3-https-contract-handled` → URI `s3://...` & `https://...` khi bật `allowRemoteAssets: true` được phân loại `NON_LOCAL_REMOTE_OBJECT` và xác thực metadata contract mà **không** đọc nhầm filesystem local; đồng thời `remote-asset-with-bad-checksum` và `remote-asset-rejected-in-local-seed-mode` vẫn bị từ chối chính xác.

---

## 5. Kết quả Chạy Lệnh & Kiểm Thử Thực Tế

| Lệnh / Bộ kiểm thử | Kết quả quan sát | Chi tiết |
|---|---|---|
| `pnpm db:seed` (Run 1) | **PASS (`exit 0`)** | `"adminAction": "PRESERVED_EXISTING_ADMIN_PASSWORD"`; cập nhật sạch bản ghi hiện có về `1` user, `3` roles, `10` permissions, `18` rolePermissions, `11` locationTypes, `1` campus, `5` buildings, `6` floors, `0` floorPlans, `11` mediaAssets, `6` locations, `6` locationMedia, `5` tourNodes, `11` tourEdges, `16` hotspots, `1` event, `6` sessions, `4` faqs, `3` quizItems. |
| `pnpm db:seed` (Run 2 — Idempotency) | **PASS (`exit 0`)** | `"adminAction": "PRESERVED_EXISTING_ADMIN_PASSWORD"`; toàn bộ 19 bộ đếm bảng khớp 100% với Run 1, không nhân đôi bản ghi hay ghi đè mật khẩu admin. |
| `pnpm exec tsc --noEmit ... prisma/seed.ts prisma/verify-db-integrity.ts` | **PASS (`exit 0`)** | `0` lỗi TypeScript `--strict` trên script DB và integrity suite. |
| `pnpm db:test` (`tsx prisma/verify-db-integrity.ts`) | **PASS (`13/13` checks, `failed: 0`)** | `PRIMARY-DB`, `AC-03`, `AC-05-IDEMP`, `AC-05-KEEP-PW`, `AC-06.1`, `AC-06.2`, `AC-06.3`, `AC-06.4`, `AC-06.5/6`, `AC-06.7`, `AC-07` (`11/11` files), `AC-07-NEG` (`14` test cases), `AC-08` (drop/create scratch DB → `migrate deploy` → `seed`). |
| `Select-String ... '18\s*(Prisma\s*)?enums?'` | **PASS (`0` matches)** | Cả 4 tài liệu `R-04` không còn khẳng định `"18"` enums. |
| `pnpm typecheck` | **PASS (`exit 0`)** | `@fpt-campus/shared` & `web` đều sạch lỗi `tsc --noEmit`. |
| `pnpm lint` | **PASS (`exit 0`)** | `eslint` trên `apps/web` không lỗi. |
| `pnpm build` | **PASS (`exit 0`)** | `Next.js 16.4.6 (Turbopack)` compile sạch `37.8s`, TypeScript `1746ms`, xuất `29/29` static pages trong `990ms`. |
| `check_md_links.cjs` | **PASS (`exit 0`)** | Chạy sau khi ghi báo cáo này: `0` broken markdown links trên toàn repo. |
| Kiểm tra `samples/panoramas/` | **PASS** | `tang-1.jpg` (`301,797 B`) và `tang-2.jpg` (`350,140 B`) giữ nguyên vẹn tại `samples/panoramas/`. |

---

## 6. Ghi nhận `R-05` & `R-06` (Chuyển giao Phase 2A-2 / 2C, không sửa ngoài phạm vi)

- **`R-05` (Case Mapping `@fpt-campus/shared` ↔ PostgreSQL):** Không chỉnh sửa `packages/shared` hay `prisma/schema.prisma` trong bản vá này. Ghi nhận rõ cho Phase 2A-2 DTO Mapper trong `apps/api`:
  - [`BuildingCategory`](../../packages/shared/src/campus.ts#L20) trên shared contract dùng chữ thường (`"academic" | "lab" | "facility"`), còn PostgreSQL [`BuildingCategory`](../../prisma/schema.prisma#L46-L50) lưu chữ hoa (`ACADEMIC | LAB | FACILITY`).
  - Bổ sung ghi nhận tương tự đối với [`MapBuildingIconKey`](../../packages/shared/src/campus.ts#L22-L27) (`"innovation" | "it-building" | "design-studio" | "academic-hall" | "sports"`) vs PostgreSQL [`MapBuildingIconKey`](../../prisma/schema.prisma#L52-L58) (`INNOVATION | IT_BUILDING | DESIGN_STUDIO | ACADEMIC_HALL | SPORTS`) — cần chuẩn hóa mapper hai chiều tại tầng NestJS DTO/Service ở Phase 2A-2.
- **`R-06` (Phân loại Dữ liệu QTSC Khởi tạo):** Toàn bộ tọa độ WGS84 (`lat`, `lng`), route waypoints, danh sách tòa nhà/tầng/địa điểm, và lịch trình/FAQ/Quiz Open Day trong [`prisma/seed.ts`](../../prisma/seed.ts) được ghi chú rõ là **dữ liệu khởi tạo phục vụ phát triển (chưa xác minh thực địa)**, giữ nguyên cấu trúc chuẩn bị cho giai đoạn khảo sát & nạp dữ liệu thực địa ở Phase 2C mà không tự ý thay đổi hay bịa tọa độ thực tế.

---

## 7. Scope Compliance, Git Commit SHA & Trạng thái Working Tree

| Điều kiện ranh giới bắt buộc | Kết quả kiểm chứng thực tế |
|---|---|
| `apps/api/` chưa khởi tạo | `Test-Path 'apps/api'` → **`False`** |
| Không chạm `apps/web/**`, `packages/shared/**`, `prisma/schema.prisma`, `prisma/migrations/**`, `docker-compose.yml`, `.env.example` | `git diff --name-only -- apps/web packages/shared prisma/schema.prisma prisma/migrations docker-compose.yml .env.example` *(trước commit `605db97`)* → **Trống**; kiểm tra commit `605db97` xác nhận chỉ gồm 7 file đúng phạm vi |
| Không thêm Redis, BullMQ, MinIO, S3, Auth hoặc UI changes | **Tuân thủ 100%** |
| Không thay đổi `OD-01` → `OD-10` | **Tuân thủ 100%** |
| Baseline & Commit SHA | Baseline: `1117e7a42599e0197aa0df560398b66b4c479364` (`1117e7a`) → Remediation Commit: **`605db97905d4f552a7a8cd7bb983f10565174fc9`** (`605db97`) *(kèm commit `docs(audit)` cho file báo cáo này)* |
| Git Working Tree Status (sau commit cuối) | Clean (`git status --short` rỗng) |

---

## 8. Vấn đề còn tồn tại & Lưu ý chuyển tiếp sang Phase 2A-2 / 2C

Không còn blocker kỹ thuật nào thuộc phạm vi Phase 2A-1. Các lưu ý mang tính bản chất lộ trình đã thống nhất:
1. **5 `TourNode` đang `DRAFT` (`D-02`):** Do dùng ảnh placeholder `is_preview_approved = false`, Phase 2A-2 khi triển khai Public Read APIs phải lọc `status = 'PUBLISHED' AND deleted_at IS NULL` để các điểm placeholder này không bị public như tour thật (khi chưa có node `PUBLISHED` mới, `/public/tour/nodes` sẽ trả `[]`).
2. **Thay ảnh 360° thật trước Go-Live / Phase 2C:** Bắt buộc chụp và duyệt ảnh equirectangular `2:1` thật (lấp dữ liệu thực địa QTSC cho `R-06` và thay 5 AI placeholders).
3. **Giới hạn schema ghi nhận (`R-03`):** Bảng `media_assets` chưa có cột chuyên biệt phân tách `AI placeholder` vs `camera 360° thật` ngoài JSONB `camera_metadata` và cờ `is_preview_approved`; có thể bổ sung ở migration tương lai nếu nghiệp vụ cần lọc SQL trực tiếp.

---

## 9. Đề xuất Nghiệm thu Cuối cùng

**Đề xuất:** **`ACCEPT`** — Toàn bộ điều kiện tiên quyết của Chủ dự án cho **Phase 2A-1** (`R-01` → `R-04` có bằng chứng thực tế, `AC-07` kiểm tra file thật + `14` ca test âm tính/contract, `0` placeholder được đánh dấu duyệt hay public `PUBLISHED`, `11/11` asset khớp SHA-256 trên đĩa, `pnpm db:seed` / `pnpm db:test` / `pnpm typecheck` / `pnpm lint` / `pnpm build` đều PASS, tuân thủ ranh giới tuyệt đối) đã hoàn tất.

**Trạng thái hiện tại:** **ĐÃ DỪNG** sau khi hoàn tất báo cáo & commit — chờ Chủ dự án xác nhận nghiệm thu Phase 2A-1 trước khi cho phép mở **Phase 2A-2**.
