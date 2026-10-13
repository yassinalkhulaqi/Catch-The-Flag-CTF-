"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useDictionary } from "@/lib/i18n";
import { interestStorageKey, recommendChallenge, tourStorageKey } from "@/lib/onboarding/recommend";
import type { Category, ChallengeSummary } from "@/lib/types";

export function OnboardingTour({
  userId,
  categories,
  challenges,
}: {
  userId: number;
  categories: Category[];
  challenges: ChallengeSummary[];
}) {
  const copy = useDictionary();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const seen = window.localStorage.getItem(tourStorageKey(userId));
      if (seen === "done" || seen === "skipped") return;
      const saved = window.localStorage.getItem(interestStorageKey(userId));
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as unknown;
          if (Array.isArray(parsed)) setInterests(parsed.filter((item) => typeof item === "string"));
        } catch {
          /* ignore a corrupt local preference */
        }
      }
      setOpen(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [userId]);

  function finish(status: "done" | "skipped") {
    window.localStorage.setItem(tourStorageKey(userId), status);
    window.localStorage.setItem(interestStorageKey(userId), JSON.stringify(interests));
    setOpen(false);
  }

  const recommendation = recommendChallenge(challenges, interests);
  const steps = 3;

  return (
    <Dialog
      open={open}
      onClose={() => finish("skipped")}
      title={copy.onboarding.title}
      description={step === 0 ? copy.onboarding.welcome : step === 1 ? copy.onboarding.interests : copy.onboarding.recommend}
    >
      {step === 1 ? (
        <fieldset className="mb-4">
          <legend className="sr-only">{copy.onboarding.interests}</legend>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const selected = interests.includes(category.slug);
              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={selected}
                  className={
                    selected
                      ? "rounded-full border border-accent bg-accent/15 px-3 py-1 text-sm text-accent"
                      : "rounded-full border border-border px-3 py-1 text-sm text-muted"
                  }
                  onClick={() =>
                    setInterests((current) =>
                      selected ? current.filter((slug) => slug !== category.slug) : [...current, category.slug],
                    )
                  }
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}
      {step === 2 ? (
        recommendation ? (
          <p className="mb-4 text-sm">
            <Link href={`/challenges/${recommendation.slug}`} className="font-semibold text-accent hover:underline">
              {recommendation.title}
            </Link>
            <span className="text-muted"> · {recommendation.category.name}</span>
          </p>
        ) : (
          <p className="mb-4 text-sm text-muted">{copy.onboarding.empty}</p>
        )
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="ghost" onClick={() => finish("skipped")}>
          {copy.onboarding.skip}
        </Button>
        <div className="flex gap-2">
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={() => setStep((value) => value - 1)}>
              {copy.onboarding.back}
            </Button>
          ) : null}
          {step < steps - 1 ? (
            <Button type="button" onClick={() => setStep((value) => value + 1)}>
              {copy.onboarding.next}
            </Button>
          ) : (
            <Button type="button" onClick={() => finish("done")}>
              {copy.onboarding.done}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
