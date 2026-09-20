import { expect, test, type Page } from "@playwright/test";

const email = process.env.LIFEOS_E2E_EMAIL;
const password = process.env.LIFEOS_E2E_PASSWORD;

test("an anonymous visitor cannot open the private application", async ({ page }) => {
  await page.goto("/app/dashboard");
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
  await expect(page.getByRole("heading", { name: "Retrouver votre cap" })).toBeVisible();
});

test("authenticated P0 control-plane and branch journey", async ({ page }) => {
  test.setTimeout(120_000);
  test.skip(!email || !password, "Set LIFEOS_E2E_EMAIL and LIFEOS_E2E_PASSWORD for the authenticated journey.");
  await login(page, email!, password!);
  const suffix = crypto.randomUUID().slice(0, 8);
  const created: { resource: string; id: string }[] = [];

  const create = async (resource: string, payload: Record<string, unknown>) => {
    const response = await page.request.post(`/api/data/${resource}`, { data: payload });
    const raw = await response.text();
    expect(response.ok(), `${resource}: ${raw}`).toBeTruthy();
    const body = JSON.parse(raw) as { ok: true; data: { id: string } };
    if (body.data.id) created.push({ resource, id: body.data.id });
    return body.data;
  };

  try {
    const goal = await create("goals", { title: `E2E Goal ${suffix}`, desired_outcome: "P0 journey", definition_of_done: "All linked records persist", status: "active", priority: "high", horizon: null, start_date: null, target_date: null, progress_percent: 10, reason: null, risk_notes: null, notes: null });
    const project = await create("projects", { title: `E2E Project ${suffix}`, summary: null, goal_ids: [goal.id], status: "focus", priority: "high", target_date: null, next_milestone: "Validate", next_action: "Run E2E", progress_percent: 20, impact: 4, urgency: 4, confidence: 4, effort: 2, budget_planned: 0, budget_actual: 0, blocker_note: null, notes: null });
    const task = await create("tasks", { title: `E2E Task ${suffix}`, project_id: project.id, status: "todo", priority: "high", due_at: new Date(Date.now() - 60_000).toISOString(), estimate_minutes: 20, actual_minutes: null, notes: null });
    const complete = await page.request.post(`/api/tasks/${task.id}/complete`);
    expect(complete.ok()).toBeTruthy();
    const kpi = await create("kpis", { name: `E2E KPI ${suffix}`, goal_id: goal.id, unit: "%", target_type: "min", target_value: 80, target_min: null, target_max: null, cadence: "weekly", direction: "increase", active: true });
    await create("kpi_entries", { kpi_id: kpi.id, measured_at: new Date().toISOString(), value: 82, note: "E2E" });
    await create("decisions", { title: `E2E Decision ${suffix}`, decision_date: isoDate(), goal_id: goal.id, project_id: project.id, context: "Test", options_considered: "A / B", selected_option: "A", assumptions: null, expected_outcome: "Pass", review_date: isoDate(), actual_outcome: null, lesson: null });
    await create("weekly_reviews", { week_start: monday(), wins: "E2E", misses: null, causes: null, risks: null, pause_or_stop: null, next_week_top3: "1. Keep testing", notes: null });

    const topic = await create("religion_topics", { title: `E2E Topic ${suffix}`, category: "other", resource: null, status: "active", target_date: null, progress_percent: 0, notes: null });
    await create("religion_sessions", { topic_id: topic.id, occurred_at: new Date().toISOString(), duration_minutes: 15, activity_type: "reading", resource: null, summary: "E2E", takeaway: null });
    const routine = await create("religion_routines", { name: `E2E Routine ${suffix}`, target_frequency: "weekly", target_count: 1, active: true, notes: null });
    await create("religion_logs", { routine_id: routine.id, occurred_at: new Date().toISOString(), note: "E2E" });
    await create("arabic_sessions", { occurred_at: new Date().toISOString(), duration_minutes: 20, skill: "reading", resource: null, new_words: 2, reviewed_words: 3, notes: null });
    const quran = await create("quran_items", { surah_number: 1, surah_name: "Al-Fatiha", start_ayah: 1, end_ayah: 7, activity: "revision", status: "active", confidence: 4, next_revision_at: new Date(Date.now() - 60_000).toISOString(), notes: null });
    await create("quran_sessions", { quran_item_id: quran.id, occurred_at: new Date().toISOString(), duration_minutes: 10, activity: "revision", confidence: 4, outcome: "E2E", next_revision_at: null });

    const accountA = await create("financial_accounts", { name: `E2E Cash ${suffix}`, account_type: "cash", institution: null, currency: "EUR", current_balance: 100, include_in_net_worth: true, is_liability: false, active: true });
    const accountB = await create("financial_accounts", { name: `E2E Save ${suffix}`, account_type: "savings", institution: null, currency: "EUR", current_balance: 0, include_in_net_worth: true, is_liability: false, active: true });
    await create("financial_transactions", { account_id: accountA.id, destination_account_id: null, occurred_on: isoDate(), amount: 50, tx_type: "income", category: "test", description: "E2E income", currency: "EUR", notes: null });
    await create("financial_transactions", { account_id: accountA.id, destination_account_id: null, occurred_on: isoDate(), amount: 10, tx_type: "expense", category: "test", description: "E2E expense", currency: "EUR", notes: null });
    const transfer = await page.request.post("/api/data/financial_transactions", { data: { account_id: accountA.id, destination_account_id: accountB.id, occurred_on: isoDate(), amount: 5, tx_type: "transfer", category: null, description: "E2E transfer", currency: "EUR", notes: null } });
    const transferRaw = await transfer.text();
    expect(transfer.ok(), transferRaw).toBeTruthy();
    const transferBody = JSON.parse(transferRaw) as { data: { source_transaction_id: string; destination_transaction_id: string } };
    created.push({ resource: "financial_transactions", id: transferBody.data.source_transaction_id });
    created.push({ resource: "financial_transactions", id: transferBody.data.destination_transaction_id });
    await create("net_worth_snapshots", { snapshot_date: isoDate(), assets: 100, liabilities: 0, currency: "EUR", note: "E2E" });

    const habit = await create("habits", { name: `E2E Habit ${suffix}`, frequency: "daily", target_count: 1, reminder_time: null, active: true, notes: null });
    await create("habit_logs", { habit_id: habit.id, occurred_on: isoDate(), count: 1, note: null });
    const metric = await create("health_metrics", { name: `E2E Metric ${suffix}`, unit: "pt", active: true });
    await create("health_entries", { metric_id: metric.id, measured_at: new Date().toISOString(), value: 42, note: null });
    await create("workouts", { occurred_at: new Date().toISOString(), activity: "E2E walk", duration_minutes: 20, intensity: "low", notes: null });

    await page.goto("/app/dashboard");
    await expect(page.getByRole("heading", { name: /Bonjour/ })).toBeVisible();
    const financeInsight = await page.request.get("/api/insights/finances");
    expect(financeInsight.ok()).toBeTruthy();
    const financeBody = await financeInsight.json() as { data: { totals: { excludedTransfers: number }[] } };
    expect(financeBody.data.totals.some((total) => total.excludedTransfers >= 2)).toBeTruthy();
  } finally {
    for (const item of created.reverse()) await page.request.delete(`/api/data/${item.resource}/${item.id}`);
  }
});

async function login(page: Page, userEmail: string, userPassword: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(userEmail);
  await page.getByLabel("Mot de passe", { exact: true }).fill(userPassword);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 30_000 });
}

function isoDate(): string { return new Date().toISOString().slice(0, 10); }
function monday(): string { const value = new Date(); const day = value.getUTCDay() || 7; value.setUTCDate(value.getUTCDate() - day + 1); return value.toISOString().slice(0, 10); }
