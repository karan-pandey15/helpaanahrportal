import React, { useEffect } from "react";
import { X } from "lucide-react";

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const Detail = ({ label, value, full }) => (
  <div className={full ? "md:col-span-2" : ""}>
    <p className="text-xs text-slate-500">{label}</p>
    <p className="font-medium break-words">{value || "—"}</p>
  </div>
);

const Section = ({ title, children }) => (
  <div className="border rounded-xl p-6 border-slate-200 dark:border-slate-700">
    <h3 className="font-semibold mb-4">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      {children}
    </div>
  </div>
);

const ViewDeveloper = ({ developer, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  if (!developer) return null;

  const submitted = developer.status === "submitted";
  const fullName = [developer.firstName, developer.middleName, developer.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="fixed inset-0 z-[9999] flex justify-center overflow-y-auto py-10 px-4">
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl h-fit bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold">
            {submitted ? fullName || developer.email : developer.email}
          </h2>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-slate-500">{developer.email}</span>
            <span
              className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${
                submitted
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {submitted ? "Submitted" : "Invited"}
            </span>
            {developer.submittedAt && (
              <span className="text-xs text-slate-400">
                Submitted {formatDate(developer.submittedAt)}
              </span>
            )}
          </div>

          {!submitted ? (
            <p className="text-sm text-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md">
              This developer hasn't submitted their details yet.
            </p>
          ) : (
            <>
              <Section title="Personal">
                <Detail label="First Name" value={developer.firstName} />
                <Detail label="Middle Name" value={developer.middleName} />
                <Detail label="Last Name" value={developer.lastName} />
                <Detail
                  label="Date of Birth"
                  value={formatDate(developer.dateOfBirth)}
                />
                <Detail label="Mobile Number" value={developer.mobileNumber} />
                <Detail
                  label="Date of Joining"
                  value={formatDate(developer.dateOfJoining)}
                />
                <Detail
                  label="Emergency Contact Name"
                  value={developer.emergencyContactName}
                />
                <Detail
                  label="Emergency Contact Mobile"
                  value={developer.emergencyContactMobile}
                />
              </Section>

              <Section title="Address">
                <Detail label="State" value={developer.state} />
                <Detail label="City" value={developer.city} />
                <Detail
                  label="Current Address"
                  value={developer.currentAddress}
                  full
                />
                <Detail
                  label="Permanent Address"
                  value={developer.permanentAddress}
                  full
                />
              </Section>

              <Section title="Professional">
                <Detail label="Designation" value={developer.designation} />
                <Detail label="Technologies" value={developer.technologies} />
                <Detail
                  label="Current Project Name"
                  value={developer.currentProjectName}
                />
                <Detail
                  label="Total Experience"
                  value={developer.totalExperience}
                />
                <Detail
                  label="Highest Education"
                  value={developer.highestEducation}
                  full
                />
              </Section>

              <Section title="Bank">
                <Detail
                  label="Account Holder Name"
                  value={developer.accountHolderName}
                />
                <Detail label="Bank Name" value={developer.bankName} />
                <Detail
                  label="Account Number"
                  value={developer.accountNumber}
                />
                <Detail label="IFSC Code" value={developer.ifscCode} />
                <Detail label="UPI ID" value={developer.upiId} />
              </Section>

              <div className="border rounded-xl p-6 border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold mb-4">Documents</h3>
                <div className="flex flex-wrap gap-4 text-sm">
                  {developer.aadharUrl ? (
                    <a
                      href={developer.aadharUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-medium"
                    >
                      View Aadhaar
                    </a>
                  ) : (
                    <span className="text-slate-400">No Aadhaar</span>
                  )}
                  {developer.panUrl ? (
                    <a
                      href={developer.panUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-medium"
                    >
                      View PAN
                    </a>
                  ) : (
                    <span className="text-slate-400">No PAN</span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewDeveloper;
