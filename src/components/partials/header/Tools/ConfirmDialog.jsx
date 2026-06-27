// src/components/ConfirmDialog.jsx
import React from "react";

const ConfirmDialog = ({ ...props }) => {
  const {
    open,
    title = "Confirm",
    description = "Are you sure?",
    cancelText = "Cancel",
    confirmText = "Confirm",
    onClose,
    onConfirm,
    confirmColor = "error", // optional, map to colors if you want
    loading = false,
  } = props;

  if (!open) return null;
  async function onConfirmHandler() {
    if (loading) return;
    await onConfirm();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg w-full max-w-sm mx-4">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirmHandler}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
