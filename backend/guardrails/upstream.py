import os
from typing import Optional

import httpx

PLACEHOLDER = "PLACEHOLDER"


def _config() -> Optional[dict]:
    base, key, model = (os.environ.get(k, "").strip() for k in ("LLM_BASE_URL", "LLM_API_KEY", "LLM_MODEL"))
    if not (base and key and model):
        return None
    return {"base": base.rstrip("/"), "key": key, "model": model,
            "timeout": float(os.environ.get("LLM_TIMEOUT_SECONDS") or 30)}


def provider_name() -> str:
    return "openai-compatible" if _config() else PLACEHOLDER


async def complete(messages: list[dict], model: str) -> str:
    """OpenAI-compatible /chat/completions. Without LLM_* env vars, returns a PLACEHOLDER reply."""
    cfg = _config()
    if cfg is None:
        return (f"[PLACEHOLDER] Simulated completion for {model}. Your request passed gateway inspection. "
                "Set LLM_BASE_URL, LLM_API_KEY and LLM_MODEL to connect an OpenAI-compatible provider.")
    async with httpx.AsyncClient(timeout=cfg["timeout"]) as client:
        res = await client.post(
            f"{cfg['base']}/chat/completions",
            headers={"Authorization": f"Bearer {cfg['key']}"},
            json={"model": cfg["model"], "messages": messages},
        )
    res.raise_for_status()
    return res.json()["choices"][0]["message"]["content"] or ""
