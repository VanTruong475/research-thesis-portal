export type AcademicPeriodStatus = 'draft' | 'proposal_open' | 'registration_open' | 'in_progress' | 'defense' | 'completed' | 'cancelled';

export interface AcademicPeriod {
  id: string;
  code: string;
  name: string;
  academic_year: string;
  semester?: number;
  proposal_start_at: string;
  proposal_end_at: string;
  registration_start_at: string;
  registration_end_at: string;
  execution_start_at?: string;
  execution_end_at?: string;
  report_deadline_at?: string;
  defense_start_at?: string;
  defense_end_at?: string;
  status: AcademicPeriodStatus;
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface PaginationResponse {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface AcademicPeriodListResponse {
  items: AcademicPeriod[];
  pagination: PaginationResponse;
}

export interface CreatePeriodRequest {
  code: string;
  name: string;
  academic_year: string;
  semester?: number;
  proposal_start_at: string;
  proposal_end_at: string;
  registration_start_at: string;
  registration_end_at: string;
  execution_start_at?: string;
  execution_end_at?: string;
  report_deadline_at?: string;
  defense_start_at?: string;
  defense_end_at?: string;
}

export type UpdatePeriodRequest = Partial<CreatePeriodRequest>;
