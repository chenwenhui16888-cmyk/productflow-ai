import { NextResponse } from "next/server";
import { generateDeliveryItems } from "@/lib/agents/mock";

export async function POST(
  _request: Request,
  { params }: { params: { projectId: string } }
) {
  const items = await generateDeliveryItems(params.projectId);

  return NextResponse.json({ items });
}
