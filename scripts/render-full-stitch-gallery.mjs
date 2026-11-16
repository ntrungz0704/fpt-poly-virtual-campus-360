import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('e:/Virtual Campus FPT Poly/apps/web/node_modules/@playwright/test');

const PAGES = [
  // Public Website (01 - 09)
  { id: 'PUB-001', prefix: '01_PUB_TrangChu_Homepage', title: 'Trang chủ Virtual Campus 360°' },
  { id: 'PUB-002', prefix: '02_PUB_GioiThieu_About', title: 'Giới thiệu FPT Polytechnic' },
  { id: 'PUB-003', prefix: '03_PUB_LienHe_Contact', title: 'Liên hệ Tuyển sinh & Cơ sở' },
  { id: 'PUB-004', prefix: '04_PUB_SuKien_OpenDay_Events', title: 'Sự kiện Open Day 2026' },
  { id: 'PUB-005', prefix: '05_PUB_Minigame_VongQuay_Games', title: 'Minigame Vòng quay may mắn' },
  { id: 'PUB-006', prefix: '06_PUB_DanhSachDiaDiem_Locations', title: 'Danh mục Cơ sở & Phòng Lab' },
  { id: 'PUB-007', prefix: '07_PUB_ChiTietDiaDiem_LocationDetail', title: 'Chi tiết Địa điểm & Lab AI' },
  { id: 'PUB-008', prefix: '08_PUB_TinTuc_News', title: 'Tin tức & Hoạt động Campus' },
  { id: 'PUB-009', prefix: '09_PUB_ChiTietTinTuc_NewsDetail', title: 'Chi tiết Bài viết Tin tức' },

  // Authentication (10 - 11)
  { id: 'AUTH-001', prefix: '10_AUTH_DangNhap_Login', title: 'Đăng nhập tập trung (SSO)' },
  { id: 'AUTH-002', prefix: '11_AUTH_DoiMatKhau_ChangePassword', title: 'Đổi mật khẩu lần đầu' },

  // Immersive Virtual Campus (12 - 13)
  { id: 'CAMP-001', prefix: '12_CAMPUS_Tour360_ThucTeAo', title: 'Tour 360° Không gian thực tế ảo' },
  { id: 'CAMP-002', prefix: '13_CAMPUS_BanDoSo_GIS_Map', title: 'Bản đồ số GIS Campus' },

  // Student Portal (14 - 18)
  { id: 'STUD-001', prefix: '14_STUDENT_TongQuan_Portal', title: 'Cổng Sinh viên — Dashboard' },
  { id: 'STUD-002', prefix: '15_STUDENT_HoSo_Profile', title: 'Hồ sơ sinh viên & Thẻ điện tử' },
  { id: 'STUD-003', prefix: '16_STUDENT_TienTrinh_XP_Progress', title: 'Tiến độ học tập & Điểm XP' },
  { id: 'STUD-004', prefix: '17_STUDENT_LichTrinh_Schedule', title: 'Lịch sự kiện & Thời khóa biểu' },
  { id: 'STUD-005', prefix: '18_STUDENT_VeOpenDay_QR_Tickets', title: 'Vé mời Open Day & QR Code' },

  // Parent Portal (19)
  { id: 'PRNT-001', prefix: '19_PARENT_CongPhuHuynh_Dashboard', title: 'Cổng Phụ huynh theo dõi' },

  // Admin CMS (20 - 25)
  { id: 'ADMN-001', prefix: '20_ADMIN_TongQuan_Dashboard', title: 'Admin CMS — Tổng quan Dashboard' },
  { id: 'ADMN-002', prefix: '21_ADMIN_QuanLySuKien_Events', title: 'Admin CMS — Quản lý Sự kiện' },
  { id: 'ADMN-003', prefix: '22_ADMIN_QuanLyDiaDiem_Locations', title: 'Admin CMS — Quản lý Địa điểm & GIS' },
  { id: 'ADMN-004', prefix: '23_ADMIN_KhoThuVienAnh_Media', title: 'Admin CMS — Thư viện Media 360°' },
  { id: 'ADMN-005', prefix: '24_ADMIN_QuanLyNguoiDung_Users', title: 'Admin CMS — Phân quyền & Người dùng' },
  { id: 'ADMN-006', prefix: '25_ADMIN_StudioBienTapTour360_VirtualTour', title: 'Admin CMS — Studio Tour 360°' }
];

const CACHE_DIR = path.join(process.cwd(), 'docs', 'stitch-cache');
const UI_IMAGES_DIR = path.join(process.cwd(), 'docs', 'ui-redesign', 'images');
const GALLERY_DIR = path.join(process.cwd(), 'docs', 'ALL_PAGES_GALLERY');

fs.mkdirSync(UI_IMAGES_DIR, { recursive: true });
fs.mkdirSync(GALLERY_DIR, { recursive: true });

async function main() {
  console.log(`Starting high-fidelity rendering for all ${PAGES.length} pages (50 total images)...`);
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  let completedCount = 0;

  for (const pageItem of PAGES) {
    const htmlFile = path.join(CACHE_DIR, `${pageItem.id}.html`);
    if (!fs.existsSync(htmlFile)) {
      console.error(`Missing HTML file: ${htmlFile}`);
      continue;
    }
    const htmlContent = fs.readFileSync(htmlFile, 'utf8');

    const pageDir = path.join(UI_IMAGES_DIR, pageItem.id);
    fs.mkdirSync(pageDir, { recursive: true });

    // 1. Desktop Render (1440x900 viewport)
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle' });
      await page.waitForTimeout(100);

      const desktopTarget = path.join(pageDir, 'desktop.png');
      await page.screenshot({ path: desktopTarget });

      const galleryDesktop = path.join(GALLERY_DIR, `${pageItem.prefix}__desktop-1440.png`);
      fs.copyFileSync(desktopTarget, galleryDesktop);

      await context.close();
      const stat = fs.statSync(desktopTarget);
      console.log(`✓ [${pageItem.id}] Desktop (1440x900): ${(stat.size / 1024).toFixed(1)} KB`);
    }

    // 2. Mobile Render (390x844 viewport)
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
      const page = await context.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle' });
      await page.waitForTimeout(100);

      const mobileTarget = path.join(pageDir, 'mobile.png');
      await page.screenshot({ path: mobileTarget });

      const galleryMobile = path.join(GALLERY_DIR, `${pageItem.prefix}__mobile-390.png`);
      fs.copyFileSync(mobileTarget, galleryMobile);

      await context.close();
      const stat = fs.statSync(mobileTarget);
      console.log(`✓ [${pageItem.id}] Mobile (390x844): ${(stat.size / 1024).toFixed(1)} KB`);
    }

    completedCount++;
  }

  await browser.close();
  console.log(`\n🎉 All ${completedCount} pages (50 images) rendered and synchronized to docs/ui-redesign/images and docs/ALL_PAGES_GALLERY!`);
}

main().catch(err => {
  console.error('Fatal error during rendering:', err);
  process.exit(1);
});
