import { useEffect, useState } from "react";
import { Loader2, CalendarDays, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/utils/cls";
import { getSlotsService } from "@/features/availability/availabilityService";

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

// IST calendar day (YYYY-MM-DD) for an instant / now.
const istDate = (d = new Date()) =>
  new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
const isoToIstDate = (iso) => (iso ? istDate(new Date(iso)) : "");

const DEFAULT_DURATIONS = [
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
];

/**
 * Pick an interviewer, a duration, a date, then a free slot. Booked / past
 * slots are hidden. Emits onChange({ interviewerId, interviewDateTime (ISO),
 * durationMinutes }).
 */
const InterviewSlotPicker = ({
  interviewers = [],
  value = {},
  onChange,
  excludeInterviewId,
  durations = DEFAULT_DURATIONS,
}) => {
  const interviewerId = value.interviewerId || "";
  const duration = value.durationMinutes || 30;
  const selectedStart = value.interviewDateTime || "";

  const [date, setDate] = useState(() => isoToIstDate(selectedStart) || istDate());
  const [data, setData] = useState(null); // { slots, available, reason }
  const [loading, setLoading] = useState(false);

  const patch = (next) => onChange?.({ ...value, ...next });

  useEffect(() => {
    if (!interviewerId || !date) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getSlotsService(interviewerId, {
          date,
          duration,
          excludeInterviewId,
        });
        if (active) setData(res);
      } catch {
        if (active)
          setData({
            slots: [],
            available: false,
            reason: "Failed to load slots",
          });
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [interviewerId, date, duration, excludeInterviewId]);

  const freeSlots = (data?.slots || []).filter((s) => !s.booked && !s.past);

  const fieldClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white";
  const labelClass = "mb-1 block text-sm text-slate-600 dark:text-slate-300";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>
            Interviewer <span className="text-red-500">*</span>
          </label>
          <select
            value={interviewerId}
            onChange={(e) =>
              patch({ interviewerId: e.target.value, interviewDateTime: "" })
            }
            className={fieldClass}
          >
            <option value="">Select interviewer</option>
            {interviewers.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Duration</label>
          <select
            value={duration}
            onChange={(e) =>
              patch({
                durationMinutes: Number(e.target.value),
                interviewDateTime: "",
              })
            }
            className={fieldClass}
          >
            {durations.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Date</label>
          <div className="relative">
            <CalendarDays
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="date"
              value={date}
              min={istDate()}
              onChange={(e) => {
                setDate(e.target.value);
                patch({ interviewDateTime: "" });
              }}
              className={cn(fieldClass, "pl-9 dark:[color-scheme:dark]")}
            />
          </div>
        </div>
      </div>

      {/* Slots */}
      <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          <Clock size={15} />
          Available Slots
        </div>

        {!interviewerId ? (
          <p className="py-6 text-center text-sm text-slate-400">
            Select an interviewer to see free slots.
          </p>
        ) : loading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-400">
            <Loader2 size={16} className="animate-spin" />
            Loading slots…
          </div>
        ) : data && !data.available ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-amber-600 dark:text-amber-400">
            <AlertTriangle size={15} />
            {data.reason || "Not available"}
          </div>
        ) : freeSlots.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            No free slots for this day — try another date or duration.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {freeSlots.map((s) => {
              const selected = s.start === selectedStart;
              return (
                <button
                  key={s.start}
                  type="button"
                  onClick={() =>
                    patch({
                      interviewerId,
                      interviewDateTime: s.start,
                      durationMinutes: duration,
                    })
                  }
                  className={cn(
                    "rounded-lg border px-2 py-2 text-sm font-medium transition",
                    selected
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-300 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-indigo-500/10",
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewSlotPicker;
