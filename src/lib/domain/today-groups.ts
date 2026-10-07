export type TodayAreaKey = "pro" | "perso" | "religion" | "other";

export type TodayGroupItem = {
  lifeArea: "pro" | "perso" | "religion" | null;
  completed: boolean;
};

export type TodayItemGroup<T extends TodayGroupItem> = {
  key: TodayAreaKey;
  items: T[];
  completed: number;
  remaining: number;
};

const PRIMARY_AREAS = ["pro", "perso", "religion"] as const;

export function groupTodayItems<T extends TodayGroupItem>(items: readonly T[]): TodayItemGroup<T>[] {
  const primaryGroups = PRIMARY_AREAS.map((key) => buildGroup(key, items.filter((item) => item.lifeArea === key)));
  const otherItems = items.filter((item) => item.lifeArea === null);
  return otherItems.length > 0
    ? [...primaryGroups, buildGroup("other", otherItems)]
    : primaryGroups;
}

function buildGroup<T extends TodayGroupItem>(key: TodayAreaKey, items: readonly T[]): TodayItemGroup<T> {
  const ordered = [...items].sort((left, right) => Number(left.completed) - Number(right.completed));
  const completed = ordered.filter((item) => item.completed).length;
  return {
    key,
    items: ordered,
    completed,
    remaining: ordered.length - completed,
  };
}
