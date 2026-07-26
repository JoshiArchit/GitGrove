import { useState } from "react";
import "./App.css";
import ContributionGraph from "./components/ContributionGraph";
import Sidebar from "./components/Sidebar";
import WelcomeScreen from "./components/WelcomeScreen";
import type { RepoEntry } from "./types/repo.types";

function App() {
  const [activeRepo, setActiveRepo] = useState<RepoEntry>();
  const [reposScanned, setReposScanned] = useState<boolean>(false);

  return (
    <div className="relative flex h-screen min-h-160 w-screen min-w-120 gap-4 bg-black p-3 font-mono">
      <div className="w-sidebar-collapsed shrink-0" />{" "}
      {/* reserves collapsed-width space */}
      <aside className="absolute inset-y-3 left-3 z-10">
        <Sidebar
          setActiveRepo={setActiveRepo}
          setReposScanned={setReposScanned}
          activeRepo={activeRepo}
        />
      </aside>
      <main className="border-box h-full w-full min-w-0">
        {(!reposScanned || !activeRepo) && (
          <WelcomeScreen reposScanned={reposScanned} activeRepo={activeRepo} />
        )}
        {reposScanned && activeRepo && (
          <ContributionGraph selectedRepo={activeRepo} />
        )}
      </main>
    </div>
  );
}

export default App;
