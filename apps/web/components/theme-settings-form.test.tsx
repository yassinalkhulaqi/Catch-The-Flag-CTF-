import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ThemeSettingsForm } from "@/components/theme-settings-form";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh, replace: vi.fn(), prefetch: vi.fn() }),
}));

const server = setupServer(
  http.put("/api/v1/me/settings", async ({ request }) => {
    const body = (await request.json()) as { theme: string };
    return HttpResponse.json({ data: { email: "learner@example.com", theme: body.theme } });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  refresh.mockClear();
  delete document.documentElement.dataset.theme;
});
afterAll(() => server.close());

describe("ThemeSettingsForm", () => {
  it("applies the saved theme on the document", async () => {
    const user = userEvent.setup();
    render(<ThemeSettingsForm initialTheme="system" />);

    await user.selectOptions(screen.getByLabelText("Theme"), "light");
    await user.click(screen.getByRole("button", { name: "Save preferences" }));

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe("light");
    });
    expect(refresh).toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent(/saved/i);
  });
});
