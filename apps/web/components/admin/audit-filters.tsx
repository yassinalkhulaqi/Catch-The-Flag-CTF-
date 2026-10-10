"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

/** Server filters the API supports: actor id, exact action, auditable type. */
export function AuditFilters({
  actor,
  action,
  entity,
}: {
  actor?: string;
  action?: string;
  entity?: string;
}) {
  const router = useRouter();

  return (
    <form
      className="mb-6 grid gap-3 border border-border bg-surface p-4 sm:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const next = new URLSearchParams();
        for (const key of ["actor", "action", "entity"]) {
          const value = String(data.get(key) ?? "").trim();
          if (value) next.set(key, value);
        }
        router.push(next.toString() ? `/admin/audit-logs?${next}` : "/admin/audit-logs");
      }}
    >
      <Field label="Actor id" htmlFor="audit-actor" hint="Numeric user id. The API matches actor_id.">
        <Input id="audit-actor" name="actor" defaultValue={actor ?? ""} inputMode="numeric" />
      </Field>
      <Field label="Action" htmlFor="audit-action" hint="Exact action name, such as challenge.publish.">
        <Input id="audit-action" name="action" defaultValue={action ?? ""} />
      </Field>
      <Field label="Entity type" htmlFor="audit-entity" hint="auditable_type stored by the API.">
        <Input id="audit-entity" name="entity" defaultValue={entity ?? ""} />
      </Field>
      <div className="flex items-end gap-2">
        <Button type="submit">Apply</Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/audit-logs")}>
          Clear
        </Button>
      </div>
      <p className="text-xs text-muted sm:col-span-4">
        Date filtering is described in the API notes but the current endpoint does not apply it, so this screen does not offer a date control.
      </p>
    </form>
  );
}
