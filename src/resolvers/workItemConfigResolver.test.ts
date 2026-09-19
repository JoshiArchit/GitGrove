import { describe, expect, it } from "vitest";
import { resolveWorkItemColor } from "./workItemConfigResolver";
import { WorkItemtype } from "../types/board.types";

describe("resolveWorkItemColor", () => {
  it("returns the blue palette for a Story", () => {
    expect(resolveWorkItemColor(WorkItemtype.Story)).toEqual({
      bullet: "bg-blue-500",
      borderTop: "border-t-blue-500",
      borderLeft: "border-l-blue-500",
    });
  });

  it("returns the red palette for a Bug", () => {
    expect(resolveWorkItemColor(WorkItemtype.Bug)).toEqual({
      bullet: "bg-red-500",
      borderTop: "border-t-red-500",
      borderLeft: "border-l-red-500",
    });
  });

  it("returns a distinct palette per type", () => {
    const story = resolveWorkItemColor(WorkItemtype.Story);
    const bug = resolveWorkItemColor(WorkItemtype.Bug);
    expect(story).not.toEqual(bug);
  });
});
