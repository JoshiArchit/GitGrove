import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { invoke } from "@tauri-apps/api/core";
import ContributionGraph from "./ContributionGraph";
import { useSelectedRepoStore } from "../stores/selectedRepoStore";
import { RepoEntry } from "../types/repo.types";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("echarts", () => ({
  init: vi.fn(() => ({ setOption: vi.fn(), dispose: vi.fn() })),
}));

const mockedInvoke = vi.mocked(invoke);
const initialSelectedRepoState = useSelectedRepoStore.getState();
const REPO: RepoEntry = { path: "/repos/git-grove", name: "git-grove" };

function getSection() {
  return document.querySelector("#contributions-graph")!;
}

beforeEach(() => {
  useSelectedRepoStore.setState(initialSelectedRepoState, true);
  mockedInvoke.mockReset();
});

describe("ContributionGraph", () => {
  it("does not fetch contributions when no repo is selected", () => {
    render(<ContributionGraph />);

    expect(mockedInvoke).not.toHaveBeenCalled();
    expect(getSection()).toHaveClass("opacity-0");
  });

  it("fetches contributions for the selected repo and becomes visible once loaded", async () => {
    useSelectedRepoStore.setState({ repo: REPO });
    mockedInvoke.mockResolvedValue({
      contributions: { "2026-01-01": 3 },
    });

    render(<ContributionGraph />);

    expect(mockedInvoke).toHaveBeenCalledWith("get_contributions", {
      repoPath: REPO.path,
    });
    await waitFor(() => expect(getSection()).toHaveClass("opacity-100"));
  });

  it("collapses when the header is clicked, un-rotating the chevron", async () => {
    render(<ContributionGraph />);
    const chevron = document.querySelector("svg")!;
    expect(chevron).toHaveClass("rotate-180");

    await userEvent.click(screen.getByText("Contribution Graph"));

    expect(chevron).not.toHaveClass("rotate-180");
  });
});
