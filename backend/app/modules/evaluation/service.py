# backend/app/modules/evaluation/service.py
# File chứa toàn bộ Logic Nghiệp vụ (Business Logic) cho Module Chấm điểm (Scoring) và Tính toán Kết quả (Final Results).

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import (
    BadRequestException,
    ForbiddenException,
    NotFoundException,
)
from app.db.enums import (
    EvaluationType,
    FinalResultStatus,
    ResultClassification,
    ScoreStatus,
    UserRole,
)
from app.modules.councils.model import CouncilMember, DefenseSchedule
from app.modules.evaluation.model import FinalResult, Score
from app.modules.evaluation.schemas import ScoreCreate
from app.modules.registrations.model import Registration
from app.modules.users.model import User


class EvaluationService:
    """
    Service quản lý logic nghiệp vụ cho Chấm điểm và Kết quả đồ án/khóa luận.
    """

    def __init__(self, db: AsyncSession | None):
        self.db = db

    # ==========================================
    # 1. NGHIỆP VỤ CHẤM ĐIỂM (SCORES)
    # ==========================================

    async def submit_or_update_score(
        self,
        current_user: User,
        data: ScoreCreate,
    ) -> Score:
        """
        Nghiệp vụ nhập hoặc cập nhật phiếu điểm chấm cho Sinh viên (FR-20).
        Giảng viên hướng dẫn chấm điểm quá trình (supervisor).
        Thành viên hội đồng chấm điểm bảo vệ (council).
        """

        # 1. Kiểm tra tồn tại của Đăng ký đồ án (Registration)
        stmt_reg = select(Registration).where(Registration.id == data.registration_id)
        result_reg = await self.db.execute(stmt_reg)
        registration = result_reg.scalar_one_or_none()
        if not registration:
            raise NotFoundException("Không tìm thấy thông tin đăng ký đồ án của sinh viên.")

        # 2. Ràng buộc quyền hạn theo loại chấm điểm (EvaluationType)
        if data.evaluation_type == EvaluationType.SUPERVISOR:
            # Đối với điểm GVHD: Giảng viên chấm phải đúng là Supervisor của đăng ký này
            if registration.supervisor_id != current_user.id:
                raise ForbiddenException("Bạn không phải là Giảng viên hướng dẫn của sinh viên này.")

        elif data.evaluation_type == EvaluationType.COUNCIL:
            # Đối với điểm Hội đồng: Phải có thông tin council_id
            if not data.council_id:
                raise BadRequestException("Vui lòng cung cấp thông tin Council ID khi chấm điểm hội đồng.")

            # Kiểm tra xem sinh viên có lịch bảo vệ tại Hội đồng này hay không
            stmt_sched = select(DefenseSchedule).where(
                DefenseSchedule.registration_id == data.registration_id,
                DefenseSchedule.council_id == data.council_id,
            )
            res_sched = await self.db.execute(stmt_sched)
            schedule = res_sched.scalar_one_or_none()
            if not schedule:
                raise BadRequestException("Sinh viên này không có lịch bảo vệ tại Hội đồng đã chọn.")

            # Kiểm tra Giảng viên có phải là thành viên active trong Hội đồng này hay không
            stmt_member = select(CouncilMember).where(
                CouncilMember.council_id == data.council_id,
                CouncilMember.lecturer_id == current_user.id,
            )
            res_member = await self.db.execute(stmt_member)
            member = res_member.scalar_one_or_none()
            if not member:
                raise ForbiddenException("Bạn không phải là thành viên trong Hội đồng bảo vệ này.")

        # 3. Tìm phiếu điểm đã tồn tại (nếu có)
        stmt_score = select(Score).where(
            Score.registration_id == data.registration_id,
            Score.evaluator_id == current_user.id,
            Score.evaluation_type == data.evaluation_type,
        )
        res_score = await self.db.execute(stmt_score)
        existing_score = res_score.scalar_one_or_none()

        # 4. Kiểm tra xem điểm đã bị khóa (LOCKED) sau khi công bố kết quả hay chưa
        if existing_score and existing_score.status == ScoreStatus.LOCKED:
            raise BadRequestException("Phiếu điểm đã bị khóa sau khi công bố kết quả, không thể chỉnh sửa.")

        status = ScoreStatus.SUBMITTED if data.is_submit else ScoreStatus.DRAFT
        now = datetime.now(timezone.utc)

        if existing_score:
            # Cập nhật phiếu điểm hiện có
            existing_score.score = data.score
            existing_score.comments = data.comments
            existing_score.status = status
            if data.is_submit:
                existing_score.submitted_at = now
            if data.council_id:
                existing_score.council_id = data.council_id
            score_obj = existing_score
        else:
            # Tạo phiếu điểm mới
            score_obj = Score(
                registration_id=data.registration_id,
                evaluator_id=current_user.id,
                council_id=data.council_id,
                evaluation_type=data.evaluation_type,
                score=data.score,
                comments=data.comments,
                status=status,
                submitted_at=now if data.is_submit else None,
            )
            self.db.add(score_obj)

        await self.db.commit()
        await self.db.refresh(score_obj)
        return score_obj

    async def get_scores_by_registration(self, registration_id: UUID) -> list[Score]:
        """
        Lấy danh sách tất cả các phiếu điểm chấm cho 1 Đăng ký đồ án.
        """
        stmt = select(Score).where(Score.registration_id == registration_id)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    # ==========================================
    # 2. NGHIỆP VỤ TÍNH TOÁN & CÔNG BỐ KẾT QUẢ (FINAL RESULTS)
    # ==========================================

    async def calculate_final_result(
        self,
        current_user: User,
        registration_id: UUID,
        supervisor_weight: float = 40.0,
        council_weight: float = 60.0,
    ) -> FinalResult:
        """
        Nghiệp vụ tính toán điểm tổng kết cho Sinh viên (FR-21).
        Điểm tổng kết = (Điểm GVHD * 40%) + (Điểm trung bình Hội đồng * 60%).
        """

        # 1. Kiểm tra tồn tại của Đăng ký đồ án
        stmt_reg = select(Registration).where(Registration.id == registration_id)
        res_reg = await self.db.execute(stmt_reg)
        registration = res_reg.scalar_one_or_none()
        if not registration:
            raise NotFoundException("Không tìm thấy thông tin đăng ký đồ án.")

        # 2. Lấy điểm đánh giá từ Giảng viên hướng dẫn (Supervisor)
        stmt_sup = select(Score).where(
            Score.registration_id == registration_id,
            Score.evaluation_type == EvaluationType.SUPERVISOR,
            Score.status == ScoreStatus.SUBMITTED,
        )
        res_sup = await self.db.execute(stmt_sup)
        supervisor_score_obj = res_sup.scalar_one_or_none()
        if not supervisor_score_obj:
            raise BadRequestException("Chưa có điểm đánh giá chính thức từ Giảng viên hướng dẫn.")

        # 3. Lấy điểm đánh giá từ các Thành viên Hội đồng (Council)
        stmt_councils = select(Score).where(
            Score.registration_id == registration_id,
            Score.evaluation_type == EvaluationType.COUNCIL,
            Score.status == ScoreStatus.SUBMITTED,
        )
        res_councils = await self.db.execute(stmt_councils)
        council_scores = list(res_councils.scalars().all())

        if not council_scores:
            raise BadRequestException("Chưa có điểm đánh giá chính thức từ Thành viên Hội đồng.")

        # 4. Tính toán điểm trung bình Hội đồng và Điểm tổng kết
        avg_council_score = float(
            sum(float(s.score) for s in council_scores) / len(council_scores),
        )
        sup_score = float(supervisor_score_obj.score)

        final_score = round(
            (sup_score * (supervisor_weight / 100.0))
            + (avg_council_score * (council_weight / 100.0)),
            2,
        )

        # 5. Phân loại xếp loại đồ án
        classification = self._determine_classification(final_score)

        # 6. Kiểm tra xem đã có bản ghi Kết quả cuối cùng hay chưa
        stmt_res = select(FinalResult).where(FinalResult.registration_id == registration_id)
        res_res = await self.db.execute(stmt_res)
        existing_result = res_res.scalar_one_or_none()

        now = datetime.now(timezone.utc)

        if existing_result:
            if existing_result.status == FinalResultStatus.PUBLISHED:
                raise BadRequestException(
                    "Kết quả này đã được công bố, không thể tính toán lại nếu không có quyền Admin đặc biệt.",
                )

            existing_result.supervisor_score = sup_score
            existing_result.council_average_score = avg_council_score
            existing_result.supervisor_weight = supervisor_weight
            existing_result.council_weight = council_weight
            existing_result.final_score = final_score
            existing_result.classification = classification
            existing_result.status = FinalResultStatus.CALCULATED
            existing_result.calculated_at = now
            existing_result.calculated_by_id = current_user.id
            result_obj = existing_result
        else:
            result_obj = FinalResult(
                registration_id=registration_id,
                supervisor_score=sup_score,
                council_average_score=avg_council_score,
                supervisor_weight=supervisor_weight,
                council_weight=council_weight,
                final_score=final_score,
                classification=classification,
                status=FinalResultStatus.CALCULATED,
                calculated_at=now,
                calculated_by_id=current_user.id,
            )
            self.db.add(result_obj)

        await self.db.commit()
        await self.db.refresh(result_obj)
        return result_obj

    async def publish_final_result(
        self,
        current_user: User,
        registration_id: UUID,
    ) -> FinalResult:
        """
        Nghiệp vụ Admin phê duyệt và công bố Kết quả cuối cùng cho Sinh viên (FR-21).
        Khóa tất cả các phiếu điểm liên quan sang trạng thái LOCKED.
        """
        if current_user.role != UserRole.ADMIN:
            raise ForbiddenException("Chỉ Admin mới có quyền phê duyệt công bố kết quả cuối cùng.")

        stmt_res = select(FinalResult).where(FinalResult.registration_id == registration_id)
        res_res = await self.db.execute(stmt_res)
        result_obj = res_res.scalar_one_or_none()

        if not result_obj:
            raise NotFoundException("Chưa tìm thấy kết quả tính toán cho đăng ký này. Hãy tính toán điểm trước.")

        if result_obj.status == FinalResultStatus.PUBLISHED:
            raise BadRequestException("Kết quả này đã được công bố trước đó.")

        # Cập nhật trạng thái kết quả sang PUBLISHED
        now = datetime.now(timezone.utc)
        result_obj.status = FinalResultStatus.PUBLISHED
        result_obj.published_at = now
        result_obj.published_by_id = current_user.id

        # Khóa tất cả các phiếu điểm chấm liên quan
        stmt_scores = select(Score).where(Score.registration_id == registration_id)
        res_scores = await self.db.execute(stmt_scores)
        scores = res_scores.scalars().all()
        for score in scores:
            score.status = ScoreStatus.LOCKED

        await self.db.commit()
        await self.db.refresh(result_obj)
        return result_obj

    async def get_final_result(
        self,
        current_user: User,
        registration_id: UUID,
    ) -> FinalResult:
        """
        Lấy thông tin Kết quả tổng kết của Sinh viên.
        Sinh viên chỉ được xem khi trạng thái là PUBLISHED.
        """
        stmt_res = select(FinalResult).where(FinalResult.registration_id == registration_id)
        res_res = await self.db.execute(stmt_res)
        result_obj = res_res.scalar_one_or_none()

        if not result_obj:
            raise NotFoundException("Chưa có kết quả tổng kết cho đăng ký đồ án này.")

        # Nếu là sinh viên, chỉ cho xem khi kết quả đã được công bố
        if current_user.role == UserRole.STUDENT and result_obj.status != FinalResultStatus.PUBLISHED:
            raise ForbiddenException("Kết quả tổng kết chưa được công bố chính thức.")

        return result_obj

    def _determine_classification(self, score: float) -> ResultClassification:
        """
        Hàm helper phân loại xếp loại theo thang điểm 10.
        """
        if score >= 9.0:
            return ResultClassification.EXCELLENT
        if score >= 8.0:
            return ResultClassification.GOOD
        if score >= 6.5:
            return ResultClassification.FAIR
        if score >= 5.0:
            return ResultClassification.AVERAGE
        return ResultClassification.FAILED
