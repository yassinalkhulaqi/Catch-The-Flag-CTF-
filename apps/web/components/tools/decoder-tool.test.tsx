import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DecoderTool } from "@/components/tools/decoder-tool";

let writeText: ReturnType<typeof vi.fn>;

beforeEach(() => {
  writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(window.navigator, "clipboard", {
    configurable: true,
    writable: true,
    value: { writeText },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DecoderTool", () => {
  it("encodes input as Base64", async () => {
    const user = userEvent.setup();
    render(<DecoderTool />);

    await user.click(screen.getByTestId("decoder-mode-base64"));
    fireEvent.change(screen.getByTestId("decoder-input"), { target: { value: "Man" } });
    await user.click(screen.getByTestId("decoder-encode"));

    expect(screen.getByTestId("decoder-output")).toHaveValue("TWFu");
  });

  it("decodes input and shows errors in an alert", async () => {
    const user = userEvent.setup();
    render(<DecoderTool />);

    await user.click(screen.getByTestId("decoder-mode-base64"));
    fireEvent.change(screen.getByTestId("decoder-input"), { target: { value: "TWFu" } });
    await user.click(screen.getByTestId("decoder-decode"));
    expect(screen.getByTestId("decoder-output")).toHaveValue("Man");

    fireEvent.change(screen.getByTestId("decoder-input"), { target: { value: "!!!nope!!!" } });
    await user.click(screen.getByTestId("decoder-decode"));
    expect(screen.getByTestId("decoder-error")).toHaveAttribute("role", "alert");
  });

  it("copies the output to the clipboard", async () => {
    render(<DecoderTool />);

    fireEvent.change(screen.getByTestId("decoder-input"), { target: { value: "a b" } });
    fireEvent.click(screen.getByTestId("decoder-encode"));
    expect(screen.getByTestId("decoder-output")).toHaveValue("a%20b");

    fireEvent.click(screen.getByTestId("decoder-copy"));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("a%20b");
    });
    await waitFor(() => {
      expect(screen.getByTestId("decoder-copy")).toHaveTextContent(/copied/i);
    });
  });

  it("labels every field", () => {
    render(<DecoderTool />);
    expect(screen.getByLabelText(/input/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/output/i)).toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: /codec mode/i })).toBeInTheDocument();
  });
});
