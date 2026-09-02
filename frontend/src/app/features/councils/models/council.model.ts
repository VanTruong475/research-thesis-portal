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
  // UI extended
  name?: string;
  role_in_council?: string;
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
  // UI extended
  topic_name?: string;
  student_name?: string;
  defense_date?: string;
  location?: string;
}

export interface Council {
  id: string;
  academic_period_id: string;
  code: string;
  name: string;
  description?: string;
  default_room?: string;
  status: CouncilStatus;
  created_at: string;
  members: CouncilMember[];
  schedules: DefenseSchedule[];
}

export interface CreateCouncilRequest {
  academic_period_id: string;
  code: string;
  name: string;
  description?: string;
  default_room?: string;
}

export interface CouncilMemberAssignRequest {
  lecturer_id: string;
  member_role: CouncilMemberRole;
}

export interface DefenseScheduleCreateRequest {
  registration_id: string;
  scheduled_at: string; // ISO string
  duration_minutes: number;
  room: string;
}

