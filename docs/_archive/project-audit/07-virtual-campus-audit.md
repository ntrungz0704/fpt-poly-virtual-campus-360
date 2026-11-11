# 07. KIỂM TOÁN VIRTUAL CAMPUS 360°, 3D, GIS, MEDIA & CMS

Báo cáo chuyên sâu về lõi đặc thù nhất của dự án: Panorama 360° (Mục 11), 3D Campus (Mục 11), GIS Map (Mục 11), Quản lý Media/Asset (Mục 12), Open Day & Gamification (Mục 14) và Admin CMS (Mục 15).

---

## 1. Kiểm Toán Panorama 360° (`Hero360Viewer.tsx` & `VirtualTourViewer.tsx`)

| Tiêu chí (Section 11) | Thực tế quan sát được | Đánh giá & Bằng chứng |
|---|---|---|
| **Panorama Viewer** | Dùng **Three.js thuần** (`SphereGeometry(500, 60, 40)` lộn mặt trong `scale(-1, 1, 1)`). **Chưa cài `marzipano`**. | Mâu thuẫn với `README.md:9` và `VirtualTourShowcase.tsx` đều ghi đang dùng Marzipano. |
| **Equirectangular 2:1 support** | **KHÔNG ĐẠT ĐÚNG CHUẨN.** Ảnh thực tế tải từ `lh3.googleusercontent.com` (qua đối chiếu hình chụp thực tế và ảnh Stitch) là **ảnh phối cảnh chữ nhật (tỉ lệ ~16:9)** dán thẳng lên mặt cầu. | Gây hiện tượng **vệt ghép dọc (vertical seam)** rõ rệt ngay góc quay 0°/360° và méo hình ở cực trên/dưới. |
| **Image Resolution & Progressive Load** | Tải 1 file JPEG/WebP đơn lẻ từ URL Google không kiểm soát CDN, không có multi-resolution tile pyramid (cấp zoom 512/1024/4K như Marzipano). | Kém nét khi zoom sâu; không hoạt động offline/bền vững nếu link Google tạm hết hạn. |
| **Scene Navigation** | `campus/page.tsx` mới có đúng **3 scene** (`thu-vien`, `lab-it`, `studio-imac`). | Trái ngược với `/admin` tự báo cáo `"18 Scene"` và với các link hỏng trên Homepage (`?scene=campus`, `it-lab`, `automation`, `studio`, `sports-field`). |
| **Hotspot Rendering & Tọa độ** | **Đạt về nguyên lý cầu:** Hotspot dùng `(yaw, pitch)` trong hệ cầu được chiếu qua ma trận camera `project(camera)` ra tọa độ `(x, y)` 2D (`Hero360Viewer.tsx`, `VirtualTourViewer.tsx`). Không gán cứng pixel cố định. | Lưu ý: dữ liệu hotspot đang hardcode trong JSX/TS; `TourHotspotMarker.tsx` (64L) đã viết riêng nhưng bỏ xó không dùng. |
| **Yaw / Pitch Sync & Zoom** | Có hỗ trợ kéo chuột xoay `lon/lat` và phóng to/thu nhỏ `FOV` (`45`–`90`), có la bàn `TourCompassHUD`. | Tuy nhiên cả 2 viewer đều gọi **`setState` trong vòng lặp `requestAnimationFrame`** (60 lần/giây) gây re-render React liên tục toàn bộ cây HUD. |
| **Mobile Gestures & Loading** | Có `touchstart/touchmove/touchend`. Có chữ `"Đang tải..."` khi mount ban đầu nhưng không có error fallback nếu `TextureLoader` thất bại. | Cần bổ sung error state và tối ưu chạm mượt tránh xung đột cuộn trang ở Homepage. |
| **Rò rỉ tài nguyên WebGL (Critical)** | Trong `VirtualTourViewer.tsx:274`, `useEffect` đưa `[currentScene, handleZoom]` vào mảng dependency → **mỗi lần chuyển scene, toàn bộ `WebGLRenderer`, `Scene`, `SphereGeometry` và event listeners bị tháo hủy và khởi tạo lại**, không gọi `dispose()` sạch cho texture/geometry cũ. | Mở liên tục 6–10 scene rất dễ chạm ngưỡng `MAX_ACTIVE_WEBGL_CONTEXTS` của trình duyệt (~8–16 context). |

---

## 2. Kiểm Toán Three.js / React Three Fiber (`Campus3DViewer.tsx`)

| Tiêu chí (Section 11) | Thực tế quan sát được | Đánh giá & Bằng chứng |
|---|---|---|
| **R3F / Drei Integration** | **KHÔNG TỒN TẠI (`S0`).** Cài `three: ^0.187.0` thuần; không cài `@react-three/fiber` hay `@react-three/drei`. | Chưa khớp kiến trúc xác nhận (`R3F + Drei`) trong Mục 3. |
| **Mô hình kiến trúc hiện tại là loại gì?** | **Placeholder / Stylized Procedural Geometry.** Các tòa nhà (Tòa T, Tòa F, Tòa P, Khu Thể Thao, Cầu Vượt QTSC) được dựng hoàn toàn bằng `BoxGeometry`, `CylinderGeometry`, `ConeGeometry`, `PlaneGeometry`. Thư mục `apps/web/public/models/` hoàn toàn **RỖNG**. | Chưa có mô hình `.glb/.gltf` đo đạc CAD thực tế; **không được tuyên bố đây là mô hình kiến trúc chính xác của QTSC**. |
| **Canvas, Camera, Lighting, Materials** | `PerspectiveCamera`, `AmbientLight` + `DirectionalLight` có `castShadow`, `MeshStandardMaterial` & `CanvasTexture` sinh bảng tên tại runtime. | Ánh sáng và đổ bóng đủ trực quan để minh họa prototype, nhưng thiếu môi trường IBL/HDRI và vật liệu PBR thật từ `.glb`. |
| **Raycasting & Interactive Selection** | Có raycasting `pointerdown/pointerup` kiểm tra di chuyển chuột < 6px để click chọn tòa nhà, cập nhật `BuildingDetailDrawer`. Có Walk Mode góc nhìn thứ 3 với nhân vật voxel sinh viên (`WASD` + phím mũi tên + Telex IME + D-pad + Space nhảy + `BUILDING_COLLIDERS` AABB). | **Bug nghiêm trọng:** (1) `Campus3DViewer.tsx:842` lỗi ESLint `let clock`; (2) `useEffect` lắng nghe `KeyE` bị stale closure `nearbyBuilding` (dòng `795`/`1021`); (3) Biến `teleportTo` không dùng (dòng `285`); (4) Hàng cây, cột đèn, cổng chào không có collider nên nhân vật đi xuyên vật thể; (5) Tạo mới `new THREE.Vector3()` ở mỗi frame 60fps (`L877`, `L955`) gây áp lực Garbage Collector. |
| **Resource Disposal** | Thiếu hàm thu dọn toàn diện `geometry.dispose()`, `material.dispose()`, `texture.dispose()` cho tất cả mesh con khi unmount component `/map`. | Nguy cơ tràn VRAM khi chuyển đổi qua lại nhiều lần giữa tab 3D và GIS 2D (vì chuyển mode GIS làm unmount `Campus3DViewer`). |

---

## 3. Kiểm Toán GIS Campus Map (`CampusGISMap.tsx`)

- **Bản chất hiện tại (`S2`):** `CampusGISMap.tsx` (321 dòng) **KHÔNG PHẢI GIS MAP**. Đây là một sơ đồ `<svg viewBox="0 0 1000 650">` tĩnh minh họa khối màu bằng tọa độ SVG giả định (không dùng Leaflet/Mapbox, không tile bản đồ vệ tinh/đường phố TP.HCM, không chuyển đổi từ tọa độ WGS84 GPS `lat/lng`).
- **Tương tác hiện có:** Click chọn 4 tòa nhà đồng bộ `BuildingDetailDrawer`, nút zoom `+ / - / Reset` bằng CSS `transform: scale()`.
- **Lỗi UI thực tế:**
  - Thanh chú thích đáy của `CampusGISMap.tsx:303` (`bottom-6`) **đè chồng trực tiếp** lên thanh pill chuyển nhanh 5 khu vực ở đáy của `map/page.tsx:104` (`bottom-3`).
  - Thiếu layer quản lý (lối đi, bãi giữ xe, cổng bảo vệ, điểm check-in Open Day), thiếu nút chỉ đường Google Maps từ vị trí người dùng tới CVPM Quang Trung.

---

## 4. Kiểm Toán Quản Lý Media & Tài Nguyên 3D/360 (Section 12)

- **Nơi lưu trữ media hiện tại:**
  - **100% ảnh giao diện & 360°** đang phụ thuộc vào **23 URL ngoài `https://lh3.googleusercontent.com/aida-public/...`**.
  - Thư mục `apps/web/public/images/` chứa 6 ảnh (`campus-aerial-real.jpg`, `fpoly-campus-aerial.jpg` trùng hệt SHA256 `43FDDC50C978`, `fpt-concept-hero.jpg`, `fpt-gate-clean.jpg`, `fpt-mockup-reference.jpg`, `fpt-logo-official.png`) nhưng **chỉ có `fpt-logo-official.png` được dùng** (5 ảnh ~1.89MB còn lại bị bỏ không).
  - Thư mục `apps/web/public/models/` trống (`0` file).
  - Không lưu trong PostgreSQL, không lưu trong Object Storage S3/R2 thật dù `.env.example` có khung cấu hình Cloudflare R2.
- **Mức độ hoàn thiện các tiêu chí Section 12:** Upload, File/MIME validation, File size cap, S3/R2 Presigned URLs, Thumbnail generation, Image optimization pipeline, GLB/GLTF validation/Draco, Asset versioning, Draft/Published state, Permissions, Deletion/Archival → **Tất cả đều ở mức `S0 – NOT STARTED`**.
- **Rủi ro lớn:** Nếu Google thu hồi hoặc đổi quyền các link `lh3.googleusercontent.com/aida-public/...`, toàn bộ website lẫn WebGL 360° sẽ gãy trắng hình ảnh ngay lập tức.

---

## 5. Kiểm Toán Open Day & Gamification (Section 14)

- **Mức độ tách biệt:** Hiện tại Gamification **đang lẫn một phần vào trang Open Day** (`OpenDayMiniGame.tsx` nằm ngay giữa `/events/page.tsx`) và tách một phần sang `/games` (`CampusQuizStepper.tsx`, `QuizLeaderboard.tsx`). Về mã nguồn thì là 2 màn riêng ở Frontend nhưng **chưa có phân tách module nghiệp vụ & DB** ở Backend.
- **Open Day (`S3` UI / `S0` Nghiệp vụ):**
  - Đã có: Banner hero, 4 pillar, timeline 6 khung giờ, modal đăng ký vé 4 trường (`TicketRegistrationModal.tsx`).
  - Chưa có: Quản lý sự kiện động, đăng ký gắn tài khoản/kiểm tra sinh viên-phụ huynh cho hoạt động giới hạn, quét QR điểm danh, quản trị danh sách tham dự, thống kê chuyển đổi Open Day. Mọi lần submit modal đều ra chung 1 mã vé tĩnh `POLY-VIP-2025-9821`.
- **Gamification (`S3` UI / `S0` Anti-cheat):**
  - Đã có: Vòng quay HTML5 Canvas 340×340 + 3 câu mini-game (`/events`) và 5 câu quiz (`/games`).
  - Lỗ hổng tuyệt đối về **Anti-cheating**:
    1. Toàn bộ đáp án đúng nằm công khai ngay trong JS bundle gửi xuống trình duyệt (`QUIZ_QUESTIONS`, `OpenDayMiniGame.tsx`).
    2. Người chơi bấm `"Chơi lại"` để reset vô hạn số lượt quay thưởng và sinh mã `POLY2025-XXXX` ngẫu nhiên bằng `Math.random()`.
    3. Không có kiểm tra đăng nhập/giới hạn lượt hay lưu XP lên PostgreSQL.

---

## 6. Kiểm Toán Admin CMS & Quy Trình Upload Tài Sản 360/3D (Section 15)

- **Kiểm tra khả năng quản trị thực tế:** Admin hiện **KHÔNG THỂ quản trị bất kỳ thực thể nào** trong danh sách 20 loại dữ liệu (pages, sections, navigation, locations, buildings, floors, rooms, panorama scenes, hotspots, 3D models, media, news, events, users, roles, account imports, games, quizzes, analytics, system settings).
  - `/admin` chỉ là 1 dashboard tĩnh; **11/12 mục menu sidebar trả về lỗi 404**; nút `"Đồng Bộ Dữ Liệu"` là nút trang trí không có hàm xử lý.
- **Kiểm tra Pipeline tài sản Panorama 360° & 3D (6 bước bắt buộc):**

| Bước trong Workflow | Trạng thái | Ghi chú thực tế |
|---|---|---|
| **1. Upload** (Presigned URL S3/R2) | **S0** | Chưa có route `/admin/media`, `/admin/tours-360`, `/admin/models-3d` hay API presign. |
| **2. Validate** (MIME, kích thước, tỉ lệ 2:1, định dạng GLB hợp lệ) | **S0** | Không có validator server/client. |
| **3. Process** (tạo tile Marzipano / nén WebP / Draco compress / sinh thumbnail) | **S0** | Không có worker/queue xử lý media. |
| **4. Preview** (xem trước 360° đặt hotspot, xem trước `.glb` đặt tọa độ 3D) | **S0** | Chưa có trình biên tập Hotspot / 3D Placement Tool trong Admin. |
| **5. Configure** (gắn scene vào Building/Floor/Location, cấu hình yaw/pitch/FOV) | **S0** | Tất cả đang nhập tay trực tiếp vào code `.tsx`. |
| **6. Publish** (chuyển `DRAFT → PUBLISHED`, audit log, purge cache CDN) | **S0** | Chưa có luồng xuất bản tách biệt nháp/công khai. |
