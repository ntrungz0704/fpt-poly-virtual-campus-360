# LỘ TRÌNH TRIỂN KHAI ƯU TIÊN (12-PRIORITIZED-ROADMAP)
## FPT Polytechnic Virtual Campus 360°

---

## 1. Phân Loại Nhiệm Vụ Theo Thứ Tự Ưu Tiên (P0 → P3)

### Mức P0 — Blocker Bắt Buộc Hoàn Thành Ngay (Immediate Remediation)
1. **P0-1: M4 Remediation B1 (Server-Side Role Enforcement)**
   - Tạo `PortalUserTypeGuard` chặn tài khoản sai vai trò truy cập API Cổng Sinh viên hoặc Cổng Phụ huynh.
2. **P0-2: M4 Remediation B2 (Correct Gamification Aggregation)**
   - Cập nhật hàm `getGamification` trong `portal.service.ts` dùng `prisma.xpLedger.aggregate` tính tổng XP trên toàn bộ dữ liệu.
3. **P0-3: M4 Remediation B4 (Remove Hardcoded Credentials)**
   - Xóa bỏ fallback mật khẩu cứng trong `portal-flow.spec.ts`.
4. **P0-4: M4 Remediation B5 (Clean Data Ownership)**
   - Chuẩn hóa ánh xạ vé và lịch trình trong `portal.service.ts` chỉ thông qua `userId`.

### Mức P1 — Milestone Kế Tiếp (Milestone M5: News & Contact CMS)
1. **P1-1: Database Schema & Migration cho News & Contact**
   - Tạo bảng `articles`, `article_categories`, `contact_messages`.
2. **P1-2: Backend API CRUD News & Contact**
   - Xây dựng `NewsModule` và `ContactModule` với các endpoint Public đọc bài viết, nộp form liên hệ và Admin quản lý nội dung.
3. **P1-3: Tích hợp Giao diện `/news` và `/contact`**
   - Đọc tin tức từ database, lưu tin nhắn liên hệ từ form thật vào PostgreSQL.

### Mức P2 — Tối Ưu Hóa & Đồng Bộ Cấu Hình (Refinement)
1. **P2-1: M4 Remediation B6 (Tour Save Backend Integration)**
   - Xây dựng API lưu cấu hình Tour và Hotspot vào PostgreSQL thay vì chỉ lưu `localStorage`.
2. **P2-2: M4 Remediation B3 (Multi-Role E2E Fixtures)**
   - Bổ sung kịch bản kiểm thử E2E với các tài khoản sinh viên và phụ huynh độc lập.

### Mức P3 — Tích Hợp Nâng Cao & Tối Ưu Triển Khai (Post-MVP)
1. **P3-1: Kết nối Cloudflare R2 / AWS S3 cho Media**
   - Đưa media lên Object Storage phân tán.
2. **P3-2: Kích hoạt Digital Twin 3D Tòa nhà (Milestone M6)**
   - Mở rộng trải nghiệm Three.js 3D Campus Explorer khi có mô hình GLTF tối ưu.

---

## 2. Tiêu Chí Nghiệm Thu Cho Milestone Kế Tiếp (M5: News & Contact CMS)

- [ ] Bài viết tin tức hiển thị trên `/news` và `/news/[slug]` lấy trực tiếp từ database PostgreSQL.
- [ ] Người dùng gửi form liên hệ tại `/contact` được lưu vào bảng `contact_messages`, trả về mã tra cứu thành công.
- [ ] Quản trị viên tại `/admin` có thể soạn thảo, xuất bản (publish/draft) bài viết và xem danh sách tin nhắn liên hệ.
- [ ] Toàn bộ test suite tự động (Typecheck, Lint, DB Test, Playwright E2E) đạt 100% PASS.
