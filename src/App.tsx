import { useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import type { RepoEntry } from "./types/repo.types";

function App() {
  const [activeRepo, setActiveRepo] = useState<RepoEntry>();

  return (
    <main className="relative flex h-screen w-screen gap-4 bg-black p-2 font-mono">
      <div className="w-sidebar-collapsed shrink-0" />{" "}
      {/* reserves collapsed-width space */}
      <div className="absolute inset-y-2 left-2 z-10">
        <Sidebar setActiveRepo={setActiveRepo} />
      </div>
      <div className="h-full w-full rounded-xl bg-gray-950"></div>
    </main>
  );
}

export default App;
