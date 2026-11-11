# 11. NỢ KỸ THUẬT & CÁC ĐIỂM HỎNG (TECHNICAL DEBT)

Danh mục toàn bộ nợ kỹ thuật được phân loại theo đúng 10 nhóm tại Mục 19G, gắn rõ đường dẫn tệp và số dòng làm bằng chứng.

---

## 1. Mã Nguồn Trùng Lặp (Duplicate Code & Duplicate Files)
- **WebGL Panorama Boilerplate trùng lặp:** `Hero360Viewer.tsx` (567 dòng) và `VirtualTourViewer.tsx` (480 dòng) đều tự viết lại quy trình khởi tạo `THREE.PerspectiveCamera`, `SphereGeometry`, handler `pointerdown/move/up`, và hàm chiếu 3D → 2D hotspot thay vì trích xuất module dùng chung.
- **2 file ảnh nhị phân giống hệt nhau 100%:** `apps/web/public/images/campus-aerial-real.jpg` và `apps/web/public/images/fpoly-campus-aerial.jpg` đều có kích thước `521.451 bytes` (1024×576) và cùng mã băm SHA256 `43FDDC50C978...`, lại không được bất kỳ dòng code nào sử dụng.
- **Định nghĩa Type trùng lặp:** Nhiều component (như `news/page.tsx` định nghĩa `ArticleItem`, `map` định nghĩa cấu trúc building riêng) không dùng lại `packages/shared/src/index.ts`.

## 2. Dữ Liệu Hardcode & Mâu Thuẫn Dữ Liệu Nội Bộ
- **100% dữ liệu tĩnh:** Tòa nhà, 8 phòng lab, 3 scene 360°, 4 bài báo, 5 câu quiz, 5 thành tích leaderboard, 5 FAQ, thông tin sinh viên `PS24180`, số liệu Admin dashboard (`142.850`, `68.420`...).
- **Mâu thuẫn địa danh Q.12 ngay trong codebase:** `games/page.tsx:21` khẳng định Lô 24 CVPM Quang Trung thuộc **Phường Trung Mỹ Tây**, trong khi `Campus3DViewer.tsx` / bảng thông tin Tòa F ghi **P. Tân Chánh Hiệp**.
- **Mâu thuẫn quy mô tự báo cáo trên giao diện:**
  - `PublicHeader.tsx` hiển thị cụm `"5 cơ sở"` nhưng danh sách chỉ có 1 cơ sở `HCM_Q12` (trong khi `docs/` và `packages/shared` ghi 5 cơ sở `HN, DN, HCM, CT, TN`).
  - `admin/page.tsx` hiển thị `"18 Scene"`, `"4 Khối tòa nhà"`, `"50+ Phòng học"`, `"25 Câu hỏi"`, `"42 Bài xuất bản"`, trong khi dữ liệu thật trong app chỉ có **3 scene**, **8 phòng**, **5+3 câu hỏi**, và **4 bài viết**.
- **Phụ thuộc 23 URL ngoài `lh3.googleusercontent.com/aida-public/...`** rải khắp trang chủ, about, locations, news, tour 360°.

## 3. Liên Kết & Route Bị Gãy (Broken Routes & Broken Queries)
- **11/12 route trong Sidebar Admin trả về lỗi 404:** `/admin/locations`, `/admin/tours-360`, `/admin/models-3d`, `/admin/media`, `/admin/events`, `/admin/games`, `/admin/news`, `/admin/users`, `/admin/roles`, `/admin/analytics`, `/admin/settings` chưa được tạo `page.tsx`.
- **5 query `?scene=` bị sai ID trên Homepage:**
  - `Hero360Viewer.tsx` trỏ `/campus?scene=campus`.
  - `FeaturedFacilities.tsx` trỏ `/campus?scene=it-lab`, `automation`, `studio`, `sports-field`.
  - Toàn bộ bị hụt khi sang `campus/page.tsx` vì mảng `CAMPUS_SCENES` chỉ có `thu-vien`, `lab-it`, `studio-imac`.
- **Lỗi logic lọc Tòa nhà (`locations/page.tsx:111-112`):** Khi `BuildingDetailDrawer.tsx:99` chuyển `?building=Tòa Nhà F` sang `/locations`, biểu thức `bldgQuery.toLowerCase().includes(b.split(" ")[2]?.toLowerCase() || "")` lấy chữ `"t"` của `"Tòa Nhà T..."` và khớp nhầm vào mọi chuỗi `"Tòa Nhà ..."` (có chữ `t` ở đầu `"Tòa"`!), làm người dùng bấm xem phòng Tòa F hoặc Innovation nhưng luôn bị chọn nhầm **Tòa Nhà T**.
- **Trang chi tiết tĩnh hoàn toàn:** `/locations/[slug]` và `/news/[slug]` chỉ đọc tham số `slug` để in lên breadcrumb, còn toàn bộ nội dung, ảnh, thông số đều giữ nguyên một mẫu duy nhất.
- **PublicHeader thiếu link `/about`.**

## 4. Thiếu Nhất Quán Design Tokens & Hỏng CSS Build
- `apps/web/src/app/globals.css:114-115` bị cắt cụt giữa `.font-headline-lg { font-family: 'Plus Jaka` → **làm vỡ toàn bộ lệnh `npm run build`**.
- Các class `.font-headline-sm`, `.font-body-lg`, `.font-body-md`, `.font-body-sm`, `.font-label-lg`, `.font-label-md`, `.font-label-sm` được gắn vào JSX trên hàng loạt trang nhưng **không tồn tại định nghĩa CSS trong `globals.css`**.
- Một số component dùng màu hardcoded (`slate-900`, `green-600`, `#041b3c`) thay cho biến `@theme` và pha trộn `lucide-react` với `Material Symbols Outlined`.

## 5. Thiếu Kiểm Tra Hợp Lệ Dữ Liệu (Missing Validation)
- Không có Zod hoặc React Hook Form ở Frontend; không có DTO ValidationPipe ở Backend.
- `QuickAdmissionForm.tsx`, `contact/page.tsx`, `TicketRegistrationModal.tsx`, `login/page.tsx` không kiểm tra định dạng số điện thoại VN (`0x...`), độ dài mật khẩu hay format email chặt chẽ.

## 6. Thiếu Hoàn Toàn Tích Hợp API (0% Integration)
- **`0` lần gọi `fetch()`** trong toàn bộ `apps/web/src`.
- Nút `"Đồng Bộ Dữ Liệu"` trên `/admin` là nút chết không có `onClick`.
- Nút `"Tải vé PDF"` (`DigitalPassCard.tsx:61`) và `"Sao chép link"` (`news/[slug]/page.tsx:112`) chỉ bật `alert()`.

## 7. Tài Nguyên, Thư Viện & Mã Nguồn Bị Bỏ Không / Dư Thừa
- **Code chết (Unused components/symbols):** `CampusSelectorModal.tsx` (131L), `TourHotspotMarker.tsx` (64L), biến `teleportTo` (`Campus3DViewer.tsx:285`), biến `isCorrect` (`OpenDayMiniGame.tsx:263`).
- **`packages/shared/src/index.ts` (183L):** 0 lần import trong toàn workspace.
- **Tài liệu & Code mâu thuẫn công nghệ:** `README.md` và `docs/` nêu R3F, Drei, Marzipano, Leaflet, Zustand, React Query, RHF, Zod — tất cả đều vắng mặt trong `apps/web/package.json`.
- **5 ảnh bỏ không trong `apps/web/public/images/`** (tổng ~1.89MB).
- **Script rác nằm ở root `apps/web/`:** `test-height.mjs` bị cắt cụt ở dòng 13 gây lỗi ESLint `Parsing error: '}' expected`; `capture-pages.mjs` giữ đường dẫn cứng trỏ vào ổ `C:/Users/ntrun/...`.
- **Thư mục `desktop/` và `mobile/` biến mất:** Tài liệu cũ (`README.md`, `docs/design-audit.md`) dẫn chiếu 2 thư mục Stitch HTML/CSS gốc nhưng thực tế chúng không còn trong `E:\Virtual Campus FPT Poly`.

## 8. Vấn Đề Hiệu Năng & Rò Rỉ Bộ Nhớ (Performance & Memory Leaks)
- `VirtualTourViewer.tsx:274` hủy và tạo mới `WebGLRenderer` mỗi lần chuyển scene 360°, không `dispose()` sạch tài nguyên GPU.
- `Hero360Viewer.tsx` và `VirtualTourViewer.tsx` gọi React `setState` mỗi khung hình trong `requestAnimationFrame` (~60 lần/s).
- `Campus3DViewer.tsx:877,955,967` cấp phát `new THREE.Vector3()` và gọi `setNearbyBuilding` trong loop animation.
- Tải ảnh 16:9 dán lên cầu 360° (lỗi seam dọc + nhòe) và chưa lazy-load `Hero360Viewer`/`Three.js` tách khỏi initial bundle trang chủ.
- Lạm dụng `"use client"` trên 10/14 `page.tsx` + 3 `layout.tsx`.

## 9. Lỗ Hổng Bảo Mật (Security Weaknesses)
- Không có Backend API & Guard bảo vệ `/admin` và `/portal` (truy cập tự do 100%).
- `login/page.tsx` điền sẵn tài khoản demo, đăng nhập giả lập bằng `setTimeout(600ms)` và in nhãn sai `"TLS 1.3 & HASH BCRYPT"`, `"ISO/IEC 27001"`.
- `layout.tsx:38-127` dùng `dangerouslySetInnerHTML` ẩn dialog lỗi Next.js (`nextjs-portal`), ghi đè `Element.prototype.setAttribute`, nuốt log `console.error` chứa `"hydration"`, và chặn `window` error listener.
- Mini-game & Quiz lưu toàn bộ đáp án ở trình duyệt và cho phép quay thưởng / reset không giới hạn.

## 10. Lỗi Responsive & Tương Tác Còn Dở Dang
- Ở chế độ bản đồ GIS (`/map`), thanh chú thích ở đáy của `CampusGISMap.tsx:303` (`bottom-6`) **đè trực tiếp** lên dải nút chọn nhanh tòa nhà của `map/page.tsx:104` (`bottom-3`).
- `Campus3DViewer.tsx:795` & `1021` mắc lỗi React Hook stale closure ở phím tắt `E` (`KeyE`) khi ở gần tòa nhà (và thiếu `nearbyBuilding` trong dependency array).
- Walk Mode chỉ đặt collider cho 4 tòa nhà chính, bỏ sót cây cối, cổng chào và hàng rào QTSC nên avatar đi xuyên vật thể trang trí.
- Sử dụng song song 6 thẻ `<img>` thuần và `10` thẻ `<a href>` thô thay `<Image>` và `<Link>`.
