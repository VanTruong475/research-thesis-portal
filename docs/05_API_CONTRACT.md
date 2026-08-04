# API Contract

Version: 1.0

Status: Active

This document defines the shared API contract between:

- FastAPI backend
- Angular frontend
- Member A modules
- Member B modules

All modules must follow this document.

Do not create a different response structure for an individual module.

---

# 1. General Convention

## 1.1 Base URL

All API endpoints use the following prefix:

```text
/api/v1
```

Examples:

```text
/api/v1/auth/login
/api/v1/users/me
/api/v1/topics
/api/v1/registrations
/api/v1/progress
```

---

## 1.2 Protocol

The application uses:

```text
REST API
```

Production communication must use:

```text
HTTPS
```

Local development may use HTTP.

---

## 1.3 Data Format

Request and response format:

```text
JSON
```

Character encoding:

```text
UTF-8
```

Exceptions:

- File upload uses `multipart/form-data`.
- File download returns the file stream.
- `204 No Content` returns no response body.

---

## 1.4 Field Naming

All JSON fields use:

```text
snake_case
```

Correct:

```json
{
  "full_name": "Nguyen Van A",
  "created_at": "2026-08-04T08:00:00Z"
}
```

Incorrect:

```json
{
  "fullName": "Nguyen Van A",
  "createdAt": "2026-08-04T08:00:00Z"
}
```

Angular interfaces must follow the API field names unless an explicit mapping layer is implemented.

---

# 2. Standard Success Response

All successful API responses that contain a response body must follow this format:

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}
```

Fields:

| Field | Type | Required | Description |
|---|---|---:|---|
| `success` | boolean | Yes | Always `true` for successful responses |
| `message` | string | Yes | Human-readable result message |
| `data` | object, array or null | Yes | Response payload |

---

## 2.1 Successful Resource Response

Example:

```json
{
  "success": true,
  "message": "Topic retrieved successfully.",
  "data": {
    "id": "29a2b856-70cf-469a-93eb-15355f22cb40",
    "title": "Research topic",
    "status": "approved"
  }
}
```

---

## 2.2 Successful Collection Response

Example:

```json
{
  "success": true,
  "message": "Topics retrieved successfully.",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 0,
      "total_pages": 0
    }
  }
}
```

---

## 2.3 Successful Action Response

Example:

```json
{
  "success": true,
  "message": "Registration approved successfully.",
  "data": {
    "id": "20cc1026-b184-4577-a1d7-56f5fc7461c1",
    "status": "approved"
  }
}
```

---

## 2.4 No Content Response

For successful operations that intentionally return no body:

```text
HTTP 204 No Content
```

A `204` response must not include JSON.

Use `204` only when the frontend does not need updated resource data.

---

# 3. Standard Error Response

All handled errors must follow this format:

```json
{
  "success": false,
  "message": "Human-readable error message.",
  "error": {
    "code": "MACHINE_READABLE_ERROR_CODE",
    "details": {}
  }
}
```

Fields:

| Field | Type | Required | Description |
|---|---|---:|---|
| `success` | boolean | Yes | Always `false` |
| `message` | string | Yes | Safe message for the user |
| `error.code` | string | Yes | Stable machine-readable error code |
| `error.details` | object, array or null | Yes | Additional safe error details |

Do not return stack traces, SQL errors, secret values or internal implementation details.

---

## 3.1 Error Without Additional Details

```json
{
  "success": false,
  "message": "Invalid email, institutional code, or password.",
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "details": null
  }
}
```

---

## 3.2 Field Validation Error

```json
{
  "success": false,
  "message": "Request validation failed.",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "fields": [
        {
          "field": "email",
          "message": "Invalid email format."
        },
        {
          "field": "password",
          "message": "Password is required."
        }
      ]
    }
  }
}
```

---

## 3.3 Business Rule Error

```json
{
  "success": false,
  "message": "The student already has an effective registration in this academic period.",
  "error": {
    "code": "REGISTRATION_ALREADY_EFFECTIVE",
    "details": {
      "registration_id": "20cc1026-b184-4577-a1d7-56f5fc7461c1"
    }
  }
}
```

---

## 3.4 FastAPI Validation Handling

FastAPI's default validation response must be converted into the standard error response.

Do not expose the default response directly:

```json
{
  "detail": []
}
```

Instead return:

```json
{
  "success": false,
  "message": "Request validation failed.",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "fields": []
    }
  }
}
```

---

# 4. HTTP Status Codes

## 4.1 Successful Responses

| Status | Meaning | Usage |
|---:|---|---|
| `200 OK` | Request succeeded | Read, update, action completed |
| `201 Created` | Resource created | Create topic, registration, report, council |
| `204 No Content` | Request succeeded with no body | Delete or revoke operation where no payload is needed |

---

## 4.2 Client Errors

| Status | Meaning | Usage |
|---:|---|---|
| `400 Bad Request` | Invalid business request | Invalid transition, missing required business condition |
| `401 Unauthorized` | Authentication required or invalid | Missing, invalid or expired token |
| `403 Forbidden` | User authenticated but lacks permission | Wrong role, wrong ownership, not assigned to council |
| `404 Not Found` | Resource does not exist or is inaccessible | User, topic, registration or report not found |
| `409 Conflict` | Current state conflicts with request | Duplicate registration, topic full, duplicate member |
| `413 Payload Too Large` | Uploaded file exceeds size limit | Report file too large |
| `415 Unsupported Media Type` | File type is not allowed | Unsupported report format |
| `422 Unprocessable Entity` | Request schema validation failed | Invalid field type or format |
| `429 Too Many Requests` | Request limit exceeded | Login rate limiting or abuse protection |

---

## 4.3 Server Errors

| Status | Meaning | Usage |
|---:|---|---|
| `500 Internal Server Error` | Unexpected server failure | Unhandled internal error |
| `503 Service Unavailable` | Dependency unavailable | Database or storage temporarily unavailable |

Unexpected server errors must return a generic message.

Example:

```json
{
  "success": false,
  "message": "An unexpected error occurred.",
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "details": null
  }
}
```

---

# 5. Authentication

The system uses JWT authentication.

Protected endpoints require the following header:

```http
Authorization: Bearer <access_token>
```

---

## 5.1 Login

```http
POST /api/v1/auth/login
```

Request:

```json
{
  "identifier": "student@example.edu.vn",
  "password": "user-password"
}
```

`identifier` may contain:

- Institutional email
- Student code
- Lecturer code
- Other institutional account code approved by the project

Successful response:

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "access_token": "jwt-access-token",
    "refresh_token": "jwt-refresh-token",
    "token_type": "bearer",
    "expires_in": 1800,
    "user": {
      "id": "fe9e2580-e93e-40a1-9cc8-e3fa29633b12",
      "institutional_code": "051205012268",
      "email": "student@example.edu.vn",
      "full_name": "Nguyen Van A",
      "role": "student",
      "status": "active"
    }
  }
}
```

Login failure must not reveal whether the account exists.

```json
{
  "success": false,
  "message": "Invalid email, institutional code, or password.",
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "details": null
  }
}
```

---

## 5.2 Refresh Token

```http
POST /api/v1/auth/refresh
```

Request:

```json
{
  "refresh_token": "jwt-refresh-token"
}
```

Response:

```json
{
  "success": true,
  "message": "Token refreshed successfully.",
  "data": {
    "access_token": "new-access-token",
    "refresh_token": "new-refresh-token",
    "token_type": "bearer",
    "expires_in": 1800
  }
}
```

Refresh-token rotation should be used.

The previous refresh token must be revoked after successful rotation.

---

## 5.3 Logout

```http
POST /api/v1/auth/logout
```

Request:

```json
{
  "refresh_token": "jwt-refresh-token"
}
```

Response:

```json
{
  "success": true,
  "message": "Logout successful.",
  "data": null
}
```

Logout revokes the current refresh token.

---

## 5.4 Current User

```http
GET /api/v1/auth/me
```

Response:

```json
{
  "success": true,
  "message": "Current user retrieved successfully.",
  "data": {
    "id": "fe9e2580-e93e-40a1-9cc8-e3fa29633b12",
    "institutional_code": "051205012268",
    "email": "student@example.edu.vn",
    "full_name": "Nguyen Van A",
    "role": "student",
    "status": "active"
  }
}
```

---

## 5.5 Authentication Rules

- Access tokens are sent through the `Authorization` header.
- Access tokens must not be stored in the database.
- Refresh tokens must be stored only as hashes.
- Passwords must never appear in responses or logs.
- Locked and inactive accounts cannot authenticate.
- A changed role must take effect after token revocation or re-authentication.
- Backend authorization is mandatory.
- Angular route guards are not a replacement for backend authorization.

---

# 6. Role and Permission Convention

Supported login roles:

```text
student
lecturer
admin
```

Council member is not a separate role.

A lecturer receives council-scoring permission only when:

- The lecturer is assigned to the council.
- The registration is assigned to that council.
- The scoring period is valid.

---

## 6.1 Unauthorized Request

Missing or invalid authentication:

```http
401 Unauthorized
```

```json
{
  "success": false,
  "message": "Authentication is required.",
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "details": null
  }
}
```

---

## 6.2 Forbidden Request

Authenticated but insufficient permission:

```http
403 Forbidden
```

```json
{
  "success": false,
  "message": "You do not have permission to perform this action.",
  "error": {
    "code": "PERMISSION_DENIED",
    "details": null
  }
}
```

---

# 7. Resource Identifiers

All business resources use UUID identifiers.

Example:

```text
29a2b856-70cf-469a-93eb-15355f22cb40
```

IDs are represented as strings in JSON.

Example:

```json
{
  "id": "29a2b856-70cf-469a-93eb-15355f22cb40"
}
```

Do not expose sequential internal identifiers.

---

# 8. Date and Time

All timestamps use ISO 8601.

Backend stores and returns timestamps in UTC.

Example:

```text
2026-08-04T08:30:00Z
```

Date-only values use:

```text
YYYY-MM-DD
```

Example:

```text
2026-08-04
```

Time-only values use:

```text
HH:mm:ss
```

Example:

```text
08:30:00
```

Angular is responsible for converting UTC timestamps into the user's display timezone.

---

# 9. Null and Optional Fields

Optional fields that have no value must use:

```json
null
```

Do not use empty strings to represent missing values unless the field explicitly accepts empty text.

Correct:

```json
{
  "phone": null
}
```

Avoid:

```json
{
  "phone": ""
}
```

Arrays with no elements must return:

```json
[]
```

Do not return `null` for collection fields.

---

# 10. Pagination

List endpoints that may contain many records must support pagination.

Query parameters:

| Parameter | Type | Default | Rules |
|---|---|---:|---|
| `page` | integer | `1` | Minimum `1` |
| `page_size` | integer | `20` | Minimum `1`, maximum `100` |

Example:

```http
GET /api/v1/topics?page=1&page_size=20
```

Response:

```json
{
  "success": true,
  "message": "Topics retrieved successfully.",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 0,
      "total_pages": 0
    }
  }
}
```

Pagination fields must always be present for paginated endpoints.

---

# 11. Filtering

Filtering uses query parameters.

Examples:

```http
GET /api/v1/topics?status=approved
```

```http
GET /api/v1/topics?academic_period_id=<uuid>
```

```http
GET /api/v1/topics?proposed_by_id=<uuid>
```

```http
GET /api/v1/topics?availability=available
```

```http
GET /api/v1/registrations?student_id=<uuid>&status=pending
```

Unknown filter parameters should be rejected or ignored consistently across all modules.

Preferred behavior:

```text
Reject unsupported filter parameters through schema validation.
```

---

# 12. Search

Text search uses:

```text
keyword
```

Example:

```http
GET /api/v1/topics?keyword=artificial%20intelligence
```

Search behavior must be documented per endpoint.

Topic search may include:

- Topic title
- Description
- Lecturer name
- Topic code

Search must be case-insensitive where supported by PostgreSQL.

---

# 13. Sorting

Sorting uses:

```text
sort_by
sort_order
```

Example:

```http
GET /api/v1/topics?sort_by=created_at&sort_order=desc
```

Allowed values for `sort_order`:

```text
asc
desc
```

Each endpoint must explicitly define allowed `sort_by` fields.

Do not allow arbitrary database column names from clients.

Default sorting:

```text
created_at desc
```

unless another business order is more appropriate.

---

# 14. Status Values

Business statuses are returned as lowercase `snake_case`.

Examples:

```text
pending_approval
approved
rejected
closed
cancelled
pending
in_progress
completed
```

The frontend must not invent alternative status values.

Display labels may be translated in Angular.

Example:

```text
pending_approval → Chờ duyệt
approved → Đã duyệt
```

The API only returns the canonical status code.

---

# 15. Create and Update Requests

## 15.1 Create

Resource creation uses:

```http
POST /resources
```

Successful creation returns:

```http
201 Created
```

The created resource should be returned when useful.

---

## 15.2 Full Update

Use `PUT` only when replacing the complete editable representation of a resource.

```http
PUT /resources/{id}
```

---

## 15.3 Partial Update

Use `PATCH` for partial changes or state transitions.

Examples:

```http
PATCH /api/v1/topics/{id}/status
```

```http
PATCH /api/v1/users/{id}/status
```

Dedicated business-action endpoints may be used when the operation has specific authorization or validation rules.

Examples:

```http
PUT /api/v1/topics/{id}/approve
PUT /api/v1/registrations/{id}/approve
PUT /api/v1/registrations/{id}/assign-supervisor
```

---

# 16. Delete Convention

Important academic records should not be physically deleted by default.

Preferred operations:

- Cancel
- Close
- Lock
- Deactivate
- Archive

Use `DELETE` only for records that are safe to remove and have no required history.

A delete response may use:

```http
204 No Content
```

or:

```json
{
  "success": true,
  "message": "Resource deleted successfully.",
  "data": null
}
```

The selected behavior must remain consistent for the same resource category.

---

# 17. File Upload

Report and product submission uses:

```text
multipart/form-data
```

Example:

```http
POST /api/v1/reports
Content-Type: multipart/form-data
```

Fields may include:

```text
registration_id
report_type
description
file
```

---

## 17.1 File Validation

Backend must validate:

- File extension
- MIME type
- File size
- Registration ownership
- Submission deadline
- Approved extension, if applicable

The current recommended maximum file size is:

```text
20 MB per file
```

The final limit must be configurable.

---

## 17.2 File Upload Response

```json
{
  "success": true,
  "message": "Report submitted successfully.",
  "data": {
    "id": "3e5e6af0-26a3-421d-b9c4-793a7fdccab6",
    "registration_id": "20cc1026-b184-4577-a1d7-56f5fc7461c1",
    "report_type": "final",
    "version_number": 2,
    "original_filename": "final-report.pdf",
    "file_size": 1048576,
    "mime_type": "application/pdf",
    "submitted_at": "2026-08-04T08:30:00Z"
  }
}
```

Uploaded file paths must not expose private physical server paths.

---

## 17.3 File Errors

File too large:

```http
413 Payload Too Large
```

```json
{
  "success": false,
  "message": "The uploaded file exceeds the allowed size.",
  "error": {
    "code": "REPORT_FILE_TOO_LARGE",
    "details": {
      "max_size_bytes": 20971520
    }
  }
}
```

Unsupported file type:

```http
415 Unsupported Media Type
```

```json
{
  "success": false,
  "message": "The uploaded file type is not supported.",
  "error": {
    "code": "REPORT_UNSUPPORTED_FILE_TYPE",
    "details": {
      "allowed_extensions": [
        "pdf",
        "doc",
        "docx",
        "zip"
      ]
    }
  }
}
```

The allowed extensions above are provisional and must be confirmed before implementation.

---

# 18. Concurrency and Conflict Handling

Operations that may be affected by concurrent requests must return:

```http
409 Conflict
```

Examples:

- A topic becomes full while a student submits registration.
- Another registration for the same student becomes effective.
- A registration is approved after the topic reaches its limit.
- A council member is assigned twice.
- A score is submitted after results are published.

Example:

```json
{
  "success": false,
  "message": "The topic has reached its maximum number of students.",
  "error": {
    "code": "TOPIC_FULL",
    "details": {
      "topic_id": "29a2b856-70cf-469a-93eb-15355f22cb40"
    }
  }
}
```

---

# 19. Idempotency

Repeated requests should not create duplicate business results.

Examples:

- Approving an already approved registration must not approve it twice.
- Adding the same lecturer to a council twice must be rejected.
- Revoking an already revoked refresh token should remain safe.
- Publishing an already published result must not create another result.

Where appropriate, return:

```http
409 Conflict
```

with a state-specific error code.

---

# 20. Data Visibility

API responses must only include data that the authenticated user is permitted to view.

Examples:

- Students see their own registrations and reports.
- Lecturers see topics they proposed and students they supervise.
- Council members see registrations assigned to their council.
- Admin can access all records within the managed scope.

A hidden frontend element does not replace backend ownership validation.

---

# 21. Audit-Sensitive Actions

The following operations must create audit records:

- Topic approval
- Topic rejection
- Registration approval
- Registration rejection
- Supervisor assignment or change
- Report deadline extension
- Council creation or update
- Score submission or update
- Final-result publication
- User lock, unlock or role change

Audit logging must not change the normal API response structure.

---

# 22. Error Code Naming

Error codes use:

```text
UPPER_SNAKE_CASE
```

Recommended format:

```text
<MODULE>_<ERROR>
```

Examples:

```text
AUTH_INVALID_CREDENTIALS
AUTH_ACCOUNT_LOCKED
AUTH_TOKEN_EXPIRED
AUTH_REFRESH_TOKEN_INVALID

USER_NOT_FOUND
USER_INACTIVE

ACADEMIC_PERIOD_NOT_FOUND
ACADEMIC_PERIOD_CLOSED

TOPIC_NOT_FOUND
TOPIC_NOT_APPROVED
TOPIC_FULL
TOPIC_CLOSED
TOPIC_REJECTION_REASON_REQUIRED

REGISTRATION_NOT_FOUND
REGISTRATION_ALREADY_EFFECTIVE
REGISTRATION_PERIOD_CLOSED
REGISTRATION_CANNOT_CANCEL
REGISTRATION_TOPIC_FULL

SUPERVISOR_NOT_FOUND
SUPERVISOR_ASSIGNMENT_NOT_ALLOWED

PROGRESS_NOT_FOUND
PROGRESS_CONTENT_REQUIRED
PROGRESS_MILESTONE_CLOSED

REPORT_NOT_FOUND
REPORT_DEADLINE_PASSED
REPORT_EXTENSION_REQUIRED
REPORT_FILE_TOO_LARGE
REPORT_UNSUPPORTED_FILE_TYPE

COUNCIL_NOT_FOUND
COUNCIL_MEMBER_DUPLICATED
COUNCIL_SCHEDULE_CONFLICT
COUNCIL_MINIMUM_MEMBERS_REQUIRED

SCORE_NOT_FOUND
SCORE_OUT_OF_RANGE
SCORE_PERMISSION_DENIED
SCORE_RESULT_ALREADY_PUBLISHED
SCORE_INCOMPLETE

PERMISSION_DENIED
RESOURCE_NOT_FOUND
VALIDATION_ERROR
CONFLICT
INTERNAL_SERVER_ERROR
SERVICE_UNAVAILABLE
```

Error codes must remain stable after frontend integration.

Do not rename existing error codes without updating the Angular application and this document.

---

# 23. Module Endpoint Groups

The planned API groups are:

```text
/api/v1/auth
/api/v1/users
/api/v1/academic-periods
/api/v1/topics
/api/v1/registrations
/api/v1/lecturers
/api/v1/milestones
/api/v1/progress
/api/v1/reports
/api/v1/councils
/api/v1/scores
/api/v1/results
```

Exact endpoints must be documented before or during module implementation.

Do not create duplicate endpoint groups for the same business resource.

---

# 24. Planned Core Endpoints

## 24.1 Authentication

```text
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

---

## 24.2 Users

```text
GET  /api/v1/users/me
PUT  /api/v1/users/me
GET  /api/v1/users
POST /api/v1/users
PATCH /api/v1/users/{id}/status
```

Admin user-management endpoints depend on the final Phase 1 scope.

---

## 24.3 Academic Periods

```text
GET   /api/v1/academic-periods
POST  /api/v1/academic-periods
GET   /api/v1/academic-periods/{id}
PUT   /api/v1/academic-periods/{id}
PATCH /api/v1/academic-periods/{id}/status
```

---

## 24.4 Topics

```text
GET   /api/v1/topics
POST  /api/v1/topics
GET   /api/v1/topics/{id}
PUT   /api/v1/topics/{id}
PUT   /api/v1/topics/{id}/approve
PUT   /api/v1/topics/{id}/reject
PATCH /api/v1/topics/{id}/status
```

---

## 24.5 Registrations

```text
GET    /api/v1/registrations
POST   /api/v1/registrations
GET    /api/v1/registrations/{id}
PUT    /api/v1/registrations/{id}/approve
PUT    /api/v1/registrations/{id}/reject
PATCH  /api/v1/registrations/{id}/cancel
PUT    /api/v1/registrations/{id}/assign-supervisor
```

---

## 24.6 Lecturer Workload

```text
GET /api/v1/lecturers/{id}/workload
```

---

## 24.7 Progress and Milestones

```text
GET  /api/v1/milestones
POST /api/v1/milestones
GET  /api/v1/progress
POST /api/v1/progress
GET  /api/v1/progress/{id}
POST /api/v1/progress/{id}/comments
```

---

## 24.8 Reports

```text
GET  /api/v1/reports
POST /api/v1/reports
GET  /api/v1/reports/{id}
GET  /api/v1/reports/{id}/download
POST /api/v1/reports/extensions
```

---

## 24.9 Councils

```text
GET  /api/v1/councils
POST /api/v1/councils
GET  /api/v1/councils/{id}
PUT  /api/v1/councils/{id}
POST /api/v1/councils/{id}/members
POST /api/v1/councils/{id}/schedules
```

---

## 24.10 Scores and Results

```text
GET  /api/v1/scores
POST /api/v1/scores
PUT  /api/v1/scores/{id}

GET  /api/v1/registrations/{id}/final-result
POST /api/v1/registrations/{id}/final-result/calculate
POST /api/v1/registrations/{id}/final-result/publish
```

The exact scoring endpoints may be refined after the ERD and scoring workflow are finalized.

---

# 25. API Documentation

FastAPI Swagger UI must be available during development at:

```text
/docs
```

OpenAPI JSON:

```text
/openapi.json
```

Every endpoint must include:

- Summary
- Description
- Request schema
- Response schema
- Required role
- Possible status codes
- Important error codes

Swagger examples must not contain real passwords, tokens or personal data.

---

# 26. Versioning and Change Management

Breaking API changes require:

1. Update this document.
2. Update backend schemas.
3. Update Angular models and services.
4. Update relevant tests.
5. Notify both team members.
6. Record important changes in `docs/DECISIONS.md`.

Do not silently change:

- Endpoint paths
- Request fields
- Response fields
- Status values
- Error codes
- Pagination structure

---

# 27. Implementation Rules

- Routers handle HTTP input and output only.
- Business validation belongs in the service layer.
- Database access belongs in the repository layer.
- SQLAlchemy models must not be returned directly.
- Pydantic schemas define request and response bodies.
- Exception handlers must convert errors into this standard format.
- Frontend services must use this contract.
- Do not invent undocumented API fields.
- Do not return confidential fields.
- Do not return password hashes or token hashes.
- Tests must verify response status and response structure.

---

# 28. Pending Decisions

The following details must be confirmed before related implementation:

- Exact list of allowed report file formats.
- Whether Admin account import is included in Phase 1.
- Exact score range and grading scale.
- Whether final score weight is configurable through Admin UI.
- Whether score publication can be reverted.
- Whether report download requires additional approval.
- Whether `PUT` or `PATCH` will be preferred for profile updates.

Until a pending decision is approved:

- Do not silently invent the rule.
- Record temporary decisions in `docs/DECISIONS.md`.
- Mark provisional implementation clearly.