import { Injectable, signal } from '@angular/core';
import { ProgressLog, ProgressSubmitRequest, ProgressCommentRequest } from '../models/progress.model';

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  // Dữ liệu giả lập cho màn hình Tiến độ
  private mockLogs: ProgressLog[] = [
    {
      id: 'log-1',
      registration_id: 'reg-1',
      content: 'Đã hoàn thành khảo sát tài liệu và viêt xong phần Mở đầu.',
      submitted_by: 'Nguyễn Quốc Vũ',
      submitted_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      lecturer_comment: 'Tốt, nhớ bổ sung thêm 2 bài báo quốc tế năm 2025 vào.',
      commented_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      id: 'log-2',
      registration_id: 'reg-1',
      content: 'Đang gặp khó khăn trong việc thu thập dataset. Cần xin thêm API key.',
      submitted_by: 'Nguyễn Quốc Vũ',
      submitted_at: new Date().toISOString(),
      lecturer_comment: null,
      commented_at: null,
    }
  ];

  // Signal để bind ra UI
  progressLogs = signal<ProgressLog[]>(this.mockLogs);

  constructor() { }

  // API giả lập: Lấy danh sách tiến độ theo đăng ký
  getLogsByRegistration(regId: string) {
    // Trong thực tế sẽ call HTTP GET
    return this.progressLogs();
  }

  // API giả lập: Sinh viên nộp tiến độ
  submitProgress(req: ProgressSubmitRequest) {
    const newLog: ProgressLog = {
      id: `log-${Date.now()}`,
      registration_id: req.registration_id,
      content: req.content,
      submitted_by: 'Nguyễn Quốc Vũ',
      submitted_at: new Date().toISOString(),
    };
    this.progressLogs.update(logs => [newLog, ...logs]);
  }

  // API giả lập: Giảng viên comment
  commentOnProgress(logId: string, req: ProgressCommentRequest) {
    this.progressLogs.update(logs => 
      logs.map(log => 
        log.id === logId 
          ? { ...log, lecturer_comment: req.comment, commented_at: new Date().toISOString() } 
          : log
      )
    );
  }
}
