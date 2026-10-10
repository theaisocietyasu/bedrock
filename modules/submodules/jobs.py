"""Indexing live submodule query results. Importing this module also loads every submodule and its extractors."""

from core.db import db_connect
from core.jobs import job
from modules.knowledge import embedder
from modules.submodules import service


@job("submodules.index_result", audit=False)
def index_result(org_id: int, org_prefix: str, submodule: str, query_key: str, url: str, text: str) -> None:
    """Write a live query result into the org's knowledge after the caller has its answer."""
    db = db_connect.SessionLocal()
    try:
        service.index_result(db, org_id, org_prefix, submodule, query_key, url, text, embedder.for_org(db, org_id))
    finally:
        db.close()
