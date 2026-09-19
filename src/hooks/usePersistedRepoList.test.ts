import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import { load } from "@tauri-apps/plugin-store";
import { usePersistedRepoList } from "./usePersistedRepoList";
import { PersistedRepoState, RepoEntry } from "../types/repo.types";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("@tauri-apps/plugin-store", () => ({ load: vi.fn() }));

const mockedInvoke = vi.mocked(invoke);
const mockedLoad = vi.mocked(load);

function makeStoreMock(persisted: PersistedRepoState | null) {
  return {
    get: vi.fn().mockResolvedValue(persisted),
    set: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined),
  };
}

beforeEach(() => {
  mockedInvoke.mockReset();
  mockedLoad.mockReset();
});

describe("usePersistedRepoList — initial load", () => {
  it("starts empty when the store has no persisted data", async () => {
    const store = makeStoreMock(null);
    mockedLoad.mockResolvedValue(store as never);

    const { result } = renderHook(() => usePersistedRepoList());

    await waitFor(() => expect(store.get).toHaveBeenCalled());
    expect(result.current.repoList).toEqual([]);
    expect(result.current.scannedRoots).toEqual([]);
  });

  it("re-validates persisted repos against disk and drops the ones that no longer resolve", async () => {
    const persisted: PersistedRepoState = {
      scannedRoots: ["/root"],
      repos: [
        { path: "/repos/a", name: "a" },
        { path: "/repos/b", name: "b" },
      ],
    };
    const store = makeStoreMock(persisted);
    mockedLoad.mockResolvedValue(store as never);
    mockedInvoke.mockImplementation(async (_cmd, args) => {
      const path = (args as { path: string } | undefined)?.path;
      return path === "/repos/a" ? ({ path, name: "a" } as RepoEntry) : null;
    });

    const { result } = renderHook(() => usePersistedRepoList());

    await waitFor(() =>
      expect(result.current.repoList).toEqual([{ path: "/repos/a", name: "a" }]),
    );
    expect(result.current.scannedRoots).toEqual(["/root"]);
  });
});

describe("usePersistedRepoList — updateRepoListAndRoot", () => {
  it("updates the repo list, adds the new root, and persists both to the store", async () => {
    const store = makeStoreMock(null);
    mockedLoad.mockResolvedValue(store as never);
    const { result } = renderHook(() => usePersistedRepoList());
    await waitFor(() => expect(store.get).toHaveBeenCalled());

    const newRepos: RepoEntry[] = [{ path: "/repos/new", name: "new" }];
    await act(async () => {
      result.current.updateRepoListAndRoot(newRepos, "/new-root");
    });

    expect(result.current.repoList).toEqual(newRepos);
    expect(result.current.scannedRoots).toEqual(["/new-root"]);
    expect(store.set).toHaveBeenCalledWith("repoList", {
      repos: newRepos,
      scannedRoots: ["/new-root"],
    });
    expect(store.save).toHaveBeenCalled();
  });

  it("leaves scannedRoots unchanged when no root is passed", async () => {
    const persisted: PersistedRepoState = {
      scannedRoots: ["/existing-root"],
      repos: [],
    };
    const store = makeStoreMock(persisted);
    mockedLoad.mockResolvedValue(store as never);
    const { result } = renderHook(() => usePersistedRepoList());
    await waitFor(() =>
      expect(result.current.scannedRoots).toEqual(["/existing-root"]),
    );

    const newRepos: RepoEntry[] = [{ path: "/repos/new", name: "new" }];
    await act(async () => {
      result.current.updateRepoListAndRoot(newRepos);
    });

    expect(result.current.repoList).toEqual(newRepos);
    expect(result.current.scannedRoots).toEqual(["/existing-root"]);
  });

  it("does not add a duplicate root that was already scanned", async () => {
    const persisted: PersistedRepoState = {
      scannedRoots: ["/root"],
      repos: [],
    };
    const store = makeStoreMock(persisted);
    mockedLoad.mockResolvedValue(store as never);
    const { result } = renderHook(() => usePersistedRepoList());
    await waitFor(() => expect(result.current.scannedRoots).toEqual(["/root"]));

    await act(async () => {
      result.current.updateRepoListAndRoot([], "/root");
    });

    expect(result.current.scannedRoots).toEqual(["/root"]);
  });
});
