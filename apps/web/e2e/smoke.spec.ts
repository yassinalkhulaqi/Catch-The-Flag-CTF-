import { test, expect } from '@playwright/test';

test('home page loads and shows the platform title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Catch The Flag/i);
});

test('login page loads', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
});
