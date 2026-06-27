import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  X,
  FileText,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  UserRound,
} from "lucide-react";
import {
  roundRequiresInterviewDate,
  roundRequiresMeetingLink,
  mergeRoundOptions,
} from "@/constant/interview-stages";
import {
  createInterviewService,
  getUsersByRole,
} from "@/features/interviews/interviewService";
import { fetchRoundsService } from "@/features/rounds/roundService";
import InterviewSlotPicker from "@/components/interviews/InterviewSlotPicker";
import { cn } from "@/utils/cls";

const POSITIONS = [
  "MERN Stack Developer",
  "React JS Developer",
  "Frontend Developer",
  "Backend Developer",
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Split-view modal: resume PDF preview on the left, an interview-scheduling form
// (pre-filled from the parsed resume) on the right. Submitting goes through the
// SAME createInterviewService flow as the Resume Upload screen, so the new
// interview shows up in the Interviews section immediately.
const ResumeScheduleModal = ({ resume, onClose, onScheduled }) => {
  // A candidate is already scheduled when an interview exists for this resume
  // (computed by the list endpoint). In that case we show the scheduled details
  // and link to the profile instead of letting the user create a duplicate.
  const alreadyScheduled = !!resume?.scheduled && !!resume?.interview;
  const interviewId = resume?.interview?._id;

  const [form, setForm] = useState(() => ({
    candidateName: resume?.candidateName || "",
    email: resume?.email || "",
    phone: resume?.phone || "",
    position: POSITIONS[0],
    currentCtc: resume?.currentCtc || "",
    expectedCtc: resume?.expectedCtc || "",
    experience: resume?.experience || "",
    // Reflect the scheduled round when one exists, so reopening doesn't
    // misleadingly show "Pending".
    round: resume?.interview?.round || "pending",
    joiningDate: "",
    interviewDateTime: "",
    assignedInterviewer: "",
    durationMinutes: 30,
    meetingLink: "",
    noticePeriod: resume?.noticePeriod || "",
    currentCompany: resume?.currentCompany || "",
    note: resume?.note || "",
  }));

  const [customRounds, setCustomRounds] = useState([]);
  const [interviewers, setInterviewers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Lock background scroll while the modal is open.
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // Rounds + interviewers for the dropdowns / slot picker.
  useEffect(() => {
    fetchRoundsService()
      .then((res) => setCustomRounds(res?.rounds || []))
      .catch(() => setCustomRounds([]));
    getUsersByRole("interviewer")
      .then((res) => setInterviewers(res?.users || []))
      .catch(() => setInterviewers([]));
  }, []);

  const roundOptions = mergeRoundOptions(customRounds);
  const allowsMeetingLink = roundRequiresInterviewDate(form.round, customRounds);
  const requiresInterviewDate = roundRequiresInterviewDate(form.round, customRounds);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (alreadyScheduled) {
      return toast.info(
        "This candidate already has a scheduled interview. Open their profile to make changes.",
      );
    }

    if (!form.candidateName.trim())
      return toast.error("Candidate name is required");
    if (!emailRegex.test(form.email))
      return toast.error("Valid email is required");
    if (!form.phone || form.phone.replace(/\D/g, "").length < 10)
      return toast.error("Valid phone number is required");
    if (!form.position.trim()) return toast.error("Position is required");

    const requiresMeetingLink = roundRequiresMeetingLink(form.round, customRounds);

    if (form.interviewDateTime) {
      if (new Date(form.interviewDateTime) < new Date())
        return toast.error("Interview date and time cannot be in the past");
    }
    if (requiresInterviewDate && !form.assignedInterviewer)
      return toast.error("Select an interviewer for this round");
    if (requiresInterviewDate && !form.interviewDateTime)
      return toast.error("Select an available interview slot");
    if (requiresMeetingLink && !form.meetingLink.trim())
      return toast.error("Meeting link is required for 1st and 2nd rounds");

    const payload = {
      ...form,
      joiningDate: form.joiningDate || null,
      interviewDateTime: form.interviewDateTime
        ? new Date(form.interviewDateTime).toISOString()
        : null,
      resumeUrl: resume?.resumeUrl || undefined,
    };

    try {
      setSubmitting(true);
      const res = await createInterviewService(payload);
      toast.success("Interview scheduled successfully");
      onScheduled?.(res);
      onClose?.();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to schedule interview",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-700 " +
    "border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white " +
    "focus:ring-2 focus:ring-indigo-500 outline-none transition";
  const labelClass = "block mb-1 text-sm text-slate-700 dark:text-slate-300";

  // Render through a portal to document.body. The page is wrapped in a
  // framer-motion <motion.div> whose transform creates a containing block for
  // fixed-position children — without the portal the overlay would be clipped to
  // the content area (offset by the sidebar) instead of covering the viewport.
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className="flex h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-700">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
              Schedule Interview
              {form.candidateName ? ` — ${form.candidateName}` : ""}
            </h3>
            <p className="truncate text-xs text-slate-400">
              {resume?.fileName || "Resume"}
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

        {/* Split body */}
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
          {/* Left — resume preview */}
          <div className="hidden min-h-0 flex-col border-r border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900 lg:flex">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 dark:border-slate-700">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                <FileText size={16} className="text-indigo-500" />
                Resume Preview
              </span>
              {resume?.resumeUrl && (
                <a
                  href={resume.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  <ExternalLink size={13} />
                  Open in new tab
                </a>
              )}
            </div>
            <div className="min-h-0 flex-1">
              {resume?.resumeUrl ? (
                <iframe
                  src={`${resume.resumeUrl}#view=FitH`}
                  title="Resume preview"
                  className="h-full w-full"
                />
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-400">
                  Resume file is not available for preview.
                </div>
              )}
            </div>
          </div>

          {/* Right — scheduling form */}
          <div className="min-h-0 overflow-y-auto p-5">
            {/* Already-scheduled banner */}
            {alreadyScheduled && (
              <div className="mb-5 flex items-start gap-3 rounded-lg border border-green-300 bg-green-50 p-4 dark:border-green-500/40 dark:bg-green-500/10">
                <CheckCircle2
                  size={20}
                  className="mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400"
                />
                <div className="text-sm">
                  <p className="font-semibold text-green-800 dark:text-green-300">
                    Interview already scheduled
                  </p>
                  <p className="mt-1 text-green-700 dark:text-green-200">
                    This candidate already has an interview
                    {resume?.interview?.round
                      ? ` in the "${resume.interview.round}" round`
                      : ""}
                    {resume?.interview?.status
                      ? ` · status: ${resume.interview.status}`
                      : ""}
                    . To change the round or details, open their profile.
                  </p>
                  {interviewId && (
                    <Link
                      to={`/candidate/${interviewId}`}
                      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      <UserRound size={14} />
                      View candidate profile
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Mobile-only "view resume" link (preview pane is hidden < lg) */}
            {resume?.resumeUrl && (
              <a
                href={resume.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-4 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline dark:text-indigo-400 lg:hidden"
              >
                <ExternalLink size={14} />
                View resume
              </a>
            )}

            {/* Detected skills */}
            {resume?.skills?.length > 0 && (
              <div className="mb-5 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <Sparkles size={15} className="text-indigo-500" />
                  Detected Skills
                </div>
                <div className="flex flex-wrap gap-2">
                  {resume.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Candidate Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={inputClass}
                    placeholder="Enter candidate name"
                    value={form.candidateName}
                    onChange={(e) => setField("candidateName", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    className={inputClass}
                    placeholder="Enter email address"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={inputClass}
                    placeholder="Enter 10-digit phone number"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Position <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={inputClass}
                    value={form.position}
                    onChange={(e) => setField("position", e.target.value)}
                  >
                    {POSITIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Total Experience (Years)</label>
                  <input
                    className={inputClass}
                    placeholder="Enter total experience"
                    value={form.experience}
                    onChange={(e) => setField("experience", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Current Company</label>
                  <input
                    className={inputClass}
                    placeholder="Enter current company"
                    value={form.currentCompany}
                    onChange={(e) => setField("currentCompany", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Current CTC (LPA)</label>
                  <input
                    className={inputClass}
                    placeholder="2.5"
                    value={form.currentCtc}
                    onChange={(e) => setField("currentCtc", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Expected CTC (LPA)</label>
                  <input
                    className={inputClass}
                    placeholder="3.5"
                    value={form.expectedCtc}
                    onChange={(e) => setField("expectedCtc", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Notice Period (Days)</label>
                  <input
                    className={inputClass}
                    placeholder="Enter notice period"
                    value={form.noticePeriod}
                    onChange={(e) => setField("noticePeriod", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Expected Joining Date</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={form.joiningDate}
                    onChange={(e) => setField("joiningDate", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Interview Round</label>
                  <select
                    className={inputClass}
                    value={form.round}
                    onChange={(e) => {
                      const round = e.target.value;
                      const allowsDate = roundRequiresInterviewDate(
                        round,
                        customRounds,
                      );
                      setForm((prev) => ({
                        ...prev,
                        round,
                        interviewDateTime: allowsDate
                          ? prev.interviewDateTime
                          : "",
                        meetingLink: allowsDate ? prev.meetingLink : "",
                      }));
                    }}
                  >
                    {roundOptions.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage.charAt(0).toUpperCase() + stage.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                {requiresInterviewDate && (
                  <div className="md:col-span-2">
                    <label className={labelClass}>
                      Interview Slot <span className="text-red-500">*</span>
                    </label>
                    <InterviewSlotPicker
                      interviewers={interviewers}
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
                )}
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Meeting Link
                    {roundRequiresMeetingLink(form.round, customRounds) && (
                      <span className="text-red-500"> *</span>
                    )}
                  </label>
                  <input
                    disabled={!allowsMeetingLink}
                    className={cn(
                      inputClass,
                      !allowsMeetingLink &&
                        "cursor-not-allowed bg-slate-100 dark:bg-slate-800",
                    )}
                    placeholder="Enter meeting link"
                    value={form.meetingLink}
                    onChange={(e) => setField("meetingLink", e.target.value)}
                  />
                  {allowsMeetingLink && (
                    <button
                      type="button"
                      onClick={() =>
                        setField(
                          "meetingLink",
                          "https://meet.google.com/eeu-xnbf-yzb",
                        )
                      }
                      className="ml-1 mt-1 text-sm text-sky-500 underline hover:text-sky-700"
                    >
                      Click to use default meeting link
                    </button>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Note <span className="text-xs text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    rows={4}
                    className={cn(inputClass, "resize-y")}
                    placeholder="Skills, profile links and any other details from the resume…"
                    value={form.note}
                    onChange={(e) => setField("note", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-outline-secondary"
                >
                  {alreadyScheduled ? "Close" : "Cancel"}
                </button>
                {alreadyScheduled ? (
                  interviewId && (
                    <Link to={`/candidate/${interviewId}`} className="btn btn-primary">
                      View Candidate Profile
                    </Link>
                  )
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Scheduling…" : "Schedule Interview"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ResumeScheduleModal;
