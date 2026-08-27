import { Injectable, signal } from '@angular/core';
import { AcademicPeriod } from '../models/period.model';

@Injectable({
  providedIn: 'root'
})
export class PeriodService {
  periods = signal<AcademicPeriod[]>([
    {
      id: 'P01',
      name: 'Học kỳ 1 (2026-2027)',
      startDate: '2026-09-01',
      endDate: '2027-01-15',
      status: 'active',
      totalTopics: 120,
      totalStudents: 450
    },
    {
      id: 'P02',
      name: 'Học kỳ 2 (2025-2026)',
      startDate: '2026-02-01',
      endDate: '2026-06-30',
      status: 'completed',
      totalTopics: 105,
      totalStudents: 380
    }
  ]);

  getAllPeriods(): AcademicPeriod[] {
    return this.periods();
  }
}
