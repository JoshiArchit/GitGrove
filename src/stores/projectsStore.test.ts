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
  projectId: 1,
  title: "Untitled Project",
  status: ProjectStatus.Idea,
  description: "",
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
    const projectA = makeProject({ projectId: 1, title: "Project A" });
    const projectB = makeProject({ projectId: 2, title: "Project B" });

    addProject(projectA);
    addProject(projectB);

    expect(getProjects()).toEqual([projectA, projectB]);
  });

  it("updateProject merges updates into the matching project only", () => {
    const { addProject, updateProject, getProjects } =
      useProjectsStore.getState();
    addProject(makeProject({ projectId: 1, title: "Original" }));
    addProject(makeProject({ projectId: 2, title: "Untouched" }));

    updateProject(1, {
      title: "Renamed",
      status: ProjectStatus.InDevelopment,
    });

    const projects = getProjects();
    expect(projects.find((p) => p.projectId === 1)).toMatchObject({
      title: "Renamed",
      status: ProjectStatus.InDevelopment,
    });
    expect(projects.find((p) => p.projectId === 2)?.title).toBe("Untouched");
  });

  it("deleteProject removes only the matching project", () => {
    const { addProject, deleteProject, getProjects } =
      useProjectsStore.getState();
    addProject(makeProject({ projectId: 1 }));
    addProject(makeProject({ projectId: 2 }));

    deleteProject(1);

    expect(getProjects().map((p) => p.projectId)).toEqual([2]);
  });

  it("updateProject and deleteProject are no-ops when the project doesn't exist", () => {
    const { addProject, updateProject, deleteProject, getProjects } =
      useProjectsStore.getState();
    addProject(makeProject({ projectId: 1 }));

    expect(() => {
      updateProject(999, { title: "x" });
      deleteProject(999);
    }).not.toThrow();

    expect(getProjects()).toEqual([makeProject({ projectId: 1 })]);
  });
});
