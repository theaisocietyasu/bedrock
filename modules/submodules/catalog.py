"""The submodules in the submodules/ folder, loaded once per process. No Flask here.

Each folder in submodules/ is one submodule. Its __init__.py sets SUBMODULE to a modules.submodules.types.Submodule. Loading a
submodule registers the extractors of its crawled sources with knowledge as <submodule>.<source key>.
"""

import importlib
import pkgutil

import submodules as submodules_folder
from modules.knowledge import extract
from modules.submodules.types import Submodule

SUBMODULES: dict[str, Submodule] = {}


def _load() -> None:
    for info in sorted(pkgutil.iter_modules(submodules_folder.__path__), key=lambda i: i.name):
        if not info.ispkg or info.name.startswith("_"):
            continue
        submodule = getattr(importlib.import_module(f"submodules.{info.name}"), "SUBMODULE", None)
        if not isinstance(submodule, Submodule):
            raise ValueError(f"submodules/{info.name}/__init__.py must set SUBMODULE to a Submodule")
        if submodule.name != info.name:
            raise ValueError(f"submodules/{info.name} sets SUBMODULE.name to {submodule.name}; use the folder name")
        SUBMODULES[submodule.name] = submodule
        for source in submodule.sources:
            name = submodule.extractor_name(source)
            if name is not None and source.extractor is not None:
                extract.register(name, source.extractor)


def get(name: object) -> Submodule | None:
    return SUBMODULES.get(name) if isinstance(name, str) else None


_load()
