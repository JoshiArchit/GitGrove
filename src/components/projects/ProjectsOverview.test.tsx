import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProjectsStore } from "../../stores/projectsStore";
import { Project, ProjectStatus } from "../../types/project.types";
import ProjectsOverview from "./ProjectsOverview";

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

vi.mock("./ProjectCard", () => ({
  default: ({ project }: { project: Project }) => (
    <div data-testid="project-card">{project.title}</div>
  ),
}));

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  projectId: 1,
  title: "Untitled Project",
  status: ProjectStatus.Idea,
  description: "",
  ...overrides,
});

beforeEach(() => {
  useProjectsStore.setState({ projects: [] });
  localStorage.clear();
});

describe("ProjectsOverview", () => {
  it("renders a labeled column for every status, even with no projects", () => {
    render(<ProjectsOverview />);

    expect(screen.getByText("New Ideas")).toBeInTheDocument();
    expect(screen.getByText("Brainstorming")).toBeInTheDocument();
    expect(screen.getByText("In Development")).toBeInTheDocument();
    expect(screen.getByText("In Test")).toBeInTheDocument();
    expect(screen.getByText("Deployed")).toBeInTheDocument();
    expect(screen.queryByTestId("project-card")).not.toBeInTheDocument();
  });

  it("groups each project under its status column only", () => {
    useProjectsStore.setState({
      projects: [
        makeProject({
          projectId: 1,
          title: "Idea Project",
          status: ProjectStatus.Idea,
        }),
        makeProject({
          projectId: 2,
          title: "Deployed Project",
          status: ProjectStatus.Deployed,
        }),
      ],
    });

    render(<ProjectsOverview />);

    const cards = screen.getAllByTestId("project-card");
    expect(cards).toHaveLength(2);
    expect(cards.map((c) => c.textContent)).toEqual([
      "Idea Project",
      "Deployed Project",
    ]);
  });

  it("renders multiple projects sharing a status under the same column", () => {
    useProjectsStore.setState({
      projects: [
        makeProject({
          projectId: 1,
          title: "First",
          status: ProjectStatus.InTest,
        }),
        makeProject({
          projectId: 2,
          title: "Second",
          status: ProjectStatus.InTest,
        }),
      ],
    });

    render(<ProjectsOverview />);

    expect(screen.getAllByTestId("project-card")).toHaveLength(2);
  });
});

function getDialog() {
  return document.querySelector("dialog") as HTMLDialogElement;
}

describe("ProjectsOverview — Add Project dialog", () => {
  it("opens the Add Project dialog when 'Add a Project' is clicked", async () => {
    render(<ProjectsOverview />);

    expect(getDialog()).not.toHaveAttribute("open");

    await userEvent.click(
      screen.getByRole("button", { name: "Add a Project" }),
    );

    expect(getDialog()).toHaveAttribute("open");
  });

  it("closes without confirmation when the form has no unsaved changes", async () => {
    const confirmSpy = vi.spyOn(window, "confirm");
    render(<ProjectsOverview />);
    await userEvent.click(
      screen.getByRole("button", { name: "Add a Project" }),
    );

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(getDialog()).not.toHaveAttribute("open");
    vi.restoreAllMocks();
  });

  it("asks for confirmation before closing dirty changes, and keeps the dialog open on cancel", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<ProjectsOverview />);
    await userEvent.click(
      screen.getByRole("button", { name: "Add a Project" }),
    );

    await userEvent.type(
      screen.getByPlaceholderText("Enter a title for the project"),
      "Trail Tracker",
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(confirmSpy).toHaveBeenCalledWith("Discard unsaved changes?");
    expect(getDialog()).toHaveAttribute("open");
    vi.restoreAllMocks();
  });

  it("closes dirty changes once the user confirms discarding them", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<ProjectsOverview />);
    await userEvent.click(
      screen.getByRole("button", { name: "Add a Project" }),
    );

    await userEvent.type(
      screen.getByPlaceholderText("Enter a title for the project"),
      "Trail Tracker",
    );
    await userEvent.click(screen.getByLabelText("Close"));

    expect(getDialog()).not.toHaveAttribute("open");
    vi.restoreAllMocks();
  });

  describe("drag end", () => {
    const dropEvent = (
      sourceId: number | undefined,
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

    const statusOf = (id: number) =>
      useProjectsStore.getState().projects.find((p) => p.projectId === id)
        ?.status;

    beforeEach(() => {
      useProjectsStore.setState({
        projects: [
          makeProject({ projectId: 1, status: ProjectStatus.Idea }),
          makeProject({ projectId: 2, status: ProjectStatus.Idea }),
        ],
      });
    });

    it("moves the project to the destination column's status", () => {
      render(<ProjectsOverview />);

      drop(dropEvent(1, ProjectStatus.InDevelopment));

      expect(statusOf(1)).toBe(ProjectStatus.InDevelopment);
      expect(statusOf(2)).toBe(ProjectStatus.Idea);
    });

    it("does nothing when dropped outside any droppable", () => {
      render(<ProjectsOverview />);
      const before = useProjectsStore.getState().projects;

      drop(dropEvent(1, undefined));

      expect(useProjectsStore.getState().projects).toBe(before);
    });

    it("does nothing when there is no drag source", () => {
      render(<ProjectsOverview />);
      const before = useProjectsStore.getState().projects;

      drop(dropEvent(undefined, ProjectStatus.Deployed));

      expect(useProjectsStore.getState().projects).toBe(before);
    });

    it("does nothing when the drag was cancelled", () => {
      render(<ProjectsOverview />);
      const before = useProjectsStore.getState().projects;

      drop(dropEvent(1, ProjectStatus.Deployed, true));

      expect(useProjectsStore.getState().projects).toBe(before);
    });

    it("ignores a drop target that is not a project status", () => {
      render(<ProjectsOverview />);
      const before = useProjectsStore.getState().projects;

      drop(dropEvent(1, "not-a-status"));

      expect(useProjectsStore.getState().projects).toBe(before);
    });

    it("does nothing when dropped on its own column", () => {
      render(<ProjectsOverview />);
      const before = useProjectsStore.getState().projects;

      drop(dropEvent(1, ProjectStatus.Idea));

      expect(useProjectsStore.getState().projects).toBe(before);
    });

    it("ignores an unknown dragged project id", () => {
      render(<ProjectsOverview />);
      const before = useProjectsStore.getState().projects;

      drop(dropEvent(999, ProjectStatus.Deployed));

      expect(useProjectsStore.getState().projects).toBe(before);
    });
  });

  it("resets dirtiness when reopened after a discarded edit", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<ProjectsOverview />);
    await userEvent.click(
      screen.getByRole("button", { name: "Add a Project" }),
    );
    await userEvent.type(
      screen.getByPlaceholderText("Enter a title for the project"),
      "Abandoned draft",
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    vi.restoreAllMocks();

    const confirmSpy = vi.spyOn(window, "confirm");
    await userEvent.click(
      screen.getByRole("button", { name: "Add a Project" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(getDialog()).not.toHaveAttribute("open");
  });
});
