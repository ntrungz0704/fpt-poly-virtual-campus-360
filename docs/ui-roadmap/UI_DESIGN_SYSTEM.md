# UI_DESIGN_SYSTEM — Hệ Thống Thiết Kế Chuẩn Production

> **Mục đích:** Chuẩn hóa toàn bộ ngôn ngữ thị giác, tokens, quy tắc bố cục và thư viện component cho 3 ngữ cảnh giao diện (**Public / Immersive / Admin**) trên nền tảng `Tailwind CSS v4` (`apps/web/src/app/globals.css`) và `src/components/ui/*`.  
> **Nguyên tắc tinh giản (Anti-Template Rules):** Không dùng gradient rực trang trí, không lạm dụng kính mờ (`backdrop-blur`), không nhồi badge trạng thái quá 1–2 nhãn trên một thẻ, không dùng `.shadow-cta-glow` gây chói thị giác, và mọi thành phần tương tác phải tuân thủ chuẩn `WCAG 2.2 AA`.

---

## 1. Kiến Trúc Ngữ Cảnh Giao Diện (3 UI Contexts)

| Ngữ cảnh | Route áp dụng | Nền chủ đạo & Bầu không khí | Mục tiêu thiết kế cốt lõi |
|---|---|---|---|
| **1. Public & Participant Experience** | `/`, `/locations`, `/locations/[slug]`, `/events`, `/login`, `/portal` | **Light Editorial Architectural** (`#f9f9ff` nền tổng, `#ffffff` thẻ, `#041b3c` chữ chính, `#f36f21` chỉ dùng cho hành động trọng tâm) | Sạch, thoáng, dễ đọc, định hướng nhanh người xem từ trang giới thiệu sang trải nghiệm 360° hoặc luồng Open Day |
| **2A. Immersive Panorama (`/campus`)** | `/campus` | **Viewport-First Dark Stage** (`#041b3c` nền chờ WebGL, HUD tối bán trong suốt `rgba(4,27,60,0.78)`) | **≥ 90% diện tích màn hình** thuộc về ảnh Panorama 360°; HUD nhỏ gọn, có nút **Ẩn UI (Hide UI)** |
| **2B. Immersive GIS Map (`/map`)** | `/map` | **Light Cartographic Map** (Bản đồ nền sáng `#f3f2ee` / `#f9f9ff`, nút & popover trắng `#ffffff` viền mảnh) | Dễ đọc nhãn tòa nhà/lối đi ngoài trời giống bản đồ kiến trúc khuôn viên; tránh nền tối u ám của `CampusGISMap.tsx` cũ |
| **3. Operator Admin Console** | `/admin`, `/admin/*` | **Neutral Enterprise Tool** (`#f1f3ff` nền ngoài, `#ffffff` bảng & form, viền `#e0e8ff` sắc nét, không dùng glow/bo góc phồng) | Tối ưu cho người vận hành quản trị danh sách, bảng biểu, tải media, đặt hotspot và import Excel nhanh & ít mỏi mắt |

---

## 2. Hệ Thống Color Tokens (Kế thừa & Siết chặt từ `globals.css`)

Các CSS variables dưới đây giữ tương thích tên biến đã khai báo trong `@theme` của `apps/web/src/app/globals.css`, đồng thời siết lại **quy tắc sử dụng thực tế**:

| Nhóm Token | Giá trị Hex / RGBA | Tên CSS Variable (`@theme`) | Quy tắc sử dụng & Ngưỡng tương phản WCAG AA |
|---|---|---|---|
| **Brand Focal Action** | `#f36f21` | `--color-primary-container` | **CHỈ dùng cho Primary CTA (`Button variant="primary"`), pin đang chọn, đường viền active.** *Lưu ý tương phản:* Chữ trắng trên `#f36f21` đạt ~2.95:1 (chỉ dùng cho chữ bold `>= 14px` hoặc tiêu chuẩn large text/UI icon); đối với văn bản nhỏ & link chữ trên nền trắng bắt buộc dùng `--color-primary` (`#a04100`, tỷ lệ ~6.4:1 trên `#ffffff`). |
| **Accessible Orange Text** | `#a04100` | `--color-primary` | Chữ link, nhãn active trên nền `#ffdbcc` (`--color-primary-fixed`), hover của nút Primary (`#a04100` đạt AA ≥ 4.5:1 với chữ trắng). |
| **Primary Soft Fill** | `#ffdbcc` | `--color-primary-fixed` | Nền active item trong sidebar/header, đi kèm chữ `--color-on-primary-fixed-variant` (`#7a3000`). |
| **Brand Ink (Primary Text)** | `#041b3c` | `--color-on-surface` | Tiêu đề, nội dung quan trọng, nền chân trang công khai (tỷ lệ > 14:1 trên nền trắng). |
| **Secondary Neutral Ink** | `#49607c` | `--color-secondary` | Mô tả phụ, label cột bảng, caption (`~6.2:1` trên `#ffffff` — không hạ opacity thấp hơn `100%` cho văn bản phụ nhỏ). |
| **Canvas & Card Surfaces** | `#f9f9ff` / `#ffffff` | `--color-surface` / `--color-surface-container-lowest` | `--color-surface` làm nền trang; `--color-surface-container-lowest` làm nền card, modal, bảng Admin. |
| **Subtle Structural Surfaces** | `#f1f3ff` / `#e8edff` | `--color-surface-container-low` / `--color-surface-container` | `--color-surface-container` dùng làm đường phân cách `1px solid`; `--color-surface-container-low` dùng cho hàng xen kẽ bảng / nền input phụ. |
| **Informational Accent** | `#005db7` | `--color-tertiary` | Điểm thông tin trên 360° (`info` hotspot), icon định vị vị trí GIS. |
| **Semantic Feedback** | Success `#10b981` (`#e6f8f3` / `#065f46`), Warning `#f59e0b` (`#fef3c7` / `#92400e`), Error `#ba1a1a` (`#ffdad6` / `#93000a`), Info `#0084ff` (`#e1f0ff` / `#003d7a`) | `--color-success*`, `--color-warning*`, `--color-error*`, `--color-info*` | Cặp container + on-container luôn đảm bảo độ tương phản ≥ 4.5:1 cho chữ nhỏ `12px–13px`. |
| **HUD Backdrop (360° Only)** | `rgba(4, 27, 60, 0.78)` | `.glass-hud-dark` *(cập nhật độ mờ nhẹ hơn)* | Chỉ áp dụng cho lớp điều khiển nổi trên WebGL canvas `/campus` (không dùng làm nền card bài viết hay modal thông thường). |

> **Thay đổi bắt buộc đối với `globals.css`:**  
> 1. Loại bỏ hoặc vô hiệu hóa `--shadow-cta-glow` trên nút tiêu chuẩn để nút cam gọn gàng, phẳng hiện đại (`shadow-elevation-1` khi hover).  
> 2. Cấm hardcode màu Tailwind rời rạc (`bg-slate-900`, `text-slate-500`, `bg-orange-100`) trong các component tái thiết kế mới; thay 100% bằng token `@theme` trong `globals.css`.

---

## 3. Hệ Thống Typography (`Plus Jakarta Sans` + `Inter`)

Đã cấu hình Google Font qua `next/font/google` tại `apps/web/src/app/layout.tsx`:
- **Display / Headings / Labels / Buttons:** `Plus Jakarta Sans` (`--font-display`)
- **Body / Table Cells / Form Inputs:** `Inter` (`--font-sans`)
- **Số liệu căn cột (Tabular Numbers):** Bắt buộc gắn utility `tabular-nums` cho đồng hồ đếm, giờ lịch trình Open Day (`08:30 – 09:45`), mã phòng, cột số lượng ở Admin Table.

| Token Class | Font & Weight | Desktop (`>= 768px`) | Mobile (`< 768px`) | Ứng dụng cụ thể |
|---|---|---:|---:|---|
| `.type-display` | Plus Jakarta Sans · `800` | `44px / 52px` (`-0.02em`) | `30px / 38px` | Hero Trang chủ (`/`) |
| `.type-h1` | Plus Jakarta Sans · `700` | `32px / 40px` (`-0.015em`) | `24px / 32px` | Tiêu đề trang (`/locations`, `/events`, `/portal`) |
| `.type-h2` | Plus Jakarta Sans · `700` | `22px / 30px` | `20px / 28px` | Tiêu đề section & Trang `/admin` |
| `.type-h3` | Plus Jakarta Sans · `600` | `18px / 26px` | `16px / 24px` | Tên card địa điểm, Drawer title, Modal title |
| `.type-body-lg` | Inter · `400` | `17px / 27px` | `15px / 24px` | Đoạn dẫn dưới H1 Hero |
| `.type-body` | Inter · `400` | `15px / 24px` | `14px / 22px` | Văn bản nội dung chính, câu hỏi FAQ |
| `.type-body-sm` | Inter · `400` | `13px / 20px` | `13px / 19px` | Mô tả thẻ rút gọn, thông tin phụ bảng Admin |
| `.type-label` | Plus Jakarta Sans · `600` | `13px / 18px` | `13px / 18px` | Nhãn nút bấm, tab, form label |
| `.type-caption` | Plus Jakarta Sans · `700` | `11px / 14px` (`+0.03em`) | `11px / 14px` | Kicker section, badge (giới hạn viết hoa ngắn) |

*(Vẫn giữ tương thích các class `.font-headline-*`, `.text-headline-*` hiện có trong `globals.css` để không làm gãy trang chưa refactor ở từng pha).*

---

## 4. Layout Grid, Breakpoints & Khoảng Cách (Spacing & Responsive System)

### 4.1. Chuẩn Breakpoints & Container
- **Target Viewports kiểm thử bắt buộc:** `360px` (compact Android), `390px` (standard iPhone), `768px` (Tablet), `1024px` (Small Desktop / Sidebar Rail threshold), `1280px` & `1440px` (Desktop chuẩn).
- **Container Public:** `.ui-container` (`max-width: 80rem / 1280px`, `padding-inline: 16px` mobile / `24px` desktop).
- **Container Reading / Detail:** `max-width: 68rem` (`1088px`) cho `/locations/[slug]` và `/events` để tránh dòng chữ quá dài (`max-width: 65ch` cho đoạn văn).
- **Admin Workspace Container:** Full width trừ sidebar (`248px` mở rộng / `72px` thu gọn tại `>= 1024px`), vùng nội dung padding `16px` mobile / `24px` desktop, `max-width: 1440px`.

### 4.2. Thang Spacing, Radius & Elevation (Tightened)

| Nhóm | Token / Giá trị chuẩn | Quy định áp dụng bắt buộc |
|---|---|---|
| **Spacing Rhythm** | `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px` | Khoảng cách giữa các section Public: `48px` mobile / `64px` desktop (thay vì dàn trải quá thưa). Khoảng cách bên trong Card chuẩn: `16px` (sm) hoặc `20px` (md). |
| **Border Radius** | Controls `8px` (`--radius-control`), Cards `12px–16px` (`--radius-card`), Modals/Drawers `16px–20px` (`--radius-panel`), Pills `9999px` | **Không dùng `rounded-3xl` (24px) cho mọi thẻ danh sách** gây cảm giác nặng và tốn diện tích bo góc trên mobile; hạ xuống `12px`–`16px` sắc nét hơn. |
| **Elevation Hierarchy** | Level 0 (`border: 1px solid #e8edff`, no shadow) · Level 1 (`--shadow-elevation-1` cho card hover / floating map controls) · Level 2 (`--shadow-elevation-2` cho dropdown/popover) · Level 3 (`--shadow-elevation-3` cho modal/slide-over drawer) | Thẻ tĩnh mặc định **Level 0** (chỉ dùng viền 1px mảnh, **không đổ bóng nền tĩnh**); tiết chế bóng đổ để giao diện sạch như chuẩn biên tập & enterprise. |

---

## 5. Quy Định Component Chuẩn & Tiết Chế Giao Diện

### 5.1. Iconography Thống Nhất
- Sử dụng **duy nhất Material Symbols Outlined** đã load tại `layout.tsx`.
- **Loại bỏ sự nhập nhằng thư viện icon:** `lucide-react` trong `package.json` hiện có `0` lượt sử dụng — sẽ gỡ bỏ trong phase dọn dependencies, không import thêm thư viện icon thứ hai.

### 5.2. Quy Tắc Thiết Kế Thẻ (Card Content Budget)
Mỗi thẻ trong lưới (`/locations`, `/`, `/events`) tuân thủ ngân sách tối đa **4 đơn vị thông tin**:
1. Hình ảnh sạch (`aspect-video`, `object-cover`) + **tối đa 1 badge góc ảnh** nếu thực sự cần phân biệt (VD: `Tòa T` hoặc `Tour 360°`).
2. Tiêu đề chính (tối đa 2 dòng, `line-clamp-2`).
3. Mô tả/Ngữ cảnh ngắn (1–2 dòng, `line-clamp-2` — **cấm** nhồi danh sách chip thông số phần cứng, diện tích, và chấm xanh nhấp nháy).
4. **1 CTA chính rõ ràng** (+ tối đa 1 liên kết phụ dạng text link).

### 5.3. Shared Component Kit (Mở rộng từ `src/components/ui/`)

| Component | API / Variants chuẩn | Cập nhật cần làm so với bản UI-01 hiện tại |
|---|---|---|
| `Button` | `primary`, `secondary`, `outline`, `ghost`, `danger`; Sizes `sm (36px)`, `md (44px)`, `lg (48px)` | Gỡ `shadow-cta-glow` khỏi `primary`; bổ sung hỗ trợ `asChild` / `LinkButton` để mọi CTA liên kết trang dùng chung 1 component thay vì tự viết class Tailwind. |
| `Badge` | `neutral`, `primary`, `success`, `warning`, `error`, `info` | Giảm padding dọc, bỏ viền dày; **nghiêm cấm dấu chấm `animate-pulse`** trên danh mục tĩnh. |
| `Card` | `flat` (border 1px, mặc định), `interactive` (hover border `#f36f21` + elevation-1), `elevated` (chỉ dùng cho overlay popover) | Đổi bo góc chuẩn từ `1rem (16px)` giữ thống nhất thay cho `rounded-3xl`. |
| `FormField` (`Input`, `Select`, `Textarea`, `SearchInput`, `FileDropzone`) | Chuẩn `min-h-[44px]`, nhãn rõ, error message `text-error` + `aria-describedby` | Bổ sung `SearchInput` (có nút clear `x` 44px) dùng cho `/locations`, `/map`, `/admin/*` và `FileDropzone` cho `/admin/media` & `/admin/users`. |
| `DataTable` *(Mới cho Admin P0)* | Toolbar (search + filter + primary action), Sticky header, Empty/Loading rows, Row actions menu/buttons, Mobile responsive card-row fallback | Component cốt lõi để 6 màn hình `/admin` vận hành đồng nhất không lặp code bảng. |
| `Modal` & `Drawer` | Esc to close, backdrop click, body scroll lock, **Focus Trap** | `Drawer`: Trên desktop trượt bên phải (`max-w-[380px]`); trên mobile `< 768px` tự chuyển thành Bottom Sheet (`max-h-[45vh]` hoặc kéo mở rộng `75vh`) để **không che kín bản đồ/360°**. |
| `StateFeedback` (`LoadingState`, `EmptyState`, `ErrorState`, `NotFoundState`, `AuthGateState`) | Dùng đồng nhất cho rỗng tìm kiếm, lỗi tải ảnh WebGL, slug không tồn tại, phiên chưa đăng nhập | Bổ sung `NotFoundState` (dùng cho `[slug]`) và `AuthGateState` (dùng cho `/portal` & `/admin` trước khi có backend middleware). |
| `StatusToast` *(Thay thế `window.alert()`)* | Non-blocking toast thông báo góc trên/dưới (`success`, `error`, `info`) | Xóa sạch 100% lệnh `alert()` khỏi `/portal` (`DigitalPassCard`) và `/news/[slug]`. |

---

## 6. Chuẩn Tương Tác Trạng Thái & Accessibility (WCAG 2.2 AA)

1. **Mọi điểm chạm (Touch Targets):** Tối thiểu `44×44px` đối với toàn bộ nút điều hướng header, nút zoom/hide UI trên `/campus`, pin/nút lọc trên `/map` mobile, và hàng nút thao tác Admin.
2. **Focus & Keyboard Navigation:**
   - Giữ `:focus-visible` `outline: 2px solid #f36f21; outline-offset: 2px` cho mọi phần tử tương tác.
   - Modal & Drawer phải trả focus về phần tử kích hoạt khi đóng (`Escape`).
   - Toàn bộ thẻ có thể bấm phải là `<Link>` hoặc `<button>`, **không gắn `onClick` trên `<div>`**.
3. **Chế độ Tôn trọng Chuyển động Giảm (`prefers-reduced-motion`):** Tắt auto-rotate mặc định của Panorama 360° và giảm hiệu ứng hover/transition khi hệ điều hành bật Reduce Motion.
4. **Hệ thống Trạng thái Bắt buộc cho mọi màn hình tương tác:** Loading (Skeleton/Spinner có `role="status"`), Empty (icon + mô tả nguyên nhân + nút reset), Error (thông báo trung thực + nút thử lại), Unauthenticated/Unauthorized (chỉ dẫn đăng nhập rõ ràng), và Destructive Confirm (hộp thoại xác nhận rõ tác động trước khi xóa/khóa).
