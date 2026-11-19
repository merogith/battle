"""Pack the first frame of each bundled battle sprite as lossless WebP.

Run with Python 3 and Pillow (WebP support). The worker uses the index to serve
the same sprite URLs in the compact pack. The source animations stay intact.
"""

import io
import json
import struct
from pathlib import Path

from PIL import Image


def build():
    root = Path(__file__).resolve().parents[1]
    sprites = root / "sprites"
    atlas_path = sprites / "compact-frames.bin"
    frames = {}
    data = bytearray()
    for source in sorted(sprites.glob("gen5ani*/*.gif")):
        with Image.open(source) as animation:
            output = io.BytesIO()
            animation.convert("RGBA").save(output, "WEBP", lossless=True, method=3, exact=True)
        payload = output.getvalue()
        frames[source.relative_to(root).as_posix()] = [len(data), len(payload)]
        data.extend(payload)

    # The header and frames share a file so the cache switches them together.
    index = json.dumps(frames, separators=(",", ":")).encode("utf-8")
    with atlas_path.open("wb") as atlas:
        atlas.write(struct.pack(">I", len(index)))
        atlas.write(index)
        atlas.write(data)
    print(f"Packed {len(frames):,} frames ({atlas_path.stat().st_size / 1048576:.2f} MiB).")


if __name__ == "__main__":
    build()
