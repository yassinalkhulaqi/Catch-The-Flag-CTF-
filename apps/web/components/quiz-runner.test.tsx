import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act as reactAct } from "react";

const { postMock, getMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
  getMock: vi.fn(),
}));

vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/client")>();
  return { ...actual, api: { ...actual.api, post: postMock, get: getMock } };
});

import { QuizRunner } from "./quiz-runner";
import type { Quiz } from "@/lib/types";

const QUIZ: Quiz = {
  id: 1,
  title: "Basics",
  description: "First quiz",
  pass_score: 70,
  questions: [
    {
      id: 11,
      question: "What does CIA stand for?",
      type: "single",
      points: 10,
      position: 1,
      options: [
        { id: 101, option_text: "Confidentiality, Integrity, Availability" },
        { id: 102, option_text: "Central Intelligence Agency" },
      ],
    },
    {
      id: 12,
      question: "Select symmetric ciphers.",
      type: "multiple",
      points: 10,
      position: 2,
      options: [
        { id: 201, option_text: "AES" },
        { id: 202, option_text: "RSA" },
      ],
    },
  ],
};

describe("QuizRunner", () => {
  beforeEach(() => {
    postMock.mockReset();
    getMock.mockReset();
  });

  // Flush React's async passive-effects callback before jsdom teardown,
  // otherwise it fires after globals are gone ("window is not defined").
  afterEach(async () => {
    cleanup();
    await reactAct(async () => {});
  });

  it("runs the answer flow and shows the score summary", async () => {
    postMock.mockImplementation((path: string) => {
      if (path === "/quizzes/1/attempts")
        return Promise.resolve({ data: { attempt: { id: 7 } } });
      if (path === "/quiz-attempts/7/answer")
        return Promise.resolve({ data: { saved: true } });
      if (path === "/quiz-attempts/7/submit")
        return Promise.resolve({
          data: {
            id: 7,
            score: 50,
            passed: false,
            correct_count: 1,
            total: 2,
          },
        });
      return Promise.reject(new Error(`unexpected POST ${path}`));
    });
    getMock.mockResolvedValue({
      data: {
        attempt: {
          id: 7,
          score: 50,
          passed: false,
          correct_count: 1,
          total: 2,
        },
        questions: [
          {
            id: 11,
            question: "What does CIA stand for?",
            type: "single",
            points: 10,
            position: 1,
            options: [],
            explanation: "The triad is Confidentiality, Integrity, Availability.",
            answered: { selected_option_ids: [101], is_correct: true },
          },
          {
            id: 12,
            question: "Select symmetric ciphers.",
            type: "multiple",
            points: 10,
            position: 2,
            options: [],
            explanation: "AES is symmetric; RSA is asymmetric.",
            answered: { selected_option_ids: [202], is_correct: false },
          },
        ],
      },
    });

    render(<QuizRunner quiz={QUIZ} />);

    fireEvent.click(screen.getByRole("button", { name: "Start attempt" }));
    expect(await screen.findByText("Question 1 of 2")).toBeInTheDocument();

    // Single-choice: radio inputs.
    fireEvent.click(
      screen.getByLabelText("Confidentiality, Integrity, Availability"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByText("Question 2 of 2")).toBeInTheDocument();
    expect(postMock).toHaveBeenCalledWith("/quiz-attempts/7/answer", {
      question_id: 11,
      selected_option_ids: [101],
    });

    // Multiple-choice: checkbox inputs.
    fireEvent.click(screen.getByLabelText("AES"));
    fireEvent.click(screen.getByRole("button", { name: "Submit quiz" }));

    expect(await screen.findByText("Score: 50")).toBeInTheDocument();
    expect(screen.getByText("Not passed")).toBeInTheDocument();
    expect(screen.getByText(/1 of 2 correct/)).toBeInTheDocument();
    expect(postMock).toHaveBeenCalledWith("/quiz-attempts/7/answer", {
      question_id: 12,
      selected_option_ids: [201],
    });
    expect(postMock).toHaveBeenCalledWith("/quiz-attempts/7/submit", undefined);
    // Explanations from the attempt detail.
    expect(
      screen.getByText("The triad is Confidentiality, Integrity, Availability."),
    ).toBeInTheDocument();
    // Failed attempts offer a retry.
    expect(
      screen.getByRole("button", { name: "Retry quiz" }),
    ).toBeInTheDocument();
  });

  it("shows a passed badge and no retry when the attempt passes", async () => {
    postMock.mockImplementation((path: string) => {
      if (path === "/quizzes/1/attempts")
        return Promise.resolve({ data: { attempt: { id: 9 } } });
      if (path === "/quiz-attempts/9/answer")
        return Promise.resolve({ data: { saved: true } });
      if (path === "/quiz-attempts/9/submit")
        return Promise.resolve({
          data: { id: 9, score: 100, passed: true, correct_count: 2, total: 2 },
        });
      return Promise.reject(new Error(`unexpected POST ${path}`));
    });
    getMock.mockResolvedValue({
      data: {
        attempt: { id: 9, score: 100, passed: true, correct_count: 2, total: 2 },
        questions: [],
      },
    });

    render(<QuizRunner quiz={QUIZ} />);
    fireEvent.click(screen.getByRole("button", { name: "Start attempt" }));
    expect(await screen.findByText("Question 1 of 2")).toBeInTheDocument();

    fireEvent.click(
      screen.getByLabelText("Confidentiality, Integrity, Availability"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByText("Question 2 of 2")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("AES"));
    fireEvent.click(screen.getByRole("button", { name: "Submit quiz" }));

    expect(await screen.findByText("Score: 100")).toBeInTheDocument();
    expect(screen.getByText("Passed")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Retry quiz" }),
    ).not.toBeInTheDocument();
  });

  it("shows an inline error when starting the attempt fails", async () => {
    postMock.mockResolvedValueOnce(null);
    render(<QuizRunner quiz={QUIZ} />);

    fireEvent.click(screen.getByRole("button", { name: "Start attempt" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    // Still on the start screen — no question progress.
    expect(screen.queryByText(/Question 1 of/)).not.toBeInTheDocument();
  });

  it("renders an empty state when the quiz has no questions", () => {
    render(<QuizRunner quiz={{ ...QUIZ, questions: [] }} />);
    expect(screen.getByText("No questions yet")).toBeInTheDocument();
  });
});
