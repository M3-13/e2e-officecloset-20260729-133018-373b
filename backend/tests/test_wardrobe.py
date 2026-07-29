import io
import os
import uuid
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from main import app
from wardrobe import UPLOAD_DIR, VALID_CATEGORIES


@pytest.fixture
def client():
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


@pytest.fixture
def auth_headers(client):
    email = f"test_{uuid.uuid4().hex[:8]}@wardrobe.com"
    resp = client.post(
        "/api/auth/register",
        json={"email": email, "password": "securepass123"},
    )
    assert resp.status_code == 201, resp.text
    cookie = resp.headers.get("set-cookie", "")
    return {"Cookie": cookie}


def _make_jpeg_bytes() -> bytes:
    from PIL import Image

    img = Image.new("RGB", (10, 10), color="red")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def _make_large_bytes() -> bytes:
    from image_utils import UPLOAD_MAX_SIZE

    return b"\xff\xd8\xff" + b"\x00" * (UPLOAD_MAX_SIZE + 1)


@pytest.fixture(autouse=True)
def cleanup_uploads():
    yield
    upload_dir = Path(UPLOAD_DIR)
    if upload_dir.exists():
        for f in upload_dir.iterdir():
            f.unlink()


class TestListItems:
    def test_empty_list_when_no_items(self, client, auth_headers):
        resp = client.get("/api/wardrobe", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_returns_items_for_authenticated_user(self, client, auth_headers):
        jpeg = _make_jpeg_bytes()
        create_resp = client.post(
            "/api/wardrobe",
            data={"name": "Mein Shirt", "category": "Oberteil"},
            files={"image": ("shirt.jpg", io.BytesIO(jpeg), "image/jpeg")},
            headers=auth_headers,
        )
        assert create_resp.status_code == 201

        resp = client.get("/api/wardrobe", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["name"] == "Mein Shirt"
        assert data[0]["category"] == "Oberteil"
        assert data[0]["image_url"].startswith("/api/images/")
        assert "id" in data[0]
        assert "created_at" in data[0]

    def test_filters_by_category(self, client, auth_headers):
        jpeg = _make_jpeg_bytes()
        client.post(
            "/api/wardrobe",
            data={"name": "Shirt", "category": "Oberteil"},
            files={"image": ("shirt.jpg", io.BytesIO(jpeg), "image/jpeg")},
            headers=auth_headers,
        )
        client.post(
            "/api/wardrobe",
            data={"name": "Jeans", "category": "Hose"},
            files={"image": ("jeans.jpg", io.BytesIO(jpeg), "image/jpeg")},
            headers=auth_headers,
        )

        resp = client.get("/api/wardrobe?category=Hose", headers=auth_headers)
        data = resp.json()
        assert len(data) == 1
        assert data[0]["category"] == "Hose"

    def test_items_are_isolated_per_user(self, client, auth_headers):
        jpeg = _make_jpeg_bytes()
        client.post(
            "/api/wardrobe",
            data={"name": "User1 Item", "category": "Schuhe"},
            files={"image": ("shoe.jpg", io.BytesIO(jpeg), "image/jpeg")},
            headers=auth_headers,
        )

        other_email = f"other_{uuid.uuid4().hex[:8]}@wardrobe.com"
        resp2 = client.post(
            "/api/auth/register",
            json={"email": other_email, "password": "securepass123"},
        )
        assert resp2.status_code == 201
        other_cookie = resp2.headers.get("set-cookie", "")
        other_headers = {"Cookie": other_cookie}

        resp = client.get("/api/wardrobe", headers=other_headers)
        assert resp.json() == []

    def test_requires_authentication(self, client):
        resp = client.get("/api/wardrobe")
        assert resp.status_code == 401


class TestCreateItem:
    def test_creates_item_and_returns_201(self, client, auth_headers):
        jpeg = _make_jpeg_bytes()
        resp = client.post(
            "/api/wardrobe",
            data={"name": "Mein Kleid", "category": "Kleid"},
            files={"image": ("dress.jpg", io.BytesIO(jpeg), "image/jpeg")},
            headers=auth_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Mein Kleid"
        assert data["category"] == "Kleid"
        assert data["image_url"].startswith("/api/images/")

    def test_saves_image_to_uploads(self, client, auth_headers):
        jpeg = _make_jpeg_bytes()
        resp = client.post(
            "/api/wardrobe",
            data={"name": "Test", "category": "Jacke"},
            files={"image": ("jacket.jpg", io.BytesIO(jpeg), "image/jpeg")},
            headers=auth_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        filename = data["image_url"].split("/")[-1]
        file_path = os.path.join(UPLOAD_DIR, filename)
        assert os.path.exists(file_path)

    def test_rejects_invalid_category(self, client, auth_headers):
        jpeg = _make_jpeg_bytes()
        resp = client.post(
            "/api/wardrobe",
            data={"name": "Test", "category": "InvalidCat"},
            files={"image": ("test.jpg", io.BytesIO(jpeg), "image/jpeg")},
            headers=auth_headers,
        )
        assert resp.status_code == 422

    def test_rejects_invalid_image_format(self, client, auth_headers):
        resp = client.post(
            "/api/wardrobe",
            data={"name": "Test", "category": "Oberteil"},
            files={"image": ("test.gif", io.BytesIO(b"GIF89a"), "image/gif")},
            headers=auth_headers,
        )
        assert resp.status_code == 422

    def test_rejects_wrong_magic_bytes(self, client, auth_headers):
        resp = client.post(
            "/api/wardrobe",
            data={"name": "Test", "category": "Oberteil"},
            files={"image": ("test.jpg", io.BytesIO(b"not a jpeg"), "image/jpeg")},
            headers=auth_headers,
        )
        assert resp.status_code == 422

    def test_rejects_oversized_image(self, client, auth_headers):
        large = _make_large_bytes()
        resp = client.post(
            "/api/wardrobe",
            data={"name": "Test", "category": "Oberteil"},
            files={"image": ("big.jpg", io.BytesIO(large), "image/jpeg")},
            headers=auth_headers,
        )
        assert resp.status_code == 422

    def test_requires_authentication(self, client):
        jpeg = _make_jpeg_bytes()
        resp = client.post(
            "/api/wardrobe",
            data={"name": "Test", "category": "Oberteil"},
            files={"image": ("test.jpg", io.BytesIO(jpeg), "image/jpeg")},
        )
        assert resp.status_code == 401

    def test_all_valid_categories_accepted(self, client, auth_headers):
        jpeg = _make_jpeg_bytes()
        for cat in VALID_CATEGORIES:
            resp = client.post(
                "/api/wardrobe",
                data={"name": f"Item {cat}", "category": cat},
                files={"image": ("test.jpg", io.BytesIO(jpeg), "image/jpeg")},
                headers=auth_headers,
            )
            assert resp.status_code == 201, f"Category {cat} should be accepted"


class TestDeleteItem:
    def test_deletes_own_item(self, client, auth_headers):
        jpeg = _make_jpeg_bytes()
        create_resp = client.post(
            "/api/wardrobe",
            data={"name": "To Delete", "category": "Hose"},
            files={"image": ("del.jpg", io.BytesIO(jpeg), "image/jpeg")},
            headers=auth_headers,
        )
        item_id = create_resp.json()["id"]

        resp = client.delete(f"/api/wardrobe/{item_id}", headers=auth_headers)
        assert resp.status_code == 204

        list_resp = client.get("/api/wardrobe", headers=auth_headers)
        assert list_resp.json() == []

    def test_deletes_image_file_from_disk(self, client, auth_headers):
        jpeg = _make_jpeg_bytes()
        create_resp = client.post(
            "/api/wardrobe",
            data={"name": "To Delete", "category": "Hose"},
            files={"image": ("del.jpg", io.BytesIO(jpeg), "image/jpeg")},
            headers=auth_headers,
        )
        data = create_resp.json()
        filename = data["image_url"].split("/")[-1]
        file_path = os.path.join(UPLOAD_DIR, filename)
        assert os.path.exists(file_path)

        resp = client.delete(f"/api/wardrobe/{data['id']}", headers=auth_headers)
        assert resp.status_code == 204
        assert not os.path.exists(file_path)

    def test_returns_404_for_nonexistent_item(self, client, auth_headers):
        resp = client.delete("/api/wardrobe/99999", headers=auth_headers)
        assert resp.status_code == 404

    def test_cannot_delete_another_users_item(self, client, auth_headers):
        jpeg = _make_jpeg_bytes()
        create_resp = client.post(
            "/api/wardrobe",
            data={"name": "My Item", "category": "Schuhe"},
            files={"image": ("shoe.jpg", io.BytesIO(jpeg), "image/jpeg")},
            headers=auth_headers,
        )
        item_id = create_resp.json()["id"]

        other_email = f"hacker_{uuid.uuid4().hex[:8]}@wardrobe.com"
        resp2 = client.post(
            "/api/auth/register",
            json={"email": other_email, "password": "securepass123"},
        )
        assert resp2.status_code == 201
        other_cookie = resp2.headers.get("set-cookie", "")
        other_headers = {"Cookie": other_cookie}

        resp = client.delete(f"/api/wardrobe/{item_id}", headers=other_headers)
        assert resp.status_code == 403

    def test_requires_authentication(self, client):
        resp = client.delete("/api/wardrobe/1")
        assert resp.status_code == 401


class TestServeImage:
    def setup_method(self):
        self.jpeg = _make_jpeg_bytes()

    def _upload_and_get_filename(self, client, auth_headers) -> str:
        resp = client.post(
            "/api/wardrobe",
            data={"name": "Test", "category": "Oberteil"},
            files={"image": ("test.jpg", io.BytesIO(self.jpeg), "image/jpeg")},
            headers=auth_headers,
        )
        data = resp.json()
        return data["image_url"].split("/")[-1]

    def test_serves_uploaded_image(self, client, auth_headers):
        filename = self._upload_and_get_filename(client, auth_headers)
        resp = client.get(f"/api/images/{filename}", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.headers["content-type"] == "image/jpeg"
        assert len(resp.content) > 0

    def test_returns_404_for_nonexistent_image(self, client, auth_headers):
        resp = client.get("/api/images/nonexistent.jpg", headers=auth_headers)
        assert resp.status_code == 404

    def test_blocks_dotdot_in_filename(self, client, auth_headers):
        resp = client.get("/api/images/....test", headers=auth_headers)
        assert resp.status_code == 422

    def test_blocks_encoded_traversal(self, client, auth_headers):
        resp = client.get("/api/images/%2e%2e%2ftest", headers=auth_headers)
        assert resp.status_code in (404, 422)

    def test_blocks_backslash_traversal(self, client, auth_headers):
        resp = client.get("/api/images/..\\..\\windows\\system32", headers=auth_headers)
        assert resp.status_code == 422

    def test_requires_authentication(self, client):
        resp = client.get("/api/images/somefile.jpg")
        assert resp.status_code == 401
