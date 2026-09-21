import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import StatCard from "./StatCard";

describe("StatCard", () => {
  it("renders the title, value, and icon", () => {
    render(
      <StatCard
        icon={<span data-testid="icon" />}
        title="Branches"
        value={7}
      />,
    );

    expect(screen.getByText("Branches")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("renders a string value as-is", () => {
    render(<StatCard icon={<span />} title="First Commit" value="2026-01-01" />);

    expect(screen.getByText("2026-01-01")).toBeInTheDocument();
  });
});
