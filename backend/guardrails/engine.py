import math
import time
from dataclasses import dataclass, field
from typing import Optional

from guardrails import injection, pii, toxicity
from guardrails.common import Finding

WITHHELD = "[RESPONSE_WITHHELD: output violated content policy]"


@dataclass
class Evaluation:
    status: str  # allowed | blocked | redacted
    action: str
    risk_score: float
    threats: list[Finding]
    redacted_texts: list[str]
    response: Optional[str] = None
    flagged: bool = False
    output_threats: list[Finding] = field(default_factory=list)


def estimate_tokens(text: str) -> int:
    return max(1, math.ceil(len(text.strip()) / 4)) if text.strip() else 0


def inspect_input(texts: list[str], settings: dict, monitor: bool) -> Evaluation:
    """Settings decide the action: block/redact stop attacks and mask PII; flag (monitor) only reports."""
    action = "flag" if monitor else settings["default_action"]
    threshold = settings["injection_threshold"]
    joined = "\n".join(t for t in texts if t)

    inj_score, inj = injection.scan(joined)
    tox_score, tox = toxicity.scan(joined) if settings["toxicity_filter"] else (0.0, [])
    redacted, pii_findings = [], {}
    for t in texts:
        r, found = pii.redact(t, settings["pii_redaction"])
        redacted.append(r)
        for f in found:
            pii_findings.setdefault(f.category, f)
    pii_list = list(pii_findings.values())

    threats = sorted(inj + tox + pii_list, key=lambda f: f.score, reverse=True)
    risk = round(max([inj_score, tox_score] + [f.score for f in pii_list] + [0.0]), 3)
    attack = inj_score >= threshold or tox_score >= threshold

    if attack and action != "flag":
        status = "blocked"
    elif pii_list and action != "flag":
        status = "redacted"
    else:
        status, redacted = "allowed", list(texts)
    return Evaluation(status=status, action=action, risk_score=risk, threats=threats,
                      redacted_texts=redacted, flagged=bool(threats))


def inspect_output(text: str, settings: dict, action: str) -> tuple[str, list[Finding]]:
    tox_score, tox = toxicity.scan(text) if settings["toxicity_filter"] else (0.0, [])
    if action == "flag":
        return text, tox
    if tox_score >= settings["injection_threshold"]:
        return WITHHELD, tox
    redacted, found = pii.redact(text, settings["pii_redaction"])
    return redacted, tox + found


def simulate_completion(model: str, prompt_tokens: int) -> str:
    # MOCKED upstream: no LLM provider is connected yet.
    return (f"Simulated completion from {model}. Your request passed gateway inspection "
            f"({prompt_tokens} prompt tokens). Upstream model providers are not connected yet.")


def run(texts: list[str], model: str, settings: dict, monitor: bool) -> tuple[Evaluation, int]:
    started = time.perf_counter()
    ev = inspect_input(texts, settings, monitor)
    if ev.status != "blocked":
        raw = simulate_completion(model, estimate_tokens(" ".join(ev.redacted_texts)))
        ev.response, ev.output_threats = inspect_output(raw, settings, ev.action)
    return ev, max(1, round((time.perf_counter() - started) * 1000))
