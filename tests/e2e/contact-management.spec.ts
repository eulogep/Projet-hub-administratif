import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";
import { getTestSupabaseEnv } from "../helpers/test-env";

async function setupContactContext() {
  const { url, publishableKey } = getTestSupabaseEnv();
  const client = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const email = `e2e-contacts-${Date.now()}-${crypto.randomUUID()}@example.test`;
  const password = `Local-only-${crypto.randomUUID()}!`;
  const signUp = await client.auth.signUp({ email, password });
  expect(signUp.error).toBeNull();
  if (!signUp.data.session) expect((await client.auth.signInWithPassword({ email, password })).error).toBeNull();
  const workspace = await client.rpc("bootstrap_personal_workspace");
  expect(workspace.error).toBeNull();
  const organizationName = `Demo Organization ${crypto.randomUUID().slice(0, 8)}`;
  const organization = await client.from("organizations").insert({ workspace_id: workspace.data, name: organizationName, type: "other" }).select("id").single();
  expect(organization.error).toBeNull();
  return { email, password, organizationName };
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByRole("heading", { name: "Personal Workspace" })).toBeVisible({ timeout: 15_000 });
}

async function seriousAxeViolations(page: Page) {
  await page.addScriptTag({ path: path.join(process.cwd(), "node_modules", "axe-core", "axe.min.js") });
  return page.evaluate(async () => {
    const result = await (window as unknown as { axe: { run: (document: Document) => Promise<{ violations: Array<{ id: string; impact: string | null }> }> } }).axe.run(document);
    return result.violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious");
  });
}

test("contact lifecycle includes organization, search, timeline, follow-up and archive", async ({ page }) => {
  const context = await setupContactContext();
  await login(page, context.email, context.password);
  await page.goto("/contacts");
  await expect(page.getByRole("heading", { name: "Aucun contact" })).toBeVisible();
  await page.getByRole("link", { name: "Nouveau contact" }).click();
  await expect(page.locator('form[data-hydrated="true"]')).toBeVisible();

  await page.getByLabel("Prénom").fill("Élodie");
  await page.getByLabel("Nom", { exact: true }).fill("Exemple");
  await page.getByLabel("Adresse e-mail").fill("demo.contact@example.test");
  await page.getByLabel(context.organizationName).check();
  await page.getByLabel("Fonction").fill("Synthetic role");
  await page.getByLabel("Organisation principale").check();
  await page.getByRole("button", { name: "Enregistrer" }).click();

  await expect(page.getByRole("heading", { name: "Élodie Exemple" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Organisations liées" }).getByText(context.organizationName, { exact: true })).toBeVisible();
  await page.getByLabel("Résumé").fill("Synthetic interaction summary");
  await page.getByLabel("Prochaine action").fill("Synthetic next action");
  await page.getByLabel("Date de relance").fill("2026-09-03");
  await page.getByRole("button", { name: "Ajouter à l’historique" }).click();
  await expect(page.getByRole("heading", { name: "Prochaine action" })).toBeVisible();
  await expect(page.getByText("Synthetic interaction summary")).toBeVisible();
  await page.getByRole("button", { name: "Marquer comme réalisée" }).click();
  await expect(page.getByRole("heading", { name: "Prochaine action" })).not.toBeVisible();

  await page.goto("/contacts?q=elodie");
  await expect(page.getByRole("link", { name: /Élodie Exemple/ })).toBeVisible();
  await page.setViewportSize({ width: 360, height: 800 });
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(await seriousAxeViolations(page)).toEqual([]);

  await page.getByRole("link", { name: /Élodie Exemple/ }).click();
  await page.getByRole("button", { name: "Archiver" }).click();
  await expect(page).toHaveURL(/\/contacts\?status=archived$/);
  await expect(page.getByRole("link", { name: /Élodie Exemple/ })).toBeVisible();
});

test("duplicate warning requires a second explicit save", async ({ page }) => {
  const context = await setupContactContext();
  await login(page, context.email, context.password);
  for (let index = 0; index < 2; index += 1) {
    await page.goto("/contacts/new");
    await expect(page.locator('form[data-hydrated="true"]')).toBeVisible();
    await page.getByLabel("Nom affiché").fill("Demo Duplicate Contact");
    await page.getByLabel("Adresse e-mail").fill("duplicate.contact@example.test");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    if (index === 1) {
      await expect(page.getByRole("heading", { name: "Doublons potentiels" })).toBeVisible();
      await page.getByRole("button", { name: "Confirmer l’enregistrement" }).click();
    }
    await expect(page.getByRole("heading", { name: "Demo Duplicate Contact" })).toBeVisible();
  }
});
