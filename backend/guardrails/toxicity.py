import re

from guardrails.common import Finding, combine, scan_rules

R = lambda p: re.compile(p, re.I)  # noqa: E731

RULES = [
    (R(r"\bhow (do i|to|can i)\b.{0,30}\b(kill|murder|poison|stab|strangle)\b.{0,20}\b(someone|a person|people|my|him|her|them)"),
     0.95, "violence", "Policy: Violent harm instructions"),
    (R(r"\b(make|build|assemble|synthesi[sz]e)\b.{0,30}\b(bomb|explosive|pipe bomb|ied|nerve agent|sarin|ricin|napalm)"),
     0.95, "weapons", "Policy: Weapons or explosives synthesis"),
    (R(r"\b(kill myself|end my life|suicide method|best way to die)\b"),
     0.9, "self_harm", "Policy: Self-harm content"),
    (R(r"\b(write|create|generate|code)\b.{0,30}\b(ransomware|keylogger|malware|botnet|ddos script|credential stealer)"),
     0.85, "malware", "Policy: Malware generation request"),
    (R(r"\b(exterminate|eradicate|wipe out|gas)\b.{0,15}\b(all )?(jews|muslims|christians|blacks|whites|immigrants|gays|asians)"),
     0.95, "hate", "Policy: Hateful or genocidal content"),
    (R(r"\b(i will|i'm going to|gonna)\b.{0,15}\b(kill|shoot|hurt|bomb)\b.{0,15}\b(you|him|her|them|everyone)"),
     0.85, "threat", "Policy: Threat of violence"),
]


def scan(text: str) -> tuple[float, list[Finding]]:
    findings = scan_rules(RULES, text, "toxicity")
    return combine([f.score for f in findings]), findings
