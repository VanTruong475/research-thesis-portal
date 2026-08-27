export type EvaluationType = 'supervisor' | 'council';
export type ScoreStatus = 'draft' | 'submitted';
export type FinalResultStatus = 'draft' | 'calculated' | 'published';
export type ResultClassification = 'excellent' | 'good' | 'fair' | 'pass' | 'fail';

export interface ScoreCreate {
  registration_id: string;
  council_id?: string;
  evaluation_type: EvaluationType;
  score: number;
  comments?: string;
  is_submit: boolean;
}

export interface ScoreResponse {
  id: string;
  registration_id: string;
  evaluator_id: string;
  council_id?: string;
  evaluation_type: EvaluationType;
  score: number;
  comments?: string;
  status: ScoreStatus;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
  
  // Custom properties for UI
  studentName?: string;
  topicName?: string;
  lecturerName?: string;
}

export interface FinalResultResponse {
  id: string;
  registration_id: string;
  supervisor_score: number;
  council_average_score: number;
  supervisor_weight: number;
  council_weight: number;
  final_score: number;
  classification?: ResultClassification;
  status: FinalResultStatus;
  calculated_at: string;
  published_at?: string;
  
  // Custom properties for UI
  studentName?: string;
  topicName?: string;
}
