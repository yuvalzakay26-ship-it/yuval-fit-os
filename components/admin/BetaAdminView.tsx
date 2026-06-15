"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  type AccessRequest,
  type AllowedUser,
  addAllowedUser,
  approveAccessRequest,
  deleteAccessRequest,
  deleteAllowedUser,
  listAccessRequests,
  listAllowedUsers,
  rejectAccessRequest,
  setAllowedUserStatus,
  useBetaAdmin,
} from "@/lib/beta-access";
import { Card, CardTitle } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { cn } from "@/lib/utils";
import {
  CheckCircleIcon,
  ClockIcon,
  DoorEnterIcon,
  LockIcon,
  PlusIcon,
  ShieldIcon,
  TrashIcon,
  WarningIcon,
  XIcon,
} from "@/components/ui/icons";

/**
 * Beta admin panel ("ניהול בטא"). Lets an admin view, approve, block, reactivate
 * and remove beta users. It is reachable only after the beta auth gate (so the
 * viewer is signed in + approved), and it additionally verifies admin rights
 * client-side. Every data operation is ALSO guarded by Row Level Security in the
 * database — a non-admin who reaches this component sees no data and cannot
 * mutate anything (see supabase/beta-access.sql). This manages access only; no
 * fitness data is involved.
 */
export function BetaAdminView() {
  const { loading, isAdmin, email, configured } = useBetaAdmin();

  if (!configured) return <NotConfigured />;
  if (loading) return <PanelLoading />;
  if (!isAdmin) return <AccessDenied />;

  return <AdminPanel adminEmail={email} />;
}

function AdminPanel({ adminEmail }: { adminEmail: string | null }) {
  const [users, setUsers] = useState<AllowedUser[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Bump the key to re-run the fetch effect. Called from event handlers (never
  // from inside an effect), and from child components after a mutation.
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  // Load both lists whenever the reload key changes (approving a request also
  // changes the allowed-users list, so they always reload together). All state
  // updates live inside the promise callbacks so nothing is set synchronously
  // in the effect body.
  useEffect(() => {
    let active = true;
    Promise.all([listAllowedUsers(), listAccessRequests()])
      .then(([userRows, requestRows]) => {
        if (active) {
          setUsers(userRows);
          setRequests(requestRows);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "טעינת הנתונים נכשלה");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const active = users.filter((u) => u.status === "active");
  const blocked = users.filter((u) => u.status === "blocked");
  const pendingRequests = requests.filter((r) => r.status === "pending");

  return (
    <div className="space-y-8 pb-4">
      {/* Hero */}
      <Card variant="raised" className="sheen space-y-3">
        <div className="flex items-center gap-3">
          <span className="brand-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[color:var(--accent-contrast)] shadow-glow">
            <ShieldIcon className="h-[22px] w-[22px]" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-bold tracking-tight text-foreground">
              ניהול בטא
            </p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
              נהל מי יכול להיכנס למערכת.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[11.5px] font-semibold">
          <Stat label="מאושרים" value={active.length} />
          <Stat label="ממתינים" value={pendingRequests.length} tone="pending" />
          <Stat label="חסומים" value={blocked.length} tone="muted" />
        </div>
      </Card>

      {error && (
        <p className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/[0.06] px-4 py-3 text-[13px] font-semibold text-red-500">
          <WarningIcon className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <section>
        <SectionHeader title="בקשות גישה ממתינות" accent="#f59e0b" />
        {loading ? (
          <ListSkeleton />
        ) : pendingRequests.length === 0 ? (
          <EmptyHint text="אין בקשות גישה ממתינות." />
        ) : (
          <div className="space-y-2.5">
            {pendingRequests.map((request) => (
              <RequestRow
                key={request.id}
                request={request}
                onChanged={refresh}
              />
            ))}
          </div>
        )}
      </section>

      <AddUserForm
        adminEmail={adminEmail}
        existing={users}
        onAdded={refresh}
      />

      <section>
        <SectionHeader title="משתמשים מאושרים" accent="var(--accent)" />
        {loading ? (
          <ListSkeleton />
        ) : active.length === 0 ? (
          <EmptyHint text="עדיין אין משתמשים מאושרים. הוסף אימייל למעלה." />
        ) : (
          <div className="space-y-2.5">
            {active.map((user) => (
              <UserRow key={user.id} user={user} onChanged={refresh} />
            ))}
          </div>
        )}
      </section>

      {blocked.length > 0 && (
        <section>
          <SectionHeader title="משתמשים חסומים" accent="#ef4444" />
          <div className="space-y-2.5">
            {blocked.map((user) => (
              <UserRow key={user.id} user={user} onChanged={refresh} />
            ))}
          </div>
        </section>
      )}

      <p className="text-center text-[12px] leading-relaxed text-faint">
        השינויים נשמרים במערכת הגישה (Supabase). הנתונים האישיים של המשתמשים
        נשמרים במכשיר שלהם ואינם מנוהלים כאן.
      </p>
    </div>
  );
}

/* ------------------------------- Add form ------------------------------- */

function AddUserForm({
  adminEmail,
  existing,
  onAdded,
}: {
  adminEmail: string | null;
  existing: AllowedUser[];
  onAdded: () => Promise<void> | void;
}) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setDone(false);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setError("הזן כתובת אימייל תקינה.");
      return;
    }
    if (existing.some((u) => u.email === trimmed)) {
      setError("האימייל הזה כבר קיים ברשימה.");
      return;
    }
    setBusy(true);
    try {
      await addAllowedUser({
        email: trimmed,
        displayName,
        notes,
        addedBy: adminEmail,
      });
      setEmail("");
      setDisplayName("");
      setNotes("");
      setDone(true);
      await onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "הוספת המשתמש נכשלה");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <SectionHeader title="הוסף משתמש" accent="var(--accent-nutrition)" />
      <Card className="space-y-3.5">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <Label htmlFor="beta-add-email">אימייל</Label>
            <Input
              id="beta-add-email"
              type="email"
              inputMode="email"
              dir="ltr"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
                if (done) setDone(false);
              }}
            />
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label htmlFor="beta-add-name">שם תצוגה (לא חובה)</Label>
              <Input
                id="beta-add-name"
                type="text"
                placeholder="לדוגמה: דני כהן"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="beta-add-notes">הערות (לא חובה)</Label>
              <Textarea
                id="beta-add-notes"
                placeholder="הערה פנימית — לא מוצגת למשתמש"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-red-500">
              <WarningIcon className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}
          {done && (
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-accent">
              <CheckCircleIcon className="h-4 w-4 shrink-0" filled />
              המשתמש נוסף ואושר.
            </p>
          )}

          <Button type="submit" disabled={busy} className="w-full">
            <PlusIcon className="h-[18px] w-[18px]" />
            {busy ? "מוסיף…" : "אשר אימייל"}
          </Button>
        </form>
      </Card>
    </section>
  );
}

/* ------------------------------- User row ------------------------------- */

function UserRow({
  user,
  onChanged,
}: {
  user: AllowedUser;
  onChanged: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const blocked = user.status === "blocked";

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
      await onChanged();
    } catch {
      // Surface a soft inline state without crashing the whole panel.
      setBusy(false);
    }
  };

  return (
    <Card className={cn("space-y-3", blocked && "border-red-500/25")}>
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            blocked
              ? "bg-red-500/10 text-red-500"
              : "bg-[color:var(--accent-soft)] text-accent",
          )}
        >
          {blocked ? (
            <LockIcon className="h-[18px] w-[18px]" />
          ) : (
            <CheckCircleIcon className="h-[18px] w-[18px]" filled />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <CardTitle dir="ltr" className="truncate text-left">
            {user.email}
          </CardTitle>
          {user.display_name && (
            <p className="mt-0.5 truncate text-[12.5px] text-muted">
              {user.display_name}
            </p>
          )}
          {user.notes && (
            <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-faint">
              {user.notes}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-faint">
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="h-3 w-3" />
              נוסף {formatDate(user.created_at)}
            </span>
            {user.last_seen_at && (
              <span className="inline-flex items-center gap-1">
                נראה לאחרונה {formatDate(user.last_seen_at)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {blocked ? (
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => run(() => setAllowedUserStatus(user.id, "active"))}
          >
            <CheckCircleIcon className="h-[16px] w-[16px]" /> הפעל מחדש
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => run(() => setAllowedUserStatus(user.id, "blocked"))}
          >
            <LockIcon className="h-[16px] w-[16px]" /> חסום
          </Button>
        )}

        {confirmRemove ? (
          <>
            <Button
              variant="danger"
              size="sm"
              disabled={busy}
              onClick={() => run(() => deleteAllowedUser(user.id))}
            >
              <TrashIcon className="h-[16px] w-[16px]" /> כן, הסר
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => setConfirmRemove(false)}
            >
              ביטול
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => setConfirmRemove(true)}
            className="text-red-500"
          >
            <TrashIcon className="h-[16px] w-[16px]" /> הסר
          </Button>
        )}
      </div>
    </Card>
  );
}

/* ----------------------------- Request row ------------------------------ */

function RequestRow({
  request,
  onChanged,
}: {
  request: AccessRequest;
  onChanged: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
      await onChanged();
    } catch {
      // Soft-fail inline rather than crashing the whole panel.
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-3 border-amber-500/25">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
          <DoorEnterIcon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <CardTitle dir="ltr" className="truncate text-left">
            {request.email}
          </CardTitle>
          {request.display_name && (
            <p className="mt-0.5 truncate text-[12.5px] text-muted">
              {request.display_name}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-faint">
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="h-3 w-3" />
              ביקש {formatDate(request.requested_at)}
            </span>
            {request.provider && (
              <span dir="ltr" className="inline-flex items-center gap-1">
                {request.provider}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          size="sm"
          disabled={busy}
          onClick={() => run(() => approveAccessRequest(request.id))}
        >
          <CheckCircleIcon className="h-[16px] w-[16px]" /> אשר
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => run(() => rejectAccessRequest(request.id))}
        >
          <XIcon className="h-[16px] w-[16px]" /> דחה
        </Button>

        {confirmRemove ? (
          <>
            <Button
              variant="danger"
              size="sm"
              disabled={busy}
              onClick={() => run(() => deleteAccessRequest(request.id))}
            >
              <TrashIcon className="h-[16px] w-[16px]" /> כן, מחק
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => setConfirmRemove(false)}
            >
              ביטול
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => setConfirmRemove(true)}
            className="text-red-500"
          >
            <TrashIcon className="h-[16px] w-[16px]" /> מחק
          </Button>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------ Sub-states ------------------------------ */

function Stat({
  label,
  value,
  tone = "accent",
}: {
  label: string;
  value: number;
  tone?: "accent" | "muted" | "pending";
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-1">
      <span
        className={cn(
          "tabular-nums font-bold",
          tone === "accent" && "text-accent",
          tone === "muted" && "text-muted",
          tone === "pending" && "text-amber-500",
        )}
      >
        {value}
      </span>
      <span className="text-muted">{label}</span>
    </span>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <Card className="text-center text-[13px] leading-relaxed text-muted">
      {text}
    </Card>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2.5">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-2xl border border-border bg-surface-2"
        />
      ))}
    </div>
  );
}

function PanelLoading() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-muted">
      <span
        aria-hidden="true"
        className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent"
      />
      <p className="text-[13px]">בודק הרשאות ניהול…</p>
    </div>
  );
}

function AccessDenied() {
  return (
    <Card className="space-y-4 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
        <LockIcon className="h-7 w-7" />
      </span>
      <div>
        <p className="text-[16px] font-bold text-foreground">אין לך גישת ניהול</p>
        <p className="mx-auto mt-1.5 max-w-[20rem] text-[13px] leading-relaxed text-muted">
          האזור הזה מיועד למנהלי הבטא בלבד. אם לדעתך מדובר בטעות, פנה למנהל
          המערכת.
        </p>
      </div>
      <Link href="/" className="tap inline-block">
        <Button variant="secondary" size="sm">
          חזרה למערכת
        </Button>
      </Link>
    </Card>
  );
}

function NotConfigured() {
  return (
    <Card className="space-y-3 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-muted">
        <ShieldIcon className="h-7 w-7" />
      </span>
      <p className="text-[15px] font-bold text-foreground">
        מערכת הגישה אינה מוקנפגת
      </p>
      <p className="mx-auto max-w-[20rem] text-[13px] leading-relaxed text-muted">
        יש להגדיר את משתני הסביבה של Supabase כדי לנהל את משתמשי הבטא. ראה
        docs/BETA_ACCESS_SYSTEM.md.
      </p>
    </Card>
  );
}

/* ------------------------------- Helpers -------------------------------- */

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("he-IL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
