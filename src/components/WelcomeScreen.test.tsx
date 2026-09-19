import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import WelcomeScreen from "./WelcomeScreen";
import { useSelectedRepoStore } from "../stores/selectedRepoStore";
import { RepoEntry } from "../types/repo.types";

const initialState = useSelectedRepoStore.getState();

beforeEach(() => {
  useSelectedRepoStore.setState(initialState, true);
});

describe("WelcomeScreen", () => {
  it("prompts to scan for repositories when none have been scanned yet", () => {
    render(<WelcomeScreen reposScanned={false} />);

    expect(
      screen.getByText("Scan for repositories to get started."),
    ).toHaveClass("opacity-100");
    expect(
      screen.getByText("Select a repository from the scanned list"),
    ).toHaveClass("opacity-0");
  });

  it("prompts to select a repository once repos are scanned but none is active", () => {
    render(<WelcomeScreen reposScanned={true} />);

    expect(
      screen.getByText("Scan for repositories to get started."),
    ).toHaveClass("opacity-0");
    expect(
      screen.getByText("Select a repository from the scanned list"),
    ).toHaveClass("opacity-100");
  });

  it("shows neither prompt once a repository is active", () => {
    useSelectedRepoStore.setState({
      repo: { path: "/repos/git-grove", name: "git-grove" } as RepoEntry,
    });

    render(<WelcomeScreen reposScanned={true} />);

    expect(
      screen.getByText("Scan for repositories to get started."),
    ).toHaveClass("opacity-0");
    expect(
      screen.getByText("Select a repository from the scanned list"),
    ).toHaveClass("opacity-0");
  });
});
