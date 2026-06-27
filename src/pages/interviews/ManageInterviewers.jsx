import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Calendar,
  Clock,
  ExternalLink,
  Eye,
  Mail,
  CalendarX,
  Columns3,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Loading from "@/components/Loading";
import RefreshButton from "@/components/ui/RefreshButton";
import { cn } from "@/utils/cls";
import { getUsersByRole } from "@/features/interviews/interviewService";
import { getInterviewerBookingsService } from "@/features/availability/availabilityService";

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const istDate = (offset = 0) => {
  const d = new Date(Date.now() + IST_OFFSET_MS + offset * 86400000);
  return d.toISOString().slice(0, 10);
};

const DAY_FILTERS = [
  { label: "Upcoming", value: "upcoming" },
  { label: "Today", value: "today" },
  { label: "Tomorrow", value: "tomorrow" },
];

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const istTime = (value) =>
  new Date(value).toLocaleTimeString("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const istDay = (value) =>
  new Date(value).toLocaleDateString("en-US", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "numeric",
  });

const slotRange = (b) => {
  const start = new Date(b.interviewDateTime);
  const end = new Date(start.getTime() + (b.durationMinutes || 30) * 60000);
  return `${istTime(start)} – ${istTime(end)}`;
};

const availabilitySummary = (a) => {
  if (!a || a.enabled === false) return "Not accepting bookings";
  const days = (a.weekdays || []).map((d) => WD[d]).join(", ");
  return `${a.startTime || "—"}–${a.endTime || "—"}${days ? ` · ${days}` : ""}`;
};

const displayStatus = (value) =>
  value
    ? value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "—";

// Column visibility is stored per device and applies to every interviewer table.
const COLUMNS_STORAGE_KEY = "manageInterviewersVisibleColumns";

const COLUMN_DEFS = [
  {
    id: "date",
    label: "Date",
    default: true,
    cellClass: "whitespace-nowrap",
    render: (b) => istDay(b.interviewDateTime),
  },
  {
    id: "slot",
    label: "Slot",
    default: true,
    cellClass: "whitespace-nowrap font-medium",
    render: (b) => slotRange(b),
  },
  {
    id: "candidate",
    label: "Candidate",
    default: true,
    render: (b) => (
      <div>
        <div className="font-medium">{b.candidateName}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {b.email}
        </div>
      </div>
    ),
  },
  {
    id: "position",
    label: "Position",
    default: true,
    render: (b) => b.position || "—",
  },
  {
    id: "round",
    label: "Round",
    default: true,
    cellClass: "capitalize",
    render: (b) => b.round || "—",
  },
  {
    id: "status",
    label: "Status",
    default: true,
    render: (b) => displayStatus(b.status),
  },
  {
    id: "join",
    label: "Join",
    default: true,
    render: (b) =>
      b.meetingLink ? (
        <a
          href={b.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          <ExternalLink size={12} />
          Join
        </a>
      ) : (
        <span className="text-xs text-slate-400">—</span>
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
        <ul className="absolute right-0 top-full z-20 mt-1 max-h-72 w-52 overflow-y-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-700">
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

const ManageInterviewers = () => {
  const navigate = useNavigate();

  const [interviewersList, setInterviewersList] = useState([]); // for the filter
  const [data, setData] = useState([]); // [{ interviewer, bookings }]
  const [loading, setLoading] = useState(false);

  const [dayFilter, setDayFilter] = useState("upcoming");
  const [customDate, setCustomDate] = useState("");
  const [interviewerId, setInterviewerId] = useState("all");

  // Column visibility (persisted per device, shared by all interviewer tables).
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

  // Interviewer options for the filter dropdown.
  useEffect(() => {
    getUsersByRole("interviewer")
      .then((res) => setInterviewersList(res?.users || []))
      .catch(() => setInterviewersList([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    // Resolve the date param: a quick filter maps to a date; "upcoming" sends none.
    let date;
    if (customDate) date = customDate;
    else if (dayFilter === "today") date = istDate(0);
    else if (dayFilter === "tomorrow") date = istDate(1);

    try {
      const res = await getInterviewerBookingsService({
        date,
        interviewerId: interviewerId !== "all" ? interviewerId : undefined,
      });
      setData(res?.interviewers || []);
    } catch (err) {
      setData([]);
      toast.error(
        err?.response?.data?.message || "Failed to load interviewers",
      );
    } finally {
      setLoading(false);
    }
  }, [dayFilter, customDate, interviewerId]);

  useEffect(() => {
    load();
  }, [load]);

  const onDay = (value) => {
    setCustomDate("");
    setDayFilter(value);
  };

  const totalBookings = data.reduce((n, d) => n + d.bookings.length, 0);

  const selectClass =
    "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white";
  const labelClass =
    "mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400";

  return (
    <div>
      <div className="mb-4">
        <Breadcrumbs />
      </div>
      <div className="mb-6 flex items-start justify-between gap-4 border-t border-slate-200 pt-6 dark:border-slate-700">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Manage Interviewers
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Each interviewer's booked interview slots and the candidates they're
            meeting.
          </p>
        </div>
        <RefreshButton onClick={load} loading={loading} />
      </div>

      {/* Filters */}
      <Card className="mb-6 bg-white dark:bg-slate-800">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className={labelClass}>When</label>
            <div className="flex rounded-lg border border-slate-300 p-1 dark:border-slate-600">
              {DAY_FILTERS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => onDay(d.value)}
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
                onChange={(e) => setCustomDate(e.target.value)}
                className={cn(selectClass, "pl-9 dark:[color-scheme:dark]")}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Interviewer</label>
            <select
              value={interviewerId}
              onChange={(e) => setInterviewerId(e.target.value)}
              className={cn(selectClass, "min-w-[180px]")}
            >
              <option value="all">All Interviewers</option>
              {interviewersList.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {totalBookings} booked slot{totalBookings === 1 ? "" : "s"}
            </span>
            <ColumnToggle
              visibleColumns={visibleColumns}
              setVisibleColumns={setVisibleColumns}
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <Loading />
      ) : data.length === 0 ? (
        <Card className="bg-white dark:bg-slate-800">
          <p className="py-12 text-center text-slate-500 dark:text-slate-400">
            No interviewers found.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {data.map(({ interviewer, bookings }) => (
            <Card
              key={interviewer.id}
              className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              {/* Interviewer header */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-700">
                <div>
                  <h3 className="text-base font-semibold">{interviewer.name}</h3>
                  <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Mail size={12} />
                      {interviewer.email}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} />
                      {availabilitySummary(interviewer.availability)}
                    </span>
                  </div>
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                  {bookings.length} booked
                </span>
              </div>

              {bookings.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
                  <CalendarX size={16} />
                  No booked slots
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead>
                      <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                        {activeColumns.map((col) => (
                          <th key={col.id} className="px-3 py-2">
                            {col.label}
                          </th>
                        ))}
                        <th className="px-3 py-2 text-center">View</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {bookings.map((b) => (
                        <tr
                          key={b._id}
                          className="cursor-pointer text-sm transition hover:bg-slate-50 dark:hover:bg-slate-700/40"
                          onClick={() => navigate(`/candidate/${b._id}`)}
                        >
                          {activeColumns.map((col) => (
                            <td
                              key={col.id}
                              className={cn("px-3 py-2", col.cellClass)}
                            >
                              {col.render(b)}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              title="View candidate"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/candidate/${b._id}`);
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageInterviewers;
