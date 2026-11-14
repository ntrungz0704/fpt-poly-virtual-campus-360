# 18 — MỤC LỤC BẰNG CHỨNG KIỂM CHỨNG (EVIDENCE INDEX)

Dưới đây là bảng tra cứu chính xác các tệp mã nguồn, dòng lệnh và vị trí logic phục vụ công tác đối soát nghiệm thu:

| Hạng mục kiểm toán | Tệp mã nguồn liên quan | Vị trí / Chi tiết kiểm chứng | Kết quả kiểm chứng |
|---|---|---|:---:|
| **Xác thực mật khẩu Argon2id** | `apps/api/src/modules/auth/auth.service.ts` | Dòng 50-80: `argon2.verify`, `argon2.hash` |  PASS |
| **Xoay vòng Refresh Token Cookie** | `apps/api/src/modules/auth/auth.service.ts` | Dòng 140-190: Xử lý reuse detection và revoke |  PASS |
| **Bảo vệ Endpoint Cổng Sinh Viên** | `apps/api/src/modules/portal/portal.controller.ts`| Dòng 40-48: `enforceStudentRole` |  PASS |
| **Chống IDOR Cổng Phụ Huynh** | `apps/api/src/modules/portal/portal.service.ts` | Dòng 480-530: Kiểm tra trạng thái `APPROVED` |  PASS |
| **Bộ Fixtures E2E Tài Khoản Thật** | `apps/web/e2e/portal-fixtures.ts` | Khởi tạo 5 tài khoản độc lập (Student A/B, Parent A/B/C) |  PASS |
| **Suite E2E Playwright M4** | `apps/web/e2e/portal-flow.spec.ts` | 6/6 kịch bản kiểm thử phân quyền sâu |  PASS |
| **Định Tuyến 29 Routes Turbopack** | `apps/web/src/app` | Biên dịch Turbopack tự động qua `pnpm run build` |  PASS |
| **Bộ 50 Ảnh Chụp Giao Diện Thực Tế**| `docs/project-redesign-audit/screenshots/` | 25 màn hình x 2 viewports (Desktop & Mobile) |  PASS |
