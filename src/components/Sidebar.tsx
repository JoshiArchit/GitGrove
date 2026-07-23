import React, { useState } from "react";
import { RepoEntry } from "../types/repo.types";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

/**
 * A sidebar component that displays a list of git repositories, a button to scan a root directory and selecting a repository to view its details.
 * @returns The rendered sidebar component.
 */
const Sidebar = () => {
  let rootPath: string = "";
  const [repoList, setRepoList] = useState<RepoEntry[]>([]);

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

  return (
    <aside
      id="sidebar"
      className="box-border flex h-full w-64 flex-col gap-3 rounded-xl bg-gray-900 p-4 text-white"
    >
      <section id="title">
        <span className="flex w-full items-center justify-start text-xl">
          Git Grove
        </span>
      </section>
      <section
        id="sidebar-action-buttons"
        className="flex w-full items-center justify-start gap-6"
      >
        <button
          className="flex items-center justify-center rounded-lg border border-transparent bg-green-600 px-4 py-2 text-sm transition-transform duration-100 hover:cursor-pointer hover:bg-green-900 active:scale-95 active:bg-green-950"
          onClick={getRootDirectoryPath}
        >
          Scan for Repos
        </button>
        {/* // TODO: Enhancement
        <button>Add Repo</button> */}
      </section>
      <section
        id="sidebar-repo-list"
        className="min-h-0 flex-1 scrollbar-thin scrollbar-thumb-blue-300 overflow-y-auto"
      >
        <ul className="list-none space-y-2">
          {repoList.map((repo) => {
            return (
              <li
                key={repo.name}
                className="transition-color hover: cursor-pointer rounded-lg border border-transparent px-2 text-sm duration-300 hover:bg-blue-600"
              >
                {repo.name}
              </li>
            );
          })}
        </ul>
      </section>
    </aside>
  );
};

export default Sidebar;
