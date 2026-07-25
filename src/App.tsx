import { useState } from "react";
import "./App.css";
import ContributionGraph from "./components/ContributionGraph";
import Sidebar from "./components/Sidebar";
import type { RepoEntry } from "./types/repo.types";

function App() {
  const [activeRepo, setActiveRepo] = useState<RepoEntry>();

  return (
    <main className="relative flex h-screen min-h-160 w-screen min-w-120 gap-4 bg-black p-2 font-mono">
      <div className="w-sidebar-collapsed shrink-0" />{" "}
      {/* reserves collapsed-width space */}
      <div className="absolute inset-y-2 left-2 z-10">
        <Sidebar setActiveRepo={setActiveRepo} activeRepo={activeRepo} />
      </div>
      <div className="h-full w-full min-w-0 rounded-xl bg-gray-950">
        <ContributionGraph selectedRepo={activeRepo} />
      </div>
    </main>
  );
}

export default App;
