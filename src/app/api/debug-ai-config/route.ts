import { NextResponse } from "next/server";

export async function GET() {
  const raw = process.env.AI_PROVIDER;
  return NextResponse.json({
    raw: raw ?? null,
    rawLength: raw?.length ?? 0,
    hasGroqKey: Boolean(process.env.GROQ_API_KEY),
    groqKeyLength: process.env.GROQ_API_KEY?.length ?? 0,
  });
}
