import { useEffect, useRef, useState } from "react";
import { PersistedRepoState, RepoEntry } from "../types/repo.types";
import { load, Store } from "@tauri-apps/plugin-store";
import { invoke } from "@tauri-apps/api/core";

const STORE_FILE = "repo-state.json";
const STORE_KEY = "repoList";

/**
 * A custom React hook that manages a list of repositories and their scanned roots, persisting the data to a store.
 * @returns An object containing the current list of repositories, a function to update the list, the scanned roots, and a function to add a scanned root.
 */
export function usePersistedRepoList() {
  const [repoList, setRepoListState] = useState<RepoEntry[]>([]);
  const [scannedRoots, setScannedRootsState] = useState<string[]>([]);
  const storeRef = useRef<Store | null>(null);

  useEffect(() => {
    async function init() {
      const store = await load(STORE_FILE, { autoSave: false });
      storeRef.current = store;

      // Get persisted data
      let persistedData = await store.get<PersistedRepoState>(STORE_KEY);
      if (!persistedData) return;

      // Re-validate persisted data against disk, drop what doesnt resolve anymore
      const validated = await Promise.all(
        persistedData.repos.map((repo) =>
          invoke<RepoEntry | null>("get_repo_from_path", {
            directory: repo.path,
          }),
        ),
      );
      const stillValid = validated.filter(
        (repo): repo is RepoEntry => repo !== null,
      );

      setRepoListState(stillValid);
      setScannedRootsState(persistedData.scannedRoots);
    }

    init();
  }, []);

  async function persist(repos: RepoEntry[], root: string[]) {
    const store = storeRef.current;
    if (!store) return;

    await store.set(STORE_KEY, {
      repos,
      scannedRoots: root,
    } satisfies PersistedRepoState);

    await store.save();
  }

  function updateRepoList(repos: RepoEntry[]) {
    setRepoListState(repos);
    persist(repos, scannedRoots);
  }

  function addScannedRoot(root: string) {
    const updatedRoots = [...new Set([...scannedRoots, root])];
    setScannedRootsState(updatedRoots);
    persist(repoList, updatedRoots);
  }

  return { repoList, updateRepoList, scannedRoots, addScannedRoot };
}
