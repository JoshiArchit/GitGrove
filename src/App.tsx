import { useState } from "react";
import "./App.css";
import type { RepoEntry } from "./types/repo.types";
import Sidebar from "./components/Sidebar";

function App() {
  return (
    <main className="bg-black flex h-screen w-screen p-2 font-mono">
      <Sidebar />
    </main>
  );
}

export default App;
