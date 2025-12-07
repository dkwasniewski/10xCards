/**
 * Client-side validation utilities for form inputs
 * These functions provide immediate feedback to users before API calls
 */

/**
 * Validates email address format and constraints
 *
 * @param email - Email address to validate
 * @returns Error message if invalid, undefined if valid
 */
export function validateEmail(email: string): string | undefined {
  if (!email) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address";
  if (email.length > 255) return "Email must be less than 255 characters";
  return undefined;
}

/**
 * Validates password for login (basic requirements)
 *
 * @param password - Password to validate
 * @returns Error message if invalid, undefined if valid
 */
export function validatePassword(password: string): string | undefined {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  return undefined;
}

/**
 * Validates strong password for registration/reset
 * Enforces complexity requirements for security
 *
 * @param password - Password to validate
 * @returns Error message if invalid, undefined if valid
 */
export function validateStrongPassword(password: string): string | undefined {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 72) return "Password must be less than 72 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  if (!/[!@#$%^&*]/.test(password)) return "Password must contain at least one special character (!@#$%^&*)";
  return undefined;
}
