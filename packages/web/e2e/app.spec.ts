import { test, expect } from "@playwright/test";

test("home page loads and runs sample diff", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "GraphQLGuard" })).toBeVisible();
  await page.getByRole("button", { name: "Run diff" }).click();
  await expect(page.getByText(/Breaking:/)).toBeVisible({ timeout: 20000 });
});

test("coverage tab validates sample operation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Operation Coverage" }).click();
  await page.getByRole("button", { name: "Check operations" }).click();
  await expect(page.getByText(/operations valid/)).toBeVisible({ timeout: 20000 });
});

test("federation compose mode works", async ({ page }) => {
  await page.goto("/apollo-federation-check");
  await page.getByRole("button", { name: "Compose subgraphs" }).click();
  await expect(page.getByText(/Composition succeeded|Composition failed/)).toBeVisible({
    timeout: 20000,
  });
});

const SEO_ROUTES = [
  "/graphql-diff",
  "/graphql-breaking-check",
  "/graphql-operation-coverage",
  "/apollo-federation-check",
  "/graphql-schema-lint",
];

for (const route of SEO_ROUTES) {
  test(`seo route ${route} renders playground`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByRole("button", { name: /Run diff|Check operations|Compose subgraphs|Lint schema/ })).toBeVisible();
  });
}

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
