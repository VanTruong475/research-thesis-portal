# Business Rules

Version: 1.0

Source:
- Project Charter
- Software Requirements Specification (SRS)
- Use Case Specification UC01–UC21

---

# 1. User Roles

The system supports three login roles:

- Admin
- Lecturer
- Student

Council member is NOT a standalone login role.

A lecturer becomes a council member only after being assigned to a council.

---

# 2. User Accounts

The system is closed.

Accounts are created or imported by Admin.

Public registration is not supported.

Users log in using:

- institutional email
OR
- institutional code

Passwords are stored as secure hashes.

Locked accounts cannot log in.

---

# 3. Academic Period

Every operation belongs to one Academic Period.

An Academic Period defines:

- topic proposal period
- registration period
- progress milestones
- report deadline
- defense schedule

Admin manages Academic Periods using the administration interface.

Seed data is only used for development/demo.

---

# 4. Topic

A topic is proposed by one lecturer.

A topic initially has status:

Pending Approval

Only Admin can:

- approve
- reject

Rejected topics must include a rejection reason.

Only approved topics are visible for student registration.

Each topic belongs to exactly one Academic Period.

Each topic has:

- maximum students
- current approved students

When approved students reach the maximum:

the topic is automatically closed.

---

# 5. Registration

A student can have only ONE effective registration
within one Academic Period.

Effective registrations include:

- Pending
- Approved

Students may cancel:

Pending registrations.

Students CANNOT cancel:

Approved registrations.

Registration approval must be transactional.

The system must never exceed
the maximum number of students.

---

# 6. Supervisor

The proposing lecturer is the default supervisor.

Admin may change the supervisor.

Phase 1 supports ONLY:

one main supervisor.

Co-supervisor is NOT implemented
in Phase 1.

---

# 7. Progress

Progress belongs to:

Registration

Each progress update belongs to one milestone.

Progress cannot be empty.

Late progress is accepted
but marked as Late.

Lecturers can comment on progress.

---

# 8. Reports

Each submission creates a NEW version.

Old versions must never be overwritten.

Late reports are rejected
unless Admin grants an extension.

Supported report types:

- Proposal
- Midterm
- Final

---

# 9. Defense Council

One council contains multiple lecturers.

One council evaluates multiple registrations.

One registration belongs to only ONE council
within an Academic Period.

Each registration has its own:

- defense time
- room
- presentation order

---

# 10. Scoring

Supervisor submits:

Process Score.

Council members submit:

Defense Score.

Each evaluator submits ONE score.

Scores can be edited
until final publication.

After publication
scores become read-only.

Default calculation:

40% Supervisor Score

60% Average Council Score

---

# 11. Result

Results are published only when:

- Supervisor score exists
- All council scores exist

After publication

results cannot be modified
without Admin authorization.

---

# 12. Alerts

Phase 1

The system displays dashboard alerts.

Examples:

- late progress
- missing report
- approaching deadline

Email notification is NOT implemented.

Email belongs to Phase 2.

---

# 13. Authorization

Backend is the security boundary.

Frontend authorization is only for UX.

Every protected endpoint
must verify:

- authentication
- role
- ownership (if required)

---

# 14. Database

Business rules must be enforced in:

- database constraints
- service layer

Never rely only on frontend validation.

---

# 15. Audit

Important operations must be logged.

Examples:

- approve topic
- reject topic
- approve registration
- assign supervisor
- publish result