export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const initialInterviewForm = {
  candidateName: "",
  email: "",
  phone: "",
  position: "MERN Stack Developer",
  currentCtc: "",
  expectedCtc: "",
  experience: "",
  round: "pending",
  joiningDate: "",
  interviewDateTime: "",
  meetingLink: "",
  status: "",
  currentCompany: "",
  noticePeriod: "",
};

export const statusOptions = [
  "Not joined",
  "Missed",
  "Need to do 2nd round",
  "Lack of knowledge",
];

export const ROLE_BASED_ROOT_PATH = {
  admin: "/admin/dashboard",
  hr: "/hr/dashboard",
  interviewer: "/interviewer/dashboard",
};
