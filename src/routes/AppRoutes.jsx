import { Routes, Route, Navigate } from "react-router-dom";
import React, { lazy, Suspense } from "react";

const Login = lazy(() => import("../pages/Login"));
const Signup = lazy(() => import("../pages/Signup"));
const SetPassword = lazy(() => import("../pages/SetPassword"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/ResetPassword"));
const Unauthorized = lazy(() => import("../pages/Unauthorized"));
// Public candidate page (reschedule/cancel via tokenized email link — no login)
const InterviewResponse = lazy(() => import("../pages/InterviewResponse"));
// Public developer onboarding page (tokenized email link — no login)
const DeveloperForm = lazy(() => import("../pages/DeveloperForm"));

const ProtectedRoute = lazy(() => import("./ProtectedRoute"));
const RoleRoute = lazy(() => import("./RoleRoute"));
const Layout = lazy(() => import("../layouts/Layout"));

const AdminUserDashboard = lazy(
  () => import("../pages/admin/user/UserDashboard"),
);
const AdminAddDeveloper = lazy(
  () => import("../pages/admin/developer/DeveloperDashboard"),
);
const AdminStatusDashboard = lazy(
  () => import("../pages/admin/status/StatusDashboard"),
);
const AdminRoundSettings = lazy(
  () => import("../pages/admin/rounds/RoundSettings"),
);
const Profile = lazy(() => import("../pages/Profile"));
const AdminInterviews = lazy(
  () => import("../pages/admin/interviews/InterviewDashboard"),
);
const HRInterviews = lazy(
  () => import("../pages/hr/interviews/InterviewDashboard"),
);
const InterviewerInterviews = lazy(
  () => import("../pages/interviewer/interviews/InterviewDashboard"),
);
const InterviewList = lazy(() => import("../pages/interviews/InterviewList"));
const BulkResumeUpload = lazy(
  () => import("../pages/interviews/BulkResumeUpload"),
);
const CandidateDashboard = lazy(
  () => import("../pages/interviews/CandidateDashboard"),
);
const CandidateProfile = lazy(
  () => import("../pages/interviews/CandidateProfile"),
);
const ManageCandidates = lazy(
  () => import("../pages/interviews/ManageCandidates"),
);
const Availability = lazy(() => import("../pages/interviews/Availability"));
const ManageInterviewers = lazy(
  () => import("../pages/interviews/ManageInterviewers"),
);
const InterviewRequests = lazy(
  () => import("../pages/interviews/InterviewRequests"),
);

const AppRoutes = () => {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        {/* Public — candidate reschedule/cancel page (token in query string) */}
        <Route path="/interview-response" element={<InterviewResponse />} />
        {/* Public — developer onboarding form (token in query string) */}
        <Route path="/developer-form" element={<DeveloperForm />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            {/* Shared — Interview List (all roles) */}
            <Route
              element={
                <RoleRoute allowedRoles={["admin", "hr", "interviewer"]} />
              }
            >
              <Route path="/interview-list" element={<InterviewList />} />
              {/* Candidate detail — resume-first tabbed profile */}
              <Route path="/candidate/:id" element={<CandidateProfile />} />
              {/* User's own profile (+ admin-only Rounds & Email tab) */}
              <Route path="/profile" element={<Profile />} />
              {/* Candidate reschedule/cancel requests — interviewer is view-only */}
              <Route
                path="/interview-requests"
                element={<InterviewRequests />}
              />
            </Route>

            {/* Shared — Resume Upload & Manage Candidates (admin, hr) */}
            <Route element={<RoleRoute allowedRoles={["admin", "hr"]} />}>
              {/* Bulk resume upload — parse + store many PDFs, list them */}
              <Route
                path="/bulk-resume-upload"
                element={<BulkResumeUpload />}
              />
              {/* Resume-first candidate management (interviewer excluded) */}
              <Route path="/candidates" element={<ManageCandidates />} />
              {/* Interviewers with their booked slots */}
              <Route path="/interviewers" element={<ManageInterviewers />} />
            </Route>

            {/* Interviewer availability — interviewer edits own, admin edits any */}
            <Route element={<RoleRoute allowedRoles={["admin", "interviewer"]} />}>
              <Route path="/availability" element={<Availability />} />
            </Route>

            {/* Admin */}
            <Route element={<RoleRoute allowedRoles={["admin"]} />}>
              <Route path="/admin/dashboard" element={<CandidateDashboard />} />
              <Route path="/admin/candidate" element={<AdminUserDashboard />} />
              <Route path="/admin/interviews" element={<AdminInterviews />} />
              <Route path="/admin/status" element={<AdminStatusDashboard />} />
              <Route path="/admin/rounds" element={<AdminRoundSettings />} />
              <Route path="/admin/developers" element={<AdminAddDeveloper />} />
            </Route>

            {/* HR */}
            <Route element={<RoleRoute allowedRoles={["hr"]} />}>
              <Route path="/hr/dashboard" element={<CandidateDashboard />} />
              <Route path="/hr/interviews" element={<HRInterviews />} />
            </Route>

            {/* Interviewer */}
            <Route element={<RoleRoute allowedRoles={["interviewer"]} />}>
              <Route
                path="/interviewer/dashboard"
                element={<CandidateDashboard />}
              />
              <Route
                path="/interviewer/interviews"
                element={<InterviewerInterviews />}
              />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
