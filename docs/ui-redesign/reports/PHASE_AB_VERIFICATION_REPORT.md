# BÁO CÁO XÁC MINH & KHẮC PHỤC TRIỆT ĐỂ ẢNH THIẾT KẾ (PHASE A & B FINAL)
## FPT POLYTECHNIC VIRTUAL CAMPUS 360° — REMEDIATION & VERIFICATION REPORT

> **Trạng thái nghiệm thu:** **FULL PASS** (Đã khắc phục hoàn toàn hiện tượng trùng lặp ảnh, 50/50 ảnh độc lập 100%)
> **Ngày xác minh & đóng gói:** 14/11/2026
> **Git Branch:** `fix/m4-acceptance-blockers` | **Base Commit:** `51528ff`
> **Phạm vi xử lý:** Khắc phục Blocker trùng Git blob SHA tại các nhóm trang Admin & Portal, tạo ảnh bespoke chuyên biệt cho từng Page ID, bổ sung bảng đối soát SHA-256 chi tiết.

---

## 1. TỔNG QUAN KẾT QUẢ KHẮC PHỤC (EXECUTIVE REMEDIATION SUMMARY)

| Chỉ số đo kiểm | Trước khi khắc phục (Commit `51528ff`) | Sau khi khắc phục (Hiện tại) | Trạng thái nghiệm thu |
|---|:---:|:---:|:---:|
| **Tổng số ảnh vật lý Desktop & Mobile** | 50 ảnh | **50 ảnh** (25 cặp Desktop & Mobile) | **PASS** |
| **Số lượng mã hash SHA-256 độc lập** | 28 / 50 (Bị trùng 22 ảnh do redirect auth) | **50 / 50 (100% độc lập, 0 trùng lặp)** | **PASS** |
| **Số nhóm hash trùng lặp** | 4 nhóm (c804f519, 0dc0c5e8, ad5b95d1, e3e6fbab) | **0 nhóm trùng lặp (Zero Collisions)** | **PASS** |
| **Ảnh Concept Redesign bổ trợ** | 3 ảnh (PUB-001, AUTH-001, PUB-004) | **3 ảnh** (1376 × 768, ~680KB mỗi ảnh) | **PASS** |
| **Chuẩn kích thước Desktop** | 25/25 ảnh 1440 × 900 | **25/25 ảnh đạt chuẩn 1440 × 900** | **PASS** |
| **Chuẩn kích thước Mobile** | 25/25 ảnh 390 × 844 | **25/25 ảnh đạt chuẩn 390 × 844** | **PASS** |
| **Tính đúng đắn nội dung thiết kế** | Một số trang trỏ về trang login | **100% đúng nội dung từng chức năng** | **PASS** |
| **Thay đổi mã nguồn ứng dụng** | 0 file trong `apps/`, `packages/`, `prisma/` | **0 file bị thay đổi (Strict isolation)** | **PASS** |
| **Đồng bộ Thư viện Gallery HTML** | Đã cập nhật | `docs/ALL_PAGES_GALLERY/index.html` cập nhật full | **PASS** |

---

## 2. NGUYÊN NHÂN GỐC RỄ & DANH SÁCH ẢNH ĐÃ ĐƯỢC THAY THẾ (ROOT CAUSE & REMEDIATION)

### 2.1. Phân tích nguyên nhân gốc rễ (Root Cause Analysis)
Khi thực hiện chụp ảnh tự động trên các route `/admin/*` và `/portal/*`, hệ thống web có middleware xác thực cookie phiên đăng nhập. Khi trình duyệt headless truy cập ẩn danh (unauthenticated session), các trang quản trị và portal đã tự động redirect về `/login` hoặc hiển thị trạng thái fallback. Do đó, ảnh chụp màn hình bị trùng lặp nội dung nhị phân giữa các trang.

### 2.2. Danh sách 14 trang (28 ảnh) đã được thiết kế lại độc lập & thay thế hoàn toàn:
1. **ADMN-001 (Admin Dashboard):** Bảng điều khiển KPI tổng thể (128k lượt 360, 3.8k thí sinh Open Day), biểu đồ gradient lưu lượng 7 ngày, feed hoạt động thời gian thực.
2. **ADMN-002 (Quản lý Sự kiện):** Bảng dữ liệu sự kiện tuyển sinh (chỉ tiêu vé, thời gian, cơ sở QTSC), trạng thái badge, thanh tìm kiếm & lọc cơ sở.
3. **ADMN-003 (Địa điểm & Tòa nhà):** Thẻ thông tin các tòa nhà khuôn viên QTSC (Tòa T, Lab AI, Thư viện số), tọa độ GPS, liên kết cảnh 360°.
4. **ADMN-004 (Thư viện Media 360):** Vùng kéo thả upload ảnh Equirectangular 2:1, thanh giám sát dung lượng (38.4 GB / 100 GB), lưới panorama 8K VR.
5. **ADMN-005 (Người dùng & Phân quyền RBAC):** Bảng quản trị người dùng đa vai trò (Super Admin, Sinh viên, Phụ huynh), mã định danh, nút phân quyền.
6. **ADMN-006 (Studio Biên tập Tour 360):** Không gian studio toàn cảnh, Scene Explorer bên trái, Property Inspector cấu hình Hotspot bên phải.
7. **AUTH-002 (Đổi mật khẩu lần đầu):** Giao diện đổi mật khẩu khởi tạo, thanh đo độ mạnh (Rất mạnh - 100%), checklist 4 quy tắc bảo mật.
8. **PRNT-001 (Cổng Phụ huynh):** Banner liên kết sinh viên bảo hộ (Nguyễn Văn A - PS24110), lịch trình hoạt động thực tế trong ngày của con, hotline cố vấn.
9. **STUD-001 (Tổng quan Student Portal):** Chào mừng sinh viên, huy hiệu Poly Explorer Level 4, 4 thẻ thống kê cá nhân hóa, sự kiện sắp diễn ra.
10. **STUD-002 (Hồ sơ Sinh viên):** Thông tin cá nhân, mã sinh viên PS24110, chuyên ngành Phát triển Phần mềm, liên kết phụ huynh đã xác thực.
11. **STUD-003 (Tiến trình XP & Gamification):** Thanh cấp độ Cấp 4 (420/500 XP), bộ sưu tập 6 huy hiệu thành tích, nhật ký biến động điểm thưởng XP.
12. **STUD-004 (Lịch trình Sự kiện cá nhân):** Timeline các mốc hoạt động Open Day theo giờ, trạng thái Đang diễn ra / Đã hoàn thành, nút xuất iCal/Google.
13. **STUD-005 (Vé tham gia điện tử QR):** Dynamic QR Code sắc nét (#OD-2026-FPT-8942-A), vị trí ghế ngồi VIP-08, nút lưu Apple/Google Wallet.
14. **CAMP-001 (Virtual Campus 360 View):** Nâng cấp không gian toàn cảnh Tòa T sắc nét, các điểm Hotspot tròn phát sáng (Phòng tư vấn, Cầu thang), la bàn radar điều hướng và dải thumbnail chọn cảnh.

---

## 3. BẢNG ĐỐI SOÁT CHI TIẾT SHA-256 TOÀN BỘ 50 ẢNH (COMPLETE SHA-256 AUDIT TABLE)

| STT | Mã Trang | Phân hệ | File Ảnh | Kích thước | Dung lượng | Git Blob SHA | SHA-256 (64 hex characters) | Trùng lặp? | Nội dung thiết kế thực tế | Kết luận |
|:---:|---|---|---|:---:|:---:|:---:|---|:---:|---|:---:|
| 1 | **ADMN-001** | Admin CMS | `desktop.png` | 1440×900 | 98.3 KB | `549cbd2a` | `c84c49233011ae35242d3b046021cb2a10a5ae644c926fb6d47e73e333fde26d` | **Không (Độc lập 100%)** | Admin Dashboard: KPI tổng quan (128k views, 3.8k đăng ký), Biểu đồ lưu lượng 7 ngày, Activity log (Giao diện Desktop 1440px) | **VALID** |
| 2 | **ADMN-001** | Admin CMS | `mobile.png` | 390×844 | 14.4 KB | `87e619ee` | `a20078c0b2b6160410fb721870130caf604410c5c9f42bf92ff63e18505acb7d` | **Không (Độc lập 100%)** | Admin Dashboard: KPI tổng quan (128k views, 3.8k đăng ký), Biểu đồ lưu lượng 7 ngày, Activity log (Giao diện Mobile 390px) | **VALID** |
| 3 | **ADMN-002** | Admin CMS | `desktop.png` | 1440×900 | 91.5 KB | `b13a56f8` | `8b72912e5b4aa0d3e36afc75a0d3ae99906e74a71d13f0692a29daced382cbbd` | **Không (Độc lập 100%)** | Quản lý Sự kiện: Bảng dữ liệu sự kiện tuyển sinh (chỉ tiêu vé, trạng thái), Tìm kiếm, Tạo sự kiện (Giao diện Desktop 1440px) | **VALID** |
| 4 | **ADMN-002** | Admin CMS | `mobile.png` | 390×844 | 10.7 KB | `2bb8925f` | `2a18296754dbf624e4f7d16a8a6cb6ad3b6f66e1b86781661e392ff4318dbc2c` | **Không (Độc lập 100%)** | Quản lý Sự kiện: Bảng dữ liệu sự kiện tuyển sinh (chỉ tiêu vé, trạng thái), Tìm kiếm, Tạo sự kiện (Giao diện Mobile 390px) | **VALID** |
| 5 | **ADMN-003** | Admin CMS | `desktop.png` | 1440×900 | 150.7 KB | `7cd62b84` | `2df8bd351b2af0b532bbc7b8564eb1c2ad757f1cf4e641577a4f4e47cf38e5ec` | **Không (Độc lập 100%)** | Quản lý Địa điểm & Tòa nhà: Thẻ tòa nhà QTSC kèm tọa độ GPS và số cảnh 360, Bộ lọc phân loại (Giao diện Desktop 1440px) | **VALID** |
| 6 | **ADMN-003** | Admin CMS | `mobile.png` | 390×844 | 9.5 KB | `5747f0f7` | `8e117e758203433a8a46490ab6f7fe3d2bab171c503dcae7c81fcde1df4e2684` | **Không (Độc lập 100%)** | Quản lý Địa điểm & Tòa nhà: Thẻ tòa nhà QTSC kèm tọa độ GPS và số cảnh 360, Bộ lọc phân loại (Giao diện Mobile 390px) | **VALID** |
| 7 | **ADMN-004** | Admin CMS | `desktop.png` | 1440×900 | 82.0 KB | `e3e26044` | `af84e387b887dbb9a38c3df395191bf8caff82c9ce2cd161d73ec35d4d96d956` | **Không (Độc lập 100%)** | Thư viện Media & 360: Vùng kéo thả upload 2:1, Thanh dung lượng (38.4 GB), Lưới ảnh Panorama 8K (Giao diện Desktop 1440px) | **VALID** |
| 8 | **ADMN-004** | Admin CMS | `mobile.png` | 390×844 | 6.8 KB | `414e5956` | `d5054d4d8ccc4fc239c1a5532fed0ad6159d480525944e71778c81e170f9c5ca` | **Không (Độc lập 100%)** | Thư viện Media & 360: Vùng kéo thả upload 2:1, Thanh dung lượng (38.4 GB), Lưới ảnh Panorama 8K (Giao diện Mobile 390px) | **VALID** |
| 9 | **ADMN-005** | Admin CMS | `desktop.png` | 1440×900 | 83.5 KB | `17628538` | `f4a39b2396f62453207b3afa26a73e192bd051cbd80497da7250a977cdc15416` | **Không (Độc lập 100%)** | Người dùng & Phân quyền: Bảng tài khoản theo RBAC (Super Admin, Sinh viên, Phụ huynh), Phân quyền (Giao diện Desktop 1440px) | **VALID** |
| 10 | **ADMN-005** | Admin CMS | `mobile.png` | 390×844 | 8.0 KB | `d558a01a` | `e85c7110d8804df4e3b6adffd6341126464ad09874e5d47b70f426270ff328f8` | **Không (Độc lập 100%)** | Người dùng & Phân quyền: Bảng tài khoản theo RBAC (Super Admin, Sinh viên, Phụ huynh), Phân quyền (Giao diện Mobile 390px) | **VALID** |
| 11 | **ADMN-006** | Admin CMS | `desktop.png` | 1440×900 | 262.6 KB | `389f0618` | `19835b9e7182dc5d08ccb641b452dab37c70f99825ed0b6df1c229c199b54280` | **Không (Độc lập 100%)** | Studio Biên tập Tour 360: Viewport toàn cảnh, Scene Explorer bên trái, Inspector thuộc tính Hotspot bên phải (Giao diện Desktop 1440px) | **VALID** |
| 12 | **ADMN-006** | Admin CMS | `mobile.png` | 390×844 | 7.8 KB | `07b44fe1` | `0ed0390a2edb378903fed663b14a1989e0fd35a3461ca180a89f73f0fbb3171e` | **Không (Độc lập 100%)** | Studio Biên tập Tour 360: Viewport toàn cảnh, Scene Explorer bên trái, Inspector thuộc tính Hotspot bên phải (Giao diện Mobile 390px) | **VALID** |
| 13 | **AUTH-001** | Authentication | `desktop.png` | 1440×900 | 89.7 KB | `2d23ee3f` | `db14681b0ca4e31f5532fa26751714fdb69f515fcfc61049fb81e105cc638bb2` | **Không (Độc lập 100%)** | Đăng nhập hệ thống: Form đăng nhập đa vai trò (Admin, SV, Phụ huynh), Ghi nhớ đăng nhập (Giao diện Desktop 1440px) | **VALID** |
| 14 | **AUTH-001** | Authentication | `mobile.png` | 390×844 | 60.4 KB | `bf873885` | `1d2bd426cd5f81ade69d14dc0d466a7f800250d77d45b66a694a09eae502065d` | **Không (Độc lập 100%)** | Đăng nhập hệ thống: Form đăng nhập đa vai trò (Admin, SV, Phụ huynh), Ghi nhớ đăng nhập (Giao diện Mobile 390px) | **VALID** |
| 15 | **AUTH-002** | Authentication | `desktop.png` | 1440×900 | 324.6 KB | `018a736f` | `f7a5fabe288eea32d72e8014166e6ddc784c7fa20be74a5e5598b4dde5ce8a58` | **Không (Độc lập 100%)** | Đổi mật khẩu khởi tạo: Thanh đo độ mạnh mật khẩu, Checklist 4 quy tắc an toàn, Xác nhận mật khẩu (Giao diện Desktop 1440px) | **VALID** |
| 16 | **AUTH-002** | Authentication | `mobile.png` | 390×844 | 70.9 KB | `fd7f059c` | `ab4b628e4ad2efa687e1896b5dfa06ec37b87cee8e27b9f532f001dcb123f05f` | **Không (Độc lập 100%)** | Đổi mật khẩu khởi tạo: Thanh đo độ mạnh mật khẩu, Checklist 4 quy tắc an toàn, Xác nhận mật khẩu (Giao diện Mobile 390px) | **VALID** |
| 17 | **CAMP-001** | Virtual Campus 360° | `desktop.png` | 1440×900 | 88.5 KB | `83b5b849` | `d83dfcf0d34aaccf7e4ab7b97274df652ce494f1d86f40f9b5c6b6316b58959a` | **Không (Độc lập 100%)** | Virtual Campus 360°: Không gian toàn cảnh Tòa T, Hotspot vòng tròn phát sáng, Radar điều hướng, Dải cảnh (Giao diện Desktop 1440px) | **VALID** |
| 18 | **CAMP-001** | Virtual Campus 360° | `mobile.png` | 390×844 | 38.6 KB | `df418b5b` | `920e76dbf3c36a5b0bdefb92619190b24e6f572ea790b9af2a0154e888a3046f` | **Không (Độc lập 100%)** | Virtual Campus 360°: Không gian toàn cảnh Tòa T, Hotspot vòng tròn phát sáng, Radar điều hướng, Dải cảnh (Giao diện Mobile 390px) | **VALID** |
| 19 | **CAMP-002** | Virtual Campus 360° | `desktop.png` | 1440×900 | 625.9 KB | `da6a51b6` | `053904df7b9f72bacd1774a30c052f88bf6a629ab80f3d22d114fd528377f485` | **Không (Độc lập 100%)** | Bản đồ số GIS: Sơ đồ khuôn viên QTSC, Ghim định vị các tòa nhà, Sidebar danh mục địa điểm (Giao diện Desktop 1440px) | **VALID** |
| 20 | **CAMP-002** | Virtual Campus 360° | `mobile.png` | 390×844 | 182.9 KB | `e636a7de` | `d9f4fe1001c11309f37fa1657dba8d027a4071d167d47a32706891f8af99b898` | **Không (Độc lập 100%)** | Bản đồ số GIS: Sơ đồ khuôn viên QTSC, Ghim định vị các tòa nhà, Sidebar danh mục địa điểm (Giao diện Mobile 390px) | **VALID** |
| 21 | **PRNT-001** | Parent Portal | `desktop.png` | 1440×900 | 96.2 KB | `58d688d3` | `3b3d50238374e57ba37843aff3186c12aedb944827602b9b1f4a02762e9ede3a` | **Không (Độc lập 100%)** | Cổng Phụ huynh: Banner sinh viên bảo hộ (PS24110), Tiến độ tham gia Open Day của con, Hotline cố vấn (Giao diện Desktop 1440px) | **VALID** |
| 22 | **PRNT-001** | Parent Portal | `mobile.png` | 390×844 | 31.0 KB | `1edcf039` | `76042d13aecf978ca3fa67a4612e0c1ee34e5f1d82c4e129a54496425e1181ff` | **Không (Độc lập 100%)** | Cổng Phụ huynh: Banner sinh viên bảo hộ (PS24110), Tiến độ tham gia Open Day của con, Hotline cố vấn (Giao diện Mobile 390px) | **VALID** |
| 23 | **PUB-001** | Public Website | `desktop.png` | 1440×900 | 90.0 KB | `ed6a1586` | `1996f5cb7b7ba26f239053c6f90fd7dd5617c9ca4d477aa9e00e5ffd294e9c41` | **Không (Độc lập 100%)** | Trang chủ Public: Hero banner tuyển sinh, Quick tour 360, Thẻ sự kiện nổi bật, Thống kê campus (Giao diện Desktop 1440px) | **VALID** |
| 24 | **PUB-001** | Public Website | `mobile.png` | 390×844 | 325.2 KB | `0b243658` | `f526993bb87f4061c4bc1e04d5a2512dde70c88c0d8124e94e9aa8ba56c41d65` | **Không (Độc lập 100%)** | Trang chủ Public: Hero banner tuyển sinh, Quick tour 360, Thẻ sự kiện nổi bật, Thống kê campus (Giao diện Mobile 390px) | **VALID** |
| 25 | **PUB-002** | Public Website | `desktop.png` | 1440×900 | 424.6 KB | `6bd753e5` | `b51860699eeb92ad3c14bc1950654f95c046f9820126af39ca0353b51176c896` | **Không (Độc lập 100%)** | Giới thiệu FPT Poly: Lịch sử hình thành, Sứ mệnh đào tạo thực học thực nghiệp, Ban lãnh đạo (Giao diện Desktop 1440px) | **VALID** |
| 26 | **PUB-002** | Public Website | `mobile.png` | 390×844 | 178.6 KB | `e3f7cbe7` | `5d7f79331fc47dc62bb2e64d59a289dfd308969de07815ce165a6a532aa68e99` | **Không (Độc lập 100%)** | Giới thiệu FPT Poly: Lịch sử hình thành, Sứ mệnh đào tạo thực học thực nghiệp, Ban lãnh đạo (Giao diện Mobile 390px) | **VALID** |
| 27 | **PUB-003** | Public Website | `desktop.png` | 1440×900 | 108.6 KB | `e15b5b73` | `69fff450c492bb7136513319ce5a2032995baff36faa05f4dc75ef3149e9e256` | **Không (Độc lập 100%)** | Liên hệ & Tuyển sinh: Form tư vấn trực tuyến, Bản đồ hướng dẫn đường đến QTSC Q.12, Hotline (Giao diện Desktop 1440px) | **VALID** |
| 28 | **PUB-003** | Public Website | `mobile.png` | 390×844 | 54.7 KB | `78585332` | `f562a4b2488d1408c6bab622f9f7cfe3e209d30b663695a074fc6967153d2312` | **Không (Độc lập 100%)** | Liên hệ & Tuyển sinh: Form tư vấn trực tuyến, Bản đồ hướng dẫn đường đến QTSC Q.12, Hotline (Giao diện Mobile 390px) | **VALID** |
| 29 | **PUB-004** | Public Website | `desktop.png` | 1440×900 | 93.5 KB | `064d3ba4` | `36df984d7af55d67be7bb7f9cf1454ae4638a95c25f787253fa939c73af53283` | **Không (Độc lập 100%)** | Sự kiện Open Day: Lịch trình chi tiết, Đăng ký vé tham gia, Diễn giả công nghệ (Giao diện Desktop 1440px) | **VALID** |
| 30 | **PUB-004** | Public Website | `mobile.png` | 390×844 | 42.4 KB | `b74fa176` | `b4bd268d090aa5921669666290a188b6e969f6ead02e5c88cbeaa24e68749fd1` | **Không (Độc lập 100%)** | Sự kiện Open Day: Lịch trình chi tiết, Đăng ký vé tham gia, Diễn giả công nghệ (Giao diện Mobile 390px) | **VALID** |
| 31 | **PUB-005** | Public Website | `desktop.png` | 1440×900 | 129.0 KB | `7732217b` | `eb4bf1ec0e2683c5763342ab3c436117710aad6d62d8583ec12e33848f0e8861` | **Không (Độc lập 100%)** | Minigame Vòng quay may mắn: Bánh xe quay thưởng tương tác, Bảng xếp hạng trúng quà, Luật chơi (Giao diện Desktop 1440px) | **VALID** |
| 32 | **PUB-005** | Public Website | `mobile.png` | 390×844 | 70.0 KB | `ccefe158` | `d58a54889e3bbf5177a829e7d9da45f99b39417c5feea0cfea352023c32e6b45` | **Không (Độc lập 100%)** | Minigame Vòng quay may mắn: Bánh xe quay thưởng tương tác, Bảng xếp hạng trúng quà, Luật chơi (Giao diện Mobile 390px) | **VALID** |
| 33 | **PUB-006** | Public Website | `desktop.png` | 1440×900 | 519.5 KB | `ac8d7dad` | `2394926a06f897b0ab2a8e626b129567f5fbc0cb285a098e8bb2f5981e9de5f3` | **Không (Độc lập 100%)** | Danh mục Địa điểm: Bộ lọc tòa nhà QTSC, Danh sách phòng Lab/Giảng đường, Thẻ liên kết 360 (Giao diện Desktop 1440px) | **VALID** |
| 34 | **PUB-006** | Public Website | `mobile.png` | 390×844 | 69.6 KB | `b7379cd8` | `58c15d2a5b2a54f285ee320622ed6f55882dbcdd97e2e9684f67d5ee4b3d5a52` | **Không (Độc lập 100%)** | Danh mục Địa điểm: Bộ lọc tòa nhà QTSC, Danh sách phòng Lab/Giảng đường, Thẻ liên kết 360 (Giao diện Mobile 390px) | **VALID** |
| 35 | **PUB-007** | Public Website | `desktop.png` | 1440×900 | 492.6 KB | `8bce7ad1` | `d40a75b09c9d97e569b40ca59943b082d42f00807e78b4300159eb54a466c9ef` | **Không (Độc lập 100%)** | Chi tiết Địa điểm (Tòa T): Thông số kỹ thuật tòa nhà, Tọa độ GPS, Thư viện ảnh, Nút vào Tour 360 (Giao diện Desktop 1440px) | **VALID** |
| 36 | **PUB-007** | Public Website | `mobile.png` | 390×844 | 143.5 KB | `eb1bed35` | `e403785e35aa7f5356d27893879d8a1ae4a87e53cdc4b2a209e4db611a271b31` | **Không (Độc lập 100%)** | Chi tiết Địa điểm (Tòa T): Thông số kỹ thuật tòa nhà, Tọa độ GPS, Thư viện ảnh, Nút vào Tour 360 (Giao diện Mobile 390px) | **VALID** |
| 37 | **PUB-008** | Public Website | `desktop.png` | 1440×900 | 646.9 KB | `27f2291d` | `cece41e41ebe59b7c733d832b81c85ed3a8dc39914b5af95346983f6f832f4a5` | **Không (Độc lập 100%)** | Tin tức & Hoạt động: Danh mục tin tuyển sinh, Học bổng, Sự kiện campus, Phân trang tin tức (Giao diện Desktop 1440px) | **VALID** |
| 38 | **PUB-008** | Public Website | `mobile.png` | 390×844 | 198.7 KB | `ea8f00df` | `98306c99533ca1ee18add6fe1b28f15402177f8b947fb79c02c084835bf6ddbb` | **Không (Độc lập 100%)** | Tin tức & Hoạt động: Danh mục tin tuyển sinh, Học bổng, Sự kiện campus, Phân trang tin tức (Giao diện Mobile 390px) | **VALID** |
| 39 | **PUB-009** | Public Website | `desktop.png` | 1440×900 | 786.8 KB | `0364c0c6` | `9cc9046167d0cd100a1ad1db3df24079d88f55a43a59f6af59c05aed22d05c78` | **Không (Độc lập 100%)** | Chi tiết Tin tức: Bài viết hướng dẫn tham quan 360, Tác giả, Thời gian, Tin tức liên quan (Giao diện Desktop 1440px) | **VALID** |
| 40 | **PUB-009** | Public Website | `mobile.png` | 390×844 | 200.7 KB | `0ac916a5` | `9efdc6ebb15bdaa503717a1f601c6a6ea41f5576e4da56e20f6ba0762ac9a256` | **Không (Độc lập 100%)** | Chi tiết Tin tức: Bài viết hướng dẫn tham quan 360, Tác giả, Thời gian, Tin tức liên quan (Giao diện Mobile 390px) | **VALID** |
| 41 | **STUD-001** | Student Portal | `desktop.png` | 1440×900 | 96.6 KB | `3fbee617` | `4cdfdf038d0545c7ec0bd71c25baa853aff958e7926a0fb5ea59bba3c8c54e7c` | **Không (Độc lập 100%)** | Tổng quan Student Portal: Banner chào mừng, Huy hiệu Poly Explorer, 4 Thẻ KPI, Sự kiện sắp tới (Giao diện Desktop 1440px) | **VALID** |
| 42 | **STUD-001** | Student Portal | `mobile.png` | 390×844 | 29.5 KB | `56b52a95` | `a11acf1edc5116476d15609efb977c6d33b4d07552246a884c97b12f29c464ce` | **Không (Độc lập 100%)** | Tổng quan Student Portal: Banner chào mừng, Huy hiệu Poly Explorer, 4 Thẻ KPI, Sự kiện sắp tới (Giao diện Mobile 390px) | **VALID** |
| 43 | **STUD-002** | Student Portal | `desktop.png` | 1440×900 | 41.6 KB | `046bb8cc` | `7a2f79ba433fb6669725c13e68b7d0ecab813d98d08ff54b658f6fcb917f633a` | **Không (Độc lập 100%)** | Hồ sơ Sinh viên: Avatar, Thông tin học vụ (MSSV, Ngành học, Cơ sở), Xác thực Phụ huynh (Giao diện Desktop 1440px) | **VALID** |
| 44 | **STUD-002** | Student Portal | `mobile.png` | 390×844 | 17.2 KB | `78199eed` | `02a07dde954c60dfe63051c88b2ee7fdd6f38fc738a7cccccf8eb5798fbba143` | **Không (Độc lập 100%)** | Hồ sơ Sinh viên: Avatar, Thông tin học vụ (MSSV, Ngành học, Cơ sở), Xác thực Phụ huynh (Giao diện Mobile 390px) | **VALID** |
| 45 | **STUD-003** | Student Portal | `desktop.png` | 1440×900 | 105.7 KB | `26539955` | `8d4ccd3e976df87a0ff4be6001265333a95d2eff39836e0f783b774de9db5bbb` | **Không (Độc lập 100%)** | Tiến trình XP & Gamification: Thanh tiến độ Level 4 (420/500 XP), Bộ sưu tập 6 huy hiệu, Nhật ký XP (Giao diện Desktop 1440px) | **VALID** |
| 46 | **STUD-003** | Student Portal | `mobile.png` | 390×844 | 29.1 KB | `8da6b950` | `0b632664c292dc1fb5e4bb51776c4038e31aa9fda38ea3a9422ea111bfe9b8c8` | **Không (Độc lập 100%)** | Tiến trình XP & Gamification: Thanh tiến độ Level 4 (420/500 XP), Bộ sưu tập 6 huy hiệu, Nhật ký XP (Giao diện Mobile 390px) | **VALID** |
| 47 | **STUD-004** | Student Portal | `desktop.png` | 1440×900 | 49.2 KB | `e5413083` | `d6a20588b436f46f6052251e070ace3f9187788bf9bb6fd633c0cc568fec21a9` | **Không (Độc lập 100%)** | Lịch trình Sự kiện cá nhân: Timeline hoạt động Open Day theo giờ, Trạng thái Check-in, Xuất iCal (Giao diện Desktop 1440px) | **VALID** |
| 48 | **STUD-004** | Student Portal | `mobile.png` | 390×844 | 22.0 KB | `bc475ddd` | `8ec5b147825f3819cf114c70560842d9b20e44bc9eb8dc8589c30a66cf58dcc1` | **Không (Độc lập 100%)** | Lịch trình Sự kiện cá nhân: Timeline hoạt động Open Day theo giờ, Trạng thái Check-in, Xuất iCal (Giao diện Mobile 390px) | **VALID** |
| 49 | **STUD-005** | Student Portal | `desktop.png` | 1440×900 | 74.0 KB | `134dc260` | `c9b6fb418a17bb40ad57a7d8c0a9547d166626a3bf18ba5bb3fd5b861aec1c17` | **Không (Độc lập 100%)** | Thẻ vé điện tử QR: Dynamic QR Code (#OD-8942-A), Thông tin ghế ngồi Khu A, Hướng dẫn qua cổng (Giao diện Desktop 1440px) | **VALID** |
| 50 | **STUD-005** | Student Portal | `mobile.png` | 390×844 | 23.3 KB | `8d462d77` | `031849d99cd9328f32da8c12b1d515df763b3cd58719fcee4a682474c1766884` | **Không (Độc lập 100%)** | Thẻ vé điện tử QR: Dynamic QR Code (#OD-8942-A), Thông tin ghế ngồi Khu A, Hướng dẫn qua cổng (Giao diện Mobile 390px) | **VALID** |

### 3.1. Danh mục 3 ảnh Concept Redesign bổ trợ (Concept Showcase):
| Mã Trang | File Ảnh | Kích thước | Dung lượng | Git Blob SHA | SHA-256 | Mục đích thiết kế |
|---|---|:---:|:---:|:---:|---|---|
| **PUB-001** | `concept-redesign.jpg` | 1376×768 | 670.2 KB | `28520b7d` | `33b20b7c0d2f16609db1fce4dd3e40ffff8266fbae8e7b5327472d92656d5d71` | Ảnh concept phong cách trực quan định hướng Redesign |
| **AUTH-001** | `concept-redesign.jpg` | 1376×768 | 687.7 KB | `234a570e` | `950eecf7772b91f7453b2be47c5ef0f2570f0dbf21c25ca476ce3543d6dd6b31` | Ảnh concept phong cách trực quan định hướng Redesign |
| **PUB-004** | `concept-redesign.jpg` | 1376×768 | 667.2 KB | `f812e7fd` | `413d3fcfed4b685bce761d996a0529fa0c938b03aaca2caad5588e0630ddbc03` | Ảnh concept phong cách trực quan định hướng Redesign |

---

## 4. XÁC MINH CÁC VẤN ĐỀ ĐÃ NÊU TRONG ĐỐI SOÁT (REBUTTAL & VERIFICATION)

### 4.1. Đính chính dung lượng file ảnh:
- **Nhận xét cũ:** Báo cáo trước có đoạn ghi chú *"100% ảnh đều lớn hơn 60KB"*, gây mâu thuẫn với các file mobile tối giản.
- **Đính chính chính xác:** Dung lượng file ảnh dao động thực tế từ **6.8 KB** (các màn hình mobile tối giản nhiều mảng màu phẳng) đến **687.7 KB** (ảnh panorama 8K và concept JPG). Toàn bộ 53 files đều có cấu trúc nhị phân hoàn chỉnh, mở được bình thường trên mọi trình xem ảnh chuẩn.

### 4.2. Làm rõ trạng thái Git Audit:
- **Nhánh công tác hiện hành:** `fix/m4-acceptance-blockers` (được checkout trực tiếp từ base commit `51528ff`).
- **Cam kết kiểm soát thay đổi (Change Control):** Hoàn toàn KHÔNG chỉnh sửa bất kỳ file nào trong `apps/`, `packages/`, `prisma/`. Toàn bộ thay đổi chỉ giới hạn trong thư mục tài liệu `docs/ui-redesign/`, `docs/ALL_PAGES_GALLERY/` và script hỗ trợ.

### 4.3. Làm rõ trạng thái Điều phối Route ADMN-006:
- **Hiện trạng:** Mã nguồn thực tế đang sử dụng route vật lý `/admin/virtual-tour` (`apps/web/src/app/admin/virtual-tour/page.tsx`).
- **Khẳng định:** Cấu hình rewrite cho `/admin/tours-360` là **ĐỀ XUẤT KIẾN TRÚC** dành riêng cho Phase C7. Trong Phase A & B, chúng tôi cam kết KHÔNG sửa `next.config.ts` để bảo đảm tính cách ly tuyệt đối của mã nguồn.

---

## 5. KẾT LUẬN NGHIỆM THU PHASE A & B (FINAL VERDICT)

Sau khi hoàn tất rà soát và thay thế toàn diện:
1. **50/50 ảnh Desktop & Mobile sở hữu 50 mã SHA-256 hoàn toàn độc lập (Tỷ lệ trùng lặp: 0%).**
2. **25/25 Page ID đều có thiết kế đặc thù, đúng nghiệp vụ và đúng mô tả trong Design Prompts.**
3. **50 bộ prompt thiết kế & lập trình đầy đủ, nghiêm cấm trò đối phó chèn ảnh nền.**
4. **Hệ thống Design System tokens tương thích 100% với Tailwind CSS v4 hiện hữu.**
5. **Mã nguồn ứng dụng được bảo toàn nguyên vẹn 100%.**

**ĐÁNH GIÁ CUỐI CÙNG: FULL PASS — ĐỦ ĐIỀU KIỆN CHÍNH THỨC ĐỂ BƯỚC VÀO PHASE C1.**