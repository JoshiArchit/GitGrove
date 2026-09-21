import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WorkItemCardExpanded from "./WorkItemCardExpanded";
import { useSelectedRepoStore } from "../../stores/selectedRepoStore";
import { useWorkItemBoardStore } from "../../stores/workItemBoardStore";
import { RepoEntry } from "../../types/repo.types";
import { Status, Task, TaskStatus, WorkItem, WorkItemtype } from "../../types/board.types";

vi.mock("../tasks/TaskCard", () => ({
  default: ({ task }: { task: Task }) => (
    <div data-testid={`task-card-${task.id}`}>{task.title}</div>
  ),
}));
vi.mock("../tasks/TaskForm", () => ({
  default: () => <div data-testid="task-form" />,
}));

const initialSelectedRepoState = useSelectedRepoStore.getState();
const REPO: RepoEntry = { path: "/repos/git-grove", name: "git-grove" };

const item: WorkItem = {
  id: "item-1",
  type: WorkItemtype.Story,
  title: "Ship v1",
  description: "Initial release",
  status: Status.Backlog,
  tasks: [],
};

beforeEach(() => {
  useSelectedRepoStore.setState(initialSelectedRepoState, true);
  useWorkItemBoardStore.setState({ boards: {} });
  useSelectedRepoStore.setState({ repo: REPO });
  useWorkItemBoardStore.getState().addItem(REPO.path, item);
});

function fireInput(element: HTMLElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )!.set!;
  setter.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("WorkItemCardExpanded — rendering", () => {
  it("shows the item type, pre-filled fields, and 'no tasks' when there are none", () => {
    render(
      <WorkItemCardExpanded
        item={item}
        isDirty={false}
        onDirtyChange={vi.fn()}
        onRequestClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByText(WorkItemtype.Story)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Ship v1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Initial release")).toBeInTheDocument();
    expect(screen.getByText("No tasks for the item")).toBeInTheDocument();
  });

  it("renders a TaskCard per task instead of the empty message", () => {
    const withTasks: WorkItem = {
      ...item,
      tasks: [
        {
          id: "t1",
          title: "Write tests",
          description: "",
          status: TaskStatus.New,
        },
      ],
    };

    render(
      <WorkItemCardExpanded
        item={withTasks}
        isDirty={false}
        onDirtyChange={vi.fn()}
        onRequestClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByTestId("task-card-t1")).toHaveTextContent(
      "Write tests",
    );
    expect(screen.queryByText("No tasks for the item")).not.toBeInTheDocument();
  });

  it("disables Save while the form is not dirty", () => {
    render(
      <WorkItemCardExpanded
        item={item}
        isDirty={false}
        onDirtyChange={vi.fn()}
        onRequestClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});

describe("WorkItemCardExpanded — dirty detection", () => {
  it("reports dirty once the title diverges, and clean once reverted", () => {
    const onDirtyChange = vi.fn();
    render(
      <WorkItemCardExpanded
        item={item}
        isDirty={false}
        onDirtyChange={onDirtyChange}
        onRequestClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    const titleInput = screen.getByDisplayValue("Ship v1");
    fireInput(titleInput, "Ship v1.0");
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);

    fireInput(titleInput, "Ship v1");
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  });
});

describe("WorkItemCardExpanded — save", () => {
  it("updates the item's title, description, and status on submit", async () => {
    render(
      <WorkItemCardExpanded
        item={item}
        isDirty={true}
        onDirtyChange={vi.fn()}
        onRequestClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    const titleInput = screen.getByDisplayValue("Ship v1");
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Ship v1.1");
    await userEvent.selectOptions(
      screen.getByLabelText("Status"),
      Status.InProgress,
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    const updated = useWorkItemBoardStore
      .getState()
      .getItems(REPO.path)
      .find((i) => i.id === item.id);
    expect(updated).toMatchObject({
      title: "Ship v1.1",
      status: Status.InProgress,
    });
  });
});

describe("WorkItemCardExpanded — delete", () => {
  it("deletes the item after confirmation and calls onSaved", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onSaved = vi.fn();
    render(
      <WorkItemCardExpanded
        item={item}
        isDirty={false}
        onDirtyChange={vi.fn()}
        onRequestClose={vi.fn()}
        onSaved={onSaved}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(
      useWorkItemBoardStore.getState().getItems(REPO.path),
    ).toHaveLength(0);
    expect(onSaved).toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it("keeps the item when the confirmation is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const onSaved = vi.fn();
    render(
      <WorkItemCardExpanded
        item={item}
        isDirty={false}
        onDirtyChange={vi.fn()}
        onRequestClose={vi.fn()}
        onSaved={onSaved}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(
      useWorkItemBoardStore.getState().getItems(REPO.path),
    ).toHaveLength(1);
    expect(onSaved).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});

describe("WorkItemCardExpanded — nested task dialog", () => {
  it("opens the task form dialog when 'Add Task' is clicked", async () => {
    render(
      <WorkItemCardExpanded
        item={item}
        isDirty={false}
        onDirtyChange={vi.fn()}
        onRequestClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    const dialogs = document.querySelectorAll("dialog");
    const taskDialog = dialogs[dialogs.length - 1];
    expect(taskDialog).not.toHaveAttribute("open");

    await userEvent.click(screen.getByRole("button", { name: "Add Task" }));

    expect(taskDialog).toHaveAttribute("open");
    expect(screen.getByTestId("task-form")).toBeInTheDocument();
  });
});
