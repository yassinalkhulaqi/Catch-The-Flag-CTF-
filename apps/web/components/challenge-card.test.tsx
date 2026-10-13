import { describe, expect, it, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { act } from "react";
import { ChallengeCard } from "./challenge-card";
import type { ChallengeSummary } from "@/lib/types";

const baseChallenge: ChallengeSummary = {
  id: 7,
  title: "Memory Forensics 101",
  slug: "memory-forensics-101",
  category: { id: 2, name: "DFIR", slug: "dfir", color: null },
  difficulty: "beginner",
  points: 150,
  estimated_minutes: 45,
  tags: [{ id: 1, name: "memory", slug: "memory" }],
  solved: false,
  solve_count: 12,
  status: "published",
};

describe("ChallengeCard", () => {
  // Flush React's async passive-effects callback before jsdom teardown,
  // otherwise it fires after globals are gone ("window is not defined").
  afterEach(async () => {
    await act(async () => {});
  });

  it("renders title, meta and a link to the detail page", () => {
    render(<ChallengeCard challenge={baseChallenge} />);

    const link = screen.getByRole("link", { name: "Memory Forensics 101" });
    expect(link).toHaveAttribute("href", "/challenges/memory-forensics-101");

    expect(screen.getByText("DFIR")).toBeInTheDocument();
    expect(screen.getByText("beginner")).toBeInTheDocument();
    expect(screen.getByText(/150 pts/)).toBeInTheDocument();
    expect(screen.getByText(/12 solves/)).toBeInTheDocument();
  });

  it("shows a solved badge only when solved", () => {
    const { rerender } = render(<ChallengeCard challenge={baseChallenge} />);
    expect(screen.queryByText("Solved")).not.toBeInTheDocument();

    rerender(<ChallengeCard challenge={{ ...baseChallenge, solved: true }} />);
    expect(screen.getByText("Solved")).toBeInTheDocument();
  });
});
