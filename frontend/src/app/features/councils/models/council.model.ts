export interface CouncilMember {
  id: string;
  user_id: string;
  name: string;
  role_in_council: 'Chủ tịch' | 'Thư ký' | 'Ủy viên';
}

export interface DefenseSchedule {
  id: string;
  registration_id: string;
  topic_name: string;
  student_name: string;
  defense_date: string; // ISO string
  location: string;
}

export interface Council {
  id: string;
  name: string;
  status: 'Draft' | 'Published' | 'Completed';
  members: CouncilMember[];
  schedules: DefenseSchedule[];
}
