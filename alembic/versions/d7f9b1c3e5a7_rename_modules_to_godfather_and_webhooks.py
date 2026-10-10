"""rename the compute module to godfather, split alerts into the webhook modules, and make mcp core

Revision ID: d7f9b1c3e5a7
Revises: 70625e187487
Create Date: 2026-10-10 22:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d7f9b1c3e5a7"
down_revision: str | Sequence[str] | None = "70625e187487"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None
# Export Alembic metadata names so static analyzers treat them as intentionally used.
__all__ = ("revision", "down_revision", "branch_labels", "depends_on", "upgrade", "downgrade")

# Each webhook module and the feed kind it runs
FEED_MODULES = {"job_webhook": "github_jobs", "hackathon_webhook": "hackathons"}
# Old scope prefix to new scope prefix
SCOPES = {"compute:": "godfather:", "alerts:": "feeds:"}

organizations = sa.table("organizations", sa.column("id", sa.Integer), sa.column("config", sa.JSON))
machine_tokens = sa.table("machine_tokens", sa.column("id", sa.Integer), sa.column("scopes", sa.JSON))
alert_feeds = sa.table("alert_feeds", sa.column("organization_id", sa.Integer), sa.column("kind", sa.String))


def _rename(config: dict, old: str, new: str) -> None:
    if old in config:
        config[new] = config.pop(old)


def _scopes(scopes: list, mapping: dict[str, str]) -> list:
    renamed = []
    for scope in scopes:
        for old, new in mapping.items():
            if isinstance(scope, str) and scope.startswith(old):
                scope = new + scope[len(old) :]
        renamed.append(scope)
    return renamed


def _update_tokens(bind, mapping: dict[str, str]) -> None:
    for token_id, scopes in bind.execute(sa.select(machine_tokens.c.id, machine_tokens.c.scopes)).all():
        renamed = _scopes(list(scopes or []), mapping)
        if renamed != list(scopes or []):
            bind.execute(machine_tokens.update().where(machine_tokens.c.id == token_id).values(scopes=renamed))


def upgrade() -> None:
    # An org keeps a webhook module on only when it had alerts on and has a feed of that module's kind.
    bind = op.get_bind()
    kinds: dict[int, set[str]] = {}
    for org_id, kind in bind.execute(sa.select(alert_feeds.c.organization_id, alert_feeds.c.kind)).all():
        kinds.setdefault(org_id, set()).add(kind)
    for org_id, config in bind.execute(sa.select(organizations.c.id, organizations.c.config)).all():
        config = dict(config or {})
        modules = dict(config.get("modules") or {})
        _rename(modules, "compute", "godfather")
        alerts_on = modules.pop("alerts", True) is not False
        for module, kind in FEED_MODULES.items():
            modules[module] = alerts_on and kind in kinds.get(org_id, set())
        modules.pop("mcp", None)
        config["modules"] = modules
        _rename(config, "compute", "godfather")
        bind.execute(organizations.update().where(organizations.c.id == org_id).values(config=config))
    _update_tokens(bind, SCOPES)


def downgrade() -> None:
    bind = op.get_bind()
    for org_id, config in bind.execute(sa.select(organizations.c.id, organizations.c.config)).all():
        config = dict(config or {})
        modules = dict(config.get("modules") or {})
        _rename(modules, "godfather", "compute")
        on = [modules.pop(module, True) is not False for module in FEED_MODULES]
        modules["alerts"] = any(on)
        config["modules"] = modules
        _rename(config, "godfather", "compute")
        bind.execute(organizations.update().where(organizations.c.id == org_id).values(config=config))
    _update_tokens(bind, {new: old for old, new in SCOPES.items()})
