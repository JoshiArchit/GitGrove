import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSelectedRepoStore } from "../../stores/selectedRepoStore";
import { useWorkItemBoardStore } from "../../stores/workItemBoardStore";
import { Status, WorkItemtype } from "../../types/board.types";
import { RepoEntry, RepoSummaryData } from "../../types/repo.types";
import WorkItemForm from "./WorkItemForm";

const initialSelectedRepoState = useSelectedRepoStore.getState();
const REPO: RepoEntry = { path: "/repos/git-grove", name: "git-grove" };

beforeEach(() => {
  useSelectedRepoStore.setState(initialSelectedRepoState, true);
  useWorkItemBoardStore.setState({ boards: {} });
  useSelectedRepoStore.setState({
    repo: REPO,
    summary: { branches: ["main", "dev"] } as unknown as RepoSummaryData,
  });
});

describe("WorkItemForm", () => {
  it("lists the repo's branches and work item types as select options", () => {
    render(<WorkItemForm onClose={vi.fn()} />);

    expect(screen.getByRole("option", { name: "main" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "dev" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: WorkItemtype.Story }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: WorkItemtype.Bug }),
    ).toBeInTheDocument();
  });

  it("adds a new New work item to the selected repo on submit, and closes", async () => {
    const onClose = vi.fn();
    render(<WorkItemForm onClose={onClose} />);

    await userEvent.type(
      screen.getByPlaceholderText("Enter title for the task"),
      "Add login flow",
    );
    await userEvent.type(
      screen.getByPlaceholderText("Add description"),
      "OAuth-based login",
    );
    await userEvent.selectOptions(
      screen.getByLabelText("Select a branch"),
      "dev",
    );
    await userEvent.selectOptions(
      screen.getByLabelText("Select work item type"),
      WorkItemtype.Bug,
    );
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));

    const items = useWorkItemBoardStore.getState().getItems(REPO.path);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      title: "Add login flow",
      description: "OAuth-based login",
      branch: "dev",
      type: WorkItemtype.Bug,
      status: Status.New,
      tasks: [],
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("closes without adding an item when Cancel is clicked", async () => {
    const onClose = vi.fn();
    render(<WorkItemForm onClose={onClose} />);

    await userEvent.type(
      screen.getByPlaceholderText("Enter title for the task"),
      "Should not be saved",
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(useWorkItemBoardStore.getState().getItems(REPO.path)).toEqual([]);
    expect(onClose).toHaveBeenCalled();
  });
});
