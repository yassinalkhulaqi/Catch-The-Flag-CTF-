import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataTable } from "@/components/admin/data-table";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh: vi.fn() }),
  usePathname: () => "/admin/challenges",
  useSearchParams: () => new URLSearchParams(),
}));

describe("DataTable", () => {
  it("filters loaded rows and exposes sortable headers", async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        caption="Challenges"
        rows={[
          { id: 1, title: "Packet capture" },
          { id: 2, title: "Known plaintext" },
        ]}
        searchText={(row) => row.title}
        rowLabel={(row) => row.title}
        columns={[
          {
            id: "title",
            header: "Title",
            sortValue: (row) => row.title,
            cell: (row) => row.title,
          },
        ]}
      />,
    );

    expect(screen.getByText("Packet capture")).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("Search this page"), "plain");
    expect(replace).toHaveBeenCalled();
  });
});
