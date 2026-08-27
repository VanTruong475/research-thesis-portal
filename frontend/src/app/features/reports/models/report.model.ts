export interface Report {
  id: string;
  topic_id: string;
  file_url: string;
  file_name: string;
  version: number;
  uploaded_by: string;
  uploaded_at: string; // ISO String
}

export interface ReportUploadRequest {
  topic_id: string;
  file: File;
}
