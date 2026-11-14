from pathlib import Path


class AudioCache:
    def __init__(self, root: str | Path) -> None:
        self._root = Path(root)

    def get(self, key: str) -> bytes | None:
        path = self._root / key
        return path.read_bytes() if path.exists() else None

    def put(self, key: str, content: bytes) -> None:
        path = self._root / key
        path.parent.mkdir(parents=True, exist_ok=True)
        partial = path.with_name(f"{path.name}.partial")
        partial.write_bytes(content)
        partial.replace(path)
