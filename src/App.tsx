import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useState } from "react";
import "./App.css";
import type { RepoEntry } from "./types/repo.types";

function App() {
  let rootPath: string = "";
  const [repoList, setRepoList] = useState<RepoEntry[]>([]);

  async function testRepoListFetch() {
    const result = await invoke<RepoEntry[]>("scan_repos", {
      rootDirectory: rootPath,
    });
    setRepoList(result);
    console.log(repoList);
  }

  async function getRootDirectoryPath() {
    rootPath = (await open({ directory: true, multiple: false })) ?? "";
    console.log("Root Path", rootPath);
    await testRepoListFetch();
  }

  return (
    <main className="bg-black">
      <div className="flex flex-col text-cyan-500">
        <span className="text-xl">Hey Archit</span>
        <span className="text-3xl">Welcome to GitGrove</span>

        <button
          className="bg-blue-300 px-4 py-2"
          onClick={getRootDirectoryPath}
        >
          Get Repos
        </button>
        <ul>
          {repoList.map((repo) => {
            return <li key={repo.name}>{repo.name}</li>;
          })}
        </ul>
      </div>
    </main>
  );
}

export default App;
