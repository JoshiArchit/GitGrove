import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProjectsStore } from "../../stores/projectsStore";
import { useRepoListStore } from "../../stores/repoListStore";
import { Project, ProjectStatus } from "../../types/project.types";
import ProjectCard from "./ProjectCard";

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
  description: "Log hikes and elevation stats offline-first.",
};

function getDialog() {
  return document.querySelector("dialog") as HTMLDialogElement;
}

beforeEach(() => {
  useProjectsStore.setState({ projects: [PROJECT] });
  useRepoListStore.setState({ repoList: [], scannedRoots: [] });
  localStorage.clear();
});

describe("ProjectCard", () => {
  it("renders the project id, title, and description, and a closed dialog", () => {
    render(<ProjectCard project={PROJECT} index={1} />);

    const card = within(screen.getByTestId("project-card"));
    expect(card.getByText("Project 1")).toBeInTheDocument();
    expect(card.getByText("Trail Tracker")).toBeInTheDocument();
    expect(
      card.getByText("Log hikes and elevation stats offline-first."),
    ).toBeInTheDocument();
    expect(getDialog()).not.toHaveAttribute("open");
  });

  it("opens the expanded card dialog when clicked", async () => {
    render(<ProjectCard project={PROJECT} index={1} />);

    await userEvent.click(screen.getByTestId("project-card"));

    expect(getDialog()).toHaveAttribute("open");
  });

  it("closes without confirmation when there are no unsaved changes", async () => {
    const confirmSpy = vi.spyOn(window, "confirm");
    render(<ProjectCard project={PROJECT} index={1} />);
    await userEvent.click(screen.getByTestId("project-card"));

    await userEvent.click(screen.getByLabelText("Close"));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(getDialog()).not.toHaveAttribute("open");
    vi.restoreAllMocks();
  });

  it("asks for confirmation before closing dirty changes, and keeps the dialog open on cancel", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<ProjectCard project={PROJECT} index={1} />);
    await userEvent.click(screen.getByTestId("project-card"));

    await userEvent.type(
      screen.getByDisplayValue("Trail Tracker"),
      " Extended",
    );
    await userEvent.click(screen.getByLabelText("Close"));

    expect(confirmSpy).toHaveBeenCalledWith("Discard unsaved changes?");
    expect(getDialog()).toHaveAttribute("open");
    vi.restoreAllMocks();
  });
});
