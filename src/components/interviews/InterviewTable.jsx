import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  forwardRef,
  Fragment,
} from "react";
import Card from "@/components/ui/Card";
import Tooltip from "@/components/ui/Tooltip";
import Icon from "@/components/ui/Icon";
import { updateInterview } from "@/features/interviews/interviewSlice";
import { useDispatch, useSelector } from "react-redux";
import { addStatus } from "@/features/status/statusSlice";
import useAuth from "@/hooks/useAuth";
import {
  ArrowDownWideNarrow,
  Grid3x3,
  Funnel,
  ArrowUpNarrowWide,
} from "lucide-react";

import { fetchInterviews } from "@/features/interviews/interviewSlice";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { cn } from "@/utils/cls";
import RequestBadge from "@/components/interviews/RequestBadge";

const IndeterminateCheckbox = forwardRef(({ indeterminate, ...rest }, ref) => {
  useEffect(() => {
    if (ref?.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate, ref]);

  return (
    <input
      type="checkbox"
      ref={ref}
      className="table-checkbox dark:border-slate-600"
      {...rest}
    />
  );
});

const InterviewTable = ({
  round,
  interviews,
  pageIndex,
  pageSize,
  onPageIndexChange,
  onPageSizeChange,
  onView,
  onEdit,
  onDelete,
  focusInterviewId,
  interviewers = [],
  onAssignInterviewer,
}) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState({});
  const rowRefs = useRef({});
  const { role } = useAuth();
  const [customStatusRowId, setCustomStatusRowId] = useState(null);
  const [customStatus, setCustomStatus] = useState("");
  const dispatch = useDispatch();
  const [savingRowId, setSavingRowId] = useState(null);
  const data = useMemo(() => interviews, [interviews]);
  const { statuses, fetchLoading } = useSelector((s) => s.status);
  const { activeTab, currentPage, limit } = useSelector((s) => s.interviews);

   const user = useSelector((state) => state.auth.user); 
  const defaultVisible = {
    candidateName: { label: "Candidate Name", value: true },
    email: { label: "Email", value: true },
    phone: { label: "Phone", value: false },
    position: { label: "Position", value: true },
    currentCompany: { label: "Current Company", value: false },
    experience: { label: "Experience", value: false },
    currentCtc: { label: "Current CTC", value: false },
    expectedCtc: { label: "Expected CTC", value: false },
    noticePeriod: { label: "Notice Period", value: false },
    round: { label: "Interview Round", value: true },
    interviewDateTime: { label: "Interview Date & Time", value: true },
    joiningDate: { label: "Joining Date", value: false },
    meetingLink: { label: "Meeting Link", value: false },
    assignedInterviewer: { label: "Assigned Interviewer", value: true },
    status: { label: "Status", value: true },
    createdBy: { label: "Created By", value: false },
    createdAt: { label: "Created At", value: false },
    updatedAt: { label: "Last Updated", value: false },
    _id: { label: "ID", value: false },
  };
  const getStorageKey = () =>
    user ? `interviewTableVisibleColumns_${user.id}` : null;
 
  const totalColumns = useMemo(() => {
    const cols = new Set();
    const arr = Array.isArray(data) ? data : [];

    arr.forEach((u) => {
      Object.keys(u).forEach((k) => {
        if (defaultVisible[k]) {
          cols.add(k);
        }
      });
    });

    return cols;
  }, [data]);
 
  const [visibleColumns, setVisibleColumns] = useState(() => {
    if (!user) return defaultVisible;

    const saved = localStorage.getItem(
      `interviewTableVisibleColumns_${user.id}`
    );

    if (saved) {
      try {
        return { ...defaultVisible, ...JSON.parse(saved) };
      } catch {
        return defaultVisible;
      }
    }

    return defaultVisible;
  });
 
  useEffect(() => {
    if (!user) return;

    const key = getStorageKey();
    localStorage.setItem(key, JSON.stringify(visibleColumns));
  }, [visibleColumns, user]);
 
  useEffect(() => {
    if (!user) return;

    const key = getStorageKey();
    const saved = localStorage.getItem(key);

    if (saved) {
      setVisibleColumns({ ...defaultVisible, ...JSON.parse(saved) });
    } else {
      setVisibleColumns(defaultVisible);
    }
  }, [user]);

  const isAdmin = role === "admin";
  const isHR = role === "hr";
  const isInterviewer = role === "interviewer";

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    if (!focusInterviewId || !interviews.length) return;

    const index = interviews.findIndex((i) => i._id === focusInterviewId);
    if (index === -1) return;

    const targetPage = Math.floor(index / pageSize);
    onPageIndexChange(targetPage, round);

    setTimeout(() => {
      rowRefs.current[focusInterviewId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 120);
  }, [focusInterviewId, interviews, pageSize]);

  const normalizeStatus = (label) =>
    label
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

  const displayStatus = (value) =>
    value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const allStatusOptions = useMemo(() => {
    return (statuses || []).map((s) => ({
      value: s.status,
      label: s.status,
    }));
  }, [statuses]);

  const inputClass =
    "w-full px-4 py-2 rounded-lg border " +
    "bg-white dark:bg-slate-700 " +
    "border-slate-300 dark:border-slate-600 " +
    "text-slate-900 dark:text-white " +
    "focus:ring-2 focus:ring-indigo-500 outline-none transition";

  const tabelCols = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <IndeterminateCheckbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <IndeterminateCheckbox
            checked={row.getIsSelected()}
            indeterminate={row.getIsSomeSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
        enableSorting: false,
      },
      { accessorKey: "_id", header: "Id" },
      {
        accessorKey: "candidateName",
        header: "Candidate",
        cell: ({ row }) => {
          const name = row.original.candidateName;
          const phone = row.original.phone;

          return (
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                {name}
                <RequestBadge type={row.original.pendingRequestType} />
              </span>

              {phone && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {phone}
                </span>
              )}
            </div>
          );
        },
      },

      { accessorKey: "email", header: "Email" },
      { accessorKey: "phone", header: "Phone" },
      { accessorKey: "position", header: "Position" },
      {
        accessorKey: "interviewDateTime",
        header: "Interview Date",
        size: 220,
        cell: ({ getValue }) => {
          const value = getValue();
          if (!value) return "N/A";

          const date = new Date(value);
          const today = new Date();
          const isToday =
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();

          return (
            <span
              className={cn(
                "text-sm px-2 py-1 rounded-md inline-block",
                isToday &&
                  "text-orange-800 dark:text-orange-200 font-medium",
              )}
            >
              {formatDate(value)}
            </span>
          );
        },
      },
      { accessorKey: "round", header: "Round" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          if (isHR) {
            return (
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {status ? displayStatus(status) : "Not Status"}
              </span>
            );
          }

          const rowId = row.original._id;
          const isCustom = customStatusRowId === rowId;
          const isSaving = savingRowId === rowId;
          const assignedInterviewerId =
            typeof row.original.assignedInterviewer === "object"
              ? row.original.assignedInterviewer?._id
              : row.original.assignedInterviewer;

          if (!assignedInterviewerId || fetchLoading) {
            return (
              <select className={inputClass} disabled>
                <option>
                  {fetchLoading ? "Loading statuses..." : "Select Status"}
                </option>
              </select>
            );
          }

          if (isCustom) {
            return (
              <input
                autoFocus
                disabled={isSaving}
                className={inputClass}
                placeholder="Add custom status..."
                onKeyDown={async (e) => {
                  if (e.key !== "Enter") return;
                  const customStatus = e.target.value;
                  const label = customStatus.trim();
                  if (!label) return;

                  if (allStatusOptions.some((o) => o.value === label)) {
                    alert("Status already exists");
                    return;
                  }

                  try {
                    setSavingRowId(rowId);

                    await dispatch(addStatus({ status: label })).unwrap();
                    await dispatch(
                      updateInterview({
                        id: rowId,
                        payload: { status: label },
                      }),
                    );

                    setCustomStatus("");
                    setCustomStatusRowId(null);
                  } finally {
                    setSavingRowId(null);
                  }
                }}
              />
            );
          }

          return (
            <select
              disabled={isSaving}
              className={inputClass}
              value={
                allStatusOptions.some((o) => o.value === status) ? status : ""
              }
              onChange={async function handleStatusChange(e) {
                const value = e.target.value;

                if (value === "__custom__") {
                  setCustomStatusRowId(rowId);
                  setCustomStatus("");
                  return;
                }

                setSavingRowId(rowId);
                await dispatch(
                  updateInterview({
                    id: rowId,
                    payload: {
                      status: value,
                      assignedInterviewer: row.original?.assignedInterviewer,
                    },
                  }),
                );
                dispatch(
                  fetchInterviews({
                    round: activeTab,
                    page: currentPage,
                    limit,
                  }),
                );
                setSavingRowId(null);
              }}
            >
              <option value="">Select Status</option>
              {allStatusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
              <option value="__custom__">➕ Add custom status</option>
            </select>
          );
        },
      },
      {
        id: "interviewer",
        accessorKey: "assignedInterviewer",
        header: "Interviewer",
        cell: ({ row }) => {
          const assignedId = row.original?.assignedInterviewer;
          const assignedUser = interviewers.find((u) => u._id === assignedId);

          if (isInterviewer) {
            return assignedUser ? (
              <div>
                <div className="font-medium">{assignedUser.name}</div>
                <div className="text-xs text-slate-500">
                  {assignedUser.email}
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-400">Not Assigned</span>
            );
          }

          return (
            <select
              className={inputClass}
              value={assignedId || ""}
              onChange={async (e) => {
                const selected = interviewers.find(
                  (u) => u._id === e.target.value,
                );

                if (selected) {
                  await onAssignInterviewer(row.original, selected);
                }
              }}
            >
              <option value="">Select Interviewer</option>
              {interviewers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          );
        },
      },
      {
        accessorKey: "noticePeriod",
        header: "Notice Period",
        cell: ({ getValue }) => getValue() || "N/A",
      },
      {
        accessorKey: "createdBy",
        header: "Created By",
        cell: ({ row }) => row.original.createdBy?.name || "N/A"
      },
      { accessorKey: "createdAt", header: "Created At" },
      { accessorKey: "updatedAt", header: "Last Updated" },
      {
        id: "action",
        header: "Action",
        size: 140,
        cell: actionBody({
          onView,
          onEdit,
          onDelete,
          isInterviewer,
          canDelete: isAdmin,
        }),
      },
    ],
    [
      role,
      isAdmin,
      isHR,
      isInterviewer,
      interviewers,
      onAssignInterviewer,
      onView,
      onEdit,
      onDelete,
      allStatusOptions,
      savingRowId,
      customStatusRowId,
    ],
  );

  const columns = useMemo(() => {
    return tabelCols.filter(
      (col) =>
        visibleColumns[col?.accessorKey || col?.id]?.value ||
        col?.id === "select" ||
        col?.id === "action",
    );
  }, [
    onEdit,
    onDelete,
    visibleColumns,
    fetchLoading,
    customStatusRowId,
  ]);

  const { totalPages, count } = useSelector((state) => state.interviews);
  console.log("the count is ", count);
  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      rowSelection,
      pagination: { pageIndex, pageSize },
    },
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  const canPrev = pageIndex > 0;
  const canNext = pageIndex < totalPages - 1;
  const rangeStart = count === 0 ? 0 : pageIndex * pageSize + 1;
  const rangeEnd = count === 0 ? 0 : Math.min((pageIndex + 1) * pageSize, count);

  return (
    <Card className="mb-0 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
      <div className="md:flex justify-between items-center mb-6">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-lg font-semibold capitalize ">{round}</h2>
          <SelectColumns
            availableColumns={tabelCols}
            totalColumns={totalColumns}
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
          />
        </div>
      </div>
      <div className="overflow-x-auto -mx-6 -mt-6 overflow-y-hidden">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 table-fixed">
          <thead className="bg-slate-200 dark:bg-slate-700">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const isSorted = header.column.getIsSorted();
                  const shouldSkip = ["select", "action"].includes(header.id);
                  return (
                    <th
                      key={header.id}
                      className="table-th border-x border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex justify-between gap-2 items-center ">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {isSorted === "asc" && (
                          <ArrowUpNarrowWide
                            className="text-cyan-400"
                            size={14}
                          />
                        )}
                        {isSorted === "desc" && (
                          <ArrowDownWideNarrow
                            className="text-cyan-400"
                            size={14}
                          />
                        )}
                        {shouldSkip === false &&
                          isSorted !== "desc" &&
                          isSorted !== "asc" && <Funnel size={12} />}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                ref={(el) => {
                  rowRefs.current[row.original._id] = el;
                }}
                className="hover:bg-slate-50  dark:hover:bg-slate-700/50 transition"
              >
                {row.getVisibleCells().map((cell) => {
                  return (
                    <td
                      key={cell.id}
                      className="table-td normal-case text-slate-700 dark:text-slate-200"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* <EmptyCells
              size={pageSize}
              cuurentItemsCount={table?.getRowModel()?.rows?.length}
            /> */}
          </tbody>
        </table>
      </div>

      <div className="md:flex md:space-y-0 space-y-5 justify-between mt-6 items-center">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <select
            className="form-control py-2 w-max
              bg-white dark:bg-slate-700
              border-slate-300 dark:border-slate-600
              text-slate-900 dark:text-white"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {[10, 25, 50].map((size) => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>

          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Page {pageIndex + 1} of {totalPages}
          </span>

          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Data {rangeStart} to {rangeEnd} of {count}
          </span>
          
        </div>

        <ul className="flex flex-wrap items-center gap-y-2 space-x-3 rtl:space-x-reverse">
          <li>
            <button
              disabled={!canPrev}
              className="disabled:opacity-50"
              onClick={() => onPageIndexChange(0, round)}
            >
              <Icon icon="heroicons:chevron-double-left-solid" />
            </button>
          </li>

          <li>
            <button
              disabled={!canPrev}
              className="disabled:opacity-50"
              onClick={() => onPageIndexChange(pageIndex - 1, round)}
            >
              Prev
            </button>
          </li>

          {Array.from({ length: totalPages }).map((_, idx) => (
            <li key={idx}>
              <button
                onClick={() => onPageIndexChange(idx, round)}
                className={`h-6 w-6 rounded text-sm flex items-center justify-center
            ${idx === pageIndex
                    ? "bg-slate-900 text-white dark:bg-slate-600"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-300"
                  }`}
              >
                {idx + 1}
              </button>
            </li>
          ))}

          <li>
            <button
              disabled={!canNext}
              className="disabled:opacity-50"
              onClick={() => onPageIndexChange(pageIndex + 1, round)}
            >
              Next
            </button>
          </li>

          <li>
            <button
              disabled={!canNext}
              className="disabled:opacity-50"
              onClick={() => onPageIndexChange(totalPages - 1, round)}
            >
              <Icon icon="heroicons:chevron-double-right-solid" />
            </button>
          </li>
        </ul>
      </div>
    </Card>
  );
};

export default InterviewTable;

function actionBody({ onView, onEdit, onDelete, isInterviewer, canDelete }) {
  return ({ row }) => (
    <div className="flex space-x-3 rtl:space-x-reverse">
      <Tooltip content="View">
        <button
          className="action-btn text-slate-600 dark:text-slate-300"
          onClick={() => onView?.(row.original)}
        >
          <Icon icon="heroicons:eye" />
        </button>
      </Tooltip>

      <Tooltip
        content={isInterviewer ? "Interviewer cannot edit interview" : "Edit"}
        theme={isInterviewer ? "danger" : "default"}
      >
        <button
          disabled={isInterviewer}
          className={`action-btn ${isInterviewer
              ? "text-gray-400 cursor-not-allowed"
              : "text-slate-600 dark:text-slate-300"
            }`}
          onClick={() => !isInterviewer && onEdit?.({ ...row.original })}
        >
          <Icon icon="heroicons:pencil-square" />
        </button>
      </Tooltip>

      {/* Delete is admin-only. Hidden entirely for HR and interviewers. */}
      {canDelete && (
        <Tooltip content="Delete" theme="danger">
          <button
            className="action-btn text-red-500"
            onClick={() => onDelete?.(row.original)}
          >
            <Icon icon="heroicons:trash" />
          </button>
        </Tooltip>
      )}
    </div>
  );
}

function SelectColumns({
  availableColumns,
  totalColumns,
  visibleColumns,
  setVisibleColumns,
}) {
  let filterAvailableCols = availableColumns
    .filter((c) => {
      return totalColumns.has(c.id) || totalColumns.has(c.accessorKey);
    })
    .filter((c) => c.accessorKey !== "email");

  const [open, setOpen] = useState(false);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".select-columns-dropdown")) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative select-columns-dropdown">
      <Tooltip content="Select Columns">
        <button
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "text-slate-600 text-xs flex items-center gap-2 border border-muted px-3 py-1 rounded-md min-w-[200px] dark:text-slate-300",
            open
              ? "bg-slate-100 dark:bg-slate-700"
              : "bg-white dark:bg-slate-800",
          )}
        >
          <Grid3x3 size={14} />
          <span>
            Active Columns:{" "}
            {Object.values(visibleColumns).filter((v) => v.value).length} /{" "}
            {filterAvailableCols?.length || 0}
          </span>
        </button>
      </Tooltip>
      <ul
        className={`absolute top-full mt-1 max-h-[200px] overflow-y-auto right-0 w-48 bg-white dark:bg-slate-700 rounded shadow-lg  z-10 ${open ? "block" : "hidden"}`}
      >
        {filterAvailableCols?.map((col) => (
          <li
            key={col?.id || col?.accessorKey}
            className="px-2 py-2 m-0 border-b border-b-muted "
          >
            <label className="h-fit flex items-center space-x-2 gap-4 rtl:space-x-reverse text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                className="table-checkbox h-3 w-3"
                checked={visibleColumns[col.accessorKey]?.value}
                onChange={() => {
                  setVisibleColumns((vc) => ({
                    ...vc,
                    [col.accessorKey]: {
                      ...vc[col.accessorKey],
                      value: !vc[col.accessorKey]?.value,
                    },
                  }));
                }}
              />
              {visibleColumns[col.accessorKey]?.label || col}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyCells({ size, cuurentItemsCount }) {
  const maxFillUp = Math.min(5, size - cuurentItemsCount);
  return (
    <Fragment>
      {Array.from({ length: maxFillUp }).map((_, i) => {
        return (
          <tr key={i} className={"table-td "}>
            <td className={"table-td text-slate-700 dark:text-slate-200"}>
              <span className="opacity-0">{i}</span>
            </td>
          </tr>
        );
      })}
      <tr></tr>
    </Fragment>
  );
}
