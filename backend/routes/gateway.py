from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from audit import record_log
from db import db
from guardrails import upstream
from guardrails.engine import Evaluation, estimate_tokens, run
from ids import new_id
from observability import record_evaluation
from ratelimit import enforce
from routes.settings import ensure_settings
from schemas import (ApiKeyContext, CurrentUser, EvaluationResponse, GatewayCompletionRequest, GatewaySettingsInDB,
                     PlaygroundEvaluateRequest, ThreatSchema, TokenUsage)
from security import require_roles, verify_api_key_scope

router = APIRouter(tags=["gateway"])
CONSOLE_ROLES = ["Owner", "Admin", "Member", "Viewer"]
HTTP_STATUS = {"blocked": 403, "redacted": 200, "allowed": 200}
AUTO_ROUTE = "nexus-fast-v1"  # "auto" resolves to the lowest-latency route
COMPLETIONS_PATH = "/v1/chat/completions"


async def load_settings(workspace_id: str, user_id: str) -> dict:
    return GatewaySettingsInDB(**await ensure_settings(workspace_id, user_id)).model_dump()


def _response(ev: Evaluation, latency: int, model: str, prompt_text: str) -> EvaluationResponse:
    prompt_tokens = estimate_tokens(prompt_text)
    completion_tokens = estimate_tokens(ev.response or "")
    return EvaluationResponse(
        requestId=new_id("req"), model=model, status=ev.status, httpStatus=HTTP_STATUS[ev.status], action=ev.action,
        flagged=ev.flagged, riskScore=ev.risk_score,
        detectedThreats=[ThreatSchema(**f.dict()) for f in ev.threats],
        outputThreats=[ThreatSchema(**f.dict()) for f in ev.output_threats],
        redactedPrompt=ev.redacted_texts[-1], response=ev.response, upstream=upstream.provider_name(), latencyMs=latency,
        tokens=TokenUsage(prompt=prompt_tokens, completion=completion_tokens, total=prompt_tokens + completion_tokens),
    )


async def _evaluate_and_log(texts, roles, model, settings, monitor, *, workspace_id, user_id, key_id, key_name, endpoint):
    model = AUTO_ROUTE if model == "auto" else model
    await enforce(
        f"ws:{workspace_id}", settings["global_rate_limit"], scope="workspace", detail="Workspace rate limit exceeded",
        log={"workspace_id": workspace_id, "user_id": user_id, "key_id": key_id, "key_name": key_name,
             "endpoint": endpoint, "rule": "Rate Limit: Workspace exceeded global RPM budget"},
    )
    ev, latency = await run(texts, roles, model, settings, monitor=monitor)
    result = _response(ev, latency, model, " ".join(texts))
    await record_log(db, ev=ev, request_id=result.requestId, workspace_id=workspace_id, user_id=user_id, key_id=key_id,
                     key_name=key_name, endpoint=endpoint, model=model, prompt=texts[-1], latency_ms=latency,
                     tokens=result.tokens.total)
    record_evaluation(endpoint, result.status, ev.threats + ev.output_threats)
    return result


@router.post("/playground/evaluate", response_model=EvaluationResponse)
async def playground_evaluate(body: PlaygroundEvaluateRequest, user: CurrentUser = Depends(require_roles(CONSOLE_ROLES))):
    settings = await load_settings(user.workspace_id, user.id)
    return await _evaluate_and_log(
        [body.system, body.prompt], ["system", "user"], body.model, settings, not body.strict,
        workspace_id=user.workspace_id, user_id=user.id, key_id=None, key_name="console-playground",
        endpoint="/api/playground/evaluate",
    )


@router.post(COMPLETIONS_PATH, response_model=EvaluationResponse)
async def chat_completions(body: GatewayCompletionRequest, key: ApiKeyContext = Depends(verify_api_key_scope("chat:write"))):
    settings = await load_settings(key.workspace_id, key.user_id)
    result = await _evaluate_and_log(
        [m.content for m in body.messages], [m.role for m in body.messages], body.model, settings, False,
        workspace_id=key.workspace_id, user_id=key.user_id, key_id=key.key_id, key_name=key.key_name,
        endpoint=COMPLETIONS_PATH,
    )
    return JSONResponse(status_code=result.httpStatus, content=result.model_dump(mode="json"))
