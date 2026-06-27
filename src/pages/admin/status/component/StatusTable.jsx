import React, { useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Tooltip from "@/components/ui/Tooltip";
import Icon from "@/components/ui/Icon";
import GlobalFilter from "@/components/ui/GlobalFilter";

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
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const StatusTable = ({
  statuses,
  interviews = [],
  pageIndex,
  pageSize,
  onPageIndexChange,
  onPageSizeChange,
  onEdit,
  onDelete,
}) => {
  const [globalFilter, setGlobalFilter] = useState("");

  const data = useMemo(() => statuses, [statuses]);

  const normalize = (val) =>
    String(val || "")
      .toLowerCase()
      .replace(/\s+/g, "_");

  const isStatusUsed = (status) => {
    if (!interviews || !Array.isArray(interviews) || interviews.length === 0) {
      return false;
    }
    const dataset = interviews
      .flatMap((e) => e?.data || [])
      .filter((i) => i !== null && i !== undefined);
    return dataset.some((i) => normalize(i?.status) === normalize(status));
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "status",
        header: "Status Name",
        size: 300,
      },

      {
        accessorKey: "createdAt",
        header: "Created At",
        size: 200,
        cell: ({ getValue }) => formatDate(getValue()),
      },
      {
        id: "action",
        header: "Action",
        size: 140,
        cell: ({ row }) => (
          <div className="flex space-x-3">
            <Tooltip content="Edit">
              <button
                className="action-btn"
                onClick={() => onEdit(row.original)}
              >
                <Icon icon="heroicons:pencil-square" />
              </button>
            </Tooltip>

            <Tooltip
              theme="danger"
              content={
                isStatusUsed(row.original.status)
                  ? "Status is used in interviews"
                  : "Delete"
              }
            >
              <span className="inline-block">
                <button
                  disabled={isStatusUsed(row.original.status)}
                  className={`action-btn text-red-500
        ${
          isStatusUsed(row.original.status)
            ? "opacity-40 cursor-not-allowed"
            : ""
        }`}
                  onClick={() => onDelete(row.original)}
                >
                  <Icon icon="heroicons:trash" />
                </button>
              </span>
            </Tooltip>
          </div>
        ),
      },
    ],
    [onEdit, onDelete],
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
  });

  const pageCount = table.getPageCount();
  const canPrev = pageIndex > 0;
  const canNext = pageIndex < pageCount - 1;

  return (
    <Card className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
      <div className="md:flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Status List</h2>
        <GlobalFilter filter={globalFilter} setFilter={setGlobalFilter} />
      </div>

      <div className="overflow-x-auto -mx-6">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 table-fixed">
          <thead className="bg-slate-200 dark:bg-slate-700">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="table-th text-slate-700 dark:text-slate-200"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {header.column.getIsSorted() === "asc" && " 🔼"}
                    {header.column.getIsSorted() === "desc" && " 🔽"}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
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
            Page {pageIndex + 1} of {pageCount}
          </span>
        </div>

        <ul className="flex items-center space-x-3 rtl:space-x-reverse">
          {/* First */}
          <li>
            <button
              disabled={!canPrev}
              onClick={() => onPageIndexChange(0)}
              className="text-xl text-slate-900 dark:text-white disabled:opacity-50"
            >
              <Icon icon="heroicons:chevron-double-left-solid" />
            </button>
          </li>

          {/* Prev */}
          <li>
            <button
              disabled={!canPrev}
              onClick={() => onPageIndexChange(pageIndex - 1)}
              className="text-sm text-slate-900 dark:text-white disabled:opacity-50"
            >
              Prev
            </button>
          </li>

          {/* Page numbers */}
          {Array.from({ length: pageCount }).map((_, idx) => (
            <li key={idx}>
              <button
                onClick={() => onPageIndexChange(idx)}
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

          {/* Next */}
          <li>
            <button
              disabled={!canNext}
              onClick={() => onPageIndexChange(pageIndex + 1)}
              className="text-sm text-slate-900 dark:text-white disabled:opacity-50"
            >
              Next
            </button>
          </li>

          {/* Last */}
          <li>
            <button
              disabled={!canNext}
              onClick={() => onPageIndexChange(pageCount - 1)}
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

export default StatusTable;
