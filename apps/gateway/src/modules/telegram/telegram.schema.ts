import { z } from "zod";

const telegramUserSchema = z.object({
  id: z.union([z.number(), z.string()]).transform((value) => String(value))
});

const telegramChatSchema = z.object({
  id: z.union([z.number(), z.string()]).transform((value) => String(value))
});

export const telegramUpdateSchema = z.object({
  update_id: z.number().int(),
  message: z
    .object({
      message_id: z.number().int(),
      text: z.string().min(1),
      chat: telegramChatSchema,
      from: telegramUserSchema
    })
    .optional()
});

export type TelegramUpdate = z.infer<typeof telegramUpdateSchema>;
