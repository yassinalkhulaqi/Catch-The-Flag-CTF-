import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TierPill } from "@/components/tier-pill";

describe("TierPill", () => {
  it("renders the Apprentice label", () => {
    render(<TierPill tier="apprentice" />);
    expect(screen.getByTestId("tier-pill")).toHaveTextContent("Apprentice");
  });

  it("renders the Practitioner label", () => {
    render(<TierPill tier="practitioner" />);
    expect(screen.getByTestId("tier-pill")).toHaveTextContent("Practitioner");
  });

  it("renders the Expert label", () => {
    render(<TierPill tier="expert" />);
    expect(screen.getByTestId("tier-pill")).toHaveTextContent("Expert");
  });
});
