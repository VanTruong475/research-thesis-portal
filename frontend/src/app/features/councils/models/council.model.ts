export type CouncilMemberRole = 'chairperson' | 'secretary' | 'reviewer' | 'member';
export type CouncilMemberStatus = 'active' | 'inactive' | 'removed';
export type CouncilStatus = 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type DefenseScheduleStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';

export interface CouncilMember {
  id: string;
  council_id: string;
  lecturer_id: string;
  member_role: CouncilMemberRole;
  status: CouncilMemberStatus;
  assigned_at: string;
  lecturer_full_name?: string | null;
  lecturer_institutional_code?: string | null;
}

export interface DefenseSchedule {
  id: string;
  council_id: string;
  registration_id: string;
  scheduled_at: string;
  duration_minutes: number;
  room: string;
  presentation_order?: number | null;
  status: DefenseScheduleStatus;
  note?: string | null;
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
}

export interface Council {
  id: string;
  academic_period_id: string;
  code: string;
  name: string;
  description?: string | null;
  default_room?: string | null;
  status: CouncilStatus;
  created_at: string;
  members: CouncilMember[];
  schedules: DefenseSchedule[];
}

export interface CreateCouncilRequest {
  academic_period_id: string;
  code: string;
  name: string;
  description?: string | null;
  default_room?: string | null;
}

export interface CouncilMemberAssignRequest {
  lecturer_id: string;
  member_role: CouncilMemberRole;
}

export interface DefenseScheduleCreateRequest {
  registration_id: string;
  scheduled_at: string;
  duration_minutes: number;
  room: string;
  presentation_order?: number | null;
  note?: string | null;
}
