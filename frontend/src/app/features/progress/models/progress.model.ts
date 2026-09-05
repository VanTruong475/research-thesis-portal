export interface CreateProgressLogRequest {
  registration_id: string;
  milestone_id?: string;
  content: string;
}

export interface AddTeacherCommentRequest {
  teacher_comment: string;
}

export interface ProgressLog {
  id: string;
  registration_id: string;
  student_id: string;
  milestone_id?: string;
  content: string;
  submitted_at: string;
  teacher_comment?: string;
  commented_at?: string;
}
