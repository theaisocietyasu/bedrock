"""turn off the event_webhook module for existing orgs that have no webhooks

Revision ID: e9a1c3d5f7b9
Revises: d7f9b1c3e5a7
Create Date: 2026-10-10 22:30:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e9a1c3d5f7b9"
down_revision: str | Sequence[str] | None = "d7f9b1c3e5a7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None
# Export Alembic metadata names so static analyzers treat them as intentionally used.
__all__ = ("revision", "down_revision", "branch_labels", "depends_on", "upgrade", "downgrade")

MODULE = "event_webhook"

organizations = sa.table("organizations", sa.column("id", sa.Integer), sa.column("config", sa.JSON))
webhooks = sa.table("webhooks", sa.column("organization_id", sa.Integer))


def upgrade() -> None:
    # An org keeps the module on only when it has a webhook. An unset switch is on.
    bind = op.get_bind()
    used = {org_id for (org_id,) in bind.execute(sa.select(webhooks.c.organization_id)).all()}
    for org_id, config in bind.execute(sa.select(organizations.c.id, organizations.c.config)).all():
        config = dict(config or {})
        modules = dict(config.get("modules") or {})
        modules[MODULE] = org_id in used
        config["modules"] = modules
        bind.execute(organizations.update().where(organizations.c.id == org_id).values(config=config))


def downgrade() -> None:
    bind = op.get_bind()
    for org_id, config in bind.execute(sa.select(organizations.c.id, organizations.c.config)).all():
        config = dict(config or {})
        modules = dict(config.get("modules") or {})
        if modules.pop(MODULE, None) is None:
            continue
        config["modules"] = modules
        bind.execute(organizations.update().where(organizations.c.id == org_id).values(config=config))
