export type CouncilMemberRole = 'chairperson' | 'secretary' | 'reviewer' | 'member';
export type CouncilStatus = 'draft' | 'published' | 'completed';

export interface CouncilMember {
  id: string;
  council_id: string;
  lecturer_id: string;
  member_role: CouncilMemberRole;
  status: string;
  assigned_at: string;
  // UI extended
  name?: string; 
}

export interface DefenseSchedule {
  id: string;
  council_id: string;
  registration_id: string;
  scheduled_at: string;
  duration_minutes: number;
  room: string;
  status: string;
  // UI extended
  topic_name?: string;
  student_name?: string;
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
