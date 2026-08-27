export interface ProgressLog {
  id: string;
  registration_id: string;
  content: string;
  submitted_by: string;
  submitted_at: string; // ISO string
  lecturer_comment?: string | null;
  commented_at?: string | null;
}

export interface ProgressSubmitRequest {
  registration_id: string;
  content: string;
}

export interface ProgressCommentRequest {
  comment: string;
}
