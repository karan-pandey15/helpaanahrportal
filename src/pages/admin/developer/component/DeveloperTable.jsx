import React, { useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Tooltip from "@/components/ui/Tooltip";
import Icon from "@/components/ui/Icon";
import GlobalFilter from "../../../../components/ui/GlobalFilter";
import {
  ArrowDownWideNarrow,
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

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const StatusBadge = ({ status }) => {
  let label = "Invited";
  let classes =
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  if (status === "submitted") {
    label = "Submitted";
    classes =
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  } else if (status === "edit_requested") {
    label = "Edit Requested";
    classes =
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
  }
  return (
    <span
      className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${classes}`}
    >
      {label}
    </span>
  );
};

const fullName = (d) => {
  const parts = [d.firstName, d.lastName].filter(Boolean);
  return parts.length ? parts.join(" ") : "—";
};

const DeveloperTable = ({
  users,
  pageIndex,
  pageSize,
  onPageIndexChange,
  onPageSizeChange,
  onView,
  onEdit,
  onDelete,
  onResend,
  onRequestEdit,
}) => {
  const data = users;
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo(
    () => [
      { accessorKey: "email", header: "Email", size: 240 },
      {
        accessorKey: "status",
        header: "Status",
        size: 120,
        cell: ({ getValue }) => <StatusBadge status={getValue()} />,
      },
      {
        id: "name",
        header: "Name",
        size: 180,
        accessorFn: (row) => fullName(row),
        cell: ({ row }) => (
          <span className="text-sm">{fullName(row.original)}</span>
        ),
      },
      {
        accessorKey: "designation",
        header: "Designation",
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() || "—"}</span>
        ),
      },
      {
        accessorKey: "submittedAt",
        header: "Submitted",
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-sm">{formatDate(getValue())}</span>
        ),
      },
      {
        id: "action",
        header: "Actions",
        size: 220,
        cell: actionBody({ onView, onResend, onDelete, onEdit, onRequestEdit }),
      },
    ],
    [onView, onResend, onDelete, onEdit, onRequestEdit],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      pagination: { pageIndex, pageSize },
    },
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
    defaultColumn: { size: 180, minSize: 100, maxSize: 320 },
  });

  return (
    <Card className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
      <div className="md:flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Developers</h2>
        <GlobalFilter filter={globalFilter} setFilter={setGlobalFilter} />
      </div>

      <div className="overflow-x-auto custom-scroller -mx-6">
        <table className="min-w-full custom-scroller divide-y overflow-y-clip divide-slate-200 dark:divide-slate-700 table-fixed">
          <thead className="bg-slate-200 dark:bg-slate-700">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const isSorted = header.column.getIsSorted();
                  const shouldSkip = header.id === "action";
                  return (
                    <th
                      key={header.id}
                      className="table-th border-x border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex justify-between gap-2 items-center">
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
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="table-td text-center text-slate-400 py-10"
                >
                  No developers found.
                </td>
              </tr>
            )}
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
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
          </tbody>
        </table>
      </div>

      <div className="md:flex md:space-y-0 space-y-5 justify-between mt-6 items-center">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <select
            className="form-control py-2 w-max bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
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
            Page {pageIndex + 1} of {table.getPageCount() || 1}
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
                className={`h-6 w-6 rounded text-sm flex items-center justify-center ${
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

export default DeveloperTable;

function actionBody({ onView, onResend, onDelete, onEdit, onRequestEdit }) {
  return ({ row }) => {
    const dev = row.original;
    return (
      <div className="flex space-x-3 rtl:space-x-reverse">
        <Tooltip content="View">
          <button
            className="action-btn text-slate-600 dark:text-slate-300"
            onClick={() => onView?.(dev)}
          >
            <Icon icon="heroicons:eye" />
          </button>
        </Tooltip>

        <Tooltip content="Edit">
          <button
            className="action-btn text-blue-500 dark:text-blue-300"
            onClick={() => onEdit?.(dev)}
          >
            <Icon icon="heroicons:pencil-square" />
          </button>
        </Tooltip>

        <Tooltip content="Request edit">
          <button
            className="action-btn text-orange-500 dark:text-orange-300"
            onClick={() => onRequestEdit?.(dev)}
          >
            <Icon icon="heroicons:arrow-path-rounded-square" />
          </button>
        </Tooltip>

        <Tooltip content="Resend invite">
          <button
            className="action-btn text-indigo-500 dark:text-indigo-300"
            onClick={() => onResend?.(dev)}
          >
            <Icon icon="heroicons:paper-airplane" />
          </button>
        </Tooltip>

        <Tooltip theme="danger" content="Delete">
          <button
            className="action-btn text-red-500 dark:text-slate-300"
            onClick={() => onDelete?.(dev)}
          >
            <Icon icon="heroicons:trash" />
          </button>
        </Tooltip>
      </div>
    );
  };
}
