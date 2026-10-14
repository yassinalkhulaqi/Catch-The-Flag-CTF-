import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RequestSandbox } from "@/components/tools/request-sandbox";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("RequestSandbox", () => {
  it("shows the simulated-only notice and never calls fetch", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("must not be called"));
    const user = userEvent.setup();
    render(<RequestSandbox />);

    expect(screen.getByText(/no real requests leave the browser/i)).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("sandbox-path"), { target: { value: "/api/v1/challenges" } });
    await user.click(screen.getByTestId("sandbox-send"));

    await waitFor(
      () => {
        expect(screen.getByTestId("sandbox-response")).toHaveTextContent(/GET \/api\/v1\/challenges/);
      },
      { timeout: 15000 },
    );
    expect(screen.getByTestId("sandbox-response")).toHaveTextContent(/simulated, local only/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("derives canned statuses locally (admin -> 403, empty POST -> 422)", async () => {
    const user = userEvent.setup();
    render(<RequestSandbox />);

    fireEvent.change(screen.getByTestId("sandbox-path"), { target: { value: "/admin/users" } });
    await user.click(screen.getByTestId("sandbox-send"));
    await waitFor(
      () => {
        expect(screen.getByTestId("sandbox-response")).toHaveTextContent(/403 Forbidden/);
      },
      { timeout: 15000 },
    );
    // The send button stays disabled until the simulated typing finishes.
    await waitFor(
      () => {
        expect(screen.getByTestId("sandbox-send")).toBeEnabled();
      },
      { timeout: 15000 },
    );

    fireEvent.change(screen.getByTestId("sandbox-method"), { target: { value: "POST" } });
    fireEvent.change(screen.getByTestId("sandbox-path"), { target: { value: "/api/v1/notes" } });
    fireEvent.change(screen.getByTestId("sandbox-body"), { target: { value: "" } });
    await user.click(screen.getByTestId("sandbox-send"));
    await waitFor(
      () => {
        expect(screen.getByTestId("sandbox-response")).toHaveTextContent(/422/);
      },
      { timeout: 15000 },
    );
  }, 30000);

  it("labels every editable field", () => {
    render(<RequestSandbox />);
    expect(screen.getByLabelText(/method/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^path/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/headers/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/body/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/query params/i)).toBeInTheDocument();
  });
});
