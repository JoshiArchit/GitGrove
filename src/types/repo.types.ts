/**
 * A discovered git repository, used for display and as the identifier
 * for subsequent per-repo commands.
 */
export type RepoEntry = {
  /** Absolute path on disk — the identifier passed to invoke() calls. */
  path: string;
  /** Display-only folder name, derived from `path`. */
  name: string;
};

/**
 * A collection of contributions, grouped by date.
 */
export type Contributions = {
  contributions: Record<string, number>;
};

/**
 * A summary of a git repository, including its current branch, remote URL, commit history, and language statistics.
 */
export type RepoSummaryData = {
  current_branch: string;
  remote_url: string; // If no origin set yet
  branch_count: number;
  total_commits: number;
  first_commit_date: string; // YYYY-MM-DD
  last_commit_date: string; // YYYY-MM-DD
  languages: Record<string, number>; // language name -> code line count (via tokei)
};

/**
 * Persisted state of scanned repositories, used to restore the app's state on restart.
 */
export type PersistedRepoState = {
  scannedRoots: string[];
  repos: RepoEntry[];
};
