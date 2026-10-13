import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChallengeEditor } from "@/components/admin/challenge-editor";
import type { Category, ChallengeDetail, Tag } from "@/lib/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

const category: Category = {
  id: 1,
  name: "Cryptography",
  slug: "cryptography",
  description: null,
  color: null,
  icon: null,
};

const tag: Tag = { id: 3, name: "RSA", slug: "rsa" };

const challenge: ChallengeDetail = {
  id: 9,
  title: "Known plaintext",
  slug: "known-plaintext",
  category: { id: 1, name: "Cryptography", slug: "cryptography", color: null },
  difficulty: "beginner",
  points: 100,
  estimated_minutes: 20,
  tags: [tag],
  solved: false,
  solve_count: 0,
  status: "draft",
  description: "Recover the message.",
  scenario: "A note was intercepted.",
  files: [],
  hints: [],
  author: null,
  published_at: null,
  points_remaining: 100,
};

describe("ChallengeEditor", () => {
  it("keeps files, flags, and publish behind steps until the challenge exists", async () => {
    const user = userEvent.setup();
    render(<ChallengeEditor categories={[category]} tags={[tag]} />);

    expect(screen.getByRole("button", { name: /Files/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Publish/ })).toBeDisabled();
    expect(screen.getByLabelText("Title")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next: scenario" }));
    expect(screen.getByLabelText("Description (Markdown)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create challenge" })).toBeInTheDocument();
  });

  it("opens the flag and publish steps for an existing challenge", async () => {
    const user = userEvent.setup();
    render(
      <ChallengeEditor
        categories={[category]}
        tags={[tag]}
        challenge={challenge}
        initialFlags={[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Flag/ }));
    expect(screen.getByLabelText("Flag value")).toBeInTheDocument();
    expect(screen.getByText(/Publish requires an active flag/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "6 Publish" }));
    expect(screen.getByRole("heading", { name: "Preview and publish" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Publish$/ })).toBeDisabled();
    expect(screen.getByText("A note was intercepted.")).toBeInTheDocument();
  });
});