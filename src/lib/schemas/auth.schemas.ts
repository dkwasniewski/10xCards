import { z } from "zod";

/**
 * Email validation schema
 * - Required field
 * - Valid email format
 * - Max 255 characters
 * - Automatically lowercased and trimmed
 */
const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address")
  .max(255, "Email must be less than 255 characters")
  .toLowerCase()
  .trim();

/**
 * Password validation for login
 * - Required field
 * - Minimum 8 characters
 */
const loginPasswordSchema = z.string().min(1, "Password is required").min(8, "Password must be at least 8 characters");

/**
 * Strong password validation for registration/reset
 * - Min 8, max 72 characters
 * - Must contain uppercase, lowercase, number, and special character
 */
const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be less than 72 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[!@#$%^&*]/, "Password must contain at least one special character (!@#$%^&*)");

/**
 * Login request validation schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

/**
 * Registration request validation schema
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: strongPasswordSchema,
});

/**
 * Forgot password request validation schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Reset password request validation schema
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  new_password: strongPasswordSchema,
});

// Type exports for TypeScript
export type LoginSchema = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;


