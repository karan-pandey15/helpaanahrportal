import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  UploadCloud,
  FileText,
  Loader2,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  UserRound,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import RefreshButton from "@/components/ui/RefreshButton";
import Loading from "@/components/Loading";
import ConfirmDialog from "@/components/partials/header/Tools/ConfirmDialog";
import ResumeTable from "@/components/resumes/ResumeTable";
import ResumeScheduleModal from "@/components/resumes/ResumeScheduleModal";
import { cn } from "@/utils/cls";
import {
  bulkUploadResumes,
  fetchResumes,
  deleteResume,
  bulkDeleteResumes,
} from "@/features/interviews/resumeService";

const MAX_FILES = 20;
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const prettySize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const BulkResumeUpload = () => {
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]); // File[]
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState(null); // per-file outcomes

  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [confirmResume, setConfirmResume] = useState(null);
  const [scheduleResume, setScheduleResume] = useState(null);
  const [rowSelection, setRowSelection] = useState({});
  const [confirmBulk, setConfirmBulk] = useState(false);

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);

  // ----- Load stored resumes -----
  const loadResumes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchResumes();
      setResumes(res?.resumes || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load resumes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  // ----- File selection -----
  const addFiles = (incoming) => {
    const picked = Array.from(incoming || []);
    if (!picked.length) return;

    const valid = [];
    for (const file of picked) {
      if (file.type !== "application/pdf") {
        toast.error(`${file.name}: only PDF files are allowed`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name}: must be 5 MB or smaller`);
        continue;
      }
      valid.push(file);
    }

    setFiles((prev) => {
      // De-duplicate by name + size so the same file isn't queued twice.
      const seen = new Set(prev.map((f) => `${f.name}-${f.size}`));
      const merged = [...prev];
      for (const f of valid) {
        const key = `${f.name}-${f.size}`;
        if (!seen.has(key)) {
          merged.push(f);
          seen.add(key);
        }
      }
      if (merged.length > MAX_FILES) {
        toast.warn(`You can upload at most ${MAX_FILES} resumes at once`);
        return merged.slice(0, MAX_FILES);
      }
      return merged;
    });
  };

  const removeFile = (idx) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  const clearFiles = () => {
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  // ----- Upload -----
  const handleUpload = async () => {
    if (!files.length) {
      toast.error("Please choose at least one PDF resume");
      return;
    }
    setUploading(true);
    setProgress(0);
    setUploadResults(null);
    try {
      const res = await bulkUploadResumes(files, (evt) => {
        if (evt.total) {
          setProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      });

      const stored = res?.storedCount ?? 0;
      const failed = res?.failedCount ?? 0;
      const dups = res?.duplicateCount ?? 0;

      setUploadResults(res?.results || []);

      if (stored) {
        toast.success(`${stored} resume(s) uploaded`);
      }
      if (dups) {
        toast.error(`${dups} duplicate resume(s) skipped`);
      }
      if (failed) {
        toast.error(`${failed} file(s) could not be processed`);
      }
      if (!stored && !dups && !failed) {
        toast.info("Nothing to upload");
      }

      clearFiles();
      await loadResumes();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to upload resumes",
      );
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  // ----- Delete (single) -----
  const handleDelete = async () => {
    if (!confirmResume?._id) return;
    try {
      await deleteResume(confirmResume._id);
      setResumes((prev) => prev.filter((r) => r._id !== confirmResume._id));
      setRowSelection((prev) => {
        const next = { ...prev };
        delete next[confirmResume._id];
        return next;
      });
      toast.success("Resume deleted");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete resume");
    } finally {
      setConfirmResume(null);
    }
  };

  // ----- Delete (bulk) -----
  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    try {
      const res = await bulkDeleteResumes(selectedIds);
      const removed = new Set(selectedIds);
      setResumes((prev) => prev.filter((r) => !removed.has(r._id)));
      setRowSelection({});
      toast.success(res?.message || `${selectedIds.length} resume(s) deleted`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete resumes");
    } finally {
      setConfirmBulk(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Breadcrumbs />
        <RefreshButton onClick={loadResumes} loading={loading} />
      </div>

      {/* Upload area */}
      <Card className="mb-6 bg-white dark:bg-slate-800">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-14 transition",
            dragOver
              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
              : "border-slate-300 hover:border-indigo-400 dark:border-slate-600",
          )}
        >
          <UploadCloud className="text-indigo-500" size={40} />
          <div className="text-center">
            <p className="font-medium text-slate-700 dark:text-slate-200">
              Upload up to {MAX_FILES} resumes at once
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Drag &amp; drop PDF files here, or click to browse (max 5 MB each)
            </p>
          </div>
        </button>

        {/* Selected files */}
        {files.length > 0 && (
          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {files.length} file(s) selected
              </p>
              <button
                type="button"
                onClick={clearFiles}
                disabled={uploading}
                className="text-sm text-slate-500 hover:text-red-500 disabled:opacity-50"
              >
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {files.map((file, idx) => (
                <div
                  key={`${file.name}-${file.size}-${idx}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText
                      className="flex-shrink-0 text-indigo-500"
                      size={20}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-800 dark:text-slate-100">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {prettySize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    disabled={uploading}
                    className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500 disabled:opacity-50 dark:hover:bg-slate-700"
                    title="Remove"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            {uploading && (
              <div className="mt-4">
                <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 size={14} className="animate-spin" />
                  Uploading &amp; analyzing… {progress}%
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading || !files.length}
                className="btn btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Upload {files.length} Resume(s)
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Upload results — per-file outcome incl. duplicate rejections */}
      {uploadResults?.length > 0 && (
        <Card className="mb-6 bg-white dark:bg-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Upload Results</h3>
            <button
              type="button"
              onClick={() => setUploadResults(null)}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
              title="Dismiss"
            >
              <X size={18} />
            </button>
          </div>
          <ul className="space-y-2">
            {uploadResults.map((r, idx) => (
              <ResultRow key={`${r.fileName}-${idx}`} result={r} />
            ))}
          </ul>
        </Card>
      )}

      {/* Helper note */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
        <AlertTriangle
          size={18}
          className="mt-0.5 flex-shrink-0 text-amber-500"
        />
        <p>
          Each resume is parsed automatically — name, email, phone, experience
          and skills are extracted and stored. Duplicates (same email or phone)
          are rejected automatically, and scanned/unreadable PDFs are still saved
          but marked <span className="font-medium">Not parsed</span>. Once a
          candidate's interview is scheduled, their data is moved to the{" "}
          <span className="font-medium">Interviews</span> section and removed from
          this list.
        </p>
      </div>

      {/* Stored resumes list */}
      {loading ? (
        <Loading />
      ) : (
        <ResumeTable
          resumes={resumes}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={setPageSize}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          onBulkDelete={() => setConfirmBulk(true)}
          onSchedule={(r) => setScheduleResume(r)}
          onDelete={(r) => setConfirmResume(r)}
        />
      )}

      <ConfirmDialog
        open={!!confirmResume}
        title="Delete Resume"
        description={`Delete the resume for ${
          confirmResume?.candidateName ||
          confirmResume?.fileName ||
          "this candidate"
        }?`}
        onClose={() => setConfirmResume(null)}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={confirmBulk}
        title="Delete Resumes"
        description={`Delete ${selectedIds.length} selected resume(s)? This cannot be undone.`}
        onClose={() => setConfirmBulk(false)}
        onConfirm={handleBulkDelete}
      />

      {scheduleResume && (
        <ResumeScheduleModal
          resume={scheduleResume}
          onClose={() => setScheduleResume(null)}
          onScheduled={() => {
            setScheduleResume(null);
            loadResumes();
          }}
        />
      )}
    </div>
  );
};

// A single row in the "Upload Results" panel: success, duplicate (with a link to
// the candidate profile / existing resume) or a processing failure.
const ResultRow = ({ result: r }) => {
  if (r.success) {
    return (
      <li className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 dark:border-green-500/30 dark:bg-green-500/10">
        <div className="flex min-w-0 items-center gap-2">
          <CheckCircle2
            size={18}
            className="flex-shrink-0 text-green-600 dark:text-green-400"
          />
          <span className="truncate text-sm text-slate-700 dark:text-slate-200">
            {r.fileName}
          </span>
        </div>
        <span className="flex-shrink-0 text-xs font-medium text-green-700 dark:text-green-400">
          {r.parseFailed ? "Stored (not parsed)" : "Stored"}
        </span>
      </li>
    );
  }

  if (r.duplicate) {
    return (
      <li className="flex flex-col gap-1 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 dark:border-red-500/30 dark:bg-red-500/10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2">
          <XCircle
            size={18}
            className="mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
              {r.fileName}
            </p>
            <p className="text-xs text-red-700 dark:text-red-300">
              {r.message}
            </p>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3 pl-7 sm:pl-0">
          {r.duplicateType === "candidate" && r.candidateId && (
            <Link
              to={`/candidate/${r.candidateId}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              <UserRound size={13} />
              View candidate profile
            </Link>
          )}
          {r.duplicateType === "resume" && r.existingResumeUrl && (
            <a
              href={r.existingResumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              <ExternalLink size={13} />
              View existing resume
            </a>
          )}
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 dark:border-amber-500/30 dark:bg-amber-500/10">
      <div className="flex min-w-0 items-center gap-2">
        <AlertTriangle
          size={18}
          className="flex-shrink-0 text-amber-600 dark:text-amber-400"
        />
        <span className="truncate text-sm text-slate-700 dark:text-slate-200">
          {r.fileName}
        </span>
      </div>
      <span className="flex-shrink-0 text-xs text-amber-700 dark:text-amber-400">
        {r.message || "Failed"}
      </span>
    </li>
  );
};

export default BulkResumeUpload;
