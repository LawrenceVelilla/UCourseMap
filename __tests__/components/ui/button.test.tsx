import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button Component", () => {
  test("renders correctly with default props", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-primary");
  });

  test("applies variant classes correctly", () => {
    render(<Button variant="destructive">Destructive</Button>);
    const button = screen.getByRole("button", { name: /destructive/i });
    expect(button).toHaveClass("bg-destructive");

    render(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole("button", { name: /outline/i })).toHaveClass("border-input");

    render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole("button", { name: /secondary/i })).toHaveClass("bg-secondary");

    render(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole("button", { name: /ghost/i })).toHaveClass("hover:bg-accent");

    render(<Button variant="link">Link</Button>);
    expect(screen.getByRole("button", { name: /link/i })).toHaveClass("text-primary");
  });

  test("applies size classes correctly", () => {
    render(<Button size="default">Default</Button>);
    expect(screen.getByRole("button", { name: /default/i })).toHaveClass("h-10");

    render(<Button size="sm">Small</Button>);
    expect(screen.getByRole("button", { name: /small/i })).toHaveClass("h-9");

    render(<Button size="lg">Large</Button>);
    expect(screen.getByRole("button", { name: /large/i })).toHaveClass("h-11");

    render(<Button size="icon">Icon</Button>);
    expect(screen.getByRole("button", { name: /icon/i })).toHaveClass("w-10");
  });

  test("handles click events", async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });

    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test("applies additional className prop correctly", () => {
    render(<Button className="test-class">Custom Class</Button>);
    const button = screen.getByRole("button", { name: /custom class/i });
    expect(button).toHaveClass("test-class");
    expect(button).toHaveClass("bg-primary"); // Should still have default classes
  });

  test("renders properly when disabled", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button", { name: /disabled/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass("disabled:opacity-50");
  });

  test("renders as a slot when asChild is true", () => {
    render(
      <Button asChild>
        <a href="https://example.com">Link Button</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: /link button/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveClass("bg-primary"); // Should have button styling
  });
});
