import { test, expect } from "@playwright/test";

test("home page loads and runs sample diff", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "GraphQLGuard" })).toBeVisible();
  await page.getByRole("button", { name: "Run diff" }).click();
  await expect(page.getByText(/Breaking:/)).toBeVisible({ timeout: 10000 });
});

test("seo routes render playground", async ({ page }) => {
  await page.goto("/graphql-diff");
  await expect(page.getByRole("button", { name: "Run diff" })).toBeVisible();
});

test("legal pages load", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "Terms & Conditions" })).toBeVisible();
});

test("external header links exist", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("GitHub repository")).toBeVisible();
  await expect(page.getByLabel("Twitter / X")).toBeVisible();
  await expect(page.getByLabel("Personal website")).toBeVisible();
});
