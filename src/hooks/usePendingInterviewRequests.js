import { useEffect, useState } from "react";
import { fetchPendingRequestCount } from "@/features/interviews/interviewRequestService";

// Live count of pending candidate reschedule/cancel requests, shown as a badge
// on the "Interview Requests" sidebar item and the header mail icon. Polls every
// 60s (admin/hr only — the endpoint is role-guarded) and refreshes instantly
// when a request is resolved via the custom event below.
//
// The poll state lives at MODULE level (shared singleton) so that no matter how
// many components use this hook — desktop sidebar, mobile-menu sidebar, header
// bell — there is only ONE interval and ONE in-flight request. Previously each
// mounted instance fetched independently, so /pending-count was hit 3× at once.

const POLL_INTERVAL_MS = 60 * 1000;
const CHANGED_EVENT = "interview-requests-changed";

let sharedCount = 0;
let sharedEnabled = false;
let pollTimer = null;
let inFlight = null;
const subscribers = new Set();

const emit = () => {
  for (const setCount of subscribers) setCount(sharedCount);
};

const fetchShared = async () => {
  if (!sharedEnabled) return;
  // Coalesce concurrent calls (mount bursts, timer + event firing together)
  // into a single network request.
  if (inFlight) return inFlight;
  inFlight = fetchPendingRequestCount()
    .then((data) => {
      sharedCount = data?.count || 0;
      emit();
    })
    .catch(() => {
      // Badge is best-effort; ignore errors (e.g. session expiring).
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
};

const startPolling = () => {
  if (pollTimer) return;
  fetchShared();
  pollTimer = setInterval(fetchShared, POLL_INTERVAL_MS);
  window.addEventListener(CHANGED_EVENT, fetchShared);
};

const stopPolling = () => {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
  window.removeEventListener(CHANGED_EVENT, fetchShared);
};

// Call after approving/declining a request so every mounted badge updates
// immediately instead of waiting for the next poll.
export const notifyInterviewRequestsChanged = () => {
  window.dispatchEvent(new Event(CHANGED_EVENT));
};

export default function usePendingInterviewRequests(role) {
  // Interviewers see the count too (view-only); only admin/hr can resolve.
  const enabled =
    role === "admin" || role === "hr" || role === "interviewer";
  const [count, setCount] = useState(sharedCount);

  useEffect(() => {
    if (!enabled) return;
    sharedEnabled = true;
    subscribers.add(setCount);
    // Sync this consumer to the latest known value right away.
    setCount(sharedCount);
    // First subscriber starts the single shared poll loop.
    if (subscribers.size === 1) startPolling();
    return () => {
      subscribers.delete(setCount);
      // Stop polling once nothing is listening anymore.
      if (subscribers.size === 0) stopPolling();
    };
  }, [enabled]);

  return enabled ? count : 0;
}
