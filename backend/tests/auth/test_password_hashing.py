from app.core.security import hash_password, hash_refresh_token, verify_password


def test_hash_password_does_not_return_plaintext():
    password = "StrongPassword123!"

    password_hash = hash_password(password)

    assert password_hash != password


def test_verify_password_accepts_matching_password():
    password = "StrongPassword123!"
    password_hash = hash_password(password)

    assert verify_password(password, password_hash) is True


def test_verify_password_rejects_wrong_password():
    password_hash = hash_password("StrongPassword123!")

    assert verify_password("wrong-password", password_hash) is False


def test_hash_refresh_token_is_deterministic_and_not_plaintext():
    raw_token = "refresh-token-value"

    first_hash = hash_refresh_token(raw_token)
    second_hash = hash_refresh_token(raw_token)

    assert first_hash == second_hash
    assert first_hash != raw_token
    assert len(first_hash) == 64
