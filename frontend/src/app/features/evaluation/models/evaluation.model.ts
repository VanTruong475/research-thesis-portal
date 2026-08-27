// Định nghĩa cấu trúc cho một tiêu chí chấm điểm
export interface EvaluationCriteria {
  id: string;
  name: string;
  maxScore: number;
  score: number;
}

// Định nghĩa cấu trúc bài đánh giá của một giảng viên dành cho một sinh viên
export interface Evaluation {
  id: string;
  studentId: string;
  studentName: string;
  topicName: string;
  lecturerId: string;
  lecturerName: string;
  criterias: EvaluationCriteria[]; // Danh sách các tiêu chí
  totalScore: number; // Tổng điểm
  comments: string; // Nhận xét chung
  status: 'draft' | 'submitted'; // Trạng thái: bản nháp hay đã nộp
  createdAt: string;
  updatedAt: string;
}

// Định nghĩa cấu trúc kết quả cuối cùng (Final Result) của một sinh viên
export interface FinalResult {
  studentId: string;
  studentName: string;
  topicName: string;
  supervisorScore: number; // Điểm GV hướng dẫn
  reviewerScore: number; // Điểm phản biện (nếu có)
  councilScore: number; // Điểm hội đồng (trung bình)
  finalScore: number; // Điểm tổng kết
  conclusion: 'passed' | 'failed' | 'excellent'; // Kết luận
  comments: string; // Đánh giá chung
}
