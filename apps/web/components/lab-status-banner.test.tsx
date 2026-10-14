import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LabStatusBanner } from "@/components/lab-status-banner";

describe("LabStatusBanner", () => {
  it("renders the unsolved state", () => {
    render(<LabStatusBanner solved={false} points={100} />);

    const banner = screen.getByRole("status");
    expect(banner).toHaveAttribute("aria-live", "polite");
    expect(screen.getByTestId("lab-status-text")).toHaveTextContent("[ NOT SOLVED ]");
    expect(screen.getByTestId("lab-status-points")).toHaveTextContent("100 pts");
    expect(screen.getByTestId("lab-status-text")).not.toHaveTextContent("[ SOLVED ]");
  });

  it("renders the solved state", () => {
    render(<LabStatusBanner solved points={250} />);

    const banner = screen.getByRole("status");
    expect(banner).toHaveAttribute("aria-live", "polite");
    expect(screen.getByTestId("lab-status-text")).toHaveTextContent("[ SOLVED ]");
    expect(screen.getByTestId("lab-status-points")).toHaveTextContent("250 pts");
  });
});
