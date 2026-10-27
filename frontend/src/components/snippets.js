export const SNIPPETS = {
  curl: `curl https://gateway.tollgate.example/v1/chat/completions \\
  -H "Authorization: Bearer $TOLLGATE_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "auto",
    "messages": [{"role": "user", "content": "Summarize ticket #4821"}]
  }'`,
  node: `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://gateway.tollgate.example/v1",
  apiKey: process.env.TOLLGATE_KEY,
});

const res = await client.chat.completions.create({
  model: "auto",
  messages: [{ role: "user", content: "Summarize ticket #4821" }],
});`,
  python: `import os
from openai import OpenAI

client = OpenAI(
    base_url="https://gateway.tollgate.example/v1",
    api_key=os.environ["TOLLGATE_KEY"],
)

res = client.chat.completions.create(
    model="auto",
    messages=[{"role": "user", "content": "Summarize ticket #4821"}],
)`,
};

export const RESPONSE = `{
  "id": "chatcmpl_example",
  "object": "chat.completion",
  "model": "gpt-4o-mini",
  "route": { "provider": "openai", "fallback": "anthropic" },
  "guardrails": { "prompt_injection": "pass", "pii_redacted": 1 },
  "choices": [{
    "message": { "role": "assistant", "content": "Customer reports..." }
  }],
  "usage": { "prompt_tokens": 24, "completion_tokens": 9, "total_tokens": 33 }
}`;
