import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Card } from "./Card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Hello</Card>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("is clickable when onClick provided", async () => {
    const fn = vi.fn();
    render(<Card onClick={fn}>Clickable</Card>);
    await userEvent.click(screen.getByText("Clickable"));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("has role=button when clickable", () => {
    render(<Card onClick={() => {}}>Clickable</Card>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("can be activated with keyboard Enter", async () => {
    const fn = vi.fn();
    render(<Card onClick={fn}>Clickable</Card>);
    await userEvent.type(screen.getByRole("button"), "{Enter}");
    expect(fn).toHaveBeenCalled();
  });

  it("can be activated with keyboard Space", async () => {
    const fn = vi.fn();
    render(<Card onClick={fn}>Clickable</Card>);
    await userEvent.type(screen.getByRole("button"), " ");
    expect(fn).toHaveBeenCalled();
  });

  it("does not have button role when not clickable", () => {
    render(<Card>Static</Card>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
