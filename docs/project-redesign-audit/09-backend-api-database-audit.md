# 09 — KIỂM TOÁN BACKEND API & CƠ SỞ DỮ LIỆU (BACKEND & DATABASE AUDIT)

## 1. Kiến Trúc 10 Modules Backend NestJS (`apps/api`)

1. **`AuthModule` (`auth.controller.ts`):** Xử lý `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/change-password`.
2. **`UsersRbacModule` (`admin-users.controller.ts`):** Quản lý tài khoản, danh sách vai trò (`Role`), quyền (`Permission`), cấp phát tài khoản cá nhân.
3. **`PublicModule` (`public.controller.ts`):** Cung cấp API đọc công khai không cần đăng nhập cho Campus, Tòa nhà, Bản đồ, Địa điểm, Tour 360° và Sự kiện Open Day.
4. **`OpenDayModule` (`open-day.controller.ts`):** Quản trị toàn diện sự kiện Open Day, phiên hội thảo, ngân hàng câu hỏi Quiz, thống kê vé và Check-in cổng sự kiện.
5. **`GamificationModule` (`gamification.controller.ts`):** API thi trắc nghiệm, quay số trúng thưởng, ghi nhận sổ cái điểm thưởng `XpLedger`, tính bảng xếp hạng Leaderboard.
6. **`PortalModule` (`portal.controller.ts`):** Cung cấp API chuyên biệt cho Sinh viên (`/portal/*`) và Phụ huynh (`/parent/*`), kiểm soát phân quyền chéo nghiêm ngặt.
7. **`MediaModule` (`media.controller.ts`):** Kênh upload media an toàn, sinh token tải lên tạm thời và ghi nhận tài sản số `MediaAsset`.
8. **`StorageModule`:** Adapter lưu trữ trung gian (`LocalStorageAdapter`, S3/R2-ready).
9. **`AuditLogModule` (`audit-log.controller.ts`):** Truy vấn nhật ký kiểm toán hành vi quản trị viên.
10. **`HealthModule` (`health.controller.ts`):** Endpoint giám sát tình trạng hệ thống (`GET /health`).

---

## 2. Kiểm Toán Lược Đồ Dữ Liệu (32 Prisma Models)

Toàn bộ 32 models được thiết kế chuẩn hóa quan hệ (3NF) với các khóa ngoại và chỉ mục (indexes) tối ưu:
- **Cụm Không Gian & Tour:** `Campus`, `Building`, `Floor`, `FloorPlan`, `FloorPlanAlignmentSnapshot`, `LocationType`, `Location`, `MediaAsset`, `LocationMedia`, `TourNode`, `TourEdge`, `Hotspot`.
- **Cụm Người Dùng & Phân Quyền:** `User`, `Role`, `Permission`, `UserRole`, `RolePermission`, `AccountInvitation`, `UserImportBatch`, `RefreshToken`, `AuditLog`.
- **Cụm Sự Kiện & Tương Tác:** `OpenDayEvent`, `OpenDaySession`, `OpenDayFaq`, `OpenDayQuizItem`, `EventParticipation`, `UploadToken`.
- **Cụm Gamification & Cổng Thông Tin:** `QuizAttempt`, `XpLedger`, `SpinRewardConfig`, `UserSpinHistory`, `ParentStudentLink`.

---

## 3. Kiểm Toán An Toàn & Bảo Mật Dữ Liệu

- **Chống IDOR / BOLA:** Hoàn thành xuất sắc tại Milestone M4. Mọi truy vấn hồ sơ con em của phụ huynh đều bắt buộc kiểm tra điều kiện kết nối `APPROVED` trên server-side.
- **Chống SQL Injection:** 100% truy vấn dữ liệu được thực thi thông qua Prisma ORM với cơ chế Parameterized Queries, không sử dụng ghép chuỗi thô độc hại.
- **Chống CSRF & XSS:** Access Token được quản lý in-memory, Refresh Token sử dụng cờ `HttpOnly`, `SameSite=Strict`, không thể bị đánh cắp bởi mã độc JavaScript chạy trên trình duyệt.
