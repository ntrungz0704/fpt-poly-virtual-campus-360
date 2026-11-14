import { COMMON_CSS } from './mockup-templates-common.mjs';

export function getAuth002Html(isMobile = false) {
  return `
    <!DOCTYPE html><html><head><meta charset="utf-8"><style>${COMMON_CSS}</style></head>
    <body style="background: radial-gradient(circle at center, #1E293B 0%, #0F172A 100%); min-height:100vh; display:flex; align-items:center; justify-content:center; padding:16px;">
      <div class="card" style="width:100%; max-width:${isMobile ? '350px' : '440px'}; padding:${isMobile ? '24px 20px' : '36px 32px'}; box-shadow: 0 20px 40px rgba(0,0,0,0.4); border:1px solid #334155; background:white;">
        <div style="text-align:center; margin-bottom:24px;">
          <div style="width:48px; height:48px; background:#F26F21; border-radius:10px; display:inline-flex; align-items:center; justify-content:center; color:white; font-size:24px; font-weight:800; margin-bottom:12px;">P</div>
          <h2 style="font-size:20px; font-weight:700; color:#0F172A;">Đổi mật khẩu khởi tạo</h2>
          <p style="font-size:13px; color:#64748B; margin-top:6px;">Vì lý do an toàn, bạn cần cập nhật mật khẩu mới trong lần đầu tiên đăng nhập hệ thống.</p>
        </div>

        <div style="margin-bottom:16px;">
          <label style="font-size:12px; font-weight:600; color:#334155; display:block; margin-bottom:6px;">Mật khẩu hiện tại</label>
          <input type="password" value="••••••••••••" style="width:100%; padding:10px 14px; border:1px solid #CBD5E1; border-radius:8px; font-size:14px;">
        </div>

        <div style="margin-bottom:16px;">
          <label style="font-size:12px; font-weight:600; color:#334155; display:block; margin-bottom:6px;">Mật khẩu mới</label>
          <input type="password" value="PolyCampus@2026" style="width:100%; padding:10px 14px; border:1px solid #CBD5E1; border-radius:8px; font-size:14px;">
          <div style="margin-top:8px;">
            <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px;">
              <span style="color:#64748B;">Độ mạnh mật khẩu:</span>
              <span style="font-weight:700; color:#16A34A;">Rất mạnh (100%)</span>
            </div>
            <div style="height:4px; background:#E2E8F0; border-radius:2px; overflow:hidden;">
              <div style="width:100%; height:100%; background:#16A34A;"></div>
            </div>
          </div>
        </div>

        <div style="margin-bottom:20px;">
          <label style="font-size:12px; font-weight:600; color:#334155; display:block; margin-bottom:6px;">Xác nhận mật khẩu mới</label>
          <input type="password" value="PolyCampus@2026" style="width:100%; padding:10px 14px; border:1px solid #CBD5E1; border-radius:8px; font-size:14px;">
        </div>

        <div style="background:#F8FAFC; border-radius:8px; padding:12px; margin-bottom:20px; font-size:11px; color:#475569; border:1px solid #E2E8F0;">
          <div style="color:#16A34A; margin-bottom:4px;">✓ Tối thiểu 8 ký tự</div>
          <div style="color:#16A34A; margin-bottom:4px;">✓ Có cả chữ hoa và chữ thường</div>
          <div style="color:#16A34A; margin-bottom:4px;">✓ Có ít nhất 1 chữ số và 1 ký tự đặc biệt (@, #, $)</div>
        </div>

        <button class="btn btn-primary" style="width:100%; padding:12px;">Xác nhận & Vào hệ thống</button>
      </div>
    </body></html>
  `;
}

export function getPrnt001Html(isMobile = false) {
  return `
    <!DOCTYPE html><html><head><meta charset="utf-8"><style>${COMMON_CSS}</style></head>
    <body style="background:#F8FAFC; padding:${isMobile ? '16px' : '28px 48px'};">
      <div style="max-width:1100px; margin:0 auto;">
        <!-- Top Bar -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; background:white; padding:16px 24px; border-radius:12px; border:1px solid #E2E8F0;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:36px; height:36px; background:#6B21A8; border-radius:8px; display:flex; align-items:center; justify-content:center; color:white; font-weight:700;">👨‍👩‍👧</div>
            <div>
              <div style="font-weight:700; font-size:16px; color:#0F172A;">Cổng Thông tin Phụ huynh FPT Polytechnic</div>
              <div style="font-size:12px; color:#64748B;">Phụ huynh: Bác Nguyễn Văn Hùng</div>
            </div>
          </div>
          <span class="badge badge-purple">Tài khoản Phụ huynh</span>
        </div>

        <!-- Student Linked Banner -->
        <div style="background:linear-gradient(135deg, #1E293B, #0F172A); color:white; border-radius:14px; padding:24px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
          <div>
            <div style="font-size:12px; color:#F26F21; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Sinh viên được bảo hộ</div>
            <div style="font-size:22px; font-weight:800; margin:4px 0;">Nguyễn Văn A — MSSV: PS24110</div>
            <div style="font-size:13px; color:#CBD5E1;">Chuyên ngành: Phát triển Phần mềm (Web/AI) • Niên khóa 2024-2027 • QTSC Q.12</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px; color:#94A3B8;">Trạng thái tại Open Day:</div>
            <span class="badge badge-green" style="font-size:13px; padding:6px 14px; margin-top:4px;">✓ ĐÃ CHECK-IN TẠI TRƯỜNG</span>
          </div>
        </div>

        <!-- Grid Cards -->
        <div style="display:grid; grid-template-columns:${isMobile ? '1fr' : '2fr 1fr'}; gap:20px;">
          <div class="card" style="padding:24px;">
            <h3 style="font-size:16px; font-weight:700; margin-bottom:16px;">Lịch trình hoạt động thực tế của con hôm nay</h3>
            <div style="display:flex; flex-direction:column; gap:14px;">
              <div style="display:flex; gap:12px; align-items:flex-start;">
                <div style="width:28px; height:28px; border-radius:50%; background:#DCFCE7; color:#166534; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700;">1</div>
                <div>
                  <div style="font-weight:600; font-size:13px;">08:30 — Check-in & Nhận tài liệu tại Hội trường T</div>
                  <div style="font-size:12px; color:#64748B;">Đã hoàn thành xác thực mã vé QR #OD-8942</div>
                </div>
              </div>
              <div style="display:flex; gap:12px; align-items:flex-start;">
                <div style="width:28px; height:28px; border-radius:50%; background:#DBEAFE; color:#1E40AF; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700;">2</div>
                <div>
                  <div style="font-weight:600; font-size:13px;">09:15 - 11:30 — Trải nghiệm Thực hành tại Lab 302 AI</div>
                  <div style="font-size:12px; color:#64748B;">Tương tác với robot và lập trình ứng dụng ảo</div>
                </div>
              </div>
              <div style="display:flex; gap:12px; align-items:flex-start;">
                <div style="width:28px; height:28px; border-radius:50%; background:#FFEDD5; color:#C2410C; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700;">3</div>
                <div>
                  <div style="font-weight:600; font-size:13px;">14:00 - 15:30 — Tọa đàm Học bổng & Việc làm Doanh nghiệp</div>
                  <div style="font-size:12px; color:#64748B;">Hội trường Innovation Hall — Dự kiến tham gia</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card" style="padding:24px;">
            <h3 style="font-size:16px; font-weight:700; margin-bottom:14px;">Hỗ trợ & Tư vấn</h3>
            <div style="font-size:13px; color:#475569; margin-bottom:16px;">Phụ huynh cần giải đáp về chính sách học bổng, ký túc xá hoặc cơ sở vật chất?</div>
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:12px; margin-bottom:16px;">
              <div style="font-size:11px; color:#64748B;">Hotline Cố vấn Tuyển sinh:</div>
              <div style="font-size:16px; font-weight:700; color:#F26F21;">028.7300.1955</div>
            </div>
            <button class="btn btn-outline" style="width:100%;">Gửi câu hỏi trực tuyến</button>
          </div>
        </div>
      </div>
    </body></html>
  `;
}

function getStudentNav(active) {
  const tabs = [
    { id: 'overview', name: 'Tổng quan Portal', icon: '🏠' },
    { id: 'profile', name: 'Hồ sơ Sinh viên', icon: '👤' },
    { id: 'progress', name: 'Điểm thưởng XP & Cấp bậc', icon: '⭐' },
    { id: 'schedule', name: 'Lịch sự kiện Open Day', icon: '📅' },
    { id: 'tickets', name: 'Vé điện tử & QR Pass', icon: '🎟️' },
  ];
  return `
    <div style="display:flex; gap:8px; margin-bottom:20px; overflow-x:auto; padding-bottom:4px;">
      ${tabs.map(t => `
        <a href="#" style="text-decoration:none; display:flex; align-items:center; gap:6px; padding:8px 16px; border-radius:8px; font-size:13px; font-weight:600; white-space:nowrap; ${t.id === active ? 'background:#F26F21; color:white;' : 'background:white; color:#64748B; border:1px solid #E2E8F0;'}">
          <span>${t.icon}</span>
          <span>${t.name}</span>
        </a>
      `).join('')}
    </div>
  `;
}

export function getStud001Html(isMobile = false) {
  return `
    <!DOCTYPE html><html><head><meta charset="utf-8"><style>${COMMON_CSS}</style></head>
    <body style="background:#F8FAFC; padding:${isMobile ? '16px' : '28px 48px'};">
      <div style="max-width:1100px; margin:0 auto;">
        ${getStudentNav('overview')}
        
        <!-- Welcome Hero -->
        <div style="background:linear-gradient(135deg, #0F172A, #1E293B); border-radius:14px; padding:24px; color:white; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
          <div>
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
              <span class="badge badge-orange">Poly Explorer Level 4</span>
              <span style="font-size:12px; color:#94A3B8;">MSSV: PS24110</span>
            </div>
            <h1 style="font-size:24px; font-weight:800;">Chào mừng trở lại, Nguyễn Văn A! 👋</h1>
            <p style="font-size:13px; color:#CBD5E1; margin-top:4px;">Bạn đã hoàn thành 6/8 trạm thử thách tại Virtual Campus hôm nay.</p>
          </div>
          <div style="text-align:right;">
            <div style="font-size:28px; font-weight:800; color:#F26F21;">420 XP</div>
            <div style="font-size:11px; color:#94A3B8;">Cần thêm 80 XP để đạt Cấp 5</div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:${isMobile ? '1fr 1fr' : 'repeat(4, 1fr)'}; gap:14px; margin-bottom:20px;">
          <div class="stat-card">
            <div style="font-size:12px; color:#64748B;">Điểm thưởng XP</div>
            <div class="stat-value">420</div>
            <div style="font-size:11px; color:#16A34A; font-weight:600;">Hạng 14 toàn khóa</div>
          </div>
          <div class="stat-card">
            <div style="font-size:12px; color:#64748B;">Vé Open Day</div>
            <div class="stat-value" style="font-size:18px; color:#16A34A;">HỢP LỆ</div>
            <div style="font-size:11px; color:#64748B;">Ghế VIP-08 Hall T</div>
          </div>
          <div class="stat-card">
            <div style="font-size:12px; color:#64748B;">Nhiệm vụ 360°</div>
            <div class="stat-value">6 / 8</div>
            <div style="font-size:11px; color:#2563EB; font-weight:600;">Còn 2 trạm Lab</div>
          </div>
          <div class="stat-card">
            <div style="font-size:12px; color:#64748B;">Chuỗi tham gia</div>
            <div class="stat-value">5 Ngày</div>
            <div style="font-size:11px; color:#F26F21; font-weight:600;">🔥 Tăng 20% XP</div>
          </div>
        </div>

        <div class="card" style="padding:20px;">
          <h3 style="font-size:15px; font-weight:700; margin-bottom:12px;">Sự kiện sắp diễn ra</h3>
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:14px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <span class="badge badge-orange">14:00 Chiều nay</span>
              <div style="font-weight:700; font-size:14px; margin-top:4px;">Hội thảo: Ứng dụng Generative AI trong Phát triển Phần mềm</div>
              <div style="font-size:12px; color:#64748B;">Hội trường Tòa Nhà T — Diễn giả từ FPT Software</div>
            </div>
            <button class="btn btn-outline btn-sm">Xem vé QR</button>
          </div>
        </div>
      </div>
    </body></html>
  `;
}

export function getStud002Html(isMobile = false) {
  return `
    <!DOCTYPE html><html><head><meta charset="utf-8"><style>${COMMON_CSS}</style></head>
    <body style="background:#F8FAFC; padding:${isMobile ? '16px' : '28px 48px'};">
      <div style="max-width:1100px; margin:0 auto;">
        ${getStudentNav('profile')}
        
        <div class="card" style="padding:28px;">
          <div style="display:flex; gap:20px; align-items:center; margin-bottom:28px; border-bottom:1px solid #F1F5F9; padding-bottom:20px;">
            <div style="width:72px; height:72px; border-radius:50%; background:#F26F21; color:white; display:flex; align-items:center; justify-content:center; font-size:26px; font-weight:700;">VA</div>
            <div>
              <h2 style="font-size:20px; font-weight:700; color:#0F172A;">Nguyễn Văn A</h2>
              <div style="font-size:13px; color:#64748B;">Mã sinh viên: <span style="font-weight:600; color:#0F172A;">PS24110</span> • Email: anvps24110@fpt.edu.vn</div>
              <span class="badge badge-green" style="margin-top:6px;">Sinh viên Chính quy</span>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:${isMobile ? '1fr' : '1fr 1fr'}; gap:20px;">
            <div>
              <label style="font-size:12px; font-weight:600; color:#64748B; display:block; margin-bottom:4px;">Họ và tên</label>
              <input type="text" value="Nguyễn Văn A" style="width:100%; padding:10px; border:1px solid #CBD5E1; border-radius:8px; font-size:13px;" readonly>
            </div>
            <div>
              <label style="font-size:12px; font-weight:600; color:#64748B; display:block; margin-bottom:4px;">Chuyên ngành đào tạo</label>
              <input type="text" value="Phát triển Phần mềm (Software Engineering)" style="width:100%; padding:10px; border:1px solid #CBD5E1; border-radius:8px; font-size:13px;" readonly>
            </div>
            <div>
              <label style="font-size:12px; font-weight:600; color:#64748B; display:block; margin-bottom:4px;">Cơ sở học tập</label>
              <input type="text" value="FPT Polytechnic TP.HCM (CVPM Quang Trung, Q.12)" style="width:100%; padding:10px; border:1px solid #CBD5E1; border-radius:8px; font-size:13px;" readonly>
            </div>
            <div>
              <label style="font-size:12px; font-weight:600; color:#64748B; display:block; margin-bottom:4px;">Phụ huynh liên kết</label>
              <input type="text" value="Nguyễn Văn Hùng (0903.xxx.xxx) — Đã xác thực" style="width:100%; padding:10px; border:1px solid #CBD5E1; border-radius:8px; font-size:13px;" readonly>
            </div>
          </div>

          <div style="margin-top:24px; display:flex; justify-content:flex-end;">
            <button class="btn btn-primary btn-sm">Cập nhật mật khẩu</button>
          </div>
        </div>
      </div>
    </body></html>
  `;
}

export function getStud003Html(isMobile = false) {
  return `
    <!DOCTYPE html><html><head><meta charset="utf-8"><style>${COMMON_CSS}</style></head>
    <body style="background:#F8FAFC; padding:${isMobile ? '16px' : '28px 48px'};">
      <div style="max-width:1100px; margin:0 auto;">
        ${getStudentNav('progress')}

        <!-- Level Card -->
        <div class="card" style="padding:24px; margin-bottom:20px; background:linear-gradient(135deg, #1E1B4B, #0F172A); color:white;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <div>
              <div style="font-size:12px; color:#F26F21; font-weight:700;">HỆ THỐNG GAMIFICATION & HUY HIỆU</div>
              <h2 style="font-size:22px; font-weight:800;">Cấp độ 4: Nhà Thám Hiểm Poly</h2>
            </div>
            <div style="font-size:32px;">🏆</div>
          </div>
          <div style="margin:14px 0 6px;">
            <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
              <span>Tiến độ kinh nghiệm (XP)</span>
              <span style="font-weight:700; color:#F26F21;">420 / 500 XP (84%)</span>
            </div>
            <div style="height:8px; background:rgba(255,255,255,0.2); border-radius:4px; overflow:hidden;">
              <div style="width:84%; height:100%; background:#F26F21;"></div>
            </div>
          </div>
        </div>

        <!-- Badges -->
        <div class="card" style="padding:20px; margin-bottom:20px;">
          <h3 style="font-size:15px; font-weight:700; margin-bottom:14px;">Bộ sưu tập Huy hiệu Poly</h3>
          <div style="display:grid; grid-template-columns:${isMobile ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)'}; gap:12px; text-align:center;">
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px;">
              <div style="font-size:26px;">🚀</div>
              <div style="font-size:11px; font-weight:600; margin-top:4px;">Tân binh Poly</div>
            </div>
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px;">
              <div style="font-size:26px;">🌐</div>
              <div style="font-size:11px; font-weight:600; margin-top:4px;">Thám hiểm 360°</div>
            </div>
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px;">
              <div style="font-size:26px;">🎡</div>
              <div style="font-size:11px; font-weight:600; margin-top:4px;">Vòng quay Pro</div>
            </div>
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px;">
              <div style="font-size:26px;">🎯</div>
              <div style="font-size:11px; font-weight:600; margin-top:4px;">Thợ săn Quiz</div>
            </div>
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px; opacity:0.4;">
              <div style="font-size:26px;">🔒</div>
              <div style="font-size:11px; font-weight:600; margin-top:4px;">Master VR</div>
            </div>
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px; opacity:0.4;">
              <div style="font-size:26px;">🔒</div>
              <div style="font-size:11px; font-weight:600; margin-top:4px;">Thủ khoa Open</div>
            </div>
          </div>
        </div>

        <!-- Ledger -->
        <div class="card" style="padding:20px;">
          <h3 style="font-size:15px; font-weight:700; margin-bottom:12px;">Nhật ký tích lũy điểm thưởng XP</h3>
          <div style="font-size:13px;">
            <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #F1F5F9;">
              <div>Check-in Hội trường Tòa Nhà T lúc Open Day</div>
              <span style="font-weight:700; color:#16A34A;">+50 XP</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #F1F5F9;">
              <div>Khám phá toàn bộ 6 Hotspots tại Thư viện Số 360°</div>
              <span style="font-weight:700; color:#16A34A;">+100 XP</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:10px 0;">
              <div>Quay Vòng quay may mắn nhận quà tuyển sinh</div>
              <span style="font-weight:700; color:#16A34A;">+30 XP</span>
            </div>
          </div>
        </div>
      </div>
    </body></html>
  `;
}

export function getStud004Html(isMobile = false) {
  return `
    <!DOCTYPE html><html><head><meta charset="utf-8"><style>${COMMON_CSS}</style></head>
    <body style="background:#F8FAFC; padding:${isMobile ? '16px' : '28px 48px'};">
      <div style="max-width:1100px; margin:0 auto;">
        ${getStudentNav('schedule')}

        <div class="card" style="padding:24px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <div>
              <h2 style="font-size:18px; font-weight:700; color:#0F172A;">Lịch trình Sự kiện & Hoạt động Open Day</h2>
              <div style="font-size:12px; color:#64748B;">Ngày 15/11/2026 tại FPT Polytechnic TP.HCM (CVPM Quang Trung)</div>
            </div>
            <button class="btn btn-outline btn-sm">📅 Xuất iCal/Google</button>
          </div>

          <div style="display:flex; flex-direction:column; gap:16px;">
            <div style="background:#F8FAFC; border-left:4px solid #16A34A; border-radius:8px; padding:16px; border-top:1px solid #E2E8F0; border-right:1px solid #E2E8F0; border-bottom:1px solid #E2E8F0;">
              <div style="display:flex; justify-content:space-between;">
                <span class="badge badge-green">08:00 - 08:45</span>
                <span style="font-size:11px; color:#16A34A; font-weight:700;">ĐÃ HOÀN THÀNH</span>
              </div>
              <div style="font-weight:700; font-size:15px; margin:6px 0;">Đón tiếp thí sinh & Check-in vé điện tử QR</div>
              <div style="font-size:12px; color:#64748B;">Địa điểm: Sảnh Tòa T — Nhận áo thun Poly & Bản đồ định hướng</div>
            </div>

            <div style="background:#FFF7ED; border-left:4px solid #F26F21; border-radius:8px; padding:16px; border-top:1px solid #FFEDD5; border-right:1px solid #FFEDD5; border-bottom:1px solid #FFEDD5;">
              <div style="display:flex; justify-content:space-between;">
                <span class="badge badge-orange">09:00 - 11:30</span>
                <span style="font-size:11px; color:#F26F21; font-weight:700;">ĐANG DIỄN RA</span>
              </div>
              <div style="font-weight:700; font-size:15px; margin:6px 0;">Tham quan Thực tế Ảo 360° & Đua Minigame công nghệ</div>
              <div style="font-size:12px; color:#64748B;">Địa điểm: Phòng Lab 302 AI & Khuôn viên sân trường</div>
            </div>

            <div style="background:#F8FAFC; border-left:4px solid #64748B; border-radius:8px; padding:16px; border-top:1px solid #E2E8F0; border-right:1px solid #E2E8F0; border-bottom:1px solid #E2E8F0;">
              <div style="display:flex; justify-content:space-between;">
                <span class="badge badge-gray">13:30 - 15:30</span>
                <span style="font-size:11px; color:#64748B; font-weight:700;">SẮP TỚI</span>
              </div>
              <div style="font-weight:700; font-size:15px; margin:6px 0;">Tọa đàm Hướng nghiệp: Công nghệ Số & Cơ hội việc làm 2026</div>
              <div style="font-size:12px; color:#64748B;">Địa điểm: Hội trường Lớn Tòa Nhà T</div>
            </div>
          </div>
        </div>
      </div>
    </body></html>
  `;
}

export function getStud005Html(isMobile = false) {
  return `
    <!DOCTYPE html><html><head><meta charset="utf-8"><style>${COMMON_CSS}</style></head>
    <body style="background:#F8FAFC; padding:${isMobile ? '16px' : '28px 48px'};">
      <div style="max-width:800px; margin:0 auto;">
        ${getStudentNav('tickets')}

        <div class="card" style="overflow:hidden; border:2px solid #F26F21; box-shadow:0 12px 30px rgba(242,111,33,0.15);">
          <!-- Ticket Header -->
          <div style="background:linear-gradient(135deg, #F26F21, #C2410C); color:white; padding:20px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:11px; text-transform:uppercase; letter-spacing:1px; font-weight:700;">FPT POLYTECHNIC OPEN DAY 2026</div>
              <div style="font-size:20px; font-weight:800;">THẺ THAM GIA ĐIỆN TỬ (VIP PASS)</div>
            </div>
            <div style="font-size:32px;">🎟️</div>
          </div>

          <div style="padding:28px; display:grid; grid-template-columns:${isMobile ? '1fr' : '180px 1fr'}; gap:24px; align-items:center;">
            <!-- QR Box -->
            <div style="text-align:center;">
              <div style="width:160px; height:160px; background:white; border:2px solid #0F172A; border-radius:12px; margin:0 auto; padding:8px; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <!-- Simulated QR -->
                <div style="width:140px; height:140px; background:repeating-linear-gradient(0deg, #0F172A, #0F172A 8px, white 8px, white 16px), repeating-linear-gradient(90deg, #0F172A, #0F172A 8px, transparent 8px, transparent 16px); background-blend-mode:difference;"></div>
              </div>
              <div style="font-family:monospace; font-size:11px; font-weight:700; color:#0F172A; margin-top:8px;">#OD-2026-FPT-8942-A</div>
            </div>

            <!-- Details -->
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span class="badge badge-green" style="font-size:12px; padding:6px 12px;">✓ HỢP LỆ — SẴN SÀNG QUÉT</span>
                <span style="font-size:12px; color:#64748B;">Cơ sở: QTSC Q.12</span>
              </div>
              
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:13px; margin-bottom:16px;">
                <div>
                  <div style="color:#64748B; font-size:11px;">Họ tên thí sinh</div>
                  <div style="font-weight:700; color:#0F172A;">Nguyễn Văn A</div>
                </div>
                <div>
                  <div style="color:#64748B; font-size:11px;">Mã định danh / MSSV</div>
                  <div style="font-weight:700; color:#0F172A;">PS24110</div>
                </div>
                <div>
                  <div style="color:#64748B; font-size:11px;">Vị trí chỗ ngồi</div>
                  <div style="font-weight:700; color:#F26F21;">Khu A — Ghế VIP-08</div>
                </div>
                <div>
                  <div style="color:#64748B; font-size:11px;">Thời gian mở cổng</div>
                  <div style="font-weight:700; color:#0F172A;">07:30 - 17:30 (15/11)</div>
                </div>
              </div>

              <div style="display:flex; gap:10px;">
                <button class="btn btn-primary btn-sm">📱 Lưu vào Apple/Google Wallet</button>
                <button class="btn btn-outline btn-sm">⬇️ Tải ảnh PDF</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body></html>
  `;
}

export function getCamp001Html(isMobile = false) {
  return `
    <!DOCTYPE html><html><head><meta charset="utf-8"><style>${COMMON_CSS}</style></head>
    <body style="margin:0; padding:0; height:100vh; overflow:hidden; background:linear-gradient(180deg, #38BDF8 0%, #BAE6FD 35%, #F0FDF4 65%, #15803D 100%); position:relative;">
      <!-- Campus Backdrop Graphic Simulation -->
      <div style="position:absolute; bottom:0; left:0; right:0; height:60%; background:linear-gradient(180deg, transparent 0%, #166534 80%);"></div>
      <!-- Campus Building Silhouette -->
      <div style="position:absolute; bottom:15%; left:15%; right:15%; height:45%; background:#1E293B; border-radius:12px 12px 0 0; border:2px solid #F26F21; box-shadow:0 -10px 40px rgba(0,0,0,0.3); display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; opacity:0.95;">
        <div style="font-size:14px; font-weight:700; color:#F26F21; letter-spacing:1px; margin-bottom:4px;">FPT POLYTECHNIC TP.HCM</div>
        <div style="font-size:24px; font-weight:800;">TÒA NHÀ T — KHUÔN VIÊN TRUNG TÂM QTSC</div>
        <div style="font-size:12px; color:#94A3B8; margin-top:4px;">Góc quay 360° Panorama quang đãng • Độ phân giải cao 8K</div>
      </div>

      <!-- Top Overlay UI -->
      <div style="position:absolute; top:20px; left:20px; right:20px; display:flex; justify-content:space-between; align-items:center; z-index:10;">
        <div style="background:rgba(15,23,42,0.85); backdrop-filter:blur(8px); padding:10px 18px; border-radius:10px; border:1px solid rgba(255,255,255,0.15); color:white;">
          <div style="font-size:11px; color:#F26F21; font-weight:700;">VIRTUAL CAMPUS 360° TOUR</div>
          <div style="font-size:15px; font-weight:700;">Sảnh Chính Tòa Nhà T — Công viên Phần mềm Quang Trung</div>
        </div>

        <div style="display:flex; gap:10px;">
          <button style="background:rgba(15,23,42,0.85); border:1px solid rgba(255,255,255,0.2); color:white; padding:8px 14px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer;">🧭 Đổi góc nhìn</button>
          <button style="background:#F26F21; border:none; color:white; padding:8px 14px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer;">🥽 Chế độ Kính VR</button>
        </div>
      </div>

      <!-- Hotspots -->
      <div style="position:absolute; top:45%; left:30%; text-align:center; z-index:10;">
        <div style="width:40px; height:40px; background:#F26F21; border-radius:50%; border:3px solid white; box-shadow:0 0 20px #F26F21; display:flex; align-items:center; justify-content:center; color:white; font-size:18px; margin:0 auto; cursor:pointer;">
          ℹ️
        </div>
        <div style="margin-top:6px; background:rgba(15,23,42,0.9); color:white; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:600; border:1px solid #F26F21; white-space:nowrap;">
          Phòng Tuyển sinh & Hướng nghiệp
        </div>
      </div>

      <div style="position:absolute; top:52%; left:65%; text-align:center; z-index:10;">
        <div style="width:40px; height:40px; background:#2563EB; border-radius:50%; border:3px solid white; box-shadow:0 0 20px #2563EB; display:flex; align-items:center; justify-content:center; color:white; font-size:18px; margin:0 auto; cursor:pointer;">
          ⬆️
        </div>
        <div style="margin-top:6px; background:rgba(15,23,42,0.9); color:white; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:600; border:1px solid #2563EB; white-space:nowrap;">
          Lên Cầu thang Tầng 1 — Thư viện
        </div>
      </div>

      <!-- Bottom Scene Carousel -->
      <div style="position:absolute; bottom:20px; left:50%; transform:translateX(-50%); background:rgba(15,23,42,0.85); backdrop-filter:blur(8px); padding:10px 16px; border-radius:14px; border:1px solid rgba(255,255,255,0.15); display:flex; gap:12px; z-index:10; max-width:90%;">
        <div style="text-align:center;">
          <div style="width:70px; height:45px; background:#F26F21; border:2px solid white; border-radius:6px; display:flex; align-items:center; justify-content:center; color:white; font-size:10px; font-weight:700;">Sảnh T</div>
          <div style="font-size:10px; color:#F26F21; font-weight:700; margin-top:4px;">Hiện tại</div>
        </div>
        <div style="text-align:center;">
          <div style="width:70px; height:45px; background:#334155; border:1px solid #475569; border-radius:6px; display:flex; align-items:center; justify-content:center; color:white; font-size:10px;">Lab 302</div>
          <div style="font-size:10px; color:#94A3B8; margin-top:4px;">Tầng 3</div>
        </div>
        <div style="text-align:center;">
          <div style="width:70px; height:45px; background:#334155; border:1px solid #475569; border-radius:6px; display:flex; align-items:center; justify-content:center; color:white; font-size:10px;">Thư viện</div>
          <div style="font-size:10px; color:#94A3B8; margin-top:4px;">Tầng 2</div>
        </div>
        <div style="text-align:center;">
          <div style="width:70px; height:45px; background:#334155; border:1px solid #475569; border-radius:6px; display:flex; align-items:center; justify-content:center; color:white; font-size:10px;">Hội trường</div>
          <div style="font-size:10px; color:#94A3B8; margin-top:4px;">Hall T</div>
        </div>
      </div>
    </body></html>
  `;
}
