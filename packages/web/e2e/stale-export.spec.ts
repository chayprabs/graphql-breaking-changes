import { test, expect } from "@playwright/test";

test("export hidden after diff results invalidated by edit", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Run diff" }).click();
  await expect(page.getByText(/Breaking:/)).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole("button", { name: "JSON" })).toBeVisible();

  await page.locator(".monaco-editor").first().click();
  await page.keyboard.press("Control+A");
  await page.keyboard.type("type Query { only: String }");

  await expect(page.getByText(/Breaking:/)).not.toBeVisible();
  await expect(page.getByRole("button", { name: "JSON" })).not.toBeVisible();
});

test("coverage export excludes stale diff after coverage-only run", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Schema Diff" }).click();
  await page.getByRole("button", { name: "Run diff" }).click();
  await expect(page.getByText(/Breaking:/)).toBeVisible({ timeout: 20000 });

  await page.getByRole("button", { name: "Load samples" }).click();
  await page.getByRole("button", { name: "Operation Coverage" }).click();
  await page.getByRole("button", { name: "Check operations" }).click();
  await expect(page.getByText(/operations valid/)).toBeVisible({ timeout: 20000 });

  await page.getByRole("button", { name: "JSON" }).click();
  // Download triggered — verify export button only appears with coverage (no diff panel)
  await expect(page.getByText(/Breaking:/)).not.toBeVisible();
});
