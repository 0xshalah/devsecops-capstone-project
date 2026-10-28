from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from db import db
from guardrails.engine import Evaluation, estimate_tokens, run
from ids import new_id
from schemas import (ApiKeyContext, CurrentUser, EvaluationResponse, GatewayCompletionRequest, GatewaySettingsInDB,
                     PlaygroundEvaluateRequest, ThreatSchema, TokenUsage)
from security import require_roles, verify_api_key_scope

router = APIRouter(tags=["gateway"])
CONSOLE_ROLES = ["Owner", "Admin", "Member", "Viewer"]
HTTP_STATUS = {"blocked": 403, "redacted": 200, "allowed": 200}


async def load_settings(workspace_id: str) -> dict:
    doc = await db.gateway_settings.find_one({"workspace_id": workspace_id}, {"_id": 0})
    if not doc:
        doc = {"workspace_id": workspace_id, "user_id": "", "updated_at": datetime.now(timezone.utc)}
    return GatewaySettingsInDB(**doc).model_dump()


def _response(ev: Evaluation, latency: int, model: str, prompt_text: str) -> EvaluationResponse:
    prompt_tokens = estimate_tokens(prompt_text)
    completion_tokens = estimate_tokens(ev.response or "")
    return EvaluationResponse(
        requestId=new_id("req"), model=model, status=ev.status, httpStatus=HTTP_STATUS[ev.status], action=ev.action,
        flagged=ev.flagged, riskScore=ev.risk_score,
        detectedThreats=[ThreatSchema(**f.dict()) for f in ev.threats],
        outputThreats=[ThreatSchema(**f.dict()) for f in ev.output_threats],
        redactedPrompt=ev.redacted_texts[-1], response=ev.response, latencyMs=latency,
        tokens=TokenUsage(prompt=prompt_tokens, completion=completion_tokens, total=prompt_tokens + completion_tokens),
    )


@router.post("/playground/evaluate", response_model=EvaluationResponse)
async def playground_evaluate(body: PlaygroundEvaluateRequest, user: CurrentUser = Depends(require_roles(CONSOLE_ROLES))):
    settings = await load_settings(user.workspace_id)
    texts = [body.system, body.prompt]
    ev, latency = run(texts, body.model, settings, monitor=not body.strict)
    return _response(ev, latency, body.model, " ".join(texts))


@router.post("/gateway/completions", response_model=EvaluationResponse)
async def gateway_completions(body: GatewayCompletionRequest, key: ApiKeyContext = Depends(verify_api_key_scope("chat:write"))):
    settings = await load_settings(key.workspace_id)
    texts = [m.content for m in body.messages]
    ev, latency = run(texts, body.model, settings, monitor=False)
    result = _response(ev, latency, body.model, " ".join(texts))
    return JSONResponse(status_code=result.httpStatus, content=result.model_dump(mode="json"))
