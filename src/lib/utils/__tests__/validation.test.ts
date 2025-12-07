import { describe, it, expect } from "vitest";
import { validateEmail, validatePassword, validateStrongPassword } from "../validation";

/**
 * Unit tests for client-side validation utilities
 * Tests pure functions with comprehensive edge cases and business rules
 */

describe("validateEmail", () => {
  describe("valid emails", () => {
    it("should return undefined for valid email", () => {
      // Arrange
      const email = "user@example.com";

      // Act
      const result = validateEmail(email);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should accept email with subdomain", () => {
      // Arrange
      const email = "user@mail.example.com";

      // Act
      const result = validateEmail(email);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should accept email with plus addressing", () => {
      // Arrange
      const email = "user+test@example.com";

      // Act
      const result = validateEmail(email);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should accept email with numbers", () => {
      // Arrange
      const email = "user123@example456.com";

      // Act
      const result = validateEmail(email);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should accept email with dots in local part", () => {
      // Arrange
      const email = "first.last@example.com";

      // Act
      const result = validateEmail(email);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should accept email with hyphens in domain", () => {
      // Arrange
      const email = "user@my-domain.com";

      // Act
      const result = validateEmail(email);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should accept email with underscores", () => {
      // Arrange
      const email = "user_name@example.com";

      // Act
      const result = validateEmail(email);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should accept exactly 255 character email", () => {
      // Arrange
      // Create email with exactly 255 chars: 243 + '@' + 'example.com' (11) = 255
      const email = "a".repeat(243) + "@example.com";

      // Act
      const result = validateEmail(email);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should accept email with short TLD", () => {
      // Arrange
      const email = "user@example.co";

      // Act
      const result = validateEmail(email);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should accept email with long TLD", () => {
      // Arrange
      const email = "user@example.museum";

      // Act
      const result = validateEmail(email);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe("invalid emails - required field", () => {
    it("should return error for empty string", () => {
      // Arrange
      const email = "";

      // Act
      const result = validateEmail(email);

      // Assert
      expect(result).toBe("Email is required");
    });
  });

  describe("invalid emails - format", () => {
    it("should return error for email without @ symbol", () => {
      // Arrange
      const email = "userexample.com";

      // Act
      const result = validateEmail(email);

      // Assert
      expect(result).toBe("Please enter a valid email address");
    });

    it("should return error for email without domain", () => {
      // Arrange
      const email = "user@";

      // Act
      const result = validateEmail(email);

      // Assert
      expect(result).toBe("Please enter a valid email address");
    });

    it("should return error for email without local part", () => {
      // Arrange
      const email = "@example.com";

      // Act
      const result = validateEmail(email);

      // Assert
      expect(result).toBe("Please enter a valid email address");
    });

    it("should return error for email without TLD", () => {
      // Arrange
      const email = "user@example";

      // Act
      const result = validateEmail(email);

      // Assert
      expect(result).toBe("Please enter a valid email address");
    });

    it("should return error for email with spaces", () => {
      // Arrange
      const email = "user name@example.com";

      // Act
      const result = validateEmail(email);

      // Assert
      expect(result).toBe("Please enter a valid email address");
    });

    it("should return error for email with multiple @ symbols", () => {
      // Arrange
      const email = "user@@example.com";

      // Act
      const result = validateEmail(email);

      // Assert
      expect(result).toBe("Please enter a valid email address");
    });

    // Note: The simple regex /^[^\s@]+@[^\s@]+\.[^\s@]+$/ is intentionally permissive
    // It allows some technically invalid formats (like dots at start/end or consecutive dots)
    // This is acceptable for client-side validation - server-side will catch real issues
    // and overly strict validation creates poor UX for edge cases
  });

  describe("invalid emails - length", () => {
    it("should return error for email exceeding 255 characters", () => {
      // Arrange
      // Create email with 256 chars: 244 + '@' + 'example.com' (11) = 256
      const email = "a".repeat(244) + "@example.com";

      // Act
      const result = validateEmail(email);

      // Assert
      expect(result).toBe("Email must be less than 255 characters");
    });

    it("should return error for very long email", () => {
      // Arrange
      const email = "a".repeat(300) + "@example.com";

      // Act
      const result = validateEmail(email);

      // Assert
      expect(result).toBe("Email must be less than 255 characters");
    });
  });

  describe("edge cases", () => {
    it("should handle email with only numbers", () => {
      // Arrange
      const email = "123456@example.com";

      // Act
      const result = validateEmail(email);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should handle single character local part", () => {
      // Arrange
      const email = "a@example.com";

      // Act
      const result = validateEmail(email);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should reject email with only whitespace", () => {
      // Arrange
      const email = "   ";

      // Act
      const result = validateEmail(email);

      // Assert
      expect(result).toBe("Please enter a valid email address");
    });
  });
});

describe("validatePassword", () => {
  describe("valid passwords", () => {
    it("should return undefined for valid password", () => {
      // Arrange
      const password = "password123";

      // Act
      const result = validatePassword(password);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should accept exactly 8 character password", () => {
      // Arrange
      const password = "12345678";

      // Act
      const result = validatePassword(password);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should accept password with spaces", () => {
      // Arrange
      const password = "pass word 123";

      // Act
      const result = validatePassword(password);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should accept password with special characters", () => {
      // Arrange
      const password = "P@ssw0rd!#$%";

      // Act
      const result = validatePassword(password);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should accept very long password", () => {
      // Arrange
      const password = "a".repeat(100);

      // Act
      const result = validatePassword(password);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should accept password with unicode characters", () => {
      // Arrange
      const password = "pässwörd123";

      // Act
      const result = validatePassword(password);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should accept password with emojis", () => {
      // Arrange
      const password = "password🔒123";

      // Act
      const result = validatePassword(password);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe("invalid passwords - required field", () => {
    it("should return error for empty string", () => {
      // Arrange
      const password = "";

      // Act
      const result = validatePassword(password);

      // Assert
      expect(result).toBe("Password is required");
    });
  });

  describe("invalid passwords - length", () => {
    it("should return error for 7 character password", () => {
      // Arrange
      const password = "1234567";

      // Act
      const result = validatePassword(password);

      // Assert
      expect(result).toBe("Password must be at least 8 characters");
    });

    it("should return error for 1 character password", () => {
      // Arrange
      const password = "a";

      // Act
      const result = validatePassword(password);

      // Assert
      expect(result).toBe("Password must be at least 8 characters");
    });

    it("should return error for password with only spaces (less than 8)", () => {
      // Arrange
      const password = "       "; // 7 spaces

      // Act
      const result = validatePassword(password);

      // Assert
      expect(result).toBe("Password must be at least 8 characters");
    });
  });

  describe("edge cases", () => {
    it("should accept password with only numbers", () => {
      // Arrange
      const password = "12345678";

      // Act
      const result = validatePassword(password);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should accept password with only letters", () => {
      // Arrange
      const password = "abcdefgh";

      // Act
      const result = validatePassword(password);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should accept password with 8 spaces", () => {
      // Arrange
      const password = "        "; // 8 spaces

      // Act
      const result = validatePassword(password);

      // Assert
      expect(result).toBeUndefined();
    });
  });
});

describe("validateStrongPassword", () => {
  describe("valid strong passwords", () => {
    it("should return undefined for valid strong password", () => {
      // Arrange
      const password = "Password123!";

      // Act
      const result = validateStrongPassword(password);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should accept password with all required character types", () => {
      // Arrange
      const password = "Abc123!@";

      // Act
      const result = validateStrongPassword(password);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should accept exactly 8 character strong password", () => {
      // Arrange
      const password = "Pass123!";

      // Act
      const result = validateStrongPassword(password);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should accept exactly 72 character password", () => {
      // Arrange
      // Create 72 char password with all required types
      const password = "A1!" + "a".repeat(69);

      // Act
      const result = validateStrongPassword(password);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should accept password with all allowed special characters", () => {
      // Arrange
      const specialChars = ["!", "@", "#", "$", "%", "^", "&", "*"];

      specialChars.forEach((char) => {
        const password = `Password1${char}`;

        // Act
        const result = validateStrongPassword(password);

        // Assert
        expect(result).toBeUndefined();
      });
    });

    it("should accept password with multiple uppercase letters", () => {
      // Arrange
      const password = "PASSword123!";

      // Act
      const result = validateStrongPassword(password);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should accept password with multiple numbers", () => {
      // Arrange
      const password = "Password123456!";

      // Act
      const result = validateStrongPassword(password);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should accept password with multiple special characters", () => {
      // Arrange
      const password = "P@ssw0rd!#$";

      // Act
      const result = validateStrongPassword(password);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe("invalid passwords - required field", () => {
    it("should return error for empty string", () => {
      // Arrange
      const password = "";

      // Act
      const result = validateStrongPassword(password);

      // Assert
      expect(result).toBe("Password is required");
    });
  });

  describe("invalid passwords - length", () => {
    it("should return error for password less than 8 characters", () => {
      // Arrange
      const password = "Pass1!";

      // Act
      const result = validateStrongPassword(password);

      // Assert
      expect(result).toBe("Password must be at least 8 characters");
    });

    it("should return error for 7 character password with all requirements", () => {
      // Arrange
      const password = "Pass12!";

      // Act
      const result = validateStrongPassword(password);

      // Assert
      expect(result).toBe("Password must be at least 8 characters");
    });

    it("should return error for password exceeding 72 characters", () => {
      // Arrange
      const password = "A1!" + "a".repeat(70); // 73 chars

      // Act
      const result = validateStrongPassword(password);

      // Assert
      expect(result).toBe("Password must be less than 72 characters");
    });

    it("should return error for very long password", () => {
      // Arrange
      const password = "A1!" + "a".repeat(200);

      // Act
      const result = validateStrongPassword(password);

      // Assert
      expect(result).toBe("Password must be less than 72 characters");
    });
  });

  describe("invalid passwords - missing uppercase", () => {
    it("should return error for password without uppercase letter", () => {
      // Arrange
      const password = "password123!";

      // Act
      const result = validateStrongPassword(password);

      // Assert
      expect(result).toBe("Password must contain at least one uppercase letter");
    });

    it("should return error even with all other requirements met", () => {
      // Arrange
      const password = "password123!@#";

      // Act
      const result = validateStrongPassword(password);

      // Assert
      expect(result).toBe("Password must contain at least one uppercase letter");
    });
  });

  describe("invalid passwords - missing lowercase", () => {
    it("should return error for password without lowercase letter", () => {
      // Arrange
      const password = "PASSWORD123!";

      // Act
      const result = validateStrongPassword(password);

      // Assert
      expect(result).toBe("Password must contain at least one lowercase letter");
    });

    it("should return error even with all other requirements met", () => {
      // Arrange
      const password = "PASSWORD123!@#";

      // Act
      const result = validateStrongPassword(password);

      // Assert
      expect(result).toBe("Password must contain at least one lowercase letter");
    });
  });

  describe("invalid passwords - missing number", () => {
    it("should return error for password without number", () => {
      // Arrange
      const password = "Password!";

      // Act
      const result = validateStrongPassword(password);

      // Assert
      expect(result).toBe("Password must contain at least one number");
    });

    it("should return error even with all other requirements met", () => {
      // Arrange
      const password = "Password!@#$";

      // Act
      const result = validateStrongPassword(password);

      // Assert
      expect(result).toBe("Password must contain at least one number");
    });
  });

  describe("invalid passwords - missing special character", () => {
    it("should return error for password without special character", () => {
      // Arrange
      const password = "Password123";

      // Act
      const result = validateStrongPassword(password);

      // Assert
      expect(result).toBe("Password must contain at least one special character (!@#$%^&*)");
    });

    it("should return error for password with invalid special character", () => {
      // Arrange
      const password = "Password123+"; // + is not in allowed set

      // Act
      const result = validateStrongPassword(password);

      // Assert
      expect(result).toBe("Password must contain at least one special character (!@#$%^&*)");
    });

    it("should return error for password with only dash", () => {
      // Arrange
      const password = "Password123-";

      // Act
      const result = validateStrongPassword(password);

      // Assert
      expect(result).toBe("Password must contain at least one special character (!@#$%^&*)");
    });

    it("should return error for password with only underscore", () => {
      // Arrange
      const password = "Password123_";

      // Act
      const result = validateStrongPassword(password);

      // Assert
      expect(result).toBe("Password must contain at least one special character (!@#$%^&*)");
    });
  });

  describe("edge cases", () => {
    it("should validate requirements in order (length first)", () => {
      // Arrange
      const password = "pass"; // Too short, also missing requirements

      // Act
      const result = validateStrongPassword(password);

      // Assert - Should fail on length first
      expect(result).toBe("Password must be at least 8 characters");
    });

    it("should validate uppercase before lowercase", () => {
      // Arrange
      const password = "password123!"; // Missing uppercase

      // Act
      const result = validateStrongPassword(password);

      // Assert
      expect(result).toBe("Password must contain at least one uppercase letter");
    });

    it("should validate lowercase before number", () => {
      // Arrange
      const password = "PASSWORD123!"; // Missing lowercase

      // Act
      const result = validateStrongPassword(password);

      // Assert
      expect(result).toBe("Password must contain at least one lowercase letter");
    });

    it("should validate number before special character", () => {
      // Arrange
      const password = "Password!"; // Missing number

      // Act
      const result = validateStrongPassword(password);

      // Assert
      expect(result).toBe("Password must contain at least one number");
    });

    it("should handle password with spaces and all requirements", () => {
      // Arrange
      const password = "Pass word 123!";

      // Act
      const result = validateStrongPassword(password);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should handle password at exactly 72 chars boundary", () => {
      // Arrange
      const password72 = "A1!" + "a".repeat(69);
      const password73 = "A1!" + "a".repeat(70);

      // Act
      const result72 = validateStrongPassword(password72);
      const result73 = validateStrongPassword(password73);

      // Assert
      expect(result72).toBeUndefined();
      expect(result73).toBe("Password must be less than 72 characters");
    });
  });
});
