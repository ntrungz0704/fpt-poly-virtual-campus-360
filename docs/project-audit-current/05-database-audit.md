# KIỂM TOÁN CƠ SỞ DỮ LIỆU & PRISMA SCHEMA (05-DATABASE-AUDIT)
## FPT Polytechnic Virtual Campus 360°

- **Hệ quản trị CSDL:** PostgreSQL 16 (chạy container Alpine)
- **ORM & Quản lý Migration:** Prisma ORM 5.22
- **Tình trạng kiểm thử toàn vẹn:** 14/14 checks PASS (`prisma/verify-db-integrity.ts`)

---

## 1. Lịch Sử & Danh Sách Migrations Đã Triển Khai Thực Tế

Toàn bộ 4 migrations sau đã được áp dụng đầy đủ và xác minh qua `pnpm db:test`:

1. `20261111175635_init`:
   - Thiết lập nền móng dữ liệu 3NF ban đầu: `campuses`, `buildings`, `floors`, `floor_plans`, `locations`, `media_assets`, `tour_nodes`, `tour_edges`, `hotspots`, `users`, `roles`, `permissions`, `role_permissions`, `account_invitations`, `audit_logs`.
   - Ràng buộc CHECK PostgreSQL: tọa độ hotspot, yaw (-180..180), pitch (-90..90), cấm tự liên kết tour_edge (`from_node_id != to_node_id`).
2. `20261112000001_phase2b_auth_init`:
   - Bổ sung cấu trúc xác thực Phase 2B: bảng `refresh_tokens`, quản lý phiên `family_id`, quản lý đăng nhập thất bại `failed_login_attempts`, thời gian khóa `locked_until`.
3. `20261112000002_m3d_gamification`:
   - Bổ sung thực thể Gamification: `open_day_events`, `open_day_sessions`, `open_day_faqs`, `open_day_quiz_items`, `quiz_attempts`, `xp_ledgers`, `spin_reward_configs`, `user_spin_histories`, `upload_tokens`.
4. `20261113000003_m4_portal_parent_student`:
   - Bổ sung trường thông tin sinh viên trên bảng `users`: `student_code`, `major`, `avatar_url`, `bio`.
   - Tạo enum `LinkStatus` (`PENDING`, `APPROVED`, `REJECTED`).
   - Tạo bảng liên kết `parent_student_links` với khóa ngoại kép tới `users`, ràng buộc duy nhất `@@unique([parentId, studentId])` và `onDelete: Cascade`.

---

## 2. Thống Kê & Phân Nhóm 32 Prisma Models

### 2.1. Nhóm Cơ Sở Vật Chất & Không Gian 360°
- `Campus`: Thông tin khuôn viên trường tại QTSC Quận 12.
- `Building`: Danh mục các tòa nhà (Tòa T, Tòa F, Tòa Innovation...).
- `Floor`, `FloorPlan`, `FloorPlanAlignmentSnapshot`: Quản lý tầng lầu và bản đồ 2D GIS.
- `LocationType`, `Location`, `LocationMedia`: Các phòng thực hành CNTT, iMac studio, thư viện số, hội trường.
- `TourNode`, `TourEdge`, `Hotspot`: Dữ liệu không gian tour 360° thực tế, liên kết điểm nhìn và ghi chú.

### 2.2. Nhóm Người Dùng & Phân Quyền (RBAC)
- `User`: Tài khoản người dùng (Super Admin, Staff, Student, Parent).
- `Role`, `Permission`, `UserRole`, `RolePermission`: Mô hình RBAC đa cấp độc lập.
- `AccountInvitation`: Token kích hoạt tài khoản gửi qua email/SMS có thời hạn.
- `RefreshToken`: Phiên làm việc Opaque Token, lưu `tokenHash` (SHA-256) và `familyId`.
- `AuditLog`: Nhật ký bảo mật ghi nhận mọi thao tác nhạy cảm (đăng nhập, đổi mật khẩu, check-in, khóa tài khoản).

### 2.3. Nhóm Sự Kiện Open Day & Gamification
- `OpenDayEvent`, `OpenDaySession`, `OpenDayFaq`: Lịch trình ngày hội trải nghiệm, danh sách diễn giả, phiên hội thảo.
- `EventParticipation`: Vé tham dự sự kiện thực tế, mã vé duy nhất dạng `OD26-*`, thời gian check-in.
- `OpenDayQuizItem`, `QuizAttempt`: Ngân hàng câu hỏi trắc nghiệm và lịch sử thi của người tham gia.
- `XpLedger`: Sổ cái điểm thưởng kinh nghiệm XP, ghi nhận nguồn nhận (Quiz, Check-in, Minigame).
- `SpinRewardConfig`, `UserSpinHistory`: Cấu hình danh mục giải thưởng, tỷ lệ trúng và lịch sử quay thưởng.
- `UploadToken`: Mã cấp phép tải lên tệp media an toàn với thời gian sống ngắn.

### 2.4. Nhóm Cổng Sinh Viên & Phụ Huynh
- `ParentStudentLink`: Thực thể quản lý mối quan hệ liên kết con em và phụ huynh, trạng thái duyệt (`LinkStatus`).

---

## 3. Đánh Giá Toàn Vẹn & Ràng Buộc Dữ Liệu (Integrity Findings)
1. **Duy nhất 1 tài khoản Super Admin hoạt động:**
   - Email: `admin@poly.edu.vn` (Role: `SUPER_ADMIN`, UserType: `ADMIN`).
   - Mật khẩu mã hóa Argon2id hợp lệ, tài khoản đang ở trạng thái `ACTIVE` / `ACTIVATED`.
2. **Không có dữ liệu giả (No Mock Data in DB):**
   - Không chứa tài khoản rác hoặc dữ liệu giả lập không rõ nguồn gốc.
   - Các bản ghi tham chiếu địa điểm, cảnh 360° đều tương ứng với 11 tệp ảnh thực tế được kiểm chứng SHA-256 trên đĩa (`AC-07`).
3. **Bảo toàn tính toàn vẹn khi xóa (Cascade vs Restrict):**
   - Khi xóa `User`, các phiên làm việc và liên kết phụ huynh tự động xóa theo (`Cascade`).
   - Các sự kiện có người đăng ký hoặc Quiz có lượt thi đều áp dụng chính sách `Restrict` hoặc Soft-delete để bảo toàn lịch sử giao dịch.
