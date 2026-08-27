export type TopicStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'closed' | 'cancelled';

export interface Topic {
  id: string;
  academic_period_id: string;
  code: string;
  title: string;
  description: string;
  requirements?: string;
  max_students: number;
  proposed_by_id: string;
  approved_by_id?: string;
  status: TopicStatus;
  rejection_reason?: string;
  created_at: string;
  
  // Custom properties that we might patch or derive
  lecturerName?: string;
  currentStudents?: number;
}

export interface PaginationResponse {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface TopicListResponse {
  items: Topic[];
  pagination: PaginationResponse;
}

export interface Registration {
  id: string;
  topic_id: string;
  student_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  // Custom derived
  topicName?: string;
  studentName?: string;
}

export interface RegistrationListResponse {
  items: Registration[];
  pagination: PaginationResponse;
}
