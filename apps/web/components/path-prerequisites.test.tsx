import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PathPrerequisites } from "@/components/path-prerequisites";

describe("PathPrerequisites", () => {
  it("renders nothing when a path has no requirements", () => {
    const { container } = render(<PathPrerequisites items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("links each required path and marks completion", () => {
    render(
      <PathPrerequisites
        items={[
          { id: 1, title: "Intro to SOC", slug: "intro-soc", completed: true },
          { id: 2, title: "SOC Cases", slug: "soc-cases", completed: false },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Intro to SOC" })).toHaveAttribute("href", "/paths/intro-soc");
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Required")).toBeInTheDocument();
  });
});
