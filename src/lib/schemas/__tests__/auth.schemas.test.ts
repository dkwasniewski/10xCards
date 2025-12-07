import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginSchema,
  type RegisterSchema,
  type ForgotPasswordSchema,
  type ResetPasswordSchema,
} from "../auth.schemas";

/**
 * Unit tests for authentication validation schemas
 * Tests Zod schema validation rules, error messages, and data transformations
 */

describe("loginSchema", () => {
  describe("valid inputs", () => {
    it("should accept valid email and password", () => {
      // Arrange
      const validData = {
        email: "user@example.com",
        password: "password123",
      };

      // Act
      const result = loginSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it("should trim and lowercase email", () => {
      // Arrange
      const input = {
        email: "USER@EXAMPLE.COM",
        password: "password123",
      };

      // Act
      const result = loginSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("user@example.com");
      }
    });

    it("should accept exactly 8 character password", () => {
      // Arrange
      const input = {
        email: "user@example.com",
        password: "12345678",
      };

      // Act
      const result = loginSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should accept 255 character email", () => {
      // Arrange
      const longEmail = "a".repeat(243) + "@example.com"; // 243 + 12 = 255
      const input = {
        email: longEmail,
        password: "password123",
      };

      // Act
      const result = loginSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("email validation", () => {
    it("should reject empty email", () => {
      // Arrange
      const input = {
        email: "",
        password: "password123",
      };

      // Act
      const result = loginSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Email is required");
      }
    });

    it("should reject email without @ symbol", () => {
      // Arrange
      const input = {
        email: "userexample.com",
        password: "password123",
      };

      // Act
      const result = loginSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Please enter a valid email address");
      }
    });

    it("should reject email without domain", () => {
      // Arrange
      const input = {
        email: "user@",
        password: "password123",
      };

      // Act
      const result = loginSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Please enter a valid email address");
      }
    });

    it("should reject email without TLD", () => {
      // Arrange
      const input = {
        email: "user@example",
        password: "password123",
      };

      // Act
      const result = loginSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Please enter a valid email address");
      }
    });

    it("should reject email exceeding 255 characters", () => {
      // Arrange
      const longEmail = "a".repeat(244) + "@example.com"; // 244 + 12 = 256
      const input = {
        email: longEmail,
        password: "password123",
      };

      // Act
      const result = loginSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Email must be less than 255 characters");
      }
    });

    it("should accept email with plus addressing", () => {
      // Arrange
      const input = {
        email: "user+test@example.com",
        password: "password123",
      };

      // Act
      const result = loginSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should accept email with subdomain", () => {
      // Arrange
      const input = {
        email: "user@mail.example.com",
        password: "password123",
      };

      // Act
      const result = loginSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should accept email with numbers", () => {
      // Arrange
      const input = {
        email: "user123@example456.com",
        password: "password123",
      };

      // Act
      const result = loginSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("password validation", () => {
    it("should reject empty password", () => {
      // Arrange
      const input = {
        email: "user@example.com",
        password: "",
      };

      // Act
      const result = loginSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Password is required");
      }
    });

    it("should reject password with 7 characters", () => {
      // Arrange
      const input = {
        email: "user@example.com",
        password: "1234567",
      };

      // Act
      const result = loginSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Password must be at least 8 characters");
      }
    });

    it("should accept password with spaces", () => {
      // Arrange
      const input = {
        email: "user@example.com",
        password: "pass word 123",
      };

      // Act
      const result = loginSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should accept password with special characters", () => {
      // Arrange
      const input = {
        email: "user@example.com",
        password: "P@ssw0rd!#$%",
      };

      // Act
      const result = loginSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("type safety", () => {
    it("should have correct TypeScript type", () => {
      // Arrange
      const validData: LoginSchema = {
        email: "user@example.com",
        password: "password123",
      };

      // Act
      const result = loginSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
    });
  });
});

describe("registerSchema", () => {
  describe("valid inputs", () => {
    it("should accept valid email and strong password", () => {
      // Arrange
      const validData = {
        email: "user@example.com",
        password: "Password123!",
      };

      // Act
      const result = registerSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("user@example.com");
      }
    });

    it("should accept password with all required character types", () => {
      // Arrange
      const input = {
        email: "user@example.com",
        password: "Abc123!@",
      };

      // Act
      const result = registerSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should accept exactly 72 character password", () => {
      // Arrange
      const password72 = "A1!" + "a".repeat(69); // 72 chars with required types
      const input = {
        email: "user@example.com",
        password: password72,
      };

      // Act
      const result = registerSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("strong password validation", () => {
    it("should reject password without uppercase letter", () => {
      // Arrange
      const input = {
        email: "user@example.com",
        password: "password123!",
      };

      // Act
      const result = registerSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Password must contain at least one uppercase letter");
      }
    });

    it("should reject password without lowercase letter", () => {
      // Arrange
      const input = {
        email: "user@example.com",
        password: "PASSWORD123!",
      };

      // Act
      const result = registerSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Password must contain at least one lowercase letter");
      }
    });

    it("should reject password without number", () => {
      // Arrange
      const input = {
        email: "user@example.com",
        password: "Password!",
      };

      // Act
      const result = registerSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Password must contain at least one number");
      }
    });

    it("should reject password without special character", () => {
      // Arrange
      const input = {
        email: "user@example.com",
        password: "Password123",
      };

      // Act
      const result = registerSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Password must contain at least one special character (!@#$%^&*)");
      }
    });

    it("should reject password with less than 8 characters", () => {
      // Arrange
      const input = {
        email: "user@example.com",
        password: "Pass1!",
      };

      // Act
      const result = registerSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Password must be at least 8 characters");
      }
    });

    it("should reject password exceeding 72 characters", () => {
      // Arrange
      const password73 = "A1!" + "a".repeat(70); // 73 chars
      const input = {
        email: "user@example.com",
        password: password73,
      };

      // Act
      const result = registerSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Password must be less than 72 characters");
      }
    });

    it("should accept all valid special characters", () => {
      // Arrange
      const specialChars = ["!", "@", "#", "$", "%", "^", "&", "*"];

      specialChars.forEach((char) => {
        const input = {
          email: "user@example.com",
          password: `Password1${char}`,
        };

        // Act
        const result = registerSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });
    });

    it("should reject password with invalid special character", () => {
      // Arrange
      const input = {
        email: "user@example.com",
        password: "Password123+", // + is not in the allowed set
      };

      // Act
      const result = registerSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("special character");
      }
    });
  });

  describe("edge cases", () => {
    it("should handle password with multiple uppercase letters", () => {
      // Arrange
      const input = {
        email: "user@example.com",
        password: "PASSword123!",
      };

      // Act
      const result = registerSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should handle password with multiple numbers", () => {
      // Arrange
      const input = {
        email: "user@example.com",
        password: "Password123456!",
      };

      // Act
      const result = registerSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should handle password with multiple special characters", () => {
      // Arrange
      const input = {
        email: "user@example.com",
        password: "P@ssw0rd!#$",
      };

      // Act
      const result = registerSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("type safety", () => {
    it("should have correct TypeScript type", () => {
      // Arrange
      const validData: RegisterSchema = {
        email: "user@example.com",
        password: "Password123!",
      };

      // Act
      const result = registerSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
    });
  });
});

describe("forgotPasswordSchema", () => {
  describe("valid inputs", () => {
    it("should accept valid email", () => {
      // Arrange
      const validData = {
        email: "user@example.com",
      };

      // Act
      const result = forgotPasswordSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("user@example.com");
      }
    });

    it("should trim and lowercase email", () => {
      // Arrange
      const input = {
        email: "USER@EXAMPLE.COM",
      };

      // Act
      const result = forgotPasswordSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("user@example.com");
      }
    });
  });

  describe("email validation", () => {
    it("should reject empty email", () => {
      // Arrange
      const input = {
        email: "",
      };

      // Act
      const result = forgotPasswordSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Email is required");
      }
    });

    it("should reject invalid email format", () => {
      // Arrange
      const input = {
        email: "not-an-email",
      };

      // Act
      const result = forgotPasswordSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Please enter a valid email address");
      }
    });
  });

  describe("type safety", () => {
    it("should have correct TypeScript type", () => {
      // Arrange
      const validData: ForgotPasswordSchema = {
        email: "user@example.com",
      };

      // Act
      const result = forgotPasswordSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
    });
  });
});

describe("resetPasswordSchema", () => {
  describe("valid inputs", () => {
    it("should accept valid token and strong password", () => {
      // Arrange
      const validData = {
        token: "valid-reset-token-12345",
        new_password: "NewPassword123!",
      };

      // Act
      const result = resetPasswordSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.token).toBe("valid-reset-token-12345");
        expect(result.data.new_password).toBe("NewPassword123!");
      }
    });
  });

  describe("token validation", () => {
    it("should reject empty token", () => {
      // Arrange
      const input = {
        token: "",
        new_password: "NewPassword123!",
      };

      // Act
      const result = resetPasswordSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Reset token is required");
      }
    });

    it("should accept any non-empty token string", () => {
      // Arrange
      const input = {
        token: "abc",
        new_password: "NewPassword123!",
      };

      // Act
      const result = resetPasswordSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("new_password validation", () => {
    it("should enforce strong password requirements", () => {
      // Arrange
      const input = {
        token: "valid-token",
        new_password: "weak",
      };

      // Act
      const result = resetPasswordSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject password without uppercase", () => {
      // Arrange
      const input = {
        token: "valid-token",
        new_password: "password123!",
      };

      // Act
      const result = resetPasswordSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("uppercase");
      }
    });

    it("should reject password without lowercase", () => {
      // Arrange
      const input = {
        token: "valid-token",
        new_password: "PASSWORD123!",
      };

      // Act
      const result = resetPasswordSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("lowercase");
      }
    });

    it("should reject password without number", () => {
      // Arrange
      const input = {
        token: "valid-token",
        new_password: "Password!",
      };

      // Act
      const result = resetPasswordSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("number");
      }
    });

    it("should reject password without special character", () => {
      // Arrange
      const input = {
        token: "valid-token",
        new_password: "Password123",
      };

      // Act
      const result = resetPasswordSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("special character");
      }
    });
  });

  describe("type safety", () => {
    it("should have correct TypeScript type", () => {
      // Arrange
      const validData: ResetPasswordSchema = {
        token: "valid-token",
        new_password: "NewPassword123!",
      };

      // Act
      const result = resetPasswordSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
    });
  });
});
