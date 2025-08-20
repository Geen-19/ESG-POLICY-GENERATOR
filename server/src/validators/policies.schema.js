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
export const BlockZ = z.object({
  id: z.string().min(1),
  type: z.enum(["heading", "paragraph", "list"]),
  title: z.string().optional(),
  content: z.union([z.string(), z.array(z.string())])
});

export const BlocksArrayZ = z.array(BlockZ);

export const TopicZ = z.object({
  topic: z.string().min(2, "Topic must be at least 2 characters")
});