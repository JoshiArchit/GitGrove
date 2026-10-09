import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSelectedRepoStore } from "../../stores/selectedRepoStore";
import { useWorkItemBoardStore } from "../../stores/workItemBoardStore";
import { Status, WorkItem, WorkItemtype } from "../../types/board.types";
import { RepoEntry } from "../../types/repo.types";
import Board from "./Board";

const dragHandlers = vi.hoisted(() => ({
  onDragEnd: undefined as ((event: unknown) => void) | undefined,
}));

vi.mock("@dnd-kit/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@dnd-kit/react")>();
  return {
    ...actual,
    DragDropProvider: (
      props: React.ComponentProps<typeof actual.DragDropProvider>,
    ) => {
      dragHandlers.onDragEnd = props.onDragEnd as typeof dragHandlers.onDragEnd;
      return <actual.DragDropProvider {...props} />;
    },
  };
});

vi.mock("../work-items/WorkItemCard", () => ({
  default: ({ item }: { item: WorkItem }) => (
    <div data-testid={`work-item-card-${item.id}`}>{item.title}</div>
  ),
}));
vi.mock("../work-items/WorkItemForm", () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="work-item-form">
      <button onClick={onClose}>close-form</button>
    </div>
  ),
}));

const initialSelectedRepoState = useSelectedRepoStore.getState();
const REPO: RepoEntry = { path: "/repos/git-grove", name: "git-grove" };

const makeItem = (overrides: Partial<WorkItem> = {}): WorkItem => ({
  id: "item-1",
  type: WorkItemtype.Story,
  title: "Item title",
  description: "",
  status: Status.New,
  tasks: [],
  ...overrides,
});

beforeEach(() => {
  useSelectedRepoStore.setState(initialSelectedRepoState, true);
  useWorkItemBoardStore.setState({ boards: {} });
});

describe("Board", () => {
  it("renders nothing when no repo is selected", () => {
    const { container } = render(<Board />);

    expect(container).toBeEmptyDOMElement();
  });

  it("groups the selected repo's work items into the matching status column", () => {
    useSelectedRepoStore.setState({ repo: REPO });
    const { addItem } = useWorkItemBoardStore.getState();
    addItem(REPO.path, makeItem({ id: "b1", status: Status.New }));
    addItem(REPO.path, makeItem({ id: "p1", status: Status.InProgress }));
    addItem(REPO.path, makeItem({ id: "d1", status: Status.Done }));

    render(<Board />);

    const newColumn = screen.getByText(Status.New).closest("section")!;
    const inProgressColumn = screen
      .getByText(Status.InProgress)
      .closest("section")!;
    const doneColumn = screen.getByText(Status.Done).closest("section")!;

    expect(
      within(newColumn).getByTestId("work-item-card-b1"),
    ).toBeInTheDocument();
    expect(
      within(inProgressColumn).getByTestId("work-item-card-p1"),
    ).toBeInTheDocument();
    expect(
      within(doneColumn).getByTestId("work-item-card-d1"),
    ).toBeInTheDocument();
  });

  it("only shows items belonging to the currently selected repo", () => {
    useSelectedRepoStore.setState({ repo: REPO });
    const { addItem } = useWorkItemBoardStore.getState();
    addItem(REPO.path, makeItem({ id: "mine" }));
    addItem("/repos/other", makeItem({ id: "not-mine" }));

    render(<Board />);

    expect(screen.getByTestId("work-item-card-mine")).toBeInTheDocument();
    expect(
      screen.queryByTestId("work-item-card-not-mine"),
    ).not.toBeInTheDocument();
  });

  it("opens the Add Item dialog with the work item form, and closes it", async () => {
    useSelectedRepoStore.setState({ repo: REPO });
    render(<Board />);

    expect(screen.queryByTestId("work-item-form")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Add Item" }));
    expect(screen.getByTestId("work-item-form")).toBeInTheDocument();
    expect(document.querySelector("dialog")).toHaveAttribute("open");

    await userEvent.click(screen.getByRole("button", { name: "close-form" }));
    expect(screen.queryByTestId("work-item-form")).not.toBeInTheDocument();
  });

  it("shows the board view by default", async () => {
    useSelectedRepoStore.setState({ repo: REPO });
    render(<Board />);

    expect(document.querySelector("#board-view")).toBeInTheDocument();
    expect(document.querySelector("#backlog-view")).not.toBeInTheDocument();
  });

  describe("drag end", () => {
    const dropEvent = (
      sourceId: string | undefined,
      targetId: string | undefined,
      canceled = false,
    ) => ({
      canceled,
      operation: {
        source: sourceId === undefined ? null : { id: sourceId },
        target: targetId === undefined ? null : { id: targetId },
      },
    });

    const drop = (event: ReturnType<typeof dropEvent>) =>
      act(() => dragHandlers.onDragEnd?.(event));

    const statusOf = (id: string) =>
      useWorkItemBoardStore
        .getState()
        .getItems(REPO.path)
        .find((i) => i.id === id)?.status;

    beforeEach(() => {
      useSelectedRepoStore.setState({ repo: REPO });
      const { addItem } = useWorkItemBoardStore.getState();
      addItem(REPO.path, makeItem({ id: "n1", status: Status.New }));
      addItem(REPO.path, makeItem({ id: "n2", status: Status.New }));
      addItem(REPO.path, makeItem({ id: "d1", status: Status.Done }));
    });

    it("moves the item to the destination column's status", () => {
      render(<Board />);

      drop(dropEvent("n1", Status.InProgress));

      expect(statusOf("n1")).toBe(Status.InProgress);
      expect(statusOf("n2")).toBe(Status.New);
    });

    it("places the dropped item at the bottom of the destination column", () => {
      render(<Board />);

      drop(dropEvent("n1", Status.Done));

      const doneIds = useWorkItemBoardStore
        .getState()
        .getItems(REPO.path)
        .filter((i) => i.status === Status.Done)
        .map((i) => i.id);
      expect(doneIds).toEqual(["d1", "n1"]);
    });

    it("renders the moved card in its new column", () => {
      render(<Board />);

      drop(dropEvent("n1", Status.InProgress));

      const inProgressColumn = screen
        .getByText(Status.InProgress)
        .closest("section")!;
      expect(
        within(inProgressColumn).getByTestId("work-item-card-n1"),
      ).toBeInTheDocument();
    });

    it("does nothing when dropped outside any droppable", () => {
      render(<Board />);
      const before = useWorkItemBoardStore.getState().getItems(REPO.path);

      drop(dropEvent("n1", undefined));

      expect(useWorkItemBoardStore.getState().getItems(REPO.path)).toBe(before);
    });

    it("does nothing when there is no drag source", () => {
      render(<Board />);
      const before = useWorkItemBoardStore.getState().getItems(REPO.path);

      drop(dropEvent(undefined, Status.Done));

      expect(useWorkItemBoardStore.getState().getItems(REPO.path)).toBe(before);
    });

    it("does nothing when the drag was cancelled", () => {
      render(<Board />);
      const before = useWorkItemBoardStore.getState().getItems(REPO.path);

      drop(dropEvent("n1", Status.Done, true));

      expect(useWorkItemBoardStore.getState().getItems(REPO.path)).toBe(before);
    });

    it("ignores a drop target that is not a status column", () => {
      render(<Board />);
      const before = useWorkItemBoardStore.getState().getItems(REPO.path);

      drop(dropEvent("n1", "not-a-status"));

      expect(useWorkItemBoardStore.getState().getItems(REPO.path)).toBe(before);
    });

    it("leaves item order untouched when dropped on its own column", () => {
      render(<Board />);
      const before = useWorkItemBoardStore.getState().getItems(REPO.path);

      drop(dropEvent("n1", Status.New));

      expect(useWorkItemBoardStore.getState().getItems(REPO.path)).toBe(before);
    });

    it("ignores an unknown dragged item id", () => {
      render(<Board />);
      const before = useWorkItemBoardStore.getState().getItems(REPO.path);

      drop(dropEvent("missing", Status.Done));

      expect(useWorkItemBoardStore.getState().getItems(REPO.path)).toBe(before);
    });
  });

  it("switches to the backlog view when toggled", async () => {
    useSelectedRepoStore.setState({ repo: REPO });
    render(<Board />);

    await userEvent.click(screen.getByRole("button", { name: /backlog/i }));

    expect(document.querySelector("#board-view")).not.toBeInTheDocument();
    expect(document.querySelector("#backlog-view")).toBeInTheDocument();
  });
});
