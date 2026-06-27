import axios from "../../api/axios";

// Custom interview rounds (e.g. "Manager Round") defined by admin/HR. The six
// built-in rounds live in constant/interview-stages.js; these are the extras.
export const fetchRoundsService = async () => {
  const { data } = await axios.get("/round");
  return data; // { rounds: [{ _id, name, ... }], count }
};

export const createRoundService = async (
  name,
  sendMail = false,
  sendReminder = false,
) => {
  const { data } = await axios.post("/round/create", {
    name,
    sendMail,
    sendReminder,
  });
  return data;
};

export const updateRoundService = async (id, payload) => {
  const { data } = await axios.patch(`/round/${id}`, payload);
  return data;
};

export const deleteRoundService = async (id) => {
  const { data } = await axios.delete(`/round/${id}`);
  return data;
};
