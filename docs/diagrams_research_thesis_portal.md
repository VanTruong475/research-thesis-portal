# Research Thesis Portal Diagrams

This file documents the current implemented project structure using Mermaid diagrams. GitHub renders Mermaid diagrams automatically in Markdown files.

> Scope: these diagrams follow the current repository implementation, not only the full future design in the planning documents.

---

## 1. Current System Architecture

```mermaid
flowchart TB
    Browser[Web Browser] --> Angular[Angular Frontend]

    subgraph Frontend[Current Angular App]
        AuthUI[Auth]
        DashboardUI[Dashboard]
        UsersUI[Users]
        PeriodsUI[Academic Periods]
        TopicsUI[Topics and Registrations]
        ProgressUI[Progress]
        ReportsUI[Reports]
        CouncilsUI[Councils]
        EvaluationUI[Evaluation and Final Results]
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

    Angular -->|REST JSON and multipart upload| API[FastAPI API v1]

    subgraph Backend[Current FastAPI Backend]
        ApiRouter[app.api.v1.router]
        AuthModule[auth]
        UsersModule[users]
        PeriodsModule[academic_periods]
        TopicsModule[topics]
        RegistrationsModule[registrations and lecturer workload]
        ProgressModule[progress]
        ReportsModule[reports]
        CouncilsModule[councils]
        EvaluationModule[evaluation]
        DashboardModule[dashboard]
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

    subgraph Storage[Current Storage]
        PostgreSQL[(PostgreSQL)]
        Uploads[(Report files on filesystem)]
        Alembic[Alembic migrations]
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

## 2. Current Frontend Routes

```mermaid
flowchart TD
    Root[/ /] --> Login[/auth/login/]
    AnyUnknown[Unknown route] --> Login

    Login --> App[/app/]
    App --> Dashboard[/app/dashboard/]
    App --> Profile[/app/profile/]

    App --> Users[/app/users/]
    App --> NewUser[/app/users/new/]
    App --> Periods[/app/academic-periods/]

    App --> Topics[/app/topics/]
    App --> MyTopics[/app/topics/my-topics/]
    App --> TopicDetail[/app/topics/:topicId/]

    App --> ReviewRegistrations[/app/registrations/review/]
    App --> MyRegistration[/app/registrations/my/]
    App --> Progress[/app/registrations/:registrationId/progress/]
    App --> Reports[/app/registrations/:registrationId/reports/]
    App --> Evaluation[/app/registrations/:registrationId/evaluation/]
    App --> FinalResults[/app/registrations/:registrationId/final-results/]

    App --> Councils[/app/councils/]

    Users -. admin .-> NewUser
    Periods -. admin .-> Periods
    Topics -. student or admin .-> TopicDetail
    MyTopics -. lecturer .-> TopicDetail
    ReviewRegistrations -. lecturer or admin .-> ReviewRegistrations
    Councils -. admin or lecturer .-> Councils
```

---

## 3. Current API Module Map

```mermaid
flowchart LR
    Client[Angular Frontend] --> API[/api/v1/]

    API --> Auth[/auth login refresh logout me/]
    API --> Users[/users and users import/]
    API --> Periods[/academic-periods/]
    API --> Topics[/topics/]
    API --> Registrations[/registrations/]
    API --> Lecturers[/lecturers id workload/]
    API --> Progress[/progress and registration progress/]
    API --> Reports[/reports upload list download/]
    API --> Councils[/councils members schedules period/]
    API --> Scores[/scores/]
    API --> Results[/registrations id final-result/]
    API --> Dashboard[/dashboard stats member-a member-b/]

    Auth --> AuthDB[(users refresh_tokens)]
    Users --> UsersDB[(users)]
    Periods --> PeriodsDB[(academic_periods)]
    Topics --> TopicsDB[(topics registrations)]
    Registrations --> RegistrationsDB[(registrations topics users)]
    Lecturers --> RegistrationsDB
    Progress --> ProgressDB[(milestones progress_logs)]
    Reports --> ReportsDB[(reports)]
    Reports --> Files[(uploaded report files)]
    Councils --> CouncilsDB[(councils council_members defense_schedules)]
    Scores --> EvalDB[(scores final_results)]
    Results --> EvalDB
    Dashboard --> DashboardDB[(current module tables)]
```

---

## 4. Current Implemented ERD

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

## 5. Current Topic and Registration Flow

```mermaid
sequenceDiagram
    actor Lecturer
    actor Admin
    actor Student
    participant Web as Angular UI
    participant API as FastAPI
    participant DB as PostgreSQL

    Lecturer->>Web: Open My Topics
    Web->>API: POST /api/v1/topics
    API->>DB: Create topic with topic_type
    DB-->>API: pending_approval topic
    API-->>Web: Topic created

    Admin->>Web: Review topics
    Web->>API: PUT /api/v1/topics/{topic_id}/approve
    API->>DB: Set topic approved
    API-->>Web: Topic approved

    Student->>Web: View topic list or topic detail
    Web->>API: GET /api/v1/topics
    Web->>API: GET /api/v1/topics/{topic_id}
    API-->>Web: Approved topic data

    Student->>Web: Register topic
    Web->>API: POST /api/v1/registrations
    API->>DB: Create pending registration
    API-->>Web: Registration created

    Lecturer->>Web: Review registration
    Web->>API: PUT /api/v1/registrations/{registration_id}/approve
    API->>DB: Check topic capacity and effective registrations
    API->>DB: Set default supervisor to proposing lecturer
    API-->>Web: Registration approved

    Admin->>Web: Optional supervisor reassignment
    Web->>API: GET /api/v1/lecturers/{id}/workload
    API-->>Web: Current assigned count
    Web->>API: PUT /api/v1/registrations/{registration_id}/assign-supervisor
    API->>DB: Update supervisor_id and assignment metadata
    API-->>Web: Registration updated
```

---

## 6. Current Student Execution Flow

```mermaid
flowchart TD
    ApprovedReg[Approved registration] --> ProgressPage[Open registration progress page]
    ProgressPage --> SubmitProgress[Student submits progress]
    SubmitProgress --> ProgressAPI[POST /api/v1/progress]
    ProgressAPI --> ProgressLog[(progress_logs)]

    ProgressLog --> LecturerComment[Lecturer adds teacher_comment]
    LecturerComment --> CommentAPI[POST /api/v1/progress/{id}/comments]
    CommentAPI --> ProgressLog

    ApprovedReg --> ReportPage[Open registration reports page]
    ReportPage --> UploadReport[Student uploads report file]
    UploadReport --> ReportAPI[POST /api/v1/reports]
    ReportAPI --> ReportRow[(reports row with version number)]
    ReportAPI --> ReportFile[(uploaded file)]

    ReportPage --> ReportHistory[View report history]
    ReportHistory --> ReportListAPI[GET /api/v1/registrations/{registrationId}/reports]
    ReportListAPI --> ReportRow

    ReportHistory --> Download[Download report]
    Download --> DownloadAPI[GET /api/v1/reports/{reportId}/download]
    DownloadAPI --> ReportFile
```

---

## 7. Current Council, Scoring, and Final Result Flow

```mermaid
flowchart TD
    Admin[Admin] --> CreateCouncil[Create council]
    CreateCouncil --> CouncilAPI[POST /api/v1/councils]
    CouncilAPI --> Councils[(councils)]

    Admin --> AddMembers[Assign lecturers to council]
    AddMembers --> MemberAPI[POST /api/v1/councils/{councilId}/members]
    MemberAPI --> CouncilMembers[(council_members)]

    Admin --> ScheduleDefense[Create defense schedule]
    ScheduleDefense --> ScheduleAPI[POST /api/v1/councils/{councilId}/schedules]
    ScheduleAPI --> DefenseSchedules[(defense_schedules)]

    Lecturer[Lecturer or council member] --> SubmitScore[Submit or update score]
    SubmitScore --> ScoreAPI[POST /api/v1/scores]
    ScoreAPI --> Scores[(scores)]

    Lecturer --> EditScore[Update score before lock]
    EditScore --> UpdateScoreAPI[PUT /api/v1/scores/{scoreId}]
    UpdateScoreAPI --> Scores

    Admin --> CalculateResult[Calculate final result]
    CalculateResult --> CalculateAPI[POST /api/v1/registrations/{registrationId}/final-result/calculate]
    CalculateAPI --> FinalResults[(final_results)]

    Admin --> PublishResult[Publish final result]
    PublishResult --> PublishAPI[POST /api/v1/registrations/{registrationId}/final-result/publish]
    PublishAPI --> FinalResults
    PublishAPI --> ScoresLocked[Related scores locked]

    Student[Student] --> ViewResult[View published final result]
    ViewResult --> GetResultAPI[GET /api/v1/registrations/{registrationId}/final-result]
    GetResultAPI --> FinalResults
```

---

## 8. Current Authentication and Refresh Flow

```mermaid
sequenceDiagram
    actor User
    participant Web as Angular UI
    participant Interceptor as Auth Interceptor
    participant API as FastAPI Auth API
    participant DB as PostgreSQL

    User->>Web: Login
    Web->>API: POST /api/v1/auth/login
    API->>DB: Verify user and create refresh token hash
    API-->>Web: access_token and refresh_token
    Web->>Web: Store tokens and current user

    Web->>Interceptor: Send protected request
    Interceptor->>API: Request with Authorization header
    API-->>Interceptor: 401 Unauthorized

    Interceptor->>API: POST /api/v1/auth/refresh
    API->>DB: Validate refresh token hash
    API->>DB: Revoke old refresh token
    API->>DB: Store new refresh token hash
    API-->>Interceptor: New access_token and refresh_token

    Interceptor->>API: Retry original request with new token
    API-->>Web: Protected response

    User->>Web: Logout
    Web->>API: POST /api/v1/auth/logout
    API->>DB: Revoke refresh token
    Web->>Web: Clear local session
```

---

## 9. Current Backend Layering Pattern

```mermaid
flowchart TB
    Router[router.py receives HTTP request]
    Schema[schema or schemas.py validates request and response]
    Service[service.py applies business rules]
    Repository[repository.py performs queries]
    Model[model.py maps database tables]
    Database[(PostgreSQL)]

    Router --> Schema
    Router --> Service
    Service --> Repository
    Repository --> Model
    Model --> Database

    Router -. no business logic .-> RouterRule[Router rule]
    Service -. no direct HTTP response .-> ServiceRule[Service rule]
    Repository -. no FastAPI HTTPException .-> RepositoryRule[Repository rule]
```

---

## 10. Current Module Completion Snapshot

```mermaid
flowchart LR
    subgraph Core[Member A and shared core currently present]
        Auth[Auth]
        Users[Users]
        Periods[Academic Periods]
        Topics[Topics]
        Registrations[Registrations]
        Dashboard[Dashboard]
    end

    subgraph Execution[Member B workflow currently present]
        Progress[Progress]
        Reports[Reports]
        Councils[Councils]
        Evaluation[Scoring]
        Results[Final Results]
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
