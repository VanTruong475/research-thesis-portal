# Sơ đồ hệ thống Research Thesis Portal

File này tổng hợp các sơ đồ Mermaid dùng cho báo cáo và GitHub Markdown. Các sơ đồ bám theo hệ thống hiện tại của dự án Research Thesis Portal.

> GitHub hỗ trợ render Mermaid trực tiếp trong file `.md`.

---

## 3.1 — Sơ đồ Use Case tổng quát của hệ thống

```mermaid
flowchart LR
    Student["Sinh viên"]
    Lecturer["Giảng viên"]
    Admin["Admin"]

    subgraph System["Research Thesis Portal"]
        UC_Login(["Đăng nhập / đăng xuất"])
        UC_Profile(["Quản lý hồ sơ cá nhân"])
        UC_ViewTopics(["Xem danh sách đề tài"])
        UC_RegisterTopic(["Đăng ký đề tài"])
        UC_ProposeTopic(["Đề xuất đề tài"])
        UC_ReviewTopic(["Duyệt / từ chối đề tài"])
        UC_ReviewRegistration(["Duyệt / từ chối đăng ký"])
        UC_AssignSupervisor(["Phân công GVHD"])
        UC_Progress(["Cập nhật và nhận xét tiến độ"])
        UC_Report(["Nộp và xem báo cáo"])
        UC_Council(["Quản lý hội đồng và lịch bảo vệ"])
        UC_Score(["Chấm điểm"])
        UC_Result(["Tính và công bố kết quả"])
        UC_Users(["Quản lý người dùng"])
        UC_Periods(["Quản lý đợt học thuật"])
        UC_Dashboard(["Xem dashboard thống kê"])
    end

    Student --> UC_Login
    Student --> UC_Profile
    Student --> UC_ViewTopics
    Student --> UC_RegisterTopic
    Student --> UC_Progress
    Student --> UC_Report
    Student --> UC_Result
    Student --> UC_Dashboard

    Lecturer --> UC_Login
    Lecturer --> UC_Profile
    Lecturer --> UC_ProposeTopic
    Lecturer --> UC_ReviewRegistration
    Lecturer --> UC_Progress
    Lecturer --> UC_Report
    Lecturer --> UC_Score
    Lecturer --> UC_Dashboard

    Admin --> UC_Login
    Admin --> UC_Profile
    Admin --> UC_ReviewTopic
    Admin --> UC_AssignSupervisor
    Admin --> UC_Council
    Admin --> UC_Result
    Admin --> UC_Users
    Admin --> UC_Periods
    Admin --> UC_Dashboard
```

---

## 3.1.2 — Use Case chi tiết Sinh viên

```mermaid
flowchart LR
    Student["Sinh viên"]

    subgraph StudentCases["Chức năng của Sinh viên"]
        Login(["Đăng nhập"])
        UpdateProfile(["Cập nhật hồ sơ cá nhân"])
        ViewTopics(["Xem danh sách đề tài đã duyệt"])
        ViewTopicDetail(["Xem chi tiết đề tài"])
        RegisterTopic(["Đăng ký đề tài"])
        ViewRegistration(["Xem đăng ký của tôi"])
        CancelRegistration(["Hủy đăng ký đang chờ duyệt"])
        SubmitProgress(["Nộp tiến độ thực hiện"])
        ViewProgressComment(["Xem nhận xét tiến độ"])
        UploadReport(["Nộp báo cáo / sản phẩm"])
        ViewReportHistory(["Xem lịch sử báo cáo"])
        DownloadReport(["Tải file báo cáo"])
        ViewFinalResult(["Xem kết quả đã công bố"])
    end

    Student --> Login
    Student --> UpdateProfile
    Student --> ViewTopics
    Student --> ViewTopicDetail
    Student --> RegisterTopic
    Student --> ViewRegistration
    Student --> CancelRegistration
    Student --> SubmitProgress
    Student --> ViewProgressComment
    Student --> UploadReport
    Student --> ViewReportHistory
    Student --> DownloadReport
    Student --> ViewFinalResult

    ViewTopics --> ViewTopicDetail
    ViewTopicDetail --> RegisterTopic
    UploadReport --> ViewReportHistory
    ViewReportHistory --> DownloadReport
```

---

## 3.1.3 — Use Case chi tiết Giảng viên

```mermaid
flowchart LR
    Lecturer["Giảng viên"]

    subgraph LecturerCases["Chức năng của Giảng viên"]
        Login(["Đăng nhập"])
        UpdateProfile(["Cập nhật hồ sơ cá nhân"])
        CreateTopic(["Đề xuất đề tài"])
        UpdateOwnTopic(["Cập nhật đề tài của mình"])
        ViewOwnTopics(["Xem danh sách đề tài của tôi"])
        ReviewRegistration(["Duyệt / từ chối đăng ký đề tài"])
        ViewSupervisedRegistrations(["Xem sinh viên đang hướng dẫn"])
        ViewProgress(["Xem tiến độ sinh viên"])
        CommentProgress(["Nhận xét tiến độ"])
        ViewReports(["Xem / tải báo cáo"])
        SubmitSupervisorScore(["Chấm điểm GVHD"])
        SubmitCouncilScore(["Chấm điểm hội đồng"])
        ViewCouncil(["Xem hội đồng được phân công"])
        ViewDashboard(["Xem dashboard"])
    end

    Lecturer --> Login
    Lecturer --> UpdateProfile
    Lecturer --> CreateTopic
    Lecturer --> UpdateOwnTopic
    Lecturer --> ViewOwnTopics
    Lecturer --> ReviewRegistration
    Lecturer --> ViewSupervisedRegistrations
    Lecturer --> ViewProgress
    Lecturer --> CommentProgress
    Lecturer --> ViewReports
    Lecturer --> SubmitSupervisorScore
    Lecturer --> SubmitCouncilScore
    Lecturer --> ViewCouncil
    Lecturer --> ViewDashboard

    ViewOwnTopics --> UpdateOwnTopic
    ViewProgress --> CommentProgress
    ViewReports --> SubmitSupervisorScore
    ViewCouncil --> SubmitCouncilScore
```

---

## 3.1.4 — Use Case chi tiết Admin

```mermaid
flowchart LR
    Admin["Admin"]

    subgraph AdminCases["Chức năng của Admin"]
        Login(["Đăng nhập"])
        ManageUsers(["Quản lý người dùng"])
        ImportUsers(["Import người dùng bằng CSV"])
        ManagePeriods(["Quản lý đợt học thuật"])
        ReviewTopics(["Duyệt / từ chối đề tài"])
        ViewRegistrations(["Xem danh sách đăng ký"])
        AssignSupervisor(["Phân công / đổi GVHD"])
        ViewLecturerWorkload(["Xem tải hướng dẫn giảng viên"])
        ManageCouncils(["Tạo hội đồng"])
        AssignCouncilMembers(["Phân công thành viên hội đồng"])
        ScheduleDefense(["Xếp lịch bảo vệ"])
        CalculateFinalResult(["Tính kết quả cuối cùng"])
        PublishFinalResult(["Công bố kết quả"])
        ViewDashboard(["Xem dashboard thống kê"])
    end

    Admin --> Login
    Admin --> ManageUsers
    Admin --> ImportUsers
    Admin --> ManagePeriods
    Admin --> ReviewTopics
    Admin --> ViewRegistrations
    Admin --> AssignSupervisor
    Admin --> ViewLecturerWorkload
    Admin --> ManageCouncils
    Admin --> AssignCouncilMembers
    Admin --> ScheduleDefense
    Admin --> CalculateFinalResult
    Admin --> PublishFinalResult
    Admin --> ViewDashboard

    ManageUsers --> ImportUsers
    ViewRegistrations --> AssignSupervisor
    AssignSupervisor --> ViewLecturerWorkload
    ManageCouncils --> AssignCouncilMembers
    ManageCouncils --> ScheduleDefense
    CalculateFinalResult --> PublishFinalResult
```

---

## 3.5 — Quy trình nghiệp vụ tổng thể từ đăng ký đến đánh giá, nghiệm thu

```mermaid
flowchart TD
    Start(["Bắt đầu"])
    Login["Người dùng đăng nhập hệ thống"]
    Period["Admin tạo và mở đợt học thuật"]
    Propose["Giảng viên đề xuất đề tài"]
    TopicReview{"Admin duyệt đề tài?"}
    RejectTopic["Đề tài bị từ chối"]
    ApprovedTopic["Đề tài được công bố"]
    Register["Sinh viên đăng ký đề tài"]
    RegistrationReview{"Giảng viên hoặc Admin duyệt đăng ký?"}
    RejectRegistration["Đăng ký bị từ chối"]
    ApproveRegistration["Đăng ký được duyệt"]
    AssignDefaultSupervisor["Gán GVHD mặc định là giảng viên đề xuất"]
    ChangeSupervisor["Admin đổi GVHD nếu cần"]
    Execute["Sinh viên thực hiện đề tài"]
    SubmitProgress["Sinh viên nộp tiến độ"]
    CommentProgress["GVHD nhận xét tiến độ"]
    SubmitReport["Sinh viên nộp báo cáo / sản phẩm"]
    CreateCouncil["Admin tạo hội đồng"]
    AssignMembers["Admin phân công thành viên hội đồng"]
    ScheduleDefense["Admin xếp lịch bảo vệ"]
    Score["GVHD và hội đồng nhập điểm"]
    Calculate["Admin tính kết quả cuối cùng"]
    Publish["Admin công bố kết quả"]
    StudentView["Sinh viên xem kết quả"]
    End(["Kết thúc"])

    Start --> Login
    Login --> Period
    Period --> Propose
    Propose --> TopicReview
    TopicReview -->|"Không duyệt"| RejectTopic
    RejectTopic --> Propose
    TopicReview -->|"Duyệt"| ApprovedTopic
    ApprovedTopic --> Register
    Register --> RegistrationReview
    RegistrationReview -->|"Từ chối"| RejectRegistration
    RejectRegistration --> Register
    RegistrationReview -->|"Duyệt"| ApproveRegistration
    ApproveRegistration --> AssignDefaultSupervisor
    AssignDefaultSupervisor --> ChangeSupervisor
    AssignDefaultSupervisor --> Execute
    ChangeSupervisor --> Execute
    Execute --> SubmitProgress
    SubmitProgress --> CommentProgress
    Execute --> SubmitReport
    SubmitReport --> CreateCouncil
    CreateCouncil --> AssignMembers
    AssignMembers --> ScheduleDefense
    ScheduleDefense --> Score
    Score --> Calculate
    Calculate --> Publish
    Publish --> StudentView
    StudentView --> End
```

---

## 4.2 — Sơ đồ quan hệ dữ liệu ERD đúng với 13 bảng hiện tại

```mermaid
erDiagram
    USERS ||--o{ REFRESH_TOKENS : owns
    USERS ||--o{ ACADEMIC_PERIODS : creates
    USERS ||--o{ TOPICS : proposes
    USERS ||--o{ TOPICS : approves
    USERS ||--o{ REGISTRATIONS : registers
    USERS ||--o{ REGISTRATIONS : supervises
    USERS ||--o{ REGISTRATIONS : reviews
    USERS ||--o{ PROGRESS_LOGS : submits
    USERS ||--o{ REPORTS : uploads
    USERS ||--o{ COUNCIL_MEMBERS : joins
    USERS ||--o{ SCORES : evaluates
    USERS ||--o{ FINAL_RESULTS : calculates_or_publishes

    ACADEMIC_PERIODS ||--o{ TOPICS : contains
    ACADEMIC_PERIODS ||--o{ REGISTRATIONS : contains
    ACADEMIC_PERIODS ||--o{ COUNCILS : organizes

    TOPICS ||--o{ REGISTRATIONS : receives
    TOPICS ||--o{ REPORTS : legacy_topic_ref

    REGISTRATIONS ||--o{ PROGRESS_LOGS : has
    REGISTRATIONS ||--o{ REPORTS : has
    REGISTRATIONS ||--o| DEFENSE_SCHEDULES : scheduled_for
    REGISTRATIONS ||--o{ SCORES : receives
    REGISTRATIONS ||--o| FINAL_RESULTS : produces

    MILESTONES ||--o{ PROGRESS_LOGS : optional_milestone

    COUNCILS ||--o{ COUNCIL_MEMBERS : contains
    COUNCILS ||--o{ DEFENSE_SCHEDULES : schedules
    COUNCILS ||--o{ SCORES : council_scores

    USERS {
        uuid id PK
        varchar institutional_code UK
        varchar email UK
        varchar password_hash
        varchar full_name
        user_role role
        user_status status
    }

    REFRESH_TOKENS {
        uuid id PK
        uuid user_id FK
        varchar token_hash UK
        timestamptz expires_at
        timestamptz revoked_at
    }

    ACADEMIC_PERIODS {
        uuid id PK
        varchar code UK
        varchar name
        varchar academic_year
        academic_period_status status
        uuid created_by_id FK
    }

    TOPICS {
        uuid id PK
        uuid academic_period_id FK
        varchar code
        varchar title
        topic_type topic_type
        smallint max_students
        uuid proposed_by_id FK
        uuid approved_by_id FK
        topic_status status
    }

    REGISTRATIONS {
        uuid id PK
        uuid academic_period_id FK
        uuid topic_id FK
        uuid student_id FK
        uuid supervisor_id FK
        registration_status status
        uuid reviewed_by_id FK
        uuid supervisor_assigned_by_id FK
    }

    MILESTONES {
        uuid id PK
        varchar title
        text description
        timestamptz due_date
    }

    PROGRESS_LOGS {
        uuid id PK
        uuid registration_id FK
        uuid student_id FK
        uuid milestone_id FK
        text content
        text teacher_comment
        timestamptz submitted_at
    }

    REPORTS {
        uuid id PK
        uuid registration_id FK
        uuid topic_id FK
        uuid student_id FK
        varchar file_name
        varchar file_path
        bigint file_size
        varchar report_type
        integer version
    }

    COUNCILS {
        uuid id PK
        uuid academic_period_id FK
        varchar code
        varchar name
        council_type council_type
        council_status status
        uuid created_by_id FK
    }

    COUNCIL_MEMBERS {
        uuid id PK
        uuid council_id FK
        uuid lecturer_id FK
        council_member_role member_role
        uuid assigned_by_id FK
        council_member_status status
    }

    DEFENSE_SCHEDULES {
        uuid id PK
        uuid council_id FK
        uuid registration_id FK
        timestamptz scheduled_at
        integer duration_minutes
        varchar room
        defense_schedule_status status
        uuid created_by_id FK
    }

    SCORES {
        uuid id PK
        uuid registration_id FK
        uuid evaluator_id FK
        uuid council_id FK
        evaluation_type evaluation_type
        numeric score
        score_status status
    }

    FINAL_RESULTS {
        uuid id PK
        uuid registration_id FK
        numeric supervisor_score
        numeric council_average_score
        numeric final_score
        result_classification classification
        final_result_status status
    }
```

---

## 4.5 — State Machine của đăng ký đề tài

```mermaid
stateDiagram-v2
    [*] --> pending: Sinh viên tạo đăng ký

    pending --> approved: Giảng viên hoặc Admin duyệt
    pending --> rejected: Giảng viên hoặc Admin từ chối
    pending --> cancelled: Sinh viên hủy đăng ký

    approved --> in_progress: Bắt đầu thực hiện đề tài
    approved --> completed: Hoàn tất trực tiếp nếu quy trình cho phép

    in_progress --> completed: Hoàn thành đề tài

    rejected --> [*]
    cancelled --> [*]
    completed --> [*]

    note right of pending
        Đăng ký đang chờ xét duyệt.
        Đây là trạng thái hiệu lực.
    end note

    note right of approved
        Đăng ký đã được duyệt.
        supervisor_id phải có giá trị.
    end note

    note right of in_progress
        Sinh viên đang thực hiện đề tài,
        có thể nộp tiến độ và báo cáo.
    end note
```

---

## 4.6 — Sequence Diagram đăng ký đề tài

```mermaid
sequenceDiagram
    actor Student as Sinh viên
    participant Web as Angular Frontend
    participant TopicAPI as Topic API
    participant RegistrationAPI as Registration API
    participant DB as PostgreSQL

    Student->>Web: Mở danh sách đề tài
    Web->>TopicAPI: GET /api/v1/topics
    TopicAPI->>DB: Lấy các đề tài phù hợp quyền xem
    DB-->>TopicAPI: Danh sách đề tài
    TopicAPI-->>Web: Trả về danh sách đề tài
    Web-->>Student: Hiển thị đề tài đã duyệt

    Student->>Web: Xem chi tiết đề tài
    Web->>TopicAPI: GET /api/v1/topics/:topic_id
    TopicAPI->>DB: Lấy chi tiết đề tài
    DB-->>TopicAPI: Dữ liệu đề tài
    TopicAPI-->>Web: Trả về chi tiết đề tài

    Student->>Web: Gửi đăng ký đề tài
    Web->>RegistrationAPI: POST /api/v1/registrations
    RegistrationAPI->>DB: Kiểm tra đợt đăng ký
    RegistrationAPI->>DB: Kiểm tra đề tài đã duyệt và còn chỗ
    RegistrationAPI->>DB: Kiểm tra sinh viên chưa có đăng ký hiệu lực
    RegistrationAPI->>DB: Tạo đăng ký trạng thái pending
    DB-->>RegistrationAPI: Đăng ký được tạo
    RegistrationAPI-->>Web: Trả về đăng ký mới
    Web-->>Student: Thông báo đăng ký thành công
```

---

## 4.6 — Sequence Diagram duyệt đăng ký đề tài

```mermaid
sequenceDiagram
    actor Lecturer as Giảng viên
    actor Admin as Admin
    participant Web as Angular Frontend
    participant RegistrationAPI as Registration API
    participant DB as PostgreSQL

    Lecturer->>Web: Mở trang duyệt đăng ký
    Web->>RegistrationAPI: GET /api/v1/registrations
    RegistrationAPI->>DB: Lấy danh sách đăng ký theo quyền truy cập
    DB-->>RegistrationAPI: Danh sách đăng ký
    RegistrationAPI-->>Web: Trả về danh sách đăng ký
    Web-->>Lecturer: Hiển thị các đăng ký cần xử lý

    Lecturer->>Web: Chọn duyệt một đăng ký
    Web->>RegistrationAPI: PUT /api/v1/registrations/:registration_id/approve
    RegistrationAPI->>DB: Kiểm tra đăng ký đang pending
    RegistrationAPI->>DB: Kiểm tra quyền duyệt
    RegistrationAPI->>DB: Kiểm tra sinh viên chưa có đăng ký hiệu lực khác
    RegistrationAPI->>DB: Kiểm tra sức chứa đề tài
    RegistrationAPI->>DB: Gán GVHD mặc định là giảng viên đề xuất đề tài
    RegistrationAPI->>DB: Cập nhật trạng thái approved
    DB-->>RegistrationAPI: Đăng ký đã duyệt
    RegistrationAPI-->>Web: Trả về đăng ký đã cập nhật
    Web-->>Lecturer: Thông báo duyệt thành công

    Admin->>Web: Đổi GVHD nếu cần
    Web->>RegistrationAPI: GET /api/v1/lecturers/:id/workload
    RegistrationAPI->>DB: Đếm số đăng ký đang hướng dẫn
    DB-->>RegistrationAPI: Tải hướng dẫn hiện tại
    RegistrationAPI-->>Web: Trả về workload giảng viên

    Admin->>Web: Xác nhận phân công GVHD
    Web->>RegistrationAPI: PUT /api/v1/registrations/:registration_id/assign-supervisor
    RegistrationAPI->>DB: Kiểm tra Admin và giảng viên hợp lệ
    RegistrationAPI->>DB: Cập nhật supervisor_id
    RegistrationAPI->>DB: Cập nhật supervisor_assigned_by_id và supervisor_assigned_at
    DB-->>RegistrationAPI: Đăng ký đã cập nhật GVHD
    RegistrationAPI-->>Web: Trả về đăng ký mới
    Web-->>Admin: Thông báo phân công thành công
```

---

## 4.6 — Sequence Diagram tính và công bố kết quả

```mermaid
sequenceDiagram
    actor Lecturer as Giảng viên
    actor Admin as Admin
    actor Student as Sinh viên
    participant Web as Angular Frontend
    participant ScoreAPI as Score API
    participant ResultAPI as Final Result API
    participant DB as PostgreSQL

    Lecturer->>Web: Nhập điểm đánh giá
    Web->>ScoreAPI: POST /api/v1/scores
    ScoreAPI->>DB: Kiểm tra quyền chấm điểm
    ScoreAPI->>DB: Kiểm tra thang điểm hợp lệ
    ScoreAPI->>DB: Tạo hoặc cập nhật score
    DB-->>ScoreAPI: Phiếu điểm đã lưu
    ScoreAPI-->>Web: Trả về điểm đã lưu
    Web-->>Lecturer: Thông báo lưu điểm thành công

    Admin->>Web: Yêu cầu tính kết quả cuối cùng
    Web->>ResultAPI: POST /api/v1/registrations/:registration_id/final-result/calculate
    ResultAPI->>DB: Lấy điểm GVHD đã nộp
    ResultAPI->>DB: Lấy các điểm hội đồng đã nộp
    ResultAPI->>DB: Tính điểm trung bình hội đồng
    ResultAPI->>DB: Tính final_score theo trọng số
    ResultAPI->>DB: Tạo hoặc cập nhật final_results
    DB-->>ResultAPI: Kết quả đã tính
    ResultAPI-->>Web: Trả về kết quả cuối cùng
    Web-->>Admin: Hiển thị kết quả đã tính

    Admin->>Web: Công bố kết quả
    Web->>ResultAPI: POST /api/v1/registrations/:registration_id/final-result/publish
    ResultAPI->>DB: Kiểm tra quyền Admin
    ResultAPI->>DB: Cập nhật trạng thái published
    ResultAPI->>DB: Ghi published_at và published_by_id
    ResultAPI->>DB: Khóa các điểm liên quan
    DB-->>ResultAPI: Kết quả đã công bố
    ResultAPI-->>Web: Trả về kết quả đã công bố
    Web-->>Admin: Thông báo công bố thành công

    Student->>Web: Xem kết quả
    Web->>ResultAPI: GET /api/v1/registrations/:registration_id/final-result
    ResultAPI->>DB: Lấy kết quả đã published của sinh viên
    DB-->>ResultAPI: Dữ liệu kết quả
    ResultAPI-->>Web: Trả về kết quả
    Web-->>Student: Hiển thị kết quả cuối cùng
```
