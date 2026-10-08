import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { difficultyLabel, DIFFICULTIES } from "@/lib/format";
import type { Category, Difficulty, Tag } from "@/lib/types";
import { fieldControlClass } from "@/components/admin/challenge-editor/step-nav";

export function DetailsStep({
  id,
  title,
  slug,
  categoryId,
  difficulty,
  points,
  tagIds,
  categories,
  tags,
  isEdit,
  pending,
  onTitle,
  onSlug,
  onCategory,
  onDifficulty,
  onPoints,
  onToggleTag,
  onSave,
  onNext,
}: {
  id: string;
  title: string;
  slug: string;
  categoryId: string;
  difficulty: Difficulty;
  points: string;
  tagIds: number[];
  categories: Category[];
  tags: Tag[];
  isEdit: boolean;
  pending: boolean;
  onTitle: (value: string, slugify: boolean) => void;
  onSlug: (value: string) => void;
  onCategory: (value: string) => void;
  onDifficulty: (value: Difficulty) => void;
  onPoints: (value: string) => void;
  onToggleTag: (tagId: number, checked: boolean) => void;
  onSave: () => void;
  onNext: () => void;
}) {
  const selected = new Set(tagIds);

  return (
    <section className="space-y-4" aria-labelledby={`${id}-details`}>
      <h2 id={`${id}-details`} className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
        Details
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title" htmlFor={`${id}-title`}>
          <Input
            id={`${id}-title`}
            value={title}
            onChange={(e) => onTitle(e.target.value, !isEdit)}
            required
          />
        </Field>
        <Field label="Slug" htmlFor={`${id}-slug`}>
          <Input id={`${id}-slug`} value={slug} onChange={(e) => onSlug(e.target.value)} required />
        </Field>
        <Field label="Category" htmlFor={`${id}-category`}>
          <select
            id={`${id}-category`}
            className={fieldControlClass}
            value={categoryId}
            onChange={(e) => onCategory(e.target.value)}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Difficulty" htmlFor={`${id}-difficulty`}>
          <select
            id={`${id}-difficulty`}
            className={fieldControlClass}
            value={difficulty}
            onChange={(e) => onDifficulty(e.target.value as Difficulty)}
          >
            {DIFFICULTIES.map((item) => (
              <option key={item} value={item}>
                {difficultyLabel(item)}
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
            onChange={(e) => onPoints(e.target.value)}
          />
        </Field>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Tags</legend>
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <label key={tag.id} className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={selected.has(tag.id)}
                onChange={(e) => onToggleTag(tag.id, e.target.checked)}
              />
              {tag.name}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap gap-2">
        {isEdit ? (
          <Button type="button" onClick={onSave} disabled={pending}>
            {pending ? "Saving…" : "Save details"}
          </Button>
        ) : null}
        <Button type="button" variant={isEdit ? "outline" : "primary"} onClick={onNext}>
          Next: scenario
        </Button>
      </div>
    </section>
  );
}
