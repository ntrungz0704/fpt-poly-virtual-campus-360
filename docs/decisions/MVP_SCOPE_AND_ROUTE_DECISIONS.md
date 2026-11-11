# QUYẾT ĐỊNH SẢN PHẨM, ROUTE MVP & KIỂM SOÁT GIAI ĐOẠN

**Cập nhật:** 11/11/2026 (Phase 0 Baseline Decisions)  
**Phạm vi:** Virtual Campus FPT Polytechnic — Cơ sở TP.HCM (CVPM Quang Trung, Quận 12)  
**Vai trò tài liệu:** Nguồn chuẩn tập trung ghi nhận các quyết định đã được Chủ dự án phê duyệt chính thức, dùng để đối chiếu cho toàn bộ Phase 1 → Phase 5.

---

## 1. Quyết định Định hướng Sản phẩm & MVP

1. **Trải nghiệm Trang chủ `/`:** Mở thẳng trình xem toàn cảnh Panorama 360° ngay khi vào trang; kéo xoay tự do và tự xoay lại sau **3 giây** khi người dùng không giữ thao tác kéo.
2. **Ưu tiên Năng lực Cốt lõi MVP:** Tập trung **GIS Map (`/map`) + Floor Plan 2D (từ Phase 2 trở đi) + Panorama 360° (`/campus`)** cho kịch bản đa tòa nhà, đa tầng, đa phòng.
3. **Tạm ẩn 3D WebGL / Dollhouse:** Không triển khai mô hình 3D WebGL (`.glb` / Dollhouse) trong phạm vi MVP.
4. **Animations Desktop-only:** Hiệu ứng cuộn/tương tác ReactBits (`motion`) chỉ kích hoạt trên thiết bị **Desktop (`>= 1024px`)** và tôn trọng `prefers-reduced-motion`; tắt hoàn toàn hiệu ứng trên Mobile/Tablet để giữ hiệu năng mượt mà.
5. **Phân nhóm Người dùng & Định hướng Tài khoản (Cập nhật Phase 1):**
   - **Nhóm A — Admin & Nhân sự nhà trường (`ADMIN`, `STAFF`):** Có tài khoản do người có thẩm quyền cấp (`Admin` / bootstrap), đăng nhập qua `/login` (triển khai ở Backend Phase 3) để quản trị hệ thống.
   - **Nhóm B — Người tham gia Open Day (`STUDENT`, `PARENT`):** Tham gia các kỳ Open Day (**không mặc định là sinh viên chính thức đang theo học**; 1 tài khoản hỗ trợ nhiều sự kiện Open Day). Tài khoản do Admin cấp thủ công hoặc Import Excel/CSV (chỉ lưu bản ghi chuẩn hóa, **tuyệt đối không lưu file/tên/đường dẫn Excel gốc**) theo 2 cơ chế: **Cấp trực tiếp (`ADMIN_DIRECT`)** bằng mã/link kích hoạt dùng một lần có thời hạn hoặc **Lời mời Email/SMS (`EMAIL_SMS_INVITATION`)**. **Tuyệt đối không dùng mật khẩu mặc định dùng chung hay mật khẩu plaintext.**
   - **Nhóm C — Khách tham quan tự do (Public Visitors):** **Không cần tài khoản, không cho phép tự đăng ký.** Tự do xem 360°, GIS Map, Địa điểm và lịch Open Day công khai.
   - **Ranh giới MVP đối với `/portal`:** Mặc dù kiến trúc dữ liệu Phase 2A–3 hỗ trợ đầy đủ tài khoản `STUDENT` & `PARENT` cho Open Day, **Student/Parent Portal (`/portal`) vẫn CHƯA triển khai trong MVP**.

---

## 2. Quyết định Chính thức Về Các Route (`19` Routes Hiện Hữu)

**Nguyên tắc bảo toàn:** Không tự ý xóa, đổi tên hoặc gắn redirect cho bất kỳ route nào trong danh sách 19 `page.tsx` hiện hữu nếu chưa có quyết định phê duyệt riêng.

| Route | Quyết định Chính thức | Phạm vi & Hành vi Chuẩn |
|---|---|---|
| **`/login`** | **Trạng thái Auth (MVP) → Cổng đăng nhập (Phase 3)** | Không có tính năng tự đăng ký cho khách. Trong Phase 1–2 MVP chưa có Auth Backend, `/login` hiển thị thông báo trạng thái chưa kích hoạt. Khi sang Phase 3 Backend Auth, phục vụ `ADMIN`/`STAFF` và người tham gia Open Day (`STUDENT`/`PARENT`) đã kích hoạt qua liên kết dùng một lần / lời mời Email-SMS (tuyệt đối không nhúng credential hay session giả trong client bundle). |
| **`/games`** | **Giữ route tương thích, ẩn khỏi menu chính** | Không đưa vào thanh điều hướng chính (`PublicHeader`). Mini-game được tích hợp trong trải nghiệm Tour 360°. |
| **`/portal`** | **Chưa triển khai trong MVP — Giữ tạm mã nguồn** | **Không xây Student/Parent Portal trong MVP.** Tạm giữ route `/portal` trong mã nguồn (chưa xóa/redirect) cho đến khi kiểm tra đầy đủ dependency và có quyết định chính thức sau Backend Phase 3. Mọi CTA/copy mời đăng nhập kiểu QR Login / mật khẩu tạm Zalo tới `/login?next=/portal` đã gỡ bỏ trong Phase 1. |
| **`/admin` và `/admin/*`** | **UI Preview nội bộ (MVP) → CMS thật (Phase 3)** | Hiển thị banner cảnh báo rõ là **Admin Preview nội bộ chưa có Authentication & Server Guard**; không mở lên Internet công khai cho tới khi Backend Auth thật (`NestJS + Argon2id + JWT/Refresh HttpOnly + RBAC`) được triển khai ở Phase 3. |

---

## 3. Quyết định Kiến trúc, Công cụ & Quy chuẩn Thay đổi

1. **Quản lý gói (`Package Manager`):** Chốt thống nhất dùng **`pnpm`** (khớp `pnpm-workspace.yaml` sẵn có) cho cấu trúc monorepo (`apps/web`, `packages/shared`, và `apps/api` trong Phase 3).
2. **Admin Authentication (Phương án 1 — Design-First):** Thiết kế hoàn chỉnh kiến trúc xác thực tại [ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md](../architecture/ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md), triển khai cùng Backend ở Phase 3. Không tạo cơ chế cookie/session giả ở Frontend để giả lập bảo mật.
3. **Thứ tự 6 Giai đoạn Đã Phê duyệt (Strict Gating):**
   - **Phase 0 — Repository Foundation** *(Đã hoàn thành — commit `b4f1a94`)*: Git init, `.gitignore`, chuẩn hóa `pnpm`, baseline commit, tổ chức lại `docs/`, tài liệu hóa kiến trúc Auth & chuẩn bị kế hoạch Phase 1–2.
   - **Phase 1 — Security & MVP Cleanup** *(Đang triển khai — chưa mở Phase 2/3 code)*: Gỡ plaintext admin credential ở prototype, gỡ `sessionStorage` auth giả, biến `/login` thành màn hình trạng thái chờ Auth Phase 3, thêm banner Preview nội bộ trên `/admin/*`, dọn toàn bộ copy QR Login / mật khẩu tạm Zalo / `/login?next=/portal`, xóa test scenes & ảnh `tang-1/2`, cập nhật `next.config.ts`/`manifest.json`, đồng bộ tài liệu kiến trúc & yêu cầu mới (3 nhóm người dùng, Dual Provisioning, Import Excel không lưu file gốc).
   - **Phase 2 — Shared Architecture & Data Contract** *(Chờ duyệt thiết kế)*: Chốt thiết kế thực thể `Building → Floor → FloorPlan → Location → TourNode → Hotspot & TourEdge`, mô hình `User / AccountInvitation / EventParticipation / UserImportBatch`, cơ chế tọa độ 3 lớp và đồng bộ `packages/shared`.
   - **Phase 3 — Backend & Database** *(Chưa triển khai)*: NestJS Modular Monolith, PostgreSQL, Prisma, Auth/RBAC + Dual Provisioning & Excel 5-Step Import, Media Storage (MinIO/S3 + Redis/BullMQ).
   - **Phase 4 — Admin Campus Studio** *(Chưa triển khai)*: Upload bản vẽ mặt bằng (`PNG/JPG/SVG/PDF`), đặt pin phòng & điểm chụp 360° lên mặt bằng, tạo hotspot, nối cạnh tour và chạy Graph Validator (BFS/DFS).
   - **Phase 5 — Public Tour Integration** *(Chưa triển khai)*: Frontend đọc dữ liệu từ API thật, đồng bộ Tour 360° ↔ Floor Plan 2D (chuyển tầng/chuyển tòa) ↔ GIS Map và kiểm thử đầu-cuối.

---

## 4. Lưu ý Về Các Tài liệu Tham chiếu Cũ

Một số tài liệu nằm trong `docs/ui/` (như `UI_PAGE_BLUEPRINT.md`, `UI_ROUTE_MIGRATION_MAPPING.md`, `UI_DESIGN_SYSTEM.md`) được viết trước khi chốt lộ trình tách giai đoạn MVP, trước khi bỏ luồng QR Login / Zalo tạm thời và trước khi tách Phase 2A. Các tài liệu này được giữ nguyên trong `docs/ui/` để tham khảo hệ thống UI tokens, layout 3 vùng và quy chuẩn thiết kế; **riêng phần phân nhóm người dùng, quy trình cấp/import tài khoản Open Day, `/portal`, `/login` và kiến trúc dữ liệu luôn lấy [MVP_SCOPE_AND_ROUTE_DECISIONS.md](./MVP_SCOPE_AND_ROUTE_DECISIONS.md), [ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md](../architecture/ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md) và bộ [docs/phase-2a/](../phase-2a/PHASE_2A_SYSTEM_ARCHITECTURE.md) làm chuẩn cao nhất.**
