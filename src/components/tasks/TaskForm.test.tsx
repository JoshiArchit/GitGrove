import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSelectedRepoStore } from "../../stores/selectedRepoStore";
import { useWorkItemBoardStore } from "../../stores/workItemBoardStore";
import {
  Status,
  Task,
  TaskStatus,
  WorkItem,
  WorkItemtype,
} from "../../types/board.types";
import { RepoEntry } from "../../types/repo.types";
import TaskForm from "./TaskForm";

const initialSelectedRepoState = useSelectedRepoStore.getState();
const REPO: RepoEntry = { path: "/repos/git-grove", name: "git-grove" };
const WORK_ITEM_ID = "item-1";

const existingTask: Task = {
  id: "task-1",
  title: "Write the changelog",
  description: "Summarize this release",
  status: TaskStatus.New,
};

function seedWorkItem(tasks: Task[] = []) {
  const item: WorkItem = {
    id: WORK_ITEM_ID,
    type: WorkItemtype.Story,
    title: "Ship v1",
    description: "",
    status: Status.New,
    tasks,
  };
  useWorkItemBoardStore.getState().addItem(REPO.path, item);
}

beforeEach(() => {
  useSelectedRepoStore.setState(initialSelectedRepoState, true);
  useWorkItemBoardStore.setState({ boards: {} });
  useSelectedRepoStore.setState({ repo: REPO });
});

describe("TaskForm — dirty detection", () => {
  it("reports dirty once a field diverges from the task's saved values, and clean once it matches again", () => {
    const onDirtyChange = vi.fn();
    render(
      <TaskForm
        workItemId={WORK_ITEM_ID}
        task={existingTask}
        isDirty={false}
        onDirtyChange={onDirtyChange}
        onRequestClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    const titleInput = screen.getByPlaceholderText("Enter title for the Task");
    fireInput(titleInput, "Write the changelog!");
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);

    fireInput(titleInput, "Write the changelog");
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  });
});

describe("TaskForm — add mode", () => {
  it("has no Delete button and an empty form", () => {
    render(
      <TaskForm
        workItemId={WORK_ITEM_ID}
        isDirty={true}
        onDirtyChange={vi.fn()}
        onRequestClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByText("Add Task")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
  });

  it("adds a new task to the work item on submit, and calls onSaved", async () => {
    seedWorkItem();
    const onSaved = vi.fn();
    const onDirtyChange = vi.fn();
    render(
      <TaskForm
        workItemId={WORK_ITEM_ID}
        isDirty={true}
        onDirtyChange={onDirtyChange}
        onRequestClose={vi.fn()}
        onSaved={onSaved}
      />,
    );

    await userEvent.type(
      screen.getByPlaceholderText("Enter title for the Task"),
      "New task",
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    const item = useWorkItemBoardStore
      .getState()
      .getItems(REPO.path)
      .find((i) => i.id === WORK_ITEM_ID);
    expect(item?.tasks).toHaveLength(1);
    expect(item?.tasks[0]).toMatchObject({
      title: "New task",
      status: TaskStatus.New,
    });
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    expect(onSaved).toHaveBeenCalled();
  });

  it("disables Save while the form is not dirty", () => {
    render(
      <TaskForm
        workItemId={WORK_ITEM_ID}
        isDirty={false}
        onDirtyChange={vi.fn()}
        onRequestClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});

describe("TaskForm — edit mode", () => {
  it("pre-fills the form with the task's values and shows a Delete button", () => {
    render(
      <TaskForm
        workItemId={WORK_ITEM_ID}
        task={existingTask}
        isDirty={false}
        onDirtyChange={vi.fn()}
        onRequestClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue("Write the changelog")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Summarize this release"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("updates the existing task's fields on submit", async () => {
    seedWorkItem([existingTask]);
    render(
      <TaskForm
        workItemId={WORK_ITEM_ID}
        task={existingTask}
        isDirty={true}
        onDirtyChange={vi.fn()}
        onRequestClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    const titleInput = screen.getByDisplayValue("Write the changelog");
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Write release notes");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    const item = useWorkItemBoardStore
      .getState()
      .getItems(REPO.path)
      .find((i) => i.id === WORK_ITEM_ID);
    expect(item?.tasks[0]).toMatchObject({
      id: existingTask.id,
      title: "Write release notes",
      description: existingTask.description,
    });
  });

  it("toggles between the description textarea and its markdown preview", async () => {
    render(
      <TaskForm
        workItemId={WORK_ITEM_ID}
        task={existingTask}
        isDirty={false}
        onDirtyChange={vi.fn()}
        onRequestClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Supports Markdown" }),
    );

    expect(
      screen.queryByDisplayValue(existingTask.description),
    ).not.toBeInTheDocument();
    expect(screen.getByText(existingTask.description)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Show Editor" }));

    expect(
      screen.getByDisplayValue(existingTask.description),
    ).toBeInTheDocument();
  });

  it("deletes the task after the user confirms, and calls onSaved", async () => {
    seedWorkItem([existingTask]);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onSaved = vi.fn();
    render(
      <TaskForm
        workItemId={WORK_ITEM_ID}
        task={existingTask}
        isDirty={false}
        onDirtyChange={vi.fn()}
        onRequestClose={vi.fn()}
        onSaved={onSaved}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    const item = useWorkItemBoardStore
      .getState()
      .getItems(REPO.path)
      .find((i) => i.id === WORK_ITEM_ID);
    expect(item?.tasks).toHaveLength(0);
    expect(onSaved).toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it("keeps the task when the user cancels the delete confirmation", async () => {
    seedWorkItem([existingTask]);
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const onSaved = vi.fn();
    render(
      <TaskForm
        workItemId={WORK_ITEM_ID}
        task={existingTask}
        isDirty={false}
        onDirtyChange={vi.fn()}
        onRequestClose={vi.fn()}
        onSaved={onSaved}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    const item = useWorkItemBoardStore
      .getState()
      .getItems(REPO.path)
      .find((i) => i.id === WORK_ITEM_ID);
    expect(item?.tasks).toHaveLength(1);
    expect(onSaved).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});

describe("TaskForm — cancel", () => {
  it("calls onRequestClose when Cancel is clicked", async () => {
    const onRequestClose = vi.fn();
    render(
      <TaskForm
        workItemId={WORK_ITEM_ID}
        isDirty={false}
        onDirtyChange={vi.fn()}
        onRequestClose={onRequestClose}
        onSaved={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onRequestClose).toHaveBeenCalled();
  });
});

// userEvent.type fires real keystrokes (slow for a full-value replace); this
// helper sets the value in one shot and dispatches the same `input` event the
// component listens to for dirty-checking.
function fireInput(element: HTMLElement, value: string) {
  const input = element as HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )!.set!;
  setter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}
