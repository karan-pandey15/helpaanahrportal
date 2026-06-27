import React, { useEffect, useState } from "react";
import Dropdown from "@/components/ui/Dropdown";
import Icon from "@/components/ui/Icon";
import { Link, useNavigate } from "react-router-dom";
import { Menu } from "@headlessui/react";
import useAuth from "@/hooks/useAuth";
import usePendingInterviewRequests from "@/hooks/usePendingInterviewRequests";
import { fetchInterviewRequests } from "@/features/interviews/interviewRequestService";
import RequestBadge from "@/components/interviews/RequestBadge";

// Header "mail" icon, repurposed as the candidate Interview Requests notifier:
// the badge shows the live pending count and the dropdown lists the latest
// pending reschedule/cancel requests. Admin/HR only — the count hook returns 0
// for other roles, so the badge stays hidden for them.

const formatWhen = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const messageLabel = (count) => () => {
  return (
    <span className="relative lg:h-[32px] lg:w-[32px] lg:bg-slate-100 lg:dark:bg-slate-900 dark:text-white text-slate-900 cursor-pointer rounded-full text-[20px] flex flex-col items-center justify-center">
      <Icon icon="heroicons-outline:mail" />
      {count > 0 && (
        <span className="absolute lg:right-0 lg:top-0 -top-2 -right-2 h-4 min-w-[16px] px-1 bg-red-500 text-[8px] font-semibold flex flex-col items-center justify-center rounded-full text-white z-[99]">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </span>
  );
};

const Message = () => {
  const { role } = useAuth();
  const pendingCount = usePendingInterviewRequests(role);
  const canView =
    role === "admin" || role === "hr" || role === "interviewer";
  const [requests, setRequests] = useState([]);
  const navigate = useNavigate();

  // Load the latest few pending requests for the dropdown, refreshing whenever
  // the live count changes (poll tick or a resolve), so the panel mirrors the
  // badge.
  useEffect(() => {
    if (!canView) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchInterviewRequests({
          status: "pending",
          page: 1,
          limit: 5,
        });
        if (!cancelled) setRequests(data.requests || []);
      } catch {
        // Best-effort — the badge count is the source of truth.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canView, pendingCount]);

  return (
    <Dropdown
      classMenuItems="md:w-[335px] w-min top-[58px]"
      label={messageLabel(pendingCount)()}
    >
      <div className="flex justify-between px-4 py-4 border-b border-slate-100 dark:border-slate-600">
        <div className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-6">
          Interview Requests
          {pendingCount > 0 ? ` (${pendingCount})` : ""}
        </div>
        <div className="text-slate-800 dark:text-slate-200 text-xs md:text-right">
          <Link to="/interview-requests" className="underline">
            View all
          </Link>
        </div>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {!canView || requests.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
            No pending requests
          </div>
        ) : (
          requests.map((req) => {
            const interviewId = req.interview?._id || req.interview;
            return (
              <Menu.Item key={req._id}>
                {({ active }) => (
                  <div
                    onClick={() =>
                      interviewId && navigate(`/candidate/${interviewId}`)
                    }
                    className={`${
                      active
                        ? "bg-slate-100 text-slate-800 dark:bg-slate-600 dark:bg-opacity-70"
                        : "text-slate-600 dark:text-slate-300"
                    } block w-full px-4 py-2 text-sm cursor-pointer`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-slate-800 dark:text-slate-200 text-sm font-medium">
                        {req.candidateName}
                      </span>
                      <RequestBadge type={req.type} compact />
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      {req.position}
                      {req.round ? ` · ${req.round}` : ""}
                    </div>
                    {req.reason && (
                      <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                        “{req.reason}”
                      </div>
                    )}
                    <div className="text-slate-400 dark:text-slate-400 text-xs mt-1">
                      Requested {formatWhen(req.createdAt)}
                    </div>
                  </div>
                )}
              </Menu.Item>
            );
          })
        )}
      </div>
    </Dropdown>
  );
};

export default Message;
