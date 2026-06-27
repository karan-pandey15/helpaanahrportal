import axios from "../../api/axios";

// An interviewer's working window + weekdays.
export const getAvailabilityService = async (interviewerId) => {
  const { data } = await axios.get(`/availability/${interviewerId}`);
  return data; // { availability, interviewer }
};

export const updateAvailabilityService = async (interviewerId, payload) => {
  const { data } = await axios.put(`/availability/${interviewerId}`, payload);
  return data;
};

// Every interviewer with the interviews booked on them (candidate + slot).
export const getInterviewerBookingsService = async ({
  date,
  interviewerId,
} = {}) => {
  const qs = new URLSearchParams();
  if (date) qs.set("date", date);
  if (interviewerId) qs.set("interviewerId", interviewerId);
  const { data } = await axios.get(`/availability/bookings?${qs.toString()}`);
  return data; // { interviewers: [{ interviewer, bookings }], date }
};

// Bookable slots for an interviewer on a date. Each slot carries booked/past
// flags so the UI can hide the ones that are taken.
export const getSlotsService = async (
  interviewerId,
  { date, duration = 30, excludeInterviewId } = {},
) => {
  const qs = new URLSearchParams();
  if (date) qs.set("date", date);
  qs.set("duration", String(duration));
  if (excludeInterviewId) qs.set("excludeInterviewId", excludeInterviewId);
  const { data } = await axios.get(
    `/availability/${interviewerId}/slots?${qs.toString()}`,
  );
  return data; // { slots, available, reason, date, duration }
};
