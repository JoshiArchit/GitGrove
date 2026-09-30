import { AnimatePresence } from "motion/react";
import { useEffect } from "react";
import "./App.css";
import ProjectsOverview from "./components/projects/ProjectsOverview";
import RepoView from "./components/repo-view/RepoView";
import Sidebar from "./components/Sidebar";
import WelcomeScreen from "./components/WelcomeScreen";
import { useProjectsStore } from "./stores/projectsStore";
import { useRepoListStore } from "./stores/repoListStore";
import { useSelectedRepoStore } from "./stores/selectedRepoStore";

function App() {
  const repo = useSelectedRepoStore((s) => s.repo);
  const repoList = useRepoListStore((s) => s.repoList);
  const updateRepoListAndRoot = useRepoListStore(
    (s) => s.updateRepoListAndRoot,
  );
  const initRepoList = useRepoListStore((s) => s.init);
  const reposScanned = repoList.length > 0;
  const showProjects = useProjectsStore((s) => s.showProjects);

  useEffect(() => {
    initRepoList();
  }, [initRepoList]);

  return (
    <div className="relative flex h-screen min-h-120 w-screen min-w-160 gap-4 bg-black p-3 font-mono">
      <div className="w-sidebar-collapsed shrink-0" />{" "}
      {/* reserves collapsed-width space */}
      <aside className="absolute inset-y-3 left-3 z-10">
        <Sidebar
          repoList={repoList}
          updateRepoListAndRoot={updateRepoListAndRoot}
        />
      </aside>
      <main className="border-box relative h-full w-full min-w-0 scrollbar-thumb-gray-700 scrollbar-track-gray-500 overflow-auto">
        <AnimatePresence initial={false}>
          {showProjects ? (
            <ProjectsOverview key="projects" />
          ) : !reposScanned || !repo ? (
            <WelcomeScreen key="welcome" reposScanned={reposScanned} />
          ) : (
            <RepoView key="content" />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
