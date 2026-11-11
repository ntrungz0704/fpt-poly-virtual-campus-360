import { OFFICIAL_CAMPUS_INFO } from "@/data/campus-data";

export interface CampusGuideArticle {
  slug: string;
  tag: string;
  date: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  relatedSceneId: string;
  content: string[];
}

export const CAMPUS_GUIDE_ARTICLES: CampusGuideArticle[] = [
  {
    slug: "huong-dan-tham-quan-qtsc-360",
    tag: "Hướng dẫn tham quan",
    date: "10/05/2026",
    title: "Hướng dẫn trải nghiệm Khuôn viên QTSC Quận 12 bằng Tour 360° & Bản đồ GIS",
    excerpt:
      "Cách di chuyển nhanh giữa 5 góc nhìn 360° thực tế tại Tòa Innovation, Thư viện số, Phòng Lab Tòa T và Studio Đồ họa Tòa F không cần đăng nhập.",
    imageUrl: "/images/locations/building-innovation.jpg",
    relatedSceneId: "cong-chao-qtsc",
    content: [
      `Virtual Campus 360° được thiết kế tập trung vào trải nghiệm không gian học tập thực tế của Trường Cao đẳng FPT Polytechnic tại ${OFFICIAL_CAMPUS_INFO.address}.`,
      "Khách tham quan có thể mở trực tiếp Tour 360° từ trang chủ hoặc thanh điều hướng trên cùng, xoay toàn cảnh để quan sát cấu trúc khuôn viên, sau đó chọn các điểm hotspot dẫn trực tiếp vào từng phòng chức năng.",
      "Ngoài ra, Bản đồ khuôn viên GIS (/map) hiển thị vị trí từng khối nhà Innovation, Tòa T, Tòa F, Tòa P và Khu Thể thao để bạn đối chiếu khoảng cách di chuyển trước khi tham gia sự kiện trực tiếp.",
    ],
  },
  {
    slug: "lich-trinh-open-day-tai-cvpm-quang-trung",
    tag: "Open Day 2026",
    date: "14/05/2026",
    title: "Trải nghiệm Tham quan 360° Tự do và Lịch trình Open Day Công khai",
    excerpt:
      "Thông tin thời khóa biểu công khai trên /events và định hướng không gian QTSC Quận 12 thông qua Bản đồ GIS và Tham quan 360°.",
    imageUrl: "/images/locations/auditorium-hall.jpg",
    relatedSceneId: "sanh-innovation",
    content: [
      `Sự kiện Open Day dự kiến diễn ra vào ${OFFICIAL_CAMPUS_INFO.openDayDateLabel} (${OFFICIAL_CAMPUS_INFO.openDayTimeLabel}) tại khu vực Sảnh Đón Tiếp và Hội trường Tòa Nhà Innovation.`,
      "Toàn bộ lịch trình các phiên công khai đều hiển thị rõ trên trang /events, kết hợp Bản đồ GIS và Tham quan 360° giúp khách tham quan tự do định hướng đường đi trước khi đến trường.",
      "Trong giai đoạn tích hợp Backend tiếp theo, Ban Tổ Chức sẽ bổ sung quy trình cấp và kích hoạt tài khoản mời Open Day qua liên kết một lần hoặc lời mời Email/SMS cho các chương trình chuyên biệt.",
    ],
  },
  {
    slug: "kham-pha-thu-vien-so-va-lab-thuc-hanh",
    tag: "Không gian học tập",
    date: "18/05/2026",
    title: "Điểm dừng mới trong Tour 360°: Thư viện Số T2, Lab CNTT T-301 và Studio iMac F-402",
    excerpt:
      "Cập nhật 3 góc nhìn nội thất chuẩn tỷ lệ 2:1 cùng chỉ dẫn hotspot kết nối liền mạch từ sảnh Innovation sang khu phòng thực hành.",
    imageUrl: "/images/locations/lab-it.jpg",
    relatedSceneId: "lab-it",
    content: [
      "Trong bản cập nhật giao diện Virtual Campus, các ảnh toàn cảnh đều được đồng bộ tỷ lệ equirectangular 2:1 (2048×1024) đặt trực tiếp trong gói nội bộ, loại bỏ hiện tượng gián đoạn kết nối ảnh ngoài.",
      "Tại Tòa Innovation tầng 2, Thư viện Số mở ra không gian tự học kết hợp các cabin họp nhóm. Từ đây, người xem có thể chuyển thẳng sang Phòng Thực hành Lập trình tại Tòa T hoặc Studio Đồ họa iMac tại Tòa F chỉ với một cú chạm vào hotspot.",
    ],
  },
];
