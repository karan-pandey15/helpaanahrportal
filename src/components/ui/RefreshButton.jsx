import { RefreshCw } from "lucide-react";

// Small, reusable "refresh this page's data" button. Pass the page's existing
// data-load function as `onClick`; pass `loading` to spin the icon and prevent
// double-clicks while a refresh is in flight.
const RefreshButton = ({
  onClick,
  loading = false,
  label = "Refresh",
  className = "",
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    title="Refresh data"
    aria-label="Refresh data"
    className={`inline-flex items-center gap-2 h-9 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed transition ${className}`}
  >
    <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
    <span className="hidden sm:inline">{loading ? "Refreshing…" : label}</span>
  </button>
);

export default RefreshButton;
