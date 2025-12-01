from __future__ import annotations

from ckan.logic.schema import validator_args
from ckan import types


@validator_args
def get_preview_schema(
    ignore_empty,
    unicode_safe,
    url_validator,
) -> types.Schema:
    return {
        "file_url": [ignore_empty, unicode_safe, url_validator],
    }
