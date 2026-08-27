# Báo Cáo Tiến Độ Phát Triển Frontend - Member B

Tài liệu này tổng hợp các công việc đã hoàn thành, những phần còn tồn đọng và các lưu ý quan trọng trong quá trình phát triển Frontend cho dự án Research Thesis Portal (vai trò Member B).

## 1. Những Gì Đã Làm Được (Hoàn thành 6/7 bước)

- **Bước 1: Cấu hình Design System (Neo Kinpaku / Impeccable)**
  - Tích hợp bảng màu cao cấp (Lacquer Black, Kinpaku Gold, Verdigris Patina) vào `styles.css`.
  - Cập nhật ánh xạ màu (mapping) trong `tailwind.config.js`.
  - Đổi Font chữ sang `Alumni Sans` (cho Tiêu đề) và `Albert Sans` (cho Văn bản).

- **Bước 2: Xây Dựng Shared UI Components**
  - Khởi tạo các CSS class dùng chung (`.ks-button`, `.ks-input`, `.ks-card`) để tối ưu hóa hiệu năng, tránh tạo quá nhiều Angular Component không cần thiết.
  - Tạo `StatusBadgeComponent` và `LoadingSpinnerComponent` (dạng Angular Standalone Components).

- **Bước 3: App Layout & Navigation**
  - Xây dựng khung giao diện chính `AppLayoutComponent` gồm `Sidebar` và `Header`.
  - Tạo `Mock AuthService` (Dùng Angular `signal`) để giả lập phân quyền tạm thời (Admin, Lecturer, Student).
  - Thanh menu (`Sidebar`) đã tự động ẩn/hiện chức năng tùy theo quyền của người dùng.

- **Bước 4: Progress Module (Tiến độ Hướng dẫn)**
  - Model & Service: `progress.model.ts`, `progress.service.ts` (Mock data).
  - Components: `progress-timeline` (hiển thị dòng thời gian báo cáo) và `progress-form` (form nộp báo cáo tuần).
  - Pages: Gắn thành công vào Route `/app/progress`.

- **Bước 5: Reports Module (Báo cáo & Tài liệu)**
  - Model & Service: `report.model.ts`, `report.service.ts` (Mock data).
  - Components: `file-uploader` (hỗ trợ kéo thả drag & drop) và `report-history` (bảng lịch sử version).
  - Pages: Gắn thành công vào Route `/app/reports`.

- **Bước 6: Councils Module (Quản lý Hội đồng)**
  - Model & Service: `council.model.ts`, `council.service.ts` (Mock data).
  - Components: `council-card` (Hiển thị thẻ hội đồng, danh sách thành viên, lịch bảo vệ).
  - Pages: Trang danh sách `/app/councils` với logic phân quyền (chỉ Admin được tạo mới).

---

## 2. Những Việc Chưa Làm (Còn Lại)

- **Bước 7: Evaluation & Final Results Module (Chấm điểm & Kết quả cuối cùng)**
  - Thiết kế UI cho màn hình Giảng viên nhập điểm.
  - Thiết kế UI hiển thị Kết quả tổng kết cho Sinh viên.
  
- **Tích Hợp API Thật (Integration)**
  - Hiện tại toàn bộ dữ liệu đang là Mock Data (trong các Service). 
  - Khi Backend hoàn thiện, cần inject `HttpClient`, gỡ bỏ Mock Data và gọi trực tiếp tới các endpoint FastAPI (đã được Member A cấu hình sẵn `baseUrl` trong environment).

- **Tích Hợp Authentication Thật**
  - Xóa bỏ `Mock AuthService`.
  - Sử dụng Token JWT thật lấy từ Backend và lưu vào LocalStorage/Cookies để duy trì phiên đăng nhập.

---

## 3. Các Lưu Ý Quan Trọng (Notes & Gotchas)

1. **Tuân thủ Thiết kế (Design System)**: 
   - **Tuyệt đối không dùng mã màu generic của Tailwind** (như `bg-red-500`, `text-blue-600`).
   - Phải bám sát bảng màu Neo Kinpaku (`bg-lacquer`, `text-kinpaku`, `text-champagne`, `text-patina`).
   - Giữ viền mỏng (`border-hairline`) cho các thẻ (Cards) và sử dụng góc bo tròn nhỏ (`rounded-sm`).

2. **Cách tiếp cận "Shared UI"**:
   - Đối với các phần tử giao diện cơ bản (Nút bấm, Ô nhập liệu), hãy dùng class CSS (`.ks-button`, `.ks-input`) trong file `styles.css`. **Không được tạo Component Angular cho Nút bấm** vì nó sẽ làm phình to mã nguồn một cách vô ích.

3. **Quản lý State bằng Signal**:
   - Các Service hiện đang dùng `signal` (tính năng của Angular 16+) để chứa dữ liệu (vd: `reports = signal<Report[]>([])`).
   - Signal giúp giao diện tự động render lại (Reactivity) ngay khi dữ liệu thay đổi mà không cần phải gọi thủ công (RxJS/BehaviorSubject phức tạp). Hãy duy trì kiến trúc này khi chuyển sang gọi API thật.
