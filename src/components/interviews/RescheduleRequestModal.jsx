import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import { X, CalendarClock, Clock } from "lucide-react";
import InterviewSlotPicker from "@/components/interviews/InterviewSlotPicker";
import {
  getUsersByRole,
  updateInterviewStatus,
} from "@/features/interviews/interviewService";
import { resolveInterviewRequestService } from "@/features/interviews/interviewRequestService";
import { fetchRoundsService } from "@/features/rounds/roundService";
import { roundRequiresMeetingLink } from "@/constant/interview-stages";
import { cn } from "@/utils/cls";

const formatDateTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
};

// Reschedule a candidate's interview directly from their reschedule request.
// Opens pre-filled with the interview's CURRENT round, interviewer, slot and
// meeting link. Saving updates the interview (keeping its round) — which sends
// the updated invite + bumps the calendar sequence — then approves the request.
const RescheduleRequestModal = ({ interview, request, onClose, onDone }) => {
  const [interviewers, setInterviewers] = useState([]);
  const [customRounds, setCustomRounds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    assignedInterviewer:
      interview?.assignedInterviewer?._id || interview?.assignedInterviewer || "",
    // Pre-fill the current slot so the picker opens on the right date; HR then
    // picks the new one.
    interviewDateTime: interview?.interviewDateTime
      ? new Date(interview.interviewDateTime).toISOString()
      : "",
    durationMinutes: interview?.durationMinutes || 30,
    meetingLink: interview?.meetingLink || "",
  }));

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    getUsersByRole("interviewer")
      .then((res) => setInterviewers(res?.users || []))
      .catch(() => setInterviewers([]));
    fetchRoundsService()
      .then((res) => setCustomRounds(res?.rounds || []))
      .catch(() => setCustomRounds([]));
  }, []);

  const round = interview?.round;
  const needsLink = roundRequiresMeetingLink(round, customRounds);
  const currentDateTime = interview?.interviewDateTime;
  const slotChanged =
    form.interviewDateTime &&
    (!currentDateTime ||
      new Date(form.interviewDateTime).getTime() !==
        new Date(currentDateTime).getTime());

  const handleSave = async () => {
    if (saving) return;
    if (!form.assignedInterviewer)
      return toast.error("Select an interviewer for this round");
    if (!form.interviewDateTime)
      return toast.error("Select the new interview slot");
    if (new Date(form.interviewDateTime) < new Date())
      return toast.error("The new time cannot be in the past");
    if (!slotChanged)
      return toast.error("Pick a new slot — the time is unchanged");
    if (needsLink && !form.meetingLink.trim())
      return toast.error("Meeting link is required for this round");

    try {
      setSaving(true);
      // 1) Reschedule the interview (same round) — triggers the updated invite.
      await updateInterviewStatus(interview._id, {
        interviewDateTime: new Date(form.interviewDateTime).toISOString(),
        assignedInterviewer: form.assignedInterviewer,
        durationMinutes: form.durationMinutes,
        meetingLink: form.meetingLink,
      });
      // 2) Mark the candidate's request as approved.
      await resolveInterviewRequestService(request._id, "approve");
      toast.success(
        "Interview rescheduled — the candidate will receive the updated invite.",
      );
      onDone?.();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to reschedule the interview",
      );
    } finally {
      setSaving(false);
    }
  };

  const labelClass = "mb-1 block text-sm text-slate-600 dark:text-slate-300";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-700">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
              <CalendarClock size={18} className="text-indigo-500" />
              Reschedule Interview
            </h3>
            <p className="truncate text-xs text-slate-400">
              {interview?.candidateName} · {interview?.position}
              {round ? ` · ${round}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          {/* Current time + candidate's preferred times */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <p className="mb-1 text-xs text-slate-400">Currently scheduled</p>
              <p className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                <Clock size={14} className="text-slate-400" />
                {formatDateTime(currentDateTime)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <p className="mb-1 text-xs text-slate-400">
                Candidate's preferred times
              </p>
              {request?.preferredSlots?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {request.preferredSlots.map((slot, i) => (
                    <span
                      key={i}
                      className="rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
                    >
                      {formatDateTime(slot)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">None provided</p>
              )}
            </div>
          </div>

          {/* Candidate's reason */}
          {request?.reason && (
            <div className="rounded-md border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/40">
              <p className="mb-1 text-xs text-slate-400">Candidate's reason</p>
              <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
                {request.reason}
              </p>
            </div>
          )}

          {/* New slot picker */}
          <div>
            <label className={labelClass}>
              Pick the new slot <span className="text-red-500">*</span>
            </label>
            <InterviewSlotPicker
              interviewers={interviewers}
              excludeInterviewId={interview?._id}
              value={{
                interviewerId: form.assignedInterviewer,
                interviewDateTime: form.interviewDateTime,
                durationMinutes: form.durationMinutes,
              }}
              onChange={(next) =>
                setForm((prev) => ({
                  ...prev,
                  assignedInterviewer: next.interviewerId,
                  interviewDateTime: next.interviewDateTime,
                  durationMinutes: next.durationMinutes,
                }))
              }
            />
          </div>

          {/* Meeting link */}
          <div>
            <label className={labelClass}>
              Meeting Link
              {needsLink && <span className="text-red-500"> *</span>}
            </label>
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none transition focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              placeholder="Enter meeting link"
              value={form.meetingLink}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, meetingLink: e.target.value }))
              }
            />
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  meetingLink: "https://meet.google.com/eeu-xnbf-yzb",
                }))
              }
              className="ml-1 mt-1 text-sm text-sky-500 underline hover:text-sky-700"
            >
              Click to use default meeting link
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "btn btn-primary disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            {saving ? "Rescheduling…" : "Reschedule & Approve"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default RescheduleRequestModal;
