import { describe, expect, it } from "vitest";

import { groupTodayItems } from "../../src/lib/domain/today-groups";

describe("groupTodayItems", () => {
  it("creates the three primary life-area groups and keeps completed missions last", () => {
    const groups = groupTodayItems([
      { id: "pro-done", lifeArea: "pro" as const, completed: true },
      { id: "religion-open", lifeArea: "religion" as const, completed: false },
      { id: "pro-open", lifeArea: "pro" as const, completed: false },
    ]);

    expect(groups.map((group) => group.key)).toEqual(["pro", "perso", "religion"]);
    expect(groups[0]).toMatchObject({ remaining: 1, completed: 1 });
    expect(groups[0]?.items.map((item) => item.id)).toEqual(["pro-open", "pro-done"]);
  });

  it("preserves unclassified missions in an extra group instead of hiding them", () => {
    const groups = groupTodayItems([{ id: "unclassified", lifeArea: null, completed: false }]);
    expect(groups.at(-1)).toMatchObject({ key: "other", remaining: 1, completed: 0 });
  });
});
