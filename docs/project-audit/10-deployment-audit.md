# 10. KIỂM TOÁN TRIỂN KHAI & DEVOPS (DEPLOYMENT & DEVOPS AUDIT)

Đánh giá toàn bộ năng lực đóng gói, hạ tầng, biến môi trường, lưu trữ media và quy trình vận hành hybrid theo Mục 18.

---

## 1. Phân Loại Cấp Độ Hiện Tại

> **Kết luận (Section 18):** Ứng dụng hiện tại chỉ là một **`Local Prototype` (Bản dựng thử nghiệm cục bộ ở chế độ Dev)** — chưa đạt ngưỡng môi trường Development hoàn chỉnh (do gãy `next build`, chưa có `.env`, chưa có Backend, chưa bật được Docker DB tích hợp), chưa phải Staging và **hoàn toàn chưa sẵn sàng Production**.

---

## 2. Chi Tiết 14 Tiêu Chí DevOps & Hạ Tầng (Section 18)

| # | Tiêu chí | Trạng thái | Bằng chứng quan sát thực tế |
|---|---|---|---|
| 1 | **Docker** | **S0** | Không có `Dockerfile` cho `apps/web` hay `apps/api`; không có `.dockerignore`; Docker daemon trên máy kiểm toán hiện không chạy. |
| 2 | **Docker Compose** | **S1 (Chỉ có DB mẫu)** | Có 1 file `docker-compose.yml` ở root khai báo duy nhất service `postgres:16-alpine` (cổng `5432`, volume `postgres_data`, healthcheck `pg_isready`). Thiếu service `api`, `web`, `redis`, `minio` (cho S3 dev local). |
| 3 | **Environment Variables** | **S1** | Có file mẫu `.env.example` (36 dòng) khai báo biến Next.js, API, Postgres, JWT, Cloudflare R2/S3. Thực tế chưa tồn tại file `.env` / `.env.local`; ứng dụng chưa đọc biến môi trường nào (kể cả `NEXT_PUBLIC_API_URL`). |
| 4 | **Production Build** | **FAIL (`S0`)** | `npm --prefix apps/web run build` thất bại ngay lập tức tại `apps/web/src/app/globals.css:114-115` (`CssSyntaxError`). Không tồn tại build script cấp root cho monorepo (`pnpm-workspace.yaml` thậm chí chưa có `package.json` gốc!). |
| 5 | **Deployment Configuration** | **S0** | Chưa có cấu hình triển khai cloud (Vercel / Railway / Cloud Run / VPS Nginx / Kubernetes / PM2). |
| 6 | **Domain & HTTPS** | **S1 (Giả định mẫu)** | `.env.example:36` mới ghi tên miền giả định `https://media.virtualcampus.polytechnic.edu.vn`. Chưa có cấu hình SSL/TLS, reverse proxy hay domain thật. |
| 7 | **PostgreSQL Hosting** | **S0** | Mới có container local mẫu trong `docker-compose.yml`; chưa có chiến lược Managed PostgreSQL (Neon / Supabase / RDS / Cloud SQL) cho staging/production. |
| 8 | **Object Storage** | **S1 (Mới lên cấu hình mẫu)** | `.env.example:30-36` định nghĩa `STORAGE_TYPE=s3` + `R2` credentials giả (`your_access_key_id`), nhưng chưa có bucket thật và chưa tích hợp `@aws-sdk/client-s3`. Ảnh hiện vẫn nằm trên `lh3.googleusercontent.com`. |
| 9 | **CDN** | **S0** | Chưa cấu hình CDN (Cloudflare CDN / CloudFront) gắn với bucket Object Storage, cache-control headers (`immutable` cho asset versioned) hay CORS cho WebGL load texture/GLB từ domain khác! |
| 10 | **Backup** | **S0** | Không có cơ chế sao lưu tự động cho database và object storage, chưa có kịch bản khôi phục thảm họa (DR). |
| 11 | **Logging** | **S0** | Không có structured logger (`pino`/`winston`); `apps/web` chỉ rải `console.log`/`error`, thậm chí `layout.tsx:82-107` còn ghi đè `console.error` làm sai lệch log client. |
| 12 | **Monitoring & Healthcheck** | **S0** | Không có `/health` / `/ready` endpoint, không có Uptime monitor, Prometheus/Grafana hay cảnh báo tài nguyên. |
| 13 | **Error Tracking** | **S0** | Không tích hợp Sentry hay công cụ thu thập lỗi runtime phía trình duyệt & server. |
| 14 | **CI/CD** | **S0** | Không có thư mục `.github/workflows/`; chưa có Git repository hoạt động trong workspace; chưa có bước check tự động `tsc` + `lint` + `test` + `build` trước khi merge/deploy. |

---

## 3. Khoảng Trống Với Kiến Trúc Triển Khai Hybrid Đã Xác Nhận

Theo Mục 3 của đề bài, dự án sử dụng mô hình **Hybrid**:
- **Cloud-hosted Web + API + CDN + Object Storage.**
- **Quy trình phía Nhà trường (School-side workflow)** để sản xuất, kiểm duyệt ảnh Panorama 360° & mô hình `.glb/.gltf` rồi đẩy lên hệ thống.

**Những điểm bắt buộc phải thiết lập để mô hình Hybrid này chạy được:**
1. Khởi tạo `package.json` gốc cho `pnpm-workspace.yaml` + pipeline build/lint/test toàn monorepo (kèm khởi tạo Git).
2. Chuẩn bị **CORS Policy trên Object Storage (Cloudflare R2/S3)**: nếu không bật `Access-Control-Allow-Origin` đúng domain web cho GET `.jpg/.webp/.glb/.bin`, trình duyệt sẽ chặn Three.js/Marzipano nạp texture & mô hình 3D.
3. Thiết kế luồng duyệt nội bộ (**Draft → Review → Published**) trên Admin CMS để đội ngũ 3D của trường upload file `.glb`/360° thử nghiệm, xem trước trên môi trường preview kín mà không ảnh hưởng người dùng thật đang truy cập.
4. Tự động kiểm tra `next build`, `nest build`, `eslint`, `vitest/jest` trong GitHub Actions trước mỗi lần deploy lên Staging/Production.
