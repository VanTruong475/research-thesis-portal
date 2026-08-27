import { Injectable, signal } from '@angular/core';
import { Report, ReportUploadRequest } from '../models/report.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  // Mock data cho lịch sử báo cáo
  private mockReports: Report[] = [
    {
      id: 'rep-2',
      registration_id: 'reg-1',
      file_name: 'BaoCao_TienDo_Lan2.pdf',
      file_url: '#',
      version: 2,
      uploaded_by: 'Nguyễn Quốc Vũ',
      uploaded_at: new Date().toISOString()
    },
    {
      id: 'rep-1',
      registration_id: 'reg-1',
      file_name: 'BaoCao_TienDo_Lan1.docx',
      file_url: '#',
      version: 1,
      uploaded_by: 'Nguyễn Quốc Vũ',
      uploaded_at: new Date(Date.now() - 86400000 * 7).toISOString()
    }
  ];

  reports = signal<Report[]>(this.mockReports);

  constructor() { }

  getReportsByRegistration(regId: string) {
    return this.reports();
  }

  uploadReport(req: ReportUploadRequest) {
    // Giả lập upload file
    const currentVersion = this.reports().length > 0 ? this.reports()[0].version : 0;
    const newReport: Report = {
      id: `rep-${Date.now()}`,
      registration_id: req.registration_id,
      file_name: req.file.name,
      file_url: '#',
      version: currentVersion + 1,
      uploaded_by: 'Nguyễn Quốc Vũ', // Có thể lấy từ AuthService
      uploaded_at: new Date().toISOString()
    };
    
    this.reports.update(reps => [newReport, ...reps]);
  }
}
