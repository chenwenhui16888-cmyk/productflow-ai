import { z } from "zod";

export function splitLines(value: string) {
  return value
    .split(/[\n,，、]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export const createProjectSchema = z.object({
  name: z.string().trim().min(2, "项目名称至少需要 2 个字").max(80, "项目名称不能超过 80 个字"),
  ideaText: z.string().trim().min(8, "产品想法至少需要 8 个字").max(2000, "产品想法不能超过 2000 个字"),
  productType: z.string().trim().optional().default(""),
  targetUsers: z.string().trim().optional().default(""),
  constraints: z.string().trim().optional().default(""),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
