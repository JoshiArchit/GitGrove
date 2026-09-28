import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Project, ProjectStatus } from "../../types/project.types";
import ProjectCard from "./ProjectCard";

const PROJECT: Project = {
  projectId: 1,
  title: "Trail Tracker",
  status: ProjectStatus.Brainstorming,
  description: "Log hikes and elevation stats offline-first.",
  items: [],
};

describe("ProjectCard", () => {
  it("renders the project id, title, and description", () => {
    render(<ProjectCard project={PROJECT} index={1} />);

    expect(screen.getByText("Project 1")).toBeInTheDocument();
    expect(screen.getByText("Trail Tracker")).toBeInTheDocument();
    expect(
      screen.getByText("Log hikes and elevation stats offline-first."),
    ).toBeInTheDocument();
  });
});
