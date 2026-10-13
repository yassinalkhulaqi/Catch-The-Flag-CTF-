import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act as reactAct } from "react";

const { postMock, refreshMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/client")>();
  return { ...actual, api: { ...actual.api, post: postMock } };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, push: vi.fn() }),
}));

import { ApiError } from "@/lib/api/client";
import { FlagSubmitBox } from "./flag-submit-box";

describe("FlagSubmitBox", () => {
  beforeEach(() => {
    postMock.mockReset();
    refreshMock.mockClear();
  });

  // Flush React's async passive-effects callback before jsdom teardown,
  // otherwise it fires after globals are gone ("window is not defined").
  afterEach(async () => {
    cleanup();
    await reactAct(async () => {});
  });

  it("shows uniform incorrect feedback without revealing format", async () => {
    postMock.mockResolvedValueOnce({ data: { result: "incorrect" } });
    render(<FlagSubmitBox challengeId={42} solved={false} />);

    fireEvent.change(screen.getByLabelText("Flag"), {
      target: { value: "flag{wrong}" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit flag" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Incorrect flag. Try again.");
    expect(postMock).toHaveBeenCalledWith("/challenges/42/submissions", {
      flag: "flag{wrong}",
    });
    // Stays enabled for another attempt.
    expect(screen.getByLabelText("Flag")).toBeEnabled();
  });

  it("disables the form when the challenge is already solved", () => {
    render(<FlagSubmitBox challengeId={42} solved={true} />);

    expect(screen.getByLabelText("Flag")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Solved" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(/already solved/i);
    expect(postMock).not.toHaveBeenCalled();
  });

  it("shows a retry message when rate limited", async () => {
    postMock.mockRejectedValueOnce(
      new ApiError(429, {
        code: "rate_limited",
        message: "Too many submissions.",
      }),
    );
    render(<FlagSubmitBox challengeId={42} solved={false} />);

    fireEvent.change(screen.getByLabelText("Flag"), {
      target: { value: "flag{whatever}" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit flag" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /too many attempts/i,
    );
  });
});
