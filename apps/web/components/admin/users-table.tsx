"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import { formatXp } from "@/lib/utils";
import type { CurrentUser, Role } from "@/lib/types";

const ROLES: Role[] = ["user", "moderator", "admin"];

export function AdminUsersTable({
  users,
  currentUser,
}: {
  users: CurrentUser[];
  currentUser: CurrentUser;
}) {
  const id = useId();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const isAdmin = currentUser.role === "admin";

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(needle) ||
        u.email.toLowerCase().includes(needle),
    );
  }, [users, q]);

  function setRole(userId: number, role: Role, previous: Role) {
    if (role === previous) return;
    if (
      !window.confirm(
        `Change this user's role from "${previous}" to "${role}"?`,
      )
    ) {
      return;
    }
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await api.put(`/admin/users/${userId}/role`, { role });
        setMessage("Role updated.");
        router.refresh();
      } catch (err) {
        setError(errorMessage(err));
      }
    });
  }

  function banUser(userId: number, name: string) {
    if (!window.confirm(`Ban ${name}? They will be unable to sign in.`)) return;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await api.post(`/admin/users/${userId}/ban`);
        setMessage("User banned.");
        router.refresh();
      } catch (err) {
        setError(errorMessage(err));
      }
    });
  }

  function unbanUser(userId: number, name: string) {
    if (!window.confirm(`Unban ${name}?`)) return;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await api.post(`/admin/users/${userId}/unban`);
        setMessage("User unbanned.");
        router.refresh();
      } catch (err) {
        setError(errorMessage(err));
      }
    });
  }

  return (
    <div className="space-y-4">
      <Field label="Filter users" htmlFor={`${id}-q`}>
        <Input
          id={`${id}-q`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by name or email…"
          autoComplete="off"
        />
      </Field>

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

      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="border-b border-border bg-surface font-mono text-[11px] uppercase text-muted">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">XP</th>
              <th className="px-3 py-2">Solves</th>
              {isAdmin ? <th className="px-3 py-2">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={isAdmin ? 7 : 6}
                  className="px-3 py-6 text-center text-muted"
                >
                  No users match this filter.
                </td>
              </tr>
            ) : (
              filtered.map((u) => {
                const banned = !!u.banned_at;
                return (
                  <tr key={u.id} className="border-b border-border/70">
                    <td className="px-3 py-2 font-mono text-faint">{u.id}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex flex-wrap items-center gap-2">
                        {u.name}
                        {banned ? <Badge tone="danger">Banned</Badge> : null}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted">{u.email}</td>
                    <td className="px-3 py-2">
                      {isAdmin ? (
                        <select
                          className="h-8 rounded-md border border-border bg-background px-2 text-sm"
                          value={u.role}
                          disabled={pending || u.id === currentUser.id}
                          aria-label={`Role for ${u.name}`}
                          onChange={(e) =>
                            setRole(u.id, e.target.value as Role, u.role)
                          }
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Badge>{u.role}</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono">{formatXp(u.xp)}</td>
                    <td className="px-3 py-2 font-mono">{u.solved_count}</td>
                    {isAdmin ? (
                      <td className="px-3 py-2">
                        {u.id === currentUser.id ? (
                          <span className="text-xs text-faint">You</span>
                        ) : banned ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={pending}
                            onClick={() => unbanUser(u.id, u.name)}
                          >
                            Unban
                          </Button>
                        ) : (
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={pending}
                            onClick={() => banUser(u.id, u.name)}
                          >
                            Ban
                          </Button>
                        )}
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
