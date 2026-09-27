import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProjectsStore } from "./projectsStore";
import { ProjectStatus } from "../types/project.types";
import type { Project } from "../types/project.types";

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

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  projectId: "project-1",
  title: "Untitled Project",
  status: ProjectStatus.Idea,
  description: "",
  items: [],
  ...overrides,
});

beforeEach(() => {
  useProjectsStore.setState({ projects: [], showProjects: false });
  localStorage.clear();
});

describe("useProjectsStore", () => {
  it("openProjects and closeProjects toggle showProjects", () => {
    const { openProjects, closeProjects } = useProjectsStore.getState();

    openProjects();
    expect(useProjectsStore.getState().showProjects).toBe(true);

    closeProjects();
    expect(useProjectsStore.getState().showProjects).toBe(false);
  });

  it("addProject appends to the list", () => {
    const { addProject, getProjects } = useProjectsStore.getState();
    const projectA = makeProject({ projectId: "p1", title: "Project A" });
    const projectB = makeProject({ projectId: "p2", title: "Project B" });

    addProject(projectA);
    addProject(projectB);

    expect(getProjects()).toEqual([projectA, projectB]);
  });

  it("updateProject merges updates into the matching project only", () => {
    const { addProject, updateProject, getProjects } =
      useProjectsStore.getState();
    addProject(makeProject({ projectId: "p1", title: "Original" }));
    addProject(makeProject({ projectId: "p2", title: "Untouched" }));

    updateProject("p1", {
      title: "Renamed",
      status: ProjectStatus.InDevelopment,
    });

    const projects = getProjects();
    expect(projects.find((p) => p.projectId === "p1")).toMatchObject({
      name: "Renamed",
      status: ProjectStatus.InDevelopment,
    });
    expect(projects.find((p) => p.projectId === "p2")?.title).toBe("Untouched");
  });

  it("deleteProject removes only the matching project", () => {
    const { addProject, deleteProject, getProjects } =
      useProjectsStore.getState();
    addProject(makeProject({ projectId: "p1" }));
    addProject(makeProject({ projectId: "p2" }));

    deleteProject("p1");

    expect(getProjects().map((p) => p.projectId)).toEqual(["p2"]);
  });

  it("updateProject and deleteProject are no-ops when the project doesn't exist", () => {
    const { addProject, updateProject, deleteProject, getProjects } =
      useProjectsStore.getState();
    addProject(makeProject({ projectId: "p1" }));

    expect(() => {
      updateProject("missing", { title: "x" });
      deleteProject("missing");
    }).not.toThrow();

    expect(getProjects()).toEqual([makeProject({ projectId: "p1" })]);
  });
});
