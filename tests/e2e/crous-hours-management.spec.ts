import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import { getTestSupabaseEnv } from "../helpers/test-env";

test("CROUS period, interventions, overlap confirmation and summaries", async ({ page }) => {
  const { url, publishableKey } = getTestSupabaseEnv();
  const client = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const email = `e2e-crous-${Date.now()}-${crypto.randomUUID()}@example.test`;
  const password = `Local-only-${crypto.randomUUID()}!`;
  const signUp = await client.auth.signUp({ email, password });
  expect(signUp.error).toBeNull();
  if (!signUp.data.session) expect((await client.auth.signInWithPassword({ email, password })).error).toBeNull();
  const workspace = await client.rpc("bootstrap_personal_workspace");
  expect(workspace.error).toBeNull();
  const organization = await client.from("organizations").insert({ workspace_id: workspace.data, name: `Synthetic CROUS ${crypto.randomUUID().slice(0, 8)}`, type: "crous" }).select("id").single();
  expect(organization.error).toBeNull();
  if (!organization.data) throw new Error("Synthetic CROUS organization was not created.");
  const mission = await client.from("missions").insert({ workspace_id: workspace.data, organization_id: organization.data.id, title: "Synthetic CROUS Mission E2E", status: "active" }).select("id").single();
  expect(mission.error).toBeNull();

  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByRole("heading", { name: "Personal Workspace" })).toBeVisible({ timeout: 15_000 });
  await page.goto("/crous-hours");
  await expect(page.getByRole("heading", { name: "Aucune période" })).toBeVisible();
  await page.getByRole("link", { name: "Nouvelle période" }).click();
  await expect(page.locator('form[data-hydrated="true"]')).toBeVisible();
  await page.getByLabel("Mission CROUS").selectOption({ label: "Synthetic CROUS Mission E2E" });
  await page.getByLabel("Libellé").fill("Synthetic CROUS Period E2E");
  await page.getByLabel("Début").fill("2026-01-01");
  await page.getByLabel("Fin").fill("2026-12-31");
  await page.getByLabel("Objectif (minutes)").fill("600");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("heading", { name: "Synthetic CROUS Period E2E" })).toBeVisible();

  await page.getByRole("link", { name: "Ajouter une intervention" }).click();
  await expect(page.locator('form[data-hydrated="true"]')).toBeVisible();
  await page.getByLabel("Début").fill("2026-09-01T09:00");
  await page.getByLabel("Fin").fill("2026-09-01T10:30");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Calculé 1 h 30 · Crédité 1 h 30")).toBeVisible();

  await page.getByRole("link", { name: "Ajouter une intervention" }).click();
  await expect(page.locator('form[data-hydrated="true"]')).toBeVisible();
  await page.getByLabel("Début").fill("2026-09-01T10:00");
  await page.getByLabel("Fin").fill("2026-09-01T11:00");
  await page.getByLabel("Durée créditée (minutes, facultatif)").fill("45");
  await page.getByLabel("Justification de l’ajustement").fill("Synthetic adjustment");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("heading", { name: "Chevauchement détecté" })).toBeVisible();
  await page.getByRole("button", { name: "Confirmer l’intervention" }).click();
  await expect(page.getByText("Calculé 1 h 00 · Crédité 0 h 45")).toBeVisible();
  await expect(page.getByText("Réalisé").locator("..").getByText("2 h 15")).toBeVisible();

  await page.setViewportSize({ width: 360, height: 800 });
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.addScriptTag({ path: path.join(process.cwd(), "node_modules", "axe-core", "axe.min.js") });
  const serious = await page.evaluate(async () => (await (window as unknown as { axe: { run: (document: Document) => Promise<{ violations: Array<{ impact: string | null }> }> } }).axe.run(document)).violations.filter((item) => item.impact === "critical" || item.impact === "serious"));
  expect(serious).toEqual([]);
});
