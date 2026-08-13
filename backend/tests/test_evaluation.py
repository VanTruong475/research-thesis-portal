# backend/tests/test_evaluation.py
# File test kiểm thử cho Module Chấm điểm (Scoring) & Kết quả cuối cùng (Final Results)

import pytest
from app.db.enums import EvaluationType, FinalResultStatus, ResultClassification, ScoreStatus
from app.modules.evaluation.schemas import ScoreCreate
from app.modules.evaluation.service import EvaluationService


def test_classification_logic():
    """
    Test kiểm tra logic phân loại xếp loại dựa trên điểm số.
    """
    service = EvaluationService(db=None)
    assert service._determine_classification(9.5) == ResultClassification.EXCELLENT
    assert service._determine_classification(8.5) == ResultClassification.GOOD
    assert service._determine_classification(7.0) == ResultClassification.FAIR
    assert service._determine_classification(5.5) == ResultClassification.AVERAGE
    assert service._determine_classification(4.0) == ResultClassification.FAILED


def test_score_schema_validation():
    """
    Test kiểm tra validation dữ liệu đầu vào cho phiếu điểm chấm.
    """
    import uuid
    # Đảm bảo điểm số hợp lệ từ 0.0 đến 10.0
    valid_score = ScoreCreate(
        registration_id=uuid.uuid4(),
        evaluation_type=EvaluationType.SUPERVISOR,
        score=8.5,
        comments="Đồ án làm tốt",
        is_submit=True,
    )
    assert valid_score.score == 8.5

    # Thử truyền điểm âm hoặc quá 10 sẽ ra lỗi validation
    with pytest.raises(Exception):
        ScoreCreate(
            registration_id=uuid.uuid4(),
            evaluation_type=EvaluationType.SUPERVISOR,
            score=11.0,
        )
