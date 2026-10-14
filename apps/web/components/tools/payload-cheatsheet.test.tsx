import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PAYLOAD_CATEGORIES, PayloadCheatsheet } from "@/components/tools/payload-cheatsheet";

const TOTAL_PAYLOADS = PAYLOAD_CATEGORIES.reduce((sum, category) => sum + category.payloads.length, 0);

let writeText: ReturnType<typeof vi.fn>;

beforeEach(() => {
  writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(window.navigator, "clipboard", {
    configurable: true,
    writable: true,
    value: { writeText },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("PayloadCheatsheet", () => {
  it("renders all categories and payloads as inert text", () => {
    render(<PayloadCheatsheet />);
    for (const category of PAYLOAD_CATEGORIES) {
      expect(screen.getByTestId(`cheatsheet-category-${category.id}`)).toBeInTheDocument();
    }
    // No payload is ever injected as HTML: everything renders inside <code>.
    const codeElements = document.querySelectorAll("code");
    expect(codeElements.length).toBe(TOTAL_PAYLOADS);
    expect(document.querySelector("[dangerouslySetInnerHTML]")).toBeNull();
  });

  it("filters payloads by search query", async () => {
    const user = userEvent.setup();
    render(<PayloadCheatsheet />);

    await user.type(screen.getByTestId("cheatsheet-filter"), "svg onload");

    expect(screen.queryByTestId("cheatsheet-category-sqli")).not.toBeInTheDocument();
    expect(screen.getByTestId("cheatsheet-category-xss")).toBeInTheDocument();
    expect(screen.getByText('"><svg onload=alert(1)>')).toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    render(<PayloadCheatsheet />);

    await user.type(screen.getByTestId("cheatsheet-filter"), "zzz-no-such-payload");

    expect(screen.getByTestId("cheatsheet-empty")).toHaveTextContent(/no payloads match/i);
  });

  it("copies a payload with feedback", async () => {
    render(<PayloadCheatsheet />);

    const copyButtons = screen.getAllByTestId("cheatsheet-copy-xss");
    fireEvent.click(copyButtons[0]!);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("<script>alert(1)</script>");
    });
    expect(copyButtons[0]).toHaveTextContent(/copied/i);
  });
});
