import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act as reactAct } from "react";

const { banMock, unbanMock, roleMock, xpMock, refreshMock } = vi.hoisted(
  () => ({
    banMock: vi.fn(),
    unbanMock: vi.fn(),
    roleMock: vi.fn(),
    xpMock: vi.fn(),
    refreshMock: vi.fn(),
  }),
);

vi.mock("@/lib/api/admin", () => ({
  banAdminUser: banMock,
  unbanAdminUser: unbanMock,
  setAdminUserRole: roleMock,
  adjustAdminUserXp: xpMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: refreshMock }),
}));

import type { AdminUserRow } from "@/lib/api/admin";
import { UserActions } from "./user-actions";

const ACTIVE_USER: AdminUserRow = {
  id: 11,
  name: "Ada Lovelace",
  email: "ada@example.com",
  role: "user",
  xp: 1200,
  banned_at: null,
};

const BANNED_USER: AdminUserRow = {
  ...ACTIVE_USER,
  banned_at: "2026-10-01T10:00:00Z",
};

describe("UserActions", () => {
  beforeEach(() => {
    for (const m of [banMock, unbanMock, roleMock, xpMock]) m.mockReset();
    refreshMock.mockClear();
  });

  afterEach(async () => {
    cleanup();
    await reactAct(async () => {});
  });

  it("bans with a reason and confirms the moderation", async () => {
    banMock.mockResolvedValueOnce({ ok: true, data: BANNED_USER });
    render(<UserActions user={ACTIVE_USER} />);

    fireEvent.click(screen.getByRole("button", { name: "Ban user" }));
    fireEvent.change(screen.getByLabelText("Ban reason"), {
      target: { value: "Sharing flags in chat" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm ban" }));

    expect(banMock).toHaveBeenCalledWith(11, "Sharing flags in chat");
    expect(await screen.findByRole("status")).toHaveTextContent(
      /has been banned/i,
    );
  });

  it("requires a ban reason before calling the API", async () => {
    render(<UserActions user={ACTIVE_USER} />);

    fireEvent.click(screen.getByRole("button", { name: "Ban user" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm ban" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /ban reason is required/i,
    );
    expect(banMock).not.toHaveBeenCalled();
  });

  it("unbans a banned user directly", async () => {
    unbanMock.mockResolvedValueOnce({ ok: true, data: ACTIVE_USER });
    render(<UserActions user={BANNED_USER} />);

    expect(screen.queryByRole("button", { name: "Ban user" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Unban user" }));

    expect(unbanMock).toHaveBeenCalledWith(11);
    expect(await screen.findByRole("status")).toHaveTextContent(
      /has been unbanned/i,
    );
  });

  it("changes the role via the picker", async () => {
    roleMock.mockResolvedValueOnce({
      ok: true,
      data: { ...ACTIVE_USER, role: "moderator" },
    });
    render(<UserActions user={ACTIVE_USER} />);

    fireEvent.click(screen.getByRole("button", { name: "Change role" }));
    fireEvent.change(screen.getByLabelText("Role"), {
      target: { value: "moderator" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save role" }));

    expect(roleMock).toHaveBeenCalledWith(11, "moderator");
    expect(await screen.findByRole("status")).toHaveTextContent(
      /role updated to moderator/i,
    );
  });

  it("adjusts XP with amount and reason", async () => {
    xpMock.mockResolvedValueOnce({ ok: true, data: ACTIVE_USER });
    render(<UserActions user={ACTIVE_USER} />);

    fireEvent.click(screen.getByRole("button", { name: "Adjust XP" }));
    fireEvent.change(screen.getByLabelText("Amount"), {
      target: { value: "-20" },
    });
    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: "Hint abuse correction" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Save XP adjustment" }),
    );

    expect(xpMock).toHaveBeenCalledWith(11, -20, "Hint abuse correction");
    expect(await screen.findByRole("status")).toHaveTextContent(
      /xp adjusted by -20/i,
    );
  });
});
