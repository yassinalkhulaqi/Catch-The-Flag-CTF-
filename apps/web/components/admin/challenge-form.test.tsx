import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act as reactAct } from "react";

const { createMock, updateMock, pushMock, refreshMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  updateMock: vi.fn(),
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("@/lib/api/admin", () => ({
  ADMIN_DIFFICULTIES: ["beginner", "intermediate", "advanced", "expert"],
  createAdminChallenge: createMock,
  updateAdminChallenge: updateMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

import { ChallengeForm } from "./challenge-form";

const CATEGORIES = [{ id: 3, name: "DFIR", slug: "dfir" }];

function fillValid() {
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Memory Forensics 101" },
  });
  fireEvent.change(screen.getByLabelText("Slug"), {
    target: { value: "memory-forensics-101" },
  });
  fireEvent.change(screen.getByLabelText("Description"), {
    target: { value: "Analyse the memory dump and recover the flag." },
  });
  fireEvent.change(screen.getByLabelText("Category"), {
    target: { value: "3" },
  });
  fireEvent.change(screen.getByLabelText("Points"), {
    target: { value: "150" },
  });
}

describe("ChallengeForm", () => {
  beforeEach(() => {
    createMock.mockReset();
    updateMock.mockReset();
    pushMock.mockClear();
    refreshMock.mockClear();
  });

  afterEach(async () => {
    cleanup();
    await reactAct(async () => {});
  });

  it("blocks submit with validation errors and calls no API", async () => {
    render(<ChallengeForm mode="create" categories={CATEGORIES} />);

    fireEvent.click(screen.getByRole("button", { name: "Create challenge" }));

    const alerts = await screen.findAllByRole("alert");
    const text = alerts.map((a) => a.textContent).join(" ");
    expect(text).toMatch(/title is required/i);
    expect(text).toMatch(/slug is required/i);
    expect(text).toMatch(/description is required/i);
    expect(text).toMatch(/choose a category/i);
    expect(text).toMatch(/points must be a whole number/i);
    expect(createMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("rejects malformed slugs without calling the API", async () => {
    render(<ChallengeForm mode="create" categories={CATEGORIES} />);
    fillValid();
    fireEvent.change(screen.getByLabelText("Slug"), {
      target: { value: "Bad Slug!!" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create challenge" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /lowercase letters, numbers and hyphens/i,
    );
    expect(createMock).not.toHaveBeenCalled();
  });

  it("creates with valid input and navigates to the wizard editor", async () => {
    createMock.mockResolvedValueOnce({
      ok: true,
      data: {
        id: 9,
        title: "Memory Forensics 101",
        slug: "memory-forensics-101",
        status: "draft",
        points: 150,
        difficulty: "beginner",
      },
    });
    render(<ChallengeForm mode="create" categories={CATEGORIES} />);
    fillValid();

    fireEvent.click(screen.getByRole("button", { name: "Create challenge" }));

    expect(await screen.findByRole("button", { name: "Saving…" })).toBeInTheDocument();
    expect(createMock).toHaveBeenCalledWith({
      title: "Memory Forensics 101",
      slug: "memory-forensics-101",
      description: "Analyse the memory dump and recover the flag.",
      scenario: null,
      category_id: 3,
      difficulty: "beginner",
      points: 150,
    });
    await vi.waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/admin/challenges/9/edit");
    });
  });

  it("surfaces server-side field errors in an alert region", async () => {
    createMock.mockResolvedValueOnce({
      ok: false,
      message: "The given data was invalid.",
      fields: { slug: ["Slug has already been taken."] },
    });
    render(<ChallengeForm mode="create" categories={CATEGORIES} />);
    fillValid();

    fireEvent.click(screen.getByRole("button", { name: "Create challenge" }));

    const alerts = await screen.findAllByRole("alert");
    const text = alerts.map((a) => a.textContent).join(" ");
    expect(text).toMatch(/the given data was invalid/i);
    expect(text).toMatch(/slug has already been taken/i);
    expect(pushMock).not.toHaveBeenCalled();
  });
});
