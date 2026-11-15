import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { listMock, addMock, deleteMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
  addMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock("@/lib/api/bookmarks-client", () => ({
  listBookmarks: listMock,
  addBookmark: addMock,
  deleteBookmark: deleteMock,
  updateBookmarkNote: vi.fn(),
}));

import { BookmarkToggle } from "./bookmark-toggle";

beforeEach(() => {
  listMock.mockReset();
  addMock.mockReset();
  deleteMock.mockReset();
  listMock.mockResolvedValue([
    { id: 7, type: "challenge", note: null, created_at: null, target: { id: 3, title: "Web" } },
  ]);
  addMock.mockResolvedValue({ id: 8, type: "challenge", note: null, created_at: null, target: { id: 9, title: "New" } });
  deleteMock.mockResolvedValue(undefined);
});

afterEach(cleanup);

describe("BookmarkToggle", () => {
  it("shows as saved when the target is bookmarked", async () => {
    render(<BookmarkToggle type="challenge" id={3} />);

    await waitFor(() => expect(screen.getByRole("button", { name: /saved/i })).toBeTruthy());
  });

  it("shows the bookmark action when the target is not bookmarked", async () => {
    listMock.mockResolvedValue([]);

    render(<BookmarkToggle type="challenge" id={3} />);

    await waitFor(() => expect(screen.getByRole("button", { name: /bookmark/i })).toBeTruthy());
  });

  it("adds a bookmark on click", async () => {
    listMock.mockResolvedValue([]);

    render(<BookmarkToggle type="challenge" id={9} />);

    await waitFor(() => expect(screen.getByRole("button", { name: /bookmark/i })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: /bookmark/i }));

    await waitFor(() => expect(addMock).toHaveBeenCalledWith("challenge", 9));
  });

  it("removes a bookmark on click", async () => {
    render(<BookmarkToggle type="challenge" id={3} />);

    await waitFor(() => expect(screen.getByRole("button", { name: /saved/i })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: /saved/i }));

    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith(7));
  });
});
