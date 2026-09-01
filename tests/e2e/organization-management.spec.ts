import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";
import { getTestSupabaseEnv } from "../helpers/test-env";

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByRole("heading", { name: "Personal Workspace" })).toBeVisible({ timeout: 15_000 });
}

test("an authenticated user can create, edit, inspect and archive an organization", async ({ page }) => {
  const { url, publishableKey } = getTestSupabaseEnv();
  const setupClient = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const email = `e2e-organizations-${Date.now()}-${crypto.randomUUID()}@example.test`;
  const password = `Local-only-${crypto.randomUUID()}!`;
  const signUp = await setupClient.auth.signUp({ email, password });
  expect(signUp.error).toBeNull();

  await login(page, email, password);
  await page.goto("/organizations");

  await expect(page.getByRole("heading", { name: "Organisations", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Aucune organisation" })).toBeVisible();
  await page.getByRole("link", { name: "Nouvelle organisation" }).click();

  await page.getByLabel("Nom").fill("Demo Organization");
  await page.getByLabel("Type").selectOption("university");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("heading", { name: "Demo Organization" })).toBeVisible();
  await expect(page.getByText("Université")).toBeVisible();

  await page.getByRole("link", { name: "Modifier" }).click();
  await page.getByLabel("Nom").fill("Demo Organization Updated");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("heading", { name: "Demo Organization Updated" })).toBeVisible();

  await page.getByRole("button", { name: "Archiver" }).click();
  await expect(page).toHaveURL(/\/organizations\?status=archived$/);
  await expect(page.getByRole("link", { name: /Demo Organization Updated/ })).toBeVisible();

  await page.setViewportSize({ width: 360, height: 800 });
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("organization form exposes accessible validation feedback", async ({ page }) => {
  const { url, publishableKey } = getTestSupabaseEnv();
  const setupClient = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const email = `e2e-validation-${Date.now()}-${crypto.randomUUID()}@example.test`;
  const password = `Local-only-${crypto.randomUUID()}!`;
  await setupClient.auth.signUp({ email, password });
  await login(page, email, password);
  await page.goto("/organizations/new");

  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Corrigez les champs indiqués.", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Nom")).toHaveAttribute("aria-invalid", "true");
});
