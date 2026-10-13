"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import {
  adjustAdminUserXp,
  banAdminUser,
  setAdminUserRole,
  unbanAdminUser,
  type AdminUserRow,
} from "@/lib/api/admin";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

type Panel = null | "ban" | "role" | "xp";

const ROLES: Role[] = ["user", "moderator", "admin"];

/**
 * Per-row moderation island: ban/unban (with reason), role picker, XP
 * adjustment (amount + reason). Every mutation is audit-logged server-side.
 */
export function UserActions({ user }: { user: AdminUserRow }) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{
    tone: "ok" | "err";
    text: string;
  } | null>(null);
  const [banReason, setBanReason] = useState("");
  const [role, setRole] = useState<Role>(user.role);
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

  async function onBan(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    if (!banReason.trim()) {
      setMessage({ tone: "err", text: "A ban reason is required." });
      return;
    }
    setPending(true);
    setMessage(null);
    const result = await banAdminUser(user.id, banReason.trim());
    setPending(false);
    done(result.ok, `${user.name} has been banned.`, result.ok ? "" : result.message);
  }

  async function onUnban() {
    if (pending) return;
    setPending(true);
    setMessage(null);
    const result = await unbanAdminUser(user.id);
    setPending(false);
    done(result.ok, `${user.name} has been unbanned.`, result.ok ? "" : result.message);
  }

  async function onRole(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setMessage(null);
    const result = await setAdminUserRole(user.id, role);
    setPending(false);
    done(result.ok, `Role updated to ${role}.`, result.ok ? "" : result.message);
  }

  async function onXp(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    const amount = Number(xpAmount.trim());
    if (!Number.isInteger(amount) || amount === 0) {
      setMessage({ tone: "err", text: "Amount must be a non-zero whole number." });
      return;
    }
    if (!xpReason.trim()) {
      setMessage({ tone: "err", text: "An XP reason is required for the audit log." });
      return;
    }
    setPending(true);
    setMessage(null);
    const result = await adjustAdminUserXp(user.id, amount, xpReason.trim());
    setPending(false);
    if (result.ok) {
      setMessage({
        tone: "ok",
        text: `XP adjusted by ${amount > 0 ? `+${amount}` : amount}.`,
      });
      setXpAmount("");
      setXpReason("");
      setPanel(null);
      router.refresh();
    } else {
      setMessage({ tone: "err", text: result.message });
    }
  }

  const selectClass = cn(
    "flex h-9 w-full rounded-md border border-border bg-background px-2 py-1 text-sm",
    "text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
  );

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {banned ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={onUnban}
          >
            {pending ? "Working…" : "Unban user"}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="danger"
            disabled={pending}
            onClick={() => toggle("ban")}
            aria-expanded={panel === "ban"}
          >
            Ban user
          </Button>
        )}
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() => toggle("role")}
          aria-expanded={panel === "role"}
        >
          Change role
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() => toggle("xp")}
          aria-expanded={panel === "xp"}
        >
          Adjust XP
        </Button>
      </div>

      {message ? (
        <p
          role={message.tone === "err" ? "alert" : "status"}
          className={cn(
            "mt-2 text-xs",
            message.tone === "err" ? "text-danger" : "text-success",
          )}
        >
          {message.text}
        </p>
      ) : null}

      {panel === "ban" && !banned ? (
        <form onSubmit={onBan} className="mt-2 flex flex-wrap items-end gap-2" aria-label={`Ban ${user.name}`}>
          <Field label="Ban reason" htmlFor={`ban-reason-${user.id}`} className="min-w-44 flex-1">
            <Input
              id={`ban-reason-${user.id}`}
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Cheating, abuse…"
              autoComplete="off"
            />
          </Field>
          <Button type="submit" size="sm" variant="danger" disabled={pending}>
            {pending ? "Banning…" : "Confirm ban"}
          </Button>
        </form>
      ) : null}

      {panel === "role" ? (
        <form onSubmit={onRole} className="mt-2 flex flex-wrap items-end gap-2" aria-label={`Change role for ${user.name}`}>
          <div className="space-y-1.5">
            <label htmlFor={`role-select-${user.id}`} className="text-sm font-medium text-foreground">
              Role
            </label>
            <select
              id={`role-select-${user.id}`}
              className={selectClass}
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save role"}
          </Button>
        </form>
      ) : null}

      {panel === "xp" ? (
        <form onSubmit={onXp} className="mt-2 flex flex-wrap items-end gap-2" aria-label={`Adjust XP for ${user.name}`}>
          <Field label="Amount" htmlFor={`xp-amount-${user.id}`} className="w-28">
            <Input
              id={`xp-amount-${user.id}`}
              type="number"
              step={1}
              value={xpAmount}
              onChange={(e) => setXpAmount(e.target.value)}
              placeholder="+50 / -20"
              inputMode="numeric"
            />
          </Field>
          <Field label="Reason" htmlFor={`xp-reason-${user.id}`} className="min-w-44 flex-1">
            <Input
              id={`xp-reason-${user.id}`}
              value={xpReason}
              onChange={(e) => setXpReason(e.target.value)}
              placeholder="Event compensation…"
              autoComplete="off"
            />
          </Field>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save XP adjustment"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
