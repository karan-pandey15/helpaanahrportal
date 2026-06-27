import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import {
  createInterview,
  updateInterview,
} from "@/features/interviews/interviewSlice";
import { toast } from "react-toastify";
import {
  InterviewStageByLvl,
  roundRequiresInterviewDate,
  roundRequiresMeetingLink,
  mergeRoundOptions,
} from "../../constant/interview-stages";
import { fetchRoundsService } from "@/features/rounds/roundService";
import { getUsersByRole } from "@/features/interviews/interviewService";
import InterviewSlotPicker from "@/components/interviews/InterviewSlotPicker";

const AddInterview = ({ onClose, editInterview }) => {
  const dispatch = useDispatch();
  const scrollRef = useRef(null);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    candidateName: "",
    email: "",
    phone: "",
    position: "MERN Stack Developer",
    currentCtc: "",
    expectedCtc: "",
    experience: "",
    round: "pending",
    joiningDate: null,
    meetingLink: "",
    noticePeriod: "",
    currentCompany: "",
    interviewDateTime: "",
    assignedInterviewer: "",
    durationMinutes: 30,
  });

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Admin/HR custom rounds + interviewers for the dropdowns / slot picker.
  const [customRounds, setCustomRounds] = useState([]);
  const [interviewers, setInterviewers] = useState([]);
  useEffect(() => {
    fetchRoundsService()
      .then((res) => setCustomRounds(res?.rounds || []))
      .catch(() => setCustomRounds([]));
    getUsersByRole("interviewer")
      .then((res) => setInterviewers(res?.users || []))
      .catch(() => setInterviewers([]));
  }, []);
  const roundOptions = mergeRoundOptions(customRounds);

  useEffect(() => {
    if (!editInterview) return;

    setForm({
      candidateName: editInterview?.candidateName || "",
      email: editInterview?.email || "",
      phone: editInterview?.phone || "",
      position: editInterview?.position || "",
      currentCtc: editInterview?.currentCtc || "",
      expectedCtc: editInterview?.expectedCtc || "",
      experience: editInterview?.experience || "",
      round: editInterview?.round || "pending",
      joiningDate: editInterview?.joiningDate
        ? new Date(editInterview?.joiningDate).toISOString().slice(0, 10)
        : null,
      interviewDateTime: editInterview?.interviewDateTime
        ? new Date(editInterview.interviewDateTime).toISOString()
        : "",
      meetingLink: editInterview?.meetingLink || "",
      noticePeriod: editInterview?.noticePeriod || "",
      currentCompany: editInterview?.currentCompany || "",
      assignedInterviewer:
        editInterview?.assignedInterviewer?._id ||
        editInterview?.assignedInterviewer ||
        "",
      durationMinutes: editInterview?.durationMinutes || 30,
    });
  }, [editInterview]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [editInterview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (loading) return;
      setLoading(true);
      if (!form.candidateName.trim()) {
        toast.error("Candidate name is required");
        return setLoading(false);
      }

      if (!emailRegex.test(form.email)) {
        toast.error("Valid email is required");
        return setLoading(false);
      }

      if (!form.phone || form.phone.length < 10) {
        toast.error("Valid phone number is required");
        return setLoading(false);
      }

      if (!form.position.trim()) {
        toast.error("Position is required");
        return setLoading(false);
      }

      if (form.interviewDateTime) {
        const interviewDateTime = new Date(form.interviewDateTime);
        if (interviewDateTime < new Date()) {
          toast.error("Interview date and time cannot be in the past");
          return setLoading(false);
        }
      }

      let payload = {
        ...form,
        interviewDateTime: form.interviewDateTime
          ? new Date(form.interviewDateTime).toISOString()
          : (editInterview?.interviewDateTime ?? null),
      };

      const requiresInterviewDate = roundRequiresInterviewDate(form.round, customRounds);
      const requiresMeetingLink = roundRequiresMeetingLink(form.round, customRounds);

      if (requiresInterviewDate && !form.assignedInterviewer) {
        toast.error("Select an interviewer for this round");
        return setLoading(false);
      }

      if (
        requiresInterviewDate &&
        (!payload.interviewDateTime ||
          payload.interviewDateTime === null ||
          payload.interviewDateTime === undefined ||
          payload.interviewDateTime === "null" ||
          payload.interviewDateTime === "")
      ) {
        toast.error("Select an available interview slot");
        return setLoading(false);
      }

      if (requiresMeetingLink && !form.meetingLink.trim()) {
        toast.error("Meeting link is required for 1st and 2nd rounds");
        return setLoading(false);
      }

      let focusInterviewId = null;
      let isAdd = false;

      if (editInterview) {
        let getUpdatedFields = {};
        for (const key in payload) {
          if (payload[key] !== editInterview[key]) {
            getUpdatedFields[key] = payload[key];
          }
        }
        if (Object.keys(getUpdatedFields).length === 0) {
          toast.info("No changes made to update");
          return setLoading(false);
        }
        payload = getUpdatedFields;

        await dispatch(
          updateInterview({
            id: editInterview._id,
            payload,
          }),
        ).unwrap();
        toast.success("Interview updated successfully.");
        focusInterviewId = editInterview._id;
      } else {
        const result = await dispatch(createInterview(payload)).unwrap();
        focusInterviewId = result?._id;
        isAdd = true;
      }

      onClose?.({ focusInterviewId, isAdd });
    } catch (err) {
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2 rounded-lg border " +
    "bg-white dark:bg-slate-700 " +
    "border-slate-300 dark:border-slate-600 " +
    "text-slate-900 dark:text-white " +
    "focus:ring-2 focus:ring-indigo-500 outline-none transition";

  const labelClass = "block mb-1 text-sm text-slate-700 dark:text-slate-300";

  const requiresInterviewDate = roundRequiresInterviewDate(form.round, customRounds);
  const requiresMeetingLink = roundRequiresMeetingLink(form.round, customRounds);
  const allowsMeetingLink = roundRequiresInterviewDate(form.round, customRounds);
  const isMeetingDisabled = !allowsMeetingLink;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    if (
      (form.round === InterviewStageByLvl.FIRSTROUND ||
        form.round === InterviewStageByLvl.SECONDROUND) &&
      !form.meetingLink
    ) {
      setField("meetingLink", "https://meet.google.com/eeu-xnbf-yzb");
    }
  }, [form.round]);

  useEffect(() => {
    if (!requiresInterviewDate && form.interviewDateTime) {
      setField("interviewDateTime", "");
    }

    if (!allowsMeetingLink && form.meetingLink) {
      setField("meetingLink", "");
    }
  }, [
    form.interviewDateTime,
    form.meetingLink,
    allowsMeetingLink,
    requiresInterviewDate,
    requiresMeetingLink,
  ]);

  const minDate = new Date().toISOString().split("T")[0];

  const submitBtnLabel = editInterview
    ? loading
      ? "Updating..."
      : "Update Interview"
    : loading
      ? "Scheduling..."
      : "Schedule Interview";

  return (
    <div
      ref={scrollRef}
      className="max-h-[70vh] overflow-y-auto pr-2 relative z-[1]"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-8 max-w-5xl mx-auto pl-2"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>
              Candidate Name <span className="text-danger-500">*</span>
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
              Email <span className="text-danger-500">*</span>
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
              Phone <span className="text-danger-500">*</span>
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
              Position <span className="text-danger-500">*</span>
            </label>
            <select
              className={inputClass}
              value={form.position}
              onChange={(e) => setField("position", e.target.value)}
            >
              <option value="MERN Stack Developer">MERN Stack Developer</option>
              <option value="React JS Developer">React JS Developer</option>
              <option value="Frontend Developer">Frontend Developer</option>
              <option value="Backend Developer">Backend Developer</option>
            </select>
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
            <label className={labelClass}>Total Experience (Years)</label>
            <input
              className={inputClass}
              placeholder="Enter total experience"
              value={form.experience}
              onChange={(e) => setField("experience", e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          <span className="text-sm font-medium text-slate-500">
            Interview Details
          </span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Interview Round</label>
            <select
              className={inputClass}
              value={form.round}
              onChange={(e) => setField("round", e.target.value)}
            >
              {roundOptions.map((stage) => (
                <option key={stage} value={stage}>
                  {stage.charAt(0).toUpperCase() + stage.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Expected Date of Joining</label>
            <input
              type="date"
              className={inputClass}
              min={minDate}
              value={form?.joiningDate || ""}
              onChange={(e) => setField("joiningDate", e.target.value)}
            />
          </div>

          {requiresInterviewDate && (
            <div className="md:col-span-2">
              <label className={labelClass}>
                Interview Slot <span className="text-red-500">*</span>
              </label>
              <InterviewSlotPicker
                interviewers={interviewers}
                excludeInterviewId={editInterview?._id}
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
            <div className="">
              <label className={labelClass}>Meeting Link</label>
              <input
                disabled={isMeetingDisabled}
                className={`${inputClass} ${
                  isMeetingDisabled
                    ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
                    : ""
                }`}
                placeholder={
                  isMeetingDisabled ? "Meeting link" : "Enter meeting link"
                }
                value={form.meetingLink}
                onChange={(e) =>
                  !isMeetingDisabled && setField("meetingLink", e.target.value)
                }
              />
            </div>
            <div className="">
              <button
                type="button"
                onClick={() => {
                  requiresMeetingLink &&
                    setField(
                      "meetingLink",
                      "https://meet.google.com/eeu-xnbf-yzb",
                    );
                }}
                className={`ml-2 text-sm mt-1 underline transition ${
                  isMeetingDisabled
                    ? "text-slate-400 cursor-not-allowed pointer-events-none"
                    : "text-sky-500 hover:text-sky-700"
                }`}
              >
                Click to use default meeting link
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Notice Period (In Days)</label>
            <input
              className={inputClass}
              placeholder="Enter notice period"
              value={form.noticePeriod}
              onChange={(e) => setField("noticePeriod", e.target.value)}
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
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => onClose?.()}
            className="btn btn-outline-secondary"
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {submitBtnLabel}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddInterview;
