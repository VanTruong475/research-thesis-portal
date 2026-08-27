export interface AcademicPeriod {
  id: string;
  name: string; // VD: Học kỳ 1 (2026-2027)
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'completed';
  totalTopics: number;
  totalStudents: number;
}
