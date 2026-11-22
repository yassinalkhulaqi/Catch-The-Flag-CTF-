import { describe, expect, it } from "vitest";
import type { LeaderboardEntry } from "@/lib/types";
import {
  boardPercentile,
  boardStats,
  findRival,
  initials,
  rankBand,
  scopeBoard,
  searchBoard,
  sortBoard,
  xpPerSolve,
} from "@/lib/leaderboard/arena";

function entry(
  overrides: Partial<LeaderboardEntry> & Pick<LeaderboardEntry, "id" | "rank">,
): LeaderboardEntry {
  return {
    name: `player-${overrides.id}`,
    xp: 1000 - overrides.rank * 10,
    solved_count: 10 - overrides.rank,
    achievements_count: 5,
    ...overrides,
  };
}

const board: LeaderboardEntry[] = [
  entry({ id: 10, rank: 1, name: "Ada Lovelace", xp: 9000, solved_count: 40, achievements_count: 12 }),
  entry({ id: 20, rank: 2, name: "Grace Hopper", xp: 7000, solved_count: 30, achievements_count: 10 }),
  entry({ id: 30, rank: 3, name: "Alan Turing", xp: 6500, solved_count: 32, achievements_count: 9 }),
  entry({ id: 40, rank: 4, name: "Katherine Johnson", xp: 4000, solved_count: 18, achievements_count: 4 }),
  entry({ id: 50, rank: 5, name: "Margaret Hamilton", xp: 2500, solved_count: 12, achievements_count: 6 }),
];

describe("sortBoard", () => {
  it("orders by XP descending by default", () => {
    expect(sortBoard(board).map((row) => row.id)).toEqual([10, 20, 30, 40, 50]);
  });

  it("orders by solves and breaks ties with XP then id", () => {
    const rows = sortBoard(board, "solves");
    expect(rows.map((row) => row.solved_count)).toEqual([40, 32, 30, 18, 12]);
  });

  it("orders by achievements", () => {
    expect(sortBoard(board, "achievements").map((row) => row.id)).toEqual([
      10, 20, 30, 50, 40,
    ]);
  });

  it("reverses for ascending direction", () => {
    expect(sortBoard(board, "xp", "asc").map((row) => row.id)).toEqual([
      50, 40, 30, 20, 10,
    ]);
  });

  it("does not mutate the input", () => {
    const before = board.map((row) => row.id);
    sortBoard(board, "solves");
    expect(board.map((row) => row.id)).toEqual(before);
  });
});

describe("searchBoard", () => {
  it("matches names case-insensitively", () => {
    expect(searchBoard(board, "HOPPER").map((row) => row.id)).toEqual([20]);
  });

  it("trims whitespace and returns the full board for an empty query", () => {
    expect(searchBoard(board, "   ")).toHaveLength(board.length);
    expect(searchBoard(board, "  ada ").map((row) => row.id)).toEqual([10]);
  });

  it("returns no rows when nothing matches", () => {
    expect(searchBoard(board, "nobody")).toEqual([]);
  });
});

describe("scopeBoard", () => {
  it("returns everything for the all scope", () => {
    expect(scopeBoard(board, "all")).toHaveLength(5);
  });

  it("returns at most ten rows for the top scope", () => {
    expect(scopeBoard(board, "top")).toHaveLength(5);
    const long = Array.from({ length: 14 }, (_, index) =>
      entry({ id: index + 1, rank: index + 1 }),
    );
    expect(scopeBoard(long, "top")).toHaveLength(10);
  });

  it("centres a window on the viewer", () => {
    const long = Array.from({ length: 20 }, (_, index) =>
      entry({ id: index + 1, rank: index + 1 }),
    );
    const window = scopeBoard(long, "around", 11);
    expect(window[0].id).toBe(6);
    expect(window[window.length - 1].id).toBe(16);
  });

  it("falls back to the full board when the viewer is not loaded", () => {
    expect(scopeBoard(board, "around", 999)).toHaveLength(5);
    expect(scopeBoard(board, "around")).toHaveLength(5);
  });
});

describe("boardStats", () => {
  it("summarizes the loaded rows", () => {
    const stats = boardStats(board);
    expect(stats.players).toBe(5);
    expect(stats.totalXp).toBe(29000);
    expect(stats.totalSolves).toBe(132);
    expect(stats.totalAchievements).toBe(41);
    expect(stats.averageXp).toBe(5800);
    expect(stats.averageSolves).toBe(26);
    expect(stats.leaderXp).toBe(9000);
    expect(stats.leaderSolves).toBe(40);
  });

  it("returns zeroes for an empty board", () => {
    expect(boardStats([])).toEqual({
      players: 0,
      totalXp: 0,
      totalSolves: 0,
      totalAchievements: 0,
      averageXp: 0,
      averageSolves: 0,
      leaderXp: 0,
      leaderSolves: 0,
    });
  });
});

describe("findRival", () => {
  it("finds the rows directly above and below the viewer", () => {
    const rival = findRival(board, 30);
    expect(rival?.above?.id).toBe(20);
    expect(rival?.below?.id).toBe(40);
    expect(rival?.gapToAbove).toBe(500);
    expect(rival?.gapToBelow).toBe(2500);
  });

  it("reports no gap for the leader", () => {
    const rival = findRival(board, 10);
    expect(rival?.above).toBeNull();
    expect(rival?.gapToAbove).toBe(0);
    expect(rival?.below?.id).toBe(20);
  });

  it("reports no gap for the last row", () => {
    const rival = findRival(board, 50);
    expect(rival?.below).toBeNull();
    expect(rival?.gapToBelow).toBe(0);
  });

  it("returns null for an unranked viewer", () => {
    expect(findRival(board, 404)).toBeNull();
  });
});

describe("xpPerSolve", () => {
  it("rounds XP per solve", () => {
    expect(xpPerSolve(board[0])).toBe(225);
    expect(xpPerSolve({ ...board[0], solved_count: 0 })).toBe(0);
  });
});

describe("rankBand", () => {
  it("maps rank ranges to labels", () => {
    expect(rankBand(1)).toBe("podium");
    expect(rankBand(3)).toBe("podium");
    expect(rankBand(4)).toBe("top10");
    expect(rankBand(10)).toBe("top10");
    expect(rankBand(11)).toBe("top25");
    expect(rankBand(25)).toBe("top25");
    expect(rankBand(26)).toBe("field");
  });
});

describe("boardPercentile", () => {
  it("returns the share of the board at or below a rank", () => {
    expect(boardPercentile(1, 100)).toBe(1);
    expect(boardPercentile(25, 100)).toBe(25);
    expect(boardPercentile(100, 100)).toBe(100);
  });

  it("clamps and guards empty boards", () => {
    expect(boardPercentile(0, 10)).toBe(1);
    expect(boardPercentile(1, 0)).toBe(0);
  });
});

describe("initials", () => {
  it("uses the first and last name", () => {
    expect(initials("Ada Lovelace")).toBe("AL");
    expect(initials("Grace Brewster Hopper")).toBe("GH");
  });

  it("handles single names and blanks", () => {
    expect(initials("turing")).toBe("TU");
    expect(initials("   ")).toBe("?");
  });
});
