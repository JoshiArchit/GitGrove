import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSelectedRepoStore } from "../../stores/selectedRepoStore";
import { useWorkItemBoardStore } from "../../stores/workItemBoardStore";
import { Status, WorkItem, WorkItemtype } from "../../types/board.types";
import { RepoEntry } from "../../types/repo.types";
import Board from "./Board";

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

  it("switches to the backlog view when toggled", async () => {
    useSelectedRepoStore.setState({ repo: REPO });
    render(<Board />);

    await userEvent.click(screen.getByRole("button", { name: /backlog/i }));

    expect(document.querySelector("#board-view")).not.toBeInTheDocument();
    expect(document.querySelector("#backlog-view")).toBeInTheDocument();
  });
});
