import { Injectable, signal } from '@angular/core';
import { Council } from '../models/council.model';

@Injectable({
  providedIn: 'root'
})
export class CouncilService {
  private mockCouncils: Council[] = [
    {
      id: 'c-1',
      name: 'Hội đồng Bảo vệ khóa K64 - CNTT 01',
      status: 'Published',
      members: [
        { id: 'm-1', user_id: 'u-101', name: 'TS. Nguyễn Văn A', role_in_council: 'Chủ tịch' },
        { id: 'm-2', user_id: 'u-102', name: 'ThS. Lê B', role_in_council: 'Thư ký' },
        { id: 'm-3', user_id: 'u-103', name: 'TS. Trần C', role_in_council: 'Ủy viên' }
      ],
      schedules: [
        {
          id: 's-1',
          registration_id: 'reg-1',
          topic_name: 'Nghiên cứu ứng dụng AI trong quản lý giáo dục',
          student_name: 'Nguyễn Quốc Vũ',
          defense_date: new Date(Date.now() + 86400000 * 5).toISOString(),
          location: 'Phòng 301, Tòa G3'
        },
        {
          id: 's-2',
          registration_id: 'reg-2',
          topic_name: 'Phân tích dữ liệu lớn với Apache Spark',
          student_name: 'Trần Thị D',
          defense_date: new Date(Date.now() + 86400000 * 5 + 7200000).toISOString(), // + 2 tiếng
          location: 'Phòng 301, Tòa G3'
        }
      ]
    },
    {
      id: 'c-2',
      name: 'Hội đồng Bảo vệ khóa K64 - CNTT 02',
      status: 'Draft',
      members: [],
      schedules: []
    }
  ];

  councils = signal<Council[]>(this.mockCouncils);

  constructor() { }

  getAllCouncils() {
    return this.councils();
  }
}
