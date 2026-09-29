"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import { DIFFICULTIES, difficultyLabel } from "@/lib/format";
import type {
  Category,
  ChallengeDetail,
  ChallengeFile,
  ChallengeFlagMeta,
  ChallengeHint,
  ChallengeSummary,
  Difficulty,
  Tag,
} from "@/lib/types";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 160);
}

export function ChallengeEditor({
  categories,
  tags,
  challenge,
  initialHints = [],
  initialFlags = [],
}: {
  categories: Category[];
  tags: Tag[];
  challenge?: ChallengeDetail;
  initialHints?: ChallengeHint[];
  initialFlags?: ChallengeFlagMeta[];
}) {
  const id = useId();
  const router = useRouter();
  const isEdit = !!challenge;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [title, setTitle] = useState(challenge?.title ?? "");
  const [slug, setSlug] = useState(challenge?.slug ?? "");
  const [description, setDescription] = useState(challenge?.description ?? "");
  const [scenario, setScenario] = useState(challenge?.scenario ?? "");
  const [categoryId, setCategoryId] = useState(
    String(challenge?.category.id ?? categories[0]?.id ?? ""),
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(
    challenge?.difficulty ?? "beginner",
  );
  const [points, setPoints] = useState(String(challenge?.points ?? 100));
  const [tagIds, setTagIds] = useState<number[]>(
    challenge?.tags.map((t) => t.id) ?? [],
  );
  const [files, setFiles] = useState<ChallengeFile[]>(challenge?.files ?? []);
  const [hints, setHints] = useState<ChallengeHint[]>(initialHints);
  const [flags, setFlags] = useState<ChallengeFlagMeta[]>(initialFlags);
  const [hintContent, setHintContent] = useState("");
  const [hintCost, setHintCost] = useState("10");
  const [flagValue, setFlagValue] = useState("");
  const [flagLabel, setFlagLabel] = useState("primary");

  const status = challenge?.status;

  const selectedTagSet = useMemo(() => new Set(tagIds), [tagIds]);

  function saveBasics() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const body = {
          title,
          slug: slug || slugify(title),
          description,
          scenario: scenario || null,
          category_id: Number(categoryId),
          difficulty,
          points: Number(points),
          tag_ids: tagIds,
        };
        if (isEdit && challenge) {
          await api.put(`/admin/challenges/${challenge.id}`, body);
          setMessage("Challenge saved.");
          router.refresh();
        } else {
          const res = await api.post<{ data: ChallengeSummary }>(
            "/admin/challenges",
            body,
          );
          router.push(`/admin/challenges/${res.data.id}/edit`);
          router.refresh();
        }
      } catch (err) {
        setError(errorMessage(err));
      }
    });
  }

  function publishAction(action: "publish" | "unpublish" | "review" | "archive") {
    if (!challenge) return;
    setError(null);
    startTransition(async () => {
      try {
        await api.post(`/admin/challenges/${challenge.id}/${action}`);
        setMessage(`Challenge ${action}ed.`);
        router.refresh();
      } catch (err) {
        setError(errorMessage(err));
      }
    });
  }

  function uploadFile(file: File) {
    if (!challenge) return;
    setError(null);
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await api.post<{ data: ChallengeFile }>(
          `/admin/challenges/${challenge.id}/files`,
          fd,
        );
        setFiles((prev) => [...prev, res.data]);
        setMessage(`Uploaded ${res.data.original_name}.`);
      } catch (err) {
        setError(errorMessage(err));
      }
    });
  }

  function deleteFile(fileId: number) {
    if (!challenge) return;
    startTransition(async () => {
      try {
        await api.delete(`/admin/challenges/${challenge.id}/files/${fileId}`);
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      } catch (err) {
        setError(errorMessage(err));
      }
    });
  }

  function addHint() {
    if (!challenge || !hintContent.trim()) return;
    startTransition(async () => {
      try {
        const res = await api.post<{ data: ChallengeHint }>(
          `/admin/challenges/${challenge.id}/hints`,
          { content: hintContent, cost_points: Number(hintCost) || 0 },
        );
        setHints((prev) => [...prev, { ...res.data, unlocked: true }]);
        setHintContent("");
      } catch (err) {
        setError(errorMessage(err));
      }
    });
  }

  function deleteHint(hintId: number) {
    if (!challenge) return;
    startTransition(async () => {
      try {
        await api.delete(`/admin/challenges/${challenge.id}/hints/${hintId}`);
        setHints((prev) => prev.filter((h) => h.id !== hintId));
      } catch (err) {
        setError(errorMessage(err));
      }
    });
  }

  function setFlag() {
    if (!challenge || !flagValue.trim()) return;
    startTransition(async () => {
      try {
        const res = await api.post<{ data: ChallengeFlagMeta }>(
          `/admin/challenges/${challenge.id}/flags`,
          { value: flagValue, label: flagLabel || null, case_sensitive: true, is_active: true },
        );
        setFlags((prev) => [...prev, res.data]);
        setFlagValue("");
        setMessage("Flag saved (value is write-only and will not be shown again).");
      } catch (err) {
        setError(errorMessage(err));
      }
    });
  }

  return (
    <div className="space-y-10">
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="text-sm text-success">
          {message}
        </p>
      ) : null}

      <section className="space-y-4" aria-labelledby={`${id}-basics`}>
        <h2 id={`${id}-basics`} className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
          Challenge details
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title" htmlFor={`${id}-title`}>
            <Input
              id={`${id}-title`}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!isEdit) setSlug(slugify(e.target.value));
              }}
              required
            />
          </Field>
          <Field label="Slug" htmlFor={`${id}-slug`}>
            <Input
              id={`${id}-slug`}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </Field>
          <Field label="Category" htmlFor={`${id}-category`}>
            <select
              id={`${id}-category`}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Difficulty" htmlFor={`${id}-difficulty`}>
            <select
              id={`${id}-difficulty`}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {difficultyLabel(d)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Points" htmlFor={`${id}-points`}>
            <Input
              id={`${id}-points`}
              type="number"
              min={1}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Scenario" htmlFor={`${id}-scenario`}>
          <Textarea
            id={`${id}-scenario`}
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
          />
        </Field>
        <Field label="Description (Markdown)" htmlFor={`${id}-description`}>
          <Textarea
            id={`${id}-description`}
            className="min-h-40"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </Field>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Tags</legend>
          <div className="flex flex-wrap gap-3">
            {tags.map((t) => (
              <label key={t.id} className="flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={selectedTagSet.has(t.id)}
                  onChange={(e) => {
                    setTagIds((prev) =>
                      e.target.checked
                        ? [...prev, t.id]
                        : prev.filter((x) => x !== t.id),
                    );
                  }}
                />
                {t.name}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={saveBasics} disabled={pending}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create challenge"}
          </Button>
          {isEdit && challenge ? (
            <>
              {status !== "published" ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => publishAction("publish")}
                >
                  Publish
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => publishAction("unpublish")}
                >
                  Unpublish
                </Button>
              )}
              {status === "draft" ? (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => publishAction("review")}
                >
                  Submit for review
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      </section>

      {isEdit && challenge ? (
        <>
          <section className="space-y-3" aria-labelledby={`${id}-files`}>
            <h2 id={`${id}-files`} className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
              Files
            </h2>
            <input
              type="file"
              aria-label="Upload challenge file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadFile(file);
                e.target.value = "";
              }}
            />
            <ul className="divide-y divide-border border border-border">
              {files.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="font-mono">{f.original_name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteFile(f.id)}
                    disabled={pending}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3" aria-labelledby={`${id}-hints`}>
            <h2 id={`${id}-hints`} className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
              Hints
            </h2>
            <div className="grid gap-3 md:grid-cols-[1fr_120px_auto]">
              <Input
                placeholder="Hint content"
                value={hintContent}
                onChange={(e) => setHintContent(e.target.value)}
                aria-label="Hint content"
              />
              <Input
                type="number"
                min={0}
                value={hintCost}
                onChange={(e) => setHintCost(e.target.value)}
                aria-label="Hint cost"
              />
              <Button type="button" onClick={addHint} disabled={pending}>
                Add hint
              </Button>
            </div>
            <ul className="space-y-2">
              {hints.map((h) => (
                <li key={h.id} className="flex items-start justify-between gap-3 border border-border p-3 text-sm">
                  <div>
                    <p className="font-mono text-xs text-faint">
                      #{h.position} · −{h.cost_points} pts
                    </p>
                    <p className="mt-1">{h.content}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteHint(h.id)}
                    disabled={pending}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3" aria-labelledby={`${id}-flag`}>
            <h2 id={`${id}-flag`} className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
              Flag (write-only)
            </h2>
            <p className="text-sm text-muted">
              Flag values are never returned by the API after save. Replace by setting a new value.
            </p>
            <div className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
              <Input
                type="password"
                autoComplete="off"
                placeholder="flag{…}"
                value={flagValue}
                onChange={(e) => setFlagValue(e.target.value)}
                aria-label="Flag value"
              />
              <Input
                placeholder="Label"
                value={flagLabel}
                onChange={(e) => setFlagLabel(e.target.value)}
                aria-label="Flag label"
              />
              <Button type="button" onClick={setFlag} disabled={pending}>
                Set flag
              </Button>
            </div>
            <ul className="divide-y divide-border border border-border text-sm">
              {flags.map((f) => (
                <li key={f.id} className="flex justify-between px-3 py-2">
                  <span>
                    {f.label || "unnamed"} · {f.is_active ? "active" : "inactive"}
                  </span>
                  <span className="font-mono text-xs text-faint">
                    {f.case_sensitive ? "case-sensitive" : "case-insensitive"}
                  </span>
                </li>
              ))}
              {flags.length === 0 ? (
                <li className="px-3 py-2 text-muted">No flag configured yet.</li>
              ) : null}
            </ul>
          </section>
        </>
      ) : (
        <p className="text-sm text-muted">
          Save the challenge first to upload files, add hints, and set the flag.
        </p>
      )}
    </div>
  );
}
