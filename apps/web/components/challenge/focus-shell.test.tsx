import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FocusShell } from "@/components/challenge/focus-shell";
import { focusSections, type FocusFlags } from "@/lib/challenge/focus";
import { en } from "@/lib/i18n/en";

const copy = en.focus;
const flags: FocusFlags = {
  authenticated: true,
  hasFiles: true,
  hasHints: true,
  hasWalkthrough: false,
};
const sections = focusSections(flags, copy.sections);

function renderShell() {
  return render(
    <FocusShell challengeId={7} title="Welcome Text Flag" sections={sections} copy={copy}>
      <p>Mission body</p>
    </FocusShell>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("FocusShell", () => {
  it("starts off and shows the enable control", () => {
    renderShell();
    expect(screen.getByText("Mission body")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Focus mode/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("enables focus, shows the bar and rail, then exits", () => {
    const { container } = renderShell();

    fireEvent.click(screen.getByRole("button", { name: /Focus mode/i }));

    expect(container.querySelector('[data-focus="true"]')).not.toBeNull();
    expect(screen.getByText("Focus session")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: copy.rail })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Exit focus/i })).toBeInTheDocument();
    expect(screen.getByText("Mission body")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Exit focus/i }));
    expect(container.querySelector('[data-focus="false"]')).not.toBeNull();
    expect(screen.queryByRole("navigation", { name: copy.rail })).not.toBeInTheDocument();
  });

  it("keeps the review checklist on this device", () => {
    const first = renderShell();
    fireEvent.click(screen.getByRole("button", { name: /Focus mode/i }));

    const checkbox = screen.getByRole("checkbox", { name: "Objective" });
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(screen.getAllByText("1/7").length).toBeGreaterThan(0);

    first.unmount();
    renderShell();

    expect(screen.getByRole("button", { name: /Exit focus/i })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Objective" })).toBeChecked();
  });

  it("counts an elapsed session timer", () => {
    vi.useFakeTimers();
    renderShell();
    fireEvent.click(screen.getByRole("button", { name: /Focus mode/i }));

    expect(screen.getByLabelText("Elapsed 00:00")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByLabelText("Elapsed 00:02")).toBeInTheDocument();
  });

  it("reports completion when every section is reviewed", () => {
    renderShell();
    fireEvent.click(screen.getByRole("button", { name: /Focus mode/i }));

    for (const checkbox of screen.getAllByRole("checkbox")) {
      fireEvent.click(checkbox);
    }
    expect(screen.getAllByText(copy.complete).length).toBeGreaterThan(0);
  });
});
