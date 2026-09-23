import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Status, WorkItem, WorkItemtype } from "../../types/board.types";
import BoardColumn from "./BoardColumn";

vi.mock("../work-items/WorkItemCard", () => ({
  default: ({ item }: { item: WorkItem }) => (
    <div data-testid={`work-item-card-${item.id}`}>{item.title}</div>
  ),
}));

const makeItem = (overrides: Partial<WorkItem> = {}): WorkItem => ({
  id: "item-1",
  type: WorkItemtype.Story,
  title: "Item title",
  description: "",
  status: Status.New,
  tasks: [],
  ...overrides,
});

describe("BoardColumn", () => {
  it("renders the column status as a heading", () => {
    render(<BoardColumn columnStatus={Status.InProgress} workItems={[]} />);

    expect(screen.getByText(Status.InProgress)).toBeInTheDocument();
  });

  it("renders a WorkItemCard for every work item, in order", () => {
    const items = [
      makeItem({ id: "a1", title: "First" }),
      makeItem({ id: "a2", title: "Second" }),
    ];

    render(<BoardColumn columnStatus={Status.New} workItems={items} />);

    expect(screen.getByTestId("work-item-card-a1")).toHaveTextContent("First");
    expect(screen.getByTestId("work-item-card-a2")).toHaveTextContent("Second");
  });

  it("renders no cards when there are no work items", () => {
    render(<BoardColumn columnStatus={Status.Done} workItems={[]} />);

    expect(screen.queryByTestId(/work-item-card-/)).not.toBeInTheDocument();
  });
});
