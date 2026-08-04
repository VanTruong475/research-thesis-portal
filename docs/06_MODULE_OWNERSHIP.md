# Module Ownership

Version: 1.0

Status: Approved

Last Updated: 2026-08-04

Owner: Development Team

---

# 1. Purpose

This document defines ownership, responsibilities, review process, collaboration rules,
and module boundaries for the Research Thesis Management System.

The goals are:

- Prevent duplicated implementation.
- Reduce merge conflicts.
- Clearly assign responsibilities.
- Keep the architecture consistent.
- Help Claude Code and Antigravity understand project boundaries.
- Ensure long-term maintainability.

This document must always be consistent with:

- BUSINESS_RULES.md
- DATABASE_RULES.md
- API_CONTRACT.md
- ERD.md
- DECISIONS.md

---

# 2. Team

## Member A

Name

Nguyen Van Truong

Primary AI

Claude Code

Primary Responsibilities

- Project initialization
- FastAPI architecture
- Angular architecture
- Authentication
- Authorization
- Users
- Academic Periods
- Topics
- Registrations
- Shared backend infrastructure
- Shared frontend infrastructure
- Docker
- Alembic
- Database initialization

Secondary Responsibilities

- Review Progress module
- Review Reports module
- Review Councils module
- Review Final Results module

---

## Member B

Name

Nguyen Quoc Vu

Primary AI

Antigravity

Primary Responsibilities

- Supervisor Assignment
- Lecturer Workload
- Progress
- Progress Comments
- Reports
- Report Versioning
- Deadline Extensions
- Councils
- Council Members
- Defense Schedule
- Scoring
- Final Results

Secondary Responsibilities

- Review Authentication
- Review Registration
- Review Topic Management

---

# 3. Ownership Principles

Every module must have exactly one owner.

Only the owner has authority to:

- redesign the module
- rename files
- rename APIs
- change business logic
- refactor module architecture

Other members may:

- report bugs
- create Pull Requests
- improve documentation
- write tests

Cross-module modifications require review.

---

# 4. Repository Structure

```
research-thesis-portal/

backend/

frontend/

docs/

.github/

docker-compose.yml

CLAUDE.md

AGENTS.md
```

Repository ownership

| Area | Owner |
|------|-------|
| backend | Shared |
| frontend | Shared |
| docs | Shared |
| Docker | Member A |
| GitHub Workflow | Shared |

---

# 5. Backend Ownership

Backend architecture

```
app/

core/

db/

common/

modules/

tests/
```

Member A owns

```
modules/auth

modules/users

modules/academic_periods

modules/topics

modules/registrations
```

Member B owns

```
modules/supervision

modules/progress

modules/reports

modules/councils

modules/scoring

modules/results
```

Shared folders

```
core

db

common

tests
```

Shared folders cannot be heavily modified without discussion.

---

# 6. Frontend Ownership

Angular structure

```
core/

shared/

layouts/

features/

guards/

interceptors/
```

Member A owns

```
features/auth

features/users

features/topics

features/registrations

features/academic-periods
```

Member B owns

```
features/progress

features/reports

features/councils

features/scoring

features/results

features/supervision
```

Shared frontend

```
core/

shared/

layouts/

assets/

environments/
```

Shared frontend components require review.

---

# 7. Shared Infrastructure

The following components belong to the whole project.

Backend

```
config.py

security.py

database.py

responses.py

exceptions.py

pagination.py

logging.py

jwt.py
```

Frontend

```
AuthInterceptor

ErrorInterceptor

Route Guards

App Layout

Theme

Global Styles
```

Documentation

```
BUSINESS_RULES.md

DATABASE_RULES.md

API_CONTRACT.md

ERD.md

DECISIONS.md
```

Nobody may replace shared infrastructure without team agreement.

---

# 8. Database Ownership

Shared entities

users

academic_periods

topics

registrations

Owned by Member A

Supervisor related

progress_logs

reports

councils

scores

results

Owned by Member B

Shared enums

shared migrations

audit logs

refresh tokens

Require discussion before changes.

---

# 9. Business Ownership Matrix

| Module | Owner | Reviewer |
|---------|-------|----------|
| Auth | Member A | Member B |
| Users | Member A | Member B |
| Academic Period | Member A | Member B |
| Topics | Member A | Member B |
| Registration | Member A | Member B |
| Supervisor | Member B | Member A |
| Progress | Member B | Member A |
| Reports | Member B | Member A |
| Councils | Member B | Member A |
| Scoring | Member B | Member A |
| Final Results | Member B | Member A |

---
# 10. API Ownership

Each business module owns its API layer.

Every module is responsible for:

- Router
- Request Schema
- Response Schema
- Service
- Repository
- Unit Test
- Swagger Documentation

Example

```
modules/

auth/
    router.py
    service.py
    repository.py
    schemas.py

topics/
    router.py
    service.py
    repository.py
    schemas.py
```

Every API must follow:

```
docs/API_CONTRACT.md
```

No module may define its own response format.

Forbidden

```json
{
    "detail": "..."
}
```

Correct

```json
{
    "success": true,
    "message": "...",
    "data": {}
}
```

---

# 11. Database Migration Ownership

Database migration ownership is separated to reduce merge conflicts.

## Member A

Responsible for migrations involving:

```
users

refresh_tokens

academic_periods

topics

registrations

shared_enums
```

## Member B

Responsible for migrations involving:

```
supervisor_assignments

milestones

progress_logs

progress_comments

reports

report_versions

report_extensions

councils

council_members

defense_schedules

scores

final_results
```

## Shared Rule

If one migration changes tables
owned by both members:

- discuss first
- only ONE person creates the migration
- the other reviews it

Never create parallel migrations
for the same schema change.

Never modify
an already merged migration.

---

# 12. Folder Rules

Backend follows:

```
modules/

module_name/

router.py

service.py

repository.py

schemas.py

models.py

dependencies.py
```

Do not create:

```
utils.py

helpers.py

misc.py

common.py
```

inside feature modules.

Shared utilities belong to

```
common/
```

Shared security belongs to

```
core/
```

Shared database belongs to

```
db/
```

---

# 13. Import Rules

Allowed dependency direction

```
Router

↓

Service

↓

Repository

↓

Database
```

Forbidden

```
Router

↓

Database
```

Forbidden

```
Repository

↓

Router
```

Forbidden

```
Service

↓

FastAPI Request
```

Repository never imports:

- FastAPI
- Request
- Response
- JWT
- HTTPException

Repository only communicates
with SQLAlchemy.

---

# 14. Business Dependency

Approved dependency

```
Users

↓

Academic Period

↓

Topics

↓

Registrations

↓

Supervision

↓

Progress

↓

Reports

↓

Councils

↓

Scoring

↓

Results
```

Later modules may use earlier modules.

Earlier modules must NOT depend
on later modules.

Example

Allowed

```
Progress

↓

Registration
```

Forbidden

```
Registration

↓

Progress
```

---

# 15. Shared Components

The following components are shared.

Backend

```
core/config.py

core/security.py

core/logger.py

db/session.py

db/base.py

common/responses.py

common/exceptions.py

common/pagination.py
```

Frontend

```
core/

shared/

layout/

interceptors/

guards/

theme/
```

Documentation

```
BUSINESS_RULES.md

DATABASE_RULES.md

API_CONTRACT.md

ERD.md

DECISIONS.md
```

Shared components require
code review before merging.

---

# 16. Git Branch Rules

Permanent branches

```
main

dev
```

Feature branches

```
feature/auth

feature/topics

feature/registration

feature/progress

feature/reports

feature/scoring
```

Bug fix

```
fix/login

fix/migration

fix/report-upload
```

Documentation

```
docs/api

docs/erd

docs/business-rules
```

Testing

```
test/auth

test/topics
```

Never develop directly on

```
main
```

Never develop directly on

```
dev
```

Every feature starts
from

```
dev
```

---

# 17. Pull Request Rules

Every Pull Request must include

Summary

Changed modules

Changed APIs

Database impact

Migration status

Testing status

Screenshots (Frontend)

Known limitations

Checklist

Example

```
## Summary

Implement Topic Approval

## Modules

topics

## Database

No migration

## Tests

7 passed

## Limitation

Email notification
not implemented
```

Pull Request reviewers

| Module | Reviewer |
|----------|-----------|
| Auth | Member B |
| Users | Member B |
| Topics | Member B |
| Registration | Member B |
| Progress | Member A |
| Reports | Member A |
| Councils | Member A |
| Results | Member A |

Large Pull Requests

> 500 lines

should be avoided.

Preferred size

```
100~300 lines
```

per Pull Request.

---
# 18. Commit Convention

The project follows the Conventional Commits specification.

Allowed commit types

```
feat
fix
docs
refactor
test
chore
perf
build
ci
style
```

Commit message format

```
<type>(<scope>): <description>
```

Examples

```
feat(auth): implement login endpoint

feat(topics): add topic approval service

feat(progress): implement milestone validation

fix(registration): prevent duplicate registration

docs(api): update authentication contract

refactor(users): simplify repository

test(auth): add expired token test

chore(project): initialize FastAPI architecture
```

Rules

- One commit should contain one logical change.
- Do not combine unrelated modules.
- Avoid "update", "fix bug", "change".
- Commit message must clearly describe the change.

---

# 19. Testing Ownership

Every module owner is responsible for testing their own module.

Member A

Responsible for

- Auth Tests
- User Tests
- Topic Tests
- Registration Tests

Member B

Responsible for

- Progress Tests
- Report Tests
- Council Tests
- Score Tests
- Result Tests

Shared

Responsible by both members

- Authentication flow
- Database migration
- API integration
- Docker
- End-to-end workflow

---

## Required Test Types

Every feature should include

Unit Test

Integration Test

Validation Test

Permission Test

Business Rule Test

Example

Registration

```
Student registers successfully

Topic full

Registration closed

Duplicate registration

Unauthorized request

Wrong role

Database rollback
```

---

# 20. Code Review Rules

Every Pull Request requires review.

The reviewer checks

Business Logic

API Contract

Database

Migration

Security

Performance

Coding Style

Tests

Swagger

Documentation

---

## Review Checklist

Business Rules followed

API Contract followed

Database Rules followed

Migration included

No duplicated code

No hard-coded secrets

Authorization implemented

Validation completed

Tests passed

Swagger updated

No unnecessary refactoring

---

## Review Result

Possible review results

```
Approved

Approved with comments

Request changes
```

Never merge

Request changes

without resolving comments.

---

# 21. Conflict Resolution

Merge conflicts must never be solved automatically
without understanding both implementations.

Priority

Business Rules

↓

Database Rules

↓

API Contract

↓

ERD

↓

Existing implementation

If conflict exists

Discuss first.

Then merge.

---

## Database Conflict

Migration conflicts require

- discussion

- one migration owner

- review

Never delete another migration.

Never rename merged migration files.

---

## API Conflict

If two modules require different API behavior

Do not implement immediately.

Record the discussion inside

```
DECISIONS.md
```

Wait for agreement.

---

# 22. AI Coding Rules

The project uses

Claude Code

and

Antigravity.

Both AI tools must follow exactly the same rules.

---

## Before Coding

Always read

```
BUSINESS_RULES.md

DATABASE_RULES.md

API_CONTRACT.md

ERD.md

DECISIONS.md
```

before writing code.

Never skip documentation.

---

## During Coding

AI must

- follow business rules

- follow API contract

- follow naming convention

- follow database rules

- follow module ownership

- follow project architecture

AI must NOT

- invent new requirements

- rename database tables

- rename API endpoints

- rename enums

- modify another module

- perform unrelated refactoring

- remove comments without reason

---

## Before Finishing

AI must verify

Business Logic

↓

Validation

↓

Permission

↓

Tests

↓

Swagger

↓

Documentation

Only then

report completion.

Never report

"completed"

if tests fail.

---

# 23. Documentation Responsibilities

Documentation is a first-class project artifact.

Every completed feature must update documentation.

Possible documents

BUSINESS_RULES.md

DATABASE_RULES.md

API_CONTRACT.md

ERD.md

DECISIONS.md

Swagger

README

---

## Documentation Update

Example

New endpoint

↓

Update API Contract

↓

Update Swagger

↓

Update README if necessary

Do not allow documentation
to become outdated.

---

# 24. Security Responsibilities

Every developer is responsible for security.

Minimum requirements

Passwords

Hash only

JWT

Short lifetime

Refresh Token

Store hash only

Authorization

Backend only

Validation

Backend only

File Upload

Validate

- extension

- MIME type

- file size

Never trust frontend validation.

---

## Sensitive Information

Never commit

```
.env

database password

JWT secret

private key

API key
```

Use

```
.env.example
```

instead.

---

# 25. Deployment Responsibilities

Member A

Responsible for

Docker Compose

Backend container

Database initialization

Alembic

Environment

Member B

Responsible for

Angular build

Frontend deployment

Testing deployment

Shared

Release testing

Database migration

Production checklist

Smoke testing

---

## Release Checklist

Docker starts successfully

Database migration successful

Angular builds successfully

Backend starts successfully

Swagger available

Authentication working

Database connected

Environment variables configured

Tests passed

No secrets committed

README updated

---

# 26. Ownership Matrix

| Area | Owner | Reviewer |
|------|-------|----------|
| Authentication | Member A | Member B |
| Authorization | Member A | Member B |
| Users | Member A | Member B |
| Academic Period | Member A | Member B |
| Topics | Member A | Member B |
| Registration | Member A | Member B |
| Supervision | Member B | Member A |
| Progress | Member B | Member A |
| Reports | Member B | Member A |
| Councils | Member B | Member A |
| Scoring | Member B | Member A |
| Results | Member B | Member A |
| Docker | Member A | Member B |
| Documentation | Shared | Shared |
| Database | Shared | Shared |

---

# 27. Ownership Principles Summary

Every module has one owner.

Every module has one reviewer.

Shared infrastructure requires discussion.

Shared database changes require discussion.

Shared API changes require discussion.

Documentation is mandatory.

Tests are mandatory.

Business Rules are the source of truth.

Database Rules are mandatory.

API Contract is mandatory.

ERD is mandatory.

AI tools must follow all project documents.

No implementation may violate
the approved project documentation.

---
# 28. Development Workflow

All development must follow the workflow below.

```
Project Planning
        │
        ▼
Business Rules
        │
        ▼
Database Rules
        │
        ▼
ERD
        │
        ▼
API Contract
        │
        ▼
Task Assignment
        │
        ▼
Create Feature Branch
        │
        ▼
Implementation
        │
        ▼
Unit Test
        │
        ▼
Integration Test
        │
        ▼
Code Review
        │
        ▼
Merge into dev
        │
        ▼
Release Testing
        │
        ▼
Merge into main
```

No feature should skip any required step.

---

# 29. Feature Development Lifecycle

Every feature follows the same lifecycle.

Step 1

Understand the requirement.

Read

- Business Rules
- SRS
- Use Case
- ERD

---

Step 2

Check ownership.

Determine

- owner
- reviewer
- related modules

---

Step 3

Design

Confirm

- database impact

- API impact

- business rules

- permissions

---

Step 4

Implementation

Implement

- database

- repository

- service

- router

- schemas

---

Step 5

Testing

Execute

- unit test

- integration test

- permission test

- validation test

---

Step 6

Documentation

Update

- Swagger

- API Contract

- README (if needed)

- Decisions (if architecture changed)

---

Step 7

Pull Request

Create Pull Request

Assign reviewer

Resolve comments

Merge into dev

---

# 30. Definition of Done

A feature is considered complete only if all conditions below are satisfied.

## Business

Business Rules implemented.

Use Case completed.

Acceptance Criteria satisfied.

---

## Backend

Database migration completed.

Repository completed.

Service completed.

Router completed.

Validation completed.

Authorization completed.

Exception handling completed.

Logging completed.

---

## Database

Migration tested.

Foreign Keys validated.

Constraints verified.

Indexes reviewed.

Rollback tested.

---

## API

API Contract followed.

HTTP Status correct.

Error Codes correct.

Swagger updated.

Response format consistent.

---

## Frontend

UI completed.

Validation completed.

API integration completed.

Loading state implemented.

Error handling implemented.

Permission handling completed.

---

## Testing

Unit tests passed.

Integration tests passed.

Permission tests passed.

Business rule tests passed.

Manual testing completed.

---

## Documentation

Swagger updated.

README updated if required.

Decision recorded if architecture changed.

No outdated documentation remains.

---

## Git

Feature branch cleaned.

Pull Request approved.

No merge conflicts.

Conventional Commit used.

Merged into dev.

---

# 31. Change Management

Architecture changes must be documented.

Examples

- new module

- new database table

- API redesign

- authentication redesign

- scoring redesign

Procedure

```
Proposal

↓

Discussion

↓

Approval

↓

DECISIONS.md

↓

Implementation
```

Never redesign architecture directly inside implementation.

---

# 32. Dependency Rules

Dependencies must always move in one direction.

```
Infrastructure

↓

Shared Components

↓

Business Modules

↓

API

↓

Frontend
```

Forbidden

```
Frontend

↓

Database
```

Forbidden

```
Repository

↓

Router
```

Forbidden

```
Entity

↓

API
```

Business modules communicate through services.

Never bypass the service layer.

---

# 33. Quality Standards

Every module should be

Readable

Maintainable

Testable

Documented

Secure

Reusable

Observable

Every function should have one responsibility.

Avoid large classes.

Avoid large services.

Avoid duplicated logic.

---

# 34. Risk Management

Potential risks

- Merge conflicts

- Database conflicts

- Duplicate business logic

- API inconsistency

- Missing authorization

- Invalid migration

- Broken documentation

Mitigation

- Small Pull Requests

- Frequent merge from dev

- Weekly architecture review

- Shared documentation

- Automated testing

---

# 35. Communication Rules

Architecture discussions

↓

GitHub Discussion
or
Team Meeting

Implementation discussion

↓

Pull Request

Bug discussion

↓

Issue

Urgent production issue

↓

Direct communication

Important architectural decisions must be recorded inside

```
docs/DECISIONS.md
```

---

# 36. Future Expansion

The current architecture should allow future implementation of

- Co-supervisor

- Notification System

- Email Service

- Calendar Integration

- External Authentication

- AI Recommendation

- Thesis Similarity Checking

- File Version Comparison

- Multi-department Support

Future features should extend the existing architecture instead of replacing it.

---

# 37. Compliance

All project members must comply with

- BUSINESS_RULES.md

- DATABASE_RULES.md

- API_CONTRACT.md

- ERD.md

- DECISIONS.md

- MODULE_OWNERSHIP.md

These documents together form the official technical reference for the project.

If any conflict exists,

priority order is

```
Business Rules

↓

Decisions

↓

ERD

↓

Database Rules

↓

API Contract

↓

Module Ownership
```

---

# Appendix A — Project Folder Structure

```
research-thesis-portal/

├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── common/
│   │   ├── core/
│   │   ├── db/
│   │   ├── modules/
│   │   └── tests/
│   └── alembic/
│
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── core/
│       │   ├── shared/
│       │   ├── layouts/
│       │   └── features/
│       └── assets/
│
├── docs/
│
├── .github/
│
├── docker-compose.yml
│
├── CLAUDE.md
│
├── AGENTS.md
│
└── README.md
```

---

# Appendix B — Responsibility Summary

Member A

- Foundation
- Authentication
- Users
- Topics
- Registrations
- Infrastructure

Member B

- Progress
- Reports
- Councils
- Scoring
- Results

Shared

- Documentation
- Docker
- Database
- API Standards
- Testing
- Release

---

# Appendix C — Quick Checklist

Before starting development

☐ Read Business Rules

☐ Read Database Rules

☐ Read API Contract

☐ Read ERD

☐ Check Module Ownership

Before committing

☐ Tests passed

☐ Swagger updated

☐ Documentation updated

☐ Migration created

☐ No secrets committed

☐ Commit message follows Conventional Commits

Before Pull Request

☐ Rebase with dev

☐ Resolve conflicts

☐ Review own code

☐ Update documentation

☐ Assign reviewer

Before Merge

☐ Pull Request approved

☐ CI passed

☐ No unresolved comments

☐ Ready for integration

---

# End of Document