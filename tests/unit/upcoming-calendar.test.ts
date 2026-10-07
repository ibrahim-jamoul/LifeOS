import { describe, expect, it } from "vitest";

import { calendarMonthGrid, groupCalendarItems, shiftCalendarMonth } from "../../src/lib/domain/upcoming-calendar";

describe("upcoming calendar helpers", () => {
  it("builds a Monday-first grid containing the full requested month", () => {
    const days = calendarMonthGrid("2026-10");
    expect(days[0]).toBe("2026-09-28");
    expect(days).toContain("2026-10-31");
    expect(days).toHaveLength(35);
  });

  it("moves safely across year boundaries", () => {
    expect(shiftCalendarMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftCalendarMonth("2027-01", -1)).toBe("2026-12");
  });

  it("groups agenda entries without dropping entries on the same date", () => {
    const groups = groupCalendarItems([
      { id: "one", date: "2026-10-12" },
      { id: "two", date: "2026-10-12" },
    ]);
    expect(groups.get("2026-10-12")?.map((item) => item.id)).toEqual(["one", "two"]);
  });
});
