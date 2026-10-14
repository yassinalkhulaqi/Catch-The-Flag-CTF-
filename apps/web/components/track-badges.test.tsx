import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrackBadges, isTrackBadgeUnlocked } from "@/components/track-badges";

describe("isTrackBadgeUnlocked", () => {
  it("unlocks only when every visible challenge is solved", () => {
    expect(isTrackBadgeUnlocked({ solved: 3, total: 3 })).toBe(true);
    expect(isTrackBadgeUnlocked({ solved: 2, total: 3 })).toBe(false);
    expect(isTrackBadgeUnlocked({ solved: 0, total: 0 })).toBe(false);
    expect(isTrackBadgeUnlocked({ solved: 4, total: 3 })).toBe(true);
  });
});

describe("TrackBadges", () => {
  it("renders Master titles with locked and unlocked states", () => {
    render(
      <TrackBadges
        tracks={[
          { name: "SQL Injection", solved: 3, total: 3 },
          { name: "XSS", solved: 1, total: 3 },
        ]}
      />,
    );
    expect(screen.getByText("SQL Injection Master")).toBeInTheDocument();
    expect(screen.getByText("XSS Master")).toBeInTheDocument();

    const badges = screen.getAllByTestId("track-badge");
    expect(badges).toHaveLength(2);
    expect(badges[0]).toHaveAttribute("data-state", "unlocked");
    expect(badges[1]).toHaveAttribute("data-state", "locked");

    expect(within(badges[0]).getByText("Unlocked")).toBeInTheDocument();
    expect(within(badges[1]).getByText("Locked")).toBeInTheDocument();
    expect(within(badges[0]).getByText("3 of 3 solved")).toBeInTheDocument();
    expect(within(badges[1]).getByText("1 of 3 solved")).toBeInTheDocument();
  });

  it("keeps empty-catalog tracks locked", () => {
    render(<TrackBadges tracks={[{ name: "SSRF", solved: 0, total: 0 }]} />);
    const badge = screen.getByTestId("track-badge");
    expect(badge).toHaveAttribute("data-state", "locked");
    expect(screen.getByText("Locked")).toBeInTheDocument();
    expect(screen.getByText(/no challenges in catalog/)).toBeInTheDocument();
  });

  it("exposes progress values to assistive tech", () => {
    render(<TrackBadges tracks={[{ name: "Crypto", solved: 1, total: 4 }]} />);
    const bar = screen.getByRole("progressbar", {
      name: "Crypto progress: 1 of 4 solved",
    });
    expect(bar).toHaveAttribute("aria-valuenow", "1");
    expect(bar).toHaveAttribute("aria-valuemax", "4");
  });

  it("renders an empty message when there are no tracks", () => {
    render(<TrackBadges tracks={[]} />);
    expect(screen.getByText("No tracks yet.")).toBeInTheDocument();
  });
});
