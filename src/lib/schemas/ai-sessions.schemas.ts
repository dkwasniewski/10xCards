import { z } from "zod";

/**
 * Schema for validating sessionId path parameter.
 * Ensures the provided sessionId is a valid UUID.
 */
export const sessionIdSchema = z.string().uuid({
  message: "Invalid sessionId format. Must be a valid UUID.",
});

export type SessionId = z.infer<typeof sessionIdSchema>;
