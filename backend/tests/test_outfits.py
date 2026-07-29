import uuid

from fastapi.testclient import TestClient

from database import Base, SessionLocal, engine
from main import app
from models import ClothingItem


def _create_user_and_login(client: TestClient) -> dict:
    email = f"test-{uuid.uuid4().hex[:8]}@example.com"
    resp = client.post(
        "/api/auth/register",
        json={"email": email, "password": "securepassword123", "privacy_accepted": True},
    )
    assert resp.status_code == 201
    return {"email": email, "id": resp.json()["id"]}


def _create_items(client: TestClient, user_id: int) -> list[int]:
    db = SessionLocal()
    item_ids = []
    for i in range(3):
        item = ClothingItem(
            user_id=user_id,
            name=f"Item {i}",
            category="Oberteile",
            image_filename=f"test-{uuid.uuid4().hex[:8]}.jpg",
        )
        db.add(item)
        db.flush()
        item_ids.append(item.id)
    db.commit()
    db.close()
    return item_ids


class TestCreateOutfit:
    def test_create_outfit_success(self):
        Base.metadata.create_all(bind=engine)
        with TestClient(app) as client:
            user = _create_user_and_login(client)
            item_ids = _create_items(client, user["id"])

            resp = client.post(
                "/api/outfits",
                json={"name": "Mein Abendoutfit", "item_ids": item_ids},
            )
            assert resp.status_code == 201
            data = resp.json()
            assert data["name"] == "Mein Abendoutfit"
            assert len(data["items"]) == 3
            assert data["items"][0]["name"] == "Item 0"
            assert data["items"][1]["name"] == "Item 1"
            assert data["items"][2]["name"] == "Item 2"

    def test_create_outfit_unauthorized(self):
        Base.metadata.create_all(bind=engine)
        with TestClient(app) as client:
            resp = client.post(
                "/api/outfits",
                json={"name": "Outfit", "item_ids": [1, 2]},
            )
            assert resp.status_code == 401

    def test_create_outfit_empty_name(self):
        Base.metadata.create_all(bind=engine)
        with TestClient(app) as client:
            user = _create_user_and_login(client)
            item_ids = _create_items(client, user["id"])

            resp = client.post(
                "/api/outfits",
                json={"name": "", "item_ids": item_ids},
            )
            assert resp.status_code == 422
            assert "Name" in resp.json()["detail"]

    def test_create_outfit_fewer_than_two_items(self):
        Base.metadata.create_all(bind=engine)
        with TestClient(app) as client:
            user = _create_user_and_login(client)
            item_ids = _create_items(client, user["id"])

            resp = client.post(
                "/api/outfits",
                json={"name": "Outfit", "item_ids": [item_ids[0]]},
            )
            assert resp.status_code == 422
            assert "2 Items" in resp.json()["detail"]

    def test_create_outfit_item_not_found(self):
        Base.metadata.create_all(bind=engine)
        with TestClient(app) as client:
            _create_user_and_login(client)
            resp = client.post(
                "/api/outfits",
                json={"name": "Outfit", "item_ids": [99999, 99998]},
            )
            assert resp.status_code == 422
            assert "nicht gefunden" in resp.json()["detail"]

    def test_create_outfit_item_belongs_to_other_user(self):
        Base.metadata.create_all(bind=engine)
        with TestClient(app) as client:
            user1 = _create_user_and_login(client)
            item_ids = _create_items(client, user1["id"])

            client.post("/api/auth/logout", json={})

            _create_user_and_login(client)

            resp = client.post(
                "/api/outfits",
                json={"name": "Fremdes Outfit", "item_ids": item_ids},
            )
            assert resp.status_code == 403


class TestListOutfits:
    def test_list_outfits_empty(self):
        Base.metadata.create_all(bind=engine)
        with TestClient(app) as client:
            _create_user_and_login(client)
            resp = client.get("/api/outfits")
            assert resp.status_code == 200
            assert resp.json() == []

    def test_list_outfits_returns_user_outfits(self):
        Base.metadata.create_all(bind=engine)
        with TestClient(app) as client:
            user = _create_user_and_login(client)
            item_ids = _create_items(client, user["id"])

            client.post(
                "/api/outfits",
                json={"name": "Outfit A", "item_ids": [item_ids[0], item_ids[1]]},
            )
            client.post(
                "/api/outfits",
                json={"name": "Outfit B", "item_ids": [item_ids[1], item_ids[2]]},
            )

            resp = client.get("/api/outfits")
            assert resp.status_code == 200
            data = resp.json()
            assert len(data) == 2
            assert data[0]["name"] == "Outfit A"
            assert data[1]["name"] == "Outfit B"

    def test_list_outfits_unauthorized(self):
        Base.metadata.create_all(bind=engine)
        with TestClient(app) as client:
            resp = client.get("/api/outfits")
            assert resp.status_code == 401

    def test_list_outfits_isolation(self):
        Base.metadata.create_all(bind=engine)
        with TestClient(app) as client:
            user1 = _create_user_and_login(client)
            item_ids = _create_items(client, user1["id"])
            client.post(
                "/api/outfits",
                json={"name": "Nur User1", "item_ids": [item_ids[0], item_ids[1]]},
            )

            client.post("/api/auth/logout", json={})

            _create_user_and_login(client)
            resp = client.get("/api/outfits")
            assert resp.status_code == 200
            assert resp.json() == []


class TestDeleteOutfit:
    def test_delete_outfit_success(self):
        Base.metadata.create_all(bind=engine)
        with TestClient(app) as client:
            user = _create_user_and_login(client)
            item_ids = _create_items(client, user["id"])

            create_resp = client.post(
                "/api/outfits",
                json={"name": "Zum Löschen", "item_ids": [item_ids[0], item_ids[1]]},
            )
            outfit_id = create_resp.json()["id"]

            resp = client.delete(f"/api/outfits/{outfit_id}")
            assert resp.status_code == 204

            list_resp = client.get("/api/outfits")
            assert list_resp.json() == []

    def test_delete_outfit_not_found(self):
        Base.metadata.create_all(bind=engine)
        with TestClient(app) as client:
            _create_user_and_login(client)
            resp = client.delete("/api/outfits/99999")
            assert resp.status_code == 404

    def test_delete_outfit_unauthorized(self):
        Base.metadata.create_all(bind=engine)
        with TestClient(app) as client:
            resp = client.delete("/api/outfits/1")
            assert resp.status_code == 401

    def test_delete_outfit_other_user(self):
        Base.metadata.create_all(bind=engine)
        with TestClient(app) as client:
            user1 = _create_user_and_login(client)
            item_ids = _create_items(client, user1["id"])

            create_resp = client.post(
                "/api/outfits",
                json={"name": "User1 Outfit", "item_ids": [item_ids[0], item_ids[1]]},
            )
            outfit_id = create_resp.json()["id"]

            client.post("/api/auth/logout", json={})

            _create_user_and_login(client)
            resp = client.delete(f"/api/outfits/{outfit_id}")
            assert resp.status_code == 403
