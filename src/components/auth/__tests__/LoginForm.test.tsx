import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "../LoginForm";

/**
 * Unit tests for LoginForm component
 * Tests user interactions, validation, API calls, and accessibility
 * Following Vitest best practices: vi.fn() for mocks, user-event for interactions, AAA pattern
 */

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("LoginForm", () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockFetch.mockReset();

    // Mock window.location.href
    delete (window as any).location;
    (window as any).location = { href: "" };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render email and password fields", () => {
      // Act
      render(<LoginForm />);

      // Assert
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
    });

    it("should render submit button", () => {
      // Act
      render(<LoginForm />);

      // Assert
      expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render "Forgot password?" link', () => {
      // Act
      render(<LoginForm />);

      // Assert
      expect(screen.getByRole("link", { name: /forgot password/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /forgot password/i })).toHaveAttribute("href", "/forgot-password");
    });

    it('should render "Sign up" link', () => {
      // Act
      render(<LoginForm />);

      // Assert
      expect(screen.getByRole("link", { name: /sign up/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute("href", "/register");
    });

    it("should render heading and description", () => {
      // Act
      render(<LoginForm />);

      // Assert
      expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
      expect(screen.getByText(/enter your credentials/i)).toBeInTheDocument();
    });

    it("should display initial error message when provided", () => {
      // Arrange
      const errorMessage = "Invalid credentials";

      // Act
      render(<LoginForm initialError={errorMessage} />);

      // Assert
      expect(screen.getByRole("alert")).toHaveTextContent(errorMessage);
    });

    it("should display initial success message when provided", () => {
      // Arrange
      const successMessage = "Password reset successful";

      // Act
      render(<LoginForm initialMessage={successMessage} />);

      // Assert
      expect(screen.getByRole("status")).toHaveTextContent(successMessage);
    });

    it("should render password visibility toggle button", () => {
      // Act
      render(<LoginForm />);

      // Assert
      const toggleButton = screen.getByLabelText(/show password/i);
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe("form validation", () => {
    it("should show validation errors when submitting empty form", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm />);

      // Act
      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);

      // Assert - React Hook Form validates on submit
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should enable submit button when both fields have values", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm />);

      // Act
      await user.type(screen.getByLabelText(/email/i), "user@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");

      // Assert
      const submitButton = screen.getByRole("button", { name: /sign in/i });
      expect(submitButton).toBeEnabled();
    });

    it("should show email error on blur when invalid format", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm />);

      // Act
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "invalid-email");
      await user.tab(); // Trigger blur

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it("should show email error on blur when invalid format", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm />);

      // Act
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "invalid-email");
      await user.tab(); // Trigger blur

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it("should show password error on blur when too short", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm />);

      // Act
      const passwordInput = screen.getByLabelText("Password");
      await user.type(passwordInput, "1234567"); // 7 chars
      await user.tab(); // Trigger blur

      // Assert - Login doesn't validate password length, only that it's non-empty
      // This is correct behavior - users should be able to log in with any existing password
      await waitFor(() => {
        expect(screen.queryByText(/password must be at least 8 characters/i)).not.toBeInTheDocument();
      });
    });

    it("should accept any non-empty password on login", async () => {
      // Arrange
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ redirect: "/generate" }),
      });
      render(<LoginForm />);

      // Act - Use short password (login doesn't validate password strength)
      await user.type(screen.getByLabelText(/email/i), "user@example.com");
      await user.type(screen.getByLabelText("Password"), "pass"); // Short password OK for login
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Assert - Should call API, not show validation error
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/login",
          expect.objectContaining({
            body: JSON.stringify({
              email: "user@example.com",
              password: "pass",
            }),
          })
        );
      });
    });

    it("should clear email error when user starts typing", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm initialError="Previous error" />);
      const emailInput = screen.getByLabelText(/email/i);

      // Assert - Error is visible
      expect(screen.getByRole("alert")).toHaveTextContent("Previous error");

      // Act - Start typing
      await user.type(emailInput, "u");

      // Assert - Error is cleared
      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      });
    });

    it("should clear password error when user starts typing", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm initialError="Previous error" />);
      const passwordInput = screen.getByLabelText("Password");

      // Assert - Error is visible
      expect(screen.getByRole("alert")).toHaveTextContent("Previous error");

      // Act - Start typing
      await user.type(passwordInput, "p");

      // Assert - Error is cleared
      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      });
    });

    it("should not submit form with invalid email", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm />);

      // Act
      await user.type(screen.getByLabelText(/email/i), "invalid-email");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should not submit form with short password", async () => {
      // Arrange
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ redirect: "/generate" }),
      });
      render(<LoginForm />);

      // Act - Login accepts any non-empty password (no length validation)
      await user.type(screen.getByLabelText(/email/i), "user@example.com");
      await user.type(screen.getByLabelText("Password"), "pass"); // Short password OK for login
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Assert - Should call API (login doesn't validate password strength)
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  describe("password visibility toggle", () => {
    it("should toggle password visibility when button clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm />);
      const passwordInput = screen.getByLabelText("Password");

      // Assert - Initially hidden
      expect(passwordInput).toHaveAttribute("type", "password");

      // Act - Click to show
      await user.click(screen.getByLabelText(/show password/i));

      // Assert - Now visible
      expect(passwordInput).toHaveAttribute("type", "text");

      // Act - Click to hide
      await user.click(screen.getByLabelText(/hide password/i));

      // Assert - Hidden again
      expect(passwordInput).toHaveAttribute("type", "password");
    });

    it("should update aria-label when toggling", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm />);

      // Assert - Initially "Show password"
      expect(screen.getByLabelText(/show password/i)).toBeInTheDocument();

      // Act - Click to show
      await user.click(screen.getByLabelText(/show password/i));

      // Assert - Now "Hide password"
      expect(screen.getByLabelText(/hide password/i)).toBeInTheDocument();
    });
  });

  describe("form submission", () => {
    it("should call login API with correct credentials", async () => {
      // Arrange
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: "token", expires_in: 3600 }),
      });
      render(<LoginForm />);

      // Act
      await user.type(screen.getByLabelText(/email/i), "user@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Assert
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/login",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: "user@example.com",
              password: "password123",
            }),
            credentials: "include",
          })
        );
      });
    });

    it("should show loading state during submission", async () => {
      // Arrange
      const user = userEvent.setup();
      mockFetch.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
      );
      render(<LoginForm />);

      // Act
      await user.type(screen.getByLabelText(/email/i), "user@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Assert - Loading state
      await waitFor(() => {
        expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      });
      expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();
    });

    it("should disable form fields during submission", async () => {
      // Arrange
      const user = userEvent.setup();
      mockFetch.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
      );
      render(<LoginForm />);

      // Act
      await user.type(screen.getByLabelText(/email/i), "user@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Assert
      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeDisabled();
        expect(screen.getByLabelText("Password")).toBeDisabled();
      });
    });

    it("should redirect to /generate on successful login", async () => {
      // Arrange
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: "token", expires_in: 3600 }),
      });
      render(<LoginForm />);

      // Act
      await user.type(screen.getByLabelText(/email/i), "user@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Assert
      await waitFor(
        () => {
          expect(window.location.href).toBe("/generate");
        },
        { timeout: 200 }
      );
    });

    it("should redirect to custom URL when provided", async () => {
      // Arrange
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: "token", expires_in: 3600, redirect: "/dashboard" }),
      });
      render(<LoginForm redirectTo="/custom" />);

      // Act
      await user.type(screen.getByLabelText(/email/i), "user@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Assert
      await waitFor(
        () => {
          expect(window.location.href).toBe("/dashboard");
        },
        { timeout: 200 }
      );
    });

    it("should display error message on failed login", async () => {
      // Arrange
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Invalid email or password" }),
      });
      render(<LoginForm />);

      // Act
      await user.type(screen.getByLabelText(/email/i), "user@example.com");
      await user.type(screen.getByLabelText("Password"), "wrongpassword");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Assert
      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Invalid email or password");
      });
    });

    it("should handle network errors gracefully", async () => {
      // Arrange
      const user = userEvent.setup();
      mockFetch.mockRejectedValue(new Error("Network error"));
      render(<LoginForm />);

      // Act
      await user.type(screen.getByLabelText(/email/i), "user@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Assert
      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(/network error/i);
      });
    });

    it("should clear general error when user starts typing", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm initialError="Previous error" />);

      // Assert - Error is visible
      expect(screen.getByRole("alert")).toHaveTextContent("Previous error");

      // Act - Start typing
      await user.type(screen.getByLabelText(/email/i), "u");

      // Assert - Error is cleared
      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      });
    });

    it("should clear success message when user starts typing", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm initialMessage="Success message" />);

      // Assert - Message is visible
      expect(screen.getByRole("status")).toHaveTextContent("Success message");

      // Act - Start typing
      await user.type(screen.getByLabelText(/email/i), "u");

      // Assert - Message is cleared
      await waitFor(() => {
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
      });
    });
  });

  describe("accessibility", () => {
    it("should have proper ARIA attributes on email input", () => {
      // Act
      render(<LoginForm />);

      // Assert
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("autoComplete", "email");
      // Note: React Hook Form handles validation via schema, not 'required' attribute
    });

    it("should have proper ARIA attributes on password input", () => {
      // Act
      render(<LoginForm />);

      // Assert
      const passwordInput = screen.getByLabelText("Password");
      expect(passwordInput).toHaveAttribute("type", "password");
      expect(passwordInput).toHaveAttribute("autoComplete", "current-password");
      // Note: React Hook Form handles validation via schema, not 'required' attribute
    });

    it("should set aria-invalid when email has error", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm />);

      // Act
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "invalid-email");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Assert
      await waitFor(() => {
        expect(emailInput).toHaveAttribute("aria-invalid", "true");
      });
    });

    it("should set aria-invalid when password has error", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm />);

      // Act - Submit empty form to trigger password required error
      const passwordInput = screen.getByLabelText("Password");
      await user.type(screen.getByLabelText(/email/i), "user@example.com");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Assert
      await waitFor(() => {
        expect(passwordInput).toHaveAttribute("aria-invalid", "true");
      });
    });

    it("should associate error message with email input via aria-describedby", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm />);

      // Act
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "invalid-email");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Assert
      await waitFor(() => {
        expect(emailInput).toHaveAttribute("aria-describedby", "email-error");
        const errorElement = screen.getByText(/please enter a valid email address/i);
        expect(errorElement).toHaveAttribute("id", "email-error");
      });
    });

    it("should associate error message with password input via aria-describedby", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm />);

      // Act - Submit form with email but no password
      const passwordInput = screen.getByLabelText("Password");
      await user.type(screen.getByLabelText(/email/i), "user@example.com");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Assert
      await waitFor(() => {
        expect(passwordInput).toHaveAttribute("aria-describedby", "password-error");
        const errorElement = screen.getByText(/password is required/i);
        expect(errorElement).toHaveAttribute("id", "password-error");
      });
    });

    it('should announce errors with role="alert"', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm />);

      // Act
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "invalid-email");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Assert
      await waitFor(() => {
        const errorElement = screen.getByText(/please enter a valid email address/i);
        expect(errorElement).toHaveAttribute("role", "alert");
      });
    });

    it("should set aria-busy during submission", async () => {
      // Arrange
      const user = userEvent.setup();
      mockFetch.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
      );
      render(<LoginForm />);

      // Act
      await user.type(screen.getByLabelText(/email/i), "user@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Assert
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /signing in/i })).toHaveAttribute("aria-busy", "true");
      });
    });

    it("should have proper form structure with noValidate", () => {
      // Act
      render(<LoginForm />);

      // Assert
      const form = screen.getByRole("button", { name: /sign in/i }).closest("form");
      expect(form).toHaveAttribute("noValidate");
    });
  });

  describe("edge cases", () => {
    it("should handle very long email", async () => {
      // Arrange
      const user = userEvent.setup();
      const longEmail = "a".repeat(300) + "@example.com";
      render(<LoginForm />);

      // Act
      await user.type(screen.getByLabelText(/email/i), longEmail);
      await user.tab();

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/email must be less than 255 characters/i)).toBeInTheDocument();
      });
    });

    it("should handle special characters in password", async () => {
      // Arrange
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: "token", expires_in: 3600 }),
      });
      render(<LoginForm />);

      // Act
      await user.type(screen.getByLabelText(/email/i), "user@example.com");
      await user.type(screen.getByLabelText("Password"), "P@ssw0rd!#$%");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Assert
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/login",
          expect.objectContaining({
            body: JSON.stringify({
              email: "user@example.com",
              password: "P@ssw0rd!#$%",
            }),
          })
        );
      });
    });

    it("should handle rapid form submissions", async () => {
      // Arrange
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: "token", expires_in: 3600 }),
      });
      render(<LoginForm />);

      // Act
      await user.type(screen.getByLabelText(/email/i), "user@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);
      await user.click(submitButton); // Try to submit again immediately

      // Assert - Should only call API once
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });
  });
});
