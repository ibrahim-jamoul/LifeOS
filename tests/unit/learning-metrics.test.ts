import { describe, expect, it } from "vitest";
import { evidenceOfApplication, learningMinutesByPath, quizPercentage, totalLearningMinutes } from "../../src/lib/domain/learning-metrics";

describe("learning V5 fact-based metrics", () => {
  it("counts all sessions in the selected period, not just today", () => {
    expect(totalLearningMinutes([{duration_minutes:10},{duration_minutes:25},{duration_minutes:5}])).toBe(40);
  });
  it("separates sessions by path without inferring a skill level", () => {
    expect(learningMinutesByPath([{path_id:"ccna",duration_minutes:20},{path_id:"arabic",duration_minutes:10},{path_id:"ccna",duration_minutes:15}])).toEqual({ccna:35,arabic:10});
  });
  it("counts applications explicitly", () => {
    expect(evidenceOfApplication([{duration_minutes:15,result:"studied"},{duration_minutes:5,result:"applied"}])).toBe(1);
  });
  it("rejects invalid quiz scores rather than displaying invented data", () => {
    expect(quizPercentage(3,4)).toBe(75);
    expect(quizPercentage(0,0)).toBeNull();
    expect(quizPercentage(7,4)).toBeNull();
  });
});
