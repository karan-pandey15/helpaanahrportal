import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Loader2, Save, Clock } from "lucide-react";
import Card from "@/components/ui/Card";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Loading from "@/components/Loading";
import RefreshButton from "@/components/ui/RefreshButton";
import { cn } from "@/utils/cls";
import useAuth from "@/hooks/useAuth";
import { getUsersByRole } from "@/features/interviews/interviewService";
import {
  getAvailabilityService,
  updateAvailabilityService,
} from "@/features/availability/availabilityService";

const WEEKDAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

const emptyForm = {
  enabled: true,
  startTime: "10:00",
  endTime: "20:00",
  weekdays: [1, 2, 3, 4, 5],
};

const Availability = () => {
  const { user, role } = useAuth();
  const isAdmin = role === "admin";

  const [interviewers, setInterviewers] = useState([]);
  const [selectedId, setSelectedId] = useState(isAdmin ? "" : user?.id || "");
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Admin: load the interviewer list to pick from.
  useEffect(() => {
    if (!isAdmin) return;
    getUsersByRole("interviewer")
      .then((res) => setInterviewers(res?.users || []))
      .catch(() => setInterviewers([]));
  }, [isAdmin]);

  // Load availability for the selected interviewer.
  const load = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const res = await getAvailabilityService(selectedId);
      setForm({ ...emptyForm, ...(res?.availability || {}) });
    } catch {
      setForm(emptyForm);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleWeekday = (d) =>
    setForm((p) => ({
      ...p,
      weekdays: p.weekdays.includes(d)
        ? p.weekdays.filter((x) => x !== d)
        : [...p.weekdays, d].sort(),
    }));

  const save = async () => {
    if (!selectedId) return toast.error("Select an interviewer");
    if (form.startTime >= form.endTime)
      return toast.error("Start time must be before end time");
    if (form.enabled && form.weekdays.length === 0)
      return toast.error("Select at least one working day");
    try {
      setSaving(true);
      await updateAvailabilityService(selectedId, form);
      toast.success("Availability saved");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  const fieldClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white";
  const labelClass = "mb-1 block text-sm text-slate-600 dark:text-slate-300";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Breadcrumbs />
        <RefreshButton onClick={load} loading={loading} />
      </div>

      <Card className="mb-6 bg-white dark:bg-slate-800">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-indigo-500" />
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            Interview Availability
          </h1>
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Set the working window and days. Bookable interview slots are generated
          inside this window, and already-booked times are hidden automatically.
        </p>
      </Card>

      {isAdmin && (
        <Card className="mb-6 bg-white dark:bg-slate-800">
          <label className={labelClass}>Interviewer</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className={cn(fieldClass, "sm:max-w-sm")}
          >
            <option value="">Select an interviewer</option>
            {interviewers.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>
        </Card>
      )}

      {selectedId &&
        (loading ? (
          <Card className="bg-white dark:bg-slate-800">
            <Loading />
          </Card>
        ) : (
          <Card className="bg-white dark:bg-slate-800">
            <label className="mb-5 flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) =>
                  setForm((p) => ({ ...p, enabled: e.target.checked }))
                }
                className="h-4 w-4"
              />
              <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Accepting interview bookings
              </span>
            </label>

            <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Start time</label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, startTime: e.target.value }))
                  }
                  className={cn(fieldClass, "dark:[color-scheme:dark]")}
                />
              </div>
              <div>
                <label className={labelClass}>End time</label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, endTime: e.target.value }))
                  }
                  className={cn(fieldClass, "dark:[color-scheme:dark]")}
                />
              </div>
            </div>

            <div className="mb-6">
              <label className={labelClass}>Working days</label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((d) => {
                  const on = form.weekdays.includes(d.value);
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleWeekday(d.value)}
                      className={cn(
                        "rounded-lg border px-4 py-2 text-sm font-medium transition",
                        on
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700",
                      )}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 pt-5 dark:border-slate-700">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Save size={15} />
                )}
                Save Availability
              </button>
            </div>
          </Card>
        ))}
    </div>
  );
};

export default Availability;
