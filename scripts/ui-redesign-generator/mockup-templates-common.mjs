import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('e:/Virtual Campus FPT Poly/apps/web/node_modules/@playwright/test');

const baseDir = path.join(process.cwd(), 'docs', 'ui-redesign', 'images');

// Common CSS styles based on FPT Polytechnic Design System
const COMMON_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
  body { background-color: #F8FAFC; color: #0F172A; -webkit-font-smoothing: antialiased; }
  .bg-navy { background-color: #0F172A; }
  .bg-navy-light { background-color: #1E293B; }
  .bg-orange { background-color: #F26F21; }
  .text-orange { color: #F26F21; }
  .border-orange { border-color: #F26F21; }
  .card { background: white; border-radius: 14px; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.05); }
  .badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
  .badge-green { background: #DCFCE7; color: #166534; }
  .badge-orange { background: #FFEDD5; color: #C2410C; }
  .badge-blue { background: #DBEAFE; color: #1E40AF; }
  .badge-purple { background: #F3E8FF; color: #6B21A8; }
  .badge-gray { background: #F1F5F9; color: #475569; }
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600; border-radius: 8px; cursor: pointer; transition: all 0.2s; border: none; }
  .btn-primary { background: #F26F21; color: white; padding: 10px 18px; font-size: 14px; }
  .btn-outline { background: white; border: 1px solid #CBD5E1; color: #334155; padding: 8px 14px; font-size: 13px; }
  .btn-sm { padding: 6px 12px; font-size: 12px; }
  .sidebar-link { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 8px; color: #94A3B8; text-decoration: none; font-size: 14px; font-weight: 500; margin-bottom: 4px; }
  .sidebar-link.active { background: rgba(242, 111, 33, 0.15); color: #F26F21; font-weight: 600; }
  .stat-card { background: white; border-radius: 12px; padding: 18px; border: 1px solid #E2E8F0; }
  .stat-value { font-size: 26px; font-weight: 700; color: #0F172A; margin: 4px 0; }
  .table-custom { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
  .table-custom th { background: #F8FAFC; color: #64748B; padding: 12px 16px; font-weight: 600; border-bottom: 1px solid #E2E8F0; }
  .table-custom td { padding: 14px 16px; border-bottom: 1px solid #F1F5F9; vertical-align: middle; }
  .table-custom tr:hover { background: #F8FAFC; }
`;

function getAdminSidebar(activeSlug) {
  const items = [
    { slug: 'overview', name: 'Tổng quan Dashboard', icon: '📊' },
    { slug: 'events', name: 'Quản lý Sự kiện Open Day', icon: '📅' },
    { slug: 'locations', name: 'Địa điểm & Tòa nhà', icon: '🏛️' },
    { slug: 'media', name: 'Thư viện Media & 360', icon: '🖼️' },
    { slug: 'users', name: 'Người dùng & Phân quyền', icon: '👥' },
    { slug: 'tour-studio', name: 'Studio Biên tập Tour 360', icon: '🌐' },
    { slug: 'settings', name: 'Cài đặt Hệ thống', icon: '⚙️' },
  ];

  return `
    <div style="width: 250px; background: #0F172A; height: 100vh; display: flex; flex-direction: column; flex-shrink: 0; border-right: 1px solid #1E293B;">
      <div style="padding: 20px; border-bottom: 1px solid #1E293B; display: flex; align-items: center; gap: 12px;">
        <div style="width: 36px; height: 36px; background: #F26F21; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: white; font-size: 18px;">P</div>
        <div>
          <div style="font-weight: 700; color: white; font-size: 15px; letter-spacing: -0.2px;">FPT POLYTECHNIC</div>
          <div style="font-size: 11px; color: #94A3B8;">Admin CMS 360° Portal</div>
        </div>
      </div>
      <div style="padding: 16px 12px; flex: 1; overflow-y: auto;">
        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748B; padding: 0 12px 10px; letter-spacing: 0.5px;">Phân hệ Quản trị</div>
        ${items.map(it => `
          <a href="#" class="sidebar-link ${it.slug === activeSlug ? 'active' : ''}">
            <span style="font-size: 16px;">${it.icon}</span>
            <span>${it.name}</span>
          </a>
        `).join('')}
      </div>
      <div style="padding: 16px; border-top: 1px solid #1E293B; display: flex; align-items: center; gap: 10px;">
        <div style="width: 36px; height: 36px; border-radius: 50%; background: #F26F21; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700;">AD</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 13px; font-weight: 600; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Trần Trung</div>
          <div style="font-size: 11px; color: #F26F21; font-weight: 600;">Super Administrator</div>
        </div>
      </div>
    </div>
  `;
}

function getAdminHeader(breadcrumb, actionsHtml = '') {
  return `
    <div style="height: 64px; background: white; border-bottom: 1px solid #E2E8F0; padding: 0 28px; display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748B;">
        <span>FPT Poly CMS</span>
        <span>/</span>
        <span style="font-weight: 600; color: #0F172A;">${breadcrumb}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 16px;">
        <div style="background: #F1F5F9; border-radius: 8px; padding: 8px 14px; display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748B; width: 240px;">
          <span>🔍</span>
          <span>Tìm kiếm nhanh...</span>
        </div>
        ${actionsHtml}
        <div style="width: 36px; height: 36px; border-radius: 8px; background: #F1F5F9; display: flex; align-items: center; justify-content: center; position: relative;">
          <span>🔔</span>
          <div style="width: 8px; height: 8px; background: #EF4444; border-radius: 50%; position: absolute; top: 6px; right: 6px;"></div>
        </div>
      </div>
    </div>
  `;
}

export { COMMON_CSS, getAdminSidebar, getAdminHeader };
