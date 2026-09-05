# backend/app/modules/evaluation/service.py
# File chứa toàn bộ Logic Nghiệp vụ (Business Logic) cho Module Chấm điểm (Scoring) và Tính toán Kết quả (Final Results).

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import AppException, NotFoundException
from app.core.security import utc_now
from app.db.enums import (
    EvaluationType,
    FinalResultStatus,
    ResultClassification,
    ScoreStatus,
    UserRole,
)
from app.modules.councils.model import DefenseSchedule
from app.modules.evaluation.model import FinalResult, Score
from app.modules.evaluation.repository import EvaluationRepository
from app.modules.evaluation.schemas import ScoreCreate, ScoreUpdate
from app.modules.registrations.model import Registration
from app.modules.users.model import User


class EvaluationService:
    """
    Service quản lý logic nghiệp vụ cho Chấm điểm và Kết quả đồ án/khóa luận.
    """

    def __init__(self, db: AsyncSession | None):
        self.db = db
        self.repository = EvaluationRepository(db) if db is not None else None

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
        self._ensure_lecturer(current_user)
        self._validate_score_range(data.score)
        registration = await self._get_registration_or_raise(data.registration_id)
        await self._ensure_final_result_not_published(registration.id)
        await self._ensure_score_context_is_valid(current_user, registration, data)

        existing_score = await self._repo.get_score_by_registration_evaluator_type(
            registration_id=data.registration_id,
            evaluator_id=current_user.id,
            evaluation_type=data.evaluation_type,
        )
        self._ensure_score_not_locked(existing_score)

        status = ScoreStatus.SUBMITTED if data.is_submit else ScoreStatus.DRAFT
        now = utc_now()

        if existing_score:
            existing_score.score = data.score
            existing_score.comments = data.comments
            existing_score.status = status
            existing_score.submitted_at = now if data.is_submit else existing_score.submitted_at
            existing_score.council_id = data.council_id
            score_obj = await self._repo.update_score(existing_score)
        else:
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
            score_obj = await self._repo.create_score(score_obj)

        score_obj = await self._repo.get_score_by_id(score_obj.id) or score_obj
        await self.db.commit()
        return score_obj

    async def update_score(
        self,
        current_user: User,
        score_id: UUID,
        data: ScoreUpdate,
    ) -> Score:
        """
        Cập nhật một phiếu điểm cụ thể trước khi điểm bị khóa hoặc kết quả được công bố.
        """
        self._ensure_lecturer(current_user)
        score_obj = await self._get_score_or_raise(score_id)

        if score_obj.evaluator_id != current_user.id:
            raise self._score_permission_denied()
        self._ensure_score_not_locked(score_obj)
        await self._ensure_final_result_not_published(score_obj.registration_id)

        if data.score is not None:
            self._validate_score_range(data.score)
            score_obj.score = data.score
        if "comments" in data.model_fields_set:
            score_obj.comments = data.comments
        if data.is_submit is not None:
            score_obj.status = ScoreStatus.SUBMITTED if data.is_submit else ScoreStatus.DRAFT
            if data.is_submit:
                score_obj.submitted_at = utc_now()

        score_obj = await self._repo.update_score(score_obj)
        score_obj = await self._repo.get_score_by_id(score_obj.id) or score_obj
        await self.db.commit()
        return score_obj

    async def get_scores_by_registration(
        self,
        registration_id: UUID,
        current_user: User,
    ) -> list[Score]:
        """
        Lấy danh sách phiếu điểm chấm theo quyền truy cập của người dùng hiện tại.
        """
        registration = await self._get_registration_or_raise(registration_id)
        scores = list(await self._repo.list_scores_by_registration(registration_id))

        if current_user.role == UserRole.ADMIN:
            return scores
        if current_user.role == UserRole.STUDENT:
            raise self._permission_denied()
        if current_user.role != UserRole.LECTURER:
            raise self._permission_denied()

        schedule = await self._repo.get_defense_schedule_for_registration(registration_id)
        is_supervisor = registration.supervisor_id == current_user.id
        is_active_council_member = False
        if schedule is not None:
            is_active_council_member = (
                await self._repo.get_active_council_member(
                    council_id=schedule.council_id,
                    lecturer_id=current_user.id,
                )
                is not None
            )

        if not is_supervisor and not is_active_council_member:
            raise self._permission_denied()

        visible_scores = [score for score in scores if score.evaluator_id == current_user.id]
        if is_supervisor:
            visible_scores.extend(
                score
                for score in scores
                if score.status == ScoreStatus.SUBMITTED and score.id not in {s.id for s in visible_scores}
            )
        return visible_scores

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
        self._ensure_admin(current_user)
        self._validate_weights(supervisor_weight, council_weight)
        registration = await self._get_registration_or_raise(registration_id)
        schedule = await self._get_defense_schedule_or_raise(registration_id)

        supervisor_score_obj = await self._repo.get_score_by_registration_evaluator_type(
            registration_id=registration_id,
            evaluator_id=registration.supervisor_id,
            evaluation_type=EvaluationType.SUPERVISOR,
        )
        if supervisor_score_obj is None or supervisor_score_obj.status != ScoreStatus.SUBMITTED:
            raise self._score_incomplete(
                message="Chưa có điểm đánh giá chính thức từ Giảng viên hướng dẫn.",
                details={"missing_supervisor_score": True},
            )

        active_members = list(await self._repo.list_active_council_members(schedule.council_id))
        if not active_members:
            raise self._score_incomplete(
                message="Hội đồng chưa có thành viên active để tính điểm.",
                details={"active_council_member_count": 0},
            )

        council_scores = list(
            await self._repo.list_submitted_council_scores_for_active_members(
                registration_id=registration_id,
                council_id=schedule.council_id,
            )
        )
        score_by_evaluator = {score.evaluator_id: score for score in council_scores}
        missing_member_ids = [
            str(member.lecturer_id)
            for member in active_members
            if member.lecturer_id not in score_by_evaluator
        ]
        if missing_member_ids:
            raise self._score_incomplete(
                message="Chưa đủ điểm đánh giá chính thức từ tất cả Thành viên Hội đồng.",
                details={
                    "required_council_score_count": len(active_members),
                    "submitted_council_score_count": len(council_scores),
                    "missing_evaluator_ids": missing_member_ids,
                },
            )

        avg_council_score = round(
            sum(float(score_by_evaluator[member.lecturer_id].score) for member in active_members)
            / len(active_members),
            2,
        )
        sup_score = float(supervisor_score_obj.score)
        final_score = round(
            (sup_score * (supervisor_weight / 100.0))
            + (avg_council_score * (council_weight / 100.0)),
            2,
        )
        classification = self._determine_classification(final_score)
        existing_result = await self._repo.get_final_result_by_registration(registration_id)
        now = utc_now()

        if existing_result:
            if existing_result.status == FinalResultStatus.PUBLISHED:
                raise AppException(
                    status_code=409,
                    message="Kết quả này đã được công bố, không thể tính toán lại.",
                    code="SCORE_RESULT_ALREADY_PUBLISHED",
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
            result_obj = await self._repo.update_final_result(existing_result)
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
            result_obj = await self._repo.create_final_result(result_obj)

        result_obj = await self._repo.get_final_result_by_registration(registration_id) or result_obj
        await self.db.commit()
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
        self._ensure_admin(current_user)
        await self._get_registration_or_raise(registration_id)
        result_obj = await self._repo.get_final_result_by_registration(registration_id)

        if result_obj is None:
            raise NotFoundException(
                message="Chưa tìm thấy kết quả tính toán cho đăng ký này. Hãy tính toán điểm trước.",
                error_code="FINAL_RESULT_NOT_FOUND",
            )
        if result_obj.status == FinalResultStatus.PUBLISHED:
            raise AppException(
                status_code=409,
                message="Kết quả này đã được công bố trước đó.",
                code="SCORE_RESULT_ALREADY_PUBLISHED",
            )
        if result_obj.status != FinalResultStatus.CALCULATED:
            raise AppException(
                status_code=400,
                message="Chỉ có thể công bố kết quả đã được tính toán.",
                code="FINAL_RESULT_NOT_CALCULATED",
            )

        now = utc_now()
        result_obj.status = FinalResultStatus.PUBLISHED
        result_obj.published_at = now
        result_obj.published_by_id = current_user.id
        await self._repo.update_final_result(result_obj)

        scores = await self._repo.list_scores_by_registration(registration_id)
        for score in scores:
            score.status = ScoreStatus.LOCKED
            score.locked_at = now
            await self._repo.update_score(score)

        result_obj = await self._repo.get_final_result_by_registration(registration_id) or result_obj
        await self.db.commit()
        return result_obj

    async def get_final_result(
        self,
        current_user: User,
        registration_id: UUID,
    ) -> FinalResult:
        """
        Lấy thông tin Kết quả tổng kết của Sinh viên theo quyền truy cập.
        Sinh viên chỉ được xem kết quả của mình khi trạng thái là PUBLISHED.
        """
        registration = await self._get_registration_or_raise(registration_id)
        result_obj = await self._repo.get_final_result_by_registration(registration_id)

        if result_obj is None:
            raise NotFoundException(
                message="Chưa có kết quả tổng kết cho đăng ký đồ án này.",
                error_code="FINAL_RESULT_NOT_FOUND",
            )

        if current_user.role == UserRole.ADMIN:
            return result_obj
        if current_user.role == UserRole.STUDENT:
            if registration.student_id != current_user.id:
                raise self._permission_denied()
            if result_obj.status != FinalResultStatus.PUBLISHED:
                raise self._permission_denied(
                    message="Kết quả tổng kết chưa được công bố chính thức.",
                )
            return result_obj
        if current_user.role == UserRole.LECTURER:
            if registration.supervisor_id == current_user.id:
                return result_obj
            schedule = await self._repo.get_defense_schedule_for_registration(registration_id)
            if schedule is not None:
                member = await self._repo.get_active_council_member(
                    council_id=schedule.council_id,
                    lecturer_id=current_user.id,
                )
                if member is not None:
                    return result_obj

        raise self._permission_denied()

    async def _ensure_score_context_is_valid(
        self,
        current_user: User,
        registration: Registration,
        data: ScoreCreate,
    ) -> None:
        if data.evaluation_type == EvaluationType.SUPERVISOR:
            if data.council_id is not None:
                raise AppException(
                    status_code=400,
                    message="Điểm từ Giảng viên hướng dẫn không được gắn với Hội đồng.",
                    code="SCORE_COUNCIL_NOT_ALLOWED",
                )
            if registration.supervisor_id != current_user.id:
                raise self._score_permission_denied(
                    message="Bạn không phải là Giảng viên hướng dẫn của sinh viên này.",
                )
            return

        if data.evaluation_type != EvaluationType.COUNCIL:
            raise AppException(
                status_code=400,
                message="Loại đánh giá không hợp lệ.",
                code="SCORE_INVALID_EVALUATION_TYPE",
            )

        if data.council_id is None:
            raise AppException(
                status_code=400,
                message="Vui lòng cung cấp thông tin Council ID khi chấm điểm hội đồng.",
                code="SCORE_COUNCIL_REQUIRED",
            )

        schedule = await self._repo.get_defense_schedule_for_registration_and_council(
            registration_id=registration.id,
            council_id=data.council_id,
        )
        if schedule is None:
            raise AppException(
                status_code=400,
                message="Sinh viên này không có lịch bảo vệ tại Hội đồng đã chọn.",
                code="SCORE_REGISTRATION_NOT_SCHEDULED_FOR_COUNCIL",
            )

        member = await self._repo.get_active_council_member(
            council_id=data.council_id,
            lecturer_id=current_user.id,
        )
        if member is None:
            raise self._score_permission_denied(
                message="Bạn không phải là thành viên active trong Hội đồng bảo vệ này.",
            )

    async def _get_registration_or_raise(self, registration_id: UUID) -> Registration:
        registration = await self._repo.get_registration_by_id(registration_id)
        if registration is None:
            raise NotFoundException(
                message="Registration not found.",
                error_code="REGISTRATION_NOT_FOUND",
            )
        return registration

    async def _get_score_or_raise(self, score_id: UUID) -> Score:
        score_obj = await self._repo.get_score_by_id(score_id)
        if score_obj is None:
            raise NotFoundException(
                message="Score not found.",
                error_code="SCORE_NOT_FOUND",
            )
        return score_obj

    async def _get_defense_schedule_or_raise(self, registration_id: UUID) -> DefenseSchedule:
        schedule = await self._repo.get_defense_schedule_for_registration(registration_id)
        if schedule is None:
            raise AppException(
                status_code=400,
                message="Registration chưa được xếp lịch bảo vệ.",
                code="SCORE_REGISTRATION_NOT_SCHEDULED",
            )
        return schedule

    async def _ensure_final_result_not_published(self, registration_id: UUID) -> None:
        final_result = await self._repo.get_final_result_by_registration(registration_id)
        if final_result is not None and final_result.status == FinalResultStatus.PUBLISHED:
            raise AppException(
                status_code=409,
                message="Kết quả cuối cùng đã được công bố, không thể chỉnh sửa điểm.",
                code="SCORE_RESULT_ALREADY_PUBLISHED",
            )

    def _ensure_score_not_locked(self, score_obj: Score | None) -> None:
        if score_obj is not None and score_obj.status == ScoreStatus.LOCKED:
            raise AppException(
                status_code=409,
                message="Phiếu điểm đã bị khóa sau khi công bố kết quả, không thể chỉnh sửa.",
                code="SCORE_RESULT_ALREADY_PUBLISHED",
            )

    def _ensure_lecturer(self, current_user: User) -> None:
        if current_user.role != UserRole.LECTURER:
            raise self._score_permission_denied()

    def _ensure_admin(self, current_user: User) -> None:
        if current_user.role != UserRole.ADMIN:
            raise self._permission_denied()

    def _validate_score_range(self, score: float) -> None:
        if score < 0 or score > 10:
            raise AppException(
                status_code=400,
                message="Score must be between 0 and 10.",
                code="SCORE_OUT_OF_RANGE",
            )

    def _validate_weights(self, supervisor_weight: float, council_weight: float) -> None:
        if supervisor_weight < 0 or council_weight < 0:
            raise AppException(
                status_code=400,
                message="Score weights must not be negative.",
                code="SCORE_INVALID_WEIGHT",
            )
        if round(supervisor_weight + council_weight, 2) != 100.0:
            raise AppException(
                status_code=400,
                message="Supervisor weight and council weight must total 100.",
                code="SCORE_INVALID_WEIGHT",
            )

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

    def _score_incomplete(
        self,
        *,
        message: str,
        details: dict | None = None,
    ) -> AppException:
        return AppException(
            status_code=400,
            message=message,
            code="SCORE_INCOMPLETE",
            details=details,
        )

    def _score_permission_denied(
        self,
        message: str = "Bạn không có quyền chấm điểm đăng ký này.",
    ) -> AppException:
        return AppException(
            status_code=403,
            message=message,
            code="SCORE_PERMISSION_DENIED",
        )

    def _permission_denied(
        self,
        message: str = "You do not have permission to perform this action.",
    ) -> AppException:
        return AppException(
            status_code=403,
            message=message,
            code="PERMISSION_DENIED",
        )

    @property
    def _repo(self) -> EvaluationRepository:
        if self.repository is None:
            raise RuntimeError("Evaluation repository is not available without a database session.")
        return self.repository
