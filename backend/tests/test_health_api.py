import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from types import SimpleNamespace

from api import app
from core.services import redis as redis_service
from core.services.supabase import DBConnection


@pytest.mark.asyncio
@pytest.mark.unit
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("status") == "ok"
    assert "timestamp" in data
    assert "instance_id" in data


@pytest.mark.asyncio
@pytest.mark.unit
async def test_health_docker_endpoint(monkeypatch):
    class DummyRedisClient:
        async def ping(self):
            return True

    async def dummy_get_client():
        return DummyRedisClient()

    monkeypatch.setattr(redis_service, "get_client", dummy_get_client)

    async def dummy_initialize(self):
        return None

    async def dummy_client(self):
        class DummyQuery:
            def select(self, *_args, **_kwargs):
                return self
            def limit(self, *_args, **_kwargs):
                return self
            async def execute(self):
                return SimpleNamespace(data=[{"thread_id": "t1"}])

        class DummyClient:
            def table(self, *_args, **_kwargs):
                return DummyQuery()

        return DummyClient()

    monkeypatch.setattr(DBConnection, "initialize", dummy_initialize)
    monkeypatch.setattr(DBConnection, "client", property(lambda self: asyncio.ensure_future(dummy_client(self))))

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/health-docker")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("status") == "ok"
    assert "timestamp" in data
    assert "instance_id" in data