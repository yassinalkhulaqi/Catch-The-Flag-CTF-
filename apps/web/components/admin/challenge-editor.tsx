"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { DetailsStep } from "@/components/admin/challenge-editor/details-step";
import { FilesStep } from "@/components/admin/challenge-editor/files-step";
import { FlagStep } from "@/components/admin/challenge-editor/flag-step";
import { HintsStep } from "@/components/admin/challenge-editor/hints-step";
import { PublishStep } from "@/components/admin/challenge-editor/publish-step";
import { ScenarioStep } from "@/components/admin/challenge-editor/scenario-step";
import { StepNav, stepAvailable, type EditorStep } from "@/components/admin/challenge-editor/step-nav";
import { api } from "@/lib/api/client";
import { uploadFormData } from "@/lib/admin/upload";
import { challengeBasicsSchema } from "@/lib/admin/schemas";
import { errorMessage } from "@/lib/errors";
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
  const [step, setStep] = useState<EditorStep>("details");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [title, setTitle] = useState(challenge?.title ?? "");
  const [slug, setSlug] = useState(challenge?.slug ?? "");
  const [description, setDescription] = useState(challenge?.description ?? "");
  const [scenario, setScenario] = useState(challenge?.scenario ?? "");
  const [categoryId, setCategoryId] = useState(String(challenge?.category.id ?? categories[0]?.id ?? ""));
  const [difficulty, setDifficulty] = useState<Difficulty>(challenge?.difficulty ?? "beginner");
  const [points, setPoints] = useState(String(challenge?.points ?? 100));
  const [tagIds, setTagIds] = useState<number[]>(challenge?.tags.map((tag) => tag.id) ?? []);
  const [files, setFiles] = useState<ChallengeFile[]>(challenge?.files ?? []);
  const [hints, setHints] = useState<ChallengeHint[]>(initialHints);
  const [flags, setFlags] = useState<ChallengeFlagMeta[]>(initialFlags);
  const [hintContent, setHintContent] = useState("");
  const [hintCost, setHintCost] = useState("10");
  const [flagValue, setFlagValue] = useState("");
  const [flagLabel, setFlagLabel] = useState("primary");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  function selectStep(next: EditorStep) {
    if (stepAvailable(next, isEdit)) setStep(next);
  }

  function saveBasics() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const parsed = challengeBasicsSchema.safeParse({
          title,
          slug: slug || slugify(title),
          description,
          scenario: scenario.trim() ? scenario : null,
          category_id: Number(categoryId),
          difficulty,
          points: Number(points),
          tag_ids: tagIds,
        });
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? "Check the challenge fields.");
          return;
        }
        const body = parsed.data;
        if (isEdit && challenge) {
          await api.put(`/admin/challenges/${challenge.id}`, body);
          setMessage("Challenge saved.");
          router.refresh();
        } else {
          const res = await api.post<{ data: ChallengeSummary }>("/admin/challenges", body);
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
    setUploadProgress(0);
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const payload = (await uploadFormData(
          `/admin/challenges/${challenge.id}/files`,
          fd,
          setUploadProgress,
        )) as { data: ChallengeFile };
        setFiles((prev) => [...prev, payload.data]);
        setMessage(`Uploaded ${payload.data.original_name}. The server chose the storage key.`);
      } catch (err) {
        setError(errorMessage(err, "Upload failed."));
      } finally {
        setUploadProgress(null);
      }
    });
  }

  function deleteFile(fileId: number) {
    if (!challenge) return;
    startTransition(async () => {
      try {
        await api.delete(`/admin/challenges/${challenge.id}/files/${fileId}`);
        setFiles((prev) => prev.filter((file) => file.id !== fileId));
      } catch (err) {
        setError(errorMessage(err));
      }
    });
  }

  function addHint() {
    if (!challenge || !hintContent.trim()) return;
    startTransition(async () => {
      try {
        const res = await api.post<{ data: ChallengeHint }>(`/admin/challenges/${challenge.id}/hints`, {
          content: hintContent,
          cost_points: Number(hintCost) || 0,
        });
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
        setHints((prev) => prev.filter((hint) => hint.id !== hintId));
      } catch (err) {
        setError(errorMessage(err));
      }
    });
  }

  function setFlag() {
    if (!challenge || !flagValue.trim()) return;
    startTransition(async () => {
      try {
        const res = await api.post<{ data: ChallengeFlagMeta }>(`/admin/challenges/${challenge.id}/flags`, {
          value: flagValue,
          label: flagLabel || null,
          case_sensitive: true,
          is_active: true,
        });
        setFlags((prev) => [...prev, res.data]);
        setFlagValue("");
        setMessage("Flag saved. The value is write-only and will not be shown again.");
      } catch (err) {
        setError(errorMessage(err));
      }
    });
  }

  return (
    <div className="space-y-8">
      <StepNav current={step} isEdit={isEdit} onSelect={selectStep} />
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

      {step === "details" ? (
        <DetailsStep
          id={id}
          title={title}
          slug={slug}
          categoryId={categoryId}
          difficulty={difficulty}
          points={points}
          tagIds={tagIds}
          categories={categories}
          tags={tags}
          isEdit={isEdit}
          pending={pending}
          onTitle={(value, shouldSlug) => {
            setTitle(value);
            if (shouldSlug) setSlug(slugify(value));
          }}
          onSlug={setSlug}
          onCategory={setCategoryId}
          onDifficulty={setDifficulty}
          onPoints={setPoints}
          onToggleTag={(tagId, checked) => {
            setTagIds((prev) => (checked ? [...prev, tagId] : prev.filter((item) => item !== tagId)));
          }}
          onSave={saveBasics}
          onNext={() => selectStep("scenario")}
        />
      ) : null}

      {step === "scenario" ? (
        <ScenarioStep
          id={id}
          scenario={scenario}
          description={description}
          isEdit={isEdit}
          pending={pending}
          onScenario={setScenario}
          onDescription={setDescription}
          onSave={saveBasics}
        />
      ) : null}

      {step === "files" && isEdit ? (
        <FilesStep
          id={id}
          files={files}
          pending={pending}
          progress={uploadProgress}
          onUpload={uploadFile}
          onDelete={deleteFile}
        />
      ) : null}

      {step === "hints" && isEdit ? (
        <HintsStep
          id={id}
          hints={hints}
          content={hintContent}
          cost={hintCost}
          pending={pending}
          onContent={setHintContent}
          onCost={setHintCost}
          onAdd={addHint}
          onDelete={deleteHint}
        />
      ) : null}

      {step === "flag" && isEdit ? (
        <FlagStep
          id={id}
          flags={flags}
          value={flagValue}
          label={flagLabel}
          pending={pending}
          onValue={setFlagValue}
          onLabel={setFlagLabel}
          onSave={setFlag}
        />
      ) : null}

      {step === "publish" && isEdit ? (
        <PublishStep
          id={id}
          title={title}
          scenario={scenario}
          description={description}
          status={challenge?.status}
          hasActiveFlag={flags.some((flag) => flag.is_active)}
          pending={pending}
          onAction={publishAction}
        />
      ) : null}
    </div>
  );
}
