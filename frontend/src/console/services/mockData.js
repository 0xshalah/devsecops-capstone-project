// Static catalogue of routable models shown in the Playground.
export const MODELS = [
  { id: "auto", route: "auto", note: "Gateway picks the route (currently nexus-fast-v1)" },
  { id: "nexus-fast-v1", route: "nexus", note: "Lowest latency" },
  { id: "gpt-4o-route", route: "openai", note: "Routes to OpenAI" },
  { id: "claude-route", route: "anthropic", note: "Routes to Anthropic" },
];
