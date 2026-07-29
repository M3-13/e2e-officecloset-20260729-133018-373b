import io
import os
import tempfile

import pytest
from fastapi import UploadFile

from image_utils import (
    ALLOWED_TYPES,
    UPLOAD_MAX_SIZE,
    check_file_size,
    generate_filename,
    strip_exif,
    validate_image,
)


def _make_upload_file(content: bytes, content_type: str, filename: str = "test") -> UploadFile:
    return UploadFile(
        filename=filename,
        file=io.BytesIO(content),
        headers={"content-type": content_type},
    )


class TestAllowedTypes:
    def test_contains_jpeg_png_webp(self):
        assert "image/jpeg" in ALLOWED_TYPES
        assert "image/png" in ALLOWED_TYPES
        assert "image/webp" in ALLOWED_TYPES

    def test_is_a_set(self):
        assert isinstance(ALLOWED_TYPES, set)


class TestGenerateFilename:
    def test_returns_different_names_for_same_input(self):
        names = {generate_filename("photo.jpg") for _ in range(10)}
        assert len(names) == 10

    def test_preserves_lowercase_extension(self):
        result = generate_filename("image.PNG")
        assert result.endswith(".png")

    def test_adds_jpg_extension_when_none(self):
        result = generate_filename("noext")
        assert result.endswith(".jpg")
        assert result.count(".") == 1

    def test_result_is_hex_string_with_extension(self):
        result = generate_filename("test.jpeg")
        base, ext = os.path.splitext(result)
        assert ext == ".jpeg"
        assert all(c in "0123456789abcdef" for c in base)
        assert len(base) == 32


class TestValidateImage:
    @pytest.mark.asyncio
    async def test_valid_jpeg_passes(self):
        content = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00"
        file = _make_upload_file(content, "image/jpeg")
        result = await validate_image(file)
        assert result is True

    @pytest.mark.asyncio
    async def test_valid_png_passes(self):
        content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
        file = _make_upload_file(content, "image/png")
        result = await validate_image(file)
        assert result is True

    @pytest.mark.asyncio
    async def test_valid_webp_passes(self):
        content = b"RIFF\x00\x00\x00\x00WEBP"
        file = _make_upload_file(content, "image/webp")
        result = await validate_image(file)
        assert result is True

    @pytest.mark.asyncio
    async def test_invalid_content_type_fails(self):
        content = b"\xff\xd8\xff"
        file = _make_upload_file(content, "image/gif")
        result = await validate_image(file)
        assert result is False

    @pytest.mark.asyncio
    async def test_wrong_magic_bytes_for_content_type_fails(self):
        content = b"\x89PNG\r\n\x1a\n"
        file = _make_upload_file(content, "image/jpeg")
        result = await validate_image(file)
        assert result is False

    @pytest.mark.asyncio
    async def test_empty_file_fails(self):
        file = _make_upload_file(b"", "image/jpeg")
        result = await validate_image(file)
        assert result is False

    @pytest.mark.asyncio
    async def test_webp_without_webp_marker_fails(self):
        content = b"RIFF\x00\x00\x00\x00XXXX"
        file = _make_upload_file(content, "image/webp")
        result = await validate_image(file)
        assert result is False

    @pytest.mark.asyncio
    async def test_seek_reset_after_validate(self):
        content = b"\xff\xd8\xff\xe0\x00\x10JFIF"
        file = _make_upload_file(content, "image/jpeg")
        await validate_image(file)
        after = await file.read()
        assert after == content


class TestCheckFileSize:
    @pytest.mark.asyncio
    async def test_small_file_passes(self):
        content = b"x" * 100
        file = _make_upload_file(content, "image/jpeg")
        result = await check_file_size(file)
        assert result is True

    @pytest.mark.asyncio
    async def test_exactly_max_size_passes(self):
        content = b"x" * UPLOAD_MAX_SIZE
        file = _make_upload_file(content, "image/jpeg")
        result = await check_file_size(file)
        assert result is True

    @pytest.mark.asyncio
    async def test_over_max_size_fails(self):
        content = b"x" * (UPLOAD_MAX_SIZE + 1)
        file = _make_upload_file(content, "image/jpeg")
        result = await check_file_size(file)
        assert result is False

    @pytest.mark.asyncio
    async def test_seek_reset_after_check(self):
        content = b"\xff\xd8\xff" + b"\x00" * 100
        file = _make_upload_file(content, "image/jpeg")
        await check_file_size(file)
        after = await file.read()
        assert after == content


class TestStripExif:
    def test_strips_exif_from_jpeg(self):
        from PIL import Image

        img = Image.new("RGB", (10, 10), color="red")
        buf = io.BytesIO()
        img.save(buf, format="JPEG", exif=b"Fake EXIF data here")
        buf.seek(0)

        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            tmp.write(buf.read())
            tmp_path = tmp.name

        try:
            strip_exif(tmp_path)
            cleaned = Image.open(tmp_path)
            try:
                exif = cleaned.getexif()
                assert len(exif) == 0
                assert cleaned.size == (10, 10)
            finally:
                cleaned.close()
        finally:
            os.unlink(tmp_path)

    def test_strips_exif_from_png(self):
        from PIL import Image

        img = Image.new("RGB", (20, 20), color="blue")
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            img.save(tmp, format="PNG")
            tmp_path = tmp.name

        try:
            original = Image.open(tmp_path)
            try:
                assert original.size == (20, 20)
            finally:
                original.close()
            strip_exif(tmp_path)
            cleaned = Image.open(tmp_path)
            try:
                assert cleaned.size == (20, 20)
            finally:
                cleaned.close()
        finally:
            os.unlink(tmp_path)

    def test_does_not_raise_on_nonexistent_file(self):
        with pytest.raises(FileNotFoundError):
            strip_exif("/nonexistent/path/image.jpg")
