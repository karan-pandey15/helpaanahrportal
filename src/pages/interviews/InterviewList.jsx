import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  ExternalLink,
  Copy,
  Check,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Columns3,
  FileText,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Loading from "@/components/Loading";
import ViewInterview from "@/components/interviews/ViewInterview";
import RequestBadge from "@/components/interviews/RequestBadge";
import RefreshButton from "@/components/ui/RefreshButton";
import { cn } from "@/utils/cls";
import {
  fetchInterviewListService,
  fetchInterviewAssigneesService,
} from "@/features/interviews/interviewListService";

const DAY_FILTERS = [
  { label: "Yesterday", value: "yesterday" },
  { label: "Today", value: "today" },
  { label: "Tomorrow", value: "tomorrow" },
];

const LIMIT = 50;

// Column preferences are stored per device (shared across users on this device).
const COLUMNS_STORAGE_KEY = "interviewListVisibleColumns";

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

const formatDateOnly = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const displayStatus = (value) =>
  value
    ? value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "—";

const JoinLink = ({ link }) => {
  const [copied, setCopied] = useState(false);

  if (!link) {
    return <span className="text-xs text-slate-400">No link</span>;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Meeting link copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700"
      >
        <ExternalLink size={13} />
        Join
      </a>
      <button
        type="button"
        onClick={handleCopy}
        title="Copy meeting link"
        className="rounded-md border border-slate-300 p-1.5 text-slate-500 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
      >
        {copied ? (
          <Check size={13} className="text-green-500" />
        ) : (
          <Copy size={13} />
        )}
      </button>
    </div>
  );
};

// Each column knows its label, default visibility and how to render a cell.
const COLUMN_DEFS = [
  {
    id: "candidate",
    label: "Candidate",
    default: true,
    render: (it) => (
      <div>
        <div className="font-semibold text-slate-900 dark:text-white">
          {it.candidateName || "—"}
        </div>
        {it.currentCompany && (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {it.currentCompany}
          </div>
        )}
      </div>
    ),
  },
  {
    id: "contact",
    label: "Contact",
    default: true,
    render: (it) => (
      <div>
        <div>{it.email || "—"}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {it.phone || "—"}
        </div>
      </div>
    ),
  },
  {
    id: "position",
    label: "Position",
    default: true,
    render: (it) => it.position || "—",
  },
  {
    id: "round",
    label: "Round",
    default: true,
    render: (it) => <span className="capitalize">{it.round || "—"}</span>,
  },
  {
    id: "interviewDateTime",
    label: "Interview Date & Time",
    default: true,
    cellClass: "whitespace-nowrap",
    render: (it) => formatDateTime(it.interviewDateTime),
  },
  {
    id: "assignedInterviewer",
    label: "Assigned Interviewer",
    default: true,
    render: (it) =>
      it.assignedInterviewer ? (
        <div>
          <div className="font-medium">{it.assignedInterviewer.name}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {it.assignedInterviewer.email}
          </div>
        </div>
      ) : (
        <span className="text-xs text-slate-400">Not Assigned</span>
      ),
  },
  {
    id: "status",
    label: "Status",
    default: true,
    render: (it) => displayStatus(it.status),
  },
  {
    id: "experience",
    label: "Experience",
    default: false,
    render: (it) => it.experience || "—",
  },
  {
    id: "ctc",
    label: "Current / Expected CTC",
    default: false,
    cellClass: "whitespace-nowrap",
    render: (it) => `${it.currentCtc || "—"} / ${it.expectedCtc || "—"}`,
  },
  {
    id: "noticePeriod",
    label: "Notice Period",
    default: false,
    render: (it) => it.noticePeriod || "—",
  },
  {
    id: "joiningDate",
    label: "Joining Date",
    default: false,
    cellClass: "whitespace-nowrap",
    render: (it) => formatDateOnly(it.joiningDate),
  },
  {
    id: "createdBy",
    label: "Created By",
    default: false,
    render: (it) => it.createdBy?.name || "—",
  },
  {
    id: "meetingLink",
    label: "Join Link",
    default: true,
    render: (it) => <JoinLink link={it.meetingLink} />,
  },
  {
    id: "resumeUrl",
    label: "Resume",
    default: true,
    render: (it) =>
      it.resumeUrl ? (
        <a
          href={it.resumeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <FileText size={13} />
          View Resume
        </a>
      ) : (
        <span className="text-xs text-slate-400">No resume</span>
      ),
  },
];

const defaultVisibility = COLUMN_DEFS.reduce((acc, c) => {
  acc[c.id] = c.default;
  return acc;
}, {});

const ColumnToggle = ({ visibleColumns, setVisibleColumns }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeCount = COLUMN_DEFS.filter((c) => visibleColumns[c.id]).length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition",
          "border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300",
          open
            ? "bg-slate-100 dark:bg-slate-700"
            : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700",
        )}
      >
        <Columns3 size={15} />
        Columns
        <span className="text-xs text-slate-400">
          {activeCount}/{COLUMN_DEFS.length}
        </span>
      </button>

      {open && (
        <ul className="absolute right-0 top-full z-20 mt-1 max-h-72 w-56 overflow-y-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-700">
          {COLUMN_DEFS.map((col) => (
            <li key={col.id} className="px-3 py-1.5">
              <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  className="table-checkbox h-3.5 w-3.5"
                  checked={!!visibleColumns[col.id]}
                  onChange={() =>
                    setVisibleColumns((vc) => ({
                      ...vc,
                      [col.id]: !vc[col.id],
                    }))
                  }
                />
                {col.label}
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const InterviewList = () => {
  const [interviews, setInterviews] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewInterview, setViewInterview] = useState(null);

  // Filters
  const [dateFilter, setDateFilter] = useState("today"); // default → today
  const [customDate, setCustomDate] = useState(""); // YYYY-MM-DD
  const [assignee, setAssignee] = useState("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);

  // Column visibility (persisted per device).
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem(COLUMNS_STORAGE_KEY);
      if (saved) return { ...defaultVisibility, ...JSON.parse(saved) };
    } catch {
      /* ignore malformed storage */
    }
    return defaultVisibility;
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(visibleColumns));
    } catch {
      /* ignore quota / disabled storage */
    }
  }, [visibleColumns]);

  const activeColumns = useMemo(
    () => COLUMN_DEFS.filter((c) => visibleColumns[c.id]),
    [visibleColumns],
  );

  // Load assignee options once.
  useEffect(() => {
    let active = true;
    fetchInterviewAssigneesService()
      .then((res) => {
        if (active) setAssignees(res?.assignees || []);
      })
      .catch(() => {
        if (active) setAssignees([]);
      });
    return () => {
      active = false;
    };
  }, []);

  // Fetch the list whenever a filter or page changes.
  const loadList = useCallback(async () => {
    setLoading(true);

    const params = {
      assignee,
      page,
      limit: LIMIT,
    };
    if (customDate) params.date = customDate;
    else params.dateFilter = dateFilter;

    try {
      const res = await fetchInterviewListService(params);
      setInterviews(res?.interviews || []);
      setTotalPages(res?.totalPages || 1);
      setCount(res?.count || 0);
    } catch (err) {
      setInterviews([]);
      setTotalPages(1);
      setCount(0);
      toast.error(
        err?.response?.data?.message || "Failed to fetch interview list",
      );
    } finally {
      setLoading(false);
    }
  }, [dateFilter, customDate, assignee, page]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleDayFilter = (value) => {
    setCustomDate(""); // a quick day filter clears any explicit date
    setDateFilter(value);
    setPage(1);
  };

  const handleCustomDate = (value) => {
    setCustomDate(value);
    setPage(1);
  };

  const handleAssignee = (value) => {
    setAssignee(value);
    setPage(1);
  };

  const headingLabel = useMemo(() => {
    if (customDate) return formatDateOnly(customDate);
    return DAY_FILTERS.find((d) => d.value === dateFilter)?.label || "Today";
  }, [customDate, dateFilter]);

  const inputClass =
    "px-3 py-2 rounded-lg border bg-white dark:bg-slate-700 " +
    "border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white " +
    "focus:ring-2 focus:ring-indigo-500 outline-none transition";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Breadcrumbs />
        <RefreshButton onClick={loadList} loading={loading} />
      </div>

      {/* Filter bar */}
      <Card className="mb-6 bg-white dark:bg-slate-800">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          {/* Quick day filters + custom date */}
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                Day
              </label>
              <div className="flex rounded-lg border border-slate-300 p-1 dark:border-slate-600">
                {DAY_FILTERS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => handleDayFilter(d.value)}
                    className={cn(
                      "rounded-md px-4 py-1.5 text-sm font-medium transition",
                      !customDate && dateFilter === d.value
                        ? "bg-indigo-600 text-white"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700",
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                By Date
              </label>
              <div className="relative">
                <Calendar
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => handleCustomDate(e.target.value)}
                  className={cn(inputClass, "pl-9")}
                />
              </div>
            </div>

            {customDate && (
              <button
                onClick={() => handleDayFilter("today")}
                className="py-2 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Reset to Today
              </button>
            )}
          </div>

          {/* Assignee filter */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Assignee
            </label>
            <select
              value={assignee}
              onChange={(e) => handleAssignee(e.target.value)}
              className={cn(inputClass, "min-w-[200px]")}
            >
              <option value="all">All Assignees</option>
              <option value="me">Me</option>
              {assignees.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* List */}
      <Card className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">{headingLabel}'s Interviews</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {count} interview{count === 1 ? "" : "s"}
            </span>
            <ColumnToggle
              visibleColumns={visibleColumns}
              setVisibleColumns={setVisibleColumns}
            />
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : interviews.length === 0 ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400">
            No interviews found for {headingLabel.toLowerCase()}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-700">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-200">
                  {activeColumns.map((col) => (
                    <th key={col.id} className="px-4 py-3">
                      {col.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {interviews.map((it) => (
                  <tr
                    key={it._id}
                    className="text-sm transition hover:bg-slate-50 dark:hover:bg-slate-700/40"
                  >
                    {activeColumns.map((col) => (
                      <td
                        key={col.id}
                        className={cn("px-4 py-3", col.cellClass)}
                      >
                        {col.render(it)}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        title="View interview"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-slate-600"
            >
              <ChevronLeft size={15} />
              Prev
            </button>
            <span className="text-sm font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-slate-600"
            >
              Next
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </Card>

      {viewInterview && (
        <ViewInterview
          interview={viewInterview}
          onClose={() => setViewInterview(null)}
        />
      )}
    </div>
  );
};

export default InterviewList;
