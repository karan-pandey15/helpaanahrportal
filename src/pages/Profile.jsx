import { useState } from "react";
import { useSelector } from "react-redux";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import UserAvatar from "@/assets/images/users/user.png";
import RoundSettings from "@/pages/admin/rounds/RoundSettings";

// User profile page. Identity (name/email/role) sits next to the avatar with
// the Account ID filling the space beside it. Admins also manage rounds & email
// here (moved out of the sidebar).
const roleBadge = (role) =>
  ({
    admin: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
    hr: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    interviewer: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  })[role] || "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";

export default function Profile() {
  const user = useSelector((s) => s.auth.user);
  const role = user?.role;
  const isAdmin = role === "admin";
  const [copied, setCopied] = useState(false);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(user?.id || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-slate-800">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Identity */}
          <div className="flex min-w-0 items-center gap-5">
            <img
              src={UserAvatar}
              alt={user?.name || "User"}
              className="h-20 w-20 shrink-0 rounded-full ring-4 ring-indigo-100 dark:ring-slate-700"
            />
            <div className="min-w-0">
              <h1 className="break-words text-2xl font-bold text-slate-900 dark:text-white">
                {user?.name || "—"}
              </h1>
              <p className="break-words text-sm text-slate-500 dark:text-slate-400">
                {user?.email || "—"}
              </p>
              <span
                className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${roleBadge(role)}`}
              >
                {role || "—"}
              </span>
            </div>
          </div>

          {/* Account ID — uses the free space beside the avatar/name. */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-700/40 lg:min-w-[300px]">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-400">Account ID</p>
              <button
                type="button"
                onClick={copyId}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 transition hover:text-indigo-700 dark:text-indigo-400"
              >
                <Icon
                  icon={
                    copied
                      ? "heroicons-outline:check"
                      : "heroicons-outline:clipboard-copy"
                  }
                />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-1 break-all font-mono text-sm text-slate-700 dark:text-slate-200">
              {user?.id || "—"}
            </p>
          </div>
        </div>
      </Card>

      {/* Admin round & email management lives here now */}
      {isAdmin && <RoundSettings embedded />}
    </div>
  );
}
