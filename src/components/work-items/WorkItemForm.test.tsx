import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProjectsStore } from "../../stores/projectsStore";
import { useSelectedRepoStore } from "../../stores/selectedRepoStore";
import { useWorkItemBoardStore } from "../../stores/workItemBoardStore";
import { Status, WorkItemtype } from "../../types/board.types";
import { ProjectStatus } from "../../types/project.types";
import { RepoEntry, RepoSummaryData } from "../../types/repo.types";
import WorkItemForm from "./WorkItemForm";

function createLocalStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };
}

vi.stubGlobal("localStorage", createLocalStorageMock());

const initialSelectedRepoState = useSelectedRepoStore.getState();
const REPO: RepoEntry = { path: "/repos/git-grove", name: "git-grove" };

beforeEach(() => {
  useSelectedRepoStore.setState(initialSelectedRepoState, true);
  useWorkItemBoardStore.setState({ boards: {} });
  useProjectsStore.setState({ projects: [] });
  useSelectedRepoStore.setState({
    repo: REPO,
    summary: { branches: ["main", "dev"] } as unknown as RepoSummaryData,
  });
  localStorage.clear();
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

  it("toggles between the description textarea and its markdown preview", async () => {
    render(<WorkItemForm onClose={vi.fn()} />);

    const descriptionInput = screen.getByPlaceholderText("Add description");
    await userEvent.type(descriptionInput, "**bold** text");

    await userEvent.click(
      screen.getByRole("button", { name: "Supports Markdown" }),
    );

    expect(
      screen.queryByPlaceholderText("Add description"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("bold").tagName).toBe("STRONG");

    await userEvent.click(screen.getByRole("button", { name: "Show Editor" }));

    expect(screen.getByPlaceholderText("Add description")).toHaveValue(
      "**bold** text",
    );
  });

  it("saves the description typed while in preview mode", async () => {
    render(<WorkItemForm onClose={vi.fn()} />);

    await userEvent.type(
      screen.getByPlaceholderText("Enter title for the task"),
      "Add login flow",
    );
    await userEvent.type(
      screen.getByPlaceholderText("Add description"),
      "OAuth-based login",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Supports Markdown" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));

    const items = useWorkItemBoardStore.getState().getItems(REPO.path);
    expect(items[0]).toMatchObject({ description: "OAuth-based login" });
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

  it("tags the new work item with the selected project", async () => {
    useProjectsStore.setState({
      projects: [
        {
          projectId: 1,
          title: "Trail Tracker",
          status: ProjectStatus.InDevelopment,
          description: "",
        },
      ],
    });
    render(<WorkItemForm onClose={vi.fn()} />);

    await userEvent.type(
      screen.getByPlaceholderText("Enter title for the task"),
      "Add trail import",
    );
    await userEvent.selectOptions(
      screen.getByLabelText("Select a project"),
      "Trail Tracker",
    );
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));

    const items = useWorkItemBoardStore.getState().getItems(REPO.path);
    expect(items[0]).toMatchObject({ project: 1 });
  });

  it("leaves the work item untagged when no project is selected", async () => {
    render(<WorkItemForm onClose={vi.fn()} />);

    await userEvent.type(
      screen.getByPlaceholderText("Enter title for the task"),
      "Untagged item",
    );
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));

    const items = useWorkItemBoardStore.getState().getItems(REPO.path);
    expect(items[0].project).toBeUndefined();
  });

  it("closes without adding an item when Close icon is clicked", async () => {
    const onClose = vi.fn();
    render(<WorkItemForm onClose={onClose} />);

    await userEvent.type(
      screen.getByPlaceholderText("Enter title for the task"),
      "Should not be saved",
    );
    await userEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(useWorkItemBoardStore.getState().getItems(REPO.path)).toEqual([]);
    expect(onClose).toHaveBeenCalled();
  });
});
