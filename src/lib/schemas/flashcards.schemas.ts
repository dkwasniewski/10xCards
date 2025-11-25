import { z } from "zod";

export const createFlashcardItemSchema = z
  .object({
    front: z.string().max(200),
    back: z.string().max(500),
    source: z.enum(["manual", "ai"]),
    ai_session_id: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.source === "ai" && !data.ai_session_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ai_session_id is required when source is ai",
        path: ["ai_session_id"],
      });
    }
  });

export const bulkCreateFlashcardsSchema = z.array(createFlashcardItemSchema).nonempty();

/**
 * Schema for validating query parameters when listing flashcards.
 * Supports pagination, search, and sorting.
 */
export const listFlashcardsQuerySchema = z.object({
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().gte(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["created_at", "front"]).default("created_at"),
});

export type ListFlashcardsQuery = z.infer<typeof listFlashcardsQuerySchema>;

/**
 * Schema for validating flashcard update requests.
 * At least one of front or back must be provided.
 */
export const updateFlashcardSchema = z
  .object({
    front: z.string().max(200).optional(),
    back: z.string().max(500).optional(),
  })
  .refine((data) => data.front !== undefined || data.back !== undefined, {
    message: "At least front or back must be provided",
  });

/**
 * Schema for validating UUID path parameters.
 */
export const uuidParamSchema = z.string().uuid();

/**
 * Schema for validating bulk delete requests.
 * Supports deleting up to 100 flashcards at once.
 */
export const bulkDeleteFlashcardsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

export type BulkDeleteFlashcardsCommand = z.infer<typeof bulkDeleteFlashcardsSchema>;

/**
 * Schema for validating individual candidate action.
 * Ensures edited_front and edited_back are required when action is "edit".
 */
const candidateActionItemSchema = z
  .object({
    candidate_id: z.string().uuid({ message: "candidate_id must be a valid UUID" }),
    action: z.enum(["accept", "edit", "reject"], {
      errorMap: () => ({ message: "action must be one of: accept, edit, reject" }),
    }),
    edited_front: z.string().max(200).optional(),
    edited_back: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.action === "edit") {
      if (!data.edited_front) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "edited_front is required when action is edit",
          path: ["edited_front"],
        });
      }
      if (!data.edited_back) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "edited_back is required when action is edit",
          path: ["edited_back"],
        });
      }
    }
  });

/**
 * Schema for validating candidate actions request body.
 * Supports processing 1-100 actions to prevent abuse.
 */
export const candidateActionsSchema = z.object({
  actions: z
    .array(candidateActionItemSchema)
    .min(1, "At least one action is required")
    .max(100, "Maximum 100 actions allowed per request"),
});

export type CandidateActionsCommand = z.infer<typeof candidateActionsSchema>;
