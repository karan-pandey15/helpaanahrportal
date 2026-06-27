import React, { useEffect, useMemo, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import Tooltip from "@/components/ui/Tooltip";
import Icon from "@/components/ui/Icon";
import GlobalFilter from "@/components/ui/GlobalFilter";
import { Trash2 } from "lucide-react";
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

const Skills = ({ skills }) => {
  if (!skills?.length) return <span className="text-sm text-slate-400">—</span>;
  const shown = skills.slice(0, 3);
  const extra = skills.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((s) => (
        <span
          key={s}
          className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
        >
          {s}
        </span>
      ))}
      {extra > 0 && (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          +{extra}
        </span>
      )}
    </div>
  );
};

// Checkbox that supports the "some selected" (indeterminate) visual state.
const IndeterminateCheckbox = ({ indeterminate, ...rest }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !rest.checked && !!indeterminate;
  }, [indeterminate, rest.checked]);
  return (
    <input
      type="checkbox"
      ref={ref}
      className="table-checkbox dark:border-slate-600"
      {...rest}
    />
  );
};

const ResumeTable = ({
  resumes,
  pageIndex,
  pageSize,
  onPageIndexChange,
  onPageSizeChange,
  rowSelection = {},
  onRowSelectionChange,
  onBulkDelete,
  onView,
  onSchedule,
  onDelete,
}) => {
  const data = resumes;
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo(
    () => [
      {
        id: "select",
        size: 40,
        enableSorting: false,
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
      },
      {
        id: "candidate",
        header: "Candidate",
        size: 220,
        accessorFn: (row) => `${row.candidateName || ""} ${row.fileName || ""}`,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                {r.candidateName || "Unknown candidate"}
              </p>
              <p className="text-xs text-slate-400 truncate max-w-[200px]">
                {r.fileName || "—"}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        size: 200,
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() || "—"}</span>
        ),
      },
      {
        accessorKey: "phone",
        header: "Phone",
        size: 130,
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() || "—"}</span>
        ),
      },
      {
        accessorKey: "experience",
        header: "Exp.",
        size: 80,
        cell: ({ getValue }) => (
          <span className="text-sm">
            {getValue() ? `${getValue()} yrs` : "—"}
          </span>
        ),
      },
      {
        id: "skills",
        header: "Skills",
        size: 200,
        enableSorting: false,
        accessorFn: (row) => (row.skills || []).join(" "),
        cell: ({ row }) => <Skills skills={row.original.skills} />,
      },
      {
        accessorKey: "createdAt",
        header: "Uploaded",
        size: 150,
        cell: ({ row }) => (
          <div>
            <p className="text-sm">{formatDate(row.original.createdAt)}</p>
            {row.original.uploadedBy?.name && (
              <p className="text-xs text-slate-400">
                by {row.original.uploadedBy.name}
              </p>
            )}
          </div>
        ),
      },
      {
        id: "flags",
        header: "Status",
        size: 130,
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex flex-col gap-1">
              {r.status === "stored" && (
                <span className="inline-block w-max rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Not parsed
                </span>
              )}
              {r.status === "parsed" && (
                <span className="inline-block w-max rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Parsed
                </span>
              )}
              {r.isDuplicate && (
                <span className="inline-block w-max rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  Duplicate
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "action",
        header: "Actions",
        size: 150,
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex space-x-3 rtl:space-x-reverse">
              <Tooltip content="View & schedule">
                <button
                  className="action-btn text-indigo-600 dark:text-indigo-300"
                  onClick={() => onSchedule?.(r)}
                >
                  <Icon icon="heroicons:eye" />
                </button>
              </Tooltip>
              <Tooltip content="Open resume PDF">
                <a
                  href={r.resumeUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`action-btn text-slate-600 dark:text-slate-300 ${
                    r.resumeUrl
                      ? ""
                      : "pointer-events-none opacity-40 cursor-not-allowed"
                  }`}
                  onClick={(e) => {
                    if (!r.resumeUrl) e.preventDefault();
                    onView?.(r);
                  }}
                >
                  <Icon icon="heroicons:document-text" />
                </a>
              </Tooltip>
              <Tooltip theme="danger" content="Delete">
                <button
                  className="action-btn text-red-500 dark:text-slate-300"
                  onClick={() => onDelete?.(r)}
                >
                  <Icon icon="heroicons:trash" />
                </button>
              </Tooltip>
            </div>
          );
        },
      },
    ],
    [onView, onSchedule, onDelete],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      rowSelection,
      pagination: { pageIndex, pageSize },
    },
    // Key selection by the resume _id so it stays correct across sort/paginate.
    getRowId: (row) => row._id,
    enableRowSelection: true,
    onRowSelectionChange,
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
    defaultColumn: { size: 180, minSize: 80, maxSize: 320 },
  });

  const selectedCount = Object.values(rowSelection).filter(Boolean).length;

  return (
    <Card className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
      <div className="md:flex justify-between items-center mb-6 gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">
            Uploaded Resumes ({data.length})
          </h2>
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={() => onBulkDelete?.()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700"
            >
              <Trash2 size={15} />
              Delete Selected ({selectedCount})
            </button>
          )}
        </div>
        <GlobalFilter filter={globalFilter} setFilter={setGlobalFilter} />
      </div>

      <div className="overflow-x-auto custom-scroller -mx-6">
        <table className="min-w-full custom-scroller divide-y overflow-y-clip divide-slate-200 dark:divide-slate-700 table-fixed">
          <thead className="bg-slate-200 dark:bg-slate-700">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const isSorted = header.column.getIsSorted();
                  const canSort = header.column.getCanSort();
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
                        {canSort &&
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
                  No resumes uploaded yet.
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

export default ResumeTable;
