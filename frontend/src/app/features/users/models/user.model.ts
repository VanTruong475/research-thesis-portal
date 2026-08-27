export type UserRole = 'student' | 'lecturer' | 'admin';

export interface UserProfile {
  id: string;
  code: string; // Mã SV / Mã GV
  fullName: string;
  email: string;
  role: UserRole;
  department?: string; // Khoa / Bộ môn (Dành cho GV)
  major?: string; // Chuyên ngành (Dành cho SV)
  status: 'active' | 'inactive';
  createdAt: string;
}
