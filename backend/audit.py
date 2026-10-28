from datetime import datetime, timezone
from typing import Optional

from guardrails import pii
from guardrails.engine import Evaluation
from schemas import PiiToggles, SecurityLogInDB

SNIPPET_LEN = 120
SEVERITY_RANK = {"low": 0, "medium": 1, "high": 2, "critical": 3}
# Snippets are always fully PII-masked, regardless of workspace toggles.
ALL_PII = PiiToggles().model_dump()


def _outcome(ev: Evaluation) -> tuple[str, str, int]:
    if ev.status == "blocked":
        return "blocked", "block", 403
    if ev.status == "redacted":
        return "flagged", "redact", 200
    if ev.flagged:
        return "flagged", "flag", 200
    return "clean", "allow", 200


def _snippet(text: str) -> str:
    masked, _ = pii.redact(" ".join(text.split()), ALL_PII)
    return masked if len(masked) <= SNIPPET_LEN else masked[: SNIPPET_LEN - 3] + "..."


async def record_log(db, *, ev: Evaluation, request_id: str, workspace_id: str, user_id: str, key_id: Optional[str],
                     key_name: str, endpoint: str, model: str, prompt: str, latency_ms: int, tokens: int) -> None:
    """Append-only audit entry; there is no update or delete path for security_logs."""
    status, action, http_status = _outcome(ev)
    threats = ev.threats + ev.output_threats
    top = max(threats, key=lambda f: (SEVERITY_RANK[f.severity], f.score)) if threats else None
    log = SecurityLogInDB(
        id=request_id, workspace_id=workspace_id, user_id=user_id, key_id=key_id, key_name=key_name,
        timestamp=datetime.now(timezone.utc), endpoint=endpoint, model=model, prompt_snippet=_snippet(prompt),
        threat_type=top.type if top else None, rule=top.rule if top else None,
        severity=top.severity if top else "low", action=action, status=status, http_status=http_status,
        latency_ms=latency_ms, tokens=0 if status == "blocked" else tokens,
    )
    await db.security_logs.insert_one(log.model_dump())
