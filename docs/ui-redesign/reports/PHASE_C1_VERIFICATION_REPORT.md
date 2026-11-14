# BÁO CÁO NGHIỆM THU PHASE C1: DESIGN TOKENS & GLOBAL CSS ALIGNMENT
## DỰ ÁN FPT POLYTECHNIC VIRTUAL CAMPUS 360°

> **Trạng thái:** **FULL PASS** (Hoàn thành 100% mục tiêu Phase C1)  
> **Branch:** `fix/m4-acceptance-blockers`  
> **Base Commit:** `49dce4f`  
> **Thời điểm thực hiện:** 14/11/2026  
> **Phạm vi can thiệp:** Đồng bộ Design Tokens từ `TOKENS.md` vào `apps/web/src/app/globals.css` theo đúng cú pháp Tailwind CSS v4, giữ 100% tương thích ngược.

---

## 1. TỔNG QUAN HIỆN TRẠNG & BẢNG ĐỐI CHIẾU TOKEN (BEFORE VS AFTER)

| Nhóm Token | Token CSS / Tailwind | Giá trị trước (`49dce4f`) | Giá trị sau (`Phase C1`) | Ý nghĩa & Mục đích |
|---|---|---|---|---|
| **Primary Brand** | `--color-primary` | `#a04100` (Nâu cam sẫm) | **`#f26f21`** (Cam FPT chuẩn) | Chuẩn hóa màu nhận diện thương hiệu FPT Telecom/Poly |
| **Primary State** | `--color-primary-hover` | *Chưa định nghĩa* | **`#d95a10`** | Trạng thái hover cho button và liên kết cam |
| **Primary State** | `--color-primary-light` | *Chưa định nghĩa* | **`#fff4ed`** | Nền thẻ nhẹ, tag highlight tuyển sinh |
| **Primary State** | `--color-primary-subtle`| *Chưa định nghĩa* | **`rgba(242, 111, 33, 0.12)`** | Hiệu ứng active sidebar và viền phát sáng |
| **Secondary Tech** | `--color-secondary` | `#49607c` (Xám xanh nhạt) | **`#0d47a1`** (Navy công nghệ FPT) | Màu thương hiệu công nghệ FPT |
| **Secondary State**| `--color-secondary-hover`| *Chưa định nghĩa* | **`#0a3880`** | Trạng thái hover nhóm thứ cấp |
| **Secondary State**| `--color-secondary-light`| *Chưa định nghĩa* | **`#eff6ff`** | Nền thẻ phụ trợ |
| **Layout Surface** | `--color-bg-app` | *Chưa định nghĩa* | **`#f8fafc`** (Slate 50) | Nền ứng dụng chính, chống mỏi mắt |
| **Layout Surface** | `--color-surface-card` | *Chưa định nghĩa* | **`#ffffff`** (Trắng thuần) | Nền card nội dung, widget |
| **Layout Surface** | `--color-surface-hover`| *Chưa định nghĩa* | **`#f1f5f9`** (Slate 100) | Trạng thái hover trên danh sách / bảng |
| **Layout Border** | `--color-border` | *Chưa định nghĩa* | **`#e2e8f0`** (Slate 200) | Đường kẻ viền phân cách thẻ chuẩn |
| **Admin Shell** | `--color-dark-sidebar` | *Chưa định nghĩa* | **`#0f172a`** (Slate 900) | Sidebar Admin & Thanh công cụ 360 |
| **Typography Text**| `--color-text-primary` | *Chưa định nghĩa* | **`#0f172a`** | Màu văn bản tiêu đề độ tương phản cao |
| **Typography Text**| `--color-text-secondary`| *Chưa định nghĩa* | **`#475569`** | Màu mô tả phụ, nhãn thông tin |
| **Typography Text**| `--color-text-muted` | *Chưa định nghĩa* | **`#94a3b8`** | Placeholder, chú thích mờ |
| **Status Semantic**| `--color-error` | `#ba1a1a` | **`#ef4444`** | Màu cảnh báo lỗi theo chuẩn Tailwind |
| **Radius Scale** | `--radius-xs, sm, md, xl, 2xl, 3xl` | Chỉ có control, card, panel | **Bổ sung scale: 4px, 6px, 8px, 12px, 16px, 24px** | Thống nhất bán kính bo góc toàn hệ thống |
| **Elevation Scale**| `--shadow-xs, card, modal` | Chỉ có elevation-1/2/3 | **Bổ sung shadow-xs, card, modal** | Thống nhất độ sâu bóng đổ UI |

---

## 2. KIỂM CHỨNG CHẤT LƯỢNG KỸ THUẬT (ACCEPTANCE VERIFICATION)

### 2.1. Cổng kiểm tra trước khi sửa (Pre-implementation Gate):
- **Commit HEAD:** `49dce4f` (Xác nhận khớp).
- **Kiểm tra Image Hashes:** `node scripts/check-image-hashes.mjs` -> **50/50 ảnh vật lý độc lập, 0 duplicate**.
- **Trạng thái Working Tree:** Sạch (Clean).

### 2.2. Kiểm tra chất lượng mã nguồn sau khi sửa:
- **TypeScript Check (`pnpm --filter web typecheck`):** **PASS (Exit code 0, 0 lỗi type)**.
- **ESLint (`pnpm --filter web lint`):** **PASS (Exit code 0, 0 warning/error)**.
- **Next.js Production Build (`pnpm --filter web build`):** **PASS (Compiled in 3.8s, 29/29 routes generated)**.

---

## 3. BỘ ẢNH ĐỐI SOÁT BEFORE / AFTER (SCREENSHOT AUDIT)

Đã chụp độc lập trước và sau khi tích hợp Design Tokens trên cổng `http://localhost:3000`:

| Tuyến trang (Route) | Ảnh Before (Trước khi sửa) | Ảnh After (Sau khi sửa) | Ghi nhận thay đổi thực tế |
|---|---|---|---|
| **Homepage (`/`)** | `docs/ui-redesign/reports/screenshots/before-c1/homepage-before.png` | `docs/ui-redesign/reports/screenshots/after-c1/homepage-after.png` | Nút CTA, điểm nhấn thương hiệu chuyển sang Cam FPT rực rỡ `#f26f21`, tương phản rõ nét hơn. |
| **Login (`/login`)** | `docs/ui-redesign/reports/screenshots/before-c1/login-before.png` | `docs/ui-redesign/reports/screenshots/after-c1/login-after.png` | Form đăng nhập giữ nguyên bố cục, nút đăng nhập chính áp dụng hover cam mịn màng. |
| **Admin Dashboard (`/admin`)** | `docs/ui-redesign/reports/screenshots/before-c1/admin-before.png` | `docs/ui-redesign/reports/screenshots/after-c1/admin-after.png` | Bố cục layout admin ổn định 100%, không bị vỡ giao diện hay lệch cột. |
| **Student Portal (`/portal`)** | `docs/ui-redesign/reports/screenshots/before-c1/portal-before.png` | `docs/ui-redesign/reports/screenshots/after-c1/portal-after.png` | Giao diện portal hiển thị chuẩn mực, sẵn sàng tiếp nhận layout redesign ở Phase C6. |

---

## 4. CHECKLIST NGHIỆM THU PHASE C1

- [x] Design tokens được đối chiếu đầy đủ với CSS hiện tại.
- [x] Các token cần thiết (`--color-primary`, `--color-primary-hover`, `--color-secondary`, `--color-bg-app`, v.v.) được tích hợp thực tế vào `globals.css`.
- [x] Không có CSS variable bị trùng hoặc định nghĩa mâu thuẫn.
- [x] Không có lỗi cú pháp CSS (Tailwind v4 biên dịch mượt mà).
- [x] TypeScript check PASS (0 lỗi).
- [x] Lint check PASS (0 lỗi).
- [x] Production build PASS (29/29 routes tĩnh/động tạo thành công).
- [x] Các trang hiện tại không bị lỗi layout nghiêm trọng.
- [x] Có đầy đủ Before / After screenshots ở 4 trang cốt lõi.
- [x] Không có thay đổi ngoài phạm vi Phase C1 (0 file API, 0 file DB bị can thiệp).

---

*Báo cáo được khởi tạo tự động trong quy trình bàn giao Phase C1.*
