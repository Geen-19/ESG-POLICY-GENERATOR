import { z } from 'zod';

export const GenerateBody = z.object({
  topic: z.string().min(3)
});

export const UpdateBlocksBody = z.object({
  blocks: z.array(
    z.object({
      id: z.string(),
      type: z.enum(['heading', 'paragraph', 'list']),
      title: z.string().optional(),
      content: z.union([z.string(), z.array(z.string())]),
      order: z.number()
    })
  )
});

export const ExportBody = z.object({
  format: z.enum(['pdf', 'docx'])
});
