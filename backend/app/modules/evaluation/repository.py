from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.db.enums import CouncilMemberStatus, EvaluationType, ScoreStatus
from app.modules.councils.model import CouncilMember, DefenseSchedule
from app.modules.evaluation.model import FinalResult, Score
from app.modules.registrations.model import Registration


class EvaluationRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_registration_by_id(self, registration_id: UUID) -> Registration | None:
        result = await self.db.execute(
            select(Registration)
            .options(
                joinedload(Registration.academic_period),
                joinedload(Registration.topic),
                joinedload(Registration.student),
                joinedload(Registration.supervisor),
            )
            .where(Registration.id == registration_id)
        )
        return result.scalar_one_or_none()

    async def get_score_by_id(self, score_id: UUID) -> Score | None:
        result = await self.db.execute(
            self._score_query().where(Score.id == score_id)
        )
        return result.scalar_one_or_none()

    async def get_score_by_registration_evaluator_type(
        self,
        *,
        registration_id: UUID,
        evaluator_id: UUID,
        evaluation_type: EvaluationType,
    ) -> Score | None:
        result = await self.db.execute(
            self._score_query().where(
                Score.registration_id == registration_id,
                Score.evaluator_id == evaluator_id,
                Score.evaluation_type == evaluation_type,
            )
        )
        return result.scalar_one_or_none()

    async def get_submitted_supervisor_score(self, registration_id: UUID) -> Score | None:
        result = await self.db.execute(
            self._score_query().where(
                Score.registration_id == registration_id,
                Score.evaluation_type == EvaluationType.SUPERVISOR,
                Score.status == ScoreStatus.SUBMITTED,
            )
        )
        return result.scalar_one_or_none()

    async def list_scores_by_registration(self, registration_id: UUID) -> Sequence[Score]:
        result = await self.db.execute(
            self._score_query()
            .where(Score.registration_id == registration_id)
            .order_by(Score.evaluation_type, Score.created_at)
        )
        return result.scalars().all()

    async def list_scores_for_registration_and_council(
        self,
        registration_id: UUID,
        council_id: UUID,
    ) -> Sequence[Score]:
        result = await self.db.execute(
            self._score_query().where(
                Score.registration_id == registration_id,
                Score.council_id == council_id,
                Score.evaluation_type == EvaluationType.COUNCIL,
            )
        )
        return result.scalars().all()

    async def list_submitted_council_scores_for_active_members(
        self,
        *,
        registration_id: UUID,
        council_id: UUID,
    ) -> Sequence[Score]:
        result = await self.db.execute(
            self._score_query()
            .join(CouncilMember, CouncilMember.lecturer_id == Score.evaluator_id)
            .where(
                Score.registration_id == registration_id,
                Score.council_id == council_id,
                Score.evaluation_type == EvaluationType.COUNCIL,
                Score.status == ScoreStatus.SUBMITTED,
                CouncilMember.council_id == council_id,
                CouncilMember.status == CouncilMemberStatus.ACTIVE,
            )
        )
        return result.scalars().unique().all()

    async def get_final_result_by_registration(
        self,
        registration_id: UUID,
    ) -> FinalResult | None:
        result = await self.db.execute(
            self._final_result_query().where(FinalResult.registration_id == registration_id)
        )
        return result.scalar_one_or_none()

    async def get_defense_schedule_for_registration(
        self,
        registration_id: UUID,
    ) -> DefenseSchedule | None:
        result = await self.db.execute(
            self._defense_schedule_query().where(
                DefenseSchedule.registration_id == registration_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_defense_schedule_for_registration_and_council(
        self,
        *,
        registration_id: UUID,
        council_id: UUID,
    ) -> DefenseSchedule | None:
        result = await self.db.execute(
            self._defense_schedule_query().where(
                DefenseSchedule.registration_id == registration_id,
                DefenseSchedule.council_id == council_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_active_council_member(
        self,
        *,
        council_id: UUID,
        lecturer_id: UUID,
    ) -> CouncilMember | None:
        result = await self.db.execute(
            select(CouncilMember)
            .options(joinedload(CouncilMember.lecturer))
            .where(
                CouncilMember.council_id == council_id,
                CouncilMember.lecturer_id == lecturer_id,
                CouncilMember.status == CouncilMemberStatus.ACTIVE,
            )
        )
        return result.scalar_one_or_none()

    async def list_active_council_members(self, council_id: UUID) -> Sequence[CouncilMember]:
        result = await self.db.execute(
            select(CouncilMember)
            .options(joinedload(CouncilMember.lecturer))
            .where(
                CouncilMember.council_id == council_id,
                CouncilMember.status == CouncilMemberStatus.ACTIVE,
            )
            .order_by(CouncilMember.created_at)
        )
        return result.scalars().all()

    async def create_score(self, score: Score) -> Score:
        self.db.add(score)
        await self.db.flush()
        await self.db.refresh(score)
        return score

    async def update_score(self, score: Score) -> Score:
        await self.db.flush()
        await self.db.refresh(score)
        return score

    async def create_final_result(self, final_result: FinalResult) -> FinalResult:
        self.db.add(final_result)
        await self.db.flush()
        await self.db.refresh(final_result)
        return final_result

    async def update_final_result(self, final_result: FinalResult) -> FinalResult:
        await self.db.flush()
        await self.db.refresh(final_result)
        return final_result

    def _score_query(self) -> Select[tuple[Score]]:
        return select(Score).options(
            joinedload(Score.evaluator),
            joinedload(Score.council),
            joinedload(Score.registration).joinedload(Registration.academic_period),
            joinedload(Score.registration).joinedload(Registration.topic),
            joinedload(Score.registration).joinedload(Registration.student),
            joinedload(Score.registration).joinedload(Registration.supervisor),
        )

    def _final_result_query(self) -> Select[tuple[FinalResult]]:
        return select(FinalResult).options(
            joinedload(FinalResult.registration).joinedload(Registration.academic_period),
            joinedload(FinalResult.registration).joinedload(Registration.topic),
            joinedload(FinalResult.registration).joinedload(Registration.student),
            joinedload(FinalResult.registration).joinedload(Registration.supervisor),
            joinedload(FinalResult.calculated_by),
            joinedload(FinalResult.published_by),
        )

    def _defense_schedule_query(self) -> Select[tuple[DefenseSchedule]]:
        return select(DefenseSchedule).options(
            joinedload(DefenseSchedule.council),
            joinedload(DefenseSchedule.registration).joinedload(Registration.academic_period),
            joinedload(DefenseSchedule.registration).joinedload(Registration.topic),
            joinedload(DefenseSchedule.registration).joinedload(Registration.student),
            joinedload(DefenseSchedule.registration).joinedload(Registration.supervisor),
        )
