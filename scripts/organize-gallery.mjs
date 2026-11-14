import fs from "node:fs";
import path from "node:path";

const targetDir = "E:/Virtual Campus FPT Poly/docs/ALL_PAGES_GALLERY";
fs.mkdirSync(targetDir, { recursive: true });

const srcScreenshots = "E:/Virtual Campus FPT Poly/docs/project-redesign-audit/screenshots";
const srcMockups = "E:/Virtual Campus FPT Poly/docs/project-redesign-audit/ui-mockups";

const pages = [
  // Public (01 - 09)
  { num: "01", name: "PUB_TrangChu_Homepage", slug: "home", hasMockup: "PUB-001_homepage.jpg" },
  { num: "02", name: "PUB_GioiThieu_About", slug: "about" },
  { num: "03", name: "PUB_LienHe_Contact", slug: "contact" },
  { num: "04", name: "PUB_SuKien_OpenDay_Events", slug: "events", hasMockup: "PUB-004_events.jpg" },
  { num: "05", name: "PUB_Minigame_VongQuay_Games", slug: "games" },
  { num: "06", name: "PUB_DanhSachDiaDiem_Locations", slug: "locations" },
  { num: "07", name: "PUB_ChiTietDiaDiem_LocationDetail", slug: "location-detail" },
  { num: "08", name: "PUB_TinTuc_News", slug: "news" },
  { num: "09", name: "PUB_ChiTietTinTuc_NewsDetail", slug: "news-detail" },

  // Auth (10 - 11)
  { num: "10", name: "AUTH_DangNhap_Login", slug: "login", hasMockup: "AUTH-001_login.jpg" },
  { num: "11", name: "AUTH_DoiMatKhau_ChangePassword", slug: "change-password" },

  // Immersive Campus (12 - 13)
  { num: "12", name: "CAMPUS_Tour360_ThucTeAo", slug: "campus" },
  { num: "13", name: "CAMPUS_BanDoSo_GIS_Map", slug: "map" },

  // Student Portal (14 - 18)
  { num: "14", name: "STUDENT_TongQuan_Portal", slug: "portal" },
  { num: "15", name: "STUDENT_HoSo_Profile", slug: "portal-profile" },
  { num: "16", name: "STUDENT_TienTrinh_XP_Progress", slug: "portal-progress" },
  { num: "17", name: "STUDENT_LichTrinh_Schedule", slug: "portal-schedule" },
  { num: "18", name: "STUDENT_VeOpenDay_QR_Tickets", slug: "portal-tickets" },

  // Parent Portal (19)
  { num: "19", name: "PARENT_CongPhuHuynh_Dashboard", slug: "parent" },

  // Admin CMS (20 - 25)
  { num: "20", name: "ADMIN_TongQuan_Dashboard", slug: "admin" },
  { num: "21", name: "ADMIN_QuanLySuKien_Events", slug: "admin-events" },
  { num: "22", name: "ADMIN_QuanLyDiaDiem_Locations", slug: "admin-locations" },
  { num: "23", name: "ADMIN_KhoThuVienAnh_Media", slug: "admin-media" },
  { num: "24", name: "ADMIN_QuanLyNguoiDung_Users", slug: "admin-users" },
  { num: "25", name: "ADMIN_StudioBienTapTour360_VirtualTour", slug: "admin-virtual-tour" }
];

let copied = 0;
for (const p of pages) {
  // Desktop
  const dtSrc = path.join(srcScreenshots, `desktop-1440__${p.slug}.png`);
  if (fs.existsSync(dtSrc)) {
    const dtDest = path.join(targetDir, `${p.num}_${p.name}__desktop-1440.png`);
    fs.copyFileSync(dtSrc, dtDest);
    copied++;
  }

  // Mobile
  const mbSrc = path.join(srcScreenshots, `mobile-390__${p.slug}.png`);
  if (fs.existsSync(mbSrc)) {
    const mbDest = path.join(targetDir, `${p.num}_${p.name}__mobile-390.png`);
    fs.copyFileSync(mbSrc, mbDest);
    copied++;
  }

  // Redesign Concept
  if (p.hasMockup) {
    const mkSrc = path.join(srcMockups, p.hasMockup);
    if (fs.existsSync(mkSrc)) {
      const mkDest = path.join(targetDir, `${p.num}_${p.name}__REDESIGN_CONCEPT.jpg`);
      fs.copyFileSync(mkSrc, mkDest);
      copied++;
    }
  }
}

console.log(`Successfully organized ${copied} image files into ${targetDir}`);
