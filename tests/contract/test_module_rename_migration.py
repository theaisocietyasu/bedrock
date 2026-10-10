"""The migration that renames compute to godfather, splits alerts into the webhook modules and makes mcp core."""

import json
import os
import sqlite3
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BEFORE = "70625e187487"
AFTER = "d7f9b1c3e5a7"


def _alembic(db_path, *args):
    env = {**os.environ, "DATABASE_URL": f"sqlite:///{db_path}"}
    result = subprocess.run(
        [sys.executable, "-m", "alembic", *args], cwd=ROOT, env=env, capture_output=True, text=True, check=False
    )
    assert result.returncode == 0, result.stderr


def _config(db, org_id):
    (config,) = db.execute("SELECT config FROM organizations WHERE id = ?", (org_id,)).fetchone()
    return json.loads(config) if config else {}


def _scopes(db, token_id):
    (scopes,) = db.execute("SELECT scopes FROM machine_tokens WHERE id = ?", (token_id,)).fetchone()
    return json.loads(scopes)


def test_modules_config_and_scopes_are_renamed_and_come_back(tmp_path):
    db_path = tmp_path / "orgs.db"
    _alembic(db_path, "upgrade", BEFORE)
    db = sqlite3.connect(db_path)
    soda = {"modules": {"compute": False, "alerts": True, "mcp": True}, "compute": {"pod_image": "a/b:1"}}
    orgs = [
        (1, "SoDA", "soda", "1", json.dumps(soda)),
        (2, "AIS", "ais", "2", json.dumps({"modules": {"alerts": False}})),
        (3, "Club", "club", "3", None),
    ]
    db.executemany(
        "INSERT INTO organizations (id, name, prefix, guild_id, is_active, config) VALUES (?, ?, ?, ?, 1, ?)", orgs
    )
    db.execute(
        "INSERT INTO alert_feeds (organization_id, key, kind, config, every_hours, enabled, created_at) "
        "VALUES (1, 'hackathons', 'hackathons', '{}', 12, 1, '2026-10-10')"
    )
    db.execute(
        "INSERT INTO machine_tokens (id, organization_id, name, kind, scopes, token_hash, display, created_at) "
        "VALUES (1, 1, 'cli', 'cli', ?, 'h', 'plat_', '2026-10-10')",
        (json.dumps(["compute:connect", "alerts:manage", "knowledge:read"]),),
    )
    db.commit()
    db.close()

    _alembic(db_path, "upgrade", AFTER)
    db = sqlite3.connect(db_path)
    assert _config(db, 1) == {
        "modules": {"godfather": False, "job_webhook": False, "hackathon_webhook": True},
        "godfather": {"pod_image": "a/b:1"},
    }
    assert _config(db, 2)["modules"] == {"job_webhook": False, "hackathon_webhook": False}
    assert _config(db, 3)["modules"] == {"job_webhook": False, "hackathon_webhook": False}
    assert _scopes(db, 1) == ["godfather:connect", "feeds:manage", "knowledge:read"]
    db.close()

    _alembic(db_path, "downgrade", BEFORE)
    db = sqlite3.connect(db_path)
    assert _config(db, 1) == {"modules": {"compute": False, "alerts": True}, "compute": {"pod_image": "a/b:1"}}
    assert _scopes(db, 1) == ["compute:connect", "alerts:manage", "knowledge:read"]
    db.close()


def test_event_webhook_stays_on_only_for_orgs_with_a_webhook(tmp_path):
    db_path = tmp_path / "hooks.db"
    _alembic(db_path, "upgrade", AFTER)
    db = sqlite3.connect(db_path)
    orgs = [
        (1, "SoDA", "soda", "1", json.dumps({"modules": {"points": False}})),
        (2, "Club", "club", "2", None),
    ]
    db.executemany(
        "INSERT INTO organizations (id, name, prefix, guild_id, is_active, config) VALUES (?, ?, ?, ?, 1, ?)", orgs
    )
    db.execute(
        "INSERT INTO webhooks (organization_id, name, kind, url_ciphertext, url_hint, events, enabled, created_at) "
        "VALUES (1, 'ops', 'discord', 'x', 'discord.com', '[]', 1, '2026-10-10')"
    )
    db.commit()
    db.close()

    _alembic(db_path, "upgrade", "e9a1c3d5f7b9")
    db = sqlite3.connect(db_path)
    assert _config(db, 1)["modules"] == {"points": False, "event_webhook": True}
    assert _config(db, 2)["modules"] == {"event_webhook": False}
    db.close()

    _alembic(db_path, "downgrade", AFTER)
    db = sqlite3.connect(db_path)
    assert _config(db, 1)["modules"] == {"points": False}
    db.close()
