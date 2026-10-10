"""Live submodule query tool."""

from functools import partial

from core.tools import tool as _tool
from modules.submodules import catalog, service

# Every tool here needs the knowledge module on for the caller's org
tool = partial(_tool, module="knowledge")

_LIST = "\n".join(
    f"- {submodule.name}/{q.key}: {q.description} Params: "
    + (", ".join(f"{p.name}{' (required)' if p.required else ''}" for p in q.params) or "none")
    for submodule in catalog.SUBMODULES.values()
    for q in submodule.queries
)


@tool(
    "submodules.query",
    description="Ask a live source of a submodule and get the text it returns with the URL to cite. "
    "Sources, as submodule/source:\n" + _LIST,
    scope="knowledge:read",
    input_schema={
        "type": "object",
        "properties": {
            "submodule": {"enum": sorted(name for name, submodule in catalog.SUBMODULES.items() if submodule.queries)},
            "source": {"type": "string", "maxLength": 100},
            "params": {"type": "object", "additionalProperties": {"type": "string", "maxLength": 500}},
        },
        "required": ["submodule", "source"],
        "additionalProperties": False,
    },
)
def submodules_query(db, org, caller, submodule: str, source: str, params: dict | None = None):
    return service.query(db, int(org.id), str(org.prefix), submodule, source, params or {})
