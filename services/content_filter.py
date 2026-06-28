from __future__ import annotations

import re

from curl_cffi import requests
from fastapi import HTTPException

from services.config import config
from services.proxy_service import proxy_settings
from utils.log import logger


DEFAULT_REVIEW_PROMPT = "判断用户请求是否允许。只回答 ALLOW 或 REJECT。"
_BASE64_DATA_URI = re.compile(r"data:[\w/.+;-]+;base64,[A-Za-z0-9+/=]+")
_MAX_REVIEW_TEXT_LEN = 100_000
_TRUNCATION_MARKER = "\n...[truncated]...\n"


def _text(value: object) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return "\n".join(_text(item) for item in value)
    if isinstance(value, dict):
        return "\n".join(
            _text(value.get(key))
            for key in ("text", "input_text", "content", "input", "instructions", "system", "prompt", "messages")
        )
    return ""


def request_text(*values: object) -> str:
    return "\n".join(part for value in values if (part := _text(value).strip()))


def request_shape(*values: object) -> dict[str, int]:
    stats = {
        "input_image_parts": 0,
        "image_url_parts": 0,
        "data_url_images": 0,
        "remote_image_urls": 0,
        "literal_image_placeholders": 0,
    }

    def walk(value: object, key: str = "") -> None:
        if isinstance(value, str):
            text = value.strip().lower()
            if "<image>" in text:
                stats["literal_image_placeholders"] += 1
            if text.startswith("data:image/"):
                stats["data_url_images"] += 1
            elif key in {"image_url", "url"} and text.startswith(("http://", "https://")):
                stats["remote_image_urls"] += 1
            return
        if isinstance(value, list):
            for item in value:
                walk(item, key)
            return
        if not isinstance(value, dict):
            return
        item_type = str(value.get("type") or "").strip()
        if item_type == "input_image":
            stats["input_image_parts"] += 1
        elif item_type == "image_url":
            stats["image_url_parts"] += 1
        for child_key, child in value.items():
            walk(child, str(child_key))

    for value in values:
        walk(value)
    return {key: value for key, value in stats.items() if value}


def _sanitize_for_review(text: str) -> tuple[str, dict[str, int]]:
    sanitized, base64_blocks_stripped = _BASE64_DATA_URI.subn("[image]", text)
    truncated_chars = 0
    if len(sanitized) > _MAX_REVIEW_TEXT_LEN:
        half = (_MAX_REVIEW_TEXT_LEN - len(_TRUNCATION_MARKER)) // 2
        truncated_chars = len(sanitized) - 2 * half
        sanitized = sanitized[:half] + _TRUNCATION_MARKER + sanitized[-half:]
    return sanitized, {
        "base64_blocks_stripped": base64_blocks_stripped,
        "truncated_chars": truncated_chars,
    }


def _extract_review_decision(data: object) -> str | None:
    if not isinstance(data, dict):
        return None
    choices = data.get("choices")
    if not isinstance(choices, list) or not choices:
        return None
    first = choices[0]
    if not isinstance(first, dict):
        return None
    message = first.get("message")
    if not isinstance(message, dict):
        return None
    content = message.get("content")
    return str(content).strip().lower() if content is not None else None


def _is_allow_decision(decision: str) -> bool:
    return decision.startswith(("allow", "pass", "true", "yes", "通过", "允许", "安全"))


def _is_reject_decision(decision: str) -> bool:
    return decision.startswith(("reject", "deny", "block", "false", "no", "拒绝", "不允许", "违规", "禁止"))


def _resolve_fail_open(review: dict[str, object]) -> bool:
    value = review.get("fail_open")
    if value is None:
        return True
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "on"}
    return bool(value)


def check_request(text: str) -> None:
    text = str(text or "")
    if not text.strip():
        return

    for word in config.sensitive_words:
        if word and word in text:
            raise HTTPException(status_code=400, detail={"error": "检测到敏感词，拒绝本次任务"})

    review = config.ai_review
    if not review.get("enabled"):
        return
    base_url = str(review.get("base_url") or "").strip().rstrip("/")
    api_key = str(review.get("api_key") or "").strip()
    model = str(review.get("model") or "").strip()
    if not base_url or not api_key or not model:
        raise HTTPException(status_code=400, detail={"error": "ai review config is incomplete"})

    fail_open = _resolve_fail_open(review)
    review_text, sanitize_stats = _sanitize_for_review(text)
    if sanitize_stats["base64_blocks_stripped"] or sanitize_stats["truncated_chars"]:
        logger.info({
            "event": "ai_review_text_sanitized",
            "original_text_len": len(text),
            "review_text_len": len(review_text),
            **sanitize_stats,
        })

    prompt = str(review.get("prompt") or DEFAULT_REVIEW_PROMPT).strip()
    content = f"{prompt}\n\n用户请求:\n{review_text}\n\n只回答 ALLOW 或 REJECT。"

    def on_failure(event_payload: dict[str, object]) -> None:
        logger.warning(event_payload)
        if not fail_open:
            raise HTTPException(status_code=503, detail={"error": "AI 审核服务暂时不可用，请稍后重试"})

    try:
        response = requests.post(
            f"{base_url}/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"model": model, "messages": [{"role": "user", "content": content}], "temperature": 0},
            timeout=60,
            **proxy_settings.build_session_kwargs(),
        )
    except Exception as exc:
        on_failure({"event": "ai_review_request_failed", "error": str(exc), "error_type": exc.__class__.__name__})
        return

    try:
        data = response.json()
    except Exception as exc:
        on_failure({
            "event": "ai_review_response_not_json",
            "status_code": response.status_code,
            "body_preview": str(response.text or "")[:200],
            "error": str(exc),
        })
        return

    decision = _extract_review_decision(data)
    if decision is None:
        on_failure({
            "event": "ai_review_malformed_response",
            "status_code": response.status_code,
            "body_preview": str(data)[:300],
        })
        return
    if _is_allow_decision(decision):
        return
    if _is_reject_decision(decision):
        raise HTTPException(status_code=400, detail={"error": "AI 审核未通过，拒绝本次任务"})
    on_failure({"event": "ai_review_ambiguous_decision", "decision": decision[:100]})
