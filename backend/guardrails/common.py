import re
import unicodedata
from dataclasses import asdict, dataclass

ZERO_WIDTH = re.compile(r"[\u200b-\u200f\u2060\ufeff]")
LEET = str.maketrans({"0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s"})


@dataclass
class Finding:
    type: str
    category: str
    rule: str
    severity: str
    score: float
    match: str

    def dict(self) -> dict:
        return asdict(self)


def normalize(text: str) -> str:
    text = ZERO_WIDTH.sub("", unicodedata.normalize("NFKC", text))
    return re.sub(r"\s+", " ", text).strip().lower()


def severity_for(score: float) -> str:
    if score >= 0.9:
        return "critical"
    if score >= 0.7:
        return "high"
    if score >= 0.4:
        return "medium"
    return "low"


def combine(scores: list[float]) -> float:
    """Noisy-OR: independent signals reinforce each other without exceeding 1."""
    remaining = 1.0
    for s in scores:
        remaining *= 1 - s
    return round(min(1 - remaining, 0.99), 3)


def scan_rules(rules: list, text: str, kind: str) -> list[Finding]:
    variants = {normalize(text)}
    variants.add(next(iter(variants)).translate(LEET))
    findings = {}
    for pattern, weight, category, rule in rules:
        for v in variants:
            m = pattern.search(v)
            if m and category not in findings:
                findings[category] = Finding(kind, category, rule, severity_for(weight), weight, m.group(0)[:80])
    return list(findings.values())
