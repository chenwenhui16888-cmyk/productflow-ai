import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: { questionId: string } }
) {
  const body = await request.json();
  const userAnswer = typeof body.userAnswer === "string" ? body.userAnswer : "";
  const answerStatus =
    typeof body.answerStatus === "string"
      ? body.answerStatus
      : userAnswer.trim()
        ? "answered"
        : "unanswered";

  const question = await prisma.clarificationQuestion.update({
    where: { id: params.questionId },
    data: {
      userAnswer,
      answerStatus,
      generatedBy: "mixed"
    }
  });

  return NextResponse.json({ question });
}
