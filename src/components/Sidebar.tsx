import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { FolderGit2, PanelRight, Sprout } from "lucide-react";
import { useState } from "react";
import { RepoEntry } from "../types/repo.types";

type SidebarProps = {
  setActiveRepo: (repo: RepoEntry) => void;
};

/**
 * A sidebar component that displays a list of git repositories, a button to scan a root directory and selecting a repository to view its details.
 * @returns The rendered sidebar component.
 */
const Sidebar = ({ setActiveRepo }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(true);
  const [repoList, setRepoList] = useState<RepoEntry[]>([]);

  let rootPath: string = "";

  async function getRepoList() {
    const result = await invoke<RepoEntry[]>("scan_repos", {
      rootDirectory: rootPath,
    });
    setRepoList(result);
    console.log(repoList);
  }

  async function getRootDirectoryPath() {
    rootPath =
      (await open({
        directory: true,
        multiple: false,
        title: "Select root folder",
      })) ?? "";

    await getRepoList();
  }

  function handleSetActiveRepo(repo: RepoEntry) {
    setActiveRepo(repo);
  }

  return (
    <aside
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
          onClick={getRootDirectoryPath}
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
        {/* TODO: Enhancement, needs adjustments in the Rust Command */}
        {/* <button
          onClick={getRootDirectoryPath}
          title="Scan for Repos"
          className={`flex items-center justify-center overflow-hidden rounded-lg border border-gray-500 bg-transparent p-2 text-sm transition-all duration-300 hover:cursor-pointer hover:bg-gray-800 ${collapsed ? "" : "w-full"}`}
        >
          <FolderCode className="shrink-0" />
          <span
            className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${collapsed ? "w-0 opacity-0" : "ml-2 w-auto opacity-100"}`}
          >
            Add a Repo
          </span>
        </button> */}
      </section>

      {!collapsed && (
        <section
          id="sidebar-repo-list"
          className="min-h-0 flex-1 scrollbar-thin scrollbar-thumb-blue-300 overflow-y-auto transition-all duration-300"
        >
          <ul className="list-none space-y-2">
            {repoList.map((repo) => {
              return (
                <li
                  key={repo.name}
                  className="transition-color hover: cursor-pointer rounded-lg border border-transparent px-2 text-sm duration-300 hover:bg-blue-600"

                  onClick={() => handleSetActiveRepo(repo)}
                >
                  {repo.name}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </aside>
  );
};

export default Sidebar;
