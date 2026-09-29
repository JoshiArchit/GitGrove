import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useProjectsStore } from "../../stores/projectsStore";
import { useRepoListStore } from "../../stores/repoListStore";
import { useWorkItemBoardStore } from "../../stores/workItemBoardStore";
import { Project, ProjectStatus } from "../../types/project.types";
import { Status, WorkItem, WorkItemtype } from "../../types/board.types";
import { RepoEntry } from "../../types/repo.types";
import ProjectCardExpanded from "./ProjectCardExpanded";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("@tauri-apps/plugin-dialog", () => ({ open: vi.fn() }));

const mockedInvoke = vi.mocked(invoke);
const mockedOpen = vi.mocked(open);

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

const PROJECT: Project = {
  projectId: 1,
  title: "Trail Tracker",
  status: ProjectStatus.Brainstorming,
  description: "Log hikes offline-first.",
};

const makeWorkItem = (overrides: Partial<WorkItem> = {}): WorkItem => ({
  id: "item-1",
  type: WorkItemtype.Story,
  title: "Add trail import",
  description: "",
  status: Status.New,
  tasks: [],
  ...overrides,
});

beforeEach(() => {
  useProjectsStore.setState({ projects: [PROJECT] });
  useRepoListStore.setState({ repoList: [], scannedRoots: [] });
  useWorkItemBoardStore.setState({ boards: {} });
  localStorage.clear();
  mockedInvoke.mockReset();
  mockedOpen.mockReset();
});

function renderExpanded(
  project: Project = PROJECT,
  overrides: Partial<{
    isDirty: boolean;
    onDirtyChange: (isDirty: boolean) => void;
    onRequestClose: () => void;
    onSaved: () => void;
  }> = {},
) {
  const onDirtyChange = overrides.onDirtyChange ?? vi.fn();
  const onRequestClose = overrides.onRequestClose ?? vi.fn();
  const onSaved = overrides.onSaved ?? vi.fn();
  render(
    <ProjectCardExpanded
      project={project}
      isDirty={overrides.isDirty ?? false}
      onDirtyChange={onDirtyChange}
      onRequestClose={onRequestClose}
      onSaved={onSaved}
    />,
  );
  return { onDirtyChange, onRequestClose, onSaved };
}

describe("ProjectCardExpanded — pre-fill and dirty detection", () => {
  it("pre-fills the form with the project's values", () => {
    renderExpanded();

    expect(screen.getByDisplayValue("Trail Tracker")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Log hikes offline-first.")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Status" })).toHaveValue(
      ProjectStatus.Brainstorming,
    );
  });

  it("reports dirty once the title diverges, and clean once it matches again", async () => {
    const { onDirtyChange } = renderExpanded();

    const titleInput = screen.getByDisplayValue("Trail Tracker");
    await userEvent.type(titleInput, "!");
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);

    await userEvent.type(titleInput, "{backspace}");
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  });

  it("reports dirty when the status changes", async () => {
    const { onDirtyChange } = renderExpanded();

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Status" }),
      ProjectStatus.InDevelopment,
    );

    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
  });
});

describe("ProjectCardExpanded — save", () => {
  it("updates the project's fields on submit, and calls onDirtyChange(false) and onSaved", async () => {
    const { onDirtyChange, onSaved } = renderExpanded(PROJECT, {
      isDirty: true,
    });

    await userEvent.type(screen.getByDisplayValue("Trail Tracker"), " 2");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    const saved = useProjectsStore
      .getState()
      .getProjects()
      .find((p) => p.projectId === PROJECT.projectId);
    expect(saved?.title).toBe("Trail Tracker 2");
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    expect(onSaved).toHaveBeenCalled();
  });

  it("disables Save while the form is not dirty", () => {
    renderExpanded(PROJECT, { isDirty: false });

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});

describe("ProjectCardExpanded — delete", () => {
  it("deletes the project after the user confirms, and calls onSaved", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { onSaved } = renderExpanded();

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(
      useProjectsStore.getState().getProjects(),
    ).not.toContainEqual(expect.objectContaining({ projectId: 1 }));
    expect(onSaved).toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it("keeps the project when the user cancels the delete confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const { onSaved } = renderExpanded();

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(useProjectsStore.getState().getProjects()).toHaveLength(1);
    expect(onSaved).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});

describe("ProjectCardExpanded — markdown preview", () => {
  it("toggles between the description textarea and its markdown preview", async () => {
    renderExpanded();

    await userEvent.click(
      screen.getByRole("button", { name: "Supports Markdown" }),
    );

    expect(
      screen.queryByDisplayValue("Log hikes offline-first."),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Log hikes offline-first.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Show Editor" }));

    expect(
      screen.getByDisplayValue("Log hikes offline-first."),
    ).toBeInTheDocument();
  });
});

describe("ProjectCardExpanded — repo linking", () => {
  it("hides the repo section for Idea and Brainstorming status", () => {
    renderExpanded({ ...PROJECT, status: ProjectStatus.Idea });

    expect(screen.queryByLabelText("Linked Repo")).not.toBeInTheDocument();
  });

  it("shows the repo section once status is In Development or later", () => {
    renderExpanded({ ...PROJECT, status: ProjectStatus.InDevelopment });

    expect(screen.getByLabelText("Linked Repo")).toBeInTheDocument();
  });

  it("lets you pick a repo from the scanned list and saves it", async () => {
    const repo: RepoEntry = { path: "/repos/git-grove", name: "git-grove" };
    useRepoListStore.setState({ repoList: [repo], scannedRoots: [] });
    renderExpanded(
      { ...PROJECT, status: ProjectStatus.InDevelopment },
      { isDirty: true },
    );

    await userEvent.selectOptions(
      screen.getByLabelText("Linked Repo"),
      "git-grove",
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    const saved = useProjectsStore
      .getState()
      .getProjects()
      .find((p) => p.projectId === PROJECT.projectId);
    expect(saved?.repo).toBe("/repos/git-grove");
  });

  it("rescans a root folder and merges the results into the repo list", async () => {
    mockedOpen.mockResolvedValue("/some/root");
    mockedInvoke.mockResolvedValue([{ path: "/repos/new", name: "new" }]);
    renderExpanded({ ...PROJECT, status: ProjectStatus.InDevelopment });

    await userEvent.click(screen.getByRole("button", { name: "Rescan" }));

    expect(mockedInvoke).toHaveBeenCalledWith("scan_repos", {
      rootDirectory: "/some/root",
    });
    expect(useRepoListStore.getState().repoList).toContainEqual({
      path: "/repos/new",
      name: "new",
    });
  });

  it("adds a single repo without leaving the dialog and selects it", async () => {
    mockedOpen.mockResolvedValue("/repos/new");
    mockedInvoke.mockResolvedValue({ path: "/repos/new", name: "new" });
    renderExpanded({ ...PROJECT, status: ProjectStatus.InDevelopment });

    await userEvent.click(screen.getByRole("button", { name: "Add a Repo" }));

    expect(mockedInvoke).toHaveBeenCalledWith("get_repo_from_path", {
      path: "/repos/new",
    });
    expect(useRepoListStore.getState().repoList).toContainEqual({
      path: "/repos/new",
      name: "new",
    });
    expect(screen.getByLabelText("Linked Repo")).toHaveValue("/repos/new");
  });
});

describe("ProjectCardExpanded — associated bugs/stories", () => {
  it("shows an empty message when nothing is tagged to the project", () => {
    renderExpanded();

    expect(
      screen.getByText("No bugs or stories tagged to this project yet"),
    ).toBeInTheDocument();
  });

  it("lists work items tagged to this project across every repo", () => {
    useWorkItemBoardStore.setState({
      boards: {
        "/repos/a": [makeWorkItem({ id: "a1", project: 1, title: "Item A" })],
        "/repos/b": [
          makeWorkItem({ id: "b1", project: 1, title: "Item B" }),
          makeWorkItem({ id: "b2", project: 2, title: "Other project's item" }),
        ],
      },
    });

    renderExpanded();

    expect(screen.getByText("Item A")).toBeInTheDocument();
    expect(screen.getByText("Item B")).toBeInTheDocument();
    expect(screen.queryByText("Other project's item")).not.toBeInTheDocument();
  });
});

describe("ProjectCardExpanded — close", () => {
  it("calls onRequestClose when Cancel is clicked", async () => {
    const { onRequestClose } = renderExpanded();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onRequestClose).toHaveBeenCalled();
  });

  it("calls onRequestClose when the close icon is clicked", async () => {
    const { onRequestClose } = renderExpanded();

    await userEvent.click(screen.getByLabelText("Close"));

    expect(onRequestClose).toHaveBeenCalled();
  });
});
