import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import Sidebar from "./Sidebar";
import { useSelectedRepoStore } from "../stores/selectedRepoStore";
import { RepoEntry } from "../types/repo.types";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("@tauri-apps/plugin-dialog", () => ({ open: vi.fn() }));

const mockedInvoke = vi.mocked(invoke);
const mockedOpen = vi.mocked(open);
const initialSelectedRepoState = useSelectedRepoStore.getState();

const REPOS: RepoEntry[] = [
  { path: "/repos/a", name: "a" },
  { path: "/repos/b", name: "b" },
];

beforeEach(() => {
  useSelectedRepoStore.setState(initialSelectedRepoState, true);
  mockedInvoke.mockReset();
  mockedOpen.mockReset();
});

describe("Sidebar — collapsed by default", () => {
  it("does not render the repo list until expanded", () => {
    render(
      <Sidebar repoList={REPOS} updateRepoListAndRoot={vi.fn()} />,
    );

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("expands to show the repo list when 'Expand Menu' is clicked", async () => {
    render(
      <Sidebar repoList={REPOS} updateRepoListAndRoot={vi.fn()} />,
    );

    await userEvent.click(screen.getByTitle("Expand Menu"));

    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getByText("a")).toBeInTheDocument();
    expect(screen.getByText("b")).toBeInTheDocument();
  });
});

describe("Sidebar — repo selection", () => {
  it("highlights the currently active repo", async () => {
    useSelectedRepoStore.setState({ repo: REPOS[0] });
    render(
      <Sidebar repoList={REPOS} updateRepoListAndRoot={vi.fn()} />,
    );
    await userEvent.click(screen.getByTitle("Expand Menu"));

    expect(screen.getByText("a")).toHaveClass("bg-blue-600");
    expect(screen.getByText("b")).not.toHaveClass("bg-blue-600");
  });

  it("selects a repo on click and re-collapses the sidebar", async () => {
    render(
      <Sidebar repoList={REPOS} updateRepoListAndRoot={vi.fn()} />,
    );
    await userEvent.click(screen.getByTitle("Expand Menu"));

    await userEvent.click(screen.getByText("b"));

    expect(useSelectedRepoStore.getState().repo).toEqual(REPOS[1]);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});

describe("Sidebar — scanning and adding repos", () => {
  it("scans a root directory and merges the results into the existing list, deduping by path", async () => {
    mockedOpen.mockResolvedValue("/some/root");
    mockedInvoke.mockResolvedValue([
      { path: "/repos/a", name: "a-renamed" }, // same path as an existing repo
      { path: "/repos/c", name: "c" },
    ]);
    const updateRepoListAndRoot = vi.fn();
    render(
      <Sidebar repoList={REPOS} updateRepoListAndRoot={updateRepoListAndRoot} />,
    );

    await userEvent.click(screen.getByTitle("Scan for Repos"));

    expect(mockedInvoke).toHaveBeenCalledWith("scan_repos", {
      rootDirectory: "/some/root",
    });
    expect(updateRepoListAndRoot).toHaveBeenCalledWith(
      [
        { path: "/repos/a", name: "a-renamed" },
        { path: "/repos/b", name: "b" },
        { path: "/repos/c", name: "c" },
      ],
      "/some/root",
    );
  });

  it("scans with an empty root path when the dialog is cancelled", async () => {
    mockedOpen.mockResolvedValue(null);
    mockedInvoke.mockResolvedValue([]);
    const updateRepoListAndRoot = vi.fn();
    render(
      <Sidebar repoList={REPOS} updateRepoListAndRoot={updateRepoListAndRoot} />,
    );

    await userEvent.click(screen.getByTitle("Scan for Repos"));

    expect(mockedInvoke).toHaveBeenCalledWith("scan_repos", {
      rootDirectory: "",
    });
  });

  it("adds a single repo without recording a new scanned root", async () => {
    mockedOpen.mockResolvedValue("/repos/c");
    mockedInvoke.mockResolvedValue({ path: "/repos/c", name: "c" });
    const updateRepoListAndRoot = vi.fn();
    render(
      <Sidebar repoList={REPOS} updateRepoListAndRoot={updateRepoListAndRoot} />,
    );

    await userEvent.click(screen.getByTitle("Add a single repo"));

    expect(mockedInvoke).toHaveBeenCalledWith("get_repo_from_path", {
      path: "/repos/c",
    });
    expect(updateRepoListAndRoot).toHaveBeenCalledWith([
      ...REPOS,
      { path: "/repos/c", name: "c" },
    ]);
  });

  it("does not update the list when the single-repo lookup finds nothing", async () => {
    mockedOpen.mockResolvedValue("/does/not/exist");
    mockedInvoke.mockResolvedValue(null);
    const updateRepoListAndRoot = vi.fn();
    render(
      <Sidebar repoList={REPOS} updateRepoListAndRoot={updateRepoListAndRoot} />,
    );

    await userEvent.click(screen.getByTitle("Add a single repo"));

    expect(updateRepoListAndRoot).not.toHaveBeenCalled();
  });
});
