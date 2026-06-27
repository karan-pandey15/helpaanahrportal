import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllUsers,
  deleteUser,
  approveUser,
  rejectUser,
} from "@/features/user/userThunks";
import UserTable from "./component/UserTable";
import AddUser from "./component/AddUser";
import { toast } from "react-toastify";
import ConfirmDialog from "@/components/partials/header/Tools/ConfirmDialog";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ViewUser from "./component/ViewUser";
import Loading from "@/components/Loading";
import RefreshButton from "@/components/ui/RefreshButton";

const UserDashboard = () => {
  const [openAddUser, setOpenAddUser] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [confirmUser, setConfirmUser] = useState(null);
  const [rejectUserModal, setRejectUserModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const dispatch = useDispatch();
  const { users, loading } = useSelector((s) => s.users);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [viewUser, setViewUser] = useState(null);
  const [focusUserId, setFocusUserId] = useState(null);
  const [jumpToLastPage, setJumpToLastPage] = useState(false);
  const [actionUserId, setActionUserId] = useState(null);

  useEffect(() => {
    dispatch(getAllUsers());
  }, [dispatch]);

  useEffect(() => {
    if (!jumpToLastPage) return;
    if (!users.length) return;

    const lastPage = Math.floor((users.length - 1) / pageSize);
    setPageIndex(lastPage);

    setJumpToLastPage(false); // reset
  }, [users, pageSize, jumpToLastPage]);

  const handleDelete = async () => {
    await dispatch(deleteUser(confirmUser._id));
    toast.success("User deleted");
    setConfirmUser(null);
  };

  const handleApprove = async (user) => {
    try {
      setActionUserId(user._id);
      const result = await dispatch(approveUser(user._id)).unwrap();
      toast.success(result?.message || "User approved successfully");
    } catch (error) {
      toast.error(error || "Failed to approve user");
    } finally {
      setActionUserId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectUserModal?._id) return;
    try {
      setActionUserId(rejectUserModal._id);
      const result = await dispatch(
        rejectUser({ id: rejectUserModal._id, reason: rejectReason }),
      ).unwrap();
      toast.success(result?.message || "User rejected successfully");
      setRejectUserModal(null);
      setRejectReason("");
    } catch (error) {
      toast.error(error || "Failed to reject user");
    } finally {
      setActionUserId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <Breadcrumbs />
        <div className="flex flex-wrap items-center gap-3">
          <RefreshButton onClick={() => dispatch(getAllUsers())} loading={loading} />
          <button
            onClick={() => setOpenAddUser(true)}
            className="bg-black text-white bg-black-700 px-8 py-3 rounded-lg hover:bg-gray-800 transition"
          >
            + Add User
          </button>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <UserTable
          users={users}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={setPageSize}
          onView={(u) => setViewUser(u)}
          onEdit={(u) => {
            setEditUser(u);
            setOpenAddUser(true);
          }}
          onDelete={(u) => setConfirmUser(u)}
          onApprove={handleApprove}
          onReject={(u) => {
            setRejectUserModal(u);
            setRejectReason("");
          }}
          actionUserId={actionUserId}
          focusUserId={focusUserId}
        />
      )}

      <ConfirmDialog
        open={!!confirmUser}
        title="Delete User"
        description={`Delete ${confirmUser?.name}?`}
        onClose={() => setConfirmUser(null)}
        onConfirm={handleDelete}
      />

      <RejectReasonModal
        open={!!rejectUserModal}
        user={rejectUserModal}
        reason={rejectReason}
        loading={actionUserId === rejectUserModal?._id}
        onReasonChange={setRejectReason}
        onClose={() => {
          if (actionUserId === rejectUserModal?._id) return;
          setRejectUserModal(null);
          setRejectReason("");
        }}
        onConfirm={handleReject}
      />

      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <ViewUser user={viewUser} onClose={() => setViewUser(null)} />

          <div className="relative w-full max-w-xl bg-white rounded-xl shadow-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">View User</h3>
              <button
                onClick={() => setViewUser(null)}
                className="text-xl text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <p className="text-slate-500">User.</p>
            </div>
          </div>
        </div>
      )}

      {openAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:pt-10">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpenAddUser(false)}
          />

          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-white rounded-xl shadow-lg">
            <div className="flex items-center justify-between px-6 py-6 border-b">
              <h3 className="text-lg font-semibold">
                {editUser ? "Edit User" : "Add User"}
              </h3>

              <button
                onClick={() => setOpenAddUser(false)}
                className="text-xl text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <AddUser
                editUser={editUser}
                onClose={({ focusUserId, isAdd } = {}) => {
                  setOpenAddUser(false);
                  setEditUser(null);

                  if (focusUserId) {
                    setFocusUserId(focusUserId);
                  }

                  if (isAdd) {
                    setJumpToLastPage(true);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;

const RejectReasonModal = ({
  open,
  user,
  reason,
  loading,
  onReasonChange,
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-xl bg-white shadow-lg mx-4">
        <div className="border-b px-5 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Reject User Request
          </h3>
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-slate-600">
            Enter the rejection reason for <strong>{user?.name}</strong>.
          </p>

          <textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Enter rejection reason"
            rows={4}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>

        <div className="flex justify-end gap-2 border-t px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Rejecting..." : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
};
