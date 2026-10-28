import re

from guardrails.common import Finding

SECRET_PATTERNS = [
    re.compile(r"\bsk-gw-(live|test)-[a-f0-9]{16,}\b"),
    re.compile(r"\bsk-(proj-)?[A-Za-z0-9_-]{20,}\b"),
    re.compile(r"\b(ghp|gho|ghs|ghu)_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{30,}\b"),
    re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}\b"),
    re.compile(r"\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b"),
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(-----END [A-Z ]*PRIVATE KEY-----|$)"),
    re.compile(r"(?i)\b(password|passwd|pwd|secret|api[_-]?key|access[_-]?token)\s*[:=]\s*\S{4,}"),
]
EMAIL = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
CARD = re.compile(r"\b(?:\d[ -]?){12,18}\d\b")
SSN = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
NIK = re.compile(r"\b\d{16}\b")
PHONE = re.compile(r"(?<![\w+])(?:\+\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,5}(?!\w)")


def _luhn(digits: str) -> bool:
    total, parity = 0, len(digits) % 2
    for i, ch in enumerate(digits):
        d = int(ch)
        if i % 2 == parity:
            d = d * 2 - 9 if d > 4 else d * 2
        total += d
    return total % 10 == 0


def _mask(value: str) -> str:
    v = value.strip()
    return f"{v[:2]}***{v[-2:]}" if len(v) > 6 else "***"


def _is_card(m: re.Match) -> bool:
    digits = re.sub(r"\D", "", m.group(0))
    return 13 <= len(digits) <= 19 and _luhn(digits)


def _is_phone(m: re.Match) -> bool:
    return 9 <= len(re.sub(r"\D", "", m.group(0))) <= 15


# (toggle, category, placeholder, rule, severity, score, patterns, validator)
DETECTORS = [
    ("secrets", "secret", "[REDACTED_SECRET]", "PII Guard: Credential or secret token", "high", 0.8, SECRET_PATTERNS, None),
    ("email", "email", "[REDACTED_EMAIL]", "PII Guard: Email address", "medium", 0.5, [EMAIL], None),
    ("creditCard", "credit_card", "[REDACTED_CARD]", "PII Guard: Credit card number", "high", 0.7, [CARD], _is_card),
    ("nationalId", "ssn", "[REDACTED_PII]", "PII Guard: US Social Security Number", "high", 0.7, [SSN], None),
    ("nationalId", "nik", "[REDACTED_PII]", "PII Guard: National ID (NIK)", "high", 0.7, [NIK], None),
    ("phone", "phone", "[REDACTED_PHONE]", "PII Guard: Phone number", "medium", 0.5, [PHONE], _is_phone),
]


def redact(text: str, toggles: dict) -> tuple[str, list[Finding]]:
    """Order matters: secrets and cards are masked before the looser phone pattern runs."""
    findings: dict[str, Finding] = {}
    counts: dict[str, int] = {}
    for toggle, category, placeholder, rule, severity, score, patterns, validator in DETECTORS:
        if not toggles.get(toggle, True):
            continue

        def sub(m: re.Match) -> str:
            if validator and not validator(m):
                return m.group(0)
            counts[category] = counts.get(category, 0) + 1
            findings.setdefault(category, Finding("pii", category, rule, severity, score, _mask(m.group(0))))
            return placeholder

        for pattern in patterns:
            text = pattern.sub(sub, text)
    for category, f in findings.items():
        if counts[category] > 1:
            f.rule = f"{f.rule} (x{counts[category]})"
    return text, list(findings.values())
