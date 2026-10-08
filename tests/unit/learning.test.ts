import { describe, expect, it } from "vitest";
import { completedRatio, nextReviewStep } from "@/lib/domain/learning";

describe("LifeOS learning review intervals", () => {
  it("resets forgotten knowledge", () => expect(nextReviewStep(5, "forgot")).toEqual({ step: 0, afterDays: 1 }));
  it("moves fragile knowledge one step backwards", () => expect(nextReviewStep(4, "fragile")).toEqual({ step: 3, afterDays: 14 }));
  it("advances correctly and clamps the last step", () => expect(nextReviewStep(5, "correct")).toEqual({ step: 5, afterDays: 60 }));
  it("accelerates mastered knowledge", () => expect(nextReviewStep(1, "mastered")).toEqual({ step: 3, afterDays: 14 }));
  it("rejects invalid steps", () => expect(() => nextReviewStep(-1, "correct")).toThrow());
  it("does not invent completion for an empty path", () => expect(completedRatio(0, 0)).toBeNull());
  it("counts completed activities", () => expect(completedRatio(3, 4)).toBe(75));
});
