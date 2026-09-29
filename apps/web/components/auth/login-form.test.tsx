import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/components/auth/login-form";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh, replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const server = setupServer(
  http.post("/api/v1/auth/login", async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    if (body.email === "admin@example.com" && body.password === "ChangeMe-Admin-Passw0rd!") {
      return HttpResponse.json({
        data: {
          user: {
            id: 1,
            name: "Admin",
            email: "admin@example.com",
            role: "admin",
            xp: 0,
            solved_count: 0,
            bio: null,
            avatar_url: null,
            created_at: "2026-09-29T00:00:00Z",
          },
          expires_at: "2026-10-29T00:00:00Z",
        },
      });
    }
    return HttpResponse.json(
      {
        error: {
          code: "validation_failed",
          message: "The provided credentials are incorrect.",
          fields: { email: ["The provided credentials are incorrect."] },
        },
      },
      { status: 422 },
    );
  }),
);

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => {
  server.resetHandlers();
  push.mockClear();
  refresh.mockClear();
});
afterAll(() => server.close());

describe("LoginForm", () => {
  it("signs in and redirects to dashboard", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByTestId("login-email"), "admin@example.com");
    await user.type(screen.getByTestId("login-password"), "ChangeMe-Admin-Passw0rd!");
    await user.click(screen.getByTestId("login-submit"));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/dashboard");
    });
    expect(refresh).toHaveBeenCalled();
  });

  it("shows an error for bad credentials", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByTestId("login-email"), "bad@example.com");
    await user.type(screen.getByTestId("login-password"), "not-the-password");
    await user.click(screen.getByTestId("login-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("login-error")).toBeInTheDocument();
    });
  });
});
