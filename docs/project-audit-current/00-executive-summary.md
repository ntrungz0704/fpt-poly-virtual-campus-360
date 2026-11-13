# BÁO CÁO TỔNG QUAN KIỂM TOÁN DỰ ÁN (00-EXECUTIVE-SUMMARY)
## FPT Polytechnic Virtual Campus 360° (CVPM Quang Trung, QTSC Quận 12)

- **Ngày thực hiện kiểm toán:** 13/11/2026
- **Kiểm toán viên (Vai trò):** Principal Software Architect, Senior Full-Stack Engineer, QA Lead, Database Engineer & Application Security Auditor
- **Repository:** `ntrungz0704/fpt-poly-virtual-campus-360`
- **Branch:** `main` | **HEAD Commit:** `b894982` (sau hotfix ghim sidebar và nút lưu tour)
- **Monorepo Workspaces:**
  - `packages/shared`: Data transfer objects, enums, error contracts
  - `apps/api`: NestJS 11 Modular Monolith, Prisma ORM 5.22, PostgreSQL 16
  - `apps/web`: Next.js 16.4.6 (Turbopack, App Router), Tailwind CSS v4, Three.js WebGL

---

## 1. Mục Đích & Phạm Vi Kiểm Toán
Đợt kiểm toán toàn diện này được thực hiện theo chỉ đạo trực tiếp của Project Owner và GPT Mentor nhằm:
1. Đánh giá sự thật tuyệt đối của toàn bộ codebase, cấu hình, cơ sở dữ liệu, API, giao diện và luồng nghiệp vụ.
2. Không dựa vào các báo cáo cũ hoặc tuyên bố trong quá khứ mà đối chiếu từng dòng mã nguồn, schema migration, câu truy vấn database và kết quả thực thi tự động (Unit, Integration, E2E, DB Integrity).
3. Xác định chính xác các tính năng đã thực sự chạy thực tế trên PostgreSQL và NestJS so với các phần còn giả lập (mock data), các điểm nghẽn bảo mật (Security P0/P1/P2), các lỗ hổng kỹ thuật (Technical Debt) và các điều kiện bắt buộc để đạt MVP / Production.
4. Chuẩn bị tài liệu bàn giao kỹ thuật chuẩn mực để bất kỳ Tech Lead nào tiếp quản đều có thể nắm bắt 100% hiện trạng mà không cần phải thực hiện kiểm toán lại từ đầu.

---

## 2. Tóm Tắt Hiện Trạng Kỹ Thuật Toàn Hệ Thống

| Hạng mục | Trạng thái kỹ thuật thực tế | Bằng chứng kiểm chứng |
|---|---|---|
| **Cơ sở dữ liệu (PostgreSQL 16)** | **S5 — VERIFIED** | 32 models Prisma, 4 migrations đã deploy thành công, 14/14 DB integrity tests PASS (`prisma/verify-db-integrity.ts`). Duy nhất 1 tài khoản Super Admin hoạt động (`admin@poly.edu.vn`). |
| **Backend API (NestJS 11)** | **S4 — INTEGRATED** | 9 Controllers, 8 Modules nghiệp vụ hoạt động tại `/api/v1`. 62/64 integration/unit tests PASS. RBAC, JWT access + HttpOnly refresh token cookie, Rate limit `@Throttle` hoạt động. |
| **Frontend Web (Next.js 16)** | **S4 — INTEGRATED** | 29 Routes biên dịch thành công (SSG/Static/Dynamic). Chạy mượt mà trên desktop/mobile. Linter ESLint 0 errors, 0 warnings; TypeScript 0 errors. |
| **Bảo mật & Phân quyền (Security)** | **S4 — INTEGRATED** | Argon2id password hash, Token rotation + Family revocation, Brute-force lockout sau 5 lần thử sai, CSRF double-cookie/header, Cookie Secure flags. |
| **Testing & CI/CD** | **S5 — VERIFIED** | E2E Playwright: 6/6 tests Portal flow PASS, 5/5 tests Open Day flow PASS. Unit tests: 10/10 PASS. Production build: 29/29 routes PASS. |
| **Mức độ sẵn sàng MVP** | **82% Sẵn sàng** | Luồng Tour 360, Bản đồ GIS, Đăng ký Open Day, Vé QR SVG, Điểm danh check-in, Gamification XP/Spin, Cổng Sinh viên/Phụ huynh đã chạy thật. Còn thiếu: News/Contact kết nối DB và hoàn tất remediation M4. |
| **Mức độ sẵn sàng Production** | **65% Sẵn sàng** | Cần xử lý 6 blocker remediation M4 từ GPT Mentor, chuyển dữ liệu bản tin/liên hệ sang DB (M5), cấu hình Cloud Object Storage (S3/R2) thay vì chỉ lưu local/draft. |

---

## 3. Các Kết Luận Quan Trọng Nhất (Key Findings)

### 3.1. Các thành tựu kỹ thuật đã xác minh (Verified Real Implementations)
1. **Kiến trúc Monorepo chuẩn mực:** Shared package `@fpt-campus/shared` phân tách rõ ràng hợp đồng dữ liệu giữa Backend và Frontend, tránh trùng lặp model.
2. **Cơ chế xác thực & bảo mật cấp ngân hàng:** 
   - Mã hóa mật khẩu chuẩn Argon2id (`$argon2id$v=19$m=65536,t=3,p=1...`).
   - Access token lưu bộ nhớ RAM (không bao giờ lưu vào `localStorage` hay `sessionStorage`).
   - Refresh token dạng opaque 256-bit lưu HttpOnly cookie với cơ chế Family ID tự động thu hồi toàn bộ phiên nếu phát hiện tấn công tái sử dụng (token reuse).
   - Tự động khóa tài khoản 15 phút nếu nhập sai mật khẩu quá 5 lần (`failedLoginAttempts >= 5`).
3. **Vé Open Day & Check-in QR không phụ thuộc thư viện nặng:**
   - Mã vé định dạng chuẩn `OD26-XXXX-XXXX`.
   - Sinh QR Code trực tiếp qua component toán học thuần TypeScript `QRCodeSVG.tsx` (zero NPM dependencies).
   - Chặn đăng ký trùng email (`409 Conflict`), chặn check-in lặp lại và ghi nhật ký kiểm toán `AuditLog` cho từng lượt quét mã.
4. **Hệ thống Gamification tác tử Authoritative trên Backend:**
   - Điểm số Quiz được chấm và xác thực phía server, chống gian lận client.
   - Vòng quay may mắn tính toán tỷ lệ trúng thưởng ngẫu nhiên an toàn trên backend, kiểm soát kho quà tồn và ghi nhận giao dịch XP vào sổ cái `XpLedger`.
5. **Cổng Sinh viên & Phụ huynh (M4) đã kết nối Database thật:**
   - Cung cấp đầy đủ các trang `/portal`, `/portal/profile`, `/portal/tickets`, `/portal/schedule`, `/portal/progress`, và `/parent`.
   - Bảng liên kết `parent_student_links` hỗ trợ luồng gửi yêu cầu và phê duyệt bảo mật.

### 3.2. Các hạn chế kỹ thuật & Blocker cần khắc phục (Technical Gaps & Blockers)
1. **Backend Role Enforcement trên Portal (Blocker B1):**
   - Hiện tại các API `/api/v1/portal/*` và `/api/v1/parent/*` mới kiểm tra quyền đăng nhập cơ bản và `canAccessAdmin` nhưng chưa chặn chặt chẽ theo `userType === "STUDENT"` hoặc `userType === "PARENT"`.
2. **Tính toán tổng XP Gamification trong Portal (Blocker B2):**
   - API `getGamification` trong `portal.service.ts` đang lấy 10 bản ghi gần nhất và tính tổng trên 10 bản ghi này thay vì dùng `prisma.xpLedger.aggregate({ _sum: { amountXp: true } })` trên toàn bộ lịch sử người dùng.
3. **Rủi ro ghép dữ liệu mập mờ (Blocker B5):**
   - `getTickets` và `getSchedule` còn điều kiện nối qua `attendeeEmail` hoặc `attendeeName`, cần chuẩn hóa chỉ nối qua `userId` và mã vé đã xác minh ownership để tránh xung đột dữ liệu.
4. **Lưu cấu hình Tour 360° (Blocker B6):**
   - Nút lưu hiện tại mới ghi bản nháp vào `localStorage` (`vc_admin_tour_scenes`), chưa có API RESTful tương ứng đẩy trực tiếp vào bảng `tour_nodes` và `hotspots` của PostgreSQL.
5. **Dữ liệu Tin tức (/news) và Liên hệ (/contact) còn tĩnh:**
   - Trang `/news` đang đọc mảng tĩnh `CAMPUS_GUIDE_ARTICLES`.
   - Trang `/contact` mới chỉ hiển thị thông tin và link ra ngoài, chưa có form lưu message vào DB (Đây là phạm vi cốt lõi của Milestone M5).
6. **Mật khẩu fallback trong file test (Blocker B4):**
   - File `apps/web/e2e/portal-flow.spec.ts` còn chuỗi fallback mật khẩu mặc định `process.env.ADMIN_BOOTSTRAP_PASSWORD || "Admin@123456"`. Cần xóa bỏ fallback này để tuân thủ tuyệt đối an toàn thông tin.

---

## 4. Định Hướng Hành Động Tiếp Theo
1. **Ưu tiên 1 (Ngay lập tức):** Thực hiện triệt để đợt Remediation M4 (các mục B1 đến B6) theo chỉ đạo của GPT Mentor để đóng gói hoàn tất nghiệm thu M4.
2. **Ưu tiên 2:** Triển khai Milestone M5 (News & Contact CMS): Tạo schema PostgreSQL, migration, Backend API CRUD và tích hợp form thật vào giao diện `/news` và `/contact`.
3. **Ưu tiên 3:** Đồng bộ tài liệu `PROJECT_STATUS.md` sang trạng thái hiện tại (`main` @ commit mới nhất).
