import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      database: "connected",
      ai: {
        provider: "ollama",
        model: process.env.OLLAMA_MODEL ?? "qwen2.5:3b",
        endpoint: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
      },
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
