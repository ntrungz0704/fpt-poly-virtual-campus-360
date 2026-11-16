import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('e:/Virtual Campus FPT Poly/apps/web/node_modules/@playwright/test');

import {
  getAdmin001Html,
  getAdmin002Html,
  getAdmin003Html,
  getAdmin004Html,
  getAdmin005Html,
  getAdmin006Html,
} from './ui-redesign-generator/admin-templates.mjs';

import {
  getAuth002Html,
  getPrnt001Html,
  getStud001Html,
  getStud002Html,
  getStud003Html,
  getStud004Html,
  getStud005Html,
  getCamp001Html,
} from './ui-redesign-generator/portal-and-campus-templates.mjs';

const RENDER_TASKS = [
  { id: 'ADMN-001', getHtml: getAdmin001Html, galleryPrefix: '20_ADMIN_TongQuan_Dashboard' },
  { id: 'ADMN-002', getHtml: getAdmin002Html, galleryPrefix: '21_ADMIN_QuanLySuKien_Events' },
  { id: 'ADMN-003', getHtml: getAdmin003Html, galleryPrefix: '22_ADMIN_QuanLyDiaDiem_Locations' },
  { id: 'ADMN-004', getHtml: getAdmin004Html, galleryPrefix: '23_ADMIN_KhoThuVienAnh_Media' },
  { id: 'ADMN-005', getHtml: getAdmin005Html, galleryPrefix: '24_ADMIN_QuanLyNguoiDung_Users' },
  { id: 'ADMN-006', getHtml: getAdmin006Html, galleryPrefix: '25_ADMIN_StudioBienTapTour360_VirtualTour' },
  { id: 'AUTH-002', getHtml: getAuth002Html, galleryPrefix: '11_AUTH_DoiMatKhau_ChangePassword' },
  { id: 'PRNT-001', getHtml: getPrnt001Html, galleryPrefix: '19_PARENT_CongPhuHuynh_Dashboard' },
  { id: 'STUD-001', getHtml: getStud001Html, galleryPrefix: '14_STUDENT_TongQuan_Portal' },
  { id: 'STUD-002', getHtml: getStud002Html, galleryPrefix: '15_STUDENT_HoSo_Profile' },
  { id: 'STUD-003', getHtml: getStud003Html, galleryPrefix: '16_STUDENT_TienTrinh_XP_Progress' },
  { id: 'STUD-004', getHtml: getStud004Html, galleryPrefix: '17_STUDENT_LichTrinh_Schedule' },
  { id: 'STUD-005', getHtml: getStud005Html, galleryPrefix: '18_STUDENT_VeOpenDay_QR_Tickets' },
  { id: 'CAMP-001', getHtml: getCamp001Html, galleryPrefix: '12_CAMPUS_Tour360_ThucTeAo' },
];

async function main() {
  console.log(`Starting bespoke UI image rendering for ${RENDER_TASKS.length} pages (28 images total)...`);
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  const baseImgDir = path.join(process.cwd(), 'docs', 'ui-redesign', 'images');
  const galleryDir = path.join(process.cwd(), 'docs', 'ALL_PAGES_GALLERY');

  for (const task of RENDER_TASKS) {
    const pageDir = path.join(baseImgDir, task.id);
    fs.mkdirSync(pageDir, { recursive: true });

    // 1. Desktop Render (1440x900)
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      const html = task.getHtml(false);
      await page.setContent(html, { waitUntil: 'load' });
      await page.waitForTimeout(200);

      const desktopPath = path.join(pageDir, 'desktop.png');
      await page.screenshot({ path: desktopPath });

      // Copy to gallery
      const galleryDesktop = path.join(galleryDir, `${task.galleryPrefix}__desktop-1440.png`);
      fs.copyFileSync(desktopPath, galleryDesktop);

      await context.close();
      const stat = fs.statSync(desktopPath);
      console.log(`✓ ${task.id} Desktop rendered: ${(stat.size / 1024).toFixed(1)} KB`);
    }

    // 2. Mobile Render (390x844)
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
      const page = await context.newPage();
      const html = task.getHtml(true);
      await page.setContent(html, { waitUntil: 'load' });
      await page.waitForTimeout(200);

      const mobilePath = path.join(pageDir, 'mobile.png');
      await page.screenshot({ path: mobilePath });

      // Copy to gallery
      const galleryMobile = path.join(galleryDir, `${task.galleryPrefix}__mobile-390.png`);
      fs.copyFileSync(mobilePath, galleryMobile);

      await context.close();
      const stat = fs.statSync(mobilePath);
      console.log(`✓ ${task.id} Mobile rendered: ${(stat.size / 1024).toFixed(1)} KB`);
    }
  }

  await browser.close();
  console.log('All bespoke images rendered and updated successfully!');
}

main().catch(err => {
  console.error('Fatal error during rendering:', err);
  process.exit(1);
});
