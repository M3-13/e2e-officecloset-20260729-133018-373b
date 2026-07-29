import io
import uuid
from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from database import SessionLocal
from main import app
from models import ClothingItem, User
from models import Session as SessionModel


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def _register_user(client: TestClient, email: str) -> None:
    resp = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "securepassword123",
            "privacy_accepted": True,
        },
    )
    assert resp.status_code == 201


def _login_user(client: TestClient, email: str) -> None:
    resp = client.post(
        "/api/auth/login",
        json={
            "email": email,
            "password": "securepassword123",
        },
    )
    assert resp.status_code == 200


class TestRegisterPrivacyAccepted:
    def test_register_without_privacy_accepted_fails(self):
        with TestClient(app, base_url="https://testserver") as client:
            email = f"test-{uuid.uuid4().hex[:8]}@example.com"
            resp = client.post(
                "/api/auth/register",
                json={"email": email, "password": "securepassword123"},
            )
            assert resp.status_code == 422

    def test_register_with_privacy_accepted_false_fails(self):
        with TestClient(app, base_url="https://testserver") as client:
            email = f"test-{uuid.uuid4().hex[:8]}@example.com"
            resp = client.post(
                "/api/auth/register",
                json={
                    "email": email,
                    "password": "securepassword123",
                    "privacy_accepted": False,
                },
            )
            assert resp.status_code == 422

    def test_register_with_privacy_accepted_true_succeeds(self):
        with TestClient(app, base_url="https://testserver") as client:
            email = f"test-{uuid.uuid4().hex[:8]}@example.com"
            resp = client.post(
                "/api/auth/register",
                json={
                    "email": email,
                    "password": "securepassword123",
                    "privacy_accepted": True,
                },
            )
            assert resp.status_code == 201
            data = resp.json()
            assert data["email"] == email
            assert "id" in data


class TestSessionExpiry:
    def test_valid_session_is_accepted(self):
        with TestClient(app, base_url="https://testserver") as client:
            email = f"fresh-{uuid.uuid4().hex[:8]}@example.com"
            _register_user(client, email)
            resp = client.get("/api/auth/me")
            assert resp.status_code == 200

    def test_expired_session_returns_401(self):
        with TestClient(app, base_url="https://testserver") as client:
            email = f"expired-{uuid.uuid4().hex[:8]}@example.com"
            _register_user(client, email)

            db = SessionLocal()
            try:
                sessions = db.query(SessionModel).filter(SessionModel.user_id > 0).all()
                for s in sessions:
                    s.expires_at = _utcnow() - timedelta(hours=1)
                db.commit()
            finally:
                db.close()

            resp = client.get("/api/auth/me")
            assert resp.status_code == 401
            data = resp.json()
            assert "abgelaufen" in data["detail"]

    def test_expired_session_is_deleted_from_db(self):
        with TestClient(app, base_url="https://testserver") as client:
            email = f"cleanup-{uuid.uuid4().hex[:8]}@example.com"
            _register_user(client, email)

            db = SessionLocal()
            try:
                sessions = db.query(SessionModel).filter(SessionModel.user_id > 0).all()
                for s in sessions:
                    s.expires_at = _utcnow() - timedelta(hours=1)
                db.commit()
                session_count_before = len(sessions)
            finally:
                db.close()

            client.get("/api/auth/me")

            db = SessionLocal()
            try:
                remaining = db.query(SessionModel).filter(SessionModel.user_id > 0).all()
                assert len(remaining) == session_count_before - 1
            finally:
                db.close()


class TestDeleteAccount:
    def test_delete_account_returns_204(self):
        with TestClient(app, base_url="https://testserver") as client:
            email = f"delete-{uuid.uuid4().hex[:8]}@example.com"
            _register_user(client, email)
            resp = client.delete("/api/auth/me")
            assert resp.status_code == 204

    def test_delete_account_removes_user_from_db(self):
        with TestClient(app, base_url="https://testserver") as client:
            email = f"delete-{uuid.uuid4().hex[:8]}@example.com"
            _register_user(client, email)
            client.delete("/api/auth/me")

            db = SessionLocal()
            try:
                user = db.query(User).filter(User.email == email).first()
                assert user is None
            finally:
                db.close()

    def test_delete_account_clears_session_cookie(self):
        with TestClient(app, base_url="https://testserver") as client:
            email = f"delete-{uuid.uuid4().hex[:8]}@example.com"
            _register_user(client, email)
            resp = client.delete("/api/auth/me")
            assert resp.status_code == 204
            cookie = resp.headers.get("set-cookie", "")
            assert "session_token" in cookie
            assert "Max-Age=0" in cookie or "expires=" in cookie.lower()

    def test_delete_account_cannot_be_called_after_deletion(self):
        with TestClient(app, base_url="https://testserver") as client:
            email = f"delete-{uuid.uuid4().hex[:8]}@example.com"
            _register_user(client, email)
            resp = client.delete("/api/auth/me")
            assert resp.status_code == 204

            resp = client.delete("/api/auth/me")
            assert resp.status_code == 401

    def test_delete_account_removes_images(self):
        with TestClient(app, base_url="https://testserver") as client:
            email = f"delete-{uuid.uuid4().hex[:8]}@example.com"
            _register_user(client, email)

            db = SessionLocal()
            try:
                user = db.query(User).filter(User.email == email).first()
                assert user is not None
                item = ClothingItem(
                    user_id=user.id,
                    name="Test Item",
                    category="Oberteil",
                    image_filename="test-delete-me.jpg",
                )
                db.add(item)
                db.commit()
            finally:
                db.close()

            import os

            uploads_dir = "uploads"
            os.makedirs(uploads_dir, exist_ok=True)
            test_file_path = os.path.join(uploads_dir, "test-delete-me.jpg")
            with open(test_file_path, "wb") as f:
                f.write(b"\xff\xd8\xff" + b"\x00" * 100)

            assert os.path.exists(test_file_path)

            resp = client.delete("/api/auth/me")
            assert resp.status_code == 204

            assert not os.path.exists(test_file_path)

    def test_delete_account_requires_authentication(self):
        with TestClient(app, base_url="https://testserver") as client:
            resp = client.delete("/api/auth/me")
            assert resp.status_code == 401


class TestImageIDOR:
    def _make_jpeg_bytes(self) -> bytes:
        from PIL import Image

        img = Image.new("RGB", (10, 10), color="red")
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        return buf.getvalue()

    def test_cannot_access_another_users_image(self):
        with TestClient(app, base_url="https://testserver") as client:
            email1 = f"user1-{uuid.uuid4().hex[:8]}@example.com"
            _register_user(client, email1)

            jpeg = self._make_jpeg_bytes()
            resp = client.post(
                "/api/wardrobe",
                data={"name": "User1 Item", "category": "Oberteil"},
                files={"image": ("shirt.jpg", io.BytesIO(jpeg), "image/jpeg")},
            )
            assert resp.status_code == 201
            user1_filename = resp.json()["image_url"].split("/")[-1]

            client.post("/api/auth/logout", json={})

            email2 = f"user2-{uuid.uuid4().hex[:8]}@example.com"
            _register_user(client, email2)

            resp = client.get(f"/api/images/{user1_filename}")
            assert resp.status_code == 404

    def test_can_access_own_image(self):
        with TestClient(app, base_url="https://testserver") as client:
            email = f"owner-{uuid.uuid4().hex[:8]}@example.com"
            _register_user(client, email)

            jpeg = self._make_jpeg_bytes()
            resp = client.post(
                "/api/wardrobe",
                data={"name": "Owner Item", "category": "Oberteil"},
                files={"image": ("own.jpg", io.BytesIO(jpeg), "image/jpeg")},
            )
            assert resp.status_code == 201
            filename = resp.json()["image_url"].split("/")[-1]

            resp = client.get(f"/api/images/{filename}")
            assert resp.status_code == 200
            assert resp.headers["content-type"] == "image/jpeg"
