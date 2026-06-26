import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const fn = vi.fn();
    render(<Button onClick={fn}>Click</Button>);
    await userEvent.click(screen.getByText("Click"));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", async () => {
    const fn = vi.fn();
    render(<Button onClick={fn} disabled>Click</Button>);
    await userEvent.click(screen.getByText("Click"));
    expect(fn).not.toHaveBeenCalled();
  });

  it("is disabled when isLoading", () => {
    render(<Button isLoading>Click</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("renders in primary variant by default", () => {
    render(<Button>Click</Button>);
    expect(screen.getByRole("button").className).toContain("primary");
  });

  it("renders secondary variant", () => {
    render(<Button variant="secondary">Click</Button>);
    expect(screen.getByRole("button").className).toContain("secondary");
  });

  it("renders ghost variant", () => {
    render(<Button variant="ghost">Click</Button>);
    expect(screen.getByRole("button").className).toContain("ghost");
  });
});
