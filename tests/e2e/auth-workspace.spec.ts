import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { getTestSupabaseEnv } from "../helpers/test-env";

async function createTestUser() {
  const { url, publishableKey } = getTestSupabaseEnv();
  const setupClient = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const email = `e2e-${Date.now()}-${crypto.randomUUID()}@example.test`;
  const password = `Local-only-${crypto.randomUUID()}!`;
  const signUp = await setupClient.auth.signUp({ email, password });
  expect(signUp.error).toBeNull();

  return { email, password };
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByRole("heading", { name: "Personal Workspace" })).toBeVisible({ timeout: 15_000 });
}

async function getSeriousAxeViolations(page: Page) {
  await page.addScriptTag({ path: path.join(process.cwd(), "node_modules", "axe-core", "axe.min.js") });

  return page.evaluate(async () => {
    type AxeWindow = Window & {
      axe: {
        run: (context: Document) => Promise<{
          violations: Array<{ id: string; impact: string | null; help: string }>;
        }>;
      };
    };
    const result = await (window as unknown as AxeWindow).axe.run(document);
    return result.violations.filter((violation) =>
      violation.impact === "critical" || violation.impact === "serious",
    );
  });
}

test("login opens the protected workspace and logout returns to login", async ({ page }) => {
  const { email, password } = await createTestUser();

  await login(page, email, password);

  await expect(page.getByText("Espace protégé")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Aujourd’hui" })).toHaveAttribute("aria-current", "page");

  const violations = await getSeriousAxeViolations(page);
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);

  await page.setViewportSize({ width: 360, height: 800 });
  const mobileNavigation = page.getByRole("navigation", { name: "Navigation mobile" });
  await expect(mobileNavigation).toBeVisible();
  await mobileNavigation.getByRole("link", { name: "Tâches" }).click();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByRole("heading", { name: "Tâches", exact: true })).toBeVisible();
  await expect(mobileNavigation.getByRole("link", { name: "Tâches" })).toHaveAttribute("aria-current", "page");

  await mobileNavigation.getByRole("link", { name: "Plus" }).click();
  await expect(page).toHaveURL(/\/more$/);
  await expect(page.getByRole("heading", { name: "Plus", level: 1 })).toBeVisible();

  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
});

test("skip link is visible from the keyboard and moves focus to the main content", async ({ page }) => {
  const { email, password } = await createTestUser();
  await login(page, email, password);
  await page.goto("/tasks");
  await expect(page.getByRole("heading", { name: "Tâches", exact: true })).toBeVisible();

  await page.keyboard.press("Tab");

  const skipLink = page.getByRole("link", { name: "Aller au contenu principal" });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
  const skipLinkBox = await skipLink.boundingBox();
  expect(skipLinkBox).not.toBeNull();
  expect(skipLinkBox?.y).toBeGreaterThanOrEqual(0);

  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/tasks#main-content$/);
  await expect(page.locator("#main-content")).toBeFocused();
});

test("mobile navigation at 360px has no serious accessibility violation", async ({ page }) => {
  const { email, password } = await createTestUser();
  await page.setViewportSize({ width: 360, height: 800 });
  await login(page, email, password);
  await page.goto("/tasks");

  const mobileNavigation = page.getByRole("navigation", { name: "Navigation mobile" });
  await expect(mobileNavigation).toBeVisible();
  await expect(mobileNavigation.getByRole("link", { name: "Tâches" })).toHaveAttribute("aria-current", "page");
  await expect(mobileNavigation.getByRole("link", { name: "Accueil" })).not.toHaveAttribute("aria-current", "page");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  const violations = await getSeriousAxeViolations(page);
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
});
