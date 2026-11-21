import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CabinetGrid } from "@/components/achievements/cabinet-grid";
import { en } from "@/lib/i18n/en";
import type { Achievement } from "@/lib/types";

const copy = en.achievements;

function badge(
  overrides: Partial<Achievement> & Pick<Achievement, "id" | "title">,
): Achievement {
  return {
    key: `badge-${overrides.id}`,
    description: `${overrides.title} description`,
    icon: "trophy",
    awarded: false,
    ...overrides,
  };
}

const locked = badge({
  id: 1,
  title: "Ten solves",
  key: "ten-solves",
  progress: { current: 0, target: 10 },
});

const started = badge({
  id: 2,
  title: "Five solves",
  key: "five-solves",
  progress: { current: 3, target: 5 },
});

const unlocked = badge({
  id: 3,
  title: "First blood",
  key: "first-blood",
  awarded: true,
  awarded_at: "2026-01-10T12:00:00Z",
  progress: { current: 1, target: 1 },
});

const items = [locked, started, unlocked];

function tiles() {
  return screen.getAllByRole("button", { name: /Open badge details/i });
}

describe("CabinetGrid", () => {
  it("renders the server badges and a visible count", () => {
    render(<CabinetGrid items={items} copy={copy} />);
    expect(tiles()).toHaveLength(3);
    expect(screen.getByText(/badges shown/i)).toHaveTextContent("3 badges shown");
    expect(screen.getByText("Five solves")).toBeInTheDocument();
  });

  it("filters by award state", async () => {
    const user = userEvent.setup();
    render(<CabinetGrid items={items} copy={copy} />);

    await user.click(screen.getByRole("button", { name: copy.unlocked }));
    expect(tiles()).toHaveLength(1);
    expect(tiles()[0]).toHaveTextContent("First blood");

    await user.click(screen.getByRole("button", { name: copy.filterProgress }));
    expect(tiles()).toHaveLength(1);
    expect(tiles()[0]).toHaveTextContent("Five solves");
  });

  it("searches and resets from the empty state", async () => {
    const user = userEvent.setup();
    render(<CabinetGrid items={items} copy={copy} />);

    await user.type(screen.getByLabelText(copy.search), "nobody");
    expect(screen.queryByRole("button", { name: /Open badge details/i })).not.toBeInTheDocument();
    expect(screen.getByText(copy.filterEmpty)).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: copy.reset })[0]);
    expect(tiles()).toHaveLength(3);
  });

  it("sorts closest badges first", async () => {
    const user = userEvent.setup();
    render(<CabinetGrid items={items} copy={copy} />);

    expect(tiles()[0]).toHaveTextContent("Ten solves");
    await user.click(screen.getByRole("button", { name: new RegExp(copy.sort, "i") }));
    await user.click(screen.getByRole("option", { name: copy.sortClosest }));

    expect(tiles()[0]).toHaveTextContent("Five solves");
  });

  it("opens a badge detail dialog and closes it with Escape", async () => {
    const user = userEvent.setup();
    render(<CabinetGrid items={items} copy={copy} />);

    await user.click(screen.getByRole("button", { name: /Five solves/ }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveTextContent("Five solves description");
    expect(dialog).toHaveTextContent("3 / 5");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
