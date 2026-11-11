# 13. ĐÁNH GIÁ MỨC ĐỘ SẴN SÀNG MVP (MVP READINESS)

Đánh giá thẳng thắn 12 câu hỏi cốt lõi tại Mục 19K bằng 4 mức **`YES` / `PARTIALLY` / `NO` / `UNKNOWN`** kèm bằng chứng xác thực từ workspace và kết quả chạy lệnh thực tế.

---

## 1. Bảng Trả Lời 12 Câu Hỏi MVP Readiness (Section 19K)

| # | Câu hỏi đánh giá | Trả lời | Bằng chứng thực tế xác minh tại Workspace (11/11/2026) |
|---|---|---|---|
| **1** | **Can the current application run?** *(Ứng dụng hiện tại có chạy được không?)* | **PARTIALLY** | Chỉ có Frontend (`apps/web`) từng chạy ở chế độ dev (`next dev`) để chụp 14 ảnh tham chiếu trước đó, còn lệnh đóng gói sản xuất **`npm run build` THẤT BẠI** (`CssSyntaxError` tại `apps/web/src/app/globals.css:114-115`), **`npm run lint` THẤT BẠI** (`exit 1` — 2 errors), và Backend `apps/api` cùng Database **chưa tồn tại / chưa chạy**. |
| **2** | **Can users navigate all pages?** *(Người dùng có điều hướng được mọi trang không?)* | **NO** | Tuy 14 file `page.tsx` đều tồn tại nhưng: **11/12 mục menu trong Sidebar `/admin` bị 404**; các thẻ trên Trang chủ (`FeaturedFacilities.tsx` & `Hero360Viewer.tsx`) dẫn link `?scene=it-lab`, `automation`, `studio`, `sports-field`, `campus` không tồn tại trong `/campus`; bấm xem phòng Tòa Nhà F từ `/map` sang `/locations?building=Tòa Nhà F` bị lọc nhầm ra **Tòa Nhà T** (`locations/page.tsx:111-112`); `PublicHeader` thiếu link `/about`. |
| **3** | **Can users explore 360°?** *(Người dùng có khám phá được 360° không?)* | **PARTIALLY** | Viewer Three.js xoay được trên `/` (`Hero360Viewer`) và `/campus` (`VirtualTourViewer`), có chiếu hotspot `(yaw, pitch)` và zoom FOV. Tuy nhiên: mới có **3 scene** cố định ở `/campus`, ảnh dùng là ảnh phối cảnh **16:9** ép lên hình cầu (gây đường ghép dọc và méo), không có Marzipano multi-res tiles, mỗi lần chuyển scene tạo lại cả `WebGLRenderer` gây rò rỉ GPU, và `setState` chạy 60 lần/giây. |
| **4** | **Can users explore 3D?** *(Người dùng có khám phá được 3D không?)* | **PARTIALLY** | Trang `/map` (`Campus3DViewer.tsx`) chạy được chế độ vệ tinh Orbit + người đi bộ Walk Mode (`WASD`, phím mũi tên, D-pad, nhảy Space, click tòa nhà mở drawer). Tuy nhiên: toàn bộ tòa nhà là **hình hộp lập trình `BoxGeometry` (placeholder)** chứ không phải `.glb` đo đạc thật hay R3F/Drei; `public/models/` rỗng; còn lỗi stale closure phím `E`, đi xuyên cây/cổng, HUD GIS chồng lấn đáy màn hình. |
| **5** | **Can administrators upload media?** *(Quản trị viên có upload được media không?)* | **NO** | Chưa có route `/admin/media`, `/admin/tours-360`, `/admin/models-3d` (404), chưa có `MediaModule` ở Backend, chưa tích hợp Object Storage S3/R2 hay Presigned URLs. |
| **6** | **Can administrators manage content?** *(Quản trị viên có quản lý được nội dung không?)* | **NO** | `/admin` hiện là 1 màn hình dashboard tĩnh với số liệu hardcode (`142.850`, `18 Scene`...); nút `"Đồng Bộ Dữ Liệu"` không gắn sự kiện; 100% nội dung web, phòng học, tin tức, sự kiện, câu hỏi quiz được viết cứng trong code `.tsx`. |
| **7** | **Can users log in?** *(Người dùng có đăng nhập được không?)* | **NO** | Trang `/login` chỉ là giả lập giao diện (điền sẵn `PS24180` / `polytechnic2025`, dùng `setTimeout(600ms)` rồi `router.push("/portal")`). Không có xác thực mật khẩu, không có JWT/Session/Cookie, không có phân quyền RBAC hay đổi mật khẩu lần đầu; `/portal` và `/admin` truy cập tự do không cần đăng nhập. |
| **8** | **Can Open Day registration work?** *(Đăng ký Open Day có hoạt động thật không?)* | **NO** | Modal đăng ký (`TicketRegistrationModal.tsx`) và form Trang chủ (`QuickAdmissionForm.tsx`) chỉ chuyển state cục bộ trên trình duyệt (`setIsSubmitted(true)`), luôn in cùng một mã giả `POLY-VIP-2025-9821`. Không lưu database, không gửi email/vé QR thật, không phân quyền sự kiện. |
| **9** | **Can the database persist data?** *(Database có lưu trữ được dữ liệu không?)* | **NO** | Không có `prisma/schema.prisma`, không có migration, không có Backend kết nối DB (`0` lệnh `fetch()` trong Frontend), dịch vụ Docker PostgreSQL chưa được khởi tạo/chạy, mọi thay đổi trên UI đều biến mất khi F5 tải lại trang. |
| **10** | **Can the application be demonstrated?** *(Có thể demo ứng dụng không?)* | **PARTIALLY** | Chỉ có thể **demo dạng giao diện ý tưởng (UI Clickable Prototype)** qua máy dev cục bộ (`next dev`) với kịch bản dẫn đường có kiểm soát (tránh click vào 11 menu sidebar Admin, tránh kiểm tra backend/auth/chỉnh sửa dữ liệu, lưu ý cảnh 360° có đường nối dọc và kết nối mạng ổn định để tải 23 ảnh `lh3.googleusercontent.com`). Không demo được từ bản `next build`. |
| **11** | **Can it be deployed?** *(Hiện tại có deploy lên môi trường chạy thật được không?)* | **NO** | Lệnh `npm run build` thất bại ngay lập tức tại `globals.css:115`; không có `apps/api`, không có `Dockerfile`, không có `.env`, không có CI/CD hay hạ tầng lưu trữ media bền vững. |
| **12** | **Is it ready for real users?** *(Có sẵn sàng cho thí sinh, phụ huynh, sinh viên dùng thật không?)* | **NO** | Thiếu toàn bộ lõi sống còn cho người dùng thật: bảo mật & phân quyền, lưu trữ đăng ký/liên hệ/điểm quiz, chống gian lận, tính ổn định ảnh 360° & media CDN, dữ liệu thống nhất không sai lệch, và kiểm thử tự động. |

---

## 2. Điều Kiện Tối Thiểu Để Tuyên Bố Đạt MVP Thực Tế (Minimum Viable Product Criteria)

Trước khi cho phép phát hành MVP ra thí sinh/phụ huynh hoặc thử nghiệm nội bộ tại cơ sở Quận 12, **100% 10 tiêu chí sau phải chuyển sang trạng thái `PASS / VERIFIED`**:

1. `next build`, `nest build`, `tsc --noEmit`, `eslint` và bộ test CI chạy xanh toàn phần (`exit 0`).
2. Toàn bộ các luồng public (`/`, `/about`, `/campus`, `/map`, `/locations`, `/locations/[slug]`, `/events`, `/news`, `/news/[slug]`, `/contact`, `/games`) không còn link gãy, dữ liệu đọc từ PostgreSQL, không hardcode mảng giả.
3. Hệ thống Auth + RBAC + **Forced Password Change lần đầu** chạy thật trên Backend NestJS Guards; `/portal` & `/admin` bị khóa chặt với người dùng không có quyền.
4. Import tài khoản sinh viên/phụ huynh hàng loạt qua Excel/CSV (`AccountImportModule`) hoạt động và xuất báo cáo lỗi dòng.
5. Open Day cấp mã vé QR duy nhất lưu DB, gửi xác nhận và quét check-in được; mini-game/quiz chấm điểm ở server không thể reset ăn gian quà.
6. Toàn bộ 23 ảnh Google `lh3.googleusercontent.com` được thay bằng Object Storage (R2/S3) + CDN ổn định.
7. Tour 360° dùng ảnh equirectangular 2:1 (hoặc tile Marzipano) đúng chuẩn không bị đường ghép dọc và không rò rỉ WebGL context.
8. Admin CMS quản lý & publish được tối thiểu: Buildings/Locations, Scenes 360° + Hotspots, Events, News, Users/Import, Media.
9. Không còn script test hỏng hoặc dữ liệu mâu thuẫn địa danh giữa các trang.
10. Có cơ chế sao lưu PostgreSQL, biến môi trường riêng biệt trên Production, HTTPS và ghi nhật ký lỗi runtime.
