import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchInterviews,
  deleteInterview,
  fetchUsersByRole,
  assignInterviewer,
  reset,
  setPagination,
} from "@/features/interviews/interviewSlice";
import { fetchStatuses } from "@/features/status/statusSlice";

import AddInterview from "./component/AddInterview";
import ViewInterview from "./component/ViewInterview";
import { toast } from "react-toastify";
import ConfirmDialog from "@/components/partials/header/Tools/ConfirmDialog";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Loading from "@/components/Loading";
import GlobalFilter from "@/components/ui/GlobalFilter";
import { X } from "lucide-react";
import { cn } from "@/utils/cls";
import InterviewTable from "@/components/interviews/InterviewTable";
import RefreshButton from "@/components/ui/RefreshButton";

const InterviewDashboard = () => {
  const dispatch = useDispatch();
  const {
    interviews = [],
    fetchLoading,
    success,
    error,
    currentPage,
    totalPages,
    activeTab,
    limit,
    usersByRole = [],
    roundCounts = {},
  } = useSelector((s) => s.interviews || {});

  const [openAdd, setOpenAdd] = useState(false);
  const [editInterview, setEditInterview] = useState(null);
  const [confirmInterview, setConfirmInterview] = useState(null);
  const [viewInterview, setViewInterview] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [assignData, setAssignData] = useState(null);

  const tabConfig = useMemo(() => {
    const builtin = [
      { label: "Pending", value: "pending" },
      { label: "1st Round", value: "1st round" },
      { label: "2nd Round", value: "2nd round" },
      { label: "Final Round", value: "final round" },
      { label: "Hired", value: "hired" },
      { label: "Rejected", value: "rejected" },
      { label: "Offer Declined", value: "offer declined" },
    ];
    // Append admin/HR custom rounds (e.g. "Manager Round") that have
    // interviews — roundCounts already counts every round, built-in or custom.
    const builtinValues = new Set(builtin.map((t) => t.value));
    const customTabs = Object.keys(roundCounts || {})
      .filter((r) => r && !builtinValues.has(r))
      .sort((a, b) => a.localeCompare(b))
      .map((r) => ({
        label: r.replace(/\b\w/g, (c) => c.toUpperCase()),
        value: r,
      }));
    return [...builtin, ...customTabs];
  }, [roundCounts]);

  const tabs = useMemo(
    () =>
      tabConfig.map((tab) => ({
        ...tab,
        count: Number(roundCounts?.[tab.value] || 0),
      })).filter((tab) => tab.count > 0),
    [tabConfig, roundCounts],
  );

  useEffect(() => {
    if (tabs.length === 0) return;
    const isValidTab = tabs.some((tab) => tab.value === activeTab);
    if (!isValidTab) {
      dispatch(setPagination({ activeTab: tabs[0].value, page: 1 }));
    }
  }, [activeTab, dispatch, tabs]);

  useEffect(() => {
    dispatch(fetchInterviews({ round: activeTab, page: currentPage, limit }));
    dispatch(fetchUsersByRole("interviewer"));
    dispatch(fetchStatuses());
  }, [dispatch, activeTab, currentPage, limit]);

  useEffect(() => {
    if (success) {
      toast.success(success);
      dispatch(reset());
    }
    if (error) {
      toast.error(error);
      dispatch(reset());
    }
  }, [success, error, dispatch]);

  const handleRefresh = () => {
    dispatch(fetchInterviews({ round: activeTab, page: currentPage, limit }));
    dispatch(fetchUsersByRole("interviewer"));
    dispatch(fetchStatuses());
  };

  const handleTabClick = (tabValue) => {
    dispatch(setPagination({ activeTab: tabValue, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      dispatch(setPagination({ page: newPage }));
    }
  };

  const handleDelete = async () => {
    await dispatch(deleteInterview(confirmInterview._id));
    setConfirmInterview(null);
    dispatch(fetchInterviews({ round: activeTab, page: currentPage, limit }));
  };

  const handleAssignConfirm = async () => {
    if (!assignData) return;
    await dispatch(
      assignInterviewer({
        candidateId: assignData.interview._id,
        interviewerId: assignData.interviewer._id,
      }),
    );
    setAssignData(null);
    dispatch(fetchInterviews({ round: activeTab, page: currentPage, limit }));
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <Breadcrumbs />
        <div className="flex flex-wrap items-center gap-3">
          <RefreshButton onClick={handleRefresh} loading={fetchLoading} />
          <GlobalFilter filter={globalFilter} setFilter={setGlobalFilter} />
          <button
            onClick={() => {
              setOpenAdd(true);
              setEditInterview(null);
            }}
            className="bg-black-500 text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition"
          >
            + Add Interview
          </button>
        </div>
      </div>

      <div className="flex border-b border-gray-200 dark:border-slate-700 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabClick(tab.value)}
            className={cn(
              "px-6 py-3 text-sm font-medium transition whitespace-nowrap",
              activeTab === tab.value
                ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200",
            )}
          >
            <span>{tab.label}</span>
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-200 px-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {fetchLoading && <Loading />}

      <InterviewTable
        round={activeTab}
        interviews={interviews}
        pageIndex={currentPage - 1}
        pageSize={limit}
        onPageIndexChange={(idx) => handlePageChange(idx + 1)}
        onPageSizeChange={(size) => dispatch(setPagination({ limit: size, page: 1 }))}
        onView={(i) => setViewInterview(i)}
        onEdit={(i) => {
          setEditInterview(i);
          setOpenAdd(true);
        }}
        onDelete={(i) => setConfirmInterview(i)}
        interviewers={usersByRole}
        onAssignInterviewer={(interview, interviewer) =>
          setAssignData({ interview, interviewer })
        }
      />

      <div className="flex items-center justify-center gap-4 mt-8">
        <button
          disabled={currentPage === 1 || fetchLoading}
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm font-medium">
          Page {currentPage} of {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages || fetchLoading}
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md disabled:opacity-50"
        >
          Next
        </button>
      </div>

      <ConfirmDialog
        open={!!confirmInterview}
        title="Delete Interview"
        description={`Delete interview of ${confirmInterview?.candidateName}?`}
        onClose={() => setConfirmInterview(null)}
        onConfirm={handleDelete}
      />

      {assignData && (
        <ConfirmDialog
          open={true}
          title="Assign Interviewer"
          description={`Assign interview to Candidate Name: ${assignData.interview.candidateName}
                Interviewer Name: ${assignData.interviewer.name}?`}
          onClose={() => setAssignData(null)}
          onConfirm={handleAssignConfirm}
        />
      )}

      {viewInterview && (
        <ViewInterview
          interview={viewInterview}
          onClose={() => setViewInterview(null)}
        />
      )}

      {openAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:pt-10">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpenAdd(false)}
          />
          <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-700 rounded-xl shadow-lg">
            <div className="flex items-center justify-between px-6 py-6 border-b">
              <h3 className="text-lg font-semibold">
                {editInterview ? "Edit Interview" : "Add Interview"}
              </h3>
              <button
                onClick={() => setOpenAdd(false)}
                className="text-xl text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <AddInterview
                editInterview={editInterview}
                onClose={async () => {
                  setOpenAdd(false);
                  setEditInterview(null);
                  dispatch(fetchInterviews({ round: activeTab, page: currentPage, limit }));
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewDashboard;
