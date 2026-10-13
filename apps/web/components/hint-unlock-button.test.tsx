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
  useRouter: () => ({ refresh: refreshMock }),
}));

import { HintUnlockButton } from "./hint-unlock-button";

const lockedHint = {
  id: 3,
  position: 2,
  cost_points: 50,
  unlocked: false as const,
};

describe("HintUnlockButton", () => {
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

  it("asks for inline confirmation before unlocking, then reveals content", async () => {
    postMock.mockResolvedValueOnce({
      data: {
        hint: { id: 3, content: "Check the EXIF data." },
        points_remaining: 100,
      },
    });
    render(<HintUnlockButton challengeId={42} hint={lockedHint} />);

    // Unlock requires confirmation — no request on the first click.
    fireEvent.click(screen.getByRole("button", { name: /unlock hint/i }));
    expect(postMock).not.toHaveBeenCalled();

    // Inline confirm step (not window.confirm).
    fireEvent.click(screen.getByRole("button", { name: /confirm unlock/i }));

    expect(await screen.findByText("Check the EXIF data.")).toBeInTheDocument();
    expect(postMock).toHaveBeenCalledWith("/challenges/42/hints/3/unlock");
    expect(
      screen.queryByRole("button", { name: /confirm unlock/i }),
    ).not.toBeInTheDocument();
  });

  it("cancelling the confirm step keeps the hint locked", () => {
    render(<HintUnlockButton challengeId={42} hint={lockedHint} />);

    fireEvent.click(screen.getByRole("button", { name: /unlock hint/i }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(postMock).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /unlock hint/i }),
    ).toBeInTheDocument();
  });

  it("shows content immediately for an unlocked hint without calling the API", () => {
    render(
      <HintUnlockButton
        challengeId={42}
        hint={{ ...lockedHint, unlocked: true, content: "Look at strings output." }}
      />,
    );

    expect(screen.getByText("Look at strings output.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /unlock/i }),
    ).not.toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });
});
