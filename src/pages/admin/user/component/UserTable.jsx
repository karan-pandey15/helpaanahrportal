import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  Fragment,
} from "react";
import Card from "@/components/ui/Card";
import Tooltip from "@/components/ui/Tooltip";
import Icon from "@/components/ui/Icon";
import GlobalFilter from "../../../../components/ui/GlobalFilter";
import {
  ArrowDownWideNarrow,
  Grid3x3,
  Funnel,
  ArrowUpNarrowWide,
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useSelector } from "react-redux";

const IndeterminateCheckbox = ({ indeterminate, ...rest }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      type="checkbox"
      ref={ref}
      className="table-checkbox dark:border-slate-600"
      {...rest}
    />
  );
};

const getCreatedBy = (createdBy) =>
  createdBy?.name ? createdBy.name : "System";

const getApprovalBadgeClass = (status) => {
  if (status === "approved") return "bg-green-100 text-green-700";
  if (status === "rejected") return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
};

const UserTable = ({
  users,
  pageIndex,
  pageSize,
  onPageIndexChange,
  onPageSizeChange,
  onView,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  actionUserId,
  focusUserId,
}) => {
  const data = users;
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState({});
  const user = useSelector((state) => state.auth.user);

  const defaultVisible = {
    name: { label: "Name", value: true },
    email: { label: "Email", value: true },
    phone: { label: "Phone", value: true },
    role: { label: "Role", value: true },
    approvalStatus: { label: "Approval Status", value: true },
    createdBy: { label: "Created By", value: true },
    updatedBy: { label: "Updated By", value: false },
    createdAt: { label: "Created At", value: false },
    updatedAt: { label: "Last Updated", value: true },
  };

  const getStorageKey = () =>
    user ? `userTableVisibleColumns_${user.id}` : null;

  const totalColumns = useMemo(() => {
    const cols = new Set();
    users.forEach((u) => {
      Object.keys(u).forEach((k) => {
        if (defaultVisible[k]) {
          cols.add(k);
        }
      });
    });
    return cols;
  }, [users]);

  const [visibleColumns, setVisibleColumns] = useState(() => {
    if (!user) return defaultVisible;

    const saved = localStorage.getItem(`userTableVisibleColumns_${user.id}`);

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

  const rowRefs = useRef({});

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
    if (!focusUserId || !users.length) return;

    const userIndex = users.findIndex((u) => u._id === focusUserId);
    if (userIndex === -1) return;

    const targetPage = Math.floor(userIndex / pageSize);
    onPageIndexChange(targetPage);

    setTimeout(() => {
      rowRefs.current[focusUserId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 120);
  }, [focusUserId, users, pageSize]);

  const tabelCols = useMemo(
    () => [
      {
        id: "select",
        size: 60,
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
      { accessorKey: "name", header: "Name", size: 180 },
      { accessorKey: "email", header: "Email", size: 260 },
      { accessorKey: "phone", header: "Phone", size: 160 },
      {
        accessorKey: "role",
        header: "Role",
        size: 120,
        cell: ({ getValue }) => (
          <span className="capitalize">{getValue()}</span>
        ),
      },
      {
        accessorKey: "createdBy",
        header: "Created By",
        size: 160,
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {getCreatedBy(row.original.createdBy)}
          </span>
        ),
        sortingFn: (a, b) => {
          const nameA = getCreatedBy(a.original.createdBy);
          const nameB = getCreatedBy(b.original.createdBy);
          return nameA.localeCompare(nameB);
        },
      },
      {
        accessorKey: "approvalStatus",
        header: "Approval",
        size: 150,
        cell: ({ getValue }) => (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getApprovalBadgeClass(
              getValue(),
            )}`}
          >
            {getValue() || "pending"}
          </span>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: "Last Updated",
        size: 200,
        cell: ({ getValue }) => (
          <span className="text-sm">{formatDate(getValue())}</span>
        ),
      },
      {
        accessorKey: "updatedBy",
        header: "Updated By",
        size: 200,
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.updatedBy?.name || "—"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        size: 200,
        cell: ({ getValue }) => (
          <span className="text-sm">{formatDate(getValue())}</span>
        ),
      },
      {
        id: "action",
        header: "Action",
        size: 140,
        cell: actionBody({
          onView,
          onEdit,
          onDelete,
          onApprove,
          onReject,
          userRole: user?.role,
          actionUserId,
        }),
      },
    ],
    [onView, onEdit, onDelete, onApprove, onReject, user?.role, actionUserId],
  );

  const columns = useMemo(() => {
    return tabelCols.filter(
      (col) =>
        visibleColumns[col.accessorKey || col.id]?.value ||
        col?.id === "select" ||
        col?.id === "action",
    );
  }, [
    onEdit,
    onDelete,
    Object.keys(visibleColumns)?.filter((k) => visibleColumns[k].value).length,
  ]);

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
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex, pageSize })
          : updater;

      onPageIndexChange(next.pageIndex);
      onPageSizeChange(next.pageSize);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    columnResizeMode: "onChange",

    defaultColumn: {
      size: 180,
      minSize: 120,
      maxSize: 300,
    },
  });

  return (
    <Card className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
      <div className="md:flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">User List</h2>
          <SelectColumns
            totalColumns={totalColumns}
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
          />
        </div>
        <GlobalFilter filter={globalFilter} setFilter={setGlobalFilter} />
      </div>

      <div className="overflow-x-auto custom-scroller -mx-6">
        <table className="min-w-full custom-scroller divide-y overflow-y-clip divide-slate-200 dark:divide-slate-700 table-fixed">
          <thead className="bg-slate-200 dark:bg-slate-700">
            {table.getHeaderGroups().map((hg) => (
              <tr className="" key={hg.id}>
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

          <tbody className="bg-white dark:bg-slate-800 divide-y  divide-slate-100 dark:divide-slate-700">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                ref={(el) => {
                  rowRefs.current[row.original._id] = el;
                }}
                className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="table-td text-slate-700 dark:text-slate-200"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {/* <EmptyCells
              size={pageSize}
              cuurentItemsCount={table.getRowModel().rows.length}
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
            Page {pageIndex + 1} of {table.getPageCount()}
          </span>
        </div>

        <ul className="flex items-center space-x-3 rtl:space-x-reverse">
          <li>
            <button
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.setPageIndex(0)}
              className="text-xl text-slate-900 dark:text-white disabled:opacity-50"
            >
              <Icon icon="heroicons:chevron-double-left-solid" />
            </button>
          </li>

          <li>
            <button
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
              className="text-sm text-slate-900 dark:text-white disabled:opacity-50"
            >
              Prev
            </button>
          </li>

          {Array.from({ length: table.getPageCount() }).map((_, idx) => (
            <li key={idx}>
              <button
                onClick={() => table.setPageIndex(idx)}
                className={`h-6 w-6 rounded text-sm flex items-center justify-center
                  ${
                    idx === pageIndex
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
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
              className="text-sm text-slate-900 dark:text-white disabled:opacity-50"
            >
              Next
            </button>
          </li>

          <li>
            <button
              disabled={!table.getCanNextPage()}
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              className="text-xl text-slate-900 dark:text-white disabled:opacity-50"
            >
              <Icon icon="heroicons:chevron-double-right-solid" />
            </button>
          </li>
        </ul>
      </div>
    </Card>
  );
};

export default UserTable;

function SelectColumns({ totalColumns, visibleColumns, setVisibleColumns }) {
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
          className="text-slate-600 text-xs flex items-center gap-2 border border-muted px-3 py-1 rounded-md min-w-[200px] dark:text-slate-300"
        >
          <Grid3x3 size={14} />
          <span>
            Active Columns:{" "}
            {Object.values(visibleColumns).filter((v) => v.value).length} /{" "}
            {totalColumns.size}
          </span>
        </button>
      </Tooltip>
      <ul
        className={`absolute top-full mt-1 max-h-[200px] overflow-y-auto right-0 w-48 bg-white dark:bg-slate-700 rounded shadow-lg  z-10 ${open ? "block" : "hidden"}`}
      >
        {totalColumns.keys().map((col) => (
          <li key={col} className="px-2 py-2 m-0 border-b border-b-muted ">
            <label className="h-fit flex items-center space-x-2 gap-4 rtl:space-x-reverse text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                className="table-checkbox h-3 w-3"
                checked={visibleColumns[col]?.value}
                onChange={() => {
                  setVisibleColumns((vc) => ({
                    ...vc,
                    [col]: {
                      ...vc[col],
                      value: !vc[col]?.value,
                    },
                  }));
                }}
              />
              {visibleColumns[col]?.label || col}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

function actionBody({
  onView,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  userRole,
  actionUserId,
}) {
  return ({ row }) => (
    <div className="flex flex-wrap gap-2">
      <Tooltip content="View">
        <button
          className="action-btn text-slate-600 dark:text-slate-300"
          onClick={() => onView?.(row.original)}
        >
          <Icon icon="heroicons:eye" />
        </button>
      </Tooltip>

      <Tooltip
        content={
          row.original.role === "admin" ? "Admin cannot be edited" : "Edit"
        }
      >
        <button
          disabled={row.original.role === "admin"}
          onClick={() => onEdit?.(row.original)}
          className={`action-btn text-slate-600 dark:text-slate-300
                  ${
                    row.original.role === "admin"
                      ? "opacity-40 cursor-not-allowed"
                      : ""
                  }`}
        >
          <Icon icon="heroicons:pencil-square" />
        </button>
      </Tooltip>

      <Tooltip
        theme="danger"
        content={
          row.original.role === "admin" ? "Admin cannot be Delete" : "Delete"
        }
      >
        <button
          disabled={row.original.role === "admin"}
          className={`action-btn text-red-500 dark:text-slate-300
                  ${
                    row.original.role === "admin"
                      ? "opacity-40 cursor-not-allowed"
                      : ""
                  }`}
          onClick={() => onDelete?.(row.original)}
        >
          <Icon icon="heroicons:trash" />
        </button>
      </Tooltip>

      {userRole === "admin" && row.original.approvalStatus === "pending" ? (
        <>
          <Tooltip content="Approve">
            <button
              disabled={actionUserId === row.original._id}
              className="rounded-md bg-green-600 px-2 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => onApprove?.(row.original)}
            >
              {actionUserId === row.original._id ? "Working..." : "Approve"}
            </button>
          </Tooltip>

          <Tooltip content="Reject">
            <button
              disabled={actionUserId === row.original._id}
              className="rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => onReject?.(row.original)}
            >
              {actionUserId === row.original._id ? "Working..." : "Reject"}
            </button>
          </Tooltip>
        </>
      ) : null}
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
