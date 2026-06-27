const InterviewStages = [
  "pending",
  "1st round",
  "2nd round",
  "final round",
  "hired",
  "rejected",
  "offer declined",
];
export default InterviewStages;


export const InterviewStageByLvl = {
  PENDING: "pending",
  FIRSTROUND: "1st round",
  SECONDROUND: "2nd round",
  FINALROUND: "final round",
  HIRED: "hired",
  REJECTED: "rejected",
  // Terminal stage — candidate declined the offer. Neutral round: no interview
  // date/link required and no email is sent when moving a candidate here.
  OFFERDECLINED: "offer declined",
};

// A round not in the built-in list is an admin/HR custom round.
export const isCustomRound = (round) =>
  !!round && !InterviewStages.includes(round);

// Look up a custom round's `sendMail` flag, given the rounds list from the API.
// Returns true (legacy "behaves like an interview round") when the list isn't
// provided or the round isn't found, so callers that don't pass the list keep
// the old behavior.
const customRoundSendsMail = (round, customRounds) => {
  if (!Array.isArray(customRounds)) return true;
  const meta = customRounds.find((r) => (r?.name ?? r) === round);
  return meta ? !!meta.sendMail : true;
};

// A round "acts like an interview round" — requires an interview date + meeting
// link and triggers the invite email — for the built-in 1st/2nd rounds, the
// built-in final round (date only), and custom rounds whose `sendMail` is on.
// Pass `customRounds` (the API rounds list) to respect each custom round's flag;
// omit it to keep the legacy "all custom rounds are interview rounds" behavior.
export const roundRequiresInterviewDate = (round, customRounds = null) => {
  if (
    [
      InterviewStageByLvl.FIRSTROUND,
      InterviewStageByLvl.SECONDROUND,
      InterviewStageByLvl.FINALROUND,
    ].includes(round)
  )
    return true;
  if (!isCustomRound(round)) return false;
  return customRoundSendsMail(round, customRounds);
};

export const roundRequiresMeetingLink = (round, customRounds = null) => {
  if (
    [InterviewStageByLvl.FIRSTROUND, InterviewStageByLvl.SECONDROUND].includes(
      round,
    )
  )
    return true;
  if (!isCustomRound(round)) return false;
  return customRoundSendsMail(round, customRounds);
};

// Merge built-in stages with custom round names for a dropdown, de-duped and
// preserving built-in order first.
export const mergeRoundOptions = (customRounds = []) => {
  const names = customRounds
    .map((r) => (typeof r === "string" ? r : r?.name))
    .filter(Boolean);
  return [...InterviewStages, ...names.filter((n) => !InterviewStages.includes(n))];
};
