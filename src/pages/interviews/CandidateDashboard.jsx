import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Users,
  CalendarClock,
  CalendarCheck,
  UserCheck,
  UserX,
  Loader2,
  Eye,
  FileText,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Loading from "@/components/Loading";
import ViewInterview from "@/components/interviews/ViewInterview";
import RequestBadge from "@/components/interviews/RequestBadge";
import { cn } from "@/utils/cls";
import { fetchInterviewStatsService } from "@/features/interviews/interviewListService";
import RefreshButton from "@/components/ui/RefreshButton";

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const displayStatus = (value) =>
  value
    ? value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "—";

const StatCard = ({ icon, label, value, tone }) => (
  <Card className="bg-white dark:bg-slate-800">
    <div className="flex items-center gap-4">
      <span
        className={cn(
          "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl",
          tone,
        )}
      >
        {icon}
      </span>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">
          {value ?? 0}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  </Card>
);

// A labelled proportional bar list for a counts map.
const BreakdownCard = ({ title, counts, barColor }) => {
  const entries = Object.entries(counts || {}).sort((a, b) => b[1] - a[1]);
  const max = entries.reduce((m, [, v]) => Math.max(m, v), 0) || 1;

  return (
    <Card className="bg-white dark:bg-slate-800">
      <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>
      {entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">No data</p>
      ) : (
        <div className="space-y-3">
          {entries.map(([label, value]) => (
            <div key={label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="capitalize text-slate-600 dark:text-slate-300">
                  {displayStatus(label)}
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {value}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                <div
                  className={cn("h-full rounded-full", barColor)}
                  style={{ width: `${Math.round((value / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

const CandidateDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewInterview, setViewInterview] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchInterviewStatsService();
      setStats(res);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cards = [
    {
      icon: <Users size={22} />,
      label: "Total Candidates",
      value: stats?.totalCandidates,
      tone: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
    },
    {
      icon: <CalendarClock size={22} />,
      label: "Today's Interviews",
      value: stats?.today,
      tone: "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300",
    },
    {
      icon: <CalendarCheck size={22} />,
      label: "Upcoming",
      value: stats?.upcoming,
      tone: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
    },
    {
      icon: <Loader2 size={22} />,
      label: "In Process",
      value: stats?.inProcess,
      tone: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
    },
    {
      icon: <UserCheck size={22} />,
      label: "Hired",
      value: stats?.hired,
      tone: "bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-300",
    },
    {
      icon: <UserX size={22} />,
      label: "Rejected",
      value: stats?.rejected,
      tone: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300",
    },
  ];

  const recent = stats?.recent || [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Breadcrumbs />
        <RefreshButton onClick={load} loading={loading} />
      </div>

      {loading ? (
        <Loading />
      ) : (
        <>
          {/* Summary cards */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            {cards.map((c) => (
              <StatCard key={c.label} {...c} />
            ))}
          </div>

          {/* Breakdowns */}
          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <BreakdownCard
              title="By Interview Round"
              counts={stats?.roundCounts}
              barColor="bg-indigo-500"
            />
            <BreakdownCard
              title="By Status"
              counts={stats?.statusCounts}
              barColor="bg-emerald-500"
            />
            <BreakdownCard
              title="By Position"
              counts={stats?.positionCounts}
              barColor="bg-sky-500"
            />
          </div>

          {/* Recent candidates */}
          <Card className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
            <h3 className="mb-4 text-base font-semibold">Recent Candidates</h3>
            {recent.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">
                No candidates yet
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-100 dark:bg-slate-700">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-200">
                      <th className="px-4 py-3">Candidate</th>
                      <th className="px-4 py-3">Position</th>
                      <th className="px-4 py-3">Round</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Interview Date</th>
                      <th className="px-4 py-3">Interviewer</th>
                      <th className="px-4 py-3">Resume</th>
                      <th className="px-4 py-3 text-center">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {recent.map((it) => (
                      <tr
                        key={it._id}
                        className="text-sm transition hover:bg-slate-50 dark:hover:bg-slate-700/40"
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {it.candidateName || "—"}
                            <RequestBadge type={it.pendingRequestType} />
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {it.email || "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3">{it.position || "—"}</td>
                        <td className="px-4 py-3 capitalize">
                          {it.round || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {displayStatus(it.status)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatDateTime(it.interviewDateTime)}
                        </td>
                        <td className="px-4 py-3">
                          {it.assignedInterviewer?.name || (
                            <span className="text-xs text-slate-400">
                              Not Assigned
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {it.resumeUrl ? (
                            <a
                              href={it.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                            >
                              <FileText size={13} />
                              View
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            title="View candidate"
                            onClick={() => setViewInterview(it)}
                            className="inline-flex items-center justify-center rounded-md p-2 text-slate-600 transition hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-700"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {viewInterview && (
        <ViewInterview
          interview={viewInterview}
          onClose={() => setViewInterview(null)}
        />
      )}
    </div>
  );
};

export default CandidateDashboard;
