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
