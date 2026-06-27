import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Logo from "../assets/images/logo/logo.svg";
import {
  getPublicInterviewByToken,
  submitPublicInterviewRequest,
} from "../features/interviews/interviewRequestService";

// Public, no-login page candidates land on from the "Request Reschedule" /
// "Cancel Interview" buttons in the interview email. Access is controlled by
// the signed token in the URL — no portal account involved.

const formatDateTime = (value) => {
  if (!value) return "To be confirmed";
  const date = new Date(value);
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const MAX_SLOTS = 3;

export default function InterviewResponse() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const initialAction =
    searchParams.get("action") === "cancel" ? "cancel" : "reschedule";

  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState("");
  const [interview, setInterview] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);

  const [type, setType] = useState(initialAction);
  const [reason, setReason] = useState("");
  const [slots, setSlots] = useState(["", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitted, setSubmitted] = useState(null);

  useEffect(() => {
    if (!token) {
      setFatalError("This link is invalid. Please use the link from your interview email.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await getPublicInterviewByToken(token);
        setInterview(data.interview);
        setPendingRequest(data.pendingRequest);
      } catch (error) {
        setFatalError(
          error?.response?.data?.message ||
            "We couldn't load your interview details. Please use the link from your interview email or contact HR.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleSlotChange = (index, value) => {
    setSlots((prev) => prev.map((s, i) => (i === index ? value : s)));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMessage("Please tell us the reason for your request.");
      return;
    }
    try {
      setSubmitting(true);
      setErrorMessage("");
      const preferredSlots =
        type === "reschedule"
          ? slots
              .filter(Boolean)
              .map((s) => new Date(s).toISOString())
              .slice(0, MAX_SLOTS)
          : [];
      const data = await submitPublicInterviewRequest(token, {
        type,
        reason: reason.trim(),
        preferredSlots,
      });
      setSubmitted(data.message);
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message ||
          "Something went wrong. Please try again or contact HR directly.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const card = (children) => (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <img src={Logo} alt="Logo" className="w-28 mb-6" />
        {children}
      </div>
    </div>
  );

  if (loading) {
    return card(<p className="text-gray-500">Loading your interview details…</p>);
  }

  if (fatalError) {
    return card(
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
    return card(
      <>
        <h1 className="text-xl font-semibold text-gray-900 mb-3">
          Request received
        </h1>
        <p className="text-sm text-green-700 bg-green-50 p-3 rounded-md mb-4">
          {submitted}
        </p>
        <p className="text-sm text-gray-500">
          Our HR team will review your request and confirm by email. You can
          close this page.
        </p>
      </>,
    );
  }

  if (interview?.isCancelled) {
    return card(
      <>
        <h1 className="text-xl font-semibold text-gray-900 mb-3">
          Interview cancelled
        </h1>
        <p className="text-sm text-gray-600">
          This interview has already been cancelled. If this is a mistake,
          please contact our HR team.
        </p>
      </>,
    );
  }

  if (interview?.isPast) {
    return card(
      <>
        <h1 className="text-xl font-semibold text-gray-900 mb-3">
          Interview time has passed
        </h1>
        <p className="text-sm text-gray-600">
          The scheduled time for this interview has already passed, so it can
          no longer be changed here. Please contact our HR team directly.
        </p>
      </>,
    );
  }

  if (pendingRequest) {
    return card(
      <>
        <h1 className="text-xl font-semibold text-gray-900 mb-3">
          Request already submitted
        </h1>
        <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-md">
          You already have a pending{" "}
          <strong>
            {pendingRequest.type === "cancel" ? "cancellation" : "reschedule"}
          </strong>{" "}
          request for this interview. Our HR team will get back to you by
          email soon.
        </p>
      </>,
    );
  }

  return card(
    <>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">
        Hi {interview.candidateName},
      </h1>
      <p className="text-sm text-gray-500 mb-5">
        Need a change for your upcoming interview? Submit a request below and
        our HR team will get back to you.
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-sm">
        <div className="flex justify-between py-1">
          <span className="text-gray-500">Position</span>
          <span className="font-medium text-gray-900">{interview.position}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-gray-500">Round</span>
          <span className="font-medium text-gray-900">{interview.round}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-gray-500">Scheduled (IST)</span>
          <span className="font-medium text-gray-900">
            {formatDateTime(interview.interviewDateTime)}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-600">
            What would you like to do?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType("reschedule")}
              className={`h-11 rounded-md border text-sm font-medium ${
                type === "reschedule"
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Reschedule
            </button>
            <button
              type="button"
              onClick={() => setType("cancel")}
              className={`h-11 rounded-md border text-sm font-medium ${
                type === "cancel"
                  ? "border-red-600 bg-red-50 text-red-700"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Cancel Interview
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-600">
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (errorMessage) setErrorMessage("");
            }}
            rows={3}
            maxLength={1000}
            required
            placeholder={
              type === "cancel"
                ? "Please tell us why you'd like to cancel…"
                : "Please tell us why you need a new time…"
            }
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {type === "reschedule" && (
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">
              Preferred new times (optional, up to {MAX_SLOTS})
            </label>
            <div className="space-y-2">
              {slots.map((slot, i) => (
                <input
                  key={i}
                  type="datetime-local"
                  value={slot}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => handleSlotChange(i, e.target.value)}
                  className="w-full h-11 border border-gray-300 rounded-md px-3 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              The final time will be confirmed by our HR team by email.
            </p>
          </div>
        )}

        {errorMessage ? (
          <p className="text-sm text-red-700 bg-red-50 p-3 rounded-md">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className={`w-full h-12 rounded-md font-medium text-white disabled:bg-gray-400 ${
            type === "cancel"
              ? "bg-red-600 hover:bg-red-700"
              : "bg-gray-900 hover:bg-gray-800"
          }`}
        >
          {submitting
            ? "Submitting…"
            : type === "cancel"
              ? "Submit Cancellation Request"
              : "Submit Reschedule Request"}
        </button>
      </form>
    </>,
  );
}
