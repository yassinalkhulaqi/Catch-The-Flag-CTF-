import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChallengeCard } from "@/components/challenge-card";
import type { ChallengeSummary } from "@/lib/types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const challenge: ChallengeSummary = {
  id: 1,
  title: "Welcome Text Flag",
  slug: "welcome-text-flag",
  category: {
    id: 2,
    name: "Digital Forensics",
    slug: "digital-forensics",
    color: "#8B5CF6",
  },
  difficulty: "beginner",
  points: 50,
  estimated_minutes: 20,
  tags: [{ id: 1, name: "beginner-friendly", slug: "beginner-friendly" }],
  solved: true,
  solve_count: 3,
  status: "published",
};

describe("ChallengeCard", () => {
  it("renders title, difficulty, points, and solved state", () => {
    render(<ChallengeCard challenge={challenge} />);
    expect(screen.getByText("Welcome Text Flag")).toBeInTheDocument();
    expect(screen.getByTestId("difficulty-badge")).toHaveTextContent("beginner");
    expect(screen.getByText(/50 pts/)).toBeInTheDocument();
    expect(screen.getByTestId("solved-badge")).toHaveTextContent("Solved");
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/challenges/welcome-text-flag",
    );
  });
});
