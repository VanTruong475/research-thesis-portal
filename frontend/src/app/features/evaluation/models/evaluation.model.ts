export type EvaluationType = 'supervisor' | 'council';
export type ScoreStatus = 'draft' | 'submitted' | 'locked';
export type FinalResultStatus = 'draft' | 'published';
export type ResultClassification = 'excellent' | 'good' | 'fair' | 'pass' | 'fail';

export interface ScoreCreate {
  registration_id: string;
  council_id?: string | null;
  evaluation_type: EvaluationType;
  score: number;
  comments?: string | null;
  is_submit?: boolean;
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
  created_at: string;
  updated_at: string;
  // UI Display fields
  studentName?: string;
  topicName?: string;
}

export interface FinalResultCalculateRequest {
  registration_id: string;
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
  // UI Display fields
  topicName?: string;
  studentName?: string;
}
