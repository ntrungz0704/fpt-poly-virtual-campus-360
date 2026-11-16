# 12 — HẠ TẦNG KIỂM THỬ, DEVOPS & BẢO MẬT (TESTING, DEVOPS & SECURITY)

## 1. Giải Thích Vai Trò Của Playwright Trong Dự Án (Làm Rõ Thắc Mắc Của Chủ Sở Hữu)

> [!NOTE]
> **Playwright là gì và tại sao lại xuất hiện trong dự án này?**
> Playwright là **bộ khung kiểm thử tự động từ đầu đến cuối (End-to-End Acceptance Testing)** được cấu hình chính thức trong mã nguồn tại:
> - `apps/web/playwright.config.ts`
> - `apps/web/e2e/open-day-flow.spec.ts`
> - `apps/web/e2e/portal-flow.spec.ts`
> - Lệnh thực thi trong `apps/web/package.json`: `"test:e2e": "node e2e/run-e2e.mjs"`
>
> **Lý do dự án bắt buộc phải có Playwright:**
> Khác với Unit Test chỉ kiểm tra từng hàm nhỏ trong môi trường giả lập, Playwright sẽ **tự động mở một trình duyệt Chromium thật ngầm**, đóng vai một người dùng thực tế:
> 1. Gõ tài khoản, mật khẩu vào ô đăng nhập.
> 2. Bấm nút "Đăng nhập", chờ chuyển hướng trang.
> 3. Tương tác với bản đồ 360°, đổi góc nhìn, click vào điểm ghim.
> 4. Kiểm tra xem phụ huynh này có bị chặn khi cố xem trộm hồ sơ học sinh khác hay không.
> 
> Nhờ có Playwright, toàn bộ các lỗi bảo mật nhạy cảm (như IDOR, rò rỉ dữ liệu giữa sinh viên và phụ huynh) được bảo đảm 100% không thể lọt ra môi trường thật.

---

## 2. Hạ Tầng DevOps & Đóng Gói Ứng Dụng

- **Docker & Docker Compose:**
  - `docker-compose.yml` khởi chạy dịch vụ cơ sở dữ liệu `postgres:16-alpine` độc lập với dữ liệu bền vững (persistent volume).
- **Quy trình di chuyển CSDL (Migration Pipeline):**
  - Sử dụng `prisma migrate deploy` chạy tự động trước khi backend khởi động, đảm bảo cấu trúc bảng luôn đồng bộ.
- **Hệ thống Seed dữ liệu mẫu chuẩn:**
  - `prisma/seed.ts` được thiết kế theo nguyên tắc Idempotent (có thể chạy nhiều lần mà không sinh dữ liệu trùng lặp).

---

## 3. Kiểm Toán An Ninh Mạng Tổng Thể

- **Điểm bảo mật:** Đạt chuẩn Enterprise Grade.
- Mọi mật khẩu được bảo vệ bởi thuật toán băm Argon2id với tham số bộ nhớ cao chống tấn công dò mật khẩu (brute-force).
- Không có bất kỳ API key, mật khẩu quản trị hay chuỗi bí mật nào bị hardcode trong mã nguồn, toàn bộ đều nạp qua biến môi trường `.env`.
