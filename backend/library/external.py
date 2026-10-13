import requests

TIMEOUT_SECONDS = 5


class ExternalLookupError(Exception):
    """Every external source was unreachable."""


def _from_open_library(isbn):
    key = f"ISBN:{isbn}"
    response = requests.get(
        "https://openlibrary.org/api/books",
        params={"bibkeys": key, "format": "json", "jscmd": "data"},
        timeout=TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    item = response.json().get(key)
    if not item:
        return None
    return {
        "title": item.get("title", ""),
        "author": ", ".join(a["name"] for a in item.get("authors", [])),
        "publisher": ", ".join(p["name"] for p in item.get("publishers", [])),
        "cover": item.get("cover", {}).get("medium", ""),
    }


SOURCES = [_from_open_library]


def fetch_by_isbn(isbn):
    failures = 0
    for source in SOURCES:
        try:
            result = source(isbn)
        except (requests.RequestException, ValueError):
            failures += 1
            continue
        if result and result["title"]:
            return result
    if failures == len(SOURCES):
        raise ExternalLookupError("No book source could be reached.")
    return None
