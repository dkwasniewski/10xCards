// src/lib/schemas/auth.schema.ts

import { z } from "zod";

/**
 * Email validation schema
 * Follows the same validation rules as the legacy validateEmail function
 */
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address")
  .max(255, "Email must be less than 255 characters");

/**
 * Password validation schema with strength requirements
 * Follows the same validation rules as the legacy validatePassword function
 */
export const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be less than 72 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[!@#$%^&*]/, "Password must contain at least one special character (!@#$%^&*)");

/**
 * Login form schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"), // Less strict for login
});

/**
 * Register form schema with password confirmation
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Reset password form schema with password confirmation
 */
export const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Forgot password form schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Type exports for forms
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
