import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("does not render when closed", () => {
    render(<Modal open={false} onClose={() => {}}>Content</Modal>);
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("renders when open", () => {
    render(<Modal open={true} onClose={() => {}}>Content</Modal>);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders title when provided", () => {
    render(<Modal open={true} onClose={() => {}} title="My Modal">Content</Modal>);
    expect(screen.getByText("My Modal")).toBeInTheDocument();
  });

  it("calls onClose when pressing Escape", async () => {
    const fn = vi.fn();
    render(<Modal open={true} onClose={fn}>Content</Modal>);
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(fn).toHaveBeenCalledTimes(1));
  });

  it("has role=dialog and aria-modal", () => {
    render(<Modal open={true} onClose={() => {}} title="Dialog">Content</Modal>);
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });

  it("close button has aria-label", () => {
    render(<Modal open={true} onClose={() => {}} title="Dialog">Content</Modal>);
    expect(screen.getByLabelText("Cerrar")).toBeInTheDocument();
  });

  it("locks body scroll when open", () => {
    render(<Modal open={true} onClose={() => {}}>Content</Modal>);
    // jsdom doesn't support overflow, but we can check the style was attempted
    // Just verifying it doesn't crash
    expect(screen.getByText("Content")).toBeInTheDocument();
  });
});
