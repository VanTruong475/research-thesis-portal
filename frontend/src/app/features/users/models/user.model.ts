export type UserRole = 'student' | 'lecturer' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'suspended';

// Cấu trúc dữ liệu yêu cầu gửi lên API để tạo người dùng mới
export interface CreateUserRequest {
  institutional_code: string;
  email: string;
  password?: string; // Tùy chọn, nếu không gửi thì backend tự tạo mật khẩu mặc định
  full_name: string;
  role: UserRole;
  class_name?: string; // Dành cho Sinh viên
  department?: string; // Dành cho Giảng viên/Quản trị
}

export interface UserProfile {
  id: string;
  institutional_code: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  class_name?: string;
  department?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaginationResponse {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface UserListResponse {
  items: UserProfile[];
  pagination: PaginationResponse;
}
