import { Injectable, signal } from '@angular/core';
import { Topic, Registration } from '../models/topic.model';

@Injectable({
  providedIn: 'root'
})
export class TopicService {
  topics = signal<Topic[]>([
    {
      id: 'T01',
      code: 'DT-2026-01',
      name: 'Nghiên cứu ứng dụng AI trong Y tế',
      description: 'Sử dụng Deep Learning để phân tích hình ảnh y khoa, phát hiện sớm ung thư.',
      lecturerName: 'PGS. TS. Trần B',
      lecturerId: 'U02',
      maxStudents: 3,
      currentStudents: 1,
      status: 'open'
    },
    {
      id: 'T02',
      code: 'DT-2026-02',
      name: 'Xây dựng hệ thống quản lý giao thông thông minh',
      description: 'Ứng dụng IoT và xử lý dữ liệu thời gian thực để phân luồng giao thông.',
      lecturerName: 'TS. Nguyễn C',
      lecturerId: 'U99',
      maxStudents: 2,
      currentStudents: 2,
      status: 'closed'
    }
  ]);

  registrations = signal<Registration[]>([
    {
      id: 'R01',
      topicId: 'T01',
      topicName: 'Nghiên cứu ứng dụng AI trong Y tế',
      studentId: 'U03',
      studentName: 'Nguyễn Văn A',
      status: 'pending',
      appliedAt: '2026-08-25T10:00:00Z'
    }
  ]);

  getAllTopics(): Topic[] {
    return this.topics();
  }

  getTopicsByLecturer(lecturerId: string): Topic[] {
    return this.topics().filter(t => t.lecturerId === lecturerId);
  }

  getRegistrationsForLecturer(lecturerId: string): Registration[] {
    // Trong thực tế, join với topic để check lecturerId
    const lecturerTopics = this.getTopicsByLecturer(lecturerId).map(t => t.id);
    return this.registrations().filter(r => lecturerTopics.includes(r.topicId));
  }
}
