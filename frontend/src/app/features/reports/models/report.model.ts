export interface ReportResponse {
  id: string;
  registration_id?: string | null;
  topic_id?: string | null;
  student_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  version: number;
  submitted_at: string;
  topic_code?: string | null;
  topic_title?: string | null;
  academic_period_code?: string | null;
  academic_period_name?: string | null;
  student_full_name?: string | null;
  supervisor_full_name?: string | null;
}
