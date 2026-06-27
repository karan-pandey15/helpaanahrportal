import axios from "../../api/axios";

// Upload many PDF resumes at once. Each file is parsed + stored server-side and
// a Resume record is created per file. Returns per-file results + created docs.
// `onUploadProgress` is forwarded so callers can render a progress bar.
export const bulkUploadResumes = async (files, onUploadProgress) => {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append("resumes", file));

  const { data } = await axios.post("/resume/bulk-upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
  return data;
};

// List stored resumes (newest first). Optional free-text search.
export const fetchResumes = async (search = "") => {
  const { data } = await axios.get("/resume", {
    params: search ? { search } : {},
  });
  return data;
};

// Delete a stored resume record by id.
export const deleteResume = async (id) => {
  const { data } = await axios.delete(`/resume/${id}`);
  return data;
};

// Delete several stored resume records at once.
export const bulkDeleteResumes = async (ids) => {
  const { data } = await axios.post("/resume/bulk-delete", { ids });
  return data;
};
