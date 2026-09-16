import { WorkItemtype } from "../types/board.types";

type WorkItemColors = {
  bullet: string;
  borderTop: string;
  borderLeft: string;
};

// TODO: Add icons for task/item types 
const WORK_ITEM_COLORS: Record<WorkItemtype, WorkItemColors> = {
  [WorkItemtype.Story]: {
    bullet: "bg-blue-500",
    borderTop: "border-t-blue-500",
    borderLeft: "border-l-blue-500",
  },
  [WorkItemtype.Bug]: {
    bullet: "bg-red-500",
    borderTop: "border-t-red-500",
    borderLeft: "border-l-red-500",
  },
};

export function resolveWorkItemColor(type: WorkItemtype): WorkItemColors {
  return WORK_ITEM_COLORS[type];
}
