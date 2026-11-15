import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionList } from "./session-list";
import type { ActiveSession } from "@/lib/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const SESSIONS: ActiveSession[] = [
  {
    id: 11,
    name: "Firefox/120.0 (Windows NT 10.0; x64)",
    created_at: "2026-11-01T08:00:00Z",
    last_used_at: new Date().toISOString(),
    expires_at: "2026-12-01T08:00:00Z",
    current: true,
  },
  {
    id: 12,
    name: "Mozilla/Chrome mobile",
    created_at: "2026-10-01T08:00:00Z",
    last_used_at: null,
    expires_at: null,
    current: false,
  },
];

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify({ data: { revoked: true } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
});

afterEach(cleanup);

describe("SessionList", () => {
  it("lists sessions and marks the current device", () => {
    render(<SessionList initialSessions={SESSIONS} />);

    expect(screen.getByText("Firefox/120.0 (Windows NT 10.0; x64)")).toBeTruthy();
    expect(screen.getByText("Mozilla/Chrome mobile")).toBeTruthy();
    expect(screen.getByText("This device")).toBeTruthy();
  });

  it("asks for confirmation before revoking a session", async () => {
    render(<SessionList initialSessions={SESSIONS} />);

    const buttons = screen.getAllByRole("button", { name: /revoke/i });
    fireEvent.click(buttons[1]);

    // Two-step confirm, no network call yet.
    expect(screen.getByText("Revoke?")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Confirm revoking this session" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/auth/sessions/12");
    expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");

    await waitFor(() => expect(screen.queryByText("Mozilla/Chrome mobile")).toBeNull());
  });

  it("shows an error message when the revoke fails", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: { code: "rate_limited", message: "Slow down." } }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "42" },
      }),
    );

    render(<SessionList initialSessions={SESSIONS} />);

    fireEvent.click(screen.getAllByRole("button", { name: /revoke/i })[1]);
    fireEvent.click(screen.getByRole("button", { name: "Confirm revoking this session" }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(screen.getByRole("alert").textContent).toContain("Slow down.");
  });

  it("renders an empty state when there are no other sessions", () => {
    render(<SessionList initialSessions={[]} />);

    expect(screen.getByText("No other sessions.")).toBeTruthy();
  });
});
