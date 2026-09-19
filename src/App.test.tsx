import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";
import { useSelectedRepoStore } from "./stores/selectedRepoStore";
import { usePersistedRepoList } from "./hooks/usePersistedRepoList";
import { RepoEntry } from "./types/repo.types";

vi.mock("./components/ContributionGraph", () => ({
  default: () => <div data-testid="contribution-graph" />,
}));
vi.mock("./components/RepoSummary/RepoSummary", () => ({
  default: () => <div data-testid="repo-summary" />,
}));
vi.mock("./components/Sidebar", () => ({
  default: () => <div data-testid="sidebar" />,
}));
vi.mock("./components/Board/Board", () => ({
  default: () => <div data-testid="board" />,
}));
vi.mock("./components/WelcomeScreen", () => ({
  default: ({ reposScanned }: { reposScanned: boolean }) => (
    <div data-testid="welcome-screen">{String(reposScanned)}</div>
  ),
}));
vi.mock("./hooks/usePersistedRepoList", () => ({
  usePersistedRepoList: vi.fn(),
}));

const mockedUsePersistedRepoList = vi.mocked(usePersistedRepoList);
const initialSelectedRepoState = useSelectedRepoStore.getState();
const REPO: RepoEntry = { path: "/repos/git-grove", name: "git-grove" };

beforeEach(() => {
  useSelectedRepoStore.setState(initialSelectedRepoState, true);
});

describe("App", () => {
  it("always renders the sidebar", () => {
    mockedUsePersistedRepoList.mockReturnValue({
      repoList: [],
      scannedRoots: [],
      updateRepoListAndRoot: vi.fn(),
    });

    render(<App />);

    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });

  it("shows the welcome screen (reposScanned=false) when no repos have been scanned", () => {
    mockedUsePersistedRepoList.mockReturnValue({
      repoList: [],
      scannedRoots: [],
      updateRepoListAndRoot: vi.fn(),
    });

    render(<App />);

    expect(screen.getByTestId("welcome-screen")).toHaveTextContent("false");
    expect(screen.queryByTestId("board")).not.toBeInTheDocument();
  });

  it("shows the welcome screen (reposScanned=true) when repos are scanned but none is selected", () => {
    mockedUsePersistedRepoList.mockReturnValue({
      repoList: [REPO],
      scannedRoots: ["/root"],
      updateRepoListAndRoot: vi.fn(),
    });

    render(<App />);

    expect(screen.getByTestId("welcome-screen")).toHaveTextContent("true");
    expect(screen.queryByTestId("board")).not.toBeInTheDocument();
  });

  it("shows the main content once a repo is scanned and selected", () => {
    mockedUsePersistedRepoList.mockReturnValue({
      repoList: [REPO],
      scannedRoots: ["/root"],
      updateRepoListAndRoot: vi.fn(),
    });
    useSelectedRepoStore.setState({ repo: REPO });

    render(<App />);

    expect(screen.getByTestId("repo-summary")).toBeInTheDocument();
    expect(screen.getByTestId("contribution-graph")).toBeInTheDocument();
    expect(screen.getByTestId("board")).toBeInTheDocument();
    expect(screen.queryByTestId("welcome-screen")).not.toBeInTheDocument();
  });
});
