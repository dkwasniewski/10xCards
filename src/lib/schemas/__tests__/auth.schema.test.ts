/**
 * Unit tests for auth.schema.ts
 * Tests Zod schema validations including refine methods
 */

import { describe, it, expect } from "vitest";
import {
  emailSchema,
  passwordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
} from "../auth.schema";

describe("auth.schema", () => {
  describe("emailSchema", () => {
    it("should validate correct email", () => {
      const result = emailSchema.safeParse("test@example.com");
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = emailSchema.safeParse("invalid-email");
      expect(result.success).toBe(false);
    });

    it("should reject empty email", () => {
      const result = emailSchema.safeParse("");
      expect(result.success).toBe(false);
    });

    it("should reject email exceeding 255 characters", () => {
      const longEmail = "a".repeat(250) + "@test.com";
      const result = emailSchema.safeParse(longEmail);
      expect(result.success).toBe(false);
    });
  });

  describe("passwordSchema", () => {
    it("should validate strong password", () => {
      const result = passwordSchema.safeParse("Test123!@#");
      expect(result.success).toBe(true);
    });

    it("should reject password without uppercase", () => {
      const result = passwordSchema.safeParse("test123!@#");
      expect(result.success).toBe(false);
    });

    it("should reject password without lowercase", () => {
      const result = passwordSchema.safeParse("TEST123!@#");
      expect(result.success).toBe(false);
    });

    it("should reject password without number", () => {
      const result = passwordSchema.safeParse("TestTest!@#");
      expect(result.success).toBe(false);
    });

    it("should reject password without special character", () => {
      const result = passwordSchema.safeParse("Test1234");
      expect(result.success).toBe(false);
    });

    it("should reject password shorter than 8 characters", () => {
      const result = passwordSchema.safeParse("Test1!");
      expect(result.success).toBe(false);
    });

    it("should reject password longer than 72 characters", () => {
      const longPassword = "A".repeat(70) + "1!";
      const result = passwordSchema.safeParse(longPassword);
      expect(result.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("should validate correct login data", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "anypassword",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = loginSchema.safeParse({
        email: "invalid-email",
        password: "anypassword",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty password", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    it("should validate correct registration data", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "Test123!@#",
        confirmPassword: "Test123!@#",
      });
      expect(result.success).toBe(true);
    });

    it("should reject when passwords do not match", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "Test123!@#",
        confirmPassword: "Different123!@#",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain("confirmPassword");
        expect(result.error.errors[0].message).toBe("Passwords do not match");
      }
    });

    it("should reject weak password even if confirmed", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "weak",
        confirmPassword: "weak",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty confirmPassword", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "Test123!@#",
        confirmPassword: "",
      });
      expect(result.success).toBe(false);
    });

    it("should validate refine method with matching passwords", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "ValidPass123!",
        confirmPassword: "ValidPass123!",
      });
      expect(result.success).toBe(true);
    });

    it("should invalidate refine method with non-matching passwords", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "ValidPass123!",
        confirmPassword: "DifferentPass123!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const refineError = result.error.errors.find((e) => e.path.includes("confirmPassword"));
        expect(refineError).toBeDefined();
        expect(refineError?.message).toBe("Passwords do not match");
      }
    });
  });

  describe("resetPasswordSchema", () => {
    it("should validate correct reset password data", () => {
      const result = resetPasswordSchema.safeParse({
        newPassword: "NewTest123!@#",
        confirmPassword: "NewTest123!@#",
      });
      expect(result.success).toBe(true);
    });

    it("should reject when passwords do not match", () => {
      const result = resetPasswordSchema.safeParse({
        newPassword: "NewTest123!@#",
        confirmPassword: "Different123!@#",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain("confirmPassword");
        expect(result.error.errors[0].message).toBe("Passwords do not match");
      }
    });

    it("should reject weak new password", () => {
      const result = resetPasswordSchema.safeParse({
        newPassword: "weak",
        confirmPassword: "weak",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty confirmPassword", () => {
      const result = resetPasswordSchema.safeParse({
        newPassword: "NewTest123!@#",
        confirmPassword: "",
      });
      expect(result.success).toBe(false);
    });

    it("should validate refine method with matching passwords", () => {
      const result = resetPasswordSchema.safeParse({
        newPassword: "ValidPass123!",
        confirmPassword: "ValidPass123!",
      });
      expect(result.success).toBe(true);
    });

    it("should invalidate refine method with non-matching passwords", () => {
      const result = resetPasswordSchema.safeParse({
        newPassword: "ValidPass123!",
        confirmPassword: "DifferentPass123!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const refineError = result.error.errors.find((e) => e.path.includes("confirmPassword"));
        expect(refineError).toBeDefined();
        expect(refineError?.message).toBe("Passwords do not match");
      }
    });
  });

  describe("forgotPasswordSchema", () => {
    it("should validate correct email", () => {
      const result = forgotPasswordSchema.safeParse({
        email: "test@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = forgotPasswordSchema.safeParse({
        email: "invalid-email",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty email", () => {
      const result = forgotPasswordSchema.safeParse({
        email: "",
      });
      expect(result.success).toBe(false);
    });
  });
});
