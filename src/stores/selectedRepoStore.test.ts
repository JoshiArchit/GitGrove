import { beforeEach, describe, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { useSelectedRepoStore } from "./selectedRepoStore";
import { RepoEntry, RepoSummaryData } from "../types/repo.types";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockedInvoke = vi.mocked(invoke);
const initialState = useSelectedRepoStore.getState();

const makeRepo = (overrides: Partial<RepoEntry> = {}): RepoEntry =>
  ({ path: "/repos/git-grove", name: "git-grove", ...overrides }) as RepoEntry;

beforeEach(() => {
  useSelectedRepoStore.setState(initialState, true);
  mockedInvoke.mockReset();
});

describe("useSelectedRepoStore", () => {
  it("starts with no repo, no summary, not loading", () => {
    const { repo, summary, isLoading } = useSelectedRepoStore.getState();
    expect(repo).toBeNull();
    expect(summary).toBeNull();
    expect(isLoading).toBe(false);
  });

  it("setSelectedRepo sets the repo, clears the old summary, and fetches a new one", async () => {
    const repo = makeRepo();
    mockedInvoke.mockResolvedValue({
      totalCommits: 5,
    } as unknown as RepoSummaryData);

    useSelectedRepoStore.getState().setSelectedRepo(repo);

    expect(useSelectedRepoStore.getState().repo).toBe(repo);
    expect(useSelectedRepoStore.getState().summary).toBeNull();

    await vi.waitFor(() => {
      expect(useSelectedRepoStore.getState().isLoading).toBe(false);
    });

    expect(mockedInvoke).toHaveBeenCalledWith("get_repo_summary", {
      repoPath: repo.path,
    });
    expect(useSelectedRepoStore.getState().summary).toEqual({
      totalCommits: 5,
    });
  });

  it("refresh is a no-op when no repo is selected", async () => {
    await useSelectedRepoStore.getState().refresh();

    expect(mockedInvoke).not.toHaveBeenCalled();
  });

  it("sets isLoading while the invoke call is in flight", async () => {
    useSelectedRepoStore.setState({ repo: makeRepo() });

    let resolveInvoke!: (value: RepoSummaryData) => void;
    mockedInvoke.mockReturnValue(
      new Promise((resolve) => {
        resolveInvoke = resolve;
      }) as ReturnType<typeof invoke>,
    );

    const refreshPromise = useSelectedRepoStore.getState().refresh();
    expect(useSelectedRepoStore.getState().isLoading).toBe(true);

    resolveInvoke({ totalCommits: 3 } as unknown as RepoSummaryData);
    await refreshPromise;

    expect(useSelectedRepoStore.getState().isLoading).toBe(false);
    expect(useSelectedRepoStore.getState().summary).toEqual({
      totalCommits: 3,
    });
  });
});
