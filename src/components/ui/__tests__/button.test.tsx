/**
 * Unit tests for Button component
 *
 * Tests cover:
 * - Variant rendering
 * - Size variants
 * - Disabled state
 * - AsChild prop
 * - Accessibility
 * - Event handlers
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../button";

describe("Button Component", () => {
  describe("Basic Rendering", () => {
    it("should render button with text", () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
    });

    it("should render as button element by default", () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole("button");
      expect(button.tagName).toBe("BUTTON");
    });

    it("should apply data-slot attribute", () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("data-slot", "button");
    });
  });

  describe("Variant Prop", () => {
    it("should render default variant", () => {
      render(<Button variant="default">Default</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-primary");
      expect(button).toHaveClass("text-primary-foreground");
    });

    it("should render destructive variant", () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-destructive");
      expect(button).toHaveClass("text-white");
    });

    it("should render outline variant", () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("border");
      expect(button).toHaveClass("bg-background");
    });

    it("should render secondary variant", () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-secondary");
      expect(button).toHaveClass("text-secondary-foreground");
    });

    it("should render ghost variant", () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("hover:bg-accent");
    });

    it("should render link variant", () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-primary");
      expect(button).toHaveClass("underline-offset-4");
    });

    it("should use default variant when not specified", () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-primary");
    });
  });

  describe("Size Prop", () => {
    it("should render default size", () => {
      render(<Button size="default">Default Size</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-9");
      expect(button).toHaveClass("px-4");
    });

    it("should render small size", () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-8");
      expect(button).toHaveClass("px-3");
    });

    it("should render large size", () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-10");
      expect(button).toHaveClass("px-6");
    });

    it("should render icon size", () => {
      render(<Button size="icon">🔍</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("size-9");
    });

    it("should use default size when not specified", () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-9");
    });
  });

  describe("Disabled State", () => {
    it("should render disabled button", () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("should apply disabled styles", () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("disabled:pointer-events-none");
      expect(button).toHaveClass("disabled:opacity-50");
    });

    it("should not call onClick when disabled", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );
      const button = screen.getByRole("button");

      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("AsChild Prop", () => {
    it("should render as child component when asChild is true", () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );

      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/test");
    });

    it("should apply button classes to child component", () => {
      render(
        <Button asChild variant="destructive">
          <a href="/delete">Delete Link</a>
        </Button>
      );

      const link = screen.getByRole("link");
      expect(link).toHaveClass("bg-destructive");
    });

    it("should render as button when asChild is false", () => {
      render(<Button asChild={false}>Button</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("Custom ClassName", () => {
    it("should merge custom className with default classes", () => {
      render(<Button className="custom-class">Button</Button>);
      const button = screen.getByRole("button");

      expect(button).toHaveClass("custom-class");
      expect(button).toHaveClass("bg-primary"); // Default variant class
    });

    it("should allow overriding default classes", () => {
      render(<Button className="bg-red-500">Button</Button>);
      const button = screen.getByRole("button");

      // Custom bg should override default
      expect(button).toHaveClass("bg-red-500");
    });
  });

  describe("Event Handlers", () => {
    it("should call onClick handler when clicked", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole("button");

      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should pass event to onClick handler", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole("button");

      await user.click(button);

      expect(handleClick).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "click",
        })
      );
    });

    it("should handle onFocus event", async () => {
      const handleFocus = vi.fn();

      render(<Button onFocus={handleFocus}>Button</Button>);
      const button = screen.getByRole("button");

      button.focus();

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it("should handle onBlur event", async () => {
      const handleBlur = vi.fn();

      render(<Button onBlur={handleBlur}>Button</Button>);
      const button = screen.getByRole("button");

      button.focus();
      button.blur();

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe("Button Type", () => {
    it('should default to type="button"', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "button");
    });

    it('should accept type="submit"', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "submit");
    });

    it('should accept type="reset"', () => {
      render(<Button type="reset">Reset</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "reset");
    });
  });

  describe("Accessibility", () => {
    it("should be keyboard accessible", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Button</Button>);
      const button = screen.getByRole("button");

      button.focus();
      await user.keyboard("{Enter}");

      expect(handleClick).toHaveBeenCalled();
    });

    it("should support aria-label", () => {
      render(<Button aria-label="Close dialog">×</Button>);
      const button = screen.getByRole("button", { name: /close dialog/i });
      expect(button).toBeInTheDocument();
    });

    it("should support aria-describedby", () => {
      render(
        <>
          <Button aria-describedby="button-description">Button</Button>
          <p id="button-description">This button does something</p>
        </>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-describedby", "button-description");
    });

    it("should have focus-visible styles", () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole("button");

      expect(button).toHaveClass("focus-visible:ring-ring/50");
      expect(button).toHaveClass("focus-visible:ring-[3px]");
    });
  });

  describe("Children Content", () => {
    it("should render text children", () => {
      render(<Button>Text Content</Button>);
      expect(screen.getByText("Text Content")).toBeInTheDocument();
    });

    it("should render icon with text", () => {
      render(
        <Button>
          <span>🔍</span>
          Search
        </Button>
      );

      expect(screen.getByText("🔍")).toBeInTheDocument();
      expect(screen.getByText("Search")).toBeInTheDocument();
    });

    it("should render only icon", () => {
      render(<Button size="icon">🔍</Button>);
      expect(screen.getByText("🔍")).toBeInTheDocument();
    });

    it("should render complex children", () => {
      render(
        <Button>
          <div>
            <span>Complex</span>
            <strong>Content</strong>
          </div>
        </Button>
      );

      expect(screen.getByText("Complex")).toBeInTheDocument();
      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });

  describe("Variant and Size Combinations", () => {
    it("should combine destructive variant with small size", () => {
      render(
        <Button variant="destructive" size="sm">
          Delete
        </Button>
      );
      const button = screen.getByRole("button");

      expect(button).toHaveClass("bg-destructive");
      expect(button).toHaveClass("h-8");
    });

    it("should combine outline variant with large size", () => {
      render(
        <Button variant="outline" size="lg">
          Outline Large
        </Button>
      );
      const button = screen.getByRole("button");

      expect(button).toHaveClass("border");
      expect(button).toHaveClass("h-10");
    });

    it("should combine ghost variant with icon size", () => {
      render(
        <Button variant="ghost" size="icon">
          ×
        </Button>
      );
      const button = screen.getByRole("button");

      expect(button).toHaveClass("hover:bg-accent");
      expect(button).toHaveClass("size-9");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty children", () => {
      render(<Button></Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should handle multiple onClick handlers", async () => {
      const user = userEvent.setup();
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const TestComponent = () => {
        return (
          <Button
            onClick={(e) => {
              handler1(e);
              handler2(e);
            }}
          >
            Button
          </Button>
        );
      };

      render(<TestComponent />);
      const button = screen.getByRole("button");

      await user.click(button);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it("should handle rapid clicks", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Button</Button>);
      const button = screen.getByRole("button");

      await user.tripleClick(button);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it("should work in forms", () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());

      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit">Submit</Button>
        </form>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "submit");
    });
  });
});
