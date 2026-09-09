import { create } from "zustand";
import { RepoEntry, RepoSummaryData } from "../types/repo.types";
import { invoke } from "@tauri-apps/api/core";

type SelectedRepoStore = {
  repo: RepoEntry | null;
  summary: RepoSummaryData | null;
  isLoading: boolean;
  setSelectedRepo: (repo: RepoEntry) => void;
  refresh: () => Promise<void>;
};

/**
 * Store for managing the selected repository and its branches.
 * It maintains the currently selected repository, the current branch, and the list of branches for that repository.
 * The store provides methods to set the selected repository and refresh the list of branches.
 * When a new repository is selected, it automatically fetches the branches for that repository.
 * The store also manages the loading state while fetching branches.
 */
export const useSelectedRepoStore = create<SelectedRepoStore>()((set, get) => ({
  repo: null,
  summary: null,
  isLoading: false,

  setSelectedRepo: (repo) => {
    set({ repo, summary: null });
    get().refresh();
  },

  refresh: async () => {
    const { repo } = get();
    if (!repo) return;

    set({ isLoading: true });
    const summary = await invoke<RepoSummaryData>("get_repo_summary", {
      repoPath: repo.path,
    });

    set({ summary, isLoading: false });
  },
}));
