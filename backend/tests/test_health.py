from fastapi.testclient import TestClient

from main import app


def test_health_endpoint_returns_ok():
    with TestClient(app) as client:
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


def test_health_endpoint_response_is_json():
    with TestClient(app) as client:
        response = client.get("/api/health")
        assert response.headers["content-type"] == "application/json"
