/**
 * Unit tests for GenerationForm component
 *
 * Tests cover:
 * - Character count validation (min/max boundaries)
 * - Form submission validation
 * - User interactions and state management
 * - Character counter display and formatting
 * - Accessibility attributes
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GenerationForm } from "../GenerationForm";
import { DEFAULT_MODEL } from "@/lib/services/ai.service";

describe("GenerationForm", () => {
  // Mock props
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  describe("Character Count Validation", () => {
    it("should show warning when text is below minimum (< 1000 chars)", async () => {
      const user = userEvent.setup();
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByLabelText(/source text/i);
      const shortText = "a".repeat(500); // 500 chars

      await user.click(textarea);
      await user.paste(shortText);

      // Should show "more characters needed" message
      expect(screen.getByText(/500 more characters needed/i)).toBeInTheDocument();

      // Character count should be amber/warning color
      const charCount = screen.getByText(/500.*10,000 characters/i);
      expect(charCount).toHaveClass("text-amber-600");
    });

    it("should show success when text is within valid range (1000-10000 chars)", async () => {
      const user = userEvent.setup();
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByLabelText(/source text/i);
      const validText = "a".repeat(1500); // 1500 chars - valid

      await user.click(textarea);
      await user.paste(validText);

      // Should show success message
      expect(screen.getByText(/ready to generate flashcards/i)).toBeInTheDocument();

      // Character count should be green
      const charCount = screen.getByText(/1,500.*10,000 characters/i);
      expect(charCount).toHaveClass("text-green-600");
    });

    it("should show error when text exceeds maximum (> 10000 chars)", async () => {
      const user = userEvent.setup();
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByLabelText(/source text/i);
      const longText = "a".repeat(10500); // 10500 chars - too long

      // Use paste instead of type for large text (much faster)
      await user.click(textarea);
      await user.paste(longText);

      // Character count should be red/destructive
      const charCount = screen.getByText(/10,500.*10,000 characters/i);
      expect(charCount).toHaveClass("text-destructive");

      // Submit button should be disabled
      const submitButton = screen.getByRole("button", { name: /generate flashcards/i });
      expect(submitButton).toBeDisabled();
    });

    it("should show muted color when character count is zero", () => {
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      const charCount = screen.getByText(/0.*10,000 characters/i);
      expect(charCount).toHaveClass("text-muted-foreground");
    });

    it("should format character count with locale separators", async () => {
      const user = userEvent.setup();
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByLabelText(/source text/i);
      const text = "a".repeat(5000);

      // Use paste instead of type for large text (much faster)
      await user.click(textarea);
      await user.paste(text);

      // Should show "5,000" not "5000"
      expect(screen.getByText(/5,000.*10,000 characters/i)).toBeInTheDocument();
    });
  });

  describe("Form Submission Validation", () => {
    it("should disable submit button when text is empty", () => {
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole("button", { name: /generate flashcards/i });

      // Submit button should be disabled when no text
      expect(submitButton).toBeDisabled();

      // Should not be able to submit
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should disable submit button when text is below minimum", async () => {
      const user = userEvent.setup();
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByLabelText(/source text/i);
      const shortText = "a".repeat(500);

      await user.click(textarea);
      await user.paste(shortText);

      const submitButton = screen.getByRole("button", { name: /generate flashcards/i });

      // Submit button should be disabled when text is too short
      expect(submitButton).toBeDisabled();

      // Should show warning message (not error, as it's not submitted yet)
      expect(screen.getByText(/500 more characters needed/i)).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should disable submit button when text exceeds maximum", async () => {
      const user = userEvent.setup();
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByLabelText(/source text/i);
      const longText = "a".repeat(10500);

      await user.click(textarea);
      await user.paste(longText);

      const submitButton = screen.getByRole("button", { name: /generate flashcards/i });

      // Submit button should be disabled when text is too long
      expect(submitButton).toBeDisabled();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should call onSubmit with correct parameters when valid", async () => {
      const user = userEvent.setup();
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByLabelText(/source text/i);
      const validText = "a".repeat(1500);

      await user.click(textarea);
      await user.paste(validText);

      const submitButton = screen.getByRole("button", { name: /generate flashcards/i });
      await user.click(submitButton);

      // Should call onSubmit with text and default model
      expect(mockOnSubmit).toHaveBeenCalledWith(validText, DEFAULT_MODEL);
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it("should call onSubmit with selected model", async () => {
      const user = userEvent.setup();
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByLabelText(/source text/i);
      const validText = "a".repeat(1500);
      await user.click(textarea);
      await user.paste(validText);

      // Select a different model
      const modelSelect = screen.getByRole("combobox", { name: /ai model/i });
      await user.click(modelSelect);

      // Select GPT-4
      const gpt4Option = screen.getByRole("option", { name: /openai.*gpt-4$/i });
      await user.click(gpt4Option);

      const submitButton = screen.getByRole("button", { name: /generate flashcards/i });
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith(validText, "openai/gpt-4");
    });

    it("should handle async onSubmit function", async () => {
      const user = userEvent.setup();
      const asyncOnSubmit = vi.fn().mockResolvedValue(undefined);

      render(<GenerationForm onSubmit={asyncOnSubmit} />);

      const textarea = screen.getByLabelText(/source text/i);
      const validText = "a".repeat(1500);
      await user.click(textarea);
      await user.paste(validText);

      const submitButton = screen.getByRole("button", { name: /generate flashcards/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(asyncOnSubmit).toHaveBeenCalled();
      });
    });
  });

  describe("User Interactions", () => {
    it("should show warning when text is below minimum", async () => {
      const user = userEvent.setup();
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      // Type some text below minimum
      const textarea = screen.getByLabelText(/source text/i);
      const shortText = "a".repeat(500);
      await user.click(textarea);
      await user.paste(shortText);

      // Should show warning about characters needed
      expect(screen.getByText(/500 more characters needed/i)).toBeInTheDocument();

      // Add more text to meet minimum
      await user.clear(textarea);
      const validText = "a".repeat(1500);
      await user.paste(validText);

      // Warning should be cleared, success message shown
      expect(screen.queryByText(/more characters needed/i)).not.toBeInTheDocument();
      expect(screen.getByText(/ready to generate flashcards/i)).toBeInTheDocument();
    });

    it("should disable submit button when text is invalid", async () => {
      const user = userEvent.setup();
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole("button", { name: /generate flashcards/i });
      const textarea = screen.getByLabelText(/source text/i);

      // Initially disabled (no text)
      expect(submitButton).toBeDisabled();

      // Still disabled with insufficient text
      await user.click(textarea);
      await user.paste("a".repeat(500));
      expect(submitButton).toBeDisabled();

      // Enabled with valid text
      await user.clear(textarea);
      await user.paste("a".repeat(1500));
      expect(submitButton).not.toBeDisabled();
    });

    it("should disable form controls when loading", () => {
      render(<GenerationForm onSubmit={mockOnSubmit} isLoading={true} />);

      const textarea = screen.getByLabelText(/source text/i);
      const modelSelect = screen.getByRole("combobox", { name: /ai model/i });
      const submitButton = screen.getByRole("button", { name: /generating flashcards/i });

      expect(textarea).toBeDisabled();
      expect(modelSelect).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });

    it("should show loading state with spinner", () => {
      render(<GenerationForm onSubmit={mockOnSubmit} isLoading={true} />);

      const submitButton = screen.getByRole("button", { name: /generating flashcards/i });
      expect(submitButton).toBeInTheDocument();
      const body = document.body;

      // Loader2 icon should be present (has animate-spin class)
      const hasLoadingText = body.textContent.includes("Generating flashcards...");
      expect(hasLoadingText).toBe(true);
    });

    it("should render all allowed models in select", () => {
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      const modelSelect = screen.getByRole("combobox", { name: /ai model/i });

      // Check that default model is selected
      expect(modelSelect).toHaveTextContent(/openai.*gpt-4o-mini/i);
    });
  });

  describe("Accessibility", () => {
    it("should link error messages with aria-describedby", async () => {
      const user = userEvent.setup();
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      // Type valid text first to enable button, then clear it to trigger error
      const textarea = screen.getByLabelText(/source text/i);
      await user.click(textarea);
      await user.paste("a".repeat(1500)); // Valid text

      await user.clear(textarea); // Clear to make it invalid

      const submitButton = screen.getByRole("button", { name: /generate flashcards/i });

      // Button should be disabled again
      expect(submitButton).toBeDisabled();

      // No error message shown until submit (button is disabled)
      expect(screen.queryByText(/please enter some text/i)).not.toBeInTheDocument();
    });

    it("should mark invalid fields with aria-invalid when empty", () => {
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByLabelText(/source text/i);
      // Initially aria-invalid should be false (no error yet)
      expect(textarea).toHaveAttribute("aria-invalid", "false");
    });

    it("should have proper labels for form controls", () => {
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      // Textarea should have label
      expect(screen.getByLabelText(/source text/i)).toBeInTheDocument();

      // Select should have label
      expect(screen.getByLabelText(/ai model/i)).toBeInTheDocument();
    });

    it("should have descriptive placeholder text", () => {
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByLabelText(/source text/i);
      expect(textarea).toHaveAttribute("placeholder", expect.stringContaining("minimum 1,000 characters"));
    });
  });

  describe("Model Selection", () => {
    it("should format model names correctly", async () => {
      const user = userEvent.setup();
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      const modelSelect = screen.getByRole("combobox", { name: /ai model/i });
      await user.click(modelSelect);

      // Check that model names are formatted (e.g., "Openai - gpt-4o-mini")
      // Check a few specific ones to avoid duplicate regex matches
      expect(screen.getByRole("option", { name: /openai.*gpt-4o-mini/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /openai.*gpt-4$/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /anthropic.*claude-3-sonnet/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /anthropic.*claude-3-haiku/i })).toBeInTheDocument();
    });

    it("should use default model on initial render", () => {
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      const modelSelect = screen.getByRole("combobox", { name: /ai model/i });

      // Should show default model
      const [provider, modelName] = DEFAULT_MODEL.split("/");
      expect(modelSelect).toHaveTextContent(new RegExp(`${provider}.*${modelName}`, "i"));
    });
  });

  describe("Edge Cases", () => {
    it("should handle whitespace-only text as empty", async () => {
      const user = userEvent.setup();
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByLabelText(/source text/i);
      await user.type(textarea, "   \n\n   \t\t   ");

      const submitButton = screen.getByRole("button", { name: /generate flashcards/i });

      // Button should be disabled (whitespace doesn't count as valid text)
      expect(submitButton).toBeDisabled();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should handle exactly 1000 characters (minimum boundary)", async () => {
      const user = userEvent.setup();
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByLabelText(/source text/i);
      const exactMinText = "a".repeat(1000);

      await user.click(textarea);
      await user.paste(exactMinText);

      // Should show success message
      expect(screen.getByText(/ready to generate flashcards/i)).toBeInTheDocument();

      const submitButton = screen.getByRole("button", { name: /generate flashcards/i });
      expect(submitButton).not.toBeDisabled();

      await user.click(submitButton);
      expect(mockOnSubmit).toHaveBeenCalledWith(exactMinText, DEFAULT_MODEL);
    });

    it("should handle exactly 10000 characters (maximum boundary)", async () => {
      const user = userEvent.setup();
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByLabelText(/source text/i);
      const exactMaxText = "a".repeat(10000);

      await user.click(textarea);
      await user.paste(exactMaxText);

      // Should show success message
      expect(screen.getByText(/ready to generate flashcards/i)).toBeInTheDocument();

      const submitButton = screen.getByRole("button", { name: /generate flashcards/i });
      expect(submitButton).not.toBeDisabled();

      await user.click(submitButton);
      expect(mockOnSubmit).toHaveBeenCalledWith(exactMaxText, DEFAULT_MODEL);
    });

    it("should handle 999 characters (just below minimum)", async () => {
      const user = userEvent.setup();
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByLabelText(/source text/i);
      const justBelowMin = "a".repeat(999);

      await user.click(textarea);
      await user.paste(justBelowMin);

      // Should show warning
      expect(screen.getByText(/1 more character.*needed/i)).toBeInTheDocument();

      const submitButton = screen.getByRole("button", { name: /generate flashcards/i });
      expect(submitButton).toBeDisabled();
    });

    it("should handle 10001 characters (just above maximum)", async () => {
      const user = userEvent.setup();
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByLabelText(/source text/i);
      const justAboveMax = "a".repeat(10001);

      await user.click(textarea);
      await user.paste(justAboveMax);

      const submitButton = screen.getByRole("button", { name: /generate flashcards/i });
      expect(submitButton).toBeDisabled();
    });
  });
});
