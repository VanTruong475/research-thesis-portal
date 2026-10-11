# Architecture Decision Records (ADR)

Version: 1.0

Status: Approved

Last Updated: 2026-08-04

---

# Purpose

This document records all important architectural and technical decisions made during the project.

Every decision includes:

- Context
- Decision
- Reason
- Consequence

The purpose is to:

- keep all team members aligned
- avoid repeated discussions
- provide a single source of truth
- guide Claude Code and Antigravity
- preserve project history

When a new architectural decision is approved,
append a new ADR.

Do not silently change existing decisions.

---

# ADR-001

## Title

Primary Key Strategy

### Status

Approved

### Context

The system contains many related entities.

Future expansion may include:

- notifications
- co-supervisor
- external integrations
- multiple departments

Sequential IDs expose implementation details.

### Decision

All business entities use

UUID

as the primary key.

### Reason

Advantages

- globally unique
- safer for public APIs
- easier future integration
- difficult to guess
- suitable for distributed systems

### Consequence

Every table uses

```
id UUID PRIMARY KEY
```

API responses expose UUID only.

Integer IDs are not used.

---

# ADR-002

## Title

Database Management System

### Status

Approved

### Context

The project requires

- transactions
- foreign keys
- JSON support
- indexing
- Docker deployment

### Decision

Use

PostgreSQL

### Reason

- fully supported by SQLAlchemy
- reliable
- open source
- excellent Docker support
- strong community

### Consequence

Development

Docker PostgreSQL

Production

PostgreSQL

No MySQL or SQL Server support is planned.

---

# ADR-003

## Title

ORM Framework

### Status

Approved

### Decision

Use

SQLAlchemy 2.x

### Reason

- official ORM
- mature ecosystem
- Alembic support
- asynchronous support
- excellent FastAPI integration

### Consequence

Database access must use SQLAlchemy.

Raw SQL should only be used
when performance requires it.

---

# ADR-004

## Title

Migration Strategy

### Status

Approved

### Decision

Use

Alembic

### Reason

Schema changes must be version controlled.

Database schema must remain reproducible.

### Consequence

Every schema change requires

a migration.

Never modify an already merged migration.

---

# ADR-005

## Title

Authentication

### Status

Approved

### Decision

Use

JWT Access Token

+

Refresh Token

### Reason

- stateless authentication
- common FastAPI architecture
- scalable
- secure

### Consequence

Access Token

short lifetime

Refresh Token

stored as hash only.

Passwords

stored as Argon2 hash.

---

# ADR-006

## Title

API Architecture

### Status

Approved

### Decision

REST API

JSON

### Reason

Angular communicates easily
with REST APIs.

Swagger documentation
is automatically generated.

### Consequence

All APIs

follow

API_CONTRACT.md

No module may define
its own response format.

---

# ADR-007

## Title

Project Architecture

### Status

Approved

### Decision

Layered Architecture

```
Router

↓

Service

↓

Repository

↓

Database
```

### Reason

Separation of responsibilities.

Easy testing.

Maintainability.

### Consequence

Router

contains no business logic.

Repository

contains no business rules.

Business logic belongs

only

inside Service.

---

# ADR-008

## Title

Backend Framework

### Status

Approved

### Decision

FastAPI

### Reason

- async support
- OpenAPI
- Swagger
- dependency injection
- high performance

### Consequence

Every endpoint

must be documented
through Swagger.

---

# ADR-009

## Title

Frontend Framework

### Status

Approved

### Decision

Angular

### Reason

Official requirement.

Strong TypeScript support.

Large application structure.

### Consequence

Angular communicates

only

through REST APIs.

No direct database access.

---

# ADR-010

## Title

Deployment Strategy

### Status

Approved

### Decision

Docker Compose

### Reason

Simple deployment.

Consistent environment.

Easy grading.

### Consequence

Project starts using

docker compose up

Development and deployment
share the same environment.

---
# ADR-011

## Title

Supervisor Strategy

### Status

Approved

### Context

The project supports lecturer supervision for student research topics.

The current project scope is limited to Phase 1.

Supporting multiple supervisors would increase complexity in:

- authorization
- workload calculation
- progress review
- scoring
- database relationships

### Decision

Each registration has exactly ONE main supervisor.

Co-supervisor is not implemented in Phase 1.

### Reason

- simpler database design
- easier authorization
- lower implementation complexity
- sufficient for project scope

### Consequence

Relationship

```
Registration

↓

Supervisor

1 : 1
```

Future versions may extend this relationship.

---

# ADR-012

## Title

Defense Council Strategy

### Status

Approved

### Context

The system manages defense councils.

One council should evaluate multiple research topics.

### Decision

One council evaluates many registrations.

Each registration belongs to only one council
within one academic period.

### Reason

This reflects common university practice.

Avoids duplicated council information.

Simplifies scheduling.

### Consequence

Relationship

```
Council

↓

Defense Schedule

↓

Registration
```

Each registration has

- one council
- one defense schedule

---

# ADR-013

## Title

Notification Strategy

### Status

Approved

### Context

The initial project focuses on core academic workflow.

Email service increases infrastructure complexity.

### Decision

Phase 1

Dashboard Alerts only.

Email notification

Phase 2.

### Reason

Dashboard alerts satisfy the business requirement.

Avoid SMTP configuration.

Reduce deployment complexity.

### Consequence

Dashboard displays

- late progress

- upcoming deadlines

- missing reports

Email integration is postponed.

---

# ADR-014

## Title

Report Versioning

### Status

Approved

### Context

Students may upload revised reports.

Historical submissions should remain available.

### Decision

Every upload creates a new version.

Previous versions are never overwritten.

### Reason

- preserve history

- easier review

- academic traceability

### Consequence

Report

↓

Version 1

↓

Version 2

↓

Version 3

The latest version is marked as current.

---

# ADR-015

## Title

Registration Rule

### Status

Approved

### Context

Students should not participate in multiple research topics
during the same academic period.

### Decision

One student may have only one effective registration
per academic period.

Effective registrations include

- pending

- approved

- in_progress

### Reason

Avoid duplicate participation.

Maintain consistent workload.

### Consequence

Registration approval checks

existing effective registrations

before approval.

---

# ADR-016

## Title

Delete Strategy

### Status

Approved

### Context

Academic records should remain traceable.

Physical deletion may cause data inconsistency.

### Decision

Business entities are not physically deleted.

Use

status

or

soft delete

when appropriate.

### Reason

Preserve historical data.

Maintain auditability.

### Consequence

Delete operations become

Deactivate

Cancel

Archive

or

Close.

---

# ADR-017

## Title

Audit Logging

### Status

Approved

### Context

Important academic operations require traceability.

### Decision

Create audit logs for major business actions.

### Logged Operations

- topic approval

- topic rejection

- registration approval

- registration rejection

- supervisor assignment

- score submission

- final result publication

- user lock

### Reason

Support accountability.

Simplify debugging.

### Consequence

Audit logs are read-only.

Users cannot modify audit history.

---

# ADR-018

## Title

File Upload Strategy

### Status

Approved

### Context

Students upload reports and research products.

Large files should not be stored inside PostgreSQL.

### Decision

Store uploaded files
in the file system.

Database stores metadata only.

### Metadata

- filename

- path

- mime_type

- size

- upload_time

### Reason

Reduce database size.

Improve performance.

Simplify backup strategy.

### Consequence

Database never stores binary file contents.

---

# ADR-019

## Title

API Versioning

### Status

Approved

### Decision

Use URI versioning.

Example

```
/api/v1/
```

### Reason

Future compatibility.

Safe API evolution.

### Consequence

All endpoints begin with

```
/api/v1/
```

Future breaking changes

may introduce

```
/api/v2/
```

---

# ADR-020

## Title

Error Code Convention

### Status

Approved

### Decision

Use stable machine-readable error codes.

Naming convention

```
MODULE_ERROR_NAME
```

Examples

```
AUTH_INVALID_CREDENTIALS

TOPIC_FULL

REGISTRATION_ALREADY_EXISTS

REPORT_DEADLINE_PASSED

PERMISSION_DENIED
```

### Reason

Frontend should rely on error codes,
not error messages.

### Consequence

Error messages may be translated.

Error codes must remain stable.

---
# ADR-021

## Title

Enumeration Strategy

### Status

Approved

### Context

Many business entities require predefined status values.

Using free-text values may lead to inconsistent data.

### Decision

All business statuses must use Enumerations.

Examples

- UserRole
- UserStatus
- TopicStatus
- RegistrationStatus
- ReportStatus
- CouncilStatus
- ScoreStatus

### Reason

- Prevent invalid values
- Improve readability
- Easier validation
- Better API consistency

### Consequence

Status values are centralized.

Frontend must not invent new status values.

---

# ADR-022

## Title

Timestamp Strategy

### Status

Approved

### Context

Every business entity requires creation and update history.

### Decision

All business tables contain

- created_at
- updated_at

Optional fields

- created_by
- updated_by

### Reason

Support auditing.

Simplify troubleshooting.

Provide historical information.

### Consequence

Every insert automatically records creation time.

Every update automatically refreshes updated_at.

---

# ADR-023

## Title

Timezone Strategy

### Status

Approved

### Context

The application may be deployed on different servers.

### Decision

Store every timestamp in UTC.

Frontend converts UTC
to local timezone.

### Reason

Avoid timezone inconsistency.

Prevent daylight-saving issues.

### Consequence

Database

UTC only.

Angular handles display timezone.

---

# ADR-024

## Title

Pagination Strategy

### Status

Approved

### Context

Many resources can contain hundreds or thousands of records.

### Decision

Every list endpoint supports pagination.

Default

```
page = 1

page_size = 20
```

Maximum page size

```
100
```

### Reason

Improve performance.

Reduce network traffic.

Standardize API behavior.

### Consequence

Large datasets must never return the entire table.

---

# ADR-025

## Title

Search Strategy

### Status

Approved

### Context

Users need to search topics,
students,
lecturers
and reports.

### Decision

Search uses

```
keyword
```

query parameter.

Example

```
GET /topics?keyword=AI
```

### Reason

Simple.

Consistent.

Easy frontend integration.

### Consequence

Search behavior is case-insensitive whenever supported.

---

# ADR-026

## Title

Sorting Strategy

### Status

Approved

### Context

List endpoints require consistent ordering.

### Decision

Sorting uses

```
sort_by

sort_order
```

Allowed order

```
asc

desc
```

### Reason

Standard REST convention.

Easy Angular integration.

### Consequence

Every endpoint defines
its own supported sort fields.

---

# ADR-027

## Title

Transaction Strategy

### Status

Approved

### Context

Some business operations modify multiple tables.

### Decision

Use database transactions
for every critical business operation.

Examples

- Registration Approval

- Supervisor Assignment

- Result Publication

- Score Submission

### Reason

Guarantee consistency.

Avoid partial updates.

### Consequence

Failed operations roll back completely.

---

# ADR-028

## Title

Validation Strategy

### Status

Approved

### Context

Business validation must not depend on frontend validation.

### Decision

Validation occurs at three layers.

Layer 1

Request validation
(Pydantic)

Layer 2

Business validation
(Service)

Layer 3

Database constraints

### Reason

Defense in depth.

Improve reliability.

### Consequence

Frontend validation is only for user experience.

Backend validation is mandatory.

---

# ADR-029

## Title

Authorization Strategy

### Status

Approved

### Context

Frontend permissions can be bypassed.

### Decision

Authorization is enforced only by the backend.

Frontend authorization is for UI purposes only.

### Reason

Improve security.

Prevent unauthorized access.

### Consequence

Every protected endpoint verifies

- Authentication

- Role

- Ownership

before executing business logic.

---

# ADR-030

## Title

Testing Strategy

### Status

Approved

### Context

Reliable software requires automated testing.

### Decision

Each module includes

- Unit Tests

- Integration Tests

Critical workflows require

End-to-End Testing.

### Reason

Reduce regressions.

Increase confidence before merging.

### Consequence

A feature is not complete
until required tests pass.

---

# ADR-031

## Title

Logging Strategy

### Status

Approved

### Context

Operational logs are required for troubleshooting.

### Decision

Application logs are separated into

- Application Logs

- Error Logs

- Audit Logs

Sensitive information must never appear in logs.

### Reason

Improve observability.

Protect user data.

### Consequence

Passwords,
JWT tokens,
refresh tokens
and personal secrets
must never be logged.

---

# ADR-032

## Title

Documentation Strategy

### Status

Approved

### Context

Project documentation must remain synchronized with implementation.

### Decision

Whenever architecture changes,
the corresponding document must be updated.

Priority documents

- BUSINESS_RULES.md

- DATABASE_RULES.md

- API_CONTRACT.md

- ERD.md

- DECISIONS.md

### Reason

Prevent documentation drift.

Maintain a single source of truth.

### Consequence

Implementation must never permanently diverge
from approved documentation.

---
# ADR-033

## Title

Rate Limiting Strategy

### Status

Approved

### Context

Authentication endpoints are vulnerable to brute-force attacks.

### Decision

Rate limiting is applied to sensitive endpoints.

Protected endpoints include

- Login
- Refresh Token
- Password Reset (future)
- File Upload

### Reason

Reduce abuse.

Improve security.

Protect server resources.

### Consequence

Clients exceeding the configured limit receive

HTTP 429

Too Many Requests.

The limit should be configurable through environment variables.

---

# ADR-034

## Title

File Naming Strategy

### Status

Approved

### Context

Students may upload files with duplicate names.

Original filenames may contain spaces or unsupported characters.

### Decision

Uploaded files are renamed using UUID.

The original filename is stored separately.

Example

Stored filename

```
8b5e87fd-f4c0-4db4-ae63-a7d7d07db6e2.pdf
```

Original filename

```
Final_Report.pdf
```

### Reason

Avoid filename conflicts.

Improve security.

Support versioning.

### Consequence

Users always download the original filename.

The storage layer never relies on user-provided filenames.

---

# ADR-035

## Title

Version Compatibility

### Status

Approved

### Context

The project will evolve over time.

Changes should not unexpectedly break existing functionality.

### Decision

Breaking architectural changes require:

- documentation update
- team discussion
- new Architecture Decision Record
- migration plan (if database changes)

### Reason

Maintain project stability.

Avoid inconsistent implementations.

### Consequence

No breaking change is implemented without updating

- DECISIONS.md
- API_CONTRACT.md
- ERD.md

where applicable.

---

# ADR-036

## Title

Configuration Management

### Status

Approved

### Context

Application settings differ between development and production.

### Decision

Configuration is managed through environment variables.

Examples

- Database URL
- JWT Secret
- Token Lifetime
- Upload Directory
- SMTP Configuration (future)

### Reason

Improve portability.

Avoid hard-coded secrets.

### Consequence

The repository includes

```
.env.example
```

The real

```
.env
```

must never be committed.

---

# ADR-037

## Title

Architecture Governance

### Status

Approved

### Context

Project consistency depends on following agreed technical decisions.

### Decision

The following documents form the official technical baseline:

- BUSINESS_RULES.md
- DATABASE_RULES.md
- API_CONTRACT.md
- MODULE_OWNERSHIP.md
- DECISIONS.md
- ERD.md

Any conflict must be resolved before implementation.

### Reason

Maintain a single source of truth.

Reduce inconsistent implementations.

### Consequence

Developers and AI coding assistants must consult these documents before implementing new features.

---

# ADR-038

## Title

Future Extension Policy

### Status

Approved

### Context

The architecture should support future expansion without major redesign.

Potential future features include:

- Co-supervisor
- Email Notification
- Push Notification
- Calendar Integration
- Multi-department Support
- AI Recommendation
- Thesis Similarity Detection

### Decision

Phase 1 implements only the approved project scope.

Future features should extend the current architecture instead of replacing it.

### Reason

Reduce project risk.

Maintain stable architecture.

### Consequence

Future modules should reuse existing entities, services and API conventions whenever possible.

---

# Architecture Principles

The project follows these principles.

## Single Source of Truth

Business Rules define business behavior.

Database Rules define persistence.

API Contract defines communication.

ERD defines relationships.

Decisions define architecture.

---

## Separation of Concerns

Each layer has one responsibility.

```
Router

↓

Service

↓

Repository

↓

Database
```

---

## Convention over Configuration

The project follows predefined conventions whenever possible.

Avoid creating different implementations for the same type of problem.

---

## Documentation First

Important architectural changes must be documented before implementation.

---

## Security by Default

Security is enforced by default.

Examples

- Backend authorization
- JWT authentication
- Password hashing
- Database constraints
- Input validation

---

## Simplicity First

Prefer simple solutions that satisfy project requirements.

Avoid introducing unnecessary complexity during Phase 1.

---

# Decision Priority

If two documents contain conflicting information,
the following priority applies:

1. BUSINESS_RULES.md
2. DECISIONS.md
3. ERD.md
4. DATABASE_RULES.md
5. API_CONTRACT.md
6. MODULE_OWNERSHIP.md

---

# Decision Lifecycle

New architectural decisions follow this process.

```
Problem

↓

Discussion

↓

Decision

↓

Review

↓

Approval

↓

ADR

↓

Implementation
```

Approved decisions are considered mandatory until officially replaced.

---

# End of Document