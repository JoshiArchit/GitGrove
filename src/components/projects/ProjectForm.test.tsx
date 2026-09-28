import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProjectsStore } from "../../stores/projectsStore";
import { ProjectStatus } from "../../types/project.types";
import ProjectForm from "./ProjectForm";

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

beforeEach(() => {
  useProjectsStore.setState({ projects: [] });
  localStorage.clear();
});

describe("ProjectForm — dirty detection", () => {
  it("reports dirty once the title has content, and clean once it's cleared again", () => {
    const onDirtyChange = vi.fn();
    render(
      <ProjectForm
        isDirty={false}
        onDirtyChange={onDirtyChange}
        onRequestClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    const titleInput = screen.getByPlaceholderText(
      "Enter a title for the project",
    );
    fireInput(titleInput, "Trail Tracker");
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);

    fireInput(titleInput, "");
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  });

  it("disables Submit while the form is not dirty", () => {
    render(
      <ProjectForm
        isDirty={false}
        onDirtyChange={vi.fn()}
        onRequestClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  });

  it("enables Submit once the form is dirty", () => {
    render(
      <ProjectForm
        isDirty={true}
        onDirtyChange={vi.fn()}
        onRequestClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();
  });
});

describe("ProjectForm — submit", () => {
  it("adds a new project with New Ideas (Idea) status, and calls onDirtyChange(false) and onSaved", async () => {
    const onSaved = vi.fn();
    const onDirtyChange = vi.fn();
    render(
      <ProjectForm
        isDirty={true}
        onDirtyChange={onDirtyChange}
        onRequestClose={vi.fn()}
        onSaved={onSaved}
      />,
    );

    await userEvent.type(
      screen.getByPlaceholderText("Enter a title for the project"),
      "Trail Tracker",
    );
    await userEvent.type(
      screen.getByPlaceholderText("Add description"),
      "Log hikes offline-first.",
    );
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));

    const projects = useProjectsStore.getState().getProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0]).toMatchObject({
      title: "Trail Tracker",
      description: "Log hikes offline-first.",
      status: ProjectStatus.Idea,
    });
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    expect(onSaved).toHaveBeenCalled();
  });
});

describe("ProjectForm — markdown preview", () => {
  it("toggles between the description textarea and its markdown preview", async () => {
    render(
      <ProjectForm
        isDirty={false}
        onDirtyChange={vi.fn()}
        onRequestClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    await userEvent.type(
      screen.getByPlaceholderText("Add description"),
      "**bold** text",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Supports Markdown" }),
    );

    expect(
      screen.queryByPlaceholderText("Add description"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("bold")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Show Editor" }));

    expect(screen.getByPlaceholderText("Add description")).toBeInTheDocument();
  });
});

describe("ProjectForm — close", () => {
  it("calls onRequestClose when Cancel is clicked", async () => {
    const onRequestClose = vi.fn();
    render(
      <ProjectForm
        isDirty={false}
        onDirtyChange={vi.fn()}
        onRequestClose={onRequestClose}
        onSaved={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onRequestClose).toHaveBeenCalled();
  });

  it("calls onRequestClose when the close icon is clicked", async () => {
    const onRequestClose = vi.fn();
    render(
      <ProjectForm
        isDirty={false}
        onDirtyChange={vi.fn()}
        onRequestClose={onRequestClose}
        onSaved={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByLabelText("Close"));

    expect(onRequestClose).toHaveBeenCalled();
  });
});

// userEvent.type fires real keystrokes (slow for a full-value replace); this
// helper sets the value in one shot and dispatches the same `input` event the
// component listens to for dirty-checking.
function fireInput(element: HTMLElement, value: string) {
  const input = element as HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )!.set!;
  setter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}
