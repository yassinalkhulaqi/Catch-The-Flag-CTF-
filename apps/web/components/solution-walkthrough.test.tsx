import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SolutionWalkthrough } from "@/components/solution-walkthrough";

const WALKTHROUGH = "# Solve\n\nUse `strings` on the artifact, then submit `flag{demo}`.";

describe("SolutionWalkthrough", () => {
  it("gates the walkthrough behind an inline spoiler confirm", async () => {
    const user = userEvent.setup();
    render(<SolutionWalkthrough walkthrough={WALKTHROUGH} />);

    // Hidden phase: only the reveal button, no walkthrough content.
    expect(screen.getByTestId("solution-walkthrough-reveal")).toBeInTheDocument();
    expect(screen.queryByTestId("solution-walkthrough-content")).not.toBeInTheDocument();

    // Reveal -> inline confirm (not window.confirm), blurred preview present.
    await user.click(screen.getByTestId("solution-walkthrough-reveal"));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByTestId("solution-walkthrough-confirm")).toBeInTheDocument();
    expect(screen.getByTestId("solution-walkthrough-preview")).toHaveClass("spoiler-blur");
    expect(screen.queryByTestId("solution-walkthrough-content")).not.toBeInTheDocument();

    // Confirm -> accordion with the walkthrough markdown.
    await user.click(screen.getByTestId("solution-walkthrough-confirm"));
    expect(screen.getByTestId("solution-walkthrough-content")).toBeInTheDocument();
    expect(screen.getByTestId("solution-walkthrough-content")).toHaveTextContent("flag{demo}");
    expect(screen.queryByTestId("solution-walkthrough-preview")).not.toBeInTheDocument();
  });

  it("cancels the reveal and keeps the walkthrough hidden", async () => {
    const user = userEvent.setup();
    render(<SolutionWalkthrough walkthrough={WALKTHROUGH} />);

    await user.click(screen.getByTestId("solution-walkthrough-reveal"));
    await user.click(screen.getByTestId("solution-walkthrough-cancel"));

    expect(screen.getByTestId("solution-walkthrough-reveal")).toBeInTheDocument();
    expect(screen.queryByTestId("solution-walkthrough-content")).not.toBeInTheDocument();
  });
});
