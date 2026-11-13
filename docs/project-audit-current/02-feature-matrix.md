# MA TRẬN CHỨC NĂNG HỆ THỐNG (02-FEATURE-MATRIX)
## FPT Polytechnic Virtual Campus 360°

- **Khung phân loại:** S0 (Chưa bắt đầu) → S1 (Scaffolded) → S2 (UI Prototype) → S3 (Implemented) → S4 (Integrated) → S5 (Verified) → S6 (Production Ready).

---

## 1. Bảng Ma Trận Đầy Đủ Tất Cả Chức Năng

| STT | Tên Chức Năng | Frontend | Backend | Database | Tests | Trạng Thái | Bằng Chứng / Ghi Chú |
|---|---|---|---|---|---|---|---|
| **1** | **Xác thực Đăng nhập (Argon2id + JWT)** | `LoginForm.tsx` | `POST /auth/login` | Bảng `users`, `refresh_tokens` | E2E + Integration | **S6** | Mật khẩu Argon2id, lockout 5 lần, HttpOnly cookie. |
| **2** | **Quản lý Phiên & Thu hồi (Token Rotation)** | `AuthProvider.tsx` | `POST /auth/refresh`, `POST /auth/logout` | Bảng `refresh_tokens` | `auth-session.spec.ts` | **S6** | Cơ chế Family ID thu hồi toàn bộ khi phát hiện reuse token. |
| **3** | **Đổi mật khẩu lần đầu bắt buộc** | `change-password/page.tsx` | `PATCH /auth/me/password` | `mustChangePassword = true` | E2E test suite | **S6** | Chặn điều hướng tới các trang khác cho đến khi đổi mật khẩu xong. |
| **4** | **Phân quyền truy cập Admin (RBAC)** | `ProtectedRoute.tsx` | Guards `@Roles`, `@Permissions` | `roles`, `permissions`, `role_permissions` | Unit + E2E | **S6** | Kiểm tra quyền từng module; chặn trực tiếp từ backend. |
| **5** | **Xem Tour 360° Panorama WebGL** | `campus/page.tsx` | `GET /public/tour-nodes` | Bảng `tour_nodes`, `hotspots` | E2E tests | **S5** | Three.js WebGL, 5 ảnh equirectangular 2:1, điều khiển camera, hotspot. |
| **6** | **Bản đồ số GIS QTSC** | `map/page.tsx` | `GET /public/campus`, `GET /public/locations` | Bảng `campuses`, `locations` | E2E tests | **S5** | Leaflet OpenStreetMap, đánh dấu tòa nhà, bộ lọc vị trí. |
| **7** | **Tra cứu Danh bạ Địa điểm Cơ sở** | `locations/page.tsx`, `[slug]` | `GET /public/locations` | Bảng `locations`, `location_types` | E2E tests | **S5** | Xem chi tiết phòng lab, hội trường, thư viện theo slug. |
| **8** | **Đăng ký vé trải nghiệm Open Day** | `TicketRegistrationModal.tsx` | `POST /public/events/register` | Bảng `event_participations` | E2E 5/5 PASS | **S6** | Sinh mã `OD26-XXXX-XXXX`, sinh SVG QR, chặn trùng email 409. |
| **9** | **Quản trị Sự kiện & Điểm danh Check-in** | `admin/events/page.tsx` | `POST /open-day/check-in` | `checked_in_at`, `audit_logs` | E2E 5/5 PASS | **S6** | Quét/nhập mã QR, ghi AuditLog, chặn quét lại lần 2. |
| **10** | **Đấu trường Quiz & Chấm điểm Server** | `games/page.tsx` | `POST /gamification/quiz/submit` | `quiz_attempts`, `xp_ledgers` | Unit tests | **S6** | Chấm điểm phía backend, cộng 20 XP/câu, lưu lịch sử thi. |
| **11** | **Vòng quay may mắn (Spin Wheel)** | `SpinWheelModal.tsx` | `POST /gamification/spin` | `user_spin_histories`, `spin_reward_configs` | Unit tests | **S6** | Backend quyết định ngẫu nhiên quà, trừ tồn kho quà, chống race condition. |
| **12** | **Bảng xếp hạng Vinh danh (Leaderboard)** | `LeaderboardView.tsx` | `GET /gamification/leaderboard` | `xp_ledgers` (Group By) | Unit tests | **S6** | Top 10 người có XP cao nhất, ẩn thông tin nhạy cảm. |
| **13** | **Cổng Sinh viên: Tổng quan & Hồ sơ** | `portal/profile/page.tsx` | `GET/PATCH /portal/profile` | `users` (`major`, `bio`, `phone`) | E2E 6/6 PASS | **S4** | Đã kết nối DB thật; cần bổ sung Backend Role Guard (B1). |
| **14** | **Cổng Sinh viên: Vé & Lịch trình** | `portal/tickets`, `portal/schedule` | `GET /portal/tickets`, `GET /portal/schedule` | `event_participations`, `open_day_sessions` | E2E 6/6 PASS | **S4** | Cần chuẩn hóa ownership chỉ theo `userId` (B5). |
| **15** | **Cổng Sinh viên: Tiến trình & Lịch sử Quà** | `portal/progress/page.tsx` | `GET /portal/gamification` | `xp_ledgers`, `user_spin_histories` | E2E 6/6 PASS | **S4** | Cần sửa aggregate tính tổng XP trên toàn bộ lịch sử (B2). |
| **16** | **Cổng Phụ huynh: Danh sách & Chi tiết** | `parent/page.tsx` | `GET /parent/students`, `GET /parent/students/:id` | `parent_student_links` | E2E 6/6 PASS | **S4** | Chặn IDOR (chỉ xem được con em đã APPROVED); cần B1 role guard. |
| **17** | **Cổng Phụ huynh: Luồng Liên kết Con em** | Modal liên kết con em | `POST /parent/links`, `POST /portal/links/:id/respond`| `parent_student_links` (`LinkStatus`) | E2E 6/6 PASS | **S4** | Luồng gửi yêu cầu & phê duyệt hoạt động; cần B1 role guard. |
| **18** | **Biên tập Tour 360° & Đặt Hotspot** | `admin/virtual-tour/page.tsx`| Chưa có API riêng | `localStorage` (`vc_admin_tour_scenes`) | Manual/UI verified | **S3** | UI đã ghim sidebar 100vh và có nút lưu; dữ liệu mới lưu local (B6). |
| **19** | **Thư viện Media & Quản lý Tệp** | `admin/media/page.tsx` | `GET/POST /admin/media/*` | `media_assets` | Unit tests | **S5** | Quản lý ảnh panorama, ảnh 2D, upload token, kiểm tra SHA-256. |
| **20** | **Quản trị Người dùng & RBAC Admin** | `admin/users/page.tsx` | `GET/POST /admin/users/*` | `users`, `user_roles` | Integration tests | **S5** | Tạo tài khoản, kích hoạt, vô hiệu hóa, gửi lời mời. |
| **21** | **Trang Tin tức & Cẩm nang Sinh viên** | `news/page.tsx`, `[slug]` | Chưa có API tin tức | Dữ liệu tĩnh `CAMPUS_GUIDE_ARTICLES` | UI verified | **S2** | Giao diện hoàn thiện nhưng dữ liệu còn tĩnh (Phạm vi M5). |
| **22** | **Trang Liên hệ & Hỗ trợ Tuyển sinh** | `contact/page.tsx` | Chưa có API liên hệ | Chưa có bảng lưu | UI verified | **S2** | Mới hiển thị thông tin tĩnh và link ngoài, chưa có form lưu DB (M5). |
| **23** | **Digital Twin 3D Tòa nhà (Three.js)** | `ThreeZoneScene.tsx` | Chưa có API model 3D | Chưa có bảng 3D | Scaffolded | **S1** | Khung Three.js đã dựng, tạm ẩn ở MVP theo quyết định kiến trúc. |

---

## 2. Thống Kê Phân Bổ Trạng Thái

- **Tổng số chức năng khảo sát:** 23 chức năng
- **S6 — Production Ready:** 7 chức năng (30.4%)
- **S5 — Verified:** 5 chức năng (21.7%)
- **S4 — Integrated:** 5 chức năng (21.7%)
- **S3 — Implemented:** 1 chức năng (4.3%)
- **S2 — UI / Prototype:** 2 chức năng (8.7%)
- **S1 — Scaffolded:** 1 chức năng (4.3%)
- **S0 — Not Started:** 2 chức năng (8.7%)
