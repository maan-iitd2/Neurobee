import { NextResponse } from "next/server";

// LM Studio runs an OpenAI-compatible server on port 1234 by default.
// Override via LMSTUDIO_URL env var for non-default setups.
const LMSTUDIO_BASE = process.env.LMSTUDIO_URL ?? "http://localhost:1234";

export async function GET() {
  try {
    const res = await fetch(`${LMSTUDIO_BASE}/v1/models`, {
      signal: AbortSignal.timeout(3_000),
    });
    if (!res.ok) {
      return NextResponse.json({ running: false, models: [] });
    }
    const data = await res.json();
    // LM Studio returns { data: [{ id: "model-id", ... }, ...] }
    const models: string[] = (data?.data ?? []).map((m: { id: string }) => m.id);
    return NextResponse.json({ running: true, models });
  } catch {
    return NextResponse.json({ running: false, models: [] });
  }
}
