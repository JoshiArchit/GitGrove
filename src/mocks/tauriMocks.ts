import { mockIPC } from "@tauri-apps/api/mocks";
import type {
  Contributions,
  RepoEntry,
  RepoSummaryData,
} from "../types/repo.types";

/**
 *  This file contains mock implementations of Tauri APIs for development purposes.
 *  It is used to simulate Tauri's behavior in a web environment, allowing for easier testing and development without needing the full Tauri runtime.
 *  The mocks provide predefined responses for various Tauri commands, enabling developers to work with consistent data during development.
 *  Note: These mocks are only active in development mode and should not be used in production.
 * Any changes made made in the libraries or APIs used in this file should be reflected in the mock implementations to ensure accurate simulation of Tauri's behavior.
 */

const MOCK_REPOS: RepoEntry[] = [
  { path: "/mock/git-grove", name: "git-grove" },
  { path: "/mock/side-project", name: "side-project" },
];

const MOCK_CONTRIBUTIONS: Contributions = {
  contributions: {
    "2026-07-20": 3,
    "2026-07-22": 7,
    "2026-07-25": 2,
    "2026-07-26": 12,
  },
};

const MOCK_SUMMARY: RepoSummaryData = {
  current_branch: "feat/mock-data",
  remote_url: "https://github.com/JoshiArchit/GitGrove.git",
  branch_count: 3,
  total_commits: 42,
  first_commit_date: "2026-06-01",
  last_commit_date: "2026-07-27",
  languages: { Rust: 500, TypeScript: 350, TSX: 280, CSS: 20 },
};

export function installTauriMocks() {
  mockIPC((cmd, args) => {
    switch (cmd) {
      case "scan_repos":
        return MOCK_REPOS;
      case "get_contributions":
        return MOCK_CONTRIBUTIONS;
      case "get_repo_summary":
        return MOCK_SUMMARY;
      case "plugin:dialog|open":
        return "/mock/selected-folder";
      case "plugin:opener|open_url":
        console.log("[mock] would open URL:", args);
        return undefined;
      default:
        console.warn(`[mock] unhandled invoke: ${cmd}`, args);
        return undefined;
    }
  });
}
