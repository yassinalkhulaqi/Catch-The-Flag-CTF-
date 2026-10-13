import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act as reactAct } from "react";

const { replaceMock } = vi.hoisted(() => ({ replaceMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, refresh: vi.fn() }),
  usePathname: () => "/challenges",
  useSearchParams: () => new URLSearchParams(""),
}));

import { SearchFilterBar } from "./search-filter-bar";

const categories = [{ id: 2, name: "DFIR", slug: "dfir" }];

describe("SearchFilterBar", () => {
  beforeEach(() => {
    replaceMock.mockClear();
    vi.useRealTimers();
  });

  // Restore real timers, then flush React's async passive-effects callback
  // before jsdom teardown (avoids "window is not defined" unhandled errors).
  afterEach(async () => {
    vi.useRealTimers();
    await reactAct(async () => {});
  });

  it("updates the category query param immediately on select", () => {
    render(<SearchFilterBar categories={categories} />);

    fireEvent.change(screen.getByLabelText("Category"), {
      target: { value: "dfir" },
    });

    expect(replaceMock).toHaveBeenCalledWith("/challenges?category=dfir");
  });

  it("updates the difficulty query param on select", () => {
    render(<SearchFilterBar categories={categories} />);

    fireEvent.change(screen.getByLabelText("Difficulty"), {
      target: { value: "advanced" },
    });

    expect(replaceMock).toHaveBeenCalledWith("/challenges?difficulty=advanced");
  });

  it("debounces free-text search into the q param", () => {
    vi.useFakeTimers();
    render(<SearchFilterBar categories={categories} />);

    fireEvent.change(screen.getByLabelText("Search"), {
      target: { value: "memory dump" },
    });
    // Not yet — debounce window still open.
    expect(replaceMock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(replaceMock).toHaveBeenCalledWith("/challenges?q=memory+dump");
  });

  it("toggles the solved param via checkbox", () => {
    render(<SearchFilterBar categories={categories} />);

    fireEvent.click(screen.getByLabelText("Solved only"));

    expect(replaceMock).toHaveBeenCalledWith("/challenges?solved=true");
  });
});
