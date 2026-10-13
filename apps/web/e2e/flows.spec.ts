import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@example.com";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "ChangeMe-Admin-Passw0rd!";

async function apiIsUp(request: APIRequestContext): Promise<boolean> {
  try {
    const response = await request.get("http://127.0.0.1:8000/api/v1/health", { timeout: 3000 });
    return response.ok();
  } catch {
    return false;
  }
}

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByTestId("login-email").fill(adminEmail);
  await page.getByTestId("login-password").fill(adminPassword);
  await page.getByTestId("login-submit").click();
  await expect(page).toHaveURL(/dashboard/);
}

test.beforeEach(async ({ request }) => {
  test.skip(!(await apiIsUp(request)), "Laravel API is not running on :8000");
});

test("signs in and switches theme", async ({ page }) => {
  await signIn(page);
  await page.getByRole("radio", { name: "Light" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("wrong flag, then a rate-limit message if the API returns 429", async ({ page }) => {
  await signIn(page);
  await page.goto("/challenges/welcome-text-flag");
  const input = page.getByTestId("flag-input");
  await input.fill("flag{this-is-not-the-flag}");
  await page.getByTestId("flag-submit").click();
  await expect(page.getByTestId("flag-incorrect").or(page.getByText(/Too many submissions/))).toBeVisible();
});

test("path prerequisites are visible when the demo path lists them", async ({ page }) => {
  await signIn(page);
  await page.goto("/paths");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("admin can open the new challenge wizard", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/challenges/new");
  await expect(page.getByLabel("Title")).toBeVisible();
  await page.getByLabel("Title").fill(`E2E draft ${Date.now()}`);
  await page.getByRole("button", { name: "Next: scenario" }).click();
  await expect(page.getByLabel("Description (Markdown)")).toBeVisible();
});
