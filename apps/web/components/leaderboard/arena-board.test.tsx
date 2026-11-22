import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ArenaBoard } from "@/components/leaderboard/arena-board";
import { en } from "@/lib/i18n/en";
import type { LeaderboardEntry } from "@/lib/types";

const copy = en.arena;

function entry(
  id: number,
  name: string,
  xp: number,
  solved: number,
  achievements: number,
): LeaderboardEntry {
  return {
    id,
    rank: id,
    name,
    xp,
    solved_count: solved,
    achievements_count: achievements,
  };
}

const entries: LeaderboardEntry[] = [
  entry(1, "Ada Lovelace", 9000, 20, 8),
  entry(2, "Grace Hopper", 7000, 30, 6),
  entry(3, "Alan Turing", 6500, 25, 9),
];

function tableRows() {
  const table = screen.getByRole("table");
  return within(table).getAllByRole("row").slice(1);
}

describe("ArenaBoard", () => {
  it("renders the server rows and the visible count", () => {
    render(<ArenaBoard entries={entries} copy={copy} />);
    expect(tableRows()).toHaveLength(3);
    expect(screen.getByText(/players shown/i)).toHaveTextContent("3 players shown");
    expect(within(screen.getByRole("table")).getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("filters by name and shows an empty state that resets", async () => {
    const user = userEvent.setup();
    render(<ArenaBoard entries={entries} copy={copy} />);

    await user.type(screen.getByLabelText(copy.search), "hopper");
    expect(tableRows()).toHaveLength(1);
    expect(within(screen.getByRole("table")).getByText("Grace Hopper")).toBeInTheDocument();
    expect(within(screen.getByRole("table")).queryByText("Ada Lovelace")).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText(copy.search));
    await user.type(screen.getByLabelText(copy.search), "zzz");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText(copy.empty)).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: copy.reset })[0]);
    expect(tableRows()).toHaveLength(3);
  });

  it("sorts by a column and toggles direction", async () => {
    const user = userEvent.setup();
    render(<ArenaBoard entries={entries} copy={copy} />);

    const table = screen.getByRole("table");
    await user.click(within(table).getByRole("button", { name: copy.sortSolves }));
    expect(tableRows()[0]).toHaveTextContent("Grace Hopper");

    await user.click(within(table).getByRole("button", { name: copy.sortSolves }));
    expect(tableRows()[0]).toHaveTextContent("Ada Lovelace");

    const header = within(table).getByRole("columnheader", { name: copy.sortSolves });
    expect(header).toHaveAttribute("aria-sort", "ascending");
  });

  it("limits the board to the top ten ranks", async () => {
    const user = userEvent.setup();
    const many = Array.from({ length: 12 }, (_, index) =>
      entry(index + 1, `Player ${index + 1}`, 1000 - index * 10, 10, 1),
    );
    render(<ArenaBoard entries={many} copy={copy} />);

    await user.click(screen.getByRole("button", { name: copy.scopeTop }));
    expect(tableRows()).toHaveLength(10);
    expect(within(screen.getByRole("table")).queryByText("Player 11")).not.toBeInTheDocument();
  });

  it("explains when the viewer is outside the loaded board", async () => {
    const user = userEvent.setup();
    render(<ArenaBoard entries={entries} viewerId={999} copy={copy} />);

    await user.click(screen.getByRole("button", { name: copy.scopeAround }));
    expect(screen.getByText(copy.scopeAroundUnavailable)).toBeInTheDocument();
    expect(tableRows()).toHaveLength(3);
  });

  it("marks the viewer row", () => {
    render(<ArenaBoard entries={entries} viewerId={2} copy={copy} />);
    const table = screen.getByRole("table");
    const viewerRow = within(table)
      .getAllByRole("row")
      .find((row) => row.textContent?.includes("Grace Hopper"));
    expect(viewerRow).toHaveTextContent(copy.you);
  });

  it("exposes sortable headers to assistive technology", () => {
    render(<ArenaBoard entries={entries} copy={copy} />);
    const header = within(screen.getByRole("table")).getByRole("columnheader", {
      name: copy.sortXp,
    });
    expect(header).toHaveAttribute("aria-sort", "descending");
  });
});
