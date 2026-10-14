import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SkillRadar } from "@/components/charts/skill-radar";

describe("SkillRadar", () => {
  it("renders track labels from the data prop", () => {
    render(
      <SkillRadar
        data={[
          { track: "SQL Injection", value: 2 },
          { track: "XSS", value: 1 },
          { track: "Crypto", value: 0 },
        ]}
        max={3}
      />,
    );
    expect(screen.getByTestId("skill-radar")).toBeInTheDocument();
    expect(screen.getByText("SQL Injection")).toBeInTheDocument();
    expect(screen.getByText("XSS")).toBeInTheDocument();
    expect(screen.getByText("Crypto")).toBeInTheDocument();
  });

  it("summarises values for screen readers", () => {
    render(
      <SkillRadar
        data={[
          { track: "SQL Injection", value: 2 },
          { track: "XSS", value: 1 },
        ]}
        max={4}
      />,
    );
    expect(screen.getByText("SQL Injection 2 of 4, XSS 1 of 4")).toBeInTheDocument();
  });

  it("draws one dot per track", () => {
    render(
      <SkillRadar
        data={[
          { track: "SQL Injection", value: 1 },
          { track: "XSS", value: 2 },
          { track: "Crypto", value: 3 },
        ]}
        max={3}
      />,
    );
    expect(screen.getAllByTestId("skill-radar-point")).toHaveLength(3);
  });

  it("keeps the legacy points prop working", () => {
    render(
      <SkillRadar
        points={[
          { label: "Web", value: 2, max: 5 },
          { label: "Crypto", value: 1, max: 5 },
          { label: "Forensics", value: 0, max: 5 },
        ]}
      />,
    );
    expect(screen.getByText("Web")).toBeInTheDocument();
    expect(screen.getByText("Web 2 of 5, Crypto 1 of 5, Forensics 0 of 5")).toBeInTheDocument();
  });

  it("handles empty data without crashing", () => {
    render(<SkillRadar data={[]} max={1} />);
    expect(screen.getByText("No skill data yet.")).toBeInTheDocument();
  });

  it("handles a non-positive max without crashing", () => {
    render(
      <SkillRadar
        data={[
          { track: "SQL Injection", value: 1 },
          { track: "XSS", value: 1 },
          { track: "Crypto", value: 1 },
        ]}
        max={0}
      />,
    );
    expect(screen.getByTestId("skill-radar")).toBeInTheDocument();
    expect(
      screen.getByText("SQL Injection 1 of 0, XSS 1 of 0, Crypto 1 of 0"),
    ).toBeInTheDocument();
  });
});
