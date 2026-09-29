import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { FlagSubmitBox } from "@/components/flag-submit-box";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh, replace: vi.fn(), prefetch: vi.fn() }),
}));

const server = setupServer(
  http.post("/api/v1/challenges/:id/submissions", async ({ request }) => {
    const body = (await request.json()) as { flag?: string };
    if (body.flag === "flag{correct}") {
      return HttpResponse.json({
        data: {
          result: "correct",
          points_awarded: 50,
          already_solved: false,
          xp_total: 50,
        },
      });
    }
    return HttpResponse.json({ data: { result: "incorrect" } });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  push.mockClear();
  refresh.mockClear();
});
afterAll(() => server.close());

describe("FlagSubmitBox", () => {
  it("submits a flag and shows success", async () => {
    const user = userEvent.setup();
    render(<FlagSubmitBox challengeId={1} />);

    fireEvent.change(screen.getByTestId("flag-input"), {
      target: { value: "flag{correct}" },
    });
    await user.click(screen.getByTestId("flag-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("flag-success")).toHaveTextContent(/Correct/i);
    });
    expect(refresh).toHaveBeenCalled();
  });

  it("shows incorrect feedback", async () => {
    const user = userEvent.setup();
    render(<FlagSubmitBox challengeId={1} />);

    fireEvent.change(screen.getByTestId("flag-input"), {
      target: { value: "flag{wrong}" },
    });
    await user.click(screen.getByTestId("flag-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("flag-incorrect")).toBeInTheDocument();
    });
  });

  it("shows already solved state", () => {
    render(<FlagSubmitBox challengeId={1} alreadySolved />);
    expect(screen.getByTestId("flag-success")).toHaveTextContent(/Already solved/i);
    expect(screen.queryByTestId("flag-input")).not.toBeInTheDocument();
  });
});
