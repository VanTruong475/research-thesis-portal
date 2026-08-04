# Database Rules

Version: 1.0

---

# 1. Database

Database:

PostgreSQL

ORM:

SQLAlchemy 2.x

Migration:

Alembic

---

# 2. Naming Convention

Table names:

plural
snake_case

Example:

users
topics
registrations

Column names:

snake_case

Primary key:

id

Foreign key:

<entity>_id

Examples:

user_id

topic_id

registration_id

Enum values:

lowercase
snake_case

---

# 3. Primary Key

All business tables use:

UUID

Example

id UUID PRIMARY KEY

Integer IDs are not used.

---

# 4. Common Columns

Business tables should contain:

created_at

updated_at

created_by (optional)

updated_by (optional)

Soft delete is implemented only when required.

---

# 5. Relationships

Always use foreign keys.

Never store duplicated business information.

Example:

registration.student_name

❌ NOT ALLOWED

Use

registration.user_id

instead.

---

# 6. Shared Entities

The following entities must exist only once.

users

academic_periods

topics

registrations

Do not duplicate them
inside another module.

---

# 7. Enum

Do not use free text
for business status.

Always use enums.

Examples

TopicStatus

RegistrationStatus

ReportStatus

CouncilStatus

---

# 8. Delete Rules

Do NOT cascade delete
business records.

Use:

status

or

soft delete

where appropriate.

Historical data must be preserved.

---

# 9. Transactions

Use database transactions for:

Approve registration

Assign supervisor

Publish result

Create report version

Any operation
that modifies multiple tables.

---

# 10. Constraints

Important business rules
must be enforced
at database level.

Examples:

UNIQUE

CHECK

NOT NULL

FOREIGN KEY

Do not rely only
on backend validation.

---

# 11. Migration

Every schema change
requires
a new Alembic migration.

Never modify
an existing migration
that has been merged.

Migration names
must describe
their purpose.

Example:

create_users_table

add_refresh_token

create_progress_logs

---

# 12. Indexes

Create indexes
for:

foreign keys

email

institutional_code

status

created_at

search fields

Avoid unnecessary indexes.

---

# 13. Timestamp

Store timestamps

in UTC.

Frontend
is responsible
for timezone conversion.

---

# 14. Files

Uploaded files
must not be stored
inside the database.

Database stores only:

file path

original filename

file size

mime type

upload time

---

# 15. Security

Passwords

store only hash.

Never store plaintext.

Refresh tokens

store only hash.

JWT Access Token

must never be stored
inside database.

---

# 16. Performance

Avoid N+1 queries.

Use eager loading
only when necessary.

Select only
required columns.

Avoid SELECT *.

---

# 17. Future Compatibility

Phase 2
may add:

notifications

co-supervisors

email logs

audit details

Current schema
should allow extension
without breaking
existing tables.