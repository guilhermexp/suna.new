import pytest
from core.tools.sb_browser_tool import SandboxBrowserTool
from PIL import Image
import io
import base64


def _make_tool():
    return SandboxBrowserTool(project_id="proj", thread_id="thr", thread_manager=None)


@pytest.mark.unit
def test_validate_base64_image_valid_png():
    tool = _make_tool()
    img = Image.new("RGBA", (2, 2), (255, 0, 0, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    png_base64 = base64.b64encode(buf.getvalue()).decode("ascii")
    ok, msg = tool._validate_base64_image(png_base64)
    assert ok is True


@pytest.mark.unit
def test_validate_base64_image_too_short():
    tool = _make_tool()
    ok, msg = tool._validate_base64_image("short")
    assert ok is False


@pytest.mark.unit
def test_validate_base64_image_not_image():
    tool = _make_tool()
    text_b64 = "aGVsbG8="
    ok, msg = tool._validate_base64_image(text_b64)
    assert ok is False