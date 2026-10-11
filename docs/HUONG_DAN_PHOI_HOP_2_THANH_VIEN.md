## 1. Mục tiêu

Tài liệu này giúp hai thành viên cùng làm dự án `research-thesis-portal` mà không bị:

- Lệch cấu trúc database
- Trùng migration Alembic
- Ghi đè code của nhau
- Lộ file `.env`
- Merge nhầm vào `main`
- Xung đột ở các file dùng chung

---

## 2. Nguyên tắc Git chung

Mỗi người làm trên branch riêng.

Luồng chuẩn:

```text
dev
→ feature/<ten-chuc-nang>
→ Pull Request
→ merge vào dev
```

Không code trực tiếp trên:

```text
dev
main
```

Trước khi tạo branch mới:

```powershell
git switch dev
git pull origin dev
git status
git switch -c feature/<ten-chuc-nang>
```

Trước khi push:

```powershell
git status
git diff --check
```

Sau đó:

```powershell
git add <cac-file-lien-quan>
git commit -m "feat(module): mo ta ngan gon"
git push -u origin feature/<ten-chuc-nang>
```

Tạo Pull Request:

```text
feature/<ten-chuc-nang> → dev
```

---

## 3. Phân chia module

### Thành viên A

Phụ trách:

- Auth
- Users
- Academic periods
- Topics
- Registrations
- Shared backend infrastructure

### Thành viên B

Phụ trách:

- Progress
- Reports
- Councils
- Scoring
- Results

Mỗi module nên nằm trong:

```text
backend/app/modules/<module>/
```

Test tương ứng:

```text
backend/tests/<module>/
```

Không sửa module của người còn lại nếu chưa báo trước.

---

## 4. Database được dùng chung như thế nào

Hai người không dùng chung trực tiếp một PostgreSQL local.

Mỗi người có:

- Docker container riêng
- PostgreSQL volume riêng
- File `.env` riêng
- Dữ liệu local riêng

Hai người dùng chung:

- SQLAlchemy models
- Alembic migrations
- Docker Compose
- `.env.example`
- Cấu trúc bảng
- Constraints
- Relationships
- Seed script nếu có

Ví dụ: tài khoản được tạo trên máy A sẽ không tự xuất hiện trên máy B.

---

## 5. Cách thành viên B khởi chạy database

Từ thư mục project:

```powershell
git switch dev
git pull origin dev
```

Nếu chưa có `.env`:

```powershell
Copy-Item .env.example .env
```

Không commit file `.env`.

Khởi chạy Docker:

```powershell
docker compose up -d --build
docker compose ps
```

PostgreSQL cần có trạng thái:

```text
Up (healthy)
```

Chạy migration:

```powershell
cd backend
python -m alembic upgrade head
python -m alembic current
python -m alembic heads
```

Sau tuần 2, revision mong muốn:

```text
9b2f4c7d1a6e (head)
```

Kiểm tra bảng:

```powershell
cd ..
docker compose exec db psql -U thesis_user -d thesis_db -c "\dt"
```

Các bảng hiện tại:

```text
academic_periods
alembic_version
refresh_tokens
registrations
topics
users
```

---

## 6. Kết nối pgAdmin 4

Dùng thông tin trong `.env`.

Cấu hình hiện tại:

```text
Host: localhost
Port: 5433
Database: thesis_db
Username: thesis_user
Password: lấy trong .env
```

Đường dẫn xem bảng:

```text
Servers
→ Databases
→ thesis_db
→ Schemas
→ public
→ Tables
```

Không dùng port `5432` trên máy host nếu Docker Compose đang map:

```text
5433 → 5432
```

---

## 7. Quy tắc Alembic migration

Đây là phần quan trọng nhất khi hai người cùng làm database.

Trước khi tạo migration:

```powershell
git switch dev
git pull origin dev
cd backend
python -m alembic heads
python -m alembic current
```

Chỉ được tạo migration khi:

- `dev` đã mới nhất
- Working tree sạch
- Alembic có đúng một head
- Không có người khác đang tạo migration song song

Hai người phải báo nhau trước:

```text
Mình sắp tạo migration cho module progress.
Hiện tại có ai đang tạo migration khác không?
```

Tạo migration:

```powershell
python -m alembic revision --autogenerate -m "create progress table"
```

Sau khi tạo:

```powershell
python -m alembic upgrade head
python -m alembic downgrade -1
python -m alembic upgrade head
```

Kiểm tra:

```powershell
python -m alembic heads
python -m alembic current
```

Không để xuất hiện nhiều Alembic head.

Nếu có `multiple heads`, dừng lại và báo cho người còn lại. Không tự xử lý khi chưa thống nhất.

---

## 8. Khi migration của một người đã merge

Người còn lại phải đồng bộ trước khi làm tiếp:

```powershell
git switch dev
git pull origin dev
cd backend
python -m alembic upgrade head
python -m alembic heads
python -m alembic current
```

Sau đó mới tạo branch mới hoặc migration mới.

---

## 9. Các file dễ xung đột

Hai người cần báo nhau trước khi sửa các file sau:

```text
backend/app/api/v1/router.py
backend/app/db/enums.py
backend/alembic/env.py
backend/requirements.txt
docker-compose.yml
.env.example
CLAUDE.md
AGENTS.md
```

Các file này thường được nhiều module dùng chung.

Nếu cần sửa, nhắn rõ:

```text
Mình sẽ sửa backend/app/api/v1/router.py để đăng ký router progress.
Bạn đang sửa file này không?
```

---

## 10. Quy tắc `.env` và secret

Không commit:

```text
.env
backend/.venv/
.claude/
__pycache__/
.pytest_cache/
.ruff_cache/
```

Chỉ commit:

```text
.env.example
```

`.env.example` chỉ chứa giá trị mẫu, không chứa mật khẩu thật hoặc secret thật.

Mỗi người tự tạo `.env` riêng.

---

## 11. Dữ liệu mẫu dùng chung

Không gửi PostgreSQL volume hoặc file database cho nhau.

Nên tạo seed script, ví dụ:

```text
backend/scripts/seed.py
```

Hai người cùng chạy:

```powershell
cd backend
python scripts/seed.py
```

Như vậy hai máy có dữ liệu mẫu giống nhau nhưng database vẫn độc lập.

Seed nên có dữ liệu như:

- Admin
- Giảng viên
- Sinh viên
- Học kỳ mẫu
- Đề tài mẫu

Seed phải chạy được nhiều lần mà không tạo dữ liệu trùng.

---

## 12. Kiểm tra trước Pull Request

Mỗi người cần chạy:

```powershell
cd backend
python -m ruff check .
python -m pytest
python -m alembic heads
python -m alembic current
```

Nếu có migration mới:

```powershell
python -m alembic downgrade -1
python -m alembic upgrade head
```

Kiểm tra Docker:

```powershell
cd ..
docker compose up -d --build
docker compose ps
```

Không tạo PR nếu:

- Test fail
- Ruff fail
- PostgreSQL không healthy
- Alembic có nhiều head
- Migration không downgrade được
- Có file `.env` bị theo dõi
- Có thay đổi ngoài phạm vi module

---

## 13. Nội dung Pull Request

PR cần ghi:

```markdown
## Summary

- Đã làm gì
- Module nào bị ảnh hưởng
- Có migration mới hay không

## Database changes

- Tên bảng mới
- Cột mới
- Foreign key
- Constraint

## Verification

- Ruff passed
- Pytest passed
- Alembic upgrade passed
- Alembic downgrade passed
- Docker passed

## Out of scope

- Những phần chưa làm
```

---

## 14. Sau khi PR được merge

Người tạo PR:

```powershell
git switch dev
git pull origin dev
git branch -d feature/<ten-chuc-nang>
```

Người còn lại:

```powershell
git switch dev
git pull origin dev
cd backend
python -m alembic upgrade head
```

Không tiếp tục làm trên branch đã merge.

---

## 15. Không được làm

Không:

- Code trực tiếp trên `dev`
- Code trực tiếp trên `main`
- Dùng chung một file `.env`
- Gửi password thật lên GitHub
- Tự sửa migration đã merge
- Xóa migration cũ
- Cùng lúc tạo hai migration từ cùng revision
- Chạy `docker compose down -v` khi chưa muốn xóa dữ liệu
- Sửa module của người khác mà không báo
- Force push vào branch chung
- Merge PR khi test chưa pass

---