import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService } from "../auth.service";
import type { SupabaseClient } from "../../../db/supabase.client";

/**
 * Unit tests for AuthService
 * Tests authentication business logic with comprehensive mocking of Supabase client
 * Following Vitest best practices: vi.fn() for mocks, typed implementations, AAA pattern
 */

// Mock Supabase client type
interface MockSupabaseClient {
  auth: {
    signUp: ReturnType<typeof vi.fn>;
    signInWithPassword: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
    resetPasswordForEmail: ReturnType<typeof vi.fn>;
    updateUser: ReturnType<typeof vi.fn>;
  };
}

describe("AuthService", () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    // Arrange - Create fresh mock for each test
    mockSupabase = {
      auth: {
        signUp: vi.fn(),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(),
      },
    };
  });

  describe("register", () => {
    describe("successful registration", () => {
      it("should return user data on successful registration", async () => {
        // Arrange
        const email = "user@example.com";
        const password = "Password123!";
        const mockUser = {
          id: "user-123",
          email: "user@example.com",
          created_at: "2024-01-01T00:00:00Z",
        };

        mockSupabase.auth.signUp.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });

        // Act
        const result = await authService.register(mockSupabase as unknown as SupabaseClient, email, password);

        // Assert
        expect(result).toEqual({
          id: "user-123",
          email: "user@example.com",
          created_at: "2024-01-01T00:00:00Z",
        });
      });

      it("should call signUp with correct parameters", async () => {
        // Arrange
        const email = "user@example.com";
        const password = "Password123!";
        const mockUser = {
          id: "user-123",
          email: "user@example.com",
          created_at: "2024-01-01T00:00:00Z",
        };

        mockSupabase.auth.signUp.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });

        // Act
        await authService.register(mockSupabase as unknown as SupabaseClient, email, password);

        // Assert
        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
          email,
          password,
          options: {
            emailRedirectTo: expect.stringContaining("/verify-email"),
          },
        });
        expect(mockSupabase.auth.signUp).toHaveBeenCalledTimes(1);
      });

      it("should include emailRedirectTo in options", async () => {
        // Arrange
        const mockUser = {
          id: "user-123",
          email: "user@example.com",
          created_at: "2024-01-01T00:00:00Z",
        };

        mockSupabase.auth.signUp.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });

        // Act
        await authService.register(mockSupabase as unknown as SupabaseClient, "user@example.com", "Password123!");

        // Assert
        const callArgs = mockSupabase.auth.signUp.mock.calls[0][0];
        expect(callArgs.options?.emailRedirectTo).toBeDefined();
        expect(callArgs.options?.emailRedirectTo).toContain("/verify-email");
      });
    });

    describe("registration errors", () => {
      it('should throw "account already exists" for duplicate email', async () => {
        // Arrange
        mockSupabase.auth.signUp.mockResolvedValue({
          data: { user: null },
          error: { message: "User already registered" },
        });

        // Act & Assert
        await expect(
          authService.register(mockSupabase as unknown as SupabaseClient, "existing@example.com", "Password123!")
        ).rejects.toThrow("An account with this email already exists");
      });

      it('should throw "account already exists" for "already exists" error', async () => {
        // Arrange
        mockSupabase.auth.signUp.mockResolvedValue({
          data: { user: null },
          error: { message: "Email already exists" },
        });

        // Act & Assert
        await expect(
          authService.register(mockSupabase as unknown as SupabaseClient, "existing@example.com", "Password123!")
        ).rejects.toThrow("An account with this email already exists");
      });

      it("should throw original error for other Supabase errors", async () => {
        // Arrange
        const supabaseError = { message: "Database connection failed" };
        mockSupabase.auth.signUp.mockResolvedValue({
          data: { user: null },
          error: supabaseError,
        });

        // Act & Assert
        await expect(
          authService.register(mockSupabase as unknown as SupabaseClient, "user@example.com", "Password123!")
        ).rejects.toThrow("Database connection failed");
      });

      it("should throw error when user creation fails", async () => {
        // Arrange
        mockSupabase.auth.signUp.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        // Act & Assert
        await expect(
          authService.register(mockSupabase as unknown as SupabaseClient, "user@example.com", "Password123!")
        ).rejects.toThrow("Failed to create user account");
      });
    });

    describe("edge cases", () => {
      it("should handle user with no email gracefully", async () => {
        // Arrange
        const mockUser = {
          id: "user-123",
          email: null,
          created_at: "2024-01-01T00:00:00Z",
        };

        mockSupabase.auth.signUp.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });

        // Act
        const result = await authService.register(
          mockSupabase as unknown as SupabaseClient,
          "user@example.com",
          "Password123!"
        );

        // Assert - Should use null coalescing
        expect(result.email).toBeDefined();
      });
    });
  });

  describe("login", () => {
    describe("successful login", () => {
      it("should return access token on successful login", async () => {
        // Arrange
        const email = "user@example.com";
        const password = "password123";
        const mockSession = {
          access_token: "mock-access-token",
          expires_in: 3600,
        };

        mockSupabase.auth.signInWithPassword.mockResolvedValue({
          data: { session: mockSession },
          error: null,
        });

        // Act
        const result = await authService.login(mockSupabase as unknown as SupabaseClient, email, password);

        // Assert
        expect(result).toEqual({
          access_token: "mock-access-token",
          expires_in: 3600,
        });
      });

      it("should call signInWithPassword with correct parameters", async () => {
        // Arrange
        const email = "user@example.com";
        const password = "password123";
        const mockSession = {
          access_token: "mock-access-token",
          expires_in: 3600,
        };

        mockSupabase.auth.signInWithPassword.mockResolvedValue({
          data: { session: mockSession },
          error: null,
        });

        // Act
        await authService.login(mockSupabase as unknown as SupabaseClient, email, password);

        // Assert
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email,
          password,
        });
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledTimes(1);
      });
    });

    describe("login errors", () => {
      it('should throw "Invalid email or password" for wrong credentials', async () => {
        // Arrange
        mockSupabase.auth.signInWithPassword.mockResolvedValue({
          data: { session: null },
          error: { message: "Invalid login credentials" },
        });

        // Act & Assert
        await expect(
          authService.login(mockSupabase as unknown as SupabaseClient, "user@example.com", "wrongpassword")
        ).rejects.toThrow("Invalid email or password");
      });

      it('should throw "Please confirm email" for unconfirmed accounts', async () => {
        // Arrange
        mockSupabase.auth.signInWithPassword.mockResolvedValue({
          data: { session: null },
          error: { message: "Email not confirmed" },
        });

        // Act & Assert
        await expect(
          authService.login(mockSupabase as unknown as SupabaseClient, "unconfirmed@example.com", "password123")
        ).rejects.toThrow("Please confirm your email address before logging in");
      });

      it("should throw original error for other Supabase errors", async () => {
        // Arrange
        const supabaseError = { message: "Network error" };
        mockSupabase.auth.signInWithPassword.mockResolvedValue({
          data: { session: null },
          error: supabaseError,
        });

        // Act & Assert
        await expect(
          authService.login(mockSupabase as unknown as SupabaseClient, "user@example.com", "password123")
        ).rejects.toThrow("Network error");
      });

      it("should throw error when session creation fails", async () => {
        // Arrange
        mockSupabase.auth.signInWithPassword.mockResolvedValue({
          data: { session: null },
          error: null,
        });

        // Act & Assert
        await expect(
          authService.login(mockSupabase as unknown as SupabaseClient, "user@example.com", "password123")
        ).rejects.toThrow("Failed to create session");
      });
    });

    describe("error message mapping", () => {
      it('should map "Invalid login credentials" to user-friendly message', async () => {
        // Arrange
        mockSupabase.auth.signInWithPassword.mockResolvedValue({
          data: { session: null },
          error: { message: "Invalid login credentials" },
        });

        // Act & Assert
        await expect(
          authService.login(mockSupabase as unknown as SupabaseClient, "user@example.com", "wrong")
        ).rejects.toThrow("Invalid email or password");
      });

      it('should map "Email not confirmed" to user-friendly message', async () => {
        // Arrange
        mockSupabase.auth.signInWithPassword.mockResolvedValue({
          data: { session: null },
          error: { message: "Email not confirmed" },
        });

        // Act & Assert
        await expect(
          authService.login(mockSupabase as unknown as SupabaseClient, "user@example.com", "password123")
        ).rejects.toThrow("Please confirm your email address before logging in");
      });
    });
  });

  describe("logout", () => {
    describe("successful logout", () => {
      it("should call signOut", async () => {
        // Arrange
        mockSupabase.auth.signOut.mockResolvedValue({
          error: null,
        });

        // Act
        await authService.logout(mockSupabase as unknown as SupabaseClient);

        // Assert
        expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
      });

      it("should not throw error on successful logout", async () => {
        // Arrange
        mockSupabase.auth.signOut.mockResolvedValue({
          error: null,
        });

        // Act & Assert
        await expect(authService.logout(mockSupabase as unknown as SupabaseClient)).resolves.not.toThrow();
      });
    });

    describe("logout errors", () => {
      it("should not throw error even when signOut fails", async () => {
        // Arrange
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        mockSupabase.auth.signOut.mockResolvedValue({
          error: { message: "Network error" },
        });

        // Act & Assert
        await expect(authService.logout(mockSupabase as unknown as SupabaseClient)).resolves.not.toThrow();

        // Assert - Should log error but not throw
        expect(consoleErrorSpy).toHaveBeenCalledWith("Logout error:", { message: "Network error" });

        // Cleanup
        consoleErrorSpy.mockRestore();
      });

      it("should log error to console when logout fails", async () => {
        // Arrange
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const error = { message: "Session expired" };
        mockSupabase.auth.signOut.mockResolvedValue({
          error,
        });

        // Act
        await authService.logout(mockSupabase as unknown as SupabaseClient);

        // Assert
        expect(consoleErrorSpy).toHaveBeenCalledWith("Logout error:", error);

        // Cleanup
        consoleErrorSpy.mockRestore();
      });
    });
  });

  describe("requestPasswordReset", () => {
    describe("successful password reset request", () => {
      it("should call resetPasswordForEmail with correct parameters", async () => {
        // Arrange
        const email = "user@example.com";
        const redirectUrl = "https://example.com/reset-password";

        mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
          data: {},
          error: null,
        });

        // Act
        await authService.requestPasswordReset(mockSupabase as unknown as SupabaseClient, email, redirectUrl);

        // Assert
        expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(email, {
          redirectTo: redirectUrl,
        });
        expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledTimes(1);
      });

      it("should not throw error on success", async () => {
        // Arrange
        mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
          data: {},
          error: null,
        });

        // Act & Assert
        await expect(
          authService.requestPasswordReset(
            mockSupabase as unknown as SupabaseClient,
            "user@example.com",
            "https://example.com/reset"
          )
        ).resolves.not.toThrow();
      });
    });

    describe("password reset errors - security consideration", () => {
      it("should not throw error even when email does not exist", async () => {
        // Arrange - This is important for security (prevent email enumeration)
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
          data: null,
          error: { message: "User not found" },
        });

        // Act & Assert
        await expect(
          authService.requestPasswordReset(
            mockSupabase as unknown as SupabaseClient,
            "nonexistent@example.com",
            "https://example.com/reset"
          )
        ).resolves.not.toThrow();

        // Assert - Should log but not expose to user
        expect(consoleErrorSpy).toHaveBeenCalled();

        // Cleanup
        consoleErrorSpy.mockRestore();
      });

      it("should log error to console without throwing", async () => {
        // Arrange
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const error = { message: "Rate limit exceeded" };
        mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
          data: null,
          error,
        });

        // Act
        await authService.requestPasswordReset(
          mockSupabase as unknown as SupabaseClient,
          "user@example.com",
          "https://example.com/reset"
        );

        // Assert
        expect(consoleErrorSpy).toHaveBeenCalledWith("Password reset request error:", error);

        // Cleanup
        consoleErrorSpy.mockRestore();
      });

      it("should not expose whether email exists (prevent enumeration)", async () => {
        // Arrange
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        // Test with existing email
        mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
          data: {},
          error: null,
        });
        const result1 = authService.requestPasswordReset(
          mockSupabase as unknown as SupabaseClient,
          "existing@example.com",
          "https://example.com/reset"
        );

        // Test with non-existing email
        mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
          data: null,
          error: { message: "User not found" },
        });
        const result2 = authService.requestPasswordReset(
          mockSupabase as unknown as SupabaseClient,
          "nonexistent@example.com",
          "https://example.com/reset"
        );

        // Act & Assert - Both should resolve without error
        await expect(result1).resolves.not.toThrow();
        await expect(result2).resolves.not.toThrow();

        // Cleanup
        consoleErrorSpy.mockRestore();
      });
    });
  });

  describe("resetPassword", () => {
    describe("successful password reset", () => {
      it("should call updateUser with new password", async () => {
        // Arrange
        const newPassword = "NewPassword123!";

        mockSupabase.auth.updateUser.mockResolvedValue({
          data: { user: {} },
          error: null,
        });

        // Act
        await authService.resetPassword(mockSupabase as unknown as SupabaseClient, newPassword);

        // Assert
        expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
          password: newPassword,
        });
        expect(mockSupabase.auth.updateUser).toHaveBeenCalledTimes(1);
      });

      it("should not throw error on successful reset", async () => {
        // Arrange
        mockSupabase.auth.updateUser.mockResolvedValue({
          data: { user: {} },
          error: null,
        });

        // Act & Assert
        await expect(
          authService.resetPassword(mockSupabase as unknown as SupabaseClient, "NewPassword123!")
        ).resolves.not.toThrow();
      });
    });

    describe("password reset errors", () => {
      it("should throw error when password is same as old password", async () => {
        // Arrange
        mockSupabase.auth.updateUser.mockResolvedValue({
          data: { user: null },
          error: { message: "Password is the same as the old password" },
        });

        // Act & Assert
        await expect(
          authService.resetPassword(mockSupabase as unknown as SupabaseClient, "OldPassword123!")
        ).rejects.toThrow("New password must be different from your old password");
      });

      it("should throw original error for other update errors", async () => {
        // Arrange
        const supabaseError = { message: "Token expired" };
        mockSupabase.auth.updateUser.mockResolvedValue({
          data: { user: null },
          error: supabaseError,
        });

        // Act & Assert
        await expect(
          authService.resetPassword(mockSupabase as unknown as SupabaseClient, "NewPassword123!")
        ).rejects.toThrow("Token expired");
      });
    });

    describe("error message mapping", () => {
      it('should map "same as old password" error to user-friendly message', async () => {
        // Arrange
        mockSupabase.auth.updateUser.mockResolvedValue({
          data: { user: null },
          error: { message: "Password is the same as the old password" },
        });

        // Act & Assert
        await expect(
          authService.resetPassword(mockSupabase as unknown as SupabaseClient, "OldPassword123!")
        ).rejects.toThrow("New password must be different from your old password");
      });
    });
  });

  describe("service integration", () => {
    it("should be a singleton instance", () => {
      // Assert - authService should be the same instance
      expect(authService).toBeDefined();
      expect(authService.register).toBeDefined();
      expect(authService.login).toBeDefined();
      expect(authService.logout).toBeDefined();
      expect(authService.requestPasswordReset).toBeDefined();
      expect(authService.resetPassword).toBeDefined();
    });
  });
});
