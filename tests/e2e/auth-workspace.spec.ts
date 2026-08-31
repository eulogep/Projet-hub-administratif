import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import path from "node:path";
import { getTestSupabaseEnv } from "../helpers/test-env";

test("login opens the protected workspace and logout returns to login", async ({ page }) => {
  const { url, publishableKey } = getTestSupabaseEnv();
  const setupClient = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const email = `e2e-${Date.now()}-${crypto.randomUUID()}@example.test`;
  const password = `Local-only-${crypto.randomUUID()}!`;
  const signUp = await setupClient.auth.signUp({ email, password });
  expect(signUp.error).toBeNull();

  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page.getByRole("heading", { name: "Personal Workspace" })).toBeVisible();
  await expect(page.getByText("Espace protégé")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Aujourd’hui" })).toHaveAttribute("aria-current", "page");

  await page.addScriptTag({ path: path.join(process.cwd(), "node_modules", "axe-core", "axe.min.js") });
  const violations = await page.evaluate(async () => {
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
