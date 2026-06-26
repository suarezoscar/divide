import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./Input";

describe("Input", () => {
  it("renders with label connected via htmlFor", () => {
    render(<Input label="Email" />);
    const input = screen.getByLabelText("Email");
    expect(input).toBeInTheDocument();
  });

  it("shows error message with role=alert", () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid email");
  });

  it("sets aria-invalid when error is present", () => {
    render(<Input label="Email" error="Invalid" />);
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });

  it("calls onChange on input", async () => {
    const fn = vi.fn();
    render(<Input label="Name" onChange={fn} />);
    await userEvent.type(screen.getByLabelText("Name"), "hello");
    expect(fn).toHaveBeenCalled();
  });

  it("passes through HTML attributes", () => {
    render(<Input label="Age" type="number" placeholder="18" />);
    const input = screen.getByLabelText("Age");
    expect(input).toHaveAttribute("type", "number");
    expect(input).toHaveAttribute("placeholder", "18");
  });
});
