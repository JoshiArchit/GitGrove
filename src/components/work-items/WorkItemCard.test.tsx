import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WorkItemCard from "./WorkItemCard";
import { Status, WorkItem, WorkItemtype } from "../../types/board.types";

let capturedOnDirtyChange: ((dirty: boolean) => void) | null = null;
let capturedOnRequestClose: (() => void) | null = null;

vi.mock("./WorkItemCardExpanded", () => ({
  default: ({
    onDirtyChange,
    onRequestClose,
  }: {
    onDirtyChange: (dirty: boolean) => void;
    onRequestClose: () => void;
  }) => {
    capturedOnDirtyChange = onDirtyChange;
    capturedOnRequestClose = onRequestClose;
    return <div data-testid="work-item-card-expanded" />;
  },
}));

const item: WorkItem = {
  id: "item-1",
  type: WorkItemtype.Story,
  title: "Add login flow",
  description: "",
  status: Status.Backlog,
  tasks: [],
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

describe("WorkItemCard", () => {
  it("renders the item title and a closed dialog", () => {
    render(<WorkItemCard item={item} />);

    expect(screen.getByText("Add login flow")).toBeInTheDocument();
    expect(getDialog()).not.toHaveAttribute("open");
  });

  it("opens the expanded card dialog when clicked", async () => {
    render(<WorkItemCard item={item} />);

    await userEvent.click(screen.getByText("Add login flow"));

    expect(getDialog()).toHaveAttribute("open");
    expect(screen.getByTestId("work-item-card-expanded")).toBeInTheDocument();
  });

  it("closes without confirmation when there are no unsaved changes", async () => {
    const confirmSpy = vi.spyOn(window, "confirm");
    render(<WorkItemCard item={item} />);
    await userEvent.click(screen.getByText("Add login flow"));

    capturedOnRequestClose!();

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(getDialog()).not.toHaveAttribute("open");
  });

  it("asks for confirmation before closing dirty changes, and keeps the dialog open on cancel", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<WorkItemCard item={item} />);
    await userEvent.click(screen.getByText("Add login flow"));
    act(() => capturedOnDirtyChange!(true));

    capturedOnRequestClose!();

    expect(confirmSpy).toHaveBeenCalledWith("Discard unsaved changes?");
    expect(getDialog()).toHaveAttribute("open");
  });

  it("closes dirty changes once the user confirms discarding them", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<WorkItemCard item={item} />);
    await userEvent.click(screen.getByText("Add login flow"));
    act(() => capturedOnDirtyChange!(true));

    capturedOnRequestClose!();

    expect(getDialog()).not.toHaveAttribute("open");
  });
});
