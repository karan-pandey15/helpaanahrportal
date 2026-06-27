import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Search,
  Eye,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  ArrowDownUp,
  ArrowUp,
  ArrowDown,
  Columns3,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Loading from "@/components/Loading";
import { cn } from "@/utils/cls";
import useAuth from "@/hooks/useAuth";
import { mergeRoundOptions } from "@/constant/interview-stages";
import { fetchInterviewsList } from "@/features/interviews/interviewService";
import RequestBadge from "@/components/interviews/RequestBadge";
import RefreshButton from "@/components/ui/RefreshButton";
import { fetchRoundsService } from "@/features/rounds/roundService";
import { getAllStatuses } from "@/features/status/statusService";

// 20 candidates per page, as requested.
const LIMIT = 20;

// Column visibility is stored per device.
const COLUMNS_STORAGE_KEY = "manageCandidatesVisibleColumns";

const DAY_FILTERS = [
  { label: "All", value: "all" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Today", value: "today" },
  { label: "Tomorrow", value: "tomorrow" },
];

// Quick-sort presets map onto the same (sortBy, sortDir) state the sortable
// column headers drive, so the two stay in sync.
const SORT_PRESETS = [
  { value: "createdAt:desc", label: "Recently Added", sortBy: "createdAt", sortDir: "desc" },
  { value: "createdAt:asc", label: "Oldest First", sortBy: "createdAt", sortDir: "asc" },
  { value: "candidateName:asc", label: "Name (A–Z)", sortBy: "candidateName", sortDir: "asc" },
  { value: "candidateName:desc", label: "Name (Z–A)", sortBy: "candidateName", sortDir: "desc" },
  { value: "interviewDateTime:asc", label: "Interview Date", sortBy: "interviewDateTime", sortDir: "asc" },
];

const displayStatus = (value) =>
  value
    ? value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "—";

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

const ROUND_TONE = {
  pending: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  "1st round": "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  "2nd round":
    "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  "final round":
    "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  hired: "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  rejected: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  "offer declined":
    "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

// Each column: label, default visibility, the backend field it sorts on (or
// null if not sortable), and how to render a cell.
const COLUMN_DEFS = [
  {
    id: "candidate",
    label: "Candidate",
    default: true,
    sortKey: "candidateName",
    render: (it) => (
      <div>
        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
          {it.candidateName || "—"}
          <RequestBadge type={it.pendingRequestType} />
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
    sortKey: "email",
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
    sortKey: "position",
    render: (it) => it.position || "—",
  },
  {
    id: "round",
    label: "Round",
    default: true,
    sortKey: "round",
    render: (it) => (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize",
          ROUND_TONE[it.round] ||
            "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
        )}
      >
        {it.round || "—"}
      </span>
    ),
  },
  {
    id: "status",
    label: "Status",
    default: true,
    sortKey: "status",
    render: (it) => displayStatus(it.status),
  },
  {
    id: "experience",
    label: "Experience",
    default: true,
    sortKey: "experience",
    render: (it) => it.experience || "—",
  },
  {
    id: "currentCompany",
    label: "Current Company",
    default: false,
    sortKey: "currentCompany",
    render: (it) => it.currentCompany || "—",
  },
  {
    id: "expectedCtc",
    label: "Expected CTC",
    default: false,
    sortKey: "expectedCtc",
    render: (it) => it.expectedCtc || "—",
  },
  {
    id: "noticePeriod",
    label: "Notice Period",
    default: false,
    sortKey: "noticePeriod",
    render: (it) => it.noticePeriod || "—",
  },
  {
    id: "interviewDateTime",
    label: "Interview Date",
    default: false,
    sortKey: "interviewDateTime",
    cellClass: "whitespace-nowrap",
    render: (it) => formatDateTime(it.interviewDateTime),
  },
  {
    id: "createdAt",
    label: "Registered",
    default: false,
    sortKey: "createdAt",
    cellClass: "whitespace-nowrap",
    render: (it) => formatDateOnly(it.createdAt),
  },
  {
    id: "resume",
    label: "Resume",
    default: true,
    sortKey: null,
    render: (it) =>
      it.resumeUrl ? (
        <a
          href={it.resumeUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
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

const ManageCandidates = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  // Admin sees every candidate; HR is scoped to the candidates they created.
  const scope = role === "hr" ? "mine" : undefined;

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  // `term` is what's typed; `search` is what's actually applied (on submit).
  const [term, setTerm] = useState("");
  const [search, setSearch] = useState("");

  // Filters
  const [roundFilter, setRoundFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");
  const [customDate, setCustomDate] = useState("");

  // Sort (shared by the quick-sort dropdown and the sortable headers)
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

  // Filter option sources
  const [roundOptions, setRoundOptions] = useState(mergeRoundOptions([]));
  const [statusOptions, setStatusOptions] = useState([]);

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

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);

  // Load round + status options once.
  useEffect(() => {
    fetchRoundsService()
      .then((res) => setRoundOptions(mergeRoundOptions(res?.rounds || [])))
      .catch(() => setRoundOptions(mergeRoundOptions([])));
    getAllStatuses()
      .then((res) =>
        setStatusOptions(
          (res?.statuses || []).map((s) => s.status).filter(Boolean),
        ),
      )
      .catch(() => setStatusOptions([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchInterviewsList({
        search,
        scope,
        round: roundFilter,
        status: statusFilter,
        dateFilter: customDate ? undefined : dayFilter,
        date: customDate || undefined,
        sortBy,
        sortDir,
        page,
        limit: LIMIT,
      });
      setCandidates(res?.interviews || []);
      setTotalPages(res?.totalPages || 1);
      setCount(res?.count || 0);
    } catch (err) {
      setCandidates([]);
      setTotalPages(1);
      setCount(0);
      toast.error(err?.response?.data?.message || "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  }, [
    search,
    page,
    scope,
    roundFilter,
    statusFilter,
    dayFilter,
    customDate,
    sortBy,
    sortDir,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  const submitSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(term.trim());
  };

  const clearSearch = () => {
    setTerm("");
    setSearch("");
    setPage(1);
  };

  // Filter changes reset to page 1.
  const onDayFilter = (value) => {
    setCustomDate("");
    setDayFilter(value);
    setPage(1);
  };
  const onCustomDate = (value) => {
    setCustomDate(value);
    setPage(1);
  };
  const onRound = (value) => {
    setRoundFilter(value);
    setPage(1);
  };
  const onStatus = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  // Clicking a sortable header: same column toggles direction, otherwise sort
  // ascending on the new column.
  const onSortColumn = (key) => {
    if (!key) return;
    setPage(1);
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const onPreset = (value) => {
    const preset = SORT_PRESETS.find((p) => p.value === value);
    if (!preset) return;
    setPage(1);
    setSortBy(preset.sortBy);
    setSortDir(preset.sortDir);
  };

  const presetValue =
    SORT_PRESETS.find((p) => p.sortBy === sortBy && p.sortDir === sortDir)
      ?.value || "";

  const filtersActive =
    roundFilter !== "all" ||
    statusFilter !== "all" ||
    dayFilter !== "all" ||
    !!customDate ||
    !!search;

  const resetFilters = () => {
    setRoundFilter("all");
    setStatusFilter("all");
    setDayFilter("all");
    setCustomDate("");
    setTerm("");
    setSearch("");
    setSortBy("createdAt");
    setSortDir("desc");
    setPage(1);
  };

  const selectClass =
    "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white";
  const labelClass =
    "mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400";

  return (
    <div>
      {/* Divider / section heading above the page */}
      <div className="mb-4">
        <Breadcrumbs />
      </div>
      <div className="mb-6 flex items-start justify-between gap-4 border-t border-slate-200 pt-6 dark:border-slate-700">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Manage Candidates
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            All registered candidates with their details and resume.
          </p>
        </div>
        <RefreshButton onClick={load} loading={loading} />
      </div>

      {/* Search */}
      <Card className="mb-6 bg-white dark:bg-slate-800">
        <form
          onSubmit={submitSearch}
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search by name, email or phone…"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-9 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
            {term && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Clear"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            <Search size={15} />
            Search
          </button>
        </form>
      </Card>

      {/* Filters & sort */}
      <Card className="mb-6 bg-white dark:bg-slate-800">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-wrap items-end gap-4">
            {/* Day quick filter */}
            <div>
              <label className={labelClass}>Interview Day</label>
              <div className="flex rounded-lg border border-slate-300 p-1 dark:border-slate-600">
                {DAY_FILTERS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => onDayFilter(d.value)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition",
                      !customDate && dayFilter === d.value
                        ? "bg-indigo-600 text-white"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700",
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom date */}
            <div>
              <label className={labelClass}>By Date</label>
              <div className="relative">
                <Calendar
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => onCustomDate(e.target.value)}
                  className={cn(selectClass, "pl-9 dark:[color-scheme:dark]")}
                />
              </div>
            </div>

            {/* Round */}
            <div>
              <label className={labelClass}>Round</label>
              <select
                value={roundFilter}
                onChange={(e) => onRound(e.target.value)}
                className={cn(selectClass, "capitalize")}
              >
                <option value="all">All Rounds</option>
                {roundOptions.map((r) => (
                  <option key={r} value={r}>
                    {displayStatus(r)}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => onStatus(e.target.value)}
                className={cn(selectClass, "capitalize")}
              >
                <option value="all">All Statuses</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {displayStatus(s)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-end gap-4">
            {/* Quick sort */}
            <div>
              <label className={labelClass}>
                <span className="inline-flex items-center gap-1">
                  <ArrowDownUp size={12} />
                  Sort By
                </span>
              </label>
              <select
                value={presetValue}
                onChange={(e) => onPreset(e.target.value)}
                className={cn(selectClass, "min-w-[160px]")}
              >
                {!presetValue && (
                  <option value="" disabled hidden>
                    Custom (column)
                  </option>
                )}
                {SORT_PRESETS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {filtersActive && (
              <button
                type="button"
                onClick={resetFilters}
                className="py-2 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Candidate list */}
      <Card className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">
            {search ? `Results for “${search}”` : "All Candidates"}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {count} candidate{count === 1 ? "" : "s"}
            </span>
            <ColumnToggle
              visibleColumns={visibleColumns}
              setVisibleColumns={setVisibleColumns}
            />
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : candidates.length === 0 ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400">
            {filtersActive
              ? "No candidates match your filters."
              : "No candidates yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-700">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-200">
                  {activeColumns.map((col) => {
                    const isSorted = col.sortKey && sortBy === col.sortKey;
                    return (
                      <th key={col.id} className="px-4 py-3">
                        {col.sortKey ? (
                          <button
                            type="button"
                            onClick={() => onSortColumn(col.sortKey)}
                            className="inline-flex items-center gap-1 uppercase tracking-wide transition hover:text-indigo-600 dark:hover:text-indigo-400"
                            title={`Sort by ${col.label}`}
                          >
                            {col.label}
                            {isSorted ? (
                              sortDir === "asc" ? (
                                <ArrowUp size={13} className="text-indigo-600 dark:text-indigo-400" />
                              ) : (
                                <ArrowDown size={13} className="text-indigo-600 dark:text-indigo-400" />
                              )
                            ) : (
                              <ArrowDownUp size={12} className="text-slate-300 dark:text-slate-500" />
                            )}
                          </button>
                        ) : (
                          col.label
                        )}
                      </th>
                    );
                  })}
                  <th className="px-4 py-3 text-center">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {candidates.map((it) => (
                  <tr
                    key={it._id}
                    className="cursor-pointer text-sm transition hover:bg-slate-50 dark:hover:bg-slate-700/40"
                    onClick={() => navigate(`/candidate/${it._id}`)}
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
                        title="View candidate profile"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/candidate/${it._id}`);
                        }}
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
    </div>
  );
};

export default ManageCandidates;
