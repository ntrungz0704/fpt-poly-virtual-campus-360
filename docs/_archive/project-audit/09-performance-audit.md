# 09. KIỂM TOÁN HIỆU NĂNG, KHẢ NĂNG MỞ RỘNG & CHẤT LƯỢNG KIỂM THỬ

Tổng hợp kiểm toán hiệu năng & khả năng mở rộng (Section 16) cùng hiện trạng kiểm thử tự động & đo chất lượng mã nguồn (Section 17).

---

## 1. Kiểm Toán Hiệu Năng & Khả Năng Mở Rộng (Section 16)

> **Lưu ý nguyên tắc kiểm toán:** Dự án chưa có Backend API, chưa có Database và chưa thực hiện bất kỳ bài **Load Test** nào. Tuyệt đối **KHÔNG** tuyên bố hệ thống chịu tải được hàng nghìn người dùng đồng thời vào lúc này.

### Đánh Giá 16 Hạng Mục Hiệu Năng & Mở Rộng

| Hạng mục | Hiện trạng thực tế | Đánh giá & Vấn đề |
|---|---|---|
| **1–2. Database Indexes & Query Efficiency** | Chưa áp dụng (**S0**) | Chưa có DB/ORM; toàn bộ truy vấn là `.filter()` mảng 3–8 phần tử trong RAM. |
| **3. Pagination** | **CHƯA CÓ** | `/locations` (8 thẻ), `/news` (4 bài), `/admin` (4 dòng log) đều load toàn bộ mảng tĩnh, chưa hỗ trợ phân trang `page/limit` hay cursor pagination. |
| **4–5. Caching & CDN** | **CHƯA ĐẠT CHUẨN** | Không có Redis/API cache; 23 ảnh phụ thuộc URL ngoài `lh3.googleusercontent.com` chưa qua CDN riêng (`S3_PUBLIC_DOMAIN` chỉ mới nằm trên `.env.example`). |
| **6. Static Asset Delivery** | **CHƯA TỐI ƯU** | Còn **6 thẻ `<img>` thuần** không dùng `next/image`; 5 ảnh `.jpg` (~1.89 MB) nằm trong `apps/web/public/images/` không dùng tới (trong đó có 2 ảnh trùng 100%). |
| **7–8. Lazy Loading & Dynamic Imports** | **MỚI CÓ 1 PHẦN** | Điểm sáng: `map/page.tsx` dùng `next/dynamic(..., { ssr: false })` cho `Campus3DViewer` và `CampusGISMap`. Ngược lại, trang chủ `(public)/page.tsx` nạp thẳng `Hero360Viewer` (kéo theo cả thư viện `three.js` ngay ở màn hình đầu tiên `/`!). |
| **9. Panorama Image Sizes** | **CHƯA CHUẨN HÓA** | Chưa phân tầng tile 512/1024/2048/4K hay dùng WebP/AVIF; nếu đưa ảnh panorama 8K gốc 1 tấm trực tiếp vào WebGL trên điện thoại giá rẻ sẽ dễ tràn VRAM hoặc sập tab Safari/Chrome mobile. |
| **10. GLB Model Sizes** | **S0 (Chưa có model)** | `public/models/` trống. Khi đưa kiến trúc QTSC vào phải áp dụng nén **Draco / Meshopt + KTX2/WebP texture** để giữ kích thước bundle 3D dưới ngưỡng hợp lý (khuyến nghị < 5–15 MB tùy khu vực, kết hợp LOD). |
| **11–14. API Response, Concurrency, Pool, Background Jobs** | **S0** | Chưa có NestJS, BullMQ/Redis queue hay PgBouncer/Connection pool cho tác vụ nặng (như import hàng nghìn dòng Excel tài khoản sinh viên hoặc xử lý nén ảnh 360°). |
| **15–16. Rate Limiting & Monitoring** | **S0** | Chưa có `@nestjs/throttler`, Sentry, OpenTelemetry hay Web Vitals monitoring. |

### Bottleneck Nghiêm Trọng Trong Code WebGL Hiện Tại (Đo Bằng Đọc Mã Nguồn)
1. **Re-render 60 FPS do gọi React `setState` trong `requestAnimationFrame`:**
   - Cả `Hero360Viewer.tsx` và `VirtualTourViewer.tsx` đều cập nhật `heading`, `projectedHotspots` bằng React state ở mỗi khung hình. Điều này ép React chạy diffing DOM/V-DOM ~60 lần/giây ngay khi đang xoay camera.
   - `Campus3DViewer.tsx:967` gọi `setNearbyBuilding(...)` và tạo `new THREE.Vector3()` ở dòng `877` và `955` trong vòng lặp animation.
2. **Tạo mới & rò rỉ WebGL Context (`VirtualTourViewer.tsx:274`):** Đưa `[currentScene, handleZoom]` vào `useEffect` tạo mới nguyên `THREE.WebGLRenderer` mỗi lần chuyển cảnh 360° thay vì chỉ cập nhật texture trên vật liệu quả cầu duy nhất.
3. **Lạm dụng `"use client"`:** 10/14 trang đều render toàn trang trên client thay vì kết hợp React Server Component để render HTML ban đầu nhanh và giảm JS payload (cải thiện LCP/INP).

### Danh Sách Tối Ưu Bắt Buộc Trước Khi Production
1. Sửa `VirtualTourViewer.tsx` & `Hero360Viewer.tsx`: chuyển tọa độ hotspot DOM qua `ref.style.transform` trực tiếp (hoặc dùng Marzipano DOM hotspots), giữ 1 `WebGLRenderer` duy nhất và `dispose()` đầy đủ khi unmount.
2. Chuyển các trang đọc tin tức/địa điểm/giới thiệu sang **Server Components** + `revalidate`/API caching; chỉ giữ `"use client"` ở các island tương tác.
3. Thay toàn bộ `<img>` tĩnh sang `<Image>` (WebP/AVIF) và di dời toàn bộ ảnh/360°/GLB lên **Cloudflare R2 + CDN** (kèm tile pyramid cho 360° và Draco/KTX2 cho `.glb`).
4. Ở Backend + DB: cài Redis cache cho các endpoint đọc công khai nặng (`/tours/:slug`, `/news`, `/locations`), Connection Pool cho PostgreSQL và BullMQ worker cho tác vụ import Excel & xử lý media.

---

## 2. Kiểm Toán Kiểm Thử & Chất Lượng Mã Nguồn (Section 17)

### Hiện Trạng Hệ Thống Test
| Loại kiểm thử | Trạng thái | Bằng chứng thực tế |
|---|---|---|
| Unit Tests | **S0 (0 file)** | Quét toàn bộ workspace: `0` file `*.test.*` / `*.spec.*`; không có Vitest hay Jest trong `package.json`. |
| Integration Tests | **S0** | Chưa có Backend / DB. |
| API Tests | **S0** | Chưa có Swagger / Supertest / Postman collection. |
| End-to-End (E2E) Tests | **S0** | Chưa cài Playwright/Cypress. Chỉ có `capture-pages.mjs` (script Puppeteer chụp màn hình thủ công 14 URL) và `test-height.mjs` (đo scrollHeight nhưng file bị cắt hỏng dòng 13). |
| Visual Regression / Responsive / a11y / Security / Load Tests | **S0** | Chưa thiết lập công cụ đo tự động (`axe`, `Lighthouse CI`, `k6`/`Artillery`). |

### Kết Quả Các Lệnh Kiểm Tra An Toàn Đã Chạy Thực Tế (11/11/2026)

| Hạng mục kiểm tra | Lệnh thực thi | Kết quả | Chi tiết chính xác |
|---|---|---|---|
| **TypeScript (`packages/shared`)** | `npx tsc -p packages/shared/tsconfig.json --noEmit` | **PASS (`exit 0`)** | Không có lỗi kiểu trong `packages/shared/src/index.ts`. |
| **TypeScript (`apps/web`)** | `npx tsc -p apps/web/tsconfig.json --noEmit` | **PASS (`exit 0`)** | 0 lỗi TS, nhưng một phần lý do là chưa kết nối `@fpt-campus/shared` hay DTO API. |
| **Lint (`apps/web`)** | `npm run lint` | **FAIL (`exit 1`)** | **2 errors, 3 warnings**: `Campus3DViewer.tsx:842` (`prefer-const` `clock`), `test-height.mjs:13` (`Parsing error: '}' expected`), `OpenDayMiniGame.tsx:263` (`isCorrect` unused), `Campus3DViewer.tsx:285` (`teleportTo` unused), `Campus3DViewer.tsx:1021` (`useEffect` missing dep `nearbyBuilding`). |
| **Production Build (`apps/web`)** | `npm run build` | **FAIL (`exit 1`)** | Turbopack gãy tại `./apps/web/src/app/globals.css:114:1` (`Missing closing } at .font-headline-lg`). Không thể đóng gói bản production hiện tại. |
| **Unit / E2E Test Suites** | *(không tồn tại)* | **KHÔNG THỂ CHẠY** | Không có test runner (`vitest`/`jest`/`playwright`) và không có file test nào trong dự án. |
