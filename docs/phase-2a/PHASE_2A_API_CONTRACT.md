# ĐẶC TẢ API CONTRACT `/api/v1` — PHASE 2A

**Base URL (Local Dev, khớp `.env.example`):** `http://localhost:4000/api/v1`  
**Định dạng chuẩn:** JSON (`application/json`), UTF-8, ISO-8601 timestamps (`UTC`).  
**Chuẩn xác thực:** `Authorization: Bearer <accessToken>` kết hợp Cookie `HttpOnly` cho Refresh Token.

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
| `200` / `201` / `202` | `202 Accepted` dùng cho tác vụ xử lý ảnh/PDF bất đồng bộ (`Media`, `FloorPlan`) |
| `400` | Sai DTO validation (`class-validator` / `zod`), sai tỷ lệ panorama 2:1, sai file magic bytes |
| `401` | Thiếu / hết hạn Access Token hoặc sai thông tin đăng nhập (luôn trả câu thông báo chung) |
| `403` | Thiếu Permission RBAC tương ứng |
| `404` | Không tìm thấy tài nguyên hoặc đã soft-delete |
| `409` | Xung đột (`slug`/`code` trùng lặp, hoặc Floor cần re-align sau thay thế mặt bằng) |
| `422` | Nghiệp vụ không cho phép (VD: `PUBLISH` khi Graph Validator còn lỗi `ERROR`) |
| `429` | Vượt ngưỡng Rate Limit |

---

## 2. Public APIs (Không yêu cầu đăng nhập — Khớp trải nghiệm miễn phí `/`, `/campus`, `/map`, `/locations`, `/events`)

> [!NOTE]
> Toàn bộ endpoints dưới `/api/v1/public/*` chỉ trả tài nguyên có `status = 'PUBLISHED'` và `deleted_at IS NULL`, tuyệt đối lọc bỏ URL tệp `original` và dữ liệu nháp.

### 2.1. `GET /api/v1/public/campus`
Trả về thông tin khuôn viên mặc định, danh sách tòa nhà kèm tọa độ GIS % cho `/map` (`CampusGISMap.tsx`), và `defaultEntryNodeSlug` cho `/` và `/campus`.
- **Response (`data`):**
  ```json
  {
    "campus": {
      "id": "uuid",
      "code": "QTSC-Q12",
      "name": "FPT Polytechnic — CVPM Quang Trung",
      "defaultEntryNodeSlug": "courtyard-main"
    },
    "buildings": [
      {
        "id": "uuid",
        "code": "INNOVATION",
        "slug": "toa-nha-innovation",
        "name": "Tòa nhà Innovation",
        "category": "academic",
        "description": "...",
        "gisX": 46,
        "gisY": 54,
        "coverUrl": "https://cdn.../locations/.../cover.webp",
        "floorCount": 5,
        "publishedNodeCount": 12
      }
    ]
  }
  ```

### 2.2. `GET /api/v1/public/buildings/:slug/floors`
Trả về danh sách tầng đã xuất bản của một tòa nhà kèm **Active Floor Plan** (URL WebP/SVG tối ưu, `renderWidth`, `renderHeight`, `northOffsetDeg`) và danh sách ghim `Location` + `TourNode` trên từng tầng.
- **Response (`data`):** Mảng các tầng sắp theo `levelIndex ASC`:
  - `activeFloorPlan`: `{ id, version, sourceFormat, renderUrl, thumbUrl, renderWidth, renderHeight, northOffsetDeg }`
  - `locations`: danh sách phòng/khu vực có `floorNormX`, `floorNormY`, `floorPolygonNorm`, `locationType`, `isPublicAccessible`, `restrictionNote`, `primaryNodeSlug`
  - `nodes`: danh sách `TourNode` đã publish kèm `{ id, slug, title, locationId, floorNormX, floorNormY, headingOffsetDeg, thumbUrl }`

### 2.3. `GET /api/v1/public/tour/nodes/:slug`
Nạp trọn gói dữ liệu để `PanoramaStage.tsx` kết xuất một góc nhìn 360° (cùng danh sách điểm lân cận giúp prefetch).
- **Query optional:** `?quality=desktop|mobile`
- **Response (`data`):**
  ```json
  {
    "node": {
      "id": "uuid",
      "slug": "courtyard-main",
      "title": "Quảng trường Trung tâm QTSC",
      "initialYaw": 12,
      "initialPitch": -2,
      "initialFov": 75,
      "headingOffsetDeg": 0,
      "floorNormX": 0.425,
      "floorNormY": 0.610,
      "panoramaUrl": "https://cdn.../panoramas/.../web_4k.webp",
      "fallbackMobileUrl": "https://cdn.../panoramas/.../web_2k.webp",
      "thumbUrl": "https://cdn.../panoramas/.../thumb_512.webp"
    },
    "location": {
      "id": "uuid",
      "slug": "san-trung-tam",
      "name": "Sân Trung tâm",
      "typeCode": "LOBBY",
      "buildingCode": "INNOVATION",
      "floorId": "uuid-or-null",
      "siblingNodes": [
        { "slug": "courtyard-main", "title": "Chính giữa sân" },
        { "slug": "courtyard-stage", "title": "Khu vực sân khấu" }
      ]
    },
    "hotspots": [
      {
        "id": "uuid",
        "hotspotType": "SCENE_LINK",
        "edgeType": "DOORWAY",
        "yaw": 124.5,
        "pitch": -4.2,
        "title": "Vào sảnh Tòa nhà Innovation",
        "targetNodeSlug": "lobby-innovation",
        "targetEntryYaw": 5.0,
        "targetFloorId": "uuid-floor-1"
      }
    ]
  }
  ```

### 2.4. `GET /api/v1/public/locations` & `GET /api/v1/public/locations/:slug`
Phục vụ `/locations` (lọc theo `?buildingCode=`, `?typeCode=`, `?q=`) và `/locations/[slug]` (chi tiết địa điểm, bộ sưu tập ảnh 2D, danh sách các `TourNode` 360° thuộc địa điểm đó, nút nhảy vào `/campus?scene={primaryNodeSlug}`).

### 2.5. `GET /api/v1/public/events`
Phục vụ `/events`: trả lịch trình công khai Open Day (`open_day_sessions`), danh sách FAQ và bộ câu hỏi quiz mini-game tích hợp trong tour.

---

## 3. Authentication APIs (`/api/v1/auth/*` — Không có tự đăng ký, không tài khoản khách MVP)

> [!IMPORTANT]
> Client Web lưu **`accessToken` chỉ trong RAM (React state/closure)** — không bao giờ lưu vào `localStorage` hay `sessionStorage`. Phiên đăng nhập duy trì thông qua cookie `HttpOnly` gọi `/api/v1/auth/refresh`. Nếu `user.mustChangePassword === true` (lần đầu dùng mật khẩu bootstrap), toàn bộ `/api/v1/admin/*` trả `403 PASSWORD_CHANGE_REQUIRED` cho đến khi hoàn tất `PATCH /api/v1/auth/me/password`.

| Method & Path | Mô tả | Ghi chú bảo mật |
| :--- | :--- | :--- |
| `POST /api/v1/auth/login` | Đăng nhập `{ "username": "admin", "password": "..." }` | Rate limit 5 req/phút/IP; Argon2id verify; set `refresh_token` vào `HttpOnly` cookie; trả `accessToken` + `{ id, username, mustChangePassword, roles, permissions }`. |
| `POST /api/v1/auth/refresh` | Đọc `refresh_token` từ Cookie `HttpOnly` | Rotate token mới, revoke token cũ; nếu phát hiện token reuse → thu hồi toàn bộ `family_id`. |
| `POST /api/v1/auth/logout` | Đăng xuất & thu hồi Refresh Token hiện tại | Clear Cookie `refresh_token` và ghi `audit_logs`. |
| `GET /api/v1/auth/me` | Lấy thông tin tài khoản quản trị hiện đăng nhập | Guard: Authenticated. |
| `PATCH /api/v1/auth/me/password` | Tự đổi mật khẩu (`{ currentPassword, newPassword }`) | Hạ cờ `mustChangePassword = false`; thu hồi toàn bộ refresh token phiên khác của chính user đó. |

---

## 4. Admin APIs (`/api/v1/admin/*` — Bắt buộc Bearer JWT + RBAC Permission)

### 4.1. Quản lý Khuôn viên, Tòa nhà & Tầng (Permission: `campus:write`)
- `POST /api/v1/admin/buildings` / `PATCH /api/v1/admin/buildings/:id` / `DELETE /api/v1/admin/buildings/:id` (soft delete)
- `POST /api/v1/admin/buildings/:buildingId/floors` (`{ code, name, levelIndex }`)
- `PATCH /api/v1/admin/floors/:id` / `DELETE /api/v1/admin/floors/:id` (từ chối nếu còn `TourNode` `PUBLISHED` trừ khi force archive)

### 4.2. Pipeline Upload, Thay thế & Căn chỉnh Mặt bằng Tầng (`floorplan:write`)
- **`POST /api/v1/admin/floors/:floorId/floor-plans/presign`**
  - Request: `{ "filename": "tang3.pdf", "mimeType": "application/pdf", "fileSizeBytes": 4200100, "sourcePageNumber": 1, "replaceMode": "NEW_VERSION" }`
  - Response: `{ "floorPlanId": "uuid", "version": 2, "uploadUrl": "https://minio.../v2_source.pdf?X-Amz-..." }`
- **`POST /api/v1/admin/floor-plans/:floorPlanId/confirm`**
  - Kích hoạt job chuyển đổi (PDF → WebP 300 DPI ≤ 3200px, SVG → Sanitize, PNG/JPG → WebP tối ưu), lưu snapshot tọa độ cũ vào `floor_plan_alignment_snapshots` và **đặt `needsRealignment = true` cho toàn bộ node trên tầng** bất kể tỷ lệ khung hình có đổi hay không.
- **`GET /api/v1/admin/floor-plans/:floorPlanId/status`**
  - Trả về: `{ processingStatus, renderUrl, renderWidth, renderHeight, alignmentStatus, nodesPendingRealignmentCount }`.
- **`GET /api/v1/admin/floors/:floorId/floor-plans/:floorPlanId/alignment-overlay`**
  - Trả về URL bản vẽ mới + URL bản vẽ cũ (`Ghost Overlay`) + danh sách snapshot `{ nodeId, locationId, oldNormX, oldNormY }` để Admin căn chỉnh trực quan.
- **`POST /api/v1/admin/floors/:floorId/floor-plans/:floorPlanId/confirm-alignment`**
  - Body: `{ "nodes": [{ "nodeId": "uuid", "floorNormX": 0.35, "floorNormY": 0.62 }], "locations": [{ "locationId": "uuid", "floorNormX": 0.34, "floorNormY": 0.60 }] }`
  - Cập nhật tọa độ mới, đặt `alignmentStatus = "CONFIRMED"`, đặt `needsRealignment = false`, ghi `audit_logs` (`ALIGNMENT_CONFIRMED`), kích hoạt bản vẽ làm active.

### 4.3. Quản lý Địa điểm (`Location`) & Media Pipeline (`media:upload`, `location:write`)
- **`POST /api/v1/admin/media/presign`**
  - Request: `{ "assetKind": "PANORAMA_2_1", "filename": "A302_01.jpg", "mimeType": "image/jpeg", "fileSizeBytes": 14500000, "declaredWidth": 5376, "declaredHeight": 2688, "sha256": "..." }`
  - Chặn ngay `400 UNSTITCHED_PANORAMA_UNSUPPORTED` (file `.insv`/`.insp`/RAW), `400 ASPECT_RATIO_NOT_2_TO_1` (như ảnh cylinder `5.77:1`), `400 PIXEL_RESOLUTION_TOO_LOW` (`< 2048×1024`), hoặc `400 FILE_TOO_LARGE` (`> 50 MB`).
- **`POST /api/v1/admin/media/:assetId/confirm`** → Đưa vào hàng đợi `BullMQ` (kiểm magic bytes + SHA-256 + Sharp sinh WebP `4096×2048` + `2048×1024` + `512×256`).
- **`POST /api/v1/admin/media/:assetId/approve-preview`** → Admin xác nhận đã xem 360° Preview đạt chuẩn (`isPreviewApproved = true`), sẵn sàng gắn vào `TourNode`.
- **`GET /api/v1/admin/media/:assetId/status`** & **`GET /api/v1/admin/media`** (phân trang, lọc theo `assetKind`, `processingStatus`, `isPreviewApproved`).
- **`POST /api/v1/admin/locations`** / **`PATCH /api/v1/admin/locations/:id`** / **`DELETE /api/v1/admin/locations/:id`**
  - Bao gồm gắn vị trí chuẩn hóa trên Floor Plan (`floorId`, `floorNormX`, `floorNormY`, `floorPolygonNorm`), cờ `isPublicAccessible`, `restrictionNote`, `primaryNodeId`.

### 4.4. Biên tập `TourNode`, `Hotspot` & `TourEdge` (`tour:write`)
- **`POST /api/v1/admin/tour/nodes`**
  - Request: `{ "slug": "...", "title": "...", "locationId": "uuid", "panoramaAssetId": "uuid", "floorPlanId": "uuid-or-null", "floorNormX": 0.42, "floorNormY": 0.58, "initialYaw": 0, "initialPitch": 0, "initialFov": 75 }`
- **`PATCH /api/v1/admin/tour/nodes/:id`** (Cập nhật tọa độ `[0..1]`, `initialYaw/Pitch/Fov`, `headingOffsetDeg`, ngoại lệ `isTerminalApproved` & `terminalApprovalReason`).
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
  - Hỗ trợ tạo liên kết hai chiều nguyên tử (`PostgreSQL Transaction`) hoặc liên kết một chiều có lý do phê duyệt (`isOneWayApproved`), cùng liên kết xuyên tầng (`ELEVATOR` / `STAIRS`)!
- **`PATCH /api/v1/admin/tour/hotspots/:id`** & **`DELETE /api/v1/admin/tour/hotspots/:id`** (Xóa hotspot đồng thời xóa `TourEdge` gắn liền).

### 4.5. Kiểm duyệt Đồ thị & Xuất bản (`tour:publish`)
- **`POST /api/v1/admin/tour/validate`**
  - Request: `{ "scope": "FLOOR" | "BUILDING" | "CAMPUS", "targetId": "uuid" }`
  - Response (`200`): `{ "isPublishable": false, "summary": { "errors": 1, "warnings": 1, "approvedExceptions": 2 }, "issues": [ ... ] }`
- **`POST /api/v1/admin/floors/:floorId/publish`** & **`POST /api/v1/admin/buildings/:buildingId/publish`**
  - Chạy lại Validator trong transaction trước khi set `status = 'PUBLISHED'`; trả `422` kèm danh sách lỗi nếu `errors > 0`. Ghi vết vào `audit_logs`.

### 4.6. Quản lý Tài khoản Quản trị & Nhật ký hệ thống (`users:manage`, `audit:read`)
- **`GET /api/v1/admin/users`**, **`POST /api/v1/admin/users`** (chỉ cấp tài khoản nhân sự quản trị nội bộ, trả token/mật khẩu kích hoạt 1 lần kèm `mustChangePassword = true`), **`PATCH /api/v1/admin/users/:id/status`** (khóa/mở khóa, reset mật khẩu, cấm tự khóa tài khoản `admin` gốc đang đăng nhập). Không có endpoint `register` hoặc `participant`.
- **`GET /api/v1/admin/audit-logs`** (phân trang theo `actor`, `action`, `resourceType`, khoảng thời gian).
