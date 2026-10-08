import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  AchievementCreateForm,
  AchievementList,
  describeCriteria,
} from "@/components/admin/achievement-forms";
import type { AdminAchievement, Category } from "@/lib/types";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh, replace: vi.fn(), prefetch: vi.fn() }),
}));

const categories: Category[] = [
  {
    id: 7,
    name: "Cryptography",
    slug: "cryptography",
    description: null,
    color: null,
    icon: null,
  },
];

const badge: AdminAchievement = {
  id: 4,
  key: "solver_10",
  title: "Rising Solver",
  description: "Solve 10 challenges.",
  icon: "star",
  criteria: { type: "solves_total", threshold: 10 },
  points: 50,
  is_active: true,
  sort_order: 2,
  awarded_count: 3,
};

let lastBody: unknown = null;

const server = setupServer(
  http.post("/api/v1/admin/achievements", async ({ request }) => {
    lastBody = await request.json();
    return HttpResponse.json({ data: { id: 9 } }, { status: 201 });
  }),
  http.put("/api/v1/admin/achievements/:id", async ({ request }) => {
    lastBody = await request.json();
    return HttpResponse.json({ data: { id: 4 } });
  }),
  http.delete("/api/v1/admin/achievements/:id", () => {
    lastBody = { deleted: true };
    return HttpResponse.json({ data: { ok: true } });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  refresh.mockClear();
  lastBody = null;
  vi.restoreAllMocks();
});
afterAll(() => server.close());

describe("describeCriteria", () => {
  it("names the category for category solves", () => {
    expect(
      describeCriteria(
        { criteria: { type: "category_solves", threshold: 2, category_id: 7 } },
        categories,
      ),
    ).toBe("Solve 2 in Cryptography");
  });
});

describe("AchievementCreateForm", () => {
  it("submits a criteria payload and refreshes", async () => {
    const user = userEvent.setup();
    render(<AchievementCreateForm categories={categories} />);

    await user.type(screen.getByLabelText("Title"), "Crypto Starter");
    expect(screen.getByLabelText("Key")).toHaveValue("crypto_starter");
    await user.type(screen.getByLabelText("Description"), "Solve two crypto challenges.");
    await user.selectOptions(screen.getByLabelText("Criteria"), "category_solves");
    expect(screen.getByLabelText("Category")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Solves required"));
    await user.type(screen.getByLabelText("Solves required"), "2");
    await user.clear(screen.getByLabelText("XP award"));
    await user.type(screen.getByLabelText("XP award"), "25");

    await user.click(screen.getByRole("button", { name: "Add achievement" }));

    await waitFor(() => {
      expect(lastBody).toEqual({
        key: "crypto_starter",
        title: "Crypto Starter",
        description: "Solve two crypto challenges.",
        icon: null,
        criteria: { type: "category_solves", threshold: 2, category_id: 7 },
        points: 25,
        is_active: true,
        sort_order: 0,
      });
    });
    expect(refresh).toHaveBeenCalled();
  });
});

describe("AchievementList", () => {
  it("hides delete for moderators and deactivates with confirmation", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<AchievementList items={[badge]} categories={categories} canDelete={false} />);

    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Deactivate" }));

    await waitFor(() => {
      expect(lastBody).toEqual({ is_active: false });
    });
    expect(refresh).toHaveBeenCalled();
  });

  it("lets an admin delete after confirming the award wipe", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<AchievementList items={[badge]} categories={categories} canDelete />);

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("3 awards"));
    await waitFor(() => {
      expect(lastBody).toEqual({ deleted: true });
    });
  });

  it("saves an edit without sending the key", async () => {
    const user = userEvent.setup();
    render(<AchievementList items={[badge]} categories={categories} canDelete />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const title = screen.getByLabelText("Title");
    await user.clear(title);
    await user.type(title, "Veteran Solver");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(lastBody).toMatchObject({
        title: "Veteran Solver",
        criteria: { type: "solves_total", threshold: 10 },
      });
    });
    expect(lastBody).not.toHaveProperty("key");
  });
});
