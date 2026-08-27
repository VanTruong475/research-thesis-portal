import { Injectable, signal } from '@angular/core';
import { Evaluation, EvaluationCriteria, FinalResult } from '../models/evaluation.model';

@Injectable({
  providedIn: 'root'
})
export class EvaluationService {
  // Signal để lưu trữ danh sách các phiếu chấm điểm (Mock data)
  evaluations = signal<Evaluation[]>([
    {
      id: 'EV-001',
      studentId: 'ST-2021001',
      studentName: 'Nguyễn Văn A',
      topicName: 'Nghiên cứu ứng dụng AI trong Y tế',
      lecturerId: 'GV-001',
      lecturerName: 'PGS. TS. Trần B',
      criterias: [
        { id: 'C1', name: 'Nội dung khoa học', maxScore: 50, score: 45 },
        { id: 'C2', name: 'Tính ứng dụng', maxScore: 30, score: 25 },
        { id: 'C3', name: 'Trình bày', maxScore: 20, score: 18 }
      ],
      totalScore: 88,
      comments: 'Đề tài có tính thực tiễn cao, tuy nhiên phần phân tích dữ liệu cần sâu hơn.',
      status: 'submitted',
      createdAt: '2026-08-20T10:00:00Z',
      updatedAt: '2026-08-20T10:00:00Z'
    },
    {
      id: 'EV-002',
      studentId: 'ST-2021002',
      studentName: 'Trần Thị B',
      topicName: 'Tối ưu hóa thuật toán tìm kiếm',
      lecturerId: 'GV-001',
      lecturerName: 'PGS. TS. Trần B',
      criterias: [
        { id: 'C1', name: 'Nội dung khoa học', maxScore: 50, score: 0 },
        { id: 'C2', name: 'Tính ứng dụng', maxScore: 30, score: 0 },
        { id: 'C3', name: 'Trình bày', maxScore: 20, score: 0 }
      ],
      totalScore: 0,
      comments: '',
      status: 'draft',
      createdAt: '2026-08-25T08:00:00Z',
      updatedAt: '2026-08-25T08:00:00Z'
    }
  ]);

  // Signal để lưu trữ kết quả cuối cùng (Mock data)
  finalResults = signal<FinalResult[]>([
    {
      studentId: 'ST-2021001',
      studentName: 'Nguyễn Văn A',
      topicName: 'Nghiên cứu ứng dụng AI trong Y tế',
      supervisorScore: 8.5,
      reviewerScore: 8.0,
      councilScore: 8.8,
      finalScore: 8.43,
      conclusion: 'passed',
      comments: 'Sinh viên hoàn thành tốt mục tiêu đề ra. Xứng đáng điểm khá.'
    }
  ]);

  constructor() {}

  // Lấy danh sách phiếu chấm điểm theo Giảng viên
  getEvaluationsByLecturer(lecturerId: string): Evaluation[] {
    return this.evaluations().filter(e => e.lecturerId === lecturerId);
  }

  // Lấy kết quả cuối cùng của Sinh viên
  getFinalResultByStudent(studentId: string): FinalResult | undefined {
    return this.finalResults().find(f => f.studentId === studentId);
  }

  // Cập nhật phiếu chấm điểm (Khi GV nhập điểm và bấm lưu)
  updateEvaluation(updatedEval: Evaluation) {
    this.evaluations.update(evals =>
      evals.map(e => (e.id === updatedEval.id ? updatedEval : e))
    );
  }
}
