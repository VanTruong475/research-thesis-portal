export interface Topic {
  id: string;
  code: string; // Mã đề tài
  name: string;
  description: string;
  lecturerName: string;
  lecturerId: string;
  maxStudents: number;
  currentStudents: number;
  status: 'open' | 'closed' | 'draft';
}

export interface Registration {
  id: string;
  topicId: string;
  topicName: string;
  studentId: string;
  studentName: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
}
