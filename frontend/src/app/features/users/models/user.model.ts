export type UserRole = 'student' | 'lecturer' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'suspended';

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
