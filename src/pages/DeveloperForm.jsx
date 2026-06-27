import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Logo from "../assets/images/logo/logo.svg";
import {
  getDeveloperByToken,
  submitDeveloperForm,
} from "../features/user/developerPublicService";

// Public, no-login page developers land on from the onboarding email link.
// Access is controlled by the signed token in the URL — no portal account.

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];

// Every text field the backend expects (email is prefilled read-only and NOT
// sent in the body). confirmAccountNumber is sent but validated client-side too.
const TEXT_FIELDS = [
  "firstName",
  "middleName",
  "lastName",
  "dateOfJoining",
  "mobileNumber",
  "emergencyContactName",
  "emergencyContactMobile",
  "dateOfBirth",
  "state",
  "city",
  "currentAddress",
  "permanentAddress",
  "technologies",
  "designation",
  "currentProjectName",
  "totalExperience",
  "highestEducation",
  "accountHolderName",
  "bankName",
  "accountNumber",
  "confirmAccountNumber",
  "ifscCode",
  "upiId",
];

const FIELD_LABELS = {
  firstName: "First Name",
  middleName: "Middle Name",
  lastName: "Last Name",
  dateOfJoining: "Date of Joining",
  mobileNumber: "Mobile Number",
  emergencyContactName: "Emergency Contact Name",
  emergencyContactMobile: "Emergency Contact Mobile",
  dateOfBirth: "Date of Birth",
  state: "State",
  city: "City",
  currentAddress: "Current Address",
  permanentAddress: "Permanent Address",
  technologies: "Technologies",
  designation: "Designation",
  currentProjectName: "Current Project Name",
  totalExperience: "Total Experience",
  highestEducation: "Highest Education",
  accountHolderName: "Account Holder Name",
  bankName: "Bank Name",
  accountNumber: "Account Number",
  confirmAccountNumber: "Confirm Account Number",
  ifscCode: "IFSC Code",
  upiId: "UPI ID",
};

const emptyForm = TEXT_FIELDS.reduce((acc, k) => ({ ...acc, [k]: "" }), {});

export default function DeveloperForm() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState("");
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [email, setEmail] = useState("");

  const [editing, setEditing] = useState(false);
  const [hasAadhar, setHasAadhar] = useState(false);
  const [hasPan, setHasPan] = useState(false);
  const [existingAadharUrl, setExistingAadharUrl] = useState("");
  const [existingPanUrl, setExistingPanUrl] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [aadhar, setAadhar] = useState(null);
  const [pan, setPan] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!token) {
      setFatalError(
        "This link is invalid. Please use the link from your onboarding email.",
      );
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await getDeveloperByToken(token);
        const dev = data?.developer || {};
        setEmail(dev.email || "");
        setEditing(!!dev.editing);
        setHasAadhar(!!dev.hasAadhar);
        setHasPan(!!dev.hasPan);
        setExistingAadharUrl(dev.aadharUrl || "");
        setExistingPanUrl(dev.panUrl || "");

        if (dev.data) {
          // Prefill the form from the saved details. confirmAccountNumber is
          // mirrored from accountNumber so the client-side match check passes.
          setForm((prev) => {
            const next = { ...prev };
            TEXT_FIELDS.forEach((key) => {
              if (key === "confirmAccountNumber") return;
              const val = dev.data[key];
              next[key] = val == null ? "" : String(val);
            });
            next.confirmAccountNumber = next.accountNumber || "";
            return next;
          });
        }

        if (dev.alreadySubmitted || dev.status === "submitted") {
          setAlreadySubmitted(true);
        }
      } catch (error) {
        setFatalError(
          error?.response?.data?.message ||
            "We couldn't load your onboarding link. It may be invalid or expired. Please contact HR.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errorMessage) setErrorMessage("");
  };

  const validateFile = (file, label, required = true) => {
    if (!file) return required ? `${label} is required.` : "";
    if (!ALLOWED_TYPES.includes(file.type))
      return `${label} must be a JPG, PNG, or PDF file.`;
    if (file.size > MAX_FILE_SIZE) return `${label} must be 5MB or smaller.`;
    return "";
  };

  async function handleSubmit(e) {
    e.preventDefault();

    // Every text field non-empty
    for (const key of TEXT_FIELDS) {
      if (!String(form[key] ?? "").trim()) {
        setErrorMessage(`${FIELD_LABELS[key]} is required.`);
        return;
      }
    }

    if (form.accountNumber !== form.confirmAccountNumber) {
      setErrorMessage("Account number and confirmation do not match.");
      return;
    }

    // On an edit, a file is only required when there is no existing document.
    const aadharErr = validateFile(aadhar, "Aadhaar document", !hasAadhar);
    if (aadharErr) {
      setErrorMessage(aadharErr);
      return;
    }
    const panErr = validateFile(pan, "PAN document", !hasPan);
    if (panErr) {
      setErrorMessage(panErr);
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage("");

      const fd = new FormData();
      TEXT_FIELDS.forEach((key) => fd.append(key, form[key].trim()));
      // Only send files actually selected; backend keeps existing docs otherwise.
      if (aadhar instanceof File) fd.append("aadhar", aadhar);
      if (pan instanceof File) fd.append("pan", pan);

      await submitDeveloperForm(token, fd);
      setSubmitted(true);
    } catch (error) {
      const code = error?.response?.data?.code;
      if (code === "ALREADY_SUBMITTED") {
        setAlreadySubmitted(true);
        return;
      }
      if (code === "INVALID_TOKEN") {
        setFatalError(
          "This onboarding link is invalid or has expired. Please contact HR.",
        );
        return;
      }
      setErrorMessage(
        error?.response?.data?.message ||
          "Something went wrong submitting your details. Please try again or contact HR.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const shell = (children, wide = false) => (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
      <div
        className={`w-full ${wide ? "max-w-3xl" : "max-w-lg"} bg-white rounded-xl border border-gray-200 shadow-sm p-8`}
      >
        <img src={Logo} alt="Logo" className="w-28 mb-6" />
        {children}
      </div>
    </div>
  );

  if (loading) {
    return shell(<p className="text-gray-500">Loading your onboarding form…</p>);
  }

  if (fatalError) {
    return shell(
      <>
        <h1 className="text-xl font-semibold text-gray-900 mb-3">
          Link not valid
        </h1>
        <p className="text-sm text-red-700 bg-red-50 p-3 rounded-md">
          {fatalError}
        </p>
      </>,
    );
  }

  if (submitted) {
    return shell(
      <>
        <h1 className="text-xl font-semibold text-gray-900 mb-3">
          Details submitted
        </h1>
        <p className="text-sm text-green-700 bg-green-50 p-3 rounded-md mb-4">
          Thank you! Your onboarding details have been submitted successfully.
        </p>
        <p className="text-sm text-gray-500">
          Our HR team will review your information. You can close this page.
        </p>
      </>,
    );
  }

  if (alreadySubmitted) {
    return shell(
      <>
        <h1 className="text-xl font-semibold text-gray-900 mb-3">
          Already submitted
        </h1>
        <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-md">
          You have already submitted your onboarding details. If you need to
          make changes, please contact our HR team.
        </p>
      </>,
    );
  }

  return shell(
    <>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">
        Developer Onboarding
      </h1>
      <p className="text-sm text-gray-500 mb-5">
        Please complete all the fields below so we can finish setting up your
        account.
      </p>

      {editing ? (
        <p className="text-sm text-blue-700 bg-blue-50 p-3 rounded-md mb-5">
          You're updating your previously submitted details.
        </p>
      ) : null}

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1 text-gray-600">
          Email
        </label>
        <input
          type="email"
          value={email}
          readOnly
          className="w-full h-11 border border-gray-200 rounded-md px-3 text-sm bg-gray-50 text-gray-600"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Section title="Personal Details">
          <Field
            label="First Name"
            value={form.firstName}
            onChange={(v) => handleChange("firstName", v)}
          />
          <Field
            label="Middle Name"
            value={form.middleName}
            onChange={(v) => handleChange("middleName", v)}
          />
          <Field
            label="Last Name"
            value={form.lastName}
            onChange={(v) => handleChange("lastName", v)}
          />
          <Field
            label="Date of Birth"
            type="date"
            value={form.dateOfBirth}
            onChange={(v) => handleChange("dateOfBirth", v)}
          />
          <Field
            label="Mobile Number"
            value={form.mobileNumber}
            onChange={(v) => handleChange("mobileNumber", v)}
          />
          <Field
            label="Date of Joining"
            type="date"
            value={form.dateOfJoining}
            onChange={(v) => handleChange("dateOfJoining", v)}
          />
          <Field
            label="Emergency Contact Name"
            value={form.emergencyContactName}
            onChange={(v) => handleChange("emergencyContactName", v)}
          />
          <Field
            label="Emergency Contact Mobile"
            value={form.emergencyContactMobile}
            onChange={(v) => handleChange("emergencyContactMobile", v)}
          />
        </Section>

        <Section title="Address">
          <Field
            label="State"
            value={form.state}
            onChange={(v) => handleChange("state", v)}
          />
          <Field
            label="City"
            value={form.city}
            onChange={(v) => handleChange("city", v)}
          />
          <Field
            label="Current Address"
            textarea
            full
            value={form.currentAddress}
            onChange={(v) => handleChange("currentAddress", v)}
          />
          <Field
            label="Permanent Address"
            textarea
            full
            value={form.permanentAddress}
            onChange={(v) => handleChange("permanentAddress", v)}
          />
        </Section>

        <Section title="Professional Details">
          <Field
            label="Designation"
            value={form.designation}
            onChange={(v) => handleChange("designation", v)}
          />
          <Field
            label="Technologies"
            value={form.technologies}
            onChange={(v) => handleChange("technologies", v)}
          />
          <Field
            label="Current Project Name"
            value={form.currentProjectName}
            onChange={(v) => handleChange("currentProjectName", v)}
          />
          <Field
            label="Total Experience"
            value={form.totalExperience}
            onChange={(v) => handleChange("totalExperience", v)}
          />
          <Field
            label="Highest Education"
            full
            value={form.highestEducation}
            onChange={(v) => handleChange("highestEducation", v)}
          />
        </Section>

        <Section title="Bank Details">
          <Field
            label="Account Holder Name"
            value={form.accountHolderName}
            onChange={(v) => handleChange("accountHolderName", v)}
          />
          <Field
            label="Bank Name"
            value={form.bankName}
            onChange={(v) => handleChange("bankName", v)}
          />
          <Field
            label="Account Number"
            value={form.accountNumber}
            onChange={(v) => handleChange("accountNumber", v)}
          />
          <Field
            label="Confirm Account Number"
            value={form.confirmAccountNumber}
            onChange={(v) => handleChange("confirmAccountNumber", v)}
          />
          <Field
            label="IFSC Code"
            value={form.ifscCode}
            onChange={(v) => handleChange("ifscCode", v)}
          />
          <Field
            label="UPI ID"
            value={form.upiId}
            onChange={(v) => handleChange("upiId", v)}
          />
        </Section>

        <Section title="Documents">
          <FileField
            label={
              hasAadhar
                ? "Aadhaar (JPG, PNG, or PDF — max 5MB) (leave blank to keep your existing file)"
                : "Aadhaar (JPG, PNG, or PDF — max 5MB)"
            }
            optional={hasAadhar}
            existingUrl={existingAadharUrl}
            file={aadhar}
            onChange={(f) => {
              setAadhar(f);
              if (errorMessage) setErrorMessage("");
            }}
          />
          <FileField
            label={
              hasPan
                ? "PAN (JPG, PNG, or PDF — max 5MB) (leave blank to keep your existing file)"
                : "PAN (JPG, PNG, or PDF — max 5MB)"
            }
            optional={hasPan}
            existingUrl={existingPanUrl}
            file={pan}
            onChange={(f) => {
              setPan(f);
              if (errorMessage) setErrorMessage("");
            }}
          />
        </Section>

        {errorMessage ? (
          <p className="text-sm text-red-700 bg-red-50 p-3 rounded-md">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-12 rounded-md font-medium text-white bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400"
        >
          {submitting ? "Submitting…" : "Submit Details"}
        </button>
      </form>
    </>,
    true,
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", textarea, full }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="block text-sm font-medium mb-1 text-gray-600">
        {label} <span className="text-red-500">*</span>
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      )}
    </div>
  );
}

function FileField({ label, file, onChange, optional = false, existingUrl }) {
  // Local preview URL for the selected file so the developer can confirm they
  // uploaded the right document before submitting. Revoked when the file
  // changes / the field unmounts to avoid leaking object URLs.
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const isImage = file?.type?.startsWith("image/");
  const sizeKB = file ? Math.max(1, Math.round(file.size / 1024)) : 0;
  const existingIsImage = /\.(jpe?g|png|gif|webp)(\?|$)/i.test(existingUrl || "");

  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-gray-600">
        {label} {optional ? null : <span className="text-red-500">*</span>}
      </label>

      {/* The document already on file — shown until a new one is chosen. */}
      {existingUrl && !file && (
        <div className="mb-2 flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 p-2">
          {existingIsImage ? (
            <a href={existingUrl} target="_blank" rel="noreferrer">
              <img
                src={existingUrl}
                alt={`Current ${label}`}
                className="h-14 w-14 rounded object-cover border border-gray-200"
              />
            </a>
          ) : (
            <div className="h-14 w-14 rounded bg-gray-200 flex items-center justify-center text-[11px] font-semibold text-gray-500">
              PDF
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-700">Current file on record</p>
            <p className="text-[11px] text-gray-400">
              Choose a new file below only if you want to replace it.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={existingUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              View
            </a>
            <a
              href={existingUrl}
              download
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Download
            </a>
          </div>
        </div>
      )}

      <input
        type="file"
        accept="image/*,application/pdf"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-gray-900 file:text-white hover:file:bg-gray-800"
      />

      {file && (
        <div className="mt-2 flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 p-2">
          {isImage && previewUrl ? (
            <img
              src={previewUrl}
              alt={`${label} preview`}
              className="h-14 w-14 rounded object-cover border border-gray-200"
            />
          ) : (
            <div className="h-14 w-14 rounded bg-gray-200 flex items-center justify-center text-[11px] font-semibold text-gray-500">
              PDF
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-700 truncate">
              {file.name}
            </p>
            <p className="text-[11px] text-gray-400">{sizeKB} KB</p>
          </div>

          {previewUrl && (
            <div className="flex items-center gap-3 shrink-0">
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                View
              </a>
              <a
                href={previewUrl}
                download={file.name}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Download
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
