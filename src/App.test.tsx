import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";
import { useSelectedRepoStore } from "./stores/selectedRepoStore";
import { useRepoListStore } from "./stores/repoListStore";
import { RepoEntry } from "./types/repo.types";

vi.mock("./components/ContributionGraph", () => ({
  default: () => <div data-testid="contribution-graph" />,
}));
vi.mock("./components/repo-summary/RepoSummary", () => ({
  default: () => <div data-testid="repo-summary" />,
}));
vi.mock("./components/Sidebar", () => ({
  default: () => <div data-testid="sidebar" />,
}));
vi.mock("./components/board/Board", () => ({
  default: () => <div data-testid="board" />,
}));
vi.mock("./components/WelcomeScreen", () => ({
  default: ({ reposScanned }: { reposScanned: boolean }) => (
    <div data-testid="welcome-screen">{String(reposScanned)}</div>
  ),
}));
// init() otherwise hits the real Tauri store plugin, which isn't available in
// jsdom — mocked load() resolving no persisted data makes init() a no-op, so
// each test's own repoListStore.setState() below is left untouched.
vi.mock("@tauri-apps/plugin-store", () => ({
  load: vi.fn().mockResolvedValue({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined),
  }),
}));

const initialSelectedRepoState = useSelectedRepoStore.getState();
const initialRepoListState = useRepoListStore.getState();
const REPO: RepoEntry = { path: "/repos/git-grove", name: "git-grove" };

beforeEach(() => {
  useSelectedRepoStore.setState(initialSelectedRepoState, true);
  useRepoListStore.setState(initialRepoListState, true);
});

describe("App", () => {
  it("always renders the sidebar", () => {
    render(<App />);

    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });

  it("shows the welcome screen (reposScanned=false) when no repos have been scanned", () => {
    render(<App />);

    expect(screen.getByTestId("welcome-screen")).toHaveTextContent("false");
    expect(screen.queryByTestId("board")).not.toBeInTheDocument();
  });

  it("shows the welcome screen (reposScanned=true) when repos are scanned but none is selected", () => {
    useRepoListStore.setState({ repoList: [REPO], scannedRoots: ["/root"] });

    render(<App />);

    expect(screen.getByTestId("welcome-screen")).toHaveTextContent("true");
    expect(screen.queryByTestId("board")).not.toBeInTheDocument();
  });

  it("shows the main content once a repo is scanned and selected", () => {
    useRepoListStore.setState({ repoList: [REPO], scannedRoots: ["/root"] });
    useSelectedRepoStore.setState({ repo: REPO });

    render(<App />);

    expect(screen.getByTestId("repo-summary")).toBeInTheDocument();
    expect(screen.getByTestId("contribution-graph")).toBeInTheDocument();
    expect(screen.getByTestId("board")).toBeInTheDocument();
    expect(screen.queryByTestId("welcome-screen")).not.toBeInTheDocument();
  });
});
