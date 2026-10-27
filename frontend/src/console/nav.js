import { LayoutGrid, KeyRound, SquareTerminal, ShieldAlert, Settings } from "lucide-react";

export const NAV = [
  { id: "overview", to: "/console/overview", slug: "overview", label: "Overview", icon: LayoutGrid, keywords: ["telemetry", "metrics", "health", "dashboard"] },
  { id: "keys", to: "/console/keys", slug: "api-keys", label: "API Keys", icon: KeyRound, keywords: ["secret", "token", "credentials"] },
  { id: "playground", to: "/console/playground", slug: "playground", label: "Gateway Playground", icon: SquareTerminal, keywords: ["chat", "test", "sandbox", "v1"] },
  { id: "logs", to: "/console/logs", slug: "security-logs", label: "Security Logs", icon: ShieldAlert, keywords: ["guardrail", "audit", "403", "blocked"] },
  { id: "settings", to: "/console/settings", slug: "settings", label: "Settings", icon: Settings, keywords: ["environment", "preferences"] },
];

export const GATEWAY_BASE_URL = "https://gateway.tollgate.example/v1";
