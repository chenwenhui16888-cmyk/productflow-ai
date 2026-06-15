import { prisma } from "@/lib/db";

export async function runGenerationTask<T>(
  projectId: string,
  stepKey: string,
  artifactType: string,
  generate: () => Promise<T>
) {
  const log = await prisma.generationLog.create({
    data: {
      projectId,
      stepKey,
      artifactType,
      mode: "workflow",
      status: "running",
      inputSnapshot: { startedBy: "user" }
    }
  });
  const startedAt = Date.now();

  try {
    const result = await generate();
    await prisma.generationLog.update({
      where: { id: log.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        outputSnapshot: { durationMs: Date.now() - startedAt }
      }
    });
    return result;
  } catch (error) {
    await prisma.generationLog.update({
      where: { id: log.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : "unknown_error",
        outputSnapshot: { durationMs: Date.now() - startedAt }
      }
    });
    throw error;
  }
}
