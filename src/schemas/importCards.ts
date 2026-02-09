import { z } from 'zod';

const checklistItemSchema = z.object({
  text: z.string(),
  completed: z.boolean().default(false),
});

const locationSchema = z.object({
  name: z.string(),
  address: z.string(),
  lat: z.number(),
  lng: z.number(),
  placeId: z.string().optional(),
});

export const cardImportSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  order: z.number().int("Order must be an integer").min(0, "Order must be non-negative"),
  description: z.string().optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:mm format").optional(),
  icon: z.string().optional(),
  notes: z.string().optional(),
  cost: z.number().optional(),
  currency: z.string().optional(),
  location: locationSchema.optional(),
  checklist: z.array(checklistItemSchema).optional(),
});

export const importFileSchema = z.object({
  cards: z.array(cardImportSchema),
});

export type ImportCardData = z.infer<typeof cardImportSchema>;
export type ImportFileData = z.infer<typeof importFileSchema>;
