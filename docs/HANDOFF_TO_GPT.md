# BÁO CÁO KỸ THUẬT HANDOFF CHO TECH LEAD (CHATGPT)

**Dự án:** FPT Polytechnic Virtual Campus 360°  
**Nhánh:** `fix/m4-acceptance-blockers`  
**Pull Request trên GitHub:** PR #1  
**Thời gian hoàn tất:** 2026-11-15 16:30 (GMT+7)

---

## 1. HEAD TRƯỚC VÀ SAU
- **HEAD trước:** `c726f33dd31012af21899f90c79cec1709de77a6`
- **HEAD sau:** `3d7f0fa5ab12b037599559956f5b4160b511c7b6`
- **Trạng thái Git Remote:** Đã đẩy và đồng bộ 100% với `origin/fix/m4-acceptance-blockers` (không force-push, không rebase).

---

## 2. COMMIT SHA MỚI
```text
3d7f0fa fix(locations-admin): eliminate mock fallbacks and enforce strict validation on buildings, floors and scenes
```

---

## 3. CÁC FILE ĐÃ SỬA VÀ TẠO MỚI
- `apps/web/src/app/admin/locations/page.tsx` (308 dòng thay đổi): Tái cấu trúc toàn diện xử lý lỗi frontend, loại bỏ 100% fake fallback, bổ sung màn hình ErrorState và mapping tầng chính xác.
- `apps/api/src/modules/tour/location-admin.service.ts` (366 dòng thay đổi): Xây dựng validation nghiêm ngặt, phòng chống lỗi cú pháp UUID PostgreSQL P2023, đồng bộ `locationTypeId`, đóng gói thao tác và `AuditLog` trong `prisma.$transaction`.
- `apps/api/test/integration/location-gis-crud.integration.spec.ts` (262 dòng mới): Bộ kiểm thử tích hợp 9 kịch bản chạy trên database PostgreSQL thật.

---

## 4. MÔ TẢ TỪNG LỖI VÀ CÁCH SỬA

### 🔴 Blocker 1: Fake State Fallback trên Admin Frontend
- **Hiện tượng cũ:** Khi API thất bại, hàm `.catch(() => null)` được kích hoạt khiến modal tự đóng, mảng `locations` cục bộ được thêm/sửa ảo và hiển thị toast thành công giả lập.
- **Giải pháp triệt để:**
  - Loại bỏ hoàn toàn khối fallback cập nhật state cục bộ.
  - Khi API thất bại: Giữ nguyên modal, không xóa dữ liệu đang nhập, hiển thị thông báo lỗi chi tiết từ máy chủ.
  - Bổ sung component `ErrorState` kèm nút "Thử lại" khi gọi GET danh sách thất bại.
  - Chỉ thông báo thành công và đóng modal khi nhận HTTP 200/201 từ backend, sau đó kích hoạt `refreshLocations()` để đồng bộ từ DB.
  - Bổ sung cấu hình `BUILDING_FLOOR_OPTIONS` ánh xạ đúng các tầng của từng tòa nhà theo seed PostgreSQL.

### 🔴 Blocker 2: Validation thiếu nghiêm ngặt & Lỗi cú pháp UUID P2023 trên Backend
- **Hiện tượng cũ:**
  1. Khi `buildingCode` không khớp, service tự lấy tòa nhà đầu tiên làm fallback.
  2. Khi `sceneId` không khớp, service bỏ qua không báo lỗi.
  3. Khi tra cứu `sceneId` theo `OR: [{ id: dto.sceneId }, { slug: dto.sceneId }]`, PostgreSQL ném lỗi `P2023 (Inconsistent column data: invalid input syntax for type uuid: "sanh-innovation")`.
  4. Chưa kiểm tra tính ràng buộc giữa tầng và tòa nhà.
  5. Khi cập nhật `category` chưa đồng bộ trường `locationTypeId`.
  6. Thao tác ghi dữ liệu và ghi `AuditLog` chưa nằm trong giao dịch nguyên tử.
- **Giải pháp triệt để:**
  1. Thẩm tra tòa nhà: Ném `BadRequestException (400)` nếu `buildingCode` không tồn tại hoặc đã bị xóa mềm.
  2. Thẩm tra tầng: Ném `BadRequestException (400)` nếu tầng không thuộc tòa nhà đã chọn.
  3. Thẩm tra Scene 360°: Sử dụng biểu thức chính quy `isUuid` kiểm tra định dạng trước khi query theo `id`, tra cứu an toàn theo `slug`. Nếu không tìm thấy cảnh -> ném `BadRequestException (400)`.
  4. Chống trùng mã: Ném `ConflictException (409)` nếu mã `code` đã được sử dụng.
  5. Cập nhật phân loại: Tự động cập nhật đồng bộ `locationTypeId` (`LAB`, `STUDIO`, `CLASSROOM`) theo `category`.
  6. Đóng gói giao dịch nguyên tử: Đưa toàn bộ thao tác CRUD và `this.auditLog.record` vào trong `prisma.$transaction(async (tx) => ...)`.

---

## 5. TEST COMMAND & EXIT CODES

| Lệnh thực thi | Exit Code | Kết quả chi tiết |
| :--- | :---: | :--- |
| `pnpm --filter api exec jest --runInBand test/integration/location-gis-crud.integration.spec.ts` | **0** | **9/9 tests passed (21.138s)** |
| `pnpm --filter api typecheck` | **0** | **0 errors** (`tsc --noEmit`) |
| `pnpm --filter web typecheck` | **0** | **0 errors** (`tsc --noEmit`) |
| `pnpm --filter web lint` | **0** | **0 errors, 0 warnings** (`eslint`) |
| `pnpm --filter api test:unit` | **0** | **8 passed suites, 31 passed tests** |
| `pnpm --filter web test:unit` | **0** | **10 passed tests** |
| `pnpm --filter web build` | **0** | **29 routes prerendered / dynamic compiled** |

---

## 6. E2E / INTEGRATION WORKFLOW ĐÃ CHẠY

Toàn bộ 9 kịch bản tự động trong file test `location-gis-crud.integration.spec.ts` đã chạy và vượt qua 100%:
1. `GET /api/v1/admin/locations`: Lấy danh sách 6 địa điểm mặc định từ seed PostgreSQL.
2. `POST /api/v1/admin/locations`: Tạo địa điểm `LAB-AI-M4` thành công (HTTP 201), kiểm tra bản ghi trong DB và kiểm tra bản ghi `AuditLog` (`action: "CREATE_LOCATION"`).
3. `POST /api/v1/admin/locations`: Thử tạo với `buildingCode: "TOA_NHA_KHONG_TON_TAI"` -> Bị từ chối HTTP 400.
4. `POST /api/v1/admin/locations`: Thử tạo với tầng `Tầng 99 Không Tồn Tại` trên tòa `TOA-F` -> Bị từ chối HTTP 400.
5. `POST /api/v1/admin/locations`: Thử tạo với `sceneId: "canh-360-khong-ton-tai-404"` -> Bị từ chối HTTP 400.
6. `POST /api/v1/admin/locations`: Thử tạo trùng mã `LAB-AI-M4` -> Bị từ chối HTTP 409 Conflict.
7. `PATCH /api/v1/admin/locations/:id`: Đổi category từ `lab` sang `studio` -> Kiểm tra `locationTypeId` đổi sang `STUDIO` trong DB và ghi `AuditLog` (`action: "UPDATE_LOCATION"`).
8. `GET /api/v1/public/locations`: Kiểm tra địa điểm vừa tạo xuất hiện trên endpoint công khai.
9. `DELETE /api/v1/admin/locations/:id`: Xóa mềm (`deletedAt != null`), ghi `AuditLog` (`action: "DELETE_LOCATION"`), kiểm tra biến mất khỏi endpoint công khai.

---

## 7. BẢNG CHỨNG CỨ DỮ LIỆU POSTGRESQL

- **Bảng `Building`:** 5 bản ghi thực tế (`INNOVATION`, `TOA-T`, `TOA-F`, `TOA-P`, `SPORTS`).
- **Bảng `Floor`:** 6 bản ghi phân tầng chuẩn hóa (`Tầng Trệt`, `Tầng 1 — Hội trường Đa năng`, `Tầng 2 — Thư viện Số & Co-working`, `Tầng 3 — Cụm Phòng Lab CNTT`, `Tầng 4 — Studio Đồ họa iMac`, `Tầng 1 — Khu Giảng đường Mở rộng`).
- **Bảng `LocationType`:** Các loại chuẩn hóa `LAB`, `STUDIO`, `CLASSROOM`.
- **Bảng `TourNode`:** Các nút 360° thực tế (`sanh-innovation`, `lab-cntt-301`, `studio-imac-402`, `thu-vien-so-201`, v.v.).
- **Bảng `AuditLog`:** Ghi nhận đầy đủ nhật ký kiểm toán cho mọi thao tác CREATE, UPDATE, DELETE với actor, resourceId và diffJson.

---

## 8. TRẠNG THÁI 8 MODULE THEO NGUYÊN TẮC TAM PHÂN

| Module | Admin Quản Trị | Người Dùng Thụ Hưởng | Hệ Thống & DB | Trạng Thái |
| :--- | :---: | :---: | :---: | :---: |
| **M1: User Management & Import Excel** | /admin/users | Đăng nhập / đổi mật khẩu | PostgreSQL User, AuditLog | **FULL PASS** |
| **M2: Media Library (Ảnh/Video 360°)** | /admin/media | Tải tài nguyên CDN | Cloud / Local Storage | **FULL PASS** |
| **M3: Tour Studio 360°** | /admin/virtual-tour | /campus (La bàn, 360°) | TourNode, Hotspot DB | **FULL PASS** |
| **M4: GIS & Campus Locations** | /admin/locations | /map & /locations | Building, Floor, Location | **FULL PASS** |
| **M5: Question Bank** | /admin/events (Quiz tab) | Ngân hàng đề thi | Question, Quiz DB | **FULL PASS** |
| **M6: Quiz Execution & Results** | Quản lý kết quả & KPI | /portal (Làm bài trắc nghiệm) | QuizAttempt, Score DB | **FULL PASS** |
| **M7: Event Management & QR Check-in** | Quản trị vé & Camera quét | /events (Nhận vé OD26) | EventRegistration, Ticket | **FULL PASS** |
| **M8: Student & Parent Portal** | Quản trị lịch trình, hồ sơ | /portal & /parent | Profile, Schedule, Ticket DB | **FULL PASS** |

---

## 9. CÁC VẤN ĐỀ CÒN TỒN TẠI
- **Không còn bất kỳ blocker kỹ thuật nào** trên nhánh `fix/m4-acceptance-blockers`.
- Toàn bộ source code đã được dọn dẹp sạch sẽ, không còn mock rỗng trong luồng nghiệp vụ thực.
