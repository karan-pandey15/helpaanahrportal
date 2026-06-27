import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Plus, Trash2, Loader2, Mail, Bell } from "lucide-react";
import Card from "@/components/ui/Card";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Loading from "@/components/Loading";
import RefreshButton from "@/components/ui/RefreshButton";
import {
  fetchRoundsService,
  createRoundService,
  updateRoundService,
  deleteRoundService,
} from "@/features/rounds/roundService";

// The kind of email a round sends when its toggle is on (mirrors the backend
// roundMailType). Shown so admins understand what "Send email" means per round.
const mailTypeLabel = (name) => {
  const r = (name || "").trim().toLowerCase();
  if (r === "rejected") return "Rejection email";
  if (r === "hired") return "Offer / hiring email";
  if (r === "pending" || r === "offer declined") return "No email available";
  return "Interview invite";
};

const titleCase = (v) =>
  (v || "").replace(/\b\w/g, (c) => c.toUpperCase());

export default function RoundSettings({ embedded = false }) {
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [newRoundName, setNewRoundName] = useState("");
  const [newRoundSendMail, setNewRoundSendMail] = useState(false);
  const [newRoundSendReminder, setNewRoundSendReminder] = useState(false);
  const [creating, setCreating] = useState(false);
  const [templateRound, setTemplateRound] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchRoundsService();
      setRounds(data?.rounds || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load rounds");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleMail = async (round) => {
    const id = round._id || round.id;
    try {
      setSavingId(id);
      await updateRoundService(id, { sendMail: !round.sendMail });
      setRounds((prev) =>
        prev.map((r) =>
          (r._id || r.id) === id ? { ...r, sendMail: !r.sendMail } : r,
        ),
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update round");
    } finally {
      setSavingId(null);
    }
  };

  const toggleReminder = async (round) => {
    const id = round._id || round.id;
    try {
      setSavingId(id);
      await updateRoundService(id, { sendReminder: !round.sendReminder });
      setRounds((prev) =>
        prev.map((r) =>
          (r._id || r.id) === id ? { ...r, sendReminder: !r.sendReminder } : r,
        ),
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update round");
    } finally {
      setSavingId(null);
    }
  };

  const addRound = async (e) => {
    e.preventDefault();
    const name = newRoundName.trim();
    if (creating || !name) return;
    try {
      setCreating(true);
      await createRoundService(name, newRoundSendMail, newRoundSendReminder);
      setNewRoundName("");
      setNewRoundSendMail(false);
      setNewRoundSendReminder(false);
      await load();
      toast.success(`Round “${name}” created`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create round");
    } finally {
      setCreating(false);
    }
  };

  const removeRound = async (round) => {
    const id = round._id || round.id;
    try {
      await deleteRoundService(id);
      await load();
      toast.success(`Round “${round.name}” deleted`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete round");
    }
  };

  return (
    <div>
      {!embedded && (
        <div className="mb-6">
          <Breadcrumbs />
        </div>
      )}

      <Card className="bg-white dark:bg-slate-800 mb-6">
        <div className="mb-1 flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Round & Email Settings
          </h3>
          <RefreshButton onClick={load} loading={loading} />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
          Control whether moving a candidate into each round sends them an email,
          and whether they get a “starts in ~30 minutes” reminder while in that
          round. Turn <span className="font-medium">Send reminder</span> on only
          for actual interview rounds — keep it off for marker rounds (e.g.
          “Reschedule”, “Cancelled”, “Hold”) so candidates aren’t reminded for an
          interview that isn’t happening. Built-in rounds can be toggled but not
          renamed or deleted.
        </p>

        {/* Add custom round */}
        <form
          onSubmit={addRound}
          className="flex flex-col gap-3 sm:flex-row sm:items-center border-b border-slate-100 dark:border-slate-700 pb-5 mb-5"
        >
          <input
            value={newRoundName}
            onChange={(e) => setNewRoundName(e.target.value)}
            placeholder="New custom round name (e.g. Manager Round)"
            className="w-full sm:max-w-xs px-4 py-2 rounded-lg border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={newRoundSendMail}
              onChange={(e) => setNewRoundSendMail(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Send email
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={newRoundSendReminder}
              onChange={(e) => setNewRoundSendReminder(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Send reminder
          </label>
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
        </form>

        {loading ? (
          <Loading />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-700 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-200">
                <tr>
                  <th className="px-4 py-3">Round</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Email on entry</th>
                  <th className="px-4 py-3 text-center">Send email</th>
                  <th className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center gap-1">
                      <Bell size={13} />
                      Send reminder
                    </span>
                  </th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                {rounds.map((round) => {
                  const id = round._id || round.id;
                  return (
                    <tr key={id} className="text-slate-700 dark:text-slate-200">
                      <td className="px-4 py-3 font-medium capitalize">
                        {round.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            round.isBuiltin
                              ? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                              : "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
                          }`}
                        >
                          {round.isBuiltin ? "Built-in" : "Custom"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {mailTypeLabel(round.name)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          disabled={savingId === id}
                          onClick={() => toggleMail(round)}
                          role="switch"
                          aria-checked={!!round.sendMail}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition disabled:opacity-50 ${
                            round.sendMail ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              round.sendMail ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          disabled={savingId === id}
                          onClick={() => toggleReminder(round)}
                          role="switch"
                          aria-checked={!!round.sendReminder}
                          title="Send a ~30-minute interview reminder for this round"
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition disabled:opacity-50 ${
                            round.sendReminder ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-600"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              round.sendReminder ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {round.isBuiltin ? (
                          <div className="text-center text-xs text-slate-300 dark:text-slate-600">
                            —
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-3">
                            <button
                              type="button"
                              title="Edit email template"
                              onClick={() => setTemplateRound(round)}
                              className={`transition hover:text-indigo-600 ${
                                round.emailSubject || round.emailBody
                                  ? "text-indigo-500"
                                  : "text-slate-400"
                              }`}
                            >
                              <Mail size={16} />
                            </button>
                            <button
                              type="button"
                              title="Delete round"
                              onClick={() => removeRound(round)}
                              className="text-slate-400 transition hover:text-red-500"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {templateRound && (
        <TemplateModal
          round={templateRound}
          onClose={() => setTemplateRound(null)}
          onSaved={(updated) => {
            setRounds((prev) =>
              prev.map((r) =>
                (r._id || r.id) === (updated._id || updated.id)
                  ? { ...r, ...updated }
                  : r,
              ),
            );
            setTemplateRound(null);
          }}
        />
      )}
    </div>
  );
}

const PLACEHOLDERS = [
  "{{candidateName}}",
  "{{position}}",
  "{{round}}",
  "{{date}}",
  "{{time}}",
  "{{meetingLink}}",
  "{{duration}}",
];

function TemplateModal({ round, onClose, onSaved }) {
  const id = round._id || round.id;
  const [subject, setSubject] = useState(round.emailSubject || "");
  const [body, setBody] = useState(round.emailBody || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const save = async () => {
    if (saving) return;
    try {
      setSaving(true);
      const data = await updateRoundService(id, {
        emailSubject: subject,
        emailBody: body,
      });
      toast.success("Template saved");
      onSaved?.({ ...(data?.round || {}), _id: id, emailSubject: subject, emailBody: body });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold capitalize">
            Email Template — {round.name}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            This email is sent when a candidate is moved into{" "}
            <span className="font-medium capitalize">{round.name}</span> (and the
            round’s “Send email” toggle is on). If an interview date and meeting
            link are set, a calendar invite is attached automatically. Leave both
            fields blank to use the default interview-invite email.
          </p>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-600 dark:text-slate-300">
              Subject
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Your {{round}} interview for {{position}}"
              className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-600 dark:text-slate-300">
              Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              placeholder={
                "Dear {{candidateName}},\n\nYou're invited to your {{round}} interview for {{position}} on {{date}} at {{time}}.\n\nBest regards,\nHR Team"
              }
              className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Click to insert a placeholder:
            </p>
            <div className="flex flex-wrap gap-2">
              {PLACEHOLDERS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setBody((b) => `${b}${p}`)}
                  className="rounded-md border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-2 py-1 text-xs font-mono text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? "Saving..." : "Save Template"}
          </button>
        </div>
      </div>
    </div>
  );
}
