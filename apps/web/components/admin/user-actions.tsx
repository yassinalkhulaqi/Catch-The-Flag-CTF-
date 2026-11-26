"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adjustXpSchema, banUserSchema } from "@/lib/admin/schemas";
import {
  adjustAdminUserXp,
  banAdminUser,
  setAdminUserRole,
  unbanAdminUser,
  type AdminUserRow,
} from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Form, FormError, FormSuccess, SelectField } from "@/components/ui/form";
import { Field, Input } from "@/components/ui/input";
import type { Role } from "@/lib/types";

type Panel = null | "ban" | "role" | "xp";

const ROLES: Role[] = ["user", "moderator", "admin"];
const roleOptions = ROLES.map((r) => ({ value: r, label: r }));

/** Per-row moderation island. Every mutation is audit-logged server-side. */
export function UserActions({ user }: { user: AdminUserRow }) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [role, setRole] = useState<Role>(user.role);
  const [banReason, setBanReason] = useState("");
  const [xpAmount, setXpAmount] = useState("");
  const [xpReason, setXpReason] = useState("");

  const banned = user.banned_at !== null;

  function toggle(next: Exclude<Panel, null>) {
    setPanel((cur) => (cur === next ? null : next));
    setMessage(null);
  }

  function done(ok: boolean, okText: string, errText: string) {
    if (ok) {
      setMessage({ tone: "ok", text: okText });
      setPanel(null);
      router.refresh();
    } else {
      setMessage({ tone: "err", text: errText });
    }
  }

  function onBan(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    const parsed = banUserSchema.safeParse({ reason: banReason });
    if (!parsed.success) {
      setMessage({ tone: "err", text: "A ban reason is required." });
      return;
    }
    setPending(true);
    setMessage(null);
    void banAdminUser(user.id, parsed.data.reason.trim()).then((result) => {
      setPending(false);
      done(result.ok, `${user.name} has been banned.`, result.ok ? "" : result.message);
    });
    setBanReason("");
  }

  async function onUnban() {
    if (pending) return;
    setPending(true);
    setMessage(null);
    const result = await unbanAdminUser(user.id);
    setPending(false);
    done(result.ok, `${user.name} has been unbanned.`, result.ok ? "" : result.message);
  }

  async function onRole() {
    if (pending) return;
    setPending(true);
    setMessage(null);
    const result = await setAdminUserRole(user.id, role);
    setPending(false);
    done(result.ok, `Role updated to ${role}.`, result.ok ? "" : result.message);
  }

  function onXp(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    const parsed = adjustXpSchema.safeParse({ amount: Number(xpAmount), reason: xpReason });
    if (!parsed.success) {
      setMessage({
        tone: "err",
        text: "Amount must be a non-zero whole number with a reason.",
      });
      return;
    }
    const amount = parsed.data.amount;
    setPending(true);
    setMessage(null);
    void adjustAdminUserXp(user.id, amount, parsed.data.reason.trim()).then((result) => {
      setPending(false);
      if (result.ok) {
        setMessage({ tone: "ok", text: `XP adjusted by ${amount > 0 ? `+${amount}` : amount}.` });
        setXpAmount("");
        setXpReason("");
        setPanel(null);
        router.refresh();
      } else {
        setMessage({ tone: "err", text: result.message });
      }
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {banned ? (
          <Button size="sm" variant="secondary" loading={pending} onClick={onUnban}>
            Unban user
          </Button>
        ) : (
          <Button size="sm" variant="danger" disabled={pending} onClick={() => toggle("ban")} aria-expanded={panel === "ban"}>
            Ban user
          </Button>
        )}
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => toggle("role")} aria-expanded={panel === "role"}>
          Change role
        </Button>
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => toggle("xp")} aria-expanded={panel === "xp"}>
          Adjust XP
        </Button>
      </div>

      {message ? (
        message.tone === "err" ? (
          <FormError className="mt-2 text-xs">{message.text}</FormError>
        ) : (
          <FormSuccess className="mt-2 text-xs">{message.text}</FormSuccess>
        )
      ) : null}

      {panel === "ban" && !banned ? (
        <Form label={`Ban ${user.name}`} className="mt-2 flex flex-wrap items-end gap-2" pending={pending} onSubmit={onBan}>
          <Field label="Ban reason" htmlFor={`ban-reason-${user.id}`} className="min-w-44 flex-1">
            <Input
              id={`ban-reason-${user.id}`}
              placeholder="Cheating, abuse…"
              autoComplete="off"
              value={banReason}
              onChange={(event) => setBanReason(event.target.value)}
            />
          </Field>
          <Button type="submit" size="sm" variant="danger" loading={pending}>
            Confirm ban
          </Button>
        </Form>
      ) : null}

      {panel === "role" ? (
        <Form
          label={`Change role for ${user.name}`}
          className="mt-2 flex flex-wrap items-end gap-2"
          pending={pending}
          onSubmit={(event) => {
            event.preventDefault();
            void onRole();
          }}
        >
          <SelectField
            id={`role-select-${user.id}`}
            label="Role"
            options={roleOptions}
            value={role}
            onChange={(event) => setRole(event.target.value as Role)}
          />
          <Button type="submit" size="sm" disabled={pending}>
            Save role
          </Button>
        </Form>
      ) : null}

      {panel === "xp" ? (
        <Form label={`Adjust XP for ${user.name}`} className="mt-2 flex flex-wrap items-end gap-2" pending={pending} onSubmit={onXp}>
          <Field label="Amount" htmlFor={`xp-amount-${user.id}`} className="w-28">
            <Input
              id={`xp-amount-${user.id}`}
              type="number"
              step={1}
              placeholder="+50 / -20"
              inputMode="numeric"
              value={xpAmount}
              onChange={(event) => setXpAmount(event.target.value)}
            />
          </Field>
          <Field label="Reason" htmlFor={`xp-reason-${user.id}`} className="min-w-44 flex-1">
            <Input
              id={`xp-reason-${user.id}`}
              placeholder="Event compensation…"
              autoComplete="off"
              value={xpReason}
              onChange={(event) => setXpReason(event.target.value)}
            />
          </Field>
          <Button type="submit" size="sm" loading={pending}>
            Save XP adjustment
          </Button>
        </Form>
      ) : null}
    </div>
  );
}
