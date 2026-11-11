# ĐẶC TẢ API CONTRACT `/api/v1` — PHASE 2A

**Phiên bản:** 2A.2 (Aligned with `OD-01` → `OD-10`)  
**Base URL (Local Dev, khớp `.env.example`):** `http://localhost:4000/api/v1`  
**Định dạng chuẩn:** JSON (`application/json`), UTF-8, ISO-8601 timestamps (`UTC`).  
**Chuẩn xác thực:** `Authorization: Bearer <accessToken>` kết hợp Cookie `HttpOnly` cho Refresh Token.  
**Hợp đồng TypeScript chia sẻ:** `@fpt-campus/shared` (`packages/shared/src/*` → `dist/`).

---

## 1. Quy chuẩn Response & Error Envelope

### 1.1. Thành công (Success Envelope)
```json
{
  "success": true,
  "data": { },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "requestId": "req_01J..."
  }
}
```

### 1.2. Lỗi chuẩn hóa (Error Envelope)
```json
{
  "success": false,
  "error": {
    "code": "TOUR_VALIDATION_FAILED",
    "message": "Không thể xuất bản tầng vì còn điểm panorama chưa đặt lên mặt bằng.",
    "details": [
      {
        "rule": "VAL_UNPLACED_NODE",
        "nodeId": "9f1a...",
        "nodeSlug": "node-t3-a302-02"
      }
    ]
  },
  "meta": {
    "requestId": "req_01J...",
    "timestamp": "2026-11-11T09:00:00.000Z"
  }
}
```

| HTTP Code | Ý nghĩa & Chuẩn xử lý |
| :--- | :--- |
| `200` / `201` / `202` | `202 Accepted` dùng cho tác vụ xử lý ảnh/PDF bất đồng bộ (`Media`, `FloorPlan`) ở Phase 2A-3+ |
| `400` | Sai DTO validation (`class-validator` / `zod`), sai tỷ lệ panorama 2:1, sai file magic bytes |
| `401` | Thiếu / hết hạn Access Token hoặc sai thông tin đăng nhập (luôn trả câu thông báo chung) |
| `403` | Thiếu Permission RBAC tương ứng hoặc `PASSWORD_CHANGE_REQUIRED` khi `mustChangePassword === true` |
| `404` | Không tìm thấy tài nguyên hoặc đã soft-delete |
| `409` | Xung đột (`slug`/`code`/`email`/`phone` trùng lặp, `IDENTITY_CONFLICT`, hoặc Floor cần re-align sau thay thế mặt bằng) |
| `422` | Nghiệp vụ không cho phép (VD: `PUBLISH` khi Graph Validator còn lỗi `ERROR`) |
| `429` | Vượt ngưỡng Rate Limit |

---

## 2. Public APIs & Ranh giới Cấu hình Tĩnh (`OD-01`..`OD-08`)

> [!NOTE]
> Toàn bộ endpoints dưới `/api/v1/public/*` chỉ trả tài nguyên có `status = 'PUBLISHED'` và `deleted_at IS NULL`, tuyệt đối lọc bỏ URL tệp `original`, tài khoản/nội bộ và đáp án quiz (`correctIndex`).
>
> **Ranh giới Tĩnh vs Database (`OD-03` Phương án B):**
> - **Phục vụ từ PostgreSQL qua API:** `campuses` (kèm `originPoint`, `landmarks`), `buildings` (`Leaflet WGS84`), `floors`/`floor_plans`, `locations`, `tour_nodes`/`hotspots`/`tour_edges`, `open_day_events`, `open_day_sessions`, `open_day_faqs`, và `open_day_quiz_items`.
> - **Giữ cấu hình web tĩnh trong MVP (`apps/web`):** bài viết `/news` (`CAMPUS_GUIDE_ARTICLES`), thông tin định danh trường tĩnh (`OFFICIAL_CAMPUS_INFO`: `shortName`, `campusLabel`, `ward/district/city`, `coordinatesLabel`, các URL `caodang.fpt.edu.vn`, `supportHours`), và văn bản UI khung vỏ. Không quy gán API cho các thành phần tĩnh này.

### 2.1. `GET /api/v1/public/campus` (`OD-01`)
Trả về thông tin khuôn viên mặc định (`originPoint`, `landmarks`, `defaultEntryNodeSlug`) và danh sách tòa nhà chuẩn **Leaflet + OpenStreetMap + WGS84** cho `/map` (`CampusGISMap.tsx`).
- **Response (`data` — `PublicCampusResponseDto`):**
  ```json
  {
    "campus": {
      "id": "uuid",
      "code": "QTSC-Q12",
      "name": "Trường Cao đẳng FPT Polytechnic — Cơ sở TP.HCM (CVPM Quang Trung)",
      "address": "Tòa nhà Innovation, Lô 24, Công viên Phần mềm Quang Trung, Đường Tô Ký, Phường Trung Mỹ Tây, Quận 12, TP.HCM",
      "defaultEntryNodeSlug": "cong-chao-qtsc",
      "originPoint": {
        "lat": 10.852825,
        "lng": 106.62669,
        "label": "Cổng chính QTSC (Tô Ký)",
        "addressNote": "Đường Tô Ký, Lối vào chính Công viên Phần mềm Quang Trung, Q.12"
      },
      "landmarks": []
    },
    "buildings": [
      {
        "id": "uuid",
        "code": "INNOVATION",
        "slug": "toa-nha-innovation",
        "name": "Tòa Nhà Innovation (Lô 24 QTSC)",
        "shortName": "Tòa Innovation",
        "category": "academic",
        "categoryLabel": "Trung tâm & Hội trường",
        "floorsLabel": "Tầng Trệt – Tầng 4",
        "summary": "Khu vực điều hành trung tâm, sảnh đón tiếp Open Day, Thư viện số mở và Hội trường đa năng.",
        "description": "...",
        "highlights": ["Sảnh Đón Tiếp & Cổng Check-in Open Day", "..."],
        "coverUrl": "/images/locations/building-innovation.jpg",
        "defaultNodeSlug": "sanh-innovation",
        "lat": 10.852935,
        "lng": 106.629409,
        "addressNote": "Lô 24, Đường Khu Trung tâm, CVPM Quang Trung, P. Trung Mỹ Tây, Q.12",
        "statusNote": "Điểm check-in Open Day chính",
        "mapIconKey": "innovation",
        "routeWaypoints": [
          [10.852825, 106.62669],
          [10.852935, 106.629409]
        ],
        "gisX": 50,
        "gisY": 42,
        "floorCount": 5,
        "publishedNodeCount": 3
      }
    ]
  }
  ```

### 2.2. `GET /api/v1/public/buildings/:slug` & `GET /api/v1/public/buildings/:slug/floors`
- **`GET /api/v1/public/buildings/:slug`**: Chi tiết đầy đủ 1 tòa nhà Leaflet + danh sách tóm tắt tầng & địa điểm thuộc tòa nhà.
- **`GET /api/v1/public/buildings/:slug/floors`**: Danh sách tầng đã xuất bản sắp theo `levelIndex ASC`, gồm:
  - `activeFloorPlan`: `null` nếu tầng chưa upload mặt bằng (`OD-10`), hoặc `{ id, version, sourceFormat, renderUrl, thumbUrl, renderWidth, renderHeight, northOffsetDeg }`
  - `locations`: `{ id, slug, code, name, shortDesc, category, categoryLabel, floorNormX, floorNormY, floorPolygonNorm, isPublicAccessible, restrictionNote, primaryNodeSlug }` *(ghi chú: `primaryNodeSlug: string | null`)*
  - `nodes`: danh sách `TourNode` đã publish kèm `{ id, slug, title, locationId, floorPlanId, floorNormX, floorNormY, headingOffsetDeg, thumbUrl }`

### 2.3. `GET /api/v1/public/tour/nodes` & `GET /api/v1/public/tour/nodes/:slug`
- **`GET /api/v1/public/tour/nodes`**: Trả về danh sách tóm tắt toàn bộ `TourNode` `PUBLISHED` (`TourNodeSummaryDto[]`) phục vụ thanh chọn điểm nhìn (`TourSceneSelector.tsx`) và danh sách node cho bản đồ.
- **`GET /api/v1/public/tour/nodes/:slug`**: Nạp trọn gói dữ liệu để `PanoramaStage.tsx` kết xuất một góc nhìn 360° (`?quality=desktop|mobile`):
  ```json
  {
    "node": {
      "id": "uuid",
      "slug": "cong-chao-qtsc",
      "title": "Toàn cảnh Khuôn viên QTSC",
      "intro": "Góc nhìn toàn cảnh sân trung tâm tại CVPM Quang Trung...",
      "category": "exterior",
      "buildingCode": "INNOVATION",
      "buildingLabel": "Khuôn viên QTSC Q.12",
      "floorLabel": "Ngoài trời",
      "initialYaw": 0,
      "initialPitch": 2,
      "initialFov": 68,
      "headingOffsetDeg": 0,
      "floorPlanId": null,
      "floorNormX": null,
      "floorNormY": null,
      "panoramaUrl": "/images/panoramas/campus-courtyard-360.jpg",
      "fallbackMobileUrl": "/images/panoramas/campus-courtyard-360.jpg",
      "thumbUrl": "/images/locations/building-innovation.jpg"
    },
    "location": {
      "id": "uuid",
      "slug": "sanh-innovation",
      "name": "Sảnh Đón Tiếp Tòa Nhà Innovation",
      "typeCode": "LOBBY",
      "buildingCode": "INNOVATION",
      "floorId": "uuid-or-null",
      "siblingNodes": [
        { "slug": "cong-chao-qtsc", "title": "Toàn cảnh Khuôn viên QTSC" }
      ]
    },
    "hotspots": [
      {
        "id": "uuid",
        "hotspotType": "SCENE_LINK",
        "edgeType": "WALKWAY",
        "yaw": 15,
        "pitch": 4,
        "title": "Vào Thư viện Số (Tòa Innovation)",
        "body": null,
        "targetNodeSlug": "thu-vien",
        "targetEntryYaw": 0,
        "targetEntryPitch": 0,
        "targetFloorId": "uuid-floor-2",
        "payload": null
      }
    ]
  }
  ```

### 2.4. `GET /api/v1/public/locations` & `GET /api/v1/public/locations/:slug` (`OD-02`)
Phục vụ `/locations` (lọc theo `?buildingCode=`, `?category=common|lab|studio`, `?typeCode=`, `?q=`) và `/locations/[slug]`.
- Mỗi item trả đầy đủ: `{ id, slug, code, name, buildingCode, buildingName, floorLabel, category, categoryLabel, shortDesc, description, highlights[], imageUrl, gallery[], primaryNodeSlug, tourNodes[], isPublicAccessible, restrictionNote, status }`.
- Theo `OD-02`, nếu địa điểm chưa có ảnh 360° riêng (VD: `khu-the-thao-qtsc`), `primaryNodeSlug = null` và `tourNodes = []` (`LocationCard` tự fallback về nút "Định vị GIS").

### 2.5. `GET /api/v1/public/events` & `POST /api/v1/public/quiz/verify` (`OD-03`, `OD-08`)
- **`GET /api/v1/public/events`** (query tùy chọn `?eventKey=`): Phục vụ `/events` & `/games`. Trả từ DB:
  - `event`: `{ id, eventKey, title, subtitle, dateLabel, timeLabel, eventDate }`
  - `sessions`: danh sách `open_day_sessions` (`PUBLISHED`, `isPublic = true` hoặc hiển thị nhãn `accessType: 'public' | 'invited'`, `period: 'morning' | 'noon' | 'afternoon'`, `timeRange`, `locationLabel`, `buildingCode`, `nodeSlug`, `hostUnit`)
  - `faqs`: danh sách `open_day_faqs` (`id, question, answer, sortOrder`)
  - `quizItems`: danh sách `open_day_quiz_items` chỉ gồm `{ id, tourNodeSlug, questionText, options }` — **TUYỆT ĐỐI không trả `correctIndex` hay `explanation` trong payload `GET` (`OD-08`)**.
- **`POST /api/v1/public/quiz/verify`** *(Stateless — Không cần đăng nhập, Không lưu DB cá nhân, Không XP/Leaderboard — `OD-08`)*:
  - Request: `{ "items": [{ "questionId": "uuid", "selectedIndex": 1 }] }`
  - Response (`200`): `{ "results": [{ "questionId": "uuid", "selectedIndex": 1, "isCorrect": true, "correctIndex": 1, "explanation": "..." }], "correctCount": 1, "total": 1 }`

---

## 3. Authentication & Activation APIs (`/api/v1/auth/*` — Không có tự đăng ký công khai)

> [!IMPORTANT]
> Client Web lưu **`accessToken` chỉ trong RAM (React state/closure)** — không bao giờ lưu vào `localStorage` hay `sessionStorage`. Phiên đăng nhập duy trì thông qua cookie `HttpOnly` gọi `/api/v1/auth/refresh`. Nếu `user.mustChangePassword === true` (lần đầu dùng mật khẩu bootstrap), toàn bộ `/api/v1/admin/*` trả `403 PASSWORD_CHANGE_REQUIRED` cho đến khi hoàn tất `PATCH /api/v1/auth/me/password`.
> Khách tham quan tự do **không cần đăng nhập** và tuyệt đối **không có `POST /api/v1/auth/register`**. Nhóm `STUDENT`/`PARENT` Open Day kích hoạt qua token 1 lần có thời hạn.

| Method & Path | Mô tả | Ghi chú bảo mật |
| :--- | :--- | :--- |
| `POST /api/v1/auth/login` | Đăng nhập `{ "identifier", "password" }` — **`identifier` chấp nhận `username` (Admin/Staff), `email`, hoặc `phone` đã kích hoạt (`E.164`/VN, `OD-04`)** | Rate limit 5 req/phút/IP; Argon2id verify; set `refresh_token` vào `HttpOnly` cookie; trả `accessToken` + `{ id, username, fullName, email, phone, userType, accountStatus, activationStatus, mustChangePassword, roles, permissions }`. |
| `POST /api/v1/auth/refresh` | Đọc `refresh_token` từ Cookie `HttpOnly` | Rotate token mới, revoke token cũ; nếu phát hiện token reuse → thu hồi toàn bộ `family_id`. |
| `POST /api/v1/auth/logout` | Đăng xuất & thu hồi Refresh Token hiện tại | Clear Cookie `refresh_token` và ghi `audit_logs`. |
| `GET /api/v1/auth/me` | Lấy thông tin tài khoản hiện đăng nhập (`userType`, `roles`, `permissions`, `eventParticipations[]`) | Guard: Authenticated. |
| `PATCH /api/v1/auth/me/password` | Tự đổi mật khẩu (`{ currentPassword, newPassword }`) | Hạ cờ `mustChangePassword = false`; thu hồi toàn bộ refresh token phiên khác của chính user đó. |
| `POST /api/v1/auth/activate/validate` | Kiểm tra hợp lệ token/mã kích hoạt dùng 1 lần (`ADMIN_DIRECT` hoặc `EMAIL_SMS_INVITATION`) | Rate limit chặt; băm SHA-256 tra `account_invitations`; **không để lộ thông tin nhạy cảm hay raw token trong log**. |
| `POST /api/v1/auth/activate/complete` | Hoàn tất kích hoạt: user tự thiết lập mật khẩu riêng (`Argon2id`) | Đánh dấu token `ACTIVATED`, cập nhật `activation_status = 'ACTIVATED'`, cấm mật khẩu yếu; dùng single-use atomic update. Sau khi kích hoạt, user có thể đăng nhập bằng `email` hoặc `phone` đã cấp (`OD-04`). |

---

## 4. Admin APIs (`/api/v1/admin/*` — Bắt buộc Bearer JWT + RBAC Permission)

> [!IMPORTANT]
> Khi `user.mustChangePassword === true`, toàn bộ endpoints dưới `/api/v1/admin/*` chặn với HTTP `403 PASSWORD_CHANGE_REQUIRED` cho đến khi đổi mật khẩu ban đầu.

### 4.1. Quản lý Khuôn viên, Tòa nhà & Tầng (Permission: `campus:write`)
- `GET /api/v1/admin/campus` & `PATCH /api/v1/admin/campus` (cập nhật tên, địa chỉ, `originPoint`, `landmarks`, `defaultEntryNodeId`)
- `GET /api/v1/admin/buildings` (lọc theo `status`, `category`)
- `POST /api/v1/admin/buildings` / `PATCH /api/v1/admin/buildings/:id` / `DELETE /api/v1/admin/buildings/:id` (soft delete) — hỗ trợ đầy đủ trường **Leaflet WGS84 (`lat`, `lng`, `shortName`, `category`, `categoryLabel`, `floorsLabel`, `summary`, `description`, `highlights`, `addressNote`, `statusNote`, `mapIconKey`, `routeWaypoints`, `defaultNodeId`, và optional `gisX`, `gisY`)** theo `OD-01`.
- `GET /api/v1/admin/buildings/:buildingId/floors`
- `POST /api/v1/admin/buildings/:buildingId/floors` (`{ code, name, levelIndex, requiresFloorPlan? }`)
- `PATCH /api/v1/admin/floors/:id` / `DELETE /api/v1/admin/floors/:id` (từ chối nếu còn `TourNode` `PUBLISHED` trừ khi force archive)

### 4.2. Pipeline Upload, Thay thế & Căn chỉnh Mặt bằng Tầng (`floorplan:write`)
*(Trừu tượng qua `StorageAdapter` theo `OD-07`: khởi tạo `STORAGE_DRIVER=local` từ Phase 2A-2 cho Public Read/dev cục bộ; khi mở luồng upload Business Modules ở Phase 2A-3, `uploadUrl` trỏ về `POST /api/v1/admin/storage/local-upload/:token` nếu dùng `local`, hoặc Presigned PUT URL của MinIO/S3/R2 nếu bật `STORAGE_DRIVER=s3`.)*
- **`POST /api/v1/admin/floors/:floorId/floor-plans/presign`**
  - Request: `{ "filename": "tang3.pdf", "mimeType": "application/pdf", "fileSizeBytes": 4200100, "sourcePageNumber": 1, "replaceMode": "NEW_VERSION" }`
  - Response: `{ "floorPlanId": "uuid", "version": 2, "storageDriver": "s3 | local", "uploadUrl": "..." }`
- **`POST /api/v1/admin/floor-plans/:floorPlanId/confirm`**
  - Kích hoạt job chuyển đổi (PDF → WebP 300 DPI ≤ 3200px, SVG → Sanitize, PNG/JPG → WebP tối ưu), lưu snapshot tọa độ cũ vào `floor_plan_alignment_snapshots` và **đặt `needsRealignment = true` cho toàn bộ node trên tầng** bất kể tỷ lệ khung hình có đổi hay không.
- **`GET /api/v1/admin/floor-plans/:floorPlanId/status`**
  - Trả về: `{ processingStatus, renderUrl, renderWidth, renderHeight, alignmentStatus, nodesPendingRealignmentCount }`.
- **`GET /api/v1/admin/floors/:floorId/floor-plans/:floorPlanId/alignment-overlay`**
  - Trả về URL bản vẽ mới + URL bản vẽ cũ (`Ghost Overlay`) + danh sách snapshot `{ nodeId, locationId, oldNormX, oldNormY }` để Admin căn chỉnh trực quan.
- **`POST /api/v1/admin/floors/:floorId/floor-plans/:floorPlanId/confirm-alignment`** (`OD-06`)
  - Body: `{ "nodes": [{ "nodeId": "uuid", "floorNormX": 0.35, "floorNormY": 0.62 }], "locations": [{ "locationId": "uuid", "floorNormX": 0.34, "floorNormY": 0.60 }] }`
  - Thực hiện nguyên tử trong PostgreSQL Transaction: cập nhật `tour_nodes.floor_plan_id = floorPlanId`, cập nhật tọa độ mới `[0..1]`, đặt `needsRealignment = false`, cập nhật `floors.active_floor_plan_id = floorPlanId` + `floors.requires_floor_plan = true`, chuyển snapshot `alignmentStatus = "CONFIRMED"`, và ghi `audit_logs` (`ALIGNMENT_CONFIRMED`).

### 4.3. Quản lý Địa điểm (`Location`) & Media Pipeline (`media:upload`, `location:write`)
- **`POST /api/v1/admin/media/presign`**
  - Request: `{ "assetKind": "PANORAMA_2_1", "filename": "A302_01.jpg", "mimeType": "image/jpeg", "fileSizeBytes": 14500000, "declaredWidth": 5376, "declaredHeight": 2688, "sha256": "..." }`
  - Chặn ngay `400 UNSTITCHED_PANORAMA_UNSUPPORTED` (file `.insv`/`.insp`/RAW), `400 ASPECT_RATIO_NOT_2_TO_1` (như ảnh cylinder `5.77:1`), `400 PIXEL_RESOLUTION_TOO_LOW` (`< 2048×1024`), hoặc `400 FILE_TOO_LARGE` (`> 50 MB`).
  - Hỗ trợ `StorageAdapter` (`uploadUrl` S3 hoặc Local Upload token khi `STORAGE_DRIVER=local` + `POST /api/v1/admin/storage/local-upload/:token`).
- **`POST /api/v1/admin/media/:assetId/confirm`** → Đưa vào hàng đợi `BullMQ` (kiểm magic bytes + SHA-256 + Sharp sinh WebP `4096×2048` + `2048×1024` + `512×256`).
- **`POST /api/v1/admin/media/:assetId/approve-preview`** → Admin xác nhận đã xem 360° Preview đạt chuẩn (`isPreviewApproved = true`), sẵn sàng gắn vào `TourNode`.
- **`GET /api/v1/admin/media/:assetId/status`** & **`GET /api/v1/admin/media`** (phân trang, lọc theo `assetKind`, `processingStatus`, `isPreviewApproved`).
- **`GET /api/v1/admin/locations`** / **`POST /api/v1/admin/locations`** / **`PATCH /api/v1/admin/locations/:id`** / **`DELETE /api/v1/admin/locations/:id`** (soft delete)
  - Bao gồm gắn vị trí chuẩn hóa trên Floor Plan (`floorId`, `floorNormX`, `floorNormY`, `floorPolygonNorm`), `highlights[]`, `categoryLabel`, cờ `isPublicAccessible`, `restrictionNote`, `primaryNodeId` (có thể `null` theo `OD-02`).

### 4.4. Biên tập `TourNode`, `Hotspot` & `TourEdge` (`tour:write`)
- **`GET /api/v1/admin/tour/nodes`** & **`GET /api/v1/admin/tour/nodes/:id`** (kèm danh sách hotspots, edges, metadata node, panorama asset status)
- **`POST /api/v1/admin/tour/nodes`**
  - Request: `{ "slug": "...", "title": "...", "intro": "...", "category": "exterior | study | lab", "locationId": "uuid", "panoramaAssetId": "uuid", "floorPlanId": "uuid-or-null", "floorNormX": 0.42, "floorNormY": 0.58, "initialYaw": 0, "initialPitch": 0, "initialFov": 75 }`
  - *(Theo `OD-10`: Nếu tầng chưa có mặt bằng active, giữ `floorPlanId = null`, `floorNormX = null`, `floorNormY = null`.)*
- **`PATCH /api/v1/admin/tour/nodes/:id`** (Cập nhật `title`, `intro`, `category`, tọa độ `[0..1]`, `initialYaw/Pitch/Fov`, `headingOffsetDeg`, ngoại lệ `isTerminalApproved` & `terminalApprovalReason`).
- **`DELETE /api/v1/admin/tour/nodes/:id`** (`OD-06`): Soft-delete `tour_nodes.deleted_at = NOW()`, đặt `status = 'ARCHIVED'`, đồng thời trong PostgreSQL transaction gỡ `primary_node_id`/`default_node_id`/`default_entry_node_id` đang trỏ tới node này, xóa cứng `tour_edges` liên quan (cả chiều đi và chiều về) + `hotspots` thuộc node này, và ghi `audit_logs` (`TOUR_NODE_DELETED`).
- **`POST /api/v1/admin/tour/nodes/:nodeId/hotspots`**
  - Tạo Hotspot trên ảnh 360°. Nếu `hotspotType === "SCENE_LINK"`:
    ```json
    {
      "hotspotType": "SCENE_LINK",
      "yaw": 120.5,
      "pitch": -3.1,
      "title": "Vào phòng Lab AI A302",
      "targetNodeId": "uuid",
      "edgeType": "DOORWAY",
      "targetEntryYaw": 180.0,
      "isOneWayApproved": false,
      "oneWayApprovalReason": null,
      "createReverseEdge": true,
      "reverseHotspot": {
        "yaw": -5.0,
        "pitch": -2.0,
        "title": "Quay ra Hành lang Tầng 3"
      }
    }
    ```
  - Hỗ trợ tạo liên kết hai chiều nguyên tử (`PostgreSQL Transaction`) hoặc liên kết một chiều có lý do phê duyệt (`isOneWayApproved`), cùng liên kết xuyên tầng (`ELEVATOR` / `STAIRS`). Nếu `hotspotType` là `'INFO'` hoặc `'QUIZ_TRIGGER'`, ràng buộc SQL bắt buộc `edgeId = null`.
- **`PATCH /api/v1/admin/tour/hotspots/:id`** & **`DELETE /api/v1/admin/tour/hotspots/:id`** (Xóa hotspot đồng thời xóa `TourEdge` gắn liền).

### 4.5. Kiểm duyệt Đồ thị & Xuất bản (`tour:publish`)
- **`POST /api/v1/admin/tour/validate`**
  - Request: `{ "scope": "NODE" | "FLOOR" | "BUILDING" | "CAMPUS", "targetId": "uuid" }`
  - Response (`200`): `{ "isPublishable": false, "summary": { "errors": 1, "warnings": 1, "approvedExceptions": 2 }, "issues": [ ... ] }`
  - *Quy tắc `VAL_UNPLACED_NODE` (`OD-10`):* Chỉ báo `ERROR` khi tầng chứa node đã có `activeFloorPlanId != null` hoặc `requiresFloorPlan === true` mà node chưa gán tọa độ `[0..1]`; các `TourNode` có panorama 2:1 `READY` + duyệt Preview + đồ thị hợp lệ trên tầng chưa có mặt bằng (`floorPlanId = null`) vẫn đạt `isPublishable = true`.
- **`POST /api/v1/admin/tour/nodes/:nodeId/publish`**, **`POST /api/v1/admin/floors/:floorId/publish`** & **`POST /api/v1/admin/buildings/:buildingId/publish`**
  - Chạy lại Validator trong transaction trước khi set `status = 'PUBLISHED'`; trả `422` kèm danh sách lỗi nếu `errors > 0`. Ghi vết vào `audit_logs`.

### 4.6. Quản lý Sự kiện Open Day (`events:write` — `OD-03` Phương án B, `OD-05` Phương án A, `OD-08`)
- **Sự kiện (`open_day_events`):**
  - `GET /api/v1/admin/events`
  - `POST /api/v1/admin/events` / `PATCH /api/v1/admin/events/:id` / `DELETE /api/v1/admin/events/:id`
- **Lịch trình phiên (`open_day_sessions`):**
  - `GET /api/v1/admin/events/:eventId/sessions`
  - `POST /api/v1/admin/events/:eventId/sessions` / `PATCH /api/v1/admin/events/sessions/:sessionId` / `DELETE /api/v1/admin/events/sessions/:sessionId`
- **FAQ (`open_day_faqs`):**
  - `GET /api/v1/admin/events/faqs` (lọc tùy chọn `?eventId=`)
  - `POST /api/v1/admin/events/faqs` / `PATCH /api/v1/admin/events/faqs/:faqId` / `DELETE /api/v1/admin/events/faqs/:faqId`
- **Câu hỏi Orientation Quiz (`open_day_quiz_items`):**
  - `GET /api/v1/admin/events/quiz-items`
  - `POST /api/v1/admin/events/quiz-items` / `PATCH /api/v1/admin/events/quiz-items/:quizId` / `DELETE /api/v1/admin/events/quiz-items/:quizId`
- **Giới hạn phạm vi (`OD-05`, `OD-08`):** Không có endpoint Check-in QR / điểm danh (`checked_in_at`, `ticketCode`) và không có endpoint XP / Leaderboard trong MVP.

### 4.7. Quản lý Tài khoản Thống nhất, Cấp phát Kép, Import Excel 5 Bước & Audit (`users:manage`, `users:provision_openday`, `audit:read`)
- **`GET /api/v1/admin/users`** (lọc theo `userType`, `accountStatus`, `activationStatus`, `provisioningMethod`, `openDayEventKey`), **`POST /api/v1/admin/users`** (cấp thủ công cho `STAFF` hoặc Open Day `STUDENT`/`PARENT` kèm danh sách `eventIds[]` / `eventKeys[]` theo 1 trong 2 phương thức `ADMIN_DIRECT` [trả mã/link kích hoạt 1 lần có thời hạn] hoặc `EMAIL_SMS_INVITATION` — **tuyệt đối không sinh mật khẩu mặc định dùng chung hay mật khẩu plaintext**), **`PATCH /api/v1/admin/users/:id/status`** (khóa/mở khóa, reset luồng kích hoạt, cấm tự khóa tài khoản `admin` gốc đang đăng nhập). Không có endpoint tự đăng ký công khai `/register`.
- **`POST /api/v1/admin/users/:id/invitations/resend`**: Vô hiệu hóa token lời mời cũ và phát hành/gửi lại token mới (`INVITATION_PENDING → SENT`), theo dõi `SENT / EXPIRED / ACTIVATED / FAILED`.
- **Import Excel/CSV 5 bước (`.xlsx`/`.csv` — Cấm lưu file gốc / tên file / đường dẫn file gốc; `OD-04` dedup `email -> phone`):**
  - `POST /api/v1/admin/users/import/preview`: Đọc luồng tệp tạm trong bộ nhớ (Upload → đọc ô & tự nhận diện cột), áp dụng ánh xạ cột (`columnMapping`), chuẩn hóa `email` (lowercase) và `phone` (`E.164/VN`), chống trùng ưu tiên **`email` trước rồi mới tới `phone`** (cấm dedup theo `fullName` hay `(fullName, phone)`, báo `IDENTITY_CONFLICT` nếu `email` và `phone` thuộc 2 người khác nhau), và trả preview từng dòng; **bộ đệm file hủy ngay sau khi parse, không lưu DB hay MinIO/S3, không lưu filename/path**.
  - `POST /api/v1/admin/users/import/confirm`: Tạo/cập nhật hàng loạt bản ghi chuẩn hóa trong `users` + `event_participations` (`INVITED`) + phát hành batch kích hoạt (`ADMIN_DIRECT` hoặc `EMAIL_SMS_INVITATION`), ghi bảng tổng hợp `user_import_batches` (không chứa filename/path gốc) và trả **báo cáo kết quả từng dòng** (thành công/bỏ qua/lỗi).
- **`GET /api/v1/admin/audit-logs`** (phân trang theo `actor`, `action`, `resourceType`, khoảng thời gian — cấm chứa raw token, mật khẩu hoặc tên file Excel gốc).
