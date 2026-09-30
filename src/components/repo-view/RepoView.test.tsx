import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import RepoView from "./RepoView";

vi.mock("../repo-summary/RepoSummary", () => ({
  default: () => <div data-testid="repo-summary" />,
}));
vi.mock("../ContributionGraph", () => ({
  default: () => <div data-testid="contribution-graph" />,
}));
vi.mock("../board/Board", () => ({
  default: () => <div data-testid="board" />,
}));

describe("RepoView", () => {
  it("renders the repo summary, contribution graph, and board", () => {
    render(<RepoView />);

    expect(screen.getByTestId("repo-summary")).toBeInTheDocument();
    expect(screen.getByTestId("contribution-graph")).toBeInTheDocument();
    expect(screen.getByTestId("board")).toBeInTheDocument();
  });

  it("renders them in summary, graph, board order", () => {
    render(<RepoView />);

    const order = screen
      .getAllByTestId(/repo-summary|contribution-graph|board/)
      .map((el) => el.getAttribute("data-testid"));

    expect(order).toEqual(["repo-summary", "contribution-graph", "board"]);
  });
});
