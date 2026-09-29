import { invoke } from "@tauri-apps/api/core";
import { load, Store } from "@tauri-apps/plugin-store";
import { create } from "zustand";
import { PersistedRepoState, RepoEntry } from "../types/repo.types";

const STORE_FILE = "repo-state.json";
const STORE_KEY = "repoList";

// Not part of reactive state — the Tauri Store handle is an imperative I/O
// object, not UI state, so it lives outside the store the same way a DOM ref
// would.
let tauriStore: Store | null = null;

type RepoListStore = {
  repoList: RepoEntry[];
  scannedRoots: string[];
  init: () => Promise<void>;
  updateRepoListAndRoot: (repos: RepoEntry[], root?: string) => void;
};

/**
 * Store for managing the list of scanned repositories and their scanned roots, persisting the data via Tauri's store plugin.
 * Global (not component-local) so any component can read the current repo list without prop drilling — a plain hook here
 * previously caused a real bug (WelcomeScreen calling it a second time got its own independent, out-of-sync copy of the data).
 */
export const useRepoListStore = create<RepoListStore>()((set, get) => ({
  repoList: [],
  scannedRoots: [],

  init: async () => {
    const store = await load(STORE_FILE, { autoSave: false });
    tauriStore = store;

    const persistedData = await store.get<PersistedRepoState>(STORE_KEY);
    if (!persistedData) return;

    // Re-validate persisted data against disk, drop what doesn't resolve anymore
    const validated = await Promise.all(
      persistedData.repos.map((repo) =>
        invoke<RepoEntry | null>("get_repo_from_path", {
          path: repo.path,
        }),
      ),
    );
    const stillValid = validated.filter(
      (repo): repo is RepoEntry => repo !== null,
    );

    set({ repoList: stillValid, scannedRoots: persistedData.scannedRoots });
  },

  updateRepoListAndRoot: (repos, root) => {
    const { scannedRoots } = get();
    const updatedRoots = root
      ? [...new Set([...scannedRoots, root])]
      : scannedRoots;
    set({ repoList: repos, scannedRoots: updatedRoots });
    persist(repos, updatedRoots);
  },
}));

async function persist(repos: RepoEntry[], root: string[]) {
  if (!tauriStore) return;

  await tauriStore.set(STORE_KEY, {
    repos,
    scannedRoots: root,
  } satisfies PersistedRepoState);

  await tauriStore.save();
}
