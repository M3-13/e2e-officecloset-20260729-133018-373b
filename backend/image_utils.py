import io
import os
import uuid

from fastapi import UploadFile
from PIL import Image

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}

UPLOAD_MAX_SIZE = 10 * 1024 * 1024

MAGIC_BYTES = {
    "image/jpeg": b"\xff\xd8\xff",
    "image/png": b"\x89PNG\r\n\x1a\n",
    "image/webp": b"RIFF",
}


def _check_webp_header(header: bytes) -> bool:
    return len(header) >= 12 and header[0:4] == b"RIFF" and header[8:12] == b"WEBP"


async def validate_image(file: UploadFile) -> bool:
    if file.content_type not in ALLOWED_TYPES:
        return False

    header = await file.read(12)
    await file.seek(0)
    if file.content_type == "image/webp":
        return _check_webp_header(header)
    expected = MAGIC_BYTES.get(file.content_type, b"")
    return header.startswith(expected)


async def check_file_size(file: UploadFile) -> bool:
    contents = await file.read()
    await file.seek(0)
    return len(contents) <= UPLOAD_MAX_SIZE


def strip_exif(file_path: str) -> None:
    img = Image.open(file_path)
    fmt = img.format or "JPEG"
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    img.close()
    buf.seek(0)
    with open(file_path, "wb") as f:
        f.write(buf.read())


def generate_filename(original_name: str) -> str:
    _, ext = os.path.splitext(original_name)
    if not ext:
        ext = ".jpg"
    return f"{uuid.uuid4().hex}{ext.lower()}"
