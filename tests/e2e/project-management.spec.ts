import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import { getTestSupabaseEnv } from "../helpers/test-env";

test("project lifecycle, mission association and accessible mobile layout", async ({ page }) => {
  const { url, publishableKey } = getTestSupabaseEnv(); const client = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const email = `e2e-projects-${Date.now()}-${crypto.randomUUID()}@example.test`; const password = `Local-only-${crypto.randomUUID()}!`;
  const signUp = await client.auth.signUp({ email, password }); expect(signUp.error).toBeNull(); if (!signUp.data.session) expect((await client.auth.signInWithPassword({ email, password })).error).toBeNull();
  const workspace = await client.rpc("bootstrap_personal_workspace"); expect(workspace.error).toBeNull();
  const organizationName = `Synthetic Organization ${crypto.randomUUID().slice(0, 8)}`;
  expect((await client.from("organizations").insert({ workspace_id: workspace.data, name: organizationName, type: "other" })).error).toBeNull();
  await page.goto("/login"); await page.getByLabel("Adresse e-mail").fill(email); await page.getByLabel("Mot de passe").fill(password); await page.getByRole("button", { name: "Se connecter" }).click(); await expect(page.getByRole("heading", { name: "Personal Workspace" })).toBeVisible({ timeout: 15_000 });
  await page.goto("/projects"); await expect(page.getByRole("heading", { name: "Aucun projet" })).toBeVisible(); await page.getByRole("link", { name: "Nouveau projet" }).click(); await expect(page.locator('form[data-hydrated="true"]')).toBeVisible();
  await page.getByLabel("Organisation").selectOption({ label: organizationName }); await page.getByLabel("Nom").fill("Synthetic Project E2E"); await page.getByLabel("Statut").selectOption("active"); await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("heading", { name: "Synthetic Project E2E" })).toBeVisible(); await page.getByRole("link", { name: "Nouvelle mission" }).click(); await expect(page.getByLabel("Projet (facultatif)")).toHaveValue(/.+/); await page.getByLabel("Titre").fill("Synthetic Project Mission"); await page.getByLabel("Statut").selectOption("active"); await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("heading", { name: "Synthetic Project Mission" })).toBeVisible(); await page.goto("/projects"); await page.getByRole("link", { name: "Synthetic Project E2E" }).click(); await expect(page.getByRole("link", { name: "Synthetic Project Mission" })).toBeVisible();
  await page.setViewportSize({ width: 360, height: 800 }); await page.reload(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.addScriptTag({ path: path.join(process.cwd(), "node_modules", "axe-core", "axe.min.js") }); const serious = await page.evaluate(async () => (await (window as unknown as { axe: { run: (document: Document) => Promise<{ violations: Array<{ impact: string | null }> }> } }).axe.run(document)).violations.filter((item) => item.impact === "critical" || item.impact === "serious")); expect(serious).toEqual([]);
  await page.getByRole("link", { name: "Modifier" }).click(); await page.getByLabel("Nom").fill("Synthetic Project Updated"); await page.getByRole("button", { name: "Enregistrer" }).click(); await page.getByRole("button", { name: "Archiver" }).click(); await expect(page).toHaveURL(/archive=archived/); await expect(page.getByRole("link", { name: "Synthetic Project Updated" })).toBeVisible();
});
