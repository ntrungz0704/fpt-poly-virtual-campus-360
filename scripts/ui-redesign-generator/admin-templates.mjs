import { COMMON_CSS, getAdminSidebar, getAdminHeader } from './mockup-templates-common.mjs';

export function getAdmin001Html(isMobile = false) {
  if (isMobile) {
    return `
      <!DOCTYPE html><html><head><meta charset="utf-8"><style>${COMMON_CSS}</style></head>
      <body style="background:#F8FAFC; padding: 16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <div style="font-size:18px; font-weight:700; color:#0F172A;">Admin Dashboard</div>
          <span class="badge badge-orange">Super Admin</span>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px;">
          <div class="stat-card">
            <div style="font-size:11px; color:#64748B;">Lượt xem 360°</div>
            <div class="stat-value" style="font-size:20px;">128,450</div>
            <div style="font-size:10px; color:#16A34A; font-weight:600;">+14.2%</div>
          </div>
          <div class="stat-card">
            <div style="font-size:11px; color:#64748B;">Đăng ký Open Day</div>
            <div class="stat-value" style="font-size:20px;">3,842</div>
            <div style="font-size:10px; color:#16A34A; font-weight:600;">+22.5%</div>
          </div>
          <div class="stat-card">
            <div style="font-size:11px; color:#64748B;">Tỷ lệ xong Tour</div>
            <div class="stat-value" style="font-size:20px;">78.6%</div>
            <div style="font-size:10px; color:#16A34A; font-weight:600;">+5.1%</div>
          </div>
          <div class="stat-card">
            <div style="font-size:11px; color:#64748B;">Điểm Hotspot</div>
            <div class="stat-value" style="font-size:20px;">192</div>
            <div style="font-size:10px; color:#2563EB; font-weight:600;">48 Cảnh</div>
          </div>
        </div>
        <div class="card" style="padding:16px; margin-bottom:16px;">
          <div style="font-size:14px; font-weight:700; margin-bottom:12px;">Truy cập theo giờ hôm nay</div>
          <div style="height:120px; background:linear-gradient(180deg, rgba(242,111,33,0.15) 0%, rgba(242,111,33,0.01) 100%); border-bottom:2px solid #F26F21; border-radius:6px; display:flex; align-items:flex-end; justify-content:space-around; padding:10px 0;">
            <div style="height:30%; width:12px; background:#F26F21; border-radius:3px;"></div>
            <div style="height:55%; width:12px; background:#F26F21; border-radius:3px;"></div>
            <div style="height:80%; width:12px; background:#F26F21; border-radius:3px;"></div>
            <div style="height:65%; width:12px; background:#F26F21; border-radius:3px;"></div>
            <div style="height:95%; width:12px; background:#F26F21; border-radius:3px;"></div>
            <div style="height:45%; width:12px; background:#F26F21; border-radius:3px;"></div>
          </div>
        </div>
        <div class="card" style="padding:16px;">
          <div style="font-size:14px; font-weight:700; margin-bottom:10px;">Hoạt động gần đây</div>
          <div style="font-size:12px; padding:8px 0; border-bottom:1px solid #F1F5F9;">
            <div style="font-weight:600;">Nguyễn Minh Quân</div>
            <div style="color:#64748B;">Đã đăng ký Open Day lúc 12:10</div>
          </div>
          <div style="font-size:12px; padding:8px 0;">
            <div style="font-weight:600;">Admin Trần Trung</div>
            <div style="color:#64748B;">Cập nhật Hotspot Sảnh Tòa T</div>
          </div>
        </div>
      </body></html>
    `;
  }

  return `
    <!DOCTYPE html><html><head><meta charset="utf-8"><style>${COMMON_CSS}</style></head>
    <body style="display:flex; height:100vh; overflow:hidden;">
      ${getAdminSidebar('overview')}
      <div style="flex:1; display:flex; flex-direction:column; overflow-y:auto;">
        ${getAdminHeader('Tổng quan Dashboard', '<button class="btn btn-primary btn-sm">+ Thêm sự kiện</button>')}
        <div style="padding:28px;">
          <div style="margin-bottom:24px;">
            <h1 style="font-size:24px; font-weight:700; color:#0F172A;">Bảng điều khiển Tổng quan</h1>
            <p style="font-size:14px; color:#64748B; margin-top:4px;">Giám sát hiệu suất vận hành hệ sinh thái Virtual Campus 360° & Tuyển sinh Open Day</p>
          </div>
          
          <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:20px; margin-bottom:28px;">
            <div class="stat-card">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:13px; color:#64748B; font-weight:500;">Lượt xem 360°</span>
                <span style="font-size:18px;">🌐</span>
              </div>
              <div class="stat-value">128,450</div>
              <div style="font-size:12px; color:#16A34A; font-weight:600;">↑ 14.2% so với tháng trước</div>
            </div>
            <div class="stat-card">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:13px; color:#64748B; font-weight:500;">Thí sinh đăng ký Open Day</span>
                <span style="font-size:18px;">🎓</span>
              </div>
              <div class="stat-value">3,842</div>
              <div style="font-size:12px; color:#16A34A; font-weight:600;">↑ 22.5% tỷ lệ chuyển đổi</div>
            </div>
            <div class="stat-card">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:13px; color:#64748B; font-weight:500;">Tỷ lệ hoàn thành Tour</span>
                <span style="font-size:18px;">🧭</span>
              </div>
              <div class="stat-value">78.6%</div>
              <div style="font-size:12px; color:#16A34A; font-weight:600;">↑ 5.1% tương tác trung bình</div>
            </div>
            <div class="stat-card">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:13px; color:#64748B; font-weight:500;">Cảnh 360° & Hotspots</span>
                <span style="font-size:18px;">📍</span>
              </div>
              <div class="stat-value">48 / 192</div>
              <div style="font-size:12px; color:#2563EB; font-weight:600;">Khuôn viên QTSC Q.12</div>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:2fr 1fr; gap:24px;">
            <div class="card" style="padding:24px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3 style="font-size:16px; font-weight:700;">Lưu lượng tham quan Virtual Campus (7 ngày qua)</h3>
                <span class="badge badge-orange">Dữ liệu thời gian thực</span>
              </div>
              <div style="height:220px; background:linear-gradient(180deg, rgba(242,111,33,0.12) 0%, rgba(242,111,33,0.01) 100%); border-bottom:3px solid #F26F21; border-radius:8px; display:flex; align-items:flex-end; justify-content:space-around; padding:15px;">
                <div style="text-align:center;"><div style="height:80px; width:36px; background:#F26F21; border-radius:6px; margin:0 auto;"></div><div style="font-size:11px; color:#64748B; margin-top:8px;">T2</div></div>
                <div style="text-align:center;"><div style="height:120px; width:36px; background:#F26F21; border-radius:6px; margin:0 auto;"></div><div style="font-size:11px; color:#64748B; margin-top:8px;">T3</div></div>
                <div style="text-align:center;"><div style="height:140px; width:36px; background:#F26F21; border-radius:6px; margin:0 auto;"></div><div style="font-size:11px; color:#64748B; margin-top:8px;">T4</div></div>
                <div style="text-align:center;"><div style="height:110px; width:36px; background:#F26F21; border-radius:6px; margin:0 auto;"></div><div style="font-size:11px; color:#64748B; margin-top:8px;">T5</div></div>
                <div style="text-align:center;"><div style="height:170px; width:36px; background:#F26F21; border-radius:6px; margin:0 auto;"></div><div style="font-size:11px; color:#64748B; margin-top:8px;">T6</div></div>
                <div style="text-align:center;"><div style="height:200px; width:36px; background:#0F172A; border-radius:6px; margin:0 auto;"></div><div style="font-size:11px; color:#0F172A; font-weight:700; margin-top:8px;">T7</div></div>
                <div style="text-align:center;"><div style="height:190px; width:36px; background:#0F172A; border-radius:6px; margin:0 auto;"></div><div style="font-size:11px; color:#0F172A; font-weight:700; margin-top:8px;">CN</div></div>
              </div>
            </div>

            <div class="card" style="padding:24px;">
              <h3 style="font-size:16px; font-weight:700; margin-bottom:16px;">Hoạt động hệ thống mới nhất</h3>
              <div style="display:flex; flex-direction:column; gap:16px;">
                <div style="display:flex; gap:12px; align-items:flex-start;">
                  <div style="width:32px; height:32px; border-radius:50%; background:#DCFCE7; color:#16A34A; display:flex; align-items:center; justify-content:center; font-size:14px;">✓</div>
                  <div>
                    <div style="font-size:13px; font-weight:600;">Thí sinh đăng ký Open Day #3842</div>
                    <div style="font-size:12px; color:#64748B;">Nguyễn Minh Quân — 3 phút trước</div>
                  </div>
                </div>
                <div style="display:flex; gap:12px; align-items:flex-start;">
                  <div style="width:32px; height:32px; border-radius:50%; background:#FFEDD5; color:#C2410C; display:flex; align-items:center; justify-content:center; font-size:14px;">📍</div>
                  <div>
                    <div style="font-size:13px; font-weight:600;">Cập nhật Hotspot Tòa Nhà T</div>
                    <div style="font-size:12px; color:#64748B;">Admin Trần Trung — 25 phút trước</div>
                  </div>
                </div>
                <div style="display:flex; gap:12px; align-items:flex-start;">
                  <div style="width:32px; height:32px; border-radius:50%; background:#DBEAFE; color:#1E40AF; display:flex; align-items:center; justify-content:center; font-size:14px;">🔄</div>
                  <div>
                    <div style="font-size:13px; font-weight:600;">Đồng bộ dữ liệu Prisma DB</div>
                    <div style="font-size:12px; color:#64748B;">Hệ thống tự động — 1 giờ trước</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body></html>
  `;
}

export function getAdmin002Html(isMobile = false) {
  if (isMobile) {
    return `
      <!DOCTYPE html><html><head><meta charset="utf-8"><style>${COMMON_CSS}</style></head>
      <body style="background:#F8FAFC; padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <h2 style="font-size:18px; font-weight:700;">Quản lý Sự kiện</h2>
          <button class="btn btn-primary btn-sm">+ Tạo mới</button>
        </div>
        <div class="card" style="padding:14px; margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="badge badge-green">Đang mở đăng ký</span>
            <span style="font-size:11px; color:#64748B;">15/11/2026</span>
          </div>
          <div style="font-weight:700; font-size:15px; margin:8px 0;">Open Day 2026: Khám phá Thế giới Công nghệ</div>
          <div style="font-size:12px; color:#64748B;">CVPM Quang Trung • 450/500 Vé</div>
        </div>
        <div class="card" style="padding:14px; margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="badge badge-orange">Sắp diễn ra</span>
            <span style="font-size:11px; color:#64748B;">22/11/2026</span>
          </div>
          <div style="font-weight:700; font-size:15px; margin:8px 0;">Workshop: AI & Robotic Automation</div>
          <div style="font-size:12px; color:#64748B;">Phòng Lab 302 • 180/200 Vé</div>
        </div>
      </body></html>
    `;
  }

  return `
    <!DOCTYPE html><html><head><meta charset="utf-8"><style>${COMMON_CSS}</style></head>
    <body style="display:flex; height:100vh; overflow:hidden;">
      ${getAdminSidebar('events')}
      <div style="flex:1; display:flex; flex-direction:column; overflow-y:auto;">
        ${getAdminHeader('Quản lý Sự kiện Open Day', '<button class="btn btn-primary btn-sm">+ Tạo sự kiện mới</button>')}
        <div style="padding:28px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <div>
              <h1 style="font-size:22px; font-weight:700; color:#0F172A;">Danh sách Sự kiện & Hội thảo Tuyển sinh</h1>
              <p style="font-size:13px; color:#64748B;">Quản lý chỉ tiêu vé, check-in QR và nội dung chương trình trải nghiệm</p>
            </div>
            <div style="display:flex; gap:10px;">
              <input type="text" placeholder="Tìm tên sự kiện..." style="padding:8px 14px; border:1px solid #CBD5E1; border-radius:8px; font-size:13px; width:220px;" value="Open Day 2026">
              <select style="padding:8px 14px; border:1px solid #CBD5E1; border-radius:8px; font-size:13px;">
                <option>Tất cả cơ sở</option>
                <option selected>QTSC Q.12</option>
              </select>
            </div>
          </div>

          <div class="card" style="overflow:hidden;">
            <table class="table-custom">
              <thead>
                <tr>
                  <th>TÊN SỰ KIỆN</th>
                  <th>THỜI GIAN</th>
                  <th>ĐỊA ĐIỂM</th>
                  <th>SỐ LƯỢNG VÉ</th>
                  <th>TRẠNG THÁI</th>
                  <th style="text-align:right;">THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div style="font-weight:600; color:#0F172A;">Open Day 2026: Khám phá Không gian Số FPT Poly</div>
                    <div style="font-size:11px; color:#64748B;">Sự kiện trải nghiệm tuyển sinh quy mô lớn</div>
                  </td>
                  <td>15/11/2026<br><span style="font-size:11px; color:#64748B;">07:30 - 17:30</span></td>
                  <td>Hội trường Tòa T (QTSC)</td>
                  <td><span style="font-weight:600; color:#16A34A;">450</span> / 500</td>
                  <td><span class="badge badge-green">Đang mở đăng ký</span></td>
                  <td style="text-align:right;">
                    <button class="btn btn-outline btn-sm">Chỉnh sửa</button>
                    <button class="btn btn-outline btn-sm" style="color:#DC2626;">Quét QR</button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div style="font-weight:600; color:#0F172A;">Workshop: Lộ trình trở thành AI Engineer 2026</div>
                    <div style="font-size:11px; color:#64748B;">Giao lưu chuyên gia FPT Software & Poly</div>
                  </td>
                  <td>22/11/2026<br><span style="font-size:11px; color:#64748B;">09:00 - 11:30</span></td>
                  <td>Phòng Lab 302 Tòa T</td>
                  <td><span style="font-weight:600; color:#C2410C;">180</span> / 200</td>
                  <td><span class="badge badge-orange">Sắp diễn ra</span></td>
                  <td style="text-align:right;">
                    <button class="btn btn-outline btn-sm">Chỉnh sửa</button>
                    <button class="btn btn-outline btn-sm" style="color:#DC2626;">Quét QR</button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div style="font-weight:600; color:#0F172A;">Lễ Khai giảng & Định hướng Khóa K20.3</div>
                    <div style="font-size:11px; color:#64748B;">Dành cho tân sinh viên nhập học đợt 3</div>
                  </td>
                  <td>05/12/2026<br><span style="font-size:11px; color:#64748B;">08:00 - 12:00</span></td>
                  <td>Sân đại sảnh QTSC</td>
                  <td><span style="font-weight:600; color:#1E40AF;">1,200</span> / 1,500</td>
                  <td><span class="badge badge-blue">Đã công bố</span></td>
                  <td style="text-align:right;">
                    <button class="btn btn-outline btn-sm">Chỉnh sửa</button>
                    <button class="btn btn-outline btn-sm" style="color:#DC2626;">Quét QR</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </body></html>
  `;
}

export function getAdmin003Html(isMobile = false) {
  if (isMobile) {
    return `
      <!DOCTYPE html><html><head><meta charset="utf-8"><style>${COMMON_CSS}</style></head>
      <body style="background:#F8FAFC; padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <h2 style="font-size:18px; font-weight:700;">Địa điểm & Tòa nhà</h2>
          <button class="btn btn-primary btn-sm">+ Thêm</button>
        </div>
        <div class="card" style="padding:14px; margin-bottom:12px;">
          <div style="font-weight:700; font-size:15px; color:#0F172A;">Tòa nhà T — Trung tâm Đào tạo</div>
          <div style="font-size:12px; color:#64748B; margin:4px 0;">4 Tầng • 32 Phòng học • 8 Điểm 360°</div>
          <span class="badge badge-blue">Giảng đường chính</span>
        </div>
        <div class="card" style="padding:14px; margin-bottom:12px;">
          <div style="font-weight:700; font-size:15px; color:#0F172A;">Thư viện số FPT Poly</div>
          <div style="font-size:12px; color:#64748B; margin:4px 0;">Tầng 2 Tòa T • 6 Cảnh 360°</div>
          <span class="badge badge-purple">Không gian tự học</span>
        </div>
      </body></html>
    `;
  }

  return `
    <!DOCTYPE html><html><head><meta charset="utf-8"><style>${COMMON_CSS}</style></head>
    <body style="display:flex; height:100vh; overflow:hidden;">
      ${getAdminSidebar('locations')}
      <div style="flex:1; display:flex; flex-direction:column; overflow-y:auto;">
        ${getAdminHeader('Quản lý Địa điểm & Tòa nhà', '<button class="btn btn-primary btn-sm">+ Thêm địa điểm mới</button>')}
        <div style="padding:28px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <div>
              <h1 style="font-size:22px; font-weight:700; color:#0F172A;">Quản lý Khuôn viên & Địa điểm GIS</h1>
              <p style="font-size:13px; color:#64748B;">Cấu hình tọa độ GPS, liên kết cảnh Panorama 360° và thông tin chi tiết các tòa nhà tại QTSC</p>
            </div>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-primary btn-sm">Tất cả (18)</button>
              <button class="btn btn-outline btn-sm">Giảng đường (6)</button>
              <button class="btn btn-outline btn-sm">Phòng Lab (5)</button>
              <button class="btn btn-outline btn-sm">Tiện ích (4)</button>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:20px;">
            <div class="card" style="overflow:hidden;">
              <div style="height:140px; background:linear-gradient(135deg, #1E293B, #0F172A); position:relative; display:flex; align-items:center; justify-content:center; color:white;">
                <div style="font-size:36px;">🏛️</div>
                <span class="badge badge-orange" style="position:absolute; top:12px; right:12px;">8 Cảnh 360°</span>
              </div>
              <div style="padding:18px;">
                <div style="font-size:16px; font-weight:700; color:#0F172A;">Tòa nhà T — Trung tâm Đào tạo</div>
                <div style="font-size:12px; color:#64748B; margin:6px 0;">Tọa độ GPS: 10.8532° N, 106.6268° E</div>
                <div style="font-size:13px; color:#334155; margin-bottom:14px;">Bao gồm 4 tầng lầu, 32 phòng lý thuyết, hội trường lớn và văn phòng bộ môn.</div>
                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #F1F5F9; padding-top:12px;">
                  <span class="badge badge-blue">Giảng đường</span>
                  <button class="btn btn-outline btn-sm">Sửa địa điểm</button>
                </div>
              </div>
            </div>

            <div class="card" style="overflow:hidden;">
              <div style="height:140px; background:linear-gradient(135deg, #0F766E, #115E59); position:relative; display:flex; align-items:center; justify-content:center; color:white;">
                <div style="font-size:36px;">💻</div>
                <span class="badge badge-orange" style="position:absolute; top:12px; right:12px;">5 Cảnh 360°</span>
              </div>
              <div style="padding:18px;">
                <div style="font-size:16px; font-weight:700; color:#0F172A;">Tổ hợp Phòng Lab AI & Robotics</div>
                <div style="font-size:12px; color:#64748B; margin:6px 0;">Tọa độ GPS: 10.8535° N, 106.6271° E</div>
                <div style="font-size:13px; color:#334155; margin-bottom:14px;">Trang bị 120 máy tính cấu hình đồ họa cao, thiết bị IoT và cánh tay robot thực hành.</div>
                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #F1F5F9; padding-top:12px;">
                  <span class="badge badge-green">Phòng Thực hành</span>
                  <button class="btn btn-outline btn-sm">Sửa địa điểm</button>
                </div>
              </div>
            </div>

            <div class="card" style="overflow:hidden;">
              <div style="height:140px; background:linear-gradient(135deg, #6B21A8, #4C1D95); position:relative; display:flex; align-items:center; justify-content:center; color:white;">
                <div style="font-size:36px;">📚</div>
                <span class="badge badge-orange" style="position:absolute; top:12px; right:12px;">6 Cảnh 360°</span>
              </div>
              <div style="padding:18px;">
                <div style="font-size:16px; font-weight:700; color:#0F172A;">Thư viện Số & Không gian Sáng tạo</div>
                <div style="font-size:12px; color:#64748B; margin:6px 0;">Tọa độ GPS: 10.8530° N, 106.6265° E</div>
                <div style="font-size:13px; color:#334155; margin-bottom:14px;">Không gian tự học yên tĩnh với hơn 10,000 đầu sách điện tử, phòng họp nhóm kính.</div>
                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #F1F5F9; padding-top:12px;">
                  <span class="badge badge-purple">Tiện ích học vụ</span>
                  <button class="btn btn-outline btn-sm">Sửa địa điểm</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body></html>
  `;
}

export function getAdmin004Html(isMobile = false) {
  if (isMobile) {
    return `
      <!DOCTYPE html><html><head><meta charset="utf-8"><style>${COMMON_CSS}</style></head>
      <body style="background:#F8FAFC; padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <h2 style="font-size:18px; font-weight:700;">Kho Media 360°</h2>
          <span style="font-size:12px; color:#64748B;">38.4 GB / 100 GB</span>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div class="card" style="padding:8px; text-align:center;">
            <div style="height:70px; background:#1E293B; border-radius:6px; margin-bottom:6px; display:flex; align-items:center; justify-content:center; color:white; font-size:20px;">🌐</div>
            <div style="font-size:11px; font-weight:600;">Sanh_Toa_T.jpg</div>
            <div style="font-size:10px; color:#64748B;">8192×4096 (12MB)</div>
          </div>
          <div class="card" style="padding:8px; text-align:center;">
            <div style="height:70px; background:#1E293B; border-radius:6px; margin-bottom:6px; display:flex; align-items:center; justify-content:center; color:white; font-size:20px;">🌐</div>
            <div style="font-size:11px; font-weight:600;">Lab_AI_302.jpg</div>
            <div style="font-size:10px; color:#64748B;">8192×4096 (14MB)</div>
          </div>
        </div>
      </body></html>
    `;
  }

  return `
    <!DOCTYPE html><html><head><meta charset="utf-8"><style>${COMMON_CSS}</style></head>
    <body style="display:flex; height:100vh; overflow:hidden;">
      ${getAdminSidebar('media')}
      <div style="flex:1; display:flex; flex-direction:column; overflow-y:auto;">
        ${getAdminHeader('Thư viện Media & Panorama 360', '<button class="btn btn-primary btn-sm">+ Tải lên ảnh Panorama</button>')}
        <div style="padding:28px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <div>
              <h1 style="font-size:22px; font-weight:700; color:#0F172A;">Quản lý Kho Ảnh Toàn Cảnh Equirectangular</h1>
              <p style="font-size:13px; color:#64748B;">Lưu trữ và tối ưu hóa ảnh 360° độ phân giải 8K phục vụ Three.js & Photo-Sphere-Viewer</p>
            </div>
            <div style="background:white; border:1px solid #E2E8F0; border-radius:8px; padding:8px 16px; font-size:12px;">
              <span style="color:#64748B;">Dung lượng lưu trữ: </span>
              <span style="font-weight:700; color:#F26F21;">38.4 GB</span> / 100 GB (38%)
            </div>
          </div>

          <div style="border:2px dashed #CBD5E1; background:white; border-radius:12px; padding:28px; text-align:center; margin-bottom:24px;">
            <div style="font-size:32px; margin-bottom:8px;">📁</div>
            <div style="font-size:15px; font-weight:600; color:#0F172A;">Kéo thả ảnh toàn cảnh 2:1 Equirectangular vào đây</div>
            <div style="font-size:12px; color:#64748B; margin-top:4px;">Hỗ trợ JPG, PNG chuẩn 2:1 (khuyến nghị 4096×2048 hoặc 8192×4096)</div>
          </div>

          <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:18px;">
            <div class="card" style="overflow:hidden;">
              <div style="height:120px; background:#1E293B; display:flex; align-items:center; justify-content:center; color:white; font-size:28px; position:relative;">
                🌐
                <span class="badge badge-orange" style="position:absolute; top:8px; right:8px; font-size:10px;">8K VR</span>
              </div>
              <div style="padding:12px;">
                <div style="font-weight:600; font-size:13px;">sanh_chinh_toa_t_8k.jpg</div>
                <div style="font-size:11px; color:#64748B; margin-top:2px;">8192 × 4096 • 12.4 MB</div>
              </div>
            </div>
            <div class="card" style="overflow:hidden;">
              <div style="height:120px; background:#0F766E; display:flex; align-items:center; justify-content:center; color:white; font-size:28px; position:relative;">
                🌐
                <span class="badge badge-orange" style="position:absolute; top:8px; right:8px; font-size:10px;">8K VR</span>
              </div>
              <div style="padding:12px;">
                <div style="font-weight:600; font-size:13px;">phong_lab_ai_302.jpg</div>
                <div style="font-size:11px; color:#64748B; margin-top:2px;">8192 × 4096 • 14.1 MB</div>
              </div>
            </div>
            <div class="card" style="overflow:hidden;">
              <div style="height:120px; background:#6B21A8; display:flex; align-items:center; justify-content:center; color:white; font-size:28px; position:relative;">
                🌐
                <span class="badge badge-orange" style="position:absolute; top:8px; right:8px; font-size:10px;">8K VR</span>
              </div>
              <div style="padding:12px;">
                <div style="font-weight:600; font-size:13px;">thu_vien_so_floor2.jpg</div>
                <div style="font-size:11px; color:#64748B; margin-top:2px;">8192 × 4096 • 11.8 MB</div>
              </div>
            </div>
            <div class="card" style="overflow:hidden;">
              <div style="height:120px; background:#C2410C; display:flex; align-items:center; justify-content:center; color:white; font-size:28px; position:relative;">
                🌐
                <span class="badge badge-orange" style="position:absolute; top:8px; right:8px; font-size:10px;">8K VR</span>
              </div>
              <div style="padding:12px;">
                <div style="font-weight:600; font-size:13px;">hoi_truong_lon_stage.jpg</div>
                <div style="font-size:11px; color:#64748B; margin-top:2px;">8192 × 4096 • 15.2 MB</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body></html>
  `;
}

export function getAdmin005Html(isMobile = false) {
  if (isMobile) {
    return `
      <!DOCTYPE html><html><head><meta charset="utf-8"><style>${COMMON_CSS}</style></head>
      <body style="background:#F8FAFC; padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <h2 style="font-size:18px; font-weight:700;">Người dùng & Phân quyền</h2>
          <button class="btn btn-primary btn-sm">+ Thêm</button>
        </div>
        <div class="card" style="padding:14px; margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between;">
            <div style="font-weight:700; font-size:14px;">Trần Trung</div>
            <span class="badge badge-orange">Super Admin</span>
          </div>
          <div style="font-size:12px; color:#64748B;">admin@poly.edu.vn</div>
        </div>
        <div class="card" style="padding:14px; margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between;">
            <div style="font-weight:700; font-size:14px;">Nguyễn Văn A</div>
            <span class="badge badge-blue">Sinh viên</span>
          </div>
          <div style="font-size:12px; color:#64748B;">MSSV: PS24110</div>
        </div>
      </body></html>
    `;
  }

  return `
    <!DOCTYPE html><html><head><meta charset="utf-8"><style>${COMMON_CSS}</style></head>
    <body style="display:flex; height:100vh; overflow:hidden;">
      ${getAdminSidebar('users')}
      <div style="flex:1; display:flex; flex-direction:column; overflow-y:auto;">
        ${getAdminHeader('Người dùng & Phân quyền RBAC', '<button class="btn btn-primary btn-sm">+ Thêm tài khoản mới</button>')}
        <div style="padding:28px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <div>
              <h1 style="font-size:22px; font-weight:700; color:#0F172A;">Quản trị Tài khoản & Phân quyền Truy cập</h1>
              <p style="font-size:13px; color:#64748B;">Kiểm soát vai trò người dùng (Admin, Ban tổ chức, Giảng viên, Sinh viên, Phụ huynh) theo RBAC</p>
            </div>
            <div style="display:flex; gap:10px;">
              <select style="padding:8px 14px; border:1px solid #CBD5E1; border-radius:8px; font-size:13px;">
                <option>Tất cả vai trò</option>
                <option>Super Admin</option>
                <option>Sinh viên</option>
                <option>Phụ huynh</option>
              </select>
            </div>
          </div>

          <div class="card" style="overflow:hidden;">
            <table class="table-custom">
              <thead>
                <tr>
                  <th>NGƯỜI DÙNG</th>
                  <th>MÃ ĐỊNH DANH</th>
                  <th>VAI TRÒ TRUY CẬP</th>
                  <th>LẦN ĐĂNG NHẬP CUỐI</th>
                  <th>TRẠNG THÁI</th>
                  <th style="text-align:right;">THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div style="font-weight:600; color:#0F172A;">Trần Trung</div>
                    <div style="font-size:11px; color:#64748B;">trungt@fe.edu.vn</div>
                  </td>
                  <td><span style="font-family:monospace; font-weight:600;">FE-ADM-01</span></td>
                  <td><span class="badge badge-orange">Super Administrator</span></td>
                  <td>Hôm nay, 12:04</td>
                  <td><span class="badge badge-green">Hoạt động</span></td>
                  <td style="text-align:right;">
                    <button class="btn btn-outline btn-sm">Sửa quyền</button>
                    <button class="btn btn-outline btn-sm">Khóa</button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div style="font-weight:600; color:#0F172A;">Nguyễn Văn A</div>
                    <div style="font-size:11px; color:#64748B;">anvps24110@fpt.edu.vn</div>
                  </td>
                  <td><span style="font-family:monospace; font-weight:600;">PS24110</span></td>
                  <td><span class="badge badge-blue">Sinh viên</span></td>
                  <td>Hôm nay, 08:32</td>
                  <td><span class="badge badge-green">Hoạt động</span></td>
                  <td style="text-align:right;">
                    <button class="btn btn-outline btn-sm">Sửa quyền</button>
                    <button class="btn btn-outline btn-sm">Khóa</button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div style="font-weight:600; color:#0F172A;">Nguyễn Văn Hùng</div>
                    <div style="font-size:11px; color:#64748B;">hung.nv@gmail.com</div>
                  </td>
                  <td><span style="font-family:monospace; font-weight:600;">PR-PS24110</span></td>
                  <td><span class="badge badge-purple">Phụ huynh</span></td>
                  <td>Hôm nay, 08:45</td>
                  <td><span class="badge badge-green">Hoạt động</span></td>
                  <td style="text-align:right;">
                    <button class="btn btn-outline btn-sm">Sửa quyền</button>
                    <button class="btn btn-outline btn-sm">Khóa</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </body></html>
  `;
}

export function getAdmin006Html(isMobile = false) {
  if (isMobile) {
    return `
      <!DOCTYPE html><html><head><meta charset="utf-8"><style>${COMMON_CSS}</style></head>
      <body style="background:#0F172A; color:white; padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <h2 style="font-size:18px; font-weight:700;">Studio Tour 360°</h2>
          <button class="btn btn-primary btn-sm">Lưu</button>
        </div>
        <div style="height:220px; background:#1E293B; border-radius:12px; position:relative; display:flex; align-items:center; justify-content:center;">
          <div style="font-size:40px;">🌐</div>
          <div style="position:absolute; top:20px; left:30px; width:24px; height:24px; background:#F26F21; border-radius:50%; border:2px solid white; box-shadow:0 0 10px #F26F21;"></div>
          <div style="position:absolute; bottom:12px; left:12px; font-size:11px; background:rgba(0,0,0,0.6); padding:4px 8px; border-radius:4px;">Sảnh Tòa T (Yaw: 45°)</div>
        </div>
        <div style="margin-top:14px; background:#1E293B; border-radius:10px; padding:12px;">
          <div style="font-size:12px; font-weight:600; margin-bottom:6px;">Hotspot được chọn: Cầu thang Tầng 1</div>
          <div style="font-size:11px; color:#94A3B8;">Loại: Chuyển cảnh liên kết • Cảnh đích: Floor_1</div>
        </div>
      </body></html>
    `;
  }

  return `
    <!DOCTYPE html><html><head><meta charset="utf-8"><style>${COMMON_CSS}</style></head>
    <body style="display:flex; height:100vh; overflow:hidden; background:#0F172A; color:white;">
      ${getAdminSidebar('tour-studio')}
      <div style="flex:1; display:flex; flex-direction:column; overflow:hidden;">
        <div style="height:60px; background:#1E293B; border-bottom:1px solid #334155; padding:0 24px; display:flex; align-items:center; justify-content:space-between;">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="font-size:18px;">🌐</span>
            <span style="font-weight:700; font-size:16px;">Studio Biên tập Tour 360° — Sảnh Chính Tòa Nhà T</span>
            <span class="badge badge-orange">Chế độ biên tập</span>
          </div>
          <div style="display:flex; gap:10px;">
            <button class="btn btn-outline btn-sm" style="background:#334155; color:white; border-color:#475569;">👁️ Xem thử VR</button>
            <button class="btn btn-primary btn-sm">+ Thêm Hotspot</button>
            <button class="btn btn-primary btn-sm" style="background:#16A34A;">💾 Lưu & Xuất bản</button>
          </div>
        </div>

        <div style="flex:1; display:flex; overflow:hidden;">
          <!-- Left Scene Explorer -->
          <div style="width:220px; background:#1E293B; border-right:1px solid #334155; padding:16px; overflow-y:auto;">
            <div style="font-size:11px; font-weight:700; color:#94A3B8; text-transform:uppercase; margin-bottom:12px;">Danh sách Cảnh trong Tour</div>
            <div style="padding:10px; border-radius:8px; background:rgba(242,111,33,0.2); border:1px solid #F26F21; color:#F26F21; font-weight:600; font-size:13px; margin-bottom:8px;">
              📍 Sảnh chính Tòa T (Gốc)
            </div>
            <div style="padding:10px; border-radius:8px; background:#334155; color:#E2E8F0; font-size:13px; margin-bottom:8px;">
              📍 Hành lang Tầng 1
            </div>
            <div style="padding:10px; border-radius:8px; background:#334155; color:#E2E8F0; font-size:13px; margin-bottom:8px;">
              📍 Phòng Lab 302 AI
            </div>
            <div style="padding:10px; border-radius:8px; background:#334155; color:#E2E8F0; font-size:13px;">
              📍 Thư viện Số Tầng 2
            </div>
          </div>

          <!-- Main Panorama Viewport -->
          <div style="flex:1; position:relative; background:radial-gradient(circle at center, #1E293B 0%, #0F172A 100%); display:flex; align-items:center; justify-content:center;">
            <div style="font-size:80px; opacity:0.3;">🌐</div>
            
            <!-- Hotspot 1 -->
            <div style="position:absolute; top:35%; left:42%; text-align:center;">
              <div style="width:36px; height:36px; background:#F26F21; border-radius:50%; border:3px solid white; box-shadow:0 0 16px #F26F21; display:flex; align-items:center; justify-content:center; margin:0 auto; cursor:pointer;">
                <span>ℹ️</span>
              </div>
              <div style="margin-top:6px; background:rgba(15,23,42,0.85); padding:4px 10px; border-radius:6px; font-size:11px; font-weight:600; border:1px solid #F26F21;">
                Phòng Tư vấn Tuyển sinh
              </div>
            </div>

            <!-- Hotspot 2 -->
            <div style="position:absolute; top:48%; left:65%; text-align:center;">
              <div style="width:36px; height:36px; background:#2563EB; border-radius:50%; border:3px solid white; box-shadow:0 0 16px #2563EB; display:flex; align-items:center; justify-content:center; margin:0 auto; cursor:pointer;">
                <span>⬆️</span>
              </div>
              <div style="margin-top:6px; background:rgba(15,23,42,0.85); padding:4px 10px; border-radius:6px; font-size:11px; font-weight:600; border:1px solid #2563EB;">
                Lên Cầu thang Tầng 1
              </div>
            </div>

            <div style="position:absolute; bottom:16px; left:16px; background:rgba(15,23,42,0.8); border:1px solid #334155; padding:8px 14px; border-radius:8px; font-size:12px;">
              Góc nhìn: Pitch: <span style="color:#F26F21; font-weight:600;">-12.4°</span> | Yaw: <span style="color:#F26F21; font-weight:600;">84.6°</span> | FOV: 75°
            </div>
          </div>

          <!-- Right Properties Inspector -->
          <div style="width:280px; background:#1E293B; border-left:1px solid #334155; padding:20px; overflow-y:auto;">
            <div style="font-size:14px; font-weight:700; margin-bottom:14px; border-bottom:1px solid #334155; padding-bottom:8px;">Thuộc tính Hotspot</div>
            <div style="margin-bottom:14px;">
              <label style="font-size:12px; color:#94A3B8; display:block; margin-bottom:4px;">Loại Hotspot</label>
              <select style="width:100%; padding:8px; background:#0F172A; border:1px solid #475569; border-radius:6px; color:white; font-size:13px;">
                <option selected>Chuyển cảnh (Scene Link)</option>
                <option>Hộp thoại thông tin (Info Modal)</option>
                <option>Câu hỏi tương tác (Quiz)</option>
              </select>
            </div>
            <div style="margin-bottom:14px;">
              <label style="font-size:12px; color:#94A3B8; display:block; margin-bottom:4px;">Tiêu đề hiển thị</label>
              <input type="text" value="Phòng Tư vấn Tuyển sinh" style="width:100%; padding:8px; background:#0F172A; border:1px solid #475569; border-radius:6px; color:white; font-size:13px;">
            </div>
            <div style="margin-bottom:14px;">
              <label style="font-size:12px; color:#94A3B8; display:block; margin-bottom:4px;">Cảnh đích liên kết</label>
              <select style="width:100%; padding:8px; background:#0F172A; border:1px solid #475569; border-radius:6px; color:white; font-size:13px;">
                <option>Hành lang Tầng 1</option>
                <option>Phòng Lab 302 AI</option>
              </select>
            </div>
            <button class="btn btn-outline btn-sm" style="width:100%; color:#EF4444; border-color:#EF4444; margin-top:10px;">Xóa Hotspot này</button>
          </div>
        </div>
      </div>
    </body></html>
  `;
}
