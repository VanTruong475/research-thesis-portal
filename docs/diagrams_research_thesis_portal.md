# Sơ đồ hệ thống Research Thesis Portal

File này mô tả cấu trúc dự án hiện tại bằng Mermaid diagrams. Khi push lên GitHub, các khối Mermaid sẽ được GitHub render thành sơ đồ.

> Phạm vi: các sơ đồ bám sát code hiện tại trong repository, không vẽ theo toàn bộ thiết kế tương lai nếu chưa có module/UI rõ ràng trong dự án.

---

## 1. Kiến trúc hệ thống hiện tại

```mermaid
flowchart TB
    Browser["Trình duyệt web"] --> Angular["Angular Frontend"]

    subgraph Frontend["Ứng dụng Angular hiện tại"]
        AuthUI["Đăng nhập"]
        DashboardUI["Dashboard"]
        UsersUI["Quản lý người dùng"]
        PeriodsUI["Đợt học thuật"]
        TopicsUI["Đề tài và đăng ký"]
        ProgressUI["Tiến độ"]
        ReportsUI["Báo cáo"]
        CouncilsUI["Hội đồng"]
        EvaluationUI["Chấm điểm và kết quả"]
    end

    Angular --> AuthUI
    Angular --> DashboardUI
    Angular --> UsersUI
    Angular --> PeriodsUI
    Angular --> TopicsUI
    Angular --> ProgressUI
    Angular --> ReportsUI
    Angular --> CouncilsUI
    Angular --> EvaluationUI

    Angular -->|"REST JSON và upload file"| API["FastAPI API v1"]

    subgraph Backend["FastAPI Backend hiện tại"]
        ApiRouter["app.api.v1.router"]
        AuthModule["auth"]
        UsersModule["users"]
        PeriodsModule["academic_periods"]
        TopicsModule["topics"]
        RegistrationsModule["registrations và lecturer workload"]
        ProgressModule["progress"]
        ReportsModule["reports"]
        CouncilsModule["councils"]
        EvaluationModule["evaluation"]
        DashboardModule["dashboard"]
    end

    API --> ApiRouter
    ApiRouter --> AuthModule
    ApiRouter --> UsersModule
    ApiRouter --> PeriodsModule
    ApiRouter --> TopicsModule
    ApiRouter --> RegistrationsModule
    ApiRouter --> ProgressModule
    ApiRouter --> ReportsModule
    ApiRouter --> CouncilsModule
    ApiRouter --> EvaluationModule
    ApiRouter --> DashboardModule

    subgraph Storage["Lưu trữ hiện tại"]
        PostgreSQL[("PostgreSQL")]
        Uploads[("File báo cáo trên filesystem")]
        Alembic["Alembic migrations"]
    end

    AuthModule --> PostgreSQL
    UsersModule --> PostgreSQL
    PeriodsModule --> PostgreSQL
    TopicsModule --> PostgreSQL
    RegistrationsModule --> PostgreSQL
    ProgressModule --> PostgreSQL
    ReportsModule --> PostgreSQL
    CouncilsModule --> PostgreSQL
    EvaluationModule --> PostgreSQL
    DashboardModule --> PostgreSQL
    ReportsModule --> Uploads
    Alembic --> PostgreSQL
```

---

## 2. Các route frontend hiện tại

```mermaid
flowchart TD
    Root["/"] --> Login["/auth/login"]
    AnyUnknown["Route không tồn tại"] --> Login

    Login --> App["/app"]
    App --> Dashboard["/app/dashboard"]
    App --> Profile["/app/profile"]

    App --> Users["/app/users"]
    App --> NewUser["/app/users/new"]
    App --> Periods["/app/academic-periods"]

    App --> Topics["/app/topics"]
    App --> MyTopics["/app/topics/my-topics"]
    App --> TopicDetail["/app/topics/:topicId"]

    App --> ReviewRegistrations["/app/registrations/review"]
    App --> MyRegistration["/app/registrations/my"]
    App --> Progress["/app/registrations/:registrationId/progress"]
    App --> Reports["/app/registrations/:registrationId/reports"]
    App --> Evaluation["/app/registrations/:registrationId/evaluation"]
    App --> FinalResults["/app/registrations/:registrationId/final-results"]

    App --> Councils["/app/councils"]

    Users -. "Admin" .-> NewUser
    Periods -. "Admin" .-> Periods
    Topics -. "Sinh viên hoặc Admin" .-> TopicDetail
    MyTopics -. "Giảng viên" .-> TopicDetail
    ReviewRegistrations -. "Giảng viên hoặc Admin" .-> ReviewRegistrations
    Councils -. "Admin hoặc Giảng viên" .-> Councils
```

---

## 3. Bản đồ module API hiện tại

```mermaid
flowchart LR
    Client["Angular Frontend"] --> API["/api/v1"]

    API --> Auth["/auth: login, refresh, logout, me"]
    API --> Users["/users: hồ sơ, danh sách, import"]
    API --> Periods["/academic-periods"]
    API --> Topics["/topics"]
    API --> Registrations["/registrations"]
    API --> Lecturers["/lecturers/:id/workload"]
    API --> Progress["/progress và tiến độ theo đăng ký"]
    API --> Reports["/reports: upload, danh sách, download"]
    API --> Councils["/councils: hội đồng, thành viên, lịch"]
    API --> Scores["/scores"]
    API --> Results["/registrations/:id/final-result"]
    API --> Dashboard["/dashboard/stats/member-a và member-b"]

    Auth --> AuthDB[("users, refresh_tokens")]
    Users --> UsersDB[("users")]
    Periods --> PeriodsDB[("academic_periods")]
    Topics --> TopicsDB[("topics, registrations")]
    Registrations --> RegistrationsDB[("registrations, topics, users")]
    Lecturers --> RegistrationsDB
    Progress --> ProgressDB[("milestones, progress_logs")]
    Reports --> ReportsDB[("reports")]
    Reports --> Files[("file báo cáo đã upload")]
    Councils --> CouncilsDB[("councils, council_members, defense_schedules")]
    Scores --> EvalDB[("scores, final_results")]
    Results --> EvalDB
    Dashboard --> DashboardDB[("các bảng module hiện tại")]
```

---

## 4. ERD triển khai hiện tại

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
        varchar phone
        user_role role
        user_status status
        varchar class_name
        varchar department
        timestamptz last_login_at
        timestamptz created_at
        timestamptz updated_at
    }

    REFRESH_TOKENS {
        uuid id PK
        uuid user_id FK
        varchar token_hash UK
        timestamptz expires_at
        timestamptz revoked_at
        uuid replaced_by_token_id FK
        varchar user_agent
        timestamptz created_at
    }

    ACADEMIC_PERIODS {
        uuid id PK
        varchar code UK
        varchar name
        varchar academic_year
        smallint semester
        timestamptz proposal_start_at
        timestamptz proposal_end_at
        timestamptz registration_start_at
        timestamptz registration_end_at
        timestamptz execution_start_at
        timestamptz execution_end_at
        timestamptz report_deadline_at
        timestamptz defense_start_at
        timestamptz defense_end_at
        academic_period_status status
        uuid created_by_id FK
    }

    TOPICS {
        uuid id PK
        uuid academic_period_id FK
        varchar code
        varchar title
        text description
        text requirements
        topic_type topic_type
        smallint max_students
        uuid proposed_by_id FK
        uuid approved_by_id FK
        topic_status status
        text rejection_reason
        timestamptz approved_at
        timestamptz closed_at
        timestamptz cancelled_at
    }

    REGISTRATIONS {
        uuid id PK
        uuid academic_period_id FK
        uuid topic_id FK
        uuid student_id FK
        uuid supervisor_id FK
        registration_status status
        text student_note
        text review_reason
        uuid reviewed_by_id FK
        timestamptz registered_at
        timestamptz reviewed_at
        uuid supervisor_assigned_by_id FK
        timestamptz supervisor_assigned_at
        timestamptz cancelled_at
    }

    MILESTONES {
        uuid id PK
        varchar title
        text description
        timestamptz due_date
        timestamptz created_at
    }

    PROGRESS_LOGS {
        uuid id PK
        uuid registration_id FK
        uuid student_id FK
        uuid milestone_id FK
        text content
        timestamptz submitted_at
        text teacher_comment
        timestamptz commented_at
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
        timestamptz submitted_at
    }

    COUNCILS {
        uuid id PK
        uuid academic_period_id FK
        varchar code
        varchar name
        text description
        varchar default_room
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
        integer presentation_order
        defense_schedule_status status
        text note
        uuid created_by_id FK
    }

    SCORES {
        uuid id PK
        uuid registration_id FK
        uuid evaluator_id FK
        uuid council_id FK
        evaluation_type evaluation_type
        numeric score
        text comments
        score_status status
        timestamptz submitted_at
        timestamptz locked_at
    }

    FINAL_RESULTS {
        uuid id PK
        uuid registration_id FK
        numeric supervisor_score
        numeric council_average_score
        numeric supervisor_weight
        numeric council_weight
        numeric final_score
        result_classification classification
        final_result_status status
        timestamptz calculated_at
        uuid calculated_by_id FK
        timestamptz published_at
        uuid published_by_id FK
    }
```

---

## 5. Luồng đề tài, đăng ký và phân công giảng viên hướng dẫn

```mermaid
sequenceDiagram
    actor Lecturer as Giảng viên
    actor Admin as Admin
    actor Student as Sinh viên
    participant Web as Angular UI
    participant API as FastAPI
    participant DB as PostgreSQL

    Lecturer->>Web: Mở trang đề tài của tôi
    Web->>API: POST /api/v1/topics
    API->>DB: Tạo đề tài kèm topic_type
    DB-->>API: Đề tài ở trạng thái pending_approval
    API-->>Web: Trả về đề tài vừa tạo

    Admin->>Web: Duyệt đề tài
    Web->>API: PUT /api/v1/topics/:topic_id/approve
    API->>DB: Cập nhật trạng thái approved
    API-->>Web: Đề tài đã được duyệt

    Student->>Web: Xem danh sách hoặc chi tiết đề tài
    Web->>API: GET /api/v1/topics
    Web->>API: GET /api/v1/topics/:topic_id
    API-->>Web: Trả về dữ liệu đề tài đã duyệt

    Student->>Web: Đăng ký đề tài
    Web->>API: POST /api/v1/registrations
    API->>DB: Tạo đăng ký pending
    API-->>Web: Trả về đăng ký vừa tạo

    Lecturer->>Web: Duyệt đăng ký
    Web->>API: PUT /api/v1/registrations/:registration_id/approve
    API->>DB: Kiểm tra sức chứa đề tài và đăng ký hiệu lực
    API->>DB: Gán giảng viên đề xuất làm GVHD mặc định
    API-->>Web: Đăng ký đã được duyệt

    Admin->>Web: Đổi GVHD nếu cần
    Web->>API: GET /api/v1/lecturers/:id/workload
    API-->>Web: Trả về tải hướng dẫn hiện tại
    Web->>API: PUT /api/v1/registrations/:registration_id/assign-supervisor
    API->>DB: Cập nhật supervisor_id và metadata phân công
    API-->>Web: Trả về đăng ký đã cập nhật
```

---

## 6. Luồng thực hiện của sinh viên

```mermaid
flowchart TD
    ApprovedReg["Đăng ký đã được duyệt"] --> ProgressPage["Mở trang tiến độ của đăng ký"]
    ProgressPage --> SubmitProgress["Sinh viên nộp tiến độ"]
    SubmitProgress --> ProgressAPI["POST /api/v1/progress"]
    ProgressAPI --> ProgressLog[("progress_logs")]

    ProgressLog --> LecturerComment["Giảng viên thêm nhận xét teacher_comment"]
    LecturerComment --> CommentAPI["POST /api/v1/progress/:id/comments"]
    CommentAPI --> ProgressLog

    ApprovedReg --> ReportPage["Mở trang báo cáo của đăng ký"]
    ReportPage --> UploadReport["Sinh viên upload file báo cáo"]
    UploadReport --> ReportAPI["POST /api/v1/reports"]
    ReportAPI --> ReportRow[("reports row có version")]
    ReportAPI --> ReportFile[("file đã upload")]

    ReportPage --> ReportHistory["Xem lịch sử báo cáo"]
    ReportHistory --> ReportListAPI["GET /api/v1/registrations/:registrationId/reports"]
    ReportListAPI --> ReportRow

    ReportHistory --> Download["Tải báo cáo"]
    Download --> DownloadAPI["GET /api/v1/reports/:reportId/download"]
    DownloadAPI --> ReportFile
```

---

## 7. Luồng hội đồng, chấm điểm và kết quả cuối cùng

```mermaid
flowchart TD
    Admin["Admin"] --> CreateCouncil["Tạo hội đồng"]
    CreateCouncil --> CouncilAPI["POST /api/v1/councils"]
    CouncilAPI --> Councils[("councils")]

    Admin --> AddMembers["Phân công giảng viên vào hội đồng"]
    AddMembers --> MemberAPI["POST /api/v1/councils/:councilId/members"]
    MemberAPI --> CouncilMembers[("council_members")]

    Admin --> ScheduleDefense["Tạo lịch bảo vệ"]
    ScheduleDefense --> ScheduleAPI["POST /api/v1/councils/:councilId/schedules"]
    ScheduleAPI --> DefenseSchedules[("defense_schedules")]

    Lecturer["Giảng viên hoặc thành viên hội đồng"] --> SubmitScore["Nộp hoặc cập nhật điểm"]
    SubmitScore --> ScoreAPI["POST /api/v1/scores"]
    ScoreAPI --> Scores[("scores")]

    Lecturer --> EditScore["Sửa điểm trước khi khóa"]
    EditScore --> UpdateScoreAPI["PUT /api/v1/scores/:scoreId"]
    UpdateScoreAPI --> Scores

    Admin --> CalculateResult["Tính kết quả cuối cùng"]
    CalculateResult --> CalculateAPI["POST /api/v1/registrations/:registrationId/final-result/calculate"]
    CalculateAPI --> FinalResults[("final_results")]

    Admin --> PublishResult["Công bố kết quả cuối cùng"]
    PublishResult --> PublishAPI["POST /api/v1/registrations/:registrationId/final-result/publish"]
    PublishAPI --> FinalResults
    PublishAPI --> ScoresLocked["Khóa các điểm liên quan"]

    Student["Sinh viên"] --> ViewResult["Xem kết quả đã công bố"]
    ViewResult --> GetResultAPI["GET /api/v1/registrations/:registrationId/final-result"]
    GetResultAPI --> FinalResults
```

---

## 8. Luồng đăng nhập và refresh token hiện tại

```mermaid
sequenceDiagram
    actor User as Người dùng
    participant Web as Angular UI
    participant Interceptor as Auth Interceptor
    participant API as FastAPI Auth API
    participant DB as PostgreSQL

    User->>Web: Đăng nhập
    Web->>API: POST /api/v1/auth/login
    API->>DB: Xác thực tài khoản và lưu hash refresh token
    API-->>Web: access_token và refresh_token
    Web->>Web: Lưu token và thông tin người dùng hiện tại

    Web->>Interceptor: Gửi request cần xác thực
    Interceptor->>API: Request kèm Authorization header
    API-->>Interceptor: 401 Unauthorized

    Interceptor->>API: POST /api/v1/auth/refresh
    API->>DB: Kiểm tra hash refresh token
    API->>DB: Thu hồi refresh token cũ
    API->>DB: Lưu hash refresh token mới
    API-->>Interceptor: access_token và refresh_token mới

    Interceptor->>API: Gửi lại request ban đầu với token mới
    API-->>Web: Response thành công

    User->>Web: Đăng xuất
    Web->>API: POST /api/v1/auth/logout
    API->>DB: Thu hồi refresh token
    Web->>Web: Xóa phiên đăng nhập local
```

---

## 9. Mô hình phân lớp backend hiện tại

```mermaid
flowchart TB
    Router["router.py nhận HTTP request"]
    Schema["schema.py hoặc schemas.py validate request/response"]
    Service["service.py xử lý business rules"]
    Repository["repository.py thực hiện truy vấn"]
    Model["model.py ánh xạ bảng database"]
    Database[("PostgreSQL")]

    Router --> Schema
    Router --> Service
    Service --> Repository
    Repository --> Model
    Model --> Database

    Router -. "Không chứa business logic" .-> RouterRule["Quy tắc router"]
    Service -. "Không trả HTTP response trực tiếp" .-> ServiceRule["Quy tắc service"]
    Repository -. "Không raise FastAPI HTTPException" .-> RepositoryRule["Quy tắc repository"]
```

---

## 10. Snapshot module hiện có

```mermaid
flowchart LR
    subgraph Core["Member A và phần core/shared hiện có"]
        Auth["Auth"]
        Users["Users"]
        Periods["Academic Periods"]
        Topics["Topics"]
        Registrations["Registrations"]
        Dashboard["Dashboard"]
    end

    subgraph Execution["Workflow Member B hiện có"]
        Progress["Progress"]
        Reports["Reports"]
        Councils["Councils"]
        Evaluation["Scoring"]
        Results["Final Results"]
    end

    Auth --> Users
    Users --> Periods
    Periods --> Topics
    Topics --> Registrations
    Registrations --> Progress
    Registrations --> Reports
    Registrations --> Councils
    Councils --> Evaluation
    Evaluation --> Results
    Dashboard --> Core
    Dashboard --> Execution
```
