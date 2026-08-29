export interface ReportResponse {
  id: string;
  topic_id: string;
  student_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  version: number;
  submitted_at: string;
}
