import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  LayoutDashboard,
  User,
  FileText,
  ListChecks,
  MessageSquare,
  History,
  Loader2,
  Send,
  ExternalLink,
  Download,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Banknote,
  Clock,
  CalendarDays,
  CheckCircle2,
  Circle,
  RefreshCw,
  Sparkles,
  Pencil,
  Save,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Loading from "@/components/Loading";
import RefreshButton from "@/components/ui/RefreshButton";
import UserAvatar from "@/assets/images/users/user.png";
import { cn } from "@/utils/cls";
import { formatDate } from "@/utils/date-time-formatter";
import useAuth from "@/hooks/useAuth";
import InterviewStages, {
  roundRequiresInterviewDate,
  roundRequiresMeetingLink,
  mergeRoundOptions,
} from "@/constant/interview-stages";
import {
  getInterviewByIdService,
  fetchInterviewActivityService,
  updateInterviewStatus,
  getUsersByRole,
} from "@/features/interviews/interviewService";
import InterviewSlotPicker from "@/components/interviews/InterviewSlotPicker";
import RequestBadge from "@/components/interviews/RequestBadge";
import {
  fetchRoundsService,
  createRoundService,
  deleteRoundService,
} from "@/features/rounds/roundService";
import { fetchComments, createComment } from "@/api/comment";

/* ------------------------------------------------------------------ *
 * Tabs are split into two flows. The "Candidate" group covers who the
 * person is (profile, details, resume); the "Interview Process" group
 * covers what happens to them in the pipeline (rounds, feedback,
 * updates). A divider between the groups makes the split explicit.
 * ------------------------------------------------------------------ */
const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, group: "candidate" },
  { id: "details", label: "Personal Details", icon: User, group: "candidate" },
  { id: "resume", label: "Resume", icon: FileText, group: "candidate" },
  { id: "rounds", label: "Interview Rounds", icon: ListChecks, group: "interview" },
  { id: "feedback", label: "Feedback", icon: MessageSquare, group: "interview" },
  { id: "updates", label: "Updates", icon: History, group: "interview" },
];

const ROUND_TONE = {
  pending: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  "1st round":
    "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  "2nd round":
    "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  "final round":
    "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  hired: "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  rejected: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  "offer declined":
    "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

const titleCase = (value) =>
  value
    ? value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "—";

const Badge = ({ value }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize",
      ROUND_TONE[value] ||
        "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    )}
  >
    {titleCase(value)}
  </span>
);

const CandidateProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const [candidate, setCandidate] = useState(null);

  // Admin may edit any candidate; HR may edit only the candidates they created.
  const canEdit =
    role === "admin" ||
    (role === "hr" &&
      !!candidate &&
      String(candidate.createdBy?.id ?? "") === String(user?.id ?? ""));

  // Custom rounds are global config — only admin may create / delete / manage
  // them. (HR can still move a candidate between rounds via the dropdown.)
  const canManageRounds = role === "admin";

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const loadCandidate = async () => {
    const res = await getInterviewByIdService(id);
    setCandidate(res?.interview || null);
  };

  const loadActivities = async () => {
    try {
      const res = await fetchInterviewActivityService(id);
      setActivities(res?.activities || []);
    } catch {
      setActivities([]);
    }
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      try {
        await Promise.all([loadCandidate(), loadActivities()]);
      } catch (err) {
        if (active)
          toast.error(
            err?.response?.data?.message || "Failed to load candidate",
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadCandidate(), loadActivities()]);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to refresh candidate");
    } finally {
      setRefreshing(false);
    }
  };

  const candidateTabs = TABS.filter((t) => t.group === "candidate");
  const interviewTabs = TABS.filter((t) => t.group === "interview");

  const TabButton = ({ tab }) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;
    return (
      <button
        type="button"
        onClick={() => setActiveTab(tab.id)}
        className={cn(
          "inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition",
          isActive
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700",
        )}
      >
        <Icon size={16} />
        {tab.label}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="py-20">
        <Loading />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-slate-500">Candidate not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-outline-secondary"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-indigo-600 dark:text-slate-400"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <RefreshButton onClick={handleRefresh} loading={refreshing} />
      </div>

      {/* Header */}
      <Card className="mb-6 bg-white dark:bg-slate-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img
              src={UserAvatar}
              alt={candidate.candidateName}
              className="h-16 w-16 rounded-full ring-2 ring-indigo-100 dark:ring-slate-700"
            />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                {candidate.candidateName || "—"}
                <RequestBadge type={candidate.pendingRequestType} />
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {candidate.position || "—"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge value={candidate.round} />
                {candidate.status && (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    {titleCase(candidate.status)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {candidate.resumeUrl && (
            <a
              href={candidate.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 sm:self-auto"
            >
              <Download size={16} />
              Resume
            </a>
          )}
        </div>
      </Card>

      {/* Tab bar — two flows separated by a divider */}
      <Card className="mb-6 bg-white dark:bg-slate-800">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Candidate flow */}
          <div className="flex items-center gap-1.5">
            <span className="mr-1 hidden text-[11px] font-semibold uppercase tracking-wide text-slate-400 xl:inline">
              Candidate
            </span>
            <div className="flex flex-wrap gap-1.5">
              {candidateTabs.map((tab) => (
                <TabButton key={tab.id} tab={tab} />
              ))}
            </div>
          </div>

          {/* Divider between the two flows */}
          <div
            aria-hidden
            className="hidden h-8 w-px shrink-0 bg-slate-200 dark:bg-slate-600 lg:block"
          />
          <div
            aria-hidden
            className="h-px w-full bg-slate-200 dark:bg-slate-600 lg:hidden"
          />

          {/* Interview flow */}
          <div className="flex items-center gap-1.5">
            <span className="mr-1 hidden text-[11px] font-semibold uppercase tracking-wide text-slate-400 xl:inline">
              Interview Process
            </span>
            <div className="flex flex-wrap gap-1.5">
              {interviewTabs.map((tab) => (
                <TabButton key={tab.id} tab={tab} />
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Tab content */}
      {activeTab === "overview" && (
        <OverviewTab
          candidate={candidate}
          onUpdated={async () => {
            await Promise.all([loadCandidate(), loadActivities()]);
          }}
        />
      )}
      {activeTab === "details" && (
        <DetailsTab
          candidate={candidate}
          canEdit={canEdit}
          onUpdated={async () => {
            await Promise.all([loadCandidate(), loadActivities()]);
          }}
        />
      )}
      {activeTab === "resume" && <ResumeTab candidate={candidate} />}
      {activeTab === "rounds" && (
        <RoundsTab
          candidate={candidate}
          activities={activities}
          canEdit={canEdit}
          canManageRounds={canManageRounds}
          canDelete={role === "admin"}
          onUpdated={async () => {
            await Promise.all([loadCandidate(), loadActivities()]);
          }}
        />
      )}
      {activeTab === "feedback" && <FeedbackTab candidateId={candidate._id} />}
      {activeTab === "updates" && <UpdatesTab activities={activities} />}
    </div>
  );
};

/* ============================== Overview ============================== */
const OverviewTab = ({ candidate, onUpdated }) => {
  const stats = [
    {
      icon: <Briefcase size={18} />,
      label: "Position",
      value: candidate.position,
    },
    {
      icon: <Clock size={18} />,
      label: "Experience",
      value: candidate.experience ? `${candidate.experience} yrs` : "—",
    },
    {
      icon: <Banknote size={18} />,
      label: "Expected CTC",
      value: candidate.expectedCtc ? `${candidate.expectedCtc} LPA` : "—",
    },
    {
      icon: <CalendarDays size={18} />,
      label: "Next Interview",
      value: formatDate(candidate.interviewDateTime),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="bg-white dark:bg-slate-800">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                {s.icon}
              </span>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {s.label}
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {s.value || "—"}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="bg-white dark:bg-slate-800">
          <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
            Contact
          </h3>
          <div className="space-y-3 text-sm">
            <IconRow icon={<Mail size={15} />} value={candidate.email} />
            <IconRow icon={<Phone size={15} />} value={candidate.phone} />
            <IconRow
              icon={<Building2 size={15} />}
              value={candidate.currentCompany}
            />
          </div>
        </Card>

        <StatusUpdateCard candidate={candidate} onUpdated={onUpdated} />
      </div>

      {candidate.note && (
        <Card className="bg-white dark:bg-slate-800">
          <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">
            Notes
          </h3>
          <p className="whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">
            {candidate.note}
          </p>
        </Card>
      )}
    </div>
  );
};

const StatusUpdateCard = ({ candidate, onUpdated }) => {
  const [status, setStatus] = useState(candidate.status || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (saving || status === (candidate.status || "")) return;
    try {
      setSaving(true);
      await updateInterviewStatus(candidate._id, { status });
      toast.success("Status updated");
      await onUpdated();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-white dark:bg-slate-800">
      <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
        Status
      </h3>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          placeholder="e.g. In Process, On Hold…"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
        />
        <button
          type="button"
          onClick={save}
          disabled={saving || status === (candidate.status || "")}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : null}
          Save
        </button>
      </div>
    </Card>
  );
};

const IconRow = ({ icon, value }) => (
  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
    <span className="text-slate-400">{icon}</span>
    <span className="break-all">{value || "—"}</span>
  </div>
);

/* ============================ Personal Details ============================ */
// Fields admin/HR may edit. `type` drives the input rendering; read-only meta
// (created by / registered on) is shown but never editable.
const EDITABLE_FIELDS = [
  { key: "candidateName", label: "Full Name", type: "text" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Phone", type: "text" },
  { key: "position", label: "Position", type: "text" },
  { key: "experience", label: "Total Experience (yrs)", type: "text" },
  { key: "currentCompany", label: "Current Company", type: "text" },
  { key: "currentCtc", label: "Current CTC (LPA)", type: "text" },
  { key: "expectedCtc", label: "Expected CTC (LPA)", type: "text" },
  { key: "noticePeriod", label: "Notice Period (days)", type: "text" },
  { key: "joiningDate", label: "Expected Joining", type: "date" },
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// "2024-05-01T00:00:00Z" → "2024-05-01" for a date input.
const toDateInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const buildForm = (candidate) =>
  EDITABLE_FIELDS.reduce((acc, f) => {
    acc[f.key] =
      f.type === "date"
        ? toDateInput(candidate[f.key])
        : candidate[f.key] ?? "";
    return acc;
  }, {});

const DetailsTab = ({ candidate, canEdit, onUpdated }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => buildForm(candidate));

  useEffect(() => {
    if (!editing) setForm(buildForm(candidate));
  }, [candidate, editing]);

  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const cancel = () => {
    setForm(buildForm(candidate));
    setEditing(false);
  };

  const save = async () => {
    if (saving) return;
    if (!form.candidateName.trim())
      return toast.error("Candidate name is required");
    if (!emailRegex.test(form.email))
      return toast.error("A valid email is required");
    if (form.phone && form.phone.replace(/\D/g, "").length < 10)
      return toast.error("Phone must be at least 10 digits");

    // Only send fields that actually changed.
    const original = buildForm(candidate);
    const payload = {};
    EDITABLE_FIELDS.forEach((f) => {
      const next = typeof form[f.key] === "string" ? form[f.key].trim() : form[f.key];
      if (next !== original[f.key]) payload[f.key] = next;
    });

    if (Object.keys(payload).length === 0) {
      setEditing(false);
      return;
    }

    try {
      setSaving(true);
      await updateInterviewStatus(candidate._id, payload);
      toast.success("Details updated");
      setEditing(false);
      await onUpdated();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update details");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white";

  // Read-only display value (with units) when not editing.
  const displayValue = (f) => {
    const v = candidate[f.key];
    if (f.type === "date") return formatDate(v);
    if (!v) return "—";
    if (f.key === "experience") return `${v} yrs`;
    if (f.key === "currentCtc" || f.key === "expectedCtc") return `${v} LPA`;
    if (f.key === "noticePeriod") return `${v} days`;
    return v;
  };

  return (
    <Card className="bg-white dark:bg-slate-800">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          Personal &amp; Professional Details
        </h3>
        {canEdit &&
          (editing ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancel}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <X size={15} />
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Save size={15} />
                )}
                Save
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-indigo-600 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Pencil size={15} />
              Edit
            </button>
          ))}
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {EDITABLE_FIELDS.map((f) => (
          <div key={f.key}>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              {f.label}
            </p>
            {editing ? (
              <input
                type={f.type === "date" ? "date" : f.type}
                value={form[f.key]}
                onChange={(e) => setField(f.key, e.target.value)}
                className={inputClass}
              />
            ) : (
              <p className="mt-1 font-medium text-slate-800 dark:text-slate-100">
                {displayValue(f)}
              </p>
            )}
          </div>
        ))}

        {/* Read-only metadata */}
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Created By
          </p>
          <p className="mt-1 font-medium text-slate-800 dark:text-slate-100">
            {candidate.createdBy?.name || "—"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Registered On
          </p>
          <p className="mt-1 font-medium text-slate-800 dark:text-slate-100">
            {formatDate(candidate.createdAt)}
          </p>
        </div>
      </div>
    </Card>
  );
};

/* ================================ Resume ================================ */
const ResumeTab = ({ candidate }) => {
  if (!candidate.resumeUrl) {
    return (
      <Card className="bg-white dark:bg-slate-800">
        <div className="py-16 text-center">
          <FileText className="mx-auto mb-3 text-slate-300" size={40} />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No resume on file for this candidate.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-indigo-500" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Resume
          </h3>
        </div>
        <a
          href={candidate.resumeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          <ExternalLink size={14} />
          Open in new tab
        </a>
      </div>
      <div className="h-[70vh] w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
        <iframe
          title="Resume"
          src={candidate.resumeUrl}
          className="h-full w-full"
        />
      </div>
    </Card>
  );
};

/* ============================ Interview Rounds ============================ */
// The candidate's current booking expressed as a slot-picker value.
const candidateSlot = (c) => ({
  interviewerId:
    (c.assignedInterviewer &&
      (c.assignedInterviewer._id || c.assignedInterviewer)) ||
    "",
  interviewDateTime: c.interviewDateTime
    ? new Date(c.interviewDateTime).toISOString()
    : "",
  durationMinutes: c.durationMinutes || 30,
});

// The round history is reconstructed from the activity log: every audit entry
// whose changed field is "round" is a transition. We render those as a
// timeline. Admin/HR can advance the round (booking an interviewer slot for
// interview-type rounds) and manage the global list of custom rounds.
const RoundsTab = ({
  candidate,
  activities,
  canEdit,
  canManageRounds,
  canDelete,
  onUpdated,
}) => {
  const [customRounds, setCustomRounds] = useState([]);
  const [interviewers, setInterviewers] = useState([]);
  const [round, setRound] = useState(candidate.round || "pending");
  const [slot, setSlot] = useState(() => candidateSlot(candidate));
  const [meetingLink, setMeetingLink] = useState(candidate.meetingLink || "");
  const [saving, setSaving] = useState(false);

  // Inline "add custom round"
  const [newRoundName, setNewRoundName] = useState("");
  const [newRoundSendMail, setNewRoundSendMail] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadRounds = async () => {
    try {
      const res = await fetchRoundsService();
      setCustomRounds(res?.rounds || []);
    } catch {
      setCustomRounds([]);
    }
  };

  useEffect(() => {
    loadRounds();
    getUsersByRole("interviewer")
      .then((res) => setInterviewers(res?.users || []))
      .catch(() => setInterviewers([]));
  }, []);

  // Reset the editable controls whenever the underlying candidate changes.
  useEffect(() => {
    setRound(candidate.round || "pending");
    setSlot(candidateSlot(candidate));
    setMeetingLink(candidate.meetingLink || "");
  }, [
    candidate.round,
    candidate.interviewDateTime,
    candidate.meetingLink,
    candidate.assignedInterviewer,
    candidate.durationMinutes,
  ]);

  const roundOptions = useMemo(
    () => mergeRoundOptions(customRounds),
    [customRounds],
  );

  const requiresDate = roundRequiresInterviewDate(round, customRounds);
  const requiresLink = roundRequiresMeetingLink(round, customRounds);
  const original = candidateSlot(candidate);
  const dirty =
    round !== candidate.round ||
    (requiresDate &&
      (slot.interviewDateTime !== original.interviewDateTime ||
        slot.interviewerId !== original.interviewerId ||
        slot.durationMinutes !== original.durationMinutes)) ||
    (requiresLink && meetingLink !== (candidate.meetingLink || ""));

  const timeline = useMemo(() => {
    const entries = (activities || [])
      .map((a) => {
        // A round change may be a grouped change (inside `changes`) or a legacy
        // top-level single-field entry. Detect either.
        const roundChange =
          (a.changes || []).find((c) => c.fieldName === "round") ||
          (a.fieldChanged === "round"
            ? { newValue: a.newValue, oldValue: a.oldValue }
            : null);
        if (!roundChange || !roundChange.newValue) return null;
        return {
          round: roundChange.newValue,
          from: roundChange.oldValue,
          by: a.performedBy,
          at: a.performedAt,
          action: a.actionType,
        };
      })
      .filter(Boolean);
    // Activities arrive newest-first; show oldest-first for a natural timeline.
    return entries.reverse();
  }, [activities]);

  const advance = async () => {
    if (saving || !dirty) return;

    if (requiresDate && !slot.interviewerId)
      return toast.error("Select an interviewer");
    if (requiresDate && !slot.interviewDateTime)
      return toast.error("Select an available interview slot");
    if (requiresLink && !meetingLink.trim())
      return toast.error("Meeting link is required for this round");
    if (slot.interviewDateTime && new Date(slot.interviewDateTime) < new Date())
      return toast.error("Interview slot cannot be in the past");

    const payload = { round };
    if (requiresDate) {
      payload.interviewDateTime = slot.interviewDateTime;
      payload.assignedInterviewer = slot.interviewerId;
      payload.durationMinutes = slot.durationMinutes;
    }
    if (requiresLink) payload.meetingLink = meetingLink.trim();

    try {
      setSaving(true);
      await updateInterviewStatus(candidate._id, payload);
      toast.success("Round updated");
      await onUpdated();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update round");
    } finally {
      setSaving(false);
    }
  };

  const addCustomRound = async (e) => {
    e.preventDefault();
    const name = newRoundName.trim();
    if (creating || !name) return;
    try {
      setCreating(true);
      await createRoundService(name, newRoundSendMail);
      setNewRoundName("");
      setNewRoundSendMail(false);
      await loadRounds();
      setRound(name); // select the freshly created round
      toast.success(`Round “${name}” created`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create round");
    } finally {
      setCreating(false);
    }
  };

  const removeCustomRound = async (r) => {
    try {
      await deleteRoundService(r._id);
      await loadRounds();
      toast.success(`Round “${r.name}” deleted`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete round");
    }
  };

  const fieldClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white";

  return (
    <div className="space-y-6">
      {/* Advance round */}
      <Card className="bg-white dark:bg-slate-800">
        <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
          Current Round
        </h3>

        {canEdit ? (
          <>
            <div className="space-y-4">
              <div className="sm:max-w-xs">
                <label className="mb-1 block text-sm text-slate-600 dark:text-slate-300">
                  Round
                </label>
                <select
                  value={round}
                  onChange={(e) => setRound(e.target.value)}
                  className={cn(fieldClass, "capitalize")}
                >
                  {roundOptions.map((stage) => (
                    <option key={stage} value={stage}>
                      {titleCase(stage)}
                    </option>
                  ))}
                </select>
              </div>

              {requiresDate && (
                <InterviewSlotPicker
                  interviewers={interviewers}
                  value={slot}
                  onChange={setSlot}
                  excludeInterviewId={candidate._id}
                />
              )}

              {requiresLink && (
                <div>
                  <label className="mb-1 block text-sm text-slate-600 dark:text-slate-300">
                    Meeting Link <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://meet.google.com/…"
                    className={fieldClass}
                  />
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={advance}
                disabled={saving || !dirty}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <RefreshCw size={15} />
                )}
                Update Round
              </button>
              <p className="text-xs text-slate-400">
                Interview rounds send the candidate a calendar invite and are
                logged below.
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Current round:{" "}
            <span className="font-semibold">{titleCase(candidate.round)}</span>
          </p>
        )}
      </Card>

      {/* Custom rounds management (admin/HR) */}
      {canManageRounds && (
        <Card className="bg-white dark:bg-slate-800">
          <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">
            Custom Rounds
          </h3>
          <p className="mb-4 text-xs text-slate-400">
            Add your own rounds (e.g. “Manager Round”). Tick “Send email” to make
            it an interview round that schedules a slot and emails the candidate;
            leave it off for a neutral marker round (e.g. “Reschedule”,
            “Cancelled”) that just moves the candidate with no email.
          </p>

          <form onSubmit={addCustomRound} className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={newRoundName}
                onChange={(e) => setNewRoundName(e.target.value)}
                placeholder="New round name"
                className={cn(fieldClass, "sm:max-w-xs")}
              />
              <button
                type="submit"
                disabled={creating || !newRoundName.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Plus size={15} />
                )}
                Add Round
              </button>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={newRoundSendMail}
                onChange={(e) => setNewRoundSendMail(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Send email to the candidate when they’re moved into this round
            </label>
          </form>

          {customRounds.filter((r) => !r.isBuiltin).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {customRounds
                .filter((r) => !r.isBuiltin)
                .map((r) => (
                <span
                  key={r._id}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                >
                  {r.name}
                  {r.sendMail && (
                    <span
                      title="Emails the candidate when entered"
                      className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
                    >
                      ✉ Email
                    </span>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      title="Delete round"
                      onClick={() => removeCustomRound(r)}
                      className="text-slate-400 transition hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Round history timeline */}
      <Card className="bg-white dark:bg-slate-800">
        <h3 className="mb-5 text-base font-semibold text-slate-900 dark:text-white">
          Round History
        </h3>
        {timeline.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No round changes recorded yet. Current round:{" "}
              <span className="font-semibold capitalize">
                {titleCase(candidate.round)}
              </span>
            </p>
          </div>
        ) : (
          <ol className="relative space-y-6 border-l border-slate-200 pl-6 dark:border-slate-700">
            {timeline.map((step, i) => {
              const isCurrent = i === timeline.length - 1;
              return (
                <li key={i} className="relative">
                  <span
                    className={cn(
                      "absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-800",
                      isCurrent
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-200 text-slate-500 dark:bg-slate-600",
                    )}
                  >
                    {isCurrent ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <Circle size={8} />
                    )}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge value={step.round} />
                    {step.from && (
                      <span className="text-xs text-slate-400">
                        from {titleCase(step.from)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {step.at}
                    {step.by ? ` · by ${step.by}` : ""}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </Card>
    </div>
  );
};

/* =============================== Feedback =============================== */
const FeedbackTab = ({ candidateId }) => {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const load = async () => {
    try {
      const data = await fetchComments(candidateId);
      setComments(data?.data || []);
    } catch {
      toast.error("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateId]);

  const submit = async (e) => {
    e.preventDefault();
    if (posting || !text.trim()) return;
    try {
      setPosting(true);
      await createComment({ commentedOn: candidateId, content: text.trim() });
      setText("");
      await load();
      toast.success("Feedback added");
    } catch {
      toast.error("Failed to add feedback");
    } finally {
      setPosting(false);
    }
  };

  return (
    <Card className="bg-white dark:bg-slate-800">
      <h3 className="mb-5 text-base font-semibold text-slate-900 dark:text-white">
        Feedback History
      </h3>

      <form onSubmit={submit} className="mb-6 flex items-start gap-3">
        <img src={UserAvatar} className="h-9 w-9 rounded-full" alt="" />
        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share interview feedback…"
          className="flex-1 resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
        />
        <button
          type="submit"
          disabled={posting || !text.trim()}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {posting ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Send size={15} />
          )}
          Post
        </button>
      </form>

      {loading ? (
        <Loading />
      ) : comments.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">
          No feedback yet.
        </p>
      ) : (
        <ul className="space-y-5">
          {comments.map((c) => (
            <li key={c._id} className="flex gap-3">
              <img src={UserAvatar} className="h-9 w-9 rounded-full" alt="" />
              <div className="flex-1 rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-700/50">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {c.commentedBy?.name || "User"}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDate(c.createdAt)}
                  </span>
                </div>
                <p className="whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">
                  {c.content}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

/* =============================== Updates =============================== */
const UpdatesTab = ({ activities }) => (
  <Card className="bg-white dark:bg-slate-800">
    <h3 className="mb-5 text-base font-semibold text-slate-900 dark:text-white">
      Activity & Updates
    </h3>
    {!activities || activities.length === 0 ? (
      <p className="py-10 text-center text-sm text-slate-400">
        No activity recorded yet.
      </p>
    ) : (
      <ol className="relative space-y-6 border-l border-slate-200 pl-6 dark:border-slate-700">
        {activities.map((a) => (
          <li key={a.activityId} className="relative">
            <span className="absolute -left-[29px] mt-1 h-3 w-3 rounded-full bg-slate-300 ring-4 ring-white dark:bg-slate-600 dark:ring-slate-800" />
            <p className="text-sm text-slate-700 dark:text-slate-200">
              {a.message || a.description || titleCase(a.actionType)}
            </p>
            {a.changes?.length > 1 && (
              <ul className="mt-1 space-y-0.5">
                {a.changes.map((c, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-slate-500 dark:text-slate-400"
                  >
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      {c.fieldName}
                    </span>
                    : {String(c.oldValue)} → {String(c.newValue)}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-1 text-xs text-slate-400">
              {a.performedAt}
              {a.performedBy ? ` · ${a.performedBy}` : ""}
            </p>
          </li>
        ))}
      </ol>
    )}
  </Card>
);

export default CandidateProfile;
