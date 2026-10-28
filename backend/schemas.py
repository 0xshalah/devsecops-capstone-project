from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Role = Literal["Owner", "Admin", "Member", "Viewer"]
Plan = Literal["Free", "Pro", "Enterprise"]
KeyEnv = Literal["live", "test"]
KeyStatus = Literal["active", "revoked"]
Scope = Literal["chat:write", "logs:read", "metrics:read"]
LogStatus = Literal["blocked", "flagged", "clean"]
Severity = Literal["low", "medium", "high", "critical"]
Action = Literal["block", "flag", "redact"]


class StrictInput(BaseModel):
    """Base for every request body: unknown fields are rejected (BOPLA / mass assignment)."""

    model_config = ConfigDict(extra="forbid")


class DBModel(BaseModel):
    """Base for documents stored in MongoDB (string ids, never ObjectId)."""

    model_config = ConfigDict(extra="ignore")


class Output(BaseModel):
    model_config = ConfigDict(extra="ignore")


# ---------- Auth context ----------
class CurrentUser(BaseModel):
    id: str
    email: str
    role: Role
    workspace_id: str


class ApiKeyContext(BaseModel):
    key_id: str
    workspace_id: str
    user_id: str
    scopes: List[Scope]
    rate_limit: int


# ---------- User ----------
class SignUpRequest(StrictInput):
    name: str = Field(min_length=1, max_length=64)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class SignInRequest(StrictInput):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class ProfileUpdateSchema(StrictInput):
    name: Optional[str] = Field(None, min_length=1, max_length=64)
    company: Optional[str] = Field(None, max_length=120)
    jobTitle: Optional[str] = Field(None, max_length=120)
    timezone: Optional[str] = Field(None, max_length=64)
    bio: Optional[str] = Field(None, max_length=500)


class UserInDB(DBModel):
    id: str
    email: str
    name: str
    password_hash: str
    role: Role
    plan: Plan
    workspace_id: str
    company: str = ""
    jobTitle: str = ""
    timezone: str = "UTC"
    bio: str = ""
    emailVerified: bool = False
    provider: Literal["email"] = "email"
    created_at: datetime
    updated_at: datetime


class UserResponseSchema(Output):
    id: str
    email: str
    name: str
    role: Role
    plan: Plan
    workspaceId: str
    company: str
    jobTitle: str
    timezone: str
    bio: str
    emailVerified: bool
    provider: str
    createdAt: datetime

    @classmethod
    def from_db(cls, doc: dict) -> "UserResponseSchema":
        u = UserInDB(**doc)
        return cls(
            id=u.id, email=u.email, name=u.name, role=u.role, plan=u.plan, workspaceId=u.workspace_id,
            company=u.company, jobTitle=u.jobTitle, timezone=u.timezone, bio=u.bio,
            emailVerified=u.emailVerified, provider=u.provider, createdAt=u.created_at,
        )


# ---------- Workspace ----------
class WorkspaceMember(DBModel):
    user_id: str
    role: Role


class WorkspaceInDB(DBModel):
    id: str
    name: str
    owner_id: str
    plan: Plan
    members: List[WorkspaceMember]
    created_at: datetime


class WorkspaceResponseSchema(Output):
    id: str
    name: str
    ownerId: str
    plan: Plan
    role: Role
    memberCount: int
    createdAt: datetime

    @classmethod
    def from_db(cls, doc: dict, role: str) -> "WorkspaceResponseSchema":
        w = WorkspaceInDB(**doc)
        return cls(id=w.id, name=w.name, ownerId=w.owner_id, plan=w.plan, role=role,
                   memberCount=len(w.members), createdAt=w.created_at)


class AuthResponse(Output):
    token: str
    tokenType: Literal["bearer"] = "bearer"
    expiresIn: int
    user: UserResponseSchema
    workspace: WorkspaceResponseSchema


class MeResponse(Output):
    user: UserResponseSchema
    workspace: WorkspaceResponseSchema


# ---------- API keys ----------
class ApiKeyCreateRequest(StrictInput):
    name: str = Field(min_length=1, max_length=64)
    env: KeyEnv = "test"
    scopes: List[Scope] = Field(default_factory=lambda: ["chat:write"], min_length=1)
    rateLimit: int = Field(600, ge=1, le=100_000)
    quota: int = Field(1_000_000, ge=1, le=1_000_000_000)


class ApiKeyUpdateRequest(StrictInput):
    name: Optional[str] = Field(None, min_length=1, max_length=64)
    status: Optional[Literal["revoked"]] = None
    scopes: Optional[List[Scope]] = Field(None, min_length=1)
    rateLimit: Optional[int] = Field(None, ge=1, le=100_000)


class ApiKeyInDB(DBModel):
    id: str
    workspace_id: str
    user_id: str
    name: str
    env: KeyEnv
    prefix: str
    last4: str
    key_hash: str
    scopes: List[Scope]
    rate_limit: int
    quota: int
    status: KeyStatus
    created_at: datetime
    last_used_at: Optional[datetime] = None


class ApiKeyResponseSchema(Output):
    id: str
    name: str
    env: KeyEnv
    prefix: str
    last4: str
    scopes: List[Scope]
    rateLimit: int
    quota: int
    status: KeyStatus
    createdAt: datetime
    lastUsed: Optional[datetime] = None

    @classmethod
    def from_db(cls, doc: dict) -> "ApiKeyResponseSchema":
        k = ApiKeyInDB(**doc)
        return cls(id=k.id, name=k.name, env=k.env, prefix=k.prefix, last4=k.last4, scopes=k.scopes,
                   rateLimit=k.rate_limit, quota=k.quota, status=k.status, createdAt=k.created_at,
                   lastUsed=k.last_used_at)


class ApiKeyCreatedResponse(Output):
    key: ApiKeyResponseSchema
    secret: str


# ---------- Security logs ----------
class SecurityLogInDB(DBModel):
    id: str
    workspace_id: str
    user_id: str
    key_id: Optional[str] = None
    key_name: str
    timestamp: datetime
    endpoint: str
    model: str
    prompt_snippet: str
    threat_type: Optional[str] = None
    rule: Optional[str] = None
    severity: Severity
    action: Literal["allow", "block", "flag", "redact", "throttle"]
    status: LogStatus
    http_status: int
    latency_ms: int
    tokens: int


class SecurityLogResponseSchema(Output):
    id: str
    ts: datetime
    endpoint: str
    model: str
    key: str
    keyId: Optional[str]
    status: int
    outcome: LogStatus
    severity: Severity
    action: str
    threatType: Optional[str]
    rule: Optional[str]
    promptSnippet: str
    latency: int
    tokens: int


# ---------- Metrics ----------
class GatewayMetricsInDB(DBModel):
    workspace_id: str
    user_id: str
    bucket: datetime
    requests: int
    blocked: int
    flagged: int
    tokens: int
    avg_latency_ms: int


class MetricsOverviewResponse(Output):
    totalRequests: int
    blockedCount: int
    blockedPct: float
    avgLatencyMs: int
    activeKeys: int
    tokenVolume: int


class TrafficBucketResponse(Output):
    t: datetime
    requests: int
    blocks: int
    flagged: int
    latency: int
    tokens: int


# ---------- Settings ----------
class PiiToggles(StrictInput):
    email: bool = True
    phone: bool = True
    creditCard: bool = True
    nationalId: bool = True
    secrets: bool = True


class GatewaySettingsInDB(DBModel):
    workspace_id: str
    user_id: str
    default_action: Action = "block"
    injection_threshold: float = Field(0.7, ge=0.0, le=1.0)
    pii_redaction: PiiToggles = Field(default_factory=PiiToggles)
    toxicity_filter: bool = True
    global_rate_limit: int = Field(3000, ge=1, le=1_000_000)
    updated_at: datetime


class GatewaySettingsUpdate(StrictInput):
    defaultAction: Optional[Action] = None
    injectionThreshold: Optional[float] = Field(None, ge=0.0, le=1.0)
    piiRedaction: Optional[PiiToggles] = None
    toxicityFilter: Optional[bool] = None
    globalRateLimit: Optional[int] = Field(None, ge=1, le=1_000_000)


class GatewaySettingsResponse(Output):
    workspaceId: str
    defaultAction: Action
    injectionThreshold: float
    piiRedaction: PiiToggles
    toxicityFilter: bool
    globalRateLimit: int
    updatedAt: datetime
