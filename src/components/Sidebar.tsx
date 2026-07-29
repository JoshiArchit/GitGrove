import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { FolderCode, FolderGit2, PanelRight, Sprout } from "lucide-react";
import { useState } from "react";
import { usePersistedRepoList } from "../hooks/usePersistedRepoList";
import { RepoEntry } from "../types/repo.types";

type SidebarProps = {
  setActiveRepo: (repo: RepoEntry) => void;
  setReposScanned: (scanned: boolean) => void;
  activeRepo: RepoEntry | undefined;
};

/**
 * A sidebar component that displays a list of git repositories, a button to scan a root directory and selecting a repository to view its details.
 * @returns The rendered sidebar component.
 */
const Sidebar = ({
  setActiveRepo,
  setReposScanned,
  activeRepo,
}: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(true);
  const { repoList, updateRepoList, addScannedRoot } = usePersistedRepoList();

  /**
   * Merges two lists of repositories, ensuring that there are no duplicates based on the repository path.
   * @param existing The existing list of repositories.
   * @param incoming The incoming list of repositories to merge.
   * @returns A new list of repositories with duplicates removed.
   */
  function mergeRepos(
    existing: RepoEntry[],
    incoming: RepoEntry[],
  ): RepoEntry[] {
    const byPath = new Map(existing.map((r) => [r.path, r]));
    for (const repo of incoming) {
      byPath.set(repo.path, repo);
    }
    return Array.from(byPath.values());
  }

  /**
   * Gets a list of repositories from the specified root directory and updates the state with the result.
   * @param path The path to the root directory to scan.
   */
  async function getRepoList(path: string) {
    const result = await invoke<RepoEntry[]>("scan_repos", {
      rootDirectory: path,
    });
    updateRepoList(mergeRepos(repoList, result));
    addScannedRoot(path);
    setReposScanned(true);
  }

  /**
   * Gets a single repository from the specified path and updates the state with the result.
   * @param path The path to the repository to fetch.
   */
  async function getRepo(path: string) {
    const result = await invoke<RepoEntry>("get_repo_from_path", {
      path: path,
    });

    if (result) {
      updateRepoList(mergeRepos(repoList, [result]));
    }
    setReposScanned(true);
  }

  /**
   * Opens the default explorer dialog and allows folder selection
   * @param scan determines if this is a recursive scan or a single repo fetch
   */
  async function getRootDirectoryPath(scan: boolean = true) {
    const path =
      (await open({
        directory: true,
        multiple: false,
        title: "Select root folder",
      })) ?? "";

    scan ? await getRepoList(path) : await getRepo(path);
  }

  function handleSetActiveRepo(repo: RepoEntry) {
    setActiveRepo(repo);
    setCollapsed(true);
  }

  return (
    <div
      id="sidebar"
      className={`${collapsed ? "w-sidebar-collapsed" : "w-64 lg:w-[20vw]"} z-10 box-border flex h-full flex-col gap-3 rounded-xl bg-gray-900 p-4 text-white shadow-[4px_0_12px_rgba(0,0,0,0.5)] transition-all duration-300`}
    >
      <section
        id="title"
        className={`${collapsed ? "justify-center" : "justify-between"} flex w-full items-center gap-1 border-b border-gray-500 pb-2 text-xl`}
      >
        <div className="flex items-center justify-start gap-1">
          {/* TODO: Create a product icon */}
          <Sprout size={18} />
          <span
            className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${collapsed ? "w-0 opacity-0" : "ml-1 w-auto opacity-100"}`}
          >
            GitGrove
          </span>
        </div>
        <PanelRight
          onClick={() => setCollapsed(true)}
          className={collapsed ? "hidden" : ""}
        />
      </section>

      <section
        id="sidebar-action-buttons"
        className={`flex w-full flex-col items-center justify-center gap-4 ${collapsed ? "items-center" : "items-start"}`}
      >
        <button
          onClick={() => setCollapsed(false)}
          title="Expand Menu"
          className={`flex items-center justify-center rounded-lg border border-transparent p-2 transition-all duration-300 hover:border-gray-400 hover:bg-gray-700 ${collapsed ? "" : "hidden"}`}
        >
          <PanelRight />
        </button>

        <button
          onClick={() => getRootDirectoryPath(true)}
          title="Scan for Repos"
          className={`flex items-center justify-center overflow-hidden rounded-lg border border-transparent bg-green-600 p-2 text-sm transition-all duration-300 hover:cursor-pointer hover:bg-green-700 active:scale-95 active:bg-green-800 ${collapsed ? "" : "w-full"}`}
        >
          <FolderGit2 className="shrink-0" />
          <span
            className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${collapsed ? "w-0 opacity-0" : "ml-2 w-auto opacity-100"}`}
          >
            Scan for Repos
          </span>
        </button>
        <button
          onClick={() => getRootDirectoryPath(false)}
          title="Add a single repo"
          className={`flex items-center justify-center overflow-hidden rounded-lg border border-gray-500 bg-transparent p-2 text-sm transition-all duration-300 hover:cursor-pointer hover:bg-gray-800 ${collapsed ? "" : "w-full"}`}
        >
          <FolderCode className="shrink-0" />
          <span
            className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${collapsed ? "w-0 opacity-0" : "ml-2 w-auto opacity-100"}`}
          >
            Add a Repo
          </span>
        </button>
      </section>

      {!collapsed && (
        <section
          id="sidebar-repo-list"
          className="min-h-0 flex-1 scrollbar-auto scrollbar-thumb-gray-700 scrollbar-track-gray-500 scrollbar-gutter-auto overflow-y-auto transition-all duration-300"
        >
          <ul className="list-none space-y-2">
            {repoList.map((repo) => {
              return (
                <li
                  key={repo.name}
                  className={`transition-color hover: cursor-pointer rounded-lg border border-transparent px-4 py-2 text-sm duration-300 hover:bg-gray-600 ${activeRepo?.name === repo.name ? "bg-blue-600" : ""}`}

                  onClick={() => handleSetActiveRepo(repo)}
                >
                  {repo.name}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
};

export default Sidebar;
