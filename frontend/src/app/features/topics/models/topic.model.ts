// Keep `completed` for backend compatibility only. Thesis execution completion belongs to Registration.
export type TopicStatus = 'pending_approval' | 'approved' | 'rejected' | 'closed' | 'cancelled' | 'completed';

// Keep `in_progress` for backend compatibility only. Execution is Registration approved + AcademicPeriod in_progress.
export type RegistrationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'in_progress' | 'completed';

export interface Topic {
  id: string;
  academic_period_id: string;
  code: string;
  title: string;
  description: string;
  requirements?: string;
  max_students: number;
  current_students?: number;
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
  academic_period_id: string;
  topic_id: string;
  student_id: string;
  supervisor_id?: string | null;
  status: RegistrationStatus;
  student_note?: string | null;
  review_reason?: string | null;
  reviewed_by_id?: string | null;
  registered_at: string;
  reviewed_at?: string | null;
  supervisor_assigned_by_id?: string | null;
  supervisor_assigned_at?: string | null;
  cancelled_at?: string | null;
  created_at: string;
  updated_at: string;
  topic_code?: string | null;
  topic_title?: string | null;
  academic_period_code?: string | null;
  academic_period_name?: string | null;
  academic_period_status?: string | null;
  student_institutional_code?: string | null;
  student_full_name?: string | null;
  supervisor_institutional_code?: string | null;
  supervisor_full_name?: string | null;
  // Legacy UI fallbacks
  topicName?: string;
  studentName?: string;
}

export interface RegistrationListResponse {
  items: Registration[];
  pagination: PaginationResponse;
}

export interface TopicCreateRequest {
  academic_period_id: string;
  code: string;
  title: string;
  description: string;
  requirements?: string;
  max_students?: number;
}

export type TopicUpdateRequest = Partial<TopicCreateRequest>;

export interface RegistrationCreateRequest {
  topic_id: string;
  student_note?: string;
}

export interface RegistrationRejectRequest {
  review_reason: string;
}

export interface TopicRejectRequest {
  rejection_reason: string;
}



