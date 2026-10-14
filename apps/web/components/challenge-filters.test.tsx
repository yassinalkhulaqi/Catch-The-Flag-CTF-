import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

let searchValue = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => ({
    get: (key: string) => new URLSearchParams(searchValue).get(key),
    toString: () => new URLSearchParams(searchValue).toString(),
  }),
}));

import { ChallengeFilters } from "./challenge-filters";

const categories = [{ id: 1, name: "Web", slug: "web", description: null, color: null, icon: null }];
const tags = [{ id: 1, name: "SQL Injection", slug: "sql-injection" }];

describe("ChallengeFilters tier pills", () => {
  beforeEach(() => {
    pushMock.mockClear();
    searchValue = "";
  });

  it("renders All plus the three academy tiers", () => {
    render(<ChallengeFilters categories={categories} tags={tags} />);
    expect(screen.getByRole("group", { name: "Tier" })).toBeInTheDocument();
    for (const label of ["All", "Apprentice", "Practitioner", "Expert"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("syncs the selected tier to ?tier= while preserving existing filters", () => {
    searchValue = "category=web&q=sqli";
    render(<ChallengeFilters categories={categories} tags={tags} />);

    fireEvent.click(screen.getByRole("button", { name: "Apprentice" }));

    expect(pushMock).toHaveBeenCalledTimes(1);
    const url: string = pushMock.mock.calls[0][0];
    expect(url).toContain("tier=apprentice");
    expect(url).toContain("category=web");
    expect(url).toContain("q=sqli");
  });

  it("clears ?tier= when All is selected", () => {
    searchValue = "category=web&tier=expert";
    render(<ChallengeFilters categories={categories} tags={tags} />);

    fireEvent.click(screen.getByRole("button", { name: "All" }));

    expect(pushMock).toHaveBeenCalledTimes(1);
    const url: string = pushMock.mock.calls[0][0];
    expect(url).not.toContain("tier=");
    expect(url).toContain("category=web");
  });

  it("marks the active tier as pressed", () => {
    searchValue = "tier=practitioner";
    render(<ChallengeFilters categories={categories} tags={tags} />);

    expect(screen.getByRole("button", { name: "Practitioner" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
