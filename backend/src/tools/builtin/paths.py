"""文件类工具共用的路径校验与参数取值。设计文档：04_tools/01_tool_system.md §11。"""

from __future__ import annotations

from collections.abc import Mapping
from pathlib import Path
from typing import Any, Final

from agent_runtime.core import CoreError

_SAFE_DEVICES: Final = frozenset(
    {"/dev/null", "/dev/stdout", "/dev/stderr", "/dev/zero", "/dev/tty"}
)
_FORBIDDEN_PREFIXES: Final[tuple[Path, ...]] = (
    Path("/boot"),
    Path("/sys"),
    Path("/proc"),
    Path("/dev"),
)
_FORBIDDEN_EXACT: Final[frozenset[Path]] = frozenset(
    {
        Path("/etc/shadow"),
        Path("/etc/gshadow"),
        Path("/etc/sudoers"),
        Path("/etc/sudoers.d"),
    }
)


class PathEscapeError(CoreError):
    """路径指向受保护的禁区，或根本不是一个可用的路径。"""


def _is_forbidden(resolved: Path) -> bool:
    if str(resolved) in _SAFE_DEVICES:
        return False
    for exact in _FORBIDDEN_EXACT:
        if resolved == exact or resolved.is_relative_to(exact):
            return True
    for prefix in _FORBIDDEN_PREFIXES:
        if resolved == prefix or resolved.is_relative_to(prefix):
            return True
    return False


def resolve_within_root(root: Path, raw: str) -> Path:
    """相对路径按工作区根解释，绝对路径按系统绝对路径展开。

    对核心受保护禁区（/boot、/sys、/proc、/dev、/etc/shadow 等）保持拦截，
    非禁区路径（包括工作区与常规生产配置路径如 /etc、/var/log、/tmp）均放行。
    """
    if not raw.strip():
        raise PathEscapeError("路径不能为空")
    if "\x00" in raw:
        raise PathEscapeError("路径不可用：含有空字符")
    candidate = Path(raw).expanduser()
    base = root.resolve()
    try:
        resolved = (candidate if candidate.is_absolute() else (base / candidate)).resolve()
    except (ValueError, OSError, RuntimeError) as exc:  # NUL 字节、符号链接环
        raise PathEscapeError(f"路径不可用：{exc}") from exc
    if _is_forbidden(resolved):
        raise PathEscapeError(f"禁止访问系统核心受保护路径: {resolved}")
    return resolved


def text_arg(args: Mapping[str, Any], key: str) -> str | None:
    value = args.get(key)
    return value if isinstance(value, str) else None


def int_arg(args: Mapping[str, Any], key: str) -> int | None:
    """缺省为 None；布尔与小数不算整数，抛 ``ValueError`` 让调用方转成失败观察值。"""
    value = args.get(key)
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValueError(f"{key} 必须是整数")
    return value
