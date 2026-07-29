import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import "./App.css";
import ContributionGraph from "./components/ContributionGraph";
import RepoSummaryData from "./components/RepoSummary/RepoSummary";
import Sidebar from "./components/Sidebar";
import WelcomeScreen from "./components/WelcomeScreen";
import { usePersistedRepoList } from "./hooks/usePersistedRepoList";
import type { RepoEntry } from "./types/repo.types";

function App() {
  const [activeRepo, setActiveRepo] = useState<RepoEntry>();
  const { repoList, updateRepoListAndRoot } = usePersistedRepoList();
  const reposScanned = repoList.length > 0;

  return (
    <div className="relative flex h-screen min-h-120 w-screen min-w-160 gap-4 bg-black p-3 font-mono">
      <div className="w-sidebar-collapsed shrink-0" />{" "}
      {/* reserves collapsed-width space */}
      <aside className="absolute inset-y-3 left-3 z-10">
        <Sidebar
          setActiveRepo={setActiveRepo}
          activeRepo={activeRepo}
          repoList={repoList}
          updateRepoListAndRoot={updateRepoListAndRoot}
        />
      </aside>
      {/* TODO: If the number of components in <main> increases, consider making a wrapper component. */}
      <main className="border-box relative h-full w-full min-w-0 scrollbar-thumb-gray-700 scrollbar-track-gray-500 overflow-auto">
        <AnimatePresence initial={false}>
          {!reposScanned || !activeRepo ? (
            <motion.div
              key="welcome"
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              <WelcomeScreen
                reposScanned={reposScanned}
                activeRepo={activeRepo}
              />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex flex-col gap-3 pr-3"
            >
              <RepoSummaryData selectedRepo={activeRepo} />
              <ContributionGraph selectedRepo={activeRepo} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
