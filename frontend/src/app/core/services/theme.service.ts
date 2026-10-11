import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Trạng thái theme hiện tại, mặc định lấy từ localStorage hoặc 'dark'
  currentTheme = signal<Theme>(this.getInitialTheme());

  constructor() {
    // Mỗi khi currentTheme thay đổi, effect này sẽ chạy
    effect(() => {
      const theme = this.currentTheme();
      // Lưu vào trình duyệt
      localStorage.setItem('thesis-portal-theme', theme);
      
      // Áp dụng class vào thẻ <html>
      if (theme === 'light') {
        document.documentElement.classList.add('light-theme');
      } else {
        document.documentElement.classList.remove('light-theme');
      }
    });
  }

  private getInitialTheme(): Theme {
    const savedTheme = localStorage.getItem('thesis-portal-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    return 'dark'; // Mặc định là dark mode
  }

  toggleTheme() {
    this.currentTheme.update(current => current === 'dark' ? 'light' : 'dark');
  }
}
