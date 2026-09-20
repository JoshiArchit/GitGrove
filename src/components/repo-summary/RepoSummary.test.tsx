import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { openUrl } from "@tauri-apps/plugin-opener";
import RepoSummary from "./RepoSummary";
import { useSelectedRepoStore } from "../../stores/selectedRepoStore";
import { RepoSummaryData } from "../../types/repo.types";

vi.mock("@tauri-apps/plugin-opener", () => ({ openUrl: vi.fn() }));
vi.mock("echarts", () => ({
  init: vi.fn(() => ({ setOption: vi.fn(), dispose: vi.fn() })),
}));

const initialSelectedRepoState = useSelectedRepoStore.getState();
const mockedOpenUrl = vi.mocked(openUrl);

const SUMMARY: RepoSummaryData = {
  current_branch: "main",
  remote_url: "https://github.com/example/repo.git",
  branches: ["main", "dev", "feat/x"],
  total_commits: 42,
  first_commit_date: "2026-01-01",
  last_commit_date: "2026-06-01",
  languages: { TypeScript: 500, Rust: 300 },
};

beforeEach(() => {
  useSelectedRepoStore.setState(initialSelectedRepoState, true);
  mockedOpenUrl.mockReset();
});

describe("RepoSummary — with data", () => {
  beforeEach(() => {
    useSelectedRepoStore.setState({ summary: SUMMARY });
  });

  it("shows the current branch and stat cards", () => {
    render(<RepoSummary />);

    expect(screen.getByText("Checked Out")).toBeInTheDocument();
    expect(screen.getByText("main")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument(); // branches.length
    expect(screen.getByText("42")).toBeInTheDocument(); // total_commits
    expect(screen.getByText("2026-01-01")).toBeInTheDocument();
    expect(screen.getByText("2026-06-01")).toBeInTheDocument();
  });

  it("opens the remote URL when the remote link is clicked", async () => {
    render(<RepoSummary />);

    await userEvent.click(screen.getByText(SUMMARY.remote_url));

    expect(mockedOpenUrl).toHaveBeenCalledWith(SUMMARY.remote_url);
  });

  it("collapses when the header is clicked, un-rotating the chevron", async () => {
    render(<RepoSummary />);
    const chevron = document.querySelector("svg")!;
    expect(chevron).toHaveClass("rotate-180");

    await userEvent.click(screen.getByText("Repository Summary"));

    expect(chevron).not.toHaveClass("rotate-180");
  });
});

describe("RepoSummary — no remote set", () => {
  it("shows a fallback message instead of a link", () => {
    useSelectedRepoStore.setState({
      summary: { ...SUMMARY, remote_url: "" },
    });

    render(<RepoSummary />);

    expect(screen.getByText("Remote : No remote set")).toBeInTheDocument();
  });
});

describe("RepoSummary — no summary yet", () => {
  it("renders without crashing and shows zeroed-out stats", () => {
    render(<RepoSummary />);

    expect(screen.getAllByText("0")).not.toHaveLength(0);
  });
});
