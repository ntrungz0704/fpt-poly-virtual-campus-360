# 04. KIỂM TOÁN FRONTEND (NEXT.JS / REACT / TAILWIND)

Kiểm toán kỹ thuật toàn bộ ứng dụng `apps/web/` theo đúng 20 tiêu chí trong Mục 7 của đề bài.

---

## 1. Đánh Giá 20 Tiêu Chí Frontend (Section 7)

| STT | Tiêu chí | Đánh giá thực tế | Bằng chứng cụ thể |
|---|---|---|---|
| **1** | Next.js cấu hình đúng? | **CÓ NHƯNG BUILD LỖI** | `apps/web/package.json` cài `next: 16.4.6`, `next.config.ts` khai báo `images.remotePatterns` (`lh3.googleusercontent.com`, `images.unsplash.com`) & `turbopack`. Tuy nhiên `README.md` lại ghi Next.js 15, và lệnh `npm run build` thất bại tại CSS parser. |
| **2** | App Router đã triển khai? | **CÓ** | Sử dụng `src/app/` với 5 route groups / namespaces: `(public)`, `(immersive)`, `(auth)`, `(portal)`, `admin`; có 14 `page.tsx` và 6 `layout.tsx`. Thiếu `loading.tsx`, `error.tsx`, `not-found.tsx` chuẩn của App Router. |
| **3** | TypeScript cấu hình chuẩn? | **ĐẠT (Compile Pass)** | `tsconfig.json` bật `"strict": true`, alias `@/* -> ./src/*`. Lệnh `tsc --noEmit` đạt `exit 0` cho cả `apps/web` và `packages/shared`. Tuy nhiên một số component dùng kiểu lỏng hoặc bỏ qua `packages/shared` (tạo kiểu dữ liệu trùng lặp cục bộ). |
| **4** | Tailwind cấu hình đúng? | **BỊ GÃY CUỐI FILE** | Dùng Tailwind CSS v4 (`@tailwindcss/turbopack: 4.3.3`) với `@import "tailwindcss";` và `@theme` trong `src/app/globals.css`. Không dùng `tailwind.config.*` (chuẩn v4). **Lỗi chí mạng:** dòng 114-115 của `globals.css` bị cắt ngang làm vỡ Turbopack & PostCSS build. |
| **5** | Design tokens có tập trung? | **PARTIALLY** | Tokens màu và spacing (`--color-primary: #a04100`, `--color-primary-container: #f36f21`, `--spacing-space-xl`, v.v.) tập trung ở `globals.css:3-68`, nhưng một số component vẫn trộn màu mặc định Tailwind như `bg-slate-900`, `text-slate-300`, `text-green-600`, `bg-[#041b3c]` (ở `Campus3DViewer.tsx` / `layout.tsx`), làm thiếu nhất quán token hoàn toàn. |
| **6** | Routes tổ chức hợp lý? | **PARTIALLY** | Cấu trúc `(public)`, `(immersive)`, `(auth)`, `(portal)`, `admin` sạch sẽ. Tuy nhiên gộp chung 3D Explorer & GIS Map vào 1 route `/map`; `admin` thiếu 11/12 route con; thiếu route đổi mật khẩu bắt buộc & quên mật khẩu; `FeaturedFacilities`/`Hero360Viewer` trỏ `?scene=` sai ID. |
| **7** | Layouts có tái sử dụng tốt? | **CÓ** | 6 layout (`RootLayout`, `(public)`, `(immersive)`, `(auth)`, `(portal)`, `admin`) tách biệt hợp lý phần navigation shell theo từng ngữ cảnh. Nhược điểm: `PublicLayout` đánh dấu `"use client"` không cần thiết; `(auth)` và `(portal)` không dùng `next/link`. |
| **8** | Desktop/Mobile Responsive? | **PARTIALLY (Còn lỗi HUD)** | Các trang nội dung công khai dùng lưới Tailwind `grid-cols-1 md:grid-cols-2/3` khá ổn. Tuy nhiên ở `/map` (`CampusGISMap.tsx:303` + `map/page.tsx:104`), 2 thanh HUD đáy chồng lên nhau; ở mobile `Campus3DViewer` có D-pad nhưng drawer chi tiết bên trái dễ che khuất không gian nhìn; nhiều modal/toolbar chưa kiểm thử định kỳ bằng viewport test tự động. |
| **9** | Có component trùng lặp / code thừa? | **CÓ** | `CampusSelectorModal.tsx` (131L) và `TourHotspotMarker.tsx` (64L) là component viết ra nhưng không được import ở bất cứ đâu. `Hero360Viewer.tsx` và `VirtualTourViewer.tsx` trùng lặp ~70% logic dựng hình cầu Three.js + chiếu tọa độ spherical hotspot thay vì tách hook/component dùng chung. |
| **10** | Có rule CSS xung đột / xấu? | **CÓ** | Ngoài việc `globals.css:115` thiếu dấu `}`, `RootLayout` (`layout.tsx:38-45`) tiêm `<style dangerouslySetInnerHTML>` ép `nextjs-portal { display: none !important; }` và `[data-nextjs-dialog-overlay] { display: none !important; }` — hành động này che giấu luôn hộp thoại báo lỗi dev của Next.js thay vì sửa gốc rễ. |
| **11** | Hình ảnh có được tối ưu? | **CHƯA** | Chỉ `about/page.tsx`, `Hero360Viewer`? (không, `Hero360Viewer` dùng texture URL), `about/page.tsx` + một số ít card dùng `next/image`, còn có **6 thẻ `<img>` thô** (như `(immersive)/layout.tsx`, `locations/[slug]/page.tsx`, `news/[slug]/page.tsx`, v.v.). Ngoài ra, có 23 đường dẫn trỏ thẳng ảnh ngoài `lh3.googleusercontent.com/aida-public/...`, trong khi `public/images/` chứa 5 ảnh địa phương không được dùng (và 2 file `campus-aerial-real.jpg` với `fpoly-campus-aerial.jpg` giống nhau 100% mã SHA256 `43FDDC50C978`, nặng 521KB mỗi file). |
| **12** | Loading & Error states? | **YẾU** | Chỉ thấy `<Suspense fallback=...>` ở `locations/[slug]`, `news/[slug]`, `campus`, `map` (cho dynamic import). Không có `loading.tsx`, `error.tsx`, `global-error.tsx`, `not-found.tsx` ở cấp route; không có xử lý lỗi mạng khi load texture 360° thất bại (WebGL sẽ đen xì nếu URL Google lỗi). |
| **13** | Forms có được validate? | **YẾU (Gần như chưa)** | Chỉ dựa vào thuộc tính `required` mặc định HTML5 hoặc kiểm tra rỗng đơn giản (`login/page.tsx`). Không dùng Zod, không dùng React Hook Form, không kiểm tra regex số điện thoại VN (`QuickAdmissionForm`, `contact`, `TicketRegistrationModal`), không có thông báo lỗi chi tiết theo từng trường. |
| **14** | Các tương tác có chạy thật? | **CHỈ CHẠY UI CỤC BỘ** | Xoay 360°, đi bộ 3D, lọc mảng tĩnh, mở modal, accordion FAQ, vòng quay Canvas đều phản hồi UI. Nhưng tất cả tương tác ghi dữ liệu (đăng ký Open Day, gửi liên hệ, đăng nhập, lưu XP quiz, đồng bộ Admin) đều giả lập trong RAM hoặc chỉ gọi `alert()`. Nút `"Đồng Bộ Dữ Liệu"` ở `/admin` không gắn `onClick`. |
| **15** | Có route / link bị gãy? | **CÓ (Rất nhiều)** | **11/12 route sidebar trong `/admin`** (404). **5 link `?scene=`** trên Homepage trỏ sai ID không tồn tại trong `/campus`. Link `"Xem phòng học & xưởng Lab"` từ Tòa F sang `/locations?building=Tòa Nhà F` lọc nhầm ra **Tòa Nhà T**. |
| **16** | Có dependency dư thừa / thiếu? | **THIẾU SO VỚI SPEC** | Không có package nào bị dư trong `package.json` (`next`, `react`, `react-dom`, `three`, `lucide-react`, `clsx`, `tailwind-merge`, `@types/three`, `puppeteer`). Ngược lại, **thiếu toàn bộ stack kiến trúc đã chốt**: `@react-three/fiber`, `@react-three/drei`, `marzipano`, `leaflet`, `react-hook-form`, `zod`, `@tanstack/react-query`, `zustand`, `vitest`/`playwright`, và không phụ thuộc `@fpt-campus/shared`. |
| **17** | Có vấn đề Accessibility (a11y)? | **CÓ** | Nhiều nút chỉ có icon Material Symbols thiếu `aria-label`; nhiều card/container gắn `onClick` trên `<div>` không có `role="button"` hoặc điều hướng bàn phím; vòng quay `OpenDayMiniGame` dùng `<canvas>` không có mô tả thay thế cho screen reader; `<html lang="vi">` có nhưng tương phản chữ phụ trên nền tối ở vài badge HUD chưa đạt chuẩn WCAG 2.2 AA (cần đo bằng axe/Lighthouse sau khi sửa build). |
| **18** | Dữ liệu production có bị hardcode? | **100% HARDCODE** | Mọi danh sách (4 tòa nhà, 8 phòng lab, 3 scene 360°, 4 bài tin tức, 5 câu quiz, 5 người bảng xếp hạng, 5 FAQ, thông tin sinh viên `PS24180`, số liệu dashboard `142.850`) đều khai báo hằng số trong component/page TSX, đồng thời có sự mâu thuẫn dữ liệu giữa các trang (địa chỉ phường của QTSC, số cơ sở, tổng số scene). |
| **19** | Có thao tác DOM trực tiếp & hack nguy hiểm? | **CÓ** | `RootLayout` (`layout.tsx:46-127`) ghi đè `Element.prototype.setAttribute`, vá đè `console.error` để nuốt toàn bộ thông báo lỗi chứa chữ `"hydration"` và chặn `window` error listener nhằm đối phó extension Cốc Cốc/browser (`bis_skin_checked`). Điều này cực kỳ nguy hiểm vì che lấp bug React thật trong quá trình phát triển! Ngoài ra có `2` chỗ dùng `dangerouslySetInnerHTML` và `2` chỗ dùng `alert()`. |
| **20** | Client vs Server Components hợp lý? | **CHƯA TỐI ƯU** | Gần như mọi trang (`about`, `locations`, `locations/[slug]`, `events`, `news`, `news/[slug]`, `contact`, `games`, `portal`, `admin`, `(public)/layout.tsx`, `(auth)/layout.tsx`, `(portal)/layout.tsx`) đều gắn `"use client"` ở cấp cao nhất. Hậu quả là toàn bộ HTML tĩnh & SEO metadata trang con không được tận dụng SSR/RSC, đẩy toàn bộ bundle JS xuống client. |

---

## 2. Kết Quả Kiểm Tra Công Cụ Thực Tế (Verification Output)

Chạy kiểm tra độc lập trong phiên kiểm toán ngày 11/11/2026:

1. **TypeScript (`packages/shared`):**
   - Lệnh: `npx tsc -p packages/shared/tsconfig.json --noEmit`
   - Kết quả: **PASS (`exit code 0`)**.
2. **TypeScript (`apps/web`):**
   - Lệnh: `npx tsc -p apps/web/tsconfig.json --noEmit`
   - Kết quả: **PASS (`exit code 0`)**.
3. **ESLint (`apps/web`):**
   - Lệnh: `npm run lint`
   - Kết quả: **FAIL (`exit code 1`) — 5 vấn đề (2 errors, 3 warnings)**:
     - `ERROR`: `src/components/map/Campus3DViewer.tsx:842:9` — `'clock' is never reassigned. Use 'const' instead` (`prefer-const`).
     - `ERROR`: `apps/web/test-height.mjs:13:55` — `Parsing error: '}' expected` (file script thừa bị cắt cụt).
     - `WARNING`: `src/components/events/OpenDayMiniGame.tsx:263:11` — `'isCorrect' is assigned a value but never used`.
     - `WARNING`: `src/components/map/Campus3DViewer.tsx:285:9` — `'teleportTo' is assigned a value but never used`.
     - `WARNING`: `src/components/map/Campus3DViewer.tsx:1021:6` — `React Hook useEffect has a missing dependency: 'nearbyBuilding'`.
4. **Production Build (`apps/web`):**
   - Lệnh: `npm run build` (`Next.js 16.4.6 Turbopack`)
   - Kết quả: **FAIL — 1 lỗi nghiêm trọng**:
     ```
     CssSyntaxError: E:\Virtual Campus FPT Poly\apps\web\src\app\globals.css:114:1: Missing closing } at .font-headline-lg
     ```
   - Nguyên nhân trực tiếp: Dòng 114–115 của `globals.css` đang dừng đột ngột ở `.font-headline-lg {\n  font-family: 'Plus Jaka`.

---

## 3. Khoảng Cách So Với Hệ Thống Design System (`docs/design-system.md`)

- **Đã khớp cơ bản:** Tên biến `--color-primary` (`#a04100`), `--color-primary-container` (`#f36f21`), `--color-on-surface` (`#041b3c`), `--color-surface` (`#f9f9ff`), font `Plus Jakarta Sans` & `Inter`, thư viện icon `Material Symbols Outlined`.
- **Chưa hoàn thiện / Sai lệch:**
  - Phần `.font-headline-lg` bị hỏng và toàn bộ các class typography cấp dưới (`.font-headline-sm`, `.font-body-lg`, `.font-body-md`, `.font-body-sm`, `.font-label-*`) đang được sử dụng khắp các `.tsx` nhưng **không hề tồn tại định nghĩa CSS trong `globals.css`** (chúng hiện chỉ là tên class rỗng không sinh ra style font-family/font-weight/line-height thực sự, do `globals.css` bị đứt ở dòng 115!).
  - Sử dụng `lucide-react` song song với Google `Material Symbols Outlined` chưa thống nhất chuẩn icon duy nhất.
