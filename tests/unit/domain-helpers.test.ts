import { describe, expect, it } from "vitest";

import {
  calculateFinancialTotals,
  calculateProjectScore,
  classifyDueStatus,
  classifyKpiValue,
  getHealthTrendWindow,
  getIsoWeek,
  isDueSoon,
  isOverdue,
  startOfCalendarDay,
} from "../../src/lib/domain";

describe("calculateProjectScore", () => {
  it("applies the advisory formula and rounds to two decimals", () => {
    expect(
      calculateProjectScore({ impact: 5, urgency: 4, confidence: 4, effort: 3 }),
    ).toBe(26.67);
  });

  it("uses a minimum divisor of one", () => {
    expect(
      calculateProjectScore({ impact: 5, urgency: 4, confidence: 3, effort: 0 }),
    ).toBe(60);
  });

  it("does not invent a score from missing or invalid ratings", () => {
    expect(
      calculateProjectScore({ impact: null, urgency: 4, confidence: 3, effort: 2 }),
    ).toBeNull();
    expect(
      calculateProjectScore({ impact: 6, urgency: 4, confidence: 3, effort: 2 }),
    ).toBeNull();
    expect(
      calculateProjectScore({ impact: 5, urgency: 4, confidence: 3, effort: -1 }),
    ).toBeNull();
  });
});

describe("classifyKpiValue", () => {
  it("classifies minimum targets, including an explicit watch margin", () => {
    const target = { targetType: "min" as const, targetValue: 10, watchMargin: 2 };
    expect(classifyKpiValue(target, 10)).toBe("on_track");
    expect(classifyKpiValue(target, 9)).toBe("watch");
    expect(classifyKpiValue(target, 7)).toBe("off_track");
  });

  it("classifies maximum targets", () => {
    const target = { targetType: "max" as const, targetValue: 5, watchMargin: 1 };
    expect(classifyKpiValue(target, 4)).toBe("on_track");
    expect(classifyKpiValue(target, 6)).toBe("watch");
    expect(classifyKpiValue(target, 7)).toBe("off_track");
  });

  it("classifies exact targets without false floating-point misses", () => {
    const target = { targetType: "exact" as const, targetValue: 0.3, watchMargin: 0.1 };
    expect(classifyKpiValue(target, 0.1 + 0.2)).toBe("on_track");
    expect(classifyKpiValue(target, 0.4)).toBe("watch");
    expect(classifyKpiValue(target, 0.5)).toBe("off_track");
  });

  it("treats range boundaries as on track", () => {
    const target = {
      targetType: "range" as const,
      targetMin: 20,
      targetMax: 30,
      watchMargin: 2,
    };
    expect(classifyKpiValue(target, 20)).toBe("on_track");
    expect(classifyKpiValue(target, 30)).toBe("on_track");
    expect(classifyKpiValue(target, 19)).toBe("watch");
    expect(classifyKpiValue(target, 33)).toBe("off_track");
  });

  it("uses insufficient_data for absent measurements, no target, or bad configuration", () => {
    expect(classifyKpiValue({ targetType: "min", targetValue: 10 }, null)).toBe(
      "insufficient_data",
    );
    expect(classifyKpiValue({ targetType: "none" }, 10)).toBe("insufficient_data");
    expect(classifyKpiValue({ targetType: "exact" }, 10)).toBe("insufficient_data");
    expect(
      classifyKpiValue({ targetType: "range", targetMin: 5, targetMax: 2 }, 3),
    ).toBe("insufficient_data");
  });

  it("does not create a watch state unless a margin is configured", () => {
    expect(classifyKpiValue({ targetType: "min", targetValue: 10 }, 9.99)).toBe(
      "off_track",
    );
  });
});

describe("deadline status helpers", () => {
  const now = "2026-09-20T10:00:00.000Z";

  it("distinguishes overdue, due soon, and upcoming timestamps", () => {
    expect(classifyDueStatus({ dueAt: "2026-09-20T09:59:59.000Z", now })).toBe(
      "overdue",
    );
    expect(classifyDueStatus({ dueAt: "2026-09-21T10:00:00.000Z", now })).toBe(
      "due_soon",
    );
    expect(classifyDueStatus({ dueAt: "2026-09-21T10:00:00.001Z", now })).toBe(
      "upcoming",
    );
  });

  it("never marks a terminal item overdue or due soon", () => {
    const input = { dueAt: "2026-09-19T10:00:00.000Z", now, status: "done" } as const;
    expect(classifyDueStatus(input)).toBe("complete");
    expect(isOverdue(input)).toBe(false);
    expect(isDueSoon(input)).toBe(false);
  });

  it("handles absent deadlines and date-only deadlines in the user's time zone", () => {
    expect(classifyDueStatus({ dueAt: null, now })).toBe("no_due_date");
    expect(
      classifyDueStatus({
        dueAt: "2026-01-01",
        now: "2026-01-02T00:30:00.000Z",
        timeZone: "Europe/Paris",
      }),
    ).toBe("overdue");
    expect(
      classifyDueStatus({
        dueAt: "2026-01-02",
        now: "2026-01-02T00:30:00.000Z",
        timeZone: "Europe/Paris",
      }),
    ).toBe("due_soon");
    expect(
      classifyDueStatus({
        dueAt: "2026-01-03",
        now: "2026-01-02T00:30:00.000Z",
        dueSoonWithinMs: 12 * 60 * 60 * 1_000,
        timeZone: "Europe/Paris",
      }),
    ).toBe("upcoming");
  });

  it("rejects invalid dates and negative windows", () => {
    expect(() => classifyDueStatus({ dueAt: "not-a-date", now })).toThrow(RangeError);
    expect(() =>
      classifyDueStatus({ dueAt: now, now, dueSoonWithinMs: -1 }),
    ).toThrow(RangeError);
  });
});

describe("getIsoWeek", () => {
  it("handles ISO week-year boundaries", () => {
    expect(getIsoWeek("2020-12-31")).toEqual({
      weekYear: 2020,
      week: 53,
      key: "2020-W53",
      startsOn: "2020-12-28",
      endsOn: "2021-01-03",
    });
    expect(getIsoWeek("2021-01-04").key).toBe("2021-W01");
  });

  it("uses the requested time zone for timestamp inputs", () => {
    expect(getIsoWeek("2026-01-04T23:30:00.000Z", "UTC").key).toBe("2026-W01");
    expect(getIsoWeek("2026-01-04T23:30:00.000Z", "Europe/Paris").key).toBe(
      "2026-W02",
    );
  });
});

describe("startOfCalendarDay", () => {
  it("resolves local midnight independently from the server time zone", () => {
    expect(startOfCalendarDay("2026-09-21", "Europe/Paris").toISOString()).toBe(
      "2026-09-20T22:00:00.000Z",
    );
    expect(startOfCalendarDay("2026-01-21", "Europe/Paris").toISOString()).toBe(
      "2026-01-20T23:00:00.000Z",
    );
  });

  it("uses the correct offset across the daylight-saving transition", () => {
    expect(startOfCalendarDay("2026-03-29", "Europe/Paris").toISOString()).toBe(
      "2026-03-28T23:00:00.000Z",
    );
    expect(startOfCalendarDay("2026-03-30", "Europe/Paris").toISOString()).toBe(
      "2026-03-29T22:00:00.000Z",
    );
  });
});

describe("calculateFinancialTotals", () => {
  it("excludes transfers and totals decimal money in minor units", () => {
    const transactions = [
      { txType: "income" as const, amount: 100.1, currency: "eur" },
      { txType: "income" as const, amount: 0.2, currency: "EUR" },
      { txType: "expense" as const, amount: 30.05, currency: "EUR" },
      { txType: "transfer" as const, amount: 500, currency: "EUR" },
    ];

    expect(calculateFinancialTotals(transactions)).toEqual({
      currency: "EUR",
      income: 100.3,
      expense: 30.05,
      net: 70.25,
      includedTransactions: 3,
      excludedTransfers: 1,
    });
  });

  it("filters an explicitly selected currency", () => {
    const transactions = [
      { txType: "income" as const, amount: 10, currency: "EUR" },
      { txType: "income" as const, amount: 20, currency: "USD" },
      { txType: "expense" as const, amount: 3, currency: "EUR" },
    ];
    expect(calculateFinancialTotals(transactions, "eur").net).toBe(7);
  });

  it("refuses to combine currencies without FX conversion", () => {
    expect(() =>
      calculateFinancialTotals([
        { txType: "income", amount: 10, currency: "EUR" },
        { txType: "income", amount: 10, currency: "USD" },
      ]),
    ).toThrow(/multiple currencies/i);
  });
});

describe("getHealthTrendWindow", () => {
  it("selects inclusive real points, excludes future values, and sorts without mutation", () => {
    const entries = [
      { id: "latest", measuredAt: "2026-09-20T12:00:00.000Z", value: 73 },
      { id: "future", measuredAt: "2026-09-20T12:00:00.001Z", value: 99 },
      { id: "boundary", measuredAt: "2026-09-13T12:00:00.000Z", value: 70 },
      { id: "old", measuredAt: "2026-09-13T11:59:59.999Z", value: 60 },
      { id: "middle", measuredAt: "2026-09-18T12:00:00.000Z", value: 71 },
    ] as const;

    const window = getHealthTrendWindow(entries, {
      windowDays: 7,
      now: "2026-09-20T12:00:00.000Z",
    });

    expect(window.points.map((point) => point.id)).toEqual(["boundary", "middle", "latest"]);
    expect(window.change).toBe(3);
    expect(entries.map((point) => point.id)).toEqual([
      "latest",
      "future",
      "boundary",
      "old",
      "middle",
    ]);
  });

  it("reports no change until two real points exist", () => {
    expect(
      getHealthTrendWindow([{ measuredAt: "2026-09-20T12:00:00.000Z", value: 70 }], {
        windowDays: 30,
        now: "2026-09-20T12:00:00.000Z",
      }).change,
    ).toBeNull();
  });

  it("rejects invalid windows and non-finite measurements", () => {
    expect(() => getHealthTrendWindow([], { windowDays: 0 })).toThrow(RangeError);
    expect(() =>
      getHealthTrendWindow([{ measuredAt: new Date(), value: Number.NaN }], { windowDays: 7 }),
    ).toThrow(RangeError);
  });
});
