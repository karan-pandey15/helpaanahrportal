import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { updateDeveloper } from "../../../../features/user/addDeveloperService";

// Editable text fields the backend accepts on PATCH /developer/:id.
// email is NOT editable. The two date fields are handled as <input type="date">.
const FIELD_GROUPS = [
  {
    title: "Personal",
    fields: [
      { key: "firstName", label: "First Name" },
      { key: "middleName", label: "Middle Name" },
      { key: "lastName", label: "Last Name" },
      { key: "dateOfBirth", label: "Date of Birth", type: "date" },
      { key: "dateOfJoining", label: "Date of Joining", type: "date" },
      { key: "mobileNumber", label: "Mobile Number" },
      { key: "emergencyContactName", label: "Emergency Contact Name" },
      { key: "emergencyContactMobile", label: "Emergency Contact Mobile" },
    ],
  },
  {
    title: "Address",
    fields: [
      { key: "state", label: "State" },
      { key: "city", label: "City" },
      { key: "currentAddress", label: "Current Address", full: true },
      { key: "permanentAddress", label: "Permanent Address", full: true },
    ],
  },
  {
    title: "Professional",
    fields: [
      { key: "designation", label: "Designation" },
      { key: "technologies", label: "Technologies" },
      { key: "currentProjectName", label: "Current Project Name" },
      { key: "totalExperience", label: "Total Experience" },
      { key: "highestEducation", label: "Highest Education", full: true },
    ],
  },
  {
    title: "Bank",
    fields: [
      { key: "accountHolderName", label: "Account Holder Name" },
      { key: "bankName", label: "Bank Name" },
      { key: "accountNumber", label: "Account Number" },
      { key: "ifscCode", label: "IFSC Code" },
      { key: "upiId", label: "UPI ID" },
    ],
  },
];

const DATE_KEYS = new Set(["dateOfBirth", "dateOfJoining"]);

// Whether a stored document URL points at an image (vs a PDF) — drives the
// inline thumbnail preview.
const isImageUrl = (url = "") => /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url);

// Read-only viewer for an uploaded onboarding document (Aadhaar / PAN).
const DocumentView = ({ label, url }) => (
  <div>
    <label className="block mb-1 text-sm text-slate-700 dark:text-slate-300">
      {label}
    </label>
    {url ? (
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 p-2">
        {isImageUrl(url) ? (
          <a href={url} target="_blank" rel="noreferrer">
            <img
              src={url}
              alt={`${label} preview`}
              className="h-14 w-14 rounded object-cover border border-slate-200 dark:border-slate-600"
            />
          </a>
        ) : (
          <div className="h-14 w-14 rounded bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-[11px] font-semibold text-slate-500 dark:text-slate-300">
            PDF
          </div>
        )}
        <div className="flex items-center gap-3">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            View
          </a>
          <a
            href={url}
            download
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            Download
          </a>
        </div>
      </div>
    ) : (
      <p className="text-sm text-slate-400 italic">Not uploaded</p>
    )}
  </div>
);

const toDateInput = (value) =>
  value ? new Date(value).toISOString().slice(0, 10) : "";

const buildInitialForm = (developer) => {
  const form = {};
  FIELD_GROUPS.forEach((group) => {
    group.fields.forEach(({ key }) => {
      const raw = developer?.[key];
      form[key] = DATE_KEYS.has(key) ? toDateInput(raw) : raw ?? "";
    });
  });
  return form;
};

const EditDeveloperModal = ({ developer, onClose, onSaved }) => {
  const [form, setForm] = useState(() => buildInitialForm(developer));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(buildInitialForm(developer));
  }, [developer]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleChange = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving || !developer?._id) return;
    setSaving(true);
    try {
      await updateDeveloper(developer._id, form);
      toast.success("Developer details updated");
      onSaved?.();
      onClose?.();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to update developer",
      );
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
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl shadow-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold">Edit Developer</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto custom-scroller p-6 space-y-6"
        >
          <div>
            <label className="block mb-1 text-sm text-slate-700 dark:text-slate-300">
              Email Address
            </label>
            <input
              type="email"
              value={developer?.email || ""}
              readOnly
              className="w-full px-4 py-2 rounded-lg border bg-slate-100 dark:bg-slate-700/60 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed outline-none"
            />
          </div>

          {FIELD_GROUPS.map((group) => (
            <div key={group.title}>
              <h4 className="text-base font-semibold mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                {group.title}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.fields.map(({ key, label, type, full }) => (
                  <div key={key} className={full ? "md:col-span-2" : ""}>
                    <label className="block mb-1 text-sm text-slate-700 dark:text-slate-300">
                      {label}
                    </label>
                    <input
                      type={type || "text"}
                      value={form[key] ?? ""}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Uploaded documents — view only (the developer re-uploads via the
              "Request Edit" flow). */}
          <div>
            <h4 className="text-base font-semibold mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
              Documents
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DocumentView label="Aadhaar Card" url={developer?.aadharUrl} />
              <DocumentView label="PAN Card" url={developer?.panUrl} />
            </div>
          </div>
        </form>

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
            onClick={handleSubmit}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditDeveloperModal;
