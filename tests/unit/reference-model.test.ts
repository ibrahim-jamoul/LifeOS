import { describe, expect, it } from "vitest";

import { getResourceConfig } from "../../src/lib/resources";

function schema(key: string) {
  const config = getResourceConfig(key);
  if (!config) throw new Error(`Missing resource config: ${key}`);
  return config.schema;
}

describe("reference model validation", () => {
  it("keeps an unknown goal priority explicit and allows an unfinished definition", () => {
    const result = schema("goals").safeParse({
      title: "Objectif explicite",
      life_area: "perso",
      desired_outcome: "",
      definition_of_done: "",
      status: "draft",
      priority: "unset",
      configuration_status: "to_complete",
      horizon: "",
      start_date: "",
      target_date: "",
      target_value: "",
      target_unit: "",
      progress_percent: 0,
      next_action: "",
      next_review_date: "",
      reason: "",
      risk_notes: "",
      notes: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a task that invents two levels of deadline precision", () => {
    const result = schema("tasks").safeParse({
      title: "Action",
      life_area: "pro",
      project_id: "",
      status: "todo",
      priority: "unset",
      configuration_status: "ready",
      due_on: "2026-10-31",
      due_at: "2026-10-31T12:00:00.000Z",
      estimate_minutes: "",
      actual_minutes: "",
      notes: "",
    });
    expect(result.success).toBe(false);
  });

  it("keeps an operational planning date separate from the real deadline", () => {
    const result = schema("tasks").safeParse({
      title: "Action planifiée",
      life_area: "pro",
      project_id: "",
      status: "todo",
      priority: "high",
      configuration_status: "ready",
      planned_on: "2026-10-30",
      due_on: "2026-10-31",
      due_at: "",
      estimate_minutes: 45,
      actual_minutes: "",
      notes: "",
    });
    expect(result.success).toBe(true);
  });

  it("keeps an unscheduled weekly routine editable while its configuration is incomplete", () => {
    const base = {
      name: "Séance hebdomadaire",
      goal_id: "",
      project_id: "",
      kpi_id: "",
      target_frequency: "weekly",
      target_count: 1,
      target_unit: "séance",
      duration_minutes: "",
      schedule_weekday: "",
      schedule_day_of_month: "",
      time_context: "",
      start_on: "",
      end_on: "",
      reminder_enabled: false,
      reminder_time: "",
      status: "active",
      active: true,
      notes: "",
    };
    expect(schema("religion_routines").safeParse({ ...base, configuration_status: "to_configure" }).success).toBe(true);
    expect(schema("religion_routines").safeParse({ ...base, configuration_status: "to_validate" }).success).toBe(true);
    expect(schema("religion_routines").safeParse({ ...base, configuration_status: "to_complete" }).success).toBe(true);
    expect(schema("religion_routines").safeParse({ ...base, configuration_status: "ready" }).success).toBe(false);

    const habit = { ...base, life_area: "perso", frequency: "weekly" };
    expect(schema("habits").safeParse({ ...habit, configuration_status: "to_validate" }).success).toBe(true);
    expect(schema("habits").safeParse({ ...habit, configuration_status: "ready" }).success).toBe(false);
  });

  it("represents an unknown KPI cadence explicitly instead of calling it ad hoc", () => {
    const base = {
      name: "Mesure à configurer",
      life_area: "perso",
      goal_id: "",
      unit: "",
      target_type: "none",
      target_value: "",
      target_min: "",
      target_max: "",
      cadence: "unset",
      direction: "none",
      active: true,
      notes: "",
    };
    expect(schema("kpis").safeParse({ ...base, configuration_status: "to_configure" }).success).toBe(true);
    expect(schema("kpis").safeParse({ ...base, configuration_status: "ready" }).success).toBe(false);
  });

  it("accepts date-only reminders and rejects an orphan reminder time", () => {
    const base = {
      title: "Réévaluer la décision",
      life_area: "pro",
      source_type: "decision",
      source_id: "",
      remind_at: "",
      recurrence: "none",
      timezone: "Europe/Paris",
      configuration_status: "ready",
      active: true,
    };
    expect(schema("reminders").safeParse({ ...base, remind_on: "2026-10-31", reminder_time: "" }).success).toBe(true);
    expect(schema("reminders").safeParse({ ...base, remind_on: "", reminder_time: "09:00" }).success).toBe(false);
  });
});
