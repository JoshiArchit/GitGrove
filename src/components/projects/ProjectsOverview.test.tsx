import { render, screen } from "@testing-library/react";
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
  items: [],
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
        makeProject({ projectId: 1, title: "First", status: ProjectStatus.InTest }),
        makeProject({ projectId: 2, title: "Second", status: ProjectStatus.InTest }),
      ],
    });

    render(<ProjectsOverview />);

    expect(screen.getAllByTestId("project-card")).toHaveLength(2);
  });
});
