import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Project, ProjectStatus } from "../../types/project.types";
import ProjectColumn from "./ProjectColumn";

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

describe("ProjectColumn", () => {
  it("renders the label as a heading", () => {
    render(
      <ProjectColumn
        status={ProjectStatus.Idea}
        label="New Ideas"
        projects={[]}
      />,
    );

    expect(screen.getByText("New Ideas")).toBeInTheDocument();
  });

  it("shows an empty-state message when there are no projects", () => {
    render(
      <ProjectColumn
        status={ProjectStatus.Idea}
        label="New Ideas"
        projects={[]}
      />,
    );

    expect(
      screen.getByText("No projects for this category"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("project-card")).not.toBeInTheDocument();
  });

  it("renders a card for every project, in order, and no empty-state message", () => {
    render(
      <ProjectColumn
        status={ProjectStatus.Brainstorming}
        label="Brainstorming"
        projects={[
          makeProject({ projectId: 1, title: "First" }),
          makeProject({ projectId: 2, title: "Second" }),
        ]}
      />,
    );

    expect(
      screen.getAllByTestId("project-card").map((c) => c.textContent),
    ).toEqual(["First", "Second"]);
    expect(
      screen.queryByText("No projects for this category"),
    ).not.toBeInTheDocument();
  });

  it("is not highlighted as a drop target when idle", () => {
    render(
      <ProjectColumn
        status={ProjectStatus.Idea}
        label="New Ideas"
        projects={[]}
      />,
    );

    expect(screen.getByTestId("project-column")).not.toHaveClass("ring-2");
  });
});
