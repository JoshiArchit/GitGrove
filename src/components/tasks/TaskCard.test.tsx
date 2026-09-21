import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TaskCard from "./TaskCard";
import { Task, TaskStatus } from "../../types/board.types";

let capturedOnDirtyChange: ((dirty: boolean) => void) | null = null;
let capturedOnRequestClose: (() => void) | null = null;

vi.mock("./TaskForm", () => ({
  default: ({
    onDirtyChange,
    onRequestClose,
  }: {
    onDirtyChange: (dirty: boolean) => void;
    onRequestClose: () => void;
  }) => {
    capturedOnDirtyChange = onDirtyChange;
    capturedOnRequestClose = onRequestClose;
    return <div data-testid="task-form" />;
  },
}));

const task: Task = {
  id: "task-1",
  title: "Write the changelog",
  description: "",
  status: TaskStatus.New,
};

function getDialog() {
  return document.querySelector("dialog") as HTMLDialogElement;
}

beforeEach(() => {
  capturedOnDirtyChange = null;
  capturedOnRequestClose = null;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TaskCard", () => {
  it("renders the task title and a closed dialog", () => {
    render(<TaskCard workItemId="item-1" task={task} />);

    expect(screen.getByText("Write the changelog")).toBeInTheDocument();
    expect(getDialog()).not.toHaveAttribute("open");
  });

  it("opens the task form dialog when clicked", async () => {
    render(<TaskCard workItemId="item-1" task={task} />);

    await userEvent.click(screen.getByText("Write the changelog"));

    expect(getDialog()).toHaveAttribute("open");
    expect(screen.getByTestId("task-form")).toBeInTheDocument();
  });

  it("closes without confirmation when there are no unsaved changes", async () => {
    const confirmSpy = vi.spyOn(window, "confirm");
    render(<TaskCard workItemId="item-1" task={task} />);
    await userEvent.click(screen.getByText("Write the changelog"));

    capturedOnRequestClose!();

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(getDialog()).not.toHaveAttribute("open");
  });

  it("asks for confirmation before closing dirty changes, and keeps the dialog open on cancel", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<TaskCard workItemId="item-1" task={task} />);
    await userEvent.click(screen.getByText("Write the changelog"));
    act(() => capturedOnDirtyChange!(true));

    capturedOnRequestClose!();

    expect(confirmSpy).toHaveBeenCalledWith("Discard unsaved changes?");
    expect(getDialog()).toHaveAttribute("open");
  });

  it("closes dirty changes once the user confirms discarding them", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<TaskCard workItemId="item-1" task={task} />);
    await userEvent.click(screen.getByText("Write the changelog"));
    act(() => capturedOnDirtyChange!(true));

    capturedOnRequestClose!();

    expect(getDialog()).not.toHaveAttribute("open");
  });
});
