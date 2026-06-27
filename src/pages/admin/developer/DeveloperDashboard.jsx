import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import UserTable from "./component/DeveloperTable";
import { toast } from "react-toastify";
import ConfirmDialog from "@/components/partials/header/Tools/ConfirmDialog";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Loading from "@/components/Loading";
import RefreshButton from "@/components/ui/RefreshButton";
import AddDeveloperModal from "./component/AddDeveloperModal";
import EditDeveloperModal from "./component/EditDeveloperModal";
import { fetchDeveloperData } from "../../../features/user/developerSlice";
import {
  resendDeveloper,
  deleteDeveloper,
  requestDeveloperEdit,
} from "../../../features/user/addDeveloperService";
import ViewDeveloper from "./component/ViewDeveloper";
const DeveloperDashboard = () => {
  const dispatch = useDispatch();

  const [openAddDeveloper, setOpenAddDeveloper] = useState(false);
  const [editDeveloper, setEditDeveloper] = useState(null);
  const [confirmDeveloper, setConfirmDeveloper] = useState(null);
  const [requestEditDeveloper, setRequestEditDeveloper] = useState(null);
  const { developers, loading } = useSelector((s) => s.developer);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [viewDeveloper, setViewDeveloper] = useState(null);
  const [focusDeveloperId, setFocusDeveloperId] = useState(null);
  const [jumpToLastPage, setJumpToLastPage] = useState(false);

  useEffect(() => {
    dispatch(fetchDeveloperData());
  }, [dispatch]);

  useEffect(() => {
    console.log("developer state", developers);
  }, [developers]);
  useEffect(() => {
    if (!jumpToLastPage) return;
    if (!developers.length) return;

    const lastPage = Math.floor((developers.length - 1) / pageSize);
    setPageIndex(lastPage);

    setJumpToLastPage(false); // reset
  }, [developers, pageSize, jumpToLastPage]);

  const handleDelete = async () => {
    if (!confirmDeveloper?._id) return;
    try {
      await deleteDeveloper(confirmDeveloper._id);
      await dispatch(fetchDeveloperData());
      toast.success("Developer deleted");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to delete developer",
      );
    } finally {
      setConfirmDeveloper(null);
    }
  };

  const handleResend = async (developer) => {
    if (!developer?._id) return;
    try {
      await resendDeveloper(developer._id);
      toast.success("Onboarding email resent");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to resend invite",
      );
    }
  };

  const handleRequestEdit = async () => {
    if (!requestEditDeveloper?._id) return;
    try {
      const res = await requestDeveloperEdit(requestEditDeveloper._id);
      await dispatch(fetchDeveloperData());
      toast.success(res?.message || "Edit request sent to developer");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to request edit",
      );
    } finally {
      setRequestEditDeveloper(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <Breadcrumbs />
        <div className="flex flex-wrap items-center gap-3">
          <RefreshButton onClick={() => dispatch(fetchDeveloperData())} loading={loading} />
          <button
            onClick={() => setOpenAddDeveloper(true)}
            className="bg-black text-white bg-black-700 px-8 py-3 rounded-lg hover:bg-gray-800 transition"
          >
            + Add Developer
          </button>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <UserTable
          users={developers || []}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={setPageSize}
          onView={(u) => setViewDeveloper(u)}
          onEdit={(u) => setEditDeveloper(u)}
          onDelete={(u) => setConfirmDeveloper(u)}
          onResend={handleResend}
          onRequestEdit={(u) => setRequestEditDeveloper(u)}
          focusDeveloperId={focusDeveloperId}
        />
      )}

      <ConfirmDialog
        open={!!confirmDeveloper}
        title="Delete Developer"
        description={`Delete ${confirmDeveloper?.email || "this developer"}?`}
        onClose={() => setConfirmDeveloper(null)}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={!!requestEditDeveloper}
        title="Request Edit"
        description={`Re-open the form and email an edit link to ${
          requestEditDeveloper?.email || "this developer"
        }?`}
        onClose={() => setRequestEditDeveloper(null)}
        onConfirm={handleRequestEdit}
      />

      {editDeveloper && (
        <EditDeveloperModal
          developer={editDeveloper}
          onClose={() => setEditDeveloper(null)}
          onSaved={() => dispatch(fetchDeveloperData())}
        />
      )}
      {viewDeveloper && (
        <ViewDeveloper
          developer={viewDeveloper}
          onClose={() => setViewDeveloper(null)}
        />
      )}

      {openAddDeveloper && (
        <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-lg">
          <div className="p-6">
            <AddDeveloperModal
              editDeveloper={editDeveloper}
              onClose={({ focusDeveloperId, isAdd } = {}) => {
                setOpenAddDeveloper(false);
                setEditDeveloper(null);

                if (focusDeveloperId) {
                  setFocusDeveloperId(focusDeveloperId);
                }

                if (isAdd) {
                  setJumpToLastPage(true);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DeveloperDashboard;
