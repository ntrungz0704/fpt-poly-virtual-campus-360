# PHÂN TÍCH KHOẢNG TRỐNG MVP & ĐIỀU KIỆN SẴN SÀNG PRODUCTION (11-MVP-GAP-ANALYSIS)
## FPT Polytechnic Virtual Campus 360°

---

## 1. Những Gì Đã Đạt Chuẩn (What is Achieved)

1. **Khung kiến trúc Monorepo & Core Backend:**
   - Hệ thống Backend NestJS và Frontend Next.js 16 kết nối hoàn hảo với PostgreSQL 16 qua Prisma ORM.
   - 32 bảng cơ sở dữ liệu đã chuẩn hóa 3NF, bảo toàn toàn vẹn khóa ngoại và ràng buộc CHECK.
2. **Cơ chế xác thực & bảo vệ tài khoản:**
   - Đăng nhập bảo mật Argon2id, quản lý phiên HttpOnly Cookie, thu hồi phiên theo gia đình token và khóa tài khoản chống brute-force.
3. **Các tính năng cốt lõi người dùng:**
   - Trải nghiệm Tour 360° Panorama WebGL và Bản đồ số GIS QTSC.
   - Luồng đăng ký vé Open Day, tạo mã vé `OD26-XXXX-XXXX`, sinh mã QR chuẩn SVG và điểm danh check-in bảo mật.
   - Đấu trường Quiz chấm điểm server và Vòng quay may mắn trúng thưởng có kiểm soát tồn kho.
   - Cổng Sinh viên và Cổng Phụ huynh kết nối database thật với luồng liên kết tài khoản con em.

---

## 2. Những Gì Chưa Đạt Chuẩn (What is Missing / Gaps)

1. **Tin tức & Liên hệ (M5):**
   - Hiện vẫn đang dùng dữ liệu tĩnh `CAMPUS_GUIDE_ARTICLES`. Chưa có bảng lưu tin tức và tin nhắn liên hệ trong PostgreSQL.
2. **Đợt Remediation M4 (B1–B6):**
   - Cần hoàn thành 6 điểm kiểm soát do GPT Mentor yêu cầu (Role Guard, XP aggregation, E2E đa tài khoản, xóa hardcoded credentials, chuẩn hóa ownership, lưu Tour vào backend).
3. **Cloud Object Storage (S3/R2):**
   - Hệ thống mới lưu media cục bộ trên đĩa cứng (`LocalStorageAdapter`). Để đưa lên môi trường Cloud Production có nhiều cụm máy chủ, cần kích hoạt và cấu hình `S3StorageAdapter` với Cloudflare R2 hoặc AWS S3.

---

## 3. Các Tiêu Chí Bắt Buộc Để Đạt Trạng Thái MVP (Minimum Viable Product)

- [x] Đăng nhập quản trị hệ thống bằng 1 Super Admin duy nhất hoạt động bền vững.
- [x] Xem không gian 360° thực tế và tương tác điểm ghim mượt mà trên di động.
- [x] Đăng ký vé Open Day và quét điểm danh QR thật, lưu vào PostgreSQL.
- [x] Tham gia Quiz, nhận điểm XP và quay vòng quay may mắn không xảy ra gian lận.
- [ ] Hoàn thành Remediation M4 (Blocker B1 đến B6).
- [ ] Chuyển đổi dữ liệu Tin tức và Liên hệ sang cơ sở dữ liệu thật (Milestone M5).

---

## 4. Các Tiêu Chí Bắt Buộc Để Sẵn Sàng Vận Hành Thực Tế (Production Readiness)

1. **Xóa toàn bộ thông tin xác thực mặc định khỏi source code:** Không để bất kỳ fallback mật khẩu nào trong các file test hoặc tài liệu công khai.
2. **Thiết lập biến môi trường bí mật:** Đảm bảo `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_BOOTSTRAP_PASSWORD` được quản lý qua hệ thống Secret Manager của hạ tầng triển khai.
3. **Kích hoạt kết nối Cloud Storage:** Cấu hình bucket S3/R2 tương thích với `MediaModule` để lưu ảnh dung lượng lớn bên ngoài container máy chủ.
4. **Kiểm thử tải (Load Testing):** Đảm bảo API chịu tải tối thiểu 500 yêu cầu/giây trong các đợt cao điểm tổ chức sự kiện Open Day trường.
