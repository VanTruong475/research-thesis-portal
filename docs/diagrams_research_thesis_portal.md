# Sơ đồ hệ thống Research Thesis Portal

File này tổng hợp các sơ đồ Mermaid dùng cho báo cáo và GitHub Markdown. Các sơ đồ bám theo hệ thống hiện tại của dự án Research Thesis Portal.

> Ghi chú trình bày: các sơ đồ lớn đã được rút gọn hoặc tách theo nhóm để khi đưa vào báo cáo/GitHub không bị quá nhỏ.

---

## 3.1 — Sơ đồ Use Case tổng quát của hệ thống

```mermaid
flowchart LR
    Admin["Admin"]
    Lecturer["Giảng viên"]
    Student["Sinh viên"]

    subgraph System["Research Thesis Portal"]
        direction TB

        subgraph AdminLane["Nhóm chức năng Admin"]
            direction LR
            A_Users(["Quản lý người dùng"])
            A_Periods(["Quản lý đợt học thuật"])
            A_Topics(["Duyệt đề tài"])
            A_Assign(["Phân công GVHD"])
            A_Council(["Hội đồng & kết quả"])
        end

        subgraph LecturerLane["Nhóm chức năng Giảng viên"]
            direction LR
            L_Profile(["Đăng nhập & hồ sơ"])
            L_Topics(["Đề xuất / quản lý đề tài"])
            L_Registrations(["Duyệt đăng ký"])
            L_Progress(["Theo dõi tiến độ"])
            L_Score(["Chấm điểm"])
        end

        subgraph StudentLane["Nhóm chức năng Sinh viên"]
            direction LR
            S_Profile(["Đăng nhập & hồ sơ"])
            S_Topics(["Tìm kiếm / xem đề tài"])
            S_Register(["Đăng ký đề tài"])
            S_Progress(["Nộp tiến độ / báo cáo"])
            S_Result(["Xem kết quả"])
        end
    end

    Admin --> A_Users
    Admin --> A_Periods
    Admin --> A_Topics
    Admin --> A_Assign
    Admin --> A_Council

    Lecturer --> L_Profile
    Lecturer --> L_Topics
    Lecturer --> L_Registrations
    Lecturer --> L_Progress
    Lecturer --> L_Score

    Student --> S_Profile
    Student --> S_Topics
    Student --> S_Register
    Student --> S_Progress
    Student --> S_Result

    A_Users -. "<<extend>>" .-> A_Periods
    A_Topics -. "<<extend>>" .-> A_Assign
    A_Council -. "<<extend>>" .-> A_Assign

    L_Topics -. "<<extend>>" .-> L_Registrations
    L_Progress -. "<<extend>>" .-> L_Score

    S_Topics -. "<<extend>>" .-> S_Register
    S_Progress -. "<<extend>>" .-> S_Result
```

---

## 3.1.2 — Use Case chi tiết Sinh viên

```mermaid
flowchart LR
    Student["Sinh viên"]

    subgraph StudentCases["Chức năng của Sinh viên"]
        Login(["Đăng nhập"])
        UpdateProfile(["Cập nhật hồ sơ cá nhân"])
        ViewTopics(["Xem danh sách đề tài"])
        ViewTopicDetail(["Xem chi tiết đề tài"])
        RegisterTopic(["Đăng ký đề tài"])
        ViewRegistration(["Xem đăng ký của tôi"])
        CancelRegistration(["Hủy đăng ký đang chờ duyệt"])
        SubmitProgress(["Nộp tiến độ"])
        ViewProgressComment(["Xem nhận xét tiến độ"])
        UploadReport(["Nộp báo cáo"])
        ViewReportHistory(["Xem lịch sử báo cáo"])
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
    Student --> ViewFinalResult

    ViewTopics --> ViewTopicDetail
    ViewTopicDetail --> RegisterTopic
    UploadReport --> ViewReportHistory
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
        UpdateOwnTopic(["Cập nhật đề tài"])
        ViewOwnTopics(["Xem đề tài của tôi"])
        ReviewRegistration(["Duyệt / từ chối đăng ký"])
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
    Lecturer --> ViewProgress
    Lecturer --> CommentProgress
    Lecturer --> ViewReports
    Lecturer --> SubmitSupervisorScore
    Lecturer --> SubmitCouncilScore
    Lecturer --> ViewCouncil
    Lecturer --> ViewDashboard

    ViewOwnTopics --> UpdateOwnTopic
    ViewProgress --> CommentProgress
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
        ImportUsers(["Import người dùng CSV"])
        ManagePeriods(["Quản lý đợt học thuật"])
        ReviewTopics(["Duyệt / từ chối đề tài"])
        ViewRegistrations(["Xem danh sách đăng ký"])
        AssignSupervisor(["Phân công / đổi GVHD"])
        ViewLecturerWorkload(["Xem tải hướng dẫn"])
        ManageCouncils(["Tạo hội đồng"])
        AssignCouncilMembers(["Phân công thành viên"])
        ScheduleDefense(["Xếp lịch bảo vệ"])
        CalculateFinalResult(["Tính kết quả"])
        PublishFinalResult(["Công bố kết quả"])
        ViewDashboard(["Xem dashboard"])
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
    Period["Admin mở đợt học thuật"]
    Propose["Giảng viên đề xuất đề tài"]
    TopicReview{"Admin duyệt đề tài?"}
    ApprovedTopic["Đề tài được công bố"]
    Register["Sinh viên đăng ký đề tài"]
    RegistrationReview{"Đăng ký được duyệt?"}
    ApproveRegistration["Đăng ký được duyệt và gán GVHD"]
    Execute["Sinh viên thực hiện đề tài"]
    Progress["Nộp tiến độ và nhận xét"]
    Report["Nộp báo cáo / sản phẩm"]
    Council["Tạo hội đồng và lịch bảo vệ"]
    Score["GVHD và hội đồng nhập điểm"]
    Calculate["Tính kết quả cuối cùng"]
    Publish["Công bố kết quả"]
    End(["Kết thúc"])

    Start --> Period
    Period --> Propose
    Propose --> TopicReview
    TopicReview -->|"Không"| Propose
    TopicReview -->|"Có"| ApprovedTopic
    ApprovedTopic --> Register
    Register --> RegistrationReview
    RegistrationReview -->|"Không"| Register
    RegistrationReview -->|"Có"| ApproveRegistration
    ApproveRegistration --> Execute
    Execute --> Progress
    Execute --> Report
    Report --> Council
    Council --> Score
    Score --> Calculate
    Calculate --> Publish
    Publish --> End
```

---

## 4.2 — ERD tổng quan 13 bảng hiện tại

```mermaid
erDiagram
    USERS ||--o{ REFRESH_TOKENS : owns
    USERS ||--o{ ACADEMIC_PERIODS : creates
    USERS ||--o{ TOPICS : proposes
    USERS ||--o{ TOPICS : approves
    USERS ||--o{ REGISTRATIONS : registers
    USERS ||--o{ REGISTRATIONS : supervises
    USERS ||--o{ PROGRESS_LOGS : submits
    USERS ||--o{ REPORTS : uploads
    USERS ||--o{ COUNCIL_MEMBERS : joins
    USERS ||--o{ SCORES : evaluates
    USERS ||--o{ FINAL_RESULTS : manages

    ACADEMIC_PERIODS ||--o{ TOPICS : contains
    ACADEMIC_PERIODS ||--o{ REGISTRATIONS : contains
    ACADEMIC_PERIODS ||--o{ COUNCILS : organizes

    TOPICS ||--o{ REGISTRATIONS : receives
    REGISTRATIONS ||--o{ PROGRESS_LOGS : has
    REGISTRATIONS ||--o{ REPORTS : has
    REGISTRATIONS ||--o| DEFENSE_SCHEDULES : scheduled_for
    REGISTRATIONS ||--o{ SCORES : receives
    REGISTRATIONS ||--o| FINAL_RESULTS : produces

    MILESTONES ||--o{ PROGRESS_LOGS : tracks
    COUNCILS ||--o{ COUNCIL_MEMBERS : contains
    COUNCILS ||--o{ DEFENSE_SCHEDULES : schedules
    COUNCILS ||--o{ SCORES : groups

    USERS {
        uuid id PK
        varchar email UK
        user_role role
    }

    REFRESH_TOKENS {
        uuid id PK
        uuid user_id FK
        varchar token_hash UK
    }

    ACADEMIC_PERIODS {
        uuid id PK
        varchar code UK
        academic_period_status status
    }

    TOPICS {
        uuid id PK
        uuid academic_period_id FK
        uuid proposed_by_id FK
        topic_status status
    }

    REGISTRATIONS {
        uuid id PK
        uuid topic_id FK
        uuid student_id FK
        uuid supervisor_id FK
        registration_status status
    }

    MILESTONES {
        uuid id PK
        varchar title
        timestamptz due_date
    }

    PROGRESS_LOGS {
        uuid id PK
        uuid registration_id FK
        uuid student_id FK
        uuid milestone_id FK
    }

    REPORTS {
        uuid id PK
        uuid registration_id FK
        uuid student_id FK
        integer version
    }

    COUNCILS {
        uuid id PK
        uuid academic_period_id FK
        council_status status
    }

    COUNCIL_MEMBERS {
        uuid id PK
        uuid council_id FK
        uuid lecturer_id FK
    }

    DEFENSE_SCHEDULES {
        uuid id PK
        uuid council_id FK
        uuid registration_id FK
    }

    SCORES {
        uuid id PK
        uuid registration_id FK
        uuid evaluator_id FK
        evaluation_type evaluation_type
    }

    FINAL_RESULTS {
        uuid id PK
        uuid registration_id FK
        numeric final_score
    }
```

---

## 4.2.1 — ERD nhóm người dùng, đợt học thuật, đề tài và đăng ký

```mermaid
erDiagram
    USERS ||--o{ REFRESH_TOKENS : owns
    USERS ||--o{ ACADEMIC_PERIODS : creates
    USERS ||--o{ TOPICS : proposes
    USERS ||--o{ TOPICS : approves
    USERS ||--o{ REGISTRATIONS : registers
    USERS ||--o{ REGISTRATIONS : supervises

    ACADEMIC_PERIODS ||--o{ TOPICS : contains
    ACADEMIC_PERIODS ||--o{ REGISTRATIONS : contains
    TOPICS ||--o{ REGISTRATIONS : receives

    USERS {
        uuid id PK
        varchar institutional_code UK
        varchar email UK
        varchar full_name
        user_role role
        user_status status
    }

    REFRESH_TOKENS {
        uuid id PK
        uuid user_id FK
        varchar token_hash UK
        timestamptz expires_at
    }

    ACADEMIC_PERIODS {
        uuid id PK
        varchar code UK
        varchar name
        varchar academic_year
        academic_period_status status
    }

    TOPICS {
        uuid id PK
        uuid academic_period_id FK
        varchar code
        varchar title
        topic_type topic_type
        topic_status status
        uuid proposed_by_id FK
        uuid approved_by_id FK
    }

    REGISTRATIONS {
        uuid id PK
        uuid academic_period_id FK
        uuid topic_id FK
        uuid student_id FK
        uuid supervisor_id FK
        registration_status status
    }
```

---

## 4.2.2 — ERD nhóm tiến độ và báo cáo

```mermaid
erDiagram
    USERS ||--o{ PROGRESS_LOGS : submits
    USERS ||--o{ REPORTS : uploads
    REGISTRATIONS ||--o{ PROGRESS_LOGS : has
    REGISTRATIONS ||--o{ REPORTS : has
    MILESTONES ||--o{ PROGRESS_LOGS : tracks

    USERS {
        uuid id PK
        varchar full_name
        user_role role
    }

    REGISTRATIONS {
        uuid id PK
        uuid student_id FK
        uuid supervisor_id FK
        registration_status status
    }

    MILESTONES {
        uuid id PK
        varchar title
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
        uuid student_id FK
        varchar file_name
        varchar file_path
        varchar report_type
        integer version
    }
```

---

## 4.2.3 — ERD nhóm hội đồng, chấm điểm và kết quả

```mermaid
erDiagram
    USERS ||--o{ COUNCIL_MEMBERS : joins
    USERS ||--o{ SCORES : evaluates
    USERS ||--o{ FINAL_RESULTS : manages

    ACADEMIC_PERIODS ||--o{ COUNCILS : organizes
    REGISTRATIONS ||--o| DEFENSE_SCHEDULES : scheduled_for
    REGISTRATIONS ||--o{ SCORES : receives
    REGISTRATIONS ||--o| FINAL_RESULTS : produces

    COUNCILS ||--o{ COUNCIL_MEMBERS : contains
    COUNCILS ||--o{ DEFENSE_SCHEDULES : schedules
    COUNCILS ||--o{ SCORES : groups

    USERS {
        uuid id PK
        varchar full_name
        user_role role
    }

    ACADEMIC_PERIODS {
        uuid id PK
        varchar code UK
        academic_period_status status
    }

    REGISTRATIONS {
        uuid id PK
        uuid student_id FK
        uuid supervisor_id FK
        registration_status status
    }

    COUNCILS {
        uuid id PK
        uuid academic_period_id FK
        varchar code
        varchar name
        council_type council_type
        council_status status
    }

    COUNCIL_MEMBERS {
        uuid id PK
        uuid council_id FK
        uuid lecturer_id FK
        council_member_role member_role
    }

    DEFENSE_SCHEDULES {
        uuid id PK
        uuid council_id FK
        uuid registration_id FK
        timestamptz scheduled_at
        varchar room
    }

    SCORES {
        uuid id PK
        uuid registration_id FK
        uuid evaluator_id FK
        uuid council_id FK
        numeric score
        score_status status
    }

    FINAL_RESULTS {
        uuid id PK
        uuid registration_id FK
        numeric supervisor_score
        numeric council_average_score
        numeric final_score
        final_result_status status
    }
```

---

## 4.5 — State Machine của đăng ký đề tài

```mermaid
stateDiagram-v2
    [*] --> pending: Sinh viên tạo đăng ký

    pending --> approved: Duyệt đăng ký
    pending --> rejected: Từ chối đăng ký
    pending --> cancelled: Sinh viên hủy

    approved --> in_progress: Bắt đầu thực hiện
    in_progress --> completed: Hoàn thành đề tài
    approved --> completed: Hoàn tất trực tiếp

    rejected --> [*]
    cancelled --> [*]
    completed --> [*]

    note right of pending
        Đang chờ xét duyệt.
        Thuộc nhóm trạng thái hiệu lực.
    end note

    note right of approved
        Đã được duyệt.
        Phải có supervisor_id.
    end note

    note right of in_progress
        Sinh viên thực hiện đề tài,
        nộp tiến độ và báo cáo.
    end note
```

---

## 4.6 — Sequence Diagram đăng ký đề tài

```mermaid
sequenceDiagram
    autonumber
    actor Student as Sinh viên
    participant Web as Frontend
    participant API as Backend API
    participant DB as Database

    Student->>Web: Xem danh sách đề tài
    Web->>API: GET /topics
    API->>DB: Lấy đề tài được phép hiển thị
    DB-->>API: Danh sách đề tài
    API-->>Web: Trả dữ liệu
    Web-->>Student: Hiển thị đề tài

    Student->>Web: Gửi đăng ký
    Web->>API: POST /registrations
    API->>DB: Kiểm tra điều kiện đăng ký
    API->>DB: Tạo đăng ký pending
    DB-->>API: Đăng ký mới
    API-->>Web: Kết quả đăng ký
    Web-->>Student: Thông báo thành công
```

---

## 4.6 — Sequence Diagram duyệt đăng ký đề tài

```mermaid
sequenceDiagram
    autonumber
    actor Lecturer as Giảng viên
    actor Admin as Admin
    participant Web as Frontend
    participant API as Backend API
    participant DB as Database

    Lecturer->>Web: Mở danh sách đăng ký
    Web->>API: GET /registrations
    API->>DB: Lấy đăng ký theo quyền
    DB-->>API: Danh sách đăng ký
    API-->>Web: Trả dữ liệu

    Lecturer->>Web: Duyệt đăng ký
    Web->>API: PUT /registrations/:id/approve
    API->>DB: Kiểm tra quyền và sức chứa đề tài
    API->>DB: Gán GVHD mặc định
    API->>DB: Cập nhật approved
    DB-->>API: Đăng ký đã duyệt
    API-->>Web: Kết quả duyệt
    Web-->>Lecturer: Thông báo thành công

    Admin->>Web: Đổi GVHD nếu cần
    Web->>API: PUT /registrations/:id/assign-supervisor
    API->>DB: Kiểm tra giảng viên hợp lệ
    API->>DB: Cập nhật supervisor_id
    DB-->>API: Đăng ký đã cập nhật
    API-->>Web: Kết quả phân công
```

---

## 4.6 — Sequence Diagram tính và công bố kết quả

```mermaid
sequenceDiagram
    autonumber
    actor Lecturer as Giảng viên
    actor Admin as Admin
    actor Student as Sinh viên
    participant Web as Frontend
    participant API as Backend API
    participant DB as Database

    Lecturer->>Web: Nhập điểm
    Web->>API: POST /scores
    API->>DB: Kiểm tra quyền và lưu điểm
    DB-->>API: Điểm đã lưu
    API-->>Web: Trả kết quả

    Admin->>Web: Tính kết quả
    Web->>API: POST /registrations/:id/final-result/calculate
    API->>DB: Lấy điểm GVHD và hội đồng
    API->>DB: Tính final_score
    API->>DB: Lưu final_results
    DB-->>API: Kết quả đã tính
    API-->>Web: Trả kết quả

    Admin->>Web: Công bố kết quả
    Web->>API: POST /registrations/:id/final-result/publish
    API->>DB: Cập nhật published và khóa điểm
    DB-->>API: Kết quả đã công bố
    API-->>Web: Trả kết quả

    Student->>Web: Xem kết quả
    Web->>API: GET /registrations/:id/final-result
    API->>DB: Lấy kết quả đã công bố
    DB-->>API: Dữ liệu kết quả
    API-->>Web: Trả kết quả
    Web-->>Student: Hiển thị kết quả
```
