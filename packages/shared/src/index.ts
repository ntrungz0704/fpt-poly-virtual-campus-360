// ==============================================================================
// Shared Types & Contracts — FPT Polytechnic Virtual Campus 360°
// ==============================================================================

export type CampusCode = 'HN' | 'DN' | 'HCM' | 'CT' | 'TN';

export interface CampusItem {
  id: string;
  code: CampusCode;
  name: string;
  city: string;
  address: string;
  hotline: string;
  email: string;
  isHeadquarter?: boolean;
}

export type UserRole = 
  | 'GUEST'
  | 'STUDENT'
  | 'PARENT'
  | 'TEACHER'
  | 'CONTENT_EDITOR'
  | 'EVENT_MANAGER'
  | 'ADMIN'
  | 'SUPER_ADMIN';

export interface UserProfile {
  id: string;
  username: string; // MSSV hoặc SĐT phụ huynh
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  campusId?: string;
  studentCode?: string; // Nếu là sinh viên
  parentPhone?: string; // Nếu là phụ huynh
  avatarUrl?: string;
  xpPoints?: number;
  levelTitle?: string;
}

export type HotspotType = 'scene' | 'location' | 'info' | 'interactive';

export interface Hotspot {
  id: string;
  sceneId: string;
  title: string;
  description?: string;
  yaw: number;   // Tọa độ góc nhìn ngang (degrees)
  pitch: number; // Tọa độ góc nhìn dọc (degrees)
  type: HotspotType;
  targetSceneId?: string;
  targetLocationId?: string;
  badge?: string;
  thumbnailUrl?: string;
  icon?: string;
}

export interface PanoramaScene {
  id: string;
  tourId: string;
  name: string;
  slug: string;
  locationId?: string;
  building: string;
  floor: string;
  imageUrl: string;
  thumbnailUrl: string;
  intro?: string;
  equipment?: string[];
  initialView: {
    yaw: number;
    pitch: number;
    fov: number;
  };
  hotspots: Hotspot[];
}

export interface BuildingInfo {
  id: string;
  code: string;
  name: string;
  campusCode: CampusCode;
  description: string;
  floorsCount: number;
  totalArea: string;
  model3dKey?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface LocationRoom {
  id: string;
  slug: string;
  name: string;
  code: string;
  category: string;
  building: string;
  floor: string;
  capacity: number;
  area: string;
  equipment: string[];
  sceneId?: string;
  imageUrl: string;
  status: 'active' | 'maintenance' | 'occupied';
}

export interface EventItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  date: string;
  location: string;
  summary: string;
  description: string;
  bannerUrl: string;
  capacity: number;
  registeredCount: number;
  isFeatured?: boolean;
}

export interface EventRegistrationRequest {
  eventId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  interestMajor: string;
  campusCode: CampusCode;
  notes?: string;
}

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  author: string;
  publishedAt: string;
  thumbnailUrl: string;
  featured?: boolean;
  relatedSceneSlug?: string;
  readTime: string;
}

export interface QuizQuestionItem {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  xpReward: number;
}

export interface QuizAttemptResult {
  userId?: string;
  totalQuestions: number;
  correctAnswers: number;
  totalXpEarned: number;
  timeSpentSeconds: number;
  completedAt: string;
}

export interface DashboardMetricOverview {
  totalVisitors: number;
  total360Views: number;
  openDayRegistrations: number;
  quizCompletions: number;
  activeHotspotsCount: number;
  avgEngagementDurationSeconds: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}
