export type EvaluationType = 'supervisor' | 'council';
export type ScoreStatus = 'draft' | 'submitted' | 'locked';
export type FinalResultStatus = 'draft' | 'calculated' | 'published' | 'cancelled';
export type ResultClassification = 'excellent' | 'good' | 'fair' | 'average' | 'failed';

export interface ScoreCreate {
  registration_id: string;
  council_id?: string | null;
  evaluation_type: EvaluationType;
  score: number;
  comments?: string | null;
  is_submit?: boolean;
}

export interface ScoreUpdate {
  score?: number | null;
  comments?: string | null;
  is_submit?: boolean | null;
}

export interface ScoreResponse {
  id: string;
  registration_id: string;
  evaluator_id: string;
  council_id?: string | null;
  evaluation_type: EvaluationType;
  score: number;
  comments?: string | null;
  status: ScoreStatus;
  submitted_at?: string | null;
  locked_at?: string | null;
  created_at: string;
  updated_at: string;
  topic_id?: string | null;
  topic_code?: string | null;
  topic_title?: string | null;
  student_id?: string | null;
  student_full_name?: string | null;
  student_institutional_code?: string | null;
  supervisor_id?: string | null;
  supervisor_full_name?: string | null;
  evaluator_full_name?: string | null;
  evaluator_institutional_code?: string | null;
  academic_period_id?: string | null;
  academic_period_code?: string | null;
  academic_period_name?: string | null;
  // Backward-compatible UI fallback fields
  studentName?: string;
  topicName?: string;
}

export interface FinalResultCalculateRequest {
  supervisor_weight?: number;
  council_weight?: number;
}

export interface FinalResultResponse {
  id: string;
  registration_id: string;
  supervisor_score: number;
  council_average_score: number;
  supervisor_weight: number;
  council_weight: number;
  final_score: number;
  classification?: ResultClassification | null;
  status: FinalResultStatus;
  calculated_at: string;
  calculated_by_id?: string | null;
  published_at?: string | null;
  published_by_id?: string | null;
  created_at: string;
  updated_at: string;
  topic_id?: string | null;
  topic_code?: string | null;
  topic_title?: string | null;
  student_id?: string | null;
  student_full_name?: string | null;
  student_institutional_code?: string | null;
  supervisor_id?: string | null;
  supervisor_full_name?: string | null;
  academic_period_id?: string | null;
  academic_period_code?: string | null;
  academic_period_name?: string | null;
  calculated_by_full_name?: string | null;
  published_by_full_name?: string | null;
  // Backward-compatible UI fallback fields
  topicName?: string;
  studentName?: string;
}
