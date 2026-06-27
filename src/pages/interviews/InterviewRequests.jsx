import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import RefreshButton from "@/components/ui/RefreshButton";
import {
  fetchInterviewRequests,
  resolveInterviewRequestService,
} from "@/features/interviews/interviewRequestService";
import { getInterviewByIdService } from "@/features/interviews/interviewService";
import RescheduleRequestModal from "@/components/interviews/RescheduleRequestModal";
import { notifyInterviewRequestsChanged } from "@/hooks/usePendingInterviewRequests";
import useAuth from "@/hooks/useAuth";

// HR/admin inbox for candidate-submitted reschedule/cancel requests (created
// from the public tokenized page linked in the interview emails).

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "resolved", label: "Resolved" },
];

const formatDateTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const typeBadge = (type) =>
  type === "cancel"
    ? "bg-red-100 text-red-700"
    : "bg-blue-100 text-blue-700";

const statusBadge = (status) =>
  ({
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    declined: "bg-slate-200 text-slate-600",
  })[status] || "bg-slate-100 text-slate-600";

export default function InterviewRequests() {
  const navigate = useNavigate();
  const { role } = useAuth();
  // Interviewers can view requests but not act on them.
  const canResolve = role === "admin" || role === "hr";
  const [tab, setTab] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [openingId, setOpeningId] = useState(null);
  const [rescheduleCtx, setRescheduleCtx] = useState(null);

  const load = useCallback(async (status, pageNum) => {
    try {
      setLoading(true);
      const data = await fetchInterviewRequests({
        status,
        page: pageNum,
        limit: 20,
      });
      setRequests(data.requests || []);
      setPagination(data.pagination || null);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to load interview requests",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab, page);
  }, [tab, page, load]);

  const switchTab = (key) => {
    setTab(key);
    setPage(1);
  };

  // Decline (any type) and cancel-approval go straight through. Reschedule
  // approvals are handled by the reschedule modal (see openReschedule), which
  // sets the new time on the interview before approving the request.
  const handleResolve = async (request, action) => {
    try {
      setResolvingId(request._id);
      await resolveInterviewRequestService(request._id, action);
      toast.success(
        action === "approve"
          ? "Cancellation approved — interview marked as cancelled."
          : "Request declined.",
      );
      notifyInterviewRequestsChanged();
      await load(tab, page);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to resolve the request",
      );
    } finally {
      setResolvingId(null);
    }
  };

  // Open the reschedule modal pre-filled with the interview's current details.
  const openReschedule = async (request) => {
    const interviewId = request.interview?._id || request.interview;
    if (!interviewId) {
      return toast.error("Interview not found for this request");
    }
    try {
      setOpeningId(request._id);
      const res = await getInterviewByIdService(interviewId);
      if (!res?.interview) throw new Error("Interview not found");
      setRescheduleCtx({ interview: res.interview, request });
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to load the interview",
      );
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h4 className="font-medium lg:text-2xl text-xl text-slate-900">
          Interview Requests
        </h4>
        <div className="flex items-center gap-2">
          <RefreshButton onClick={() => load(tab, page)} loading={loading} />
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => switchTab(t.key)}
              className={`px-4 h-9 rounded-md text-sm font-medium transition ${
                tab === t.key
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Card>
          <p className="text-slate-500 text-sm">Loading requests…</p>
        </Card>
      ) : requests.length === 0 ? (
        <Card>
          <div className="text-center py-10">
            <Icon
              icon="heroicons:inbox"
              className="w-10 h-10 mx-auto text-slate-300 mb-3"
            />
            <p className="text-slate-500 text-sm">
              {tab === "pending"
                ? "No pending requests. When a candidate asks to reschedule or cancel from their interview email, it will show up here."
                : "No resolved requests yet."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const interviewId = request.interview?._id || request.interview;
            return (
              <Card key={request._id} bodyClass="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-slate-900">
                        {request.candidateName}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${typeBadge(request.type)}`}
                      >
                        {request.type === "cancel"
                          ? "Cancellation"
                          : "Reschedule"}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusBadge(request.status)}`}
                      >
                        {request.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {request.candidateEmail} · {request.position} ·{" "}
                      {request.round}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Interview scheduled:{" "}
                      <span className="font-medium text-slate-700">
                        {formatDateTime(request.interviewDateTime)}
                      </span>{" "}
                      · Requested: {formatDateTime(request.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {interviewId && (
                      <button
                        onClick={() => navigate(`/candidate/${interviewId}`)}
                        className="h-9 px-3 rounded-md border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
                      >
                        View Candidate
                      </button>
                    )}
                    {canResolve && request.status === "pending" && (
                      <>
                        <button
                          disabled={resolvingId === request._id}
                          onClick={() => handleResolve(request, "decline")}
                          className="h-9 px-3 rounded-md border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Decline
                        </button>
                        <button
                          disabled={
                            resolvingId === request._id ||
                            openingId === request._id
                          }
                          onClick={() =>
                            request.type === "reschedule"
                              ? openReschedule(request)
                              : handleResolve(request, "approve")
                          }
                          className={`h-9 px-3 rounded-md text-sm font-medium text-white disabled:opacity-50 ${
                            request.type === "cancel"
                              ? "bg-red-600 hover:bg-red-700"
                              : "bg-slate-900 hover:bg-slate-800"
                          }`}
                        >
                          {request.type === "cancel"
                            ? "Approve Cancellation"
                            : openingId === request._id
                              ? "Opening…"
                              : "Reschedule"}
                        </button>
                      </>
                    )}
                    {!canResolve && request.status === "pending" && (
                      <span className="text-xs text-slate-400 italic">
                        View only
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 bg-slate-50 border border-slate-100 rounded-md p-3">
                  <p className="text-xs text-slate-400 mb-1">
                    Candidate's reason
                  </p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {request.reason}
                  </p>
                </div>

                {request.type === "reschedule" &&
                  request.preferredSlots?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-slate-400 mb-1">
                        Preferred new times (IST)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {request.preferredSlots.map((slot, i) => (
                          <span
                            key={i}
                            className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-md"
                          >
                            {formatDateTime(slot)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {request.status !== "pending" && request.resolvedBy?.name && (
                  <p className="text-xs text-slate-400 mt-3">
                    {request.status === "approved" ? "Approved" : "Declined"} by{" "}
                    {request.resolvedBy.name} ({request.resolvedBy.role}) on{" "}
                    {formatDateTime(request.resolvedAt)}
                  </p>
                )}
              </Card>
            );
          })}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-9 px-3 rounded-md border border-slate-200 text-sm text-slate-600 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-9 px-3 rounded-md border border-slate-200 text-sm text-slate-600 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {rescheduleCtx && (
        <RescheduleRequestModal
          interview={rescheduleCtx.interview}
          request={rescheduleCtx.request}
          onClose={() => setRescheduleCtx(null)}
          onDone={() => {
            setRescheduleCtx(null);
            notifyInterviewRequestsChanged();
            load(tab, page);
          }}
        />
      )}
    </div>
  );
}
