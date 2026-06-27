import axios from "../../api/axios";

// Fetch the interview list for a given day (today/yesterday/tomorrow or an
// explicit date), optionally filtered by assignee and round.
export const fetchInterviewListService = async (params = {}) => {
  const {
    dateFilter,
    date,
    assignee,
    round,
    page = 1,
    limit = 50,
  } = params;

  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));

  // An explicit date overrides the quick day filter.
  if (date) {
    qs.set("date", date);
  } else if (dateFilter) {
    qs.set("dateFilter", dateFilter);
  }

  if (assignee && assignee !== "all") qs.set("assignee", assignee);
  if (round && round !== "any" && round !== "all") qs.set("round", round);

  const { data } = await axios.get(`/interview-list/list?${qs.toString()}`);
  return data;
};

// People selectable in the assignee filter (interviewers).
export const fetchInterviewAssigneesService = async () => {
  const { data } = await axios.get("/interview-list/assignees");
  return data;
};

// Aggregated candidate/interview metrics for the dashboard.
export const fetchInterviewStatsService = async () => {
  const { data } = await axios.get("/interview-list/stats");
  return data;
};
