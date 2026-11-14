# 17 — RỦI RO & QUẢN TRỊ NỢ KỸ THUẬT (RISK & TECHNICAL DEBT AUDIT)

## 1. Các Rủi Ro Tiềm Ẩn Trong Quá Trình Redesign

1. **Rủi ro phá vỡ hợp đồng API (API Contract Breakage):**
   - *Nguyên nhân:* Khi thiết kế giao diện mới, lập trình viên có thể vô tình đổi tên trường dữ liệu hoặc cấu trúc props của component.
   - *Biện pháp kiểm soát:* Nghiêm cấm sửa đổi các DTOs tại `packages/shared`. Toàn bộ dữ liệu hiển thị trên UI mới phải lấy trực tiếp từ các trường sẵn có.
2. **Rủi ro lỗi Hydration Mismatch:**
   - *Nguyên nhân:* Việc sử dụng các thư viện canvas (Leaflet, Marzipano 360) hoặc truy cập trực tiếp đối tượng `window`/`localStorage` trong quá trình render Server-Side.
   - *Biện pháp kiểm soát:* Bắt buộc bọc các component tương tác sâu trong `next/dynamic` với `{ ssr: false }` và kiểm tra kỹ cờ `mounted` trước khi đọc LocalStorage.
3. **Rủi ro phát sinh thanh cuộn dọc ngoài ý muốn (Unintended Scrollbars):**
   - *Nguyên nhân:* Dùng nhầm `100vh` thay vì `100dvh` hoặc padding cộng dồn khiến chiều cao tổng thể vượt quá chiều cao cửa sổ trình duyệt.
   - *Biện pháp kiểm soát:* Tuân thủ nghiêm ngặt phân loại trang: Các trang `IMMERSIVE_CANVAS` phải có `h-screen overflow-hidden` ở container cha, chỉ để các dock công cụ nổi bên trên.

---

## 2. Nợ Kỹ Thuật Đã Được Giải Quyết Triệt Để Trước Redesign

-  Đã giải quyết dứt điểm lỗi IDOR rò rỉ dữ liệu giữa Phụ huynh và Sinh viên tại Milestone M4.
-  Đã chuẩn hóa cơ chế băm mật khẩu Argon2id và xoay vòng Refresh Token Cookie an toàn.
-  Đã loại bỏ toàn bộ dữ liệu mock ở các phân hệ cốt lõi, thay thế bằng dữ liệu thật từ cơ sở dữ liệu PostgreSQL 16.
