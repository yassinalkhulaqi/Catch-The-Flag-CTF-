import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { RegisterForm } from "@/components/auth/register-form";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

let calls = 0;

const server = setupServer(
  http.post("/api/v1/auth/register", async () => {
    calls += 1;
    return HttpResponse.json({ data: { user: {} } }, { status: 201 });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  calls = 0;
  push.mockClear();
});
afterAll(() => server.close());

describe("RegisterForm (react-hook-form + zod)", () => {
  it("blocks invalid input before calling the API and explains the password policy", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    expect(screen.getByText(/at least 12 characters/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText("Use at least 12 characters.")).toBeInTheDocument();
    expect(calls).toBe(0);
  });

  it("maps server field errors back onto the right input", async () => {
    server.use(
      http.post("/api/v1/auth/register", () => {
        calls += 1;
        return HttpResponse.json(
          {
            error: {
              code: "validation_failed",
              message: "The given data was invalid.",
              fields: { email: ["Email has already been taken."] },
            },
          },
          { status: 422 },
        );
      }),
    );
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Name"), "New Solver");
    await user.type(screen.getByLabelText("Email"), "taken@example.com");
    await user.type(screen.getByLabelText("Password"), "long-enough-password");
    await user.type(screen.getByLabelText("Confirm password"), "long-enough-password");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(calls).toBe(1));
    expect(await screen.findByText("Email has already been taken.")).toBeInTheDocument();
  });
});
