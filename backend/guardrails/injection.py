import base64
import binascii
import re

from guardrails.common import Finding, combine, scan_rules, severity_for

R = lambda p: re.compile(p, re.I)  # noqa: E731

RULES = [
    (R(r"\b(ignore|disregard|forget|override|skip)\b.{0,30}\b(all|any|the|previous|prior|above|earlier|your)\b.{0,20}\b(instructions?|rules|prompts?|directives|guidelines)"),
     0.9, "instruction_override", "Prompt Injection: Instruction override attempt"),
    (R(r"\babaikan\b.{0,30}\b(instruksi|perintah|aturan)"),
     0.9, "instruction_override_id", "Prompt Injection: Instruction override attempt (ID)"),
    (R(r"\b(reveal|print|show|repeat|output|leak|tell me)\b.{0,30}\b(system prompt|hidden instructions|initial prompt|developer message|your instructions)"),
     0.85, "system_prompt_extraction", "Prompt Injection: System prompt extraction"),
    (R(r"\b(you are now|act as|become)\b.{0,20}\b(dan|unrestricted|jailbroken|uncensored|evil)\b|\bdo anything now\b|\bdan mode\b"),
     0.9, "jailbreak_persona", "Jailbreak: Unrestricted persona (DAN)"),
    (R(r"\b(pretend|roleplay|role-play|imagine|act as)\b.{0,60}\b(no|without|free from|ignore)\b.{0,20}\b(restrictions|rules|filters|limits|guidelines|policies)"),
     0.75, "roleplay_bypass", "Jailbreak: Roleplay restriction bypass"),
    (R(r"\b(developer|god|debug|sudo) mode\b.{0,20}\b(enabled|on|activated)?"),
     0.65, "privileged_mode", "Jailbreak: Privileged mode request"),
    (R(r"\b(bypass|disable|turn off|deactivate|circumvent)\b.{0,20}\b(safety|guardrails?|filters?|content policy|moderation)"),
     0.8, "guardrail_evasion", "Prompt Injection: Guardrail evasion"),
    (R(r"<\|im_start\|>|\[/?(system|inst)\]|###\s*(system|instruction)|\bnew system prompt\b|^system\s*:"),
     0.7, "delimiter_injection", "Prompt Injection: Role delimiter injection"),
    (R(r"\bjailbreak\b"), 0.6, "jailbreak_keyword", "Jailbreak: Keyword detected"),
    (R(r"\b(decode|base64)\b.{0,40}\b(execute|follow|run|obey)\b"),
     0.6, "encoded_instruction", "Prompt Injection: Decode-and-execute request"),
]

B64_TOKEN = re.compile(r"[A-Za-z0-9+/]{16,}={0,2}")


def _decoded_payloads(text: str) -> list[str]:
    out = []
    for token in B64_TOKEN.findall(text):
        try:
            raw = base64.b64decode(token + "=" * (-len(token) % 4), validate=True).decode("utf-8")
        except (binascii.Error, UnicodeDecodeError, ValueError):
            continue
        if raw and sum(c.isprintable() for c in raw) / len(raw) > 0.9:
            out.append(raw)
    return out


def scan(text: str) -> tuple[float, list[Finding]]:
    findings = scan_rules(RULES, text, "prompt_injection")
    for payload in _decoded_payloads(text):
        hidden = scan_rules(RULES, payload, "prompt_injection")
        if hidden:
            findings.append(Finding("prompt_injection", "encoded_payload", "Prompt Injection: Base64-encoded payload",
                                    severity_for(0.85), 0.85, hidden[0].match))
            findings.extend(f for f in hidden if f.category not in {x.category for x in findings})
    return combine([f.score for f in findings]), findings
