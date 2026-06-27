import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStatuses,
  removeStatus,
  resetStatus,
} from "@/features/status/statusSlice";
import { fetchInterviews } from "@/features/interviews/interviewSlice";
import StatusTable from "./component/StatusTable";
import AddStatus from "./component/AddStatus";
import ConfirmDialog from "@/components/partials/header/Tools/ConfirmDialog";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Loading from "@/components/Loading";
import RefreshButton from "@/components/ui/RefreshButton";
import { toast } from "react-toastify";

const StatusDashboard = () => {
  const dispatch = useDispatch();
  const { statuses, loading, success, error } = useSelector((s) => s.status);

  const interviews = useSelector((s) => s.interviews?.interviews || []);

  const [openAdd, setOpenAdd] = useState(false);
  const [editStatus, setEditStatus] = useState(null);
  const [confirmStatus, setConfirmStatus] = useState(null);

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    dispatch(fetchStatuses());
    dispatch(fetchInterviews());
  }, [dispatch]);

  const normalize = (val = "") => val.toLowerCase().replace(/\s+/g, "_");

  useEffect(() => {
    if (success) {
      toast.success(success);
      dispatch(resetStatus());
    }
    if (error) {
      toast.error(error);
      dispatch(resetStatus());
    }
  }, [success, error, dispatch]);

  const handleDelete = async () => {
    if (!confirmStatus) return;

    const statusValue = normalize(confirmStatus.status);

    const isUsed = interviews.some((i) => normalize(i?.status) === statusValue);

    if (isUsed) {
      toast.error(
        `Status "${confirmStatus.status}" is already used in interviews. Please change interview status first.`,
      );
      setConfirmStatus(null);
      return;
    }

    await dispatch(removeStatus(confirmStatus._id));
    toast.success("Status deleted successfully");
    setConfirmStatus(null);
  };

  const handleRefresh = () => {
    dispatch(fetchStatuses());
    dispatch(fetchInterviews());
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <Breadcrumbs />
        <div className="flex flex-wrap items-center gap-3">
          <RefreshButton onClick={handleRefresh} loading={loading} />
          <button
            onClick={() => setOpenAdd(true)}
            className="bg-black text-white bg-black-700 px-6 py-3 rounded-lg hover:bg-gray-800 transition"
            disabled={loading}
          >
            + Add Status
          </button>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <StatusTable
          statuses={statuses}
          interviews={interviews}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={setPageSize}
          onEdit={(s) => {
            if (loading) return;
            setEditStatus(s);
            setOpenAdd(true);
          }}
          onDelete={(s) => {
            if (loading) return;
            setConfirmStatus(s);
          }}
        />
      )}

      <ConfirmDialog
        open={!!confirmStatus}
        title="Delete Status"
        description={`Delete status "${confirmStatus?.status}"?`}
        onClose={() => setConfirmStatus(null)}
        loading={loading}
        onConfirm={handleDelete}
      />

      {openAdd && (
        <AddStatus
          editStatus={editStatus}
          loading={loading}
          onClose={() => {
            if (loading) return;
            setOpenAdd(false);
            setEditStatus(null);
          }}
        />
      )}
    </div>
  );
};

export default StatusDashboard;
