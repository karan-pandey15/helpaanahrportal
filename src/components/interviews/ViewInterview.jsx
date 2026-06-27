import React, { useEffect, useOptimistic, useState } from "react";
import UserAvatar from "@/assets/images/users/user.png";
import { useDispatch, useSelector } from "react-redux";
import { fetchInterviewActivity } from "@/features/activity/activityThunks";
import { clearActivity } from "@/features/activity/activitySlice";
import Loading from "@/components/Loading";
import { createComment, fetchComments } from "../../api/comment";
import { toast } from "react-toastify";
import { Loader2, Send, X } from "lucide-react";
 import {formatDate} from "../../utils/date-time-formatter";
import RequestBadge from "@/components/interviews/RequestBadge";


const ViewInterview = ({ interview, onClose }) => {

  const dispatch = useDispatch();
  const { activities, loading } = useSelector((s) => s.activity);
  // Delete is admin-only.
  const isAdmin = useSelector((s) => s.auth.user?.role) === "admin";

  useEffect(() => {
    if (!interview?._id) return;

    dispatch(clearActivity()); // reset immediately
    dispatch(fetchInterviewActivity(interview._id));
  }, [interview?._id, dispatch]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  if (!interview) return null;

  return (
    // Centered with simple padding on mobile; the desktop offsets (top bar +
    // sidebar clearance) only apply from lg up.
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 lg:items-start lg:p-0 lg:pt-24 lg:pl-36">
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative w-full lg:w-[94%] max-w-6xl h-[90vh] lg:h-[85vh]
        bg-white dark:bg-slate-800
        text-slate-900 dark:text-slate-100
        rounded-2xl shadow-2xl flex flex-col lg:flex-row
        overflow-y-auto lg:overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-2  right-2 h-7 w-7 flex items-center justify-center
           text-2xl rounded-md bg-primary text-slate-400 hover:text-slate-700
            dark:hover:text-white  z-10 bg-white dark:bg-slate-600"
        >
          <X size={20} />
        </button>

        {/* LEFT PANEL — scrolls independently on desktop; on mobile the whole
            modal scrolls as one column. */}
        <div
          className="lg:flex-1 lg:overflow-y-auto p-4 space-y-6
          [&::-webkit-scrollbar]:w-2
          [&::-webkit-scrollbar-track]:rounded-full
          [&::-webkit-scrollbar-track]:bg-gray-100
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-gray-300
          dark:[&::-webkit-scrollbar-track]:bg-neutral-700
          dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500"
        >
          <div className="border rounded-xl p-4 sm:p-6 space-y-4 border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl sm:text-4xl font-semibold flex items-center gap-3 flex-wrap break-words">
              {interview.candidateName}
              <RequestBadge type={interview.pendingRequestType} />
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <Info label="Email" value={interview.email} />
              <Info label="Phone" value={interview.phone} />
              <Info label="Position" value={interview.position} />
              <Info label="Round" value={interview.round} capitalize />
              <Info
                label="Interview Date & Time"
                value={formatDate(interview.interviewDateTime)}
              />
              <Info
                label="Expected Joining Date"
                value={formatDate(interview.joiningDate)}
              />
            </div>
          </div>

          <div className="border rounded-xl p-4 sm:p-6 space-y-4 border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-lg">Interview Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <Info label="Experience (Years)" value={interview.experience} />
              <Info label="Current Company" value={interview.currentCompany} />
              <Info label="Current CTC (LPA)" value={interview.currentCtc} />
              <Info label="Expected CTC (LPA)" value={interview.expectedCtc} />
              <Info
                label="Notice Period (Days)"
                value={interview.noticePeriod}
              />

              <div>
                <p className="text-slate-500">Meeting Link</p>
                {interview.meetingLink ? (
                  <a
                    href={interview.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline break-all"
                  >
                    {interview.meetingLink}
                  </a>
                ) : (
                  <p className="font-medium">—</p>
                )}
              </div>

              <div>
                <p className="text-slate-500">Resume</p>
                {interview.resumeUrl ? (
                  <a
                    href={interview.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline break-all"
                  >
                    View Resume
                  </a>
                ) : (
                  <p className="font-medium">—</p>
                )}
              </div>
            </div>

            {interview.note && (
              <div>
                <p className="text-slate-500">Note</p>
                <p className="font-medium whitespace-pre-line">
                  {interview.note}
                </p>
              </div>
            )}
          </div>

          {/* COMMENTS */}
          <CommentSection interviewId={interview._id} UserAvatar={UserAvatar} />
        </div>

        {/* RIGHT PANEL — full-width section under the content on mobile, fixed
            side column on desktop. */}
        <div
          className="w-full lg:w-[320px] lg:h-full shrink-0
          border-t lg:border-t-0 lg:border-l
          border-slate-200 dark:border-slate-700
        bg-white dark:bg-slate-800
          flex flex-col"
        >
          <div className="p-4">
            <div className="border rounded-xl px-4 py-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <h4 className="text-sm text-slate-500 mb-2">Created By</h4>
              <div className="flex items-center gap-3">
                <img src={UserAvatar} className="w-9 h-9 rounded-full" />
                <div>
                  <p className="font-medium">
                    {interview.createdBy?.name || "System"}
                  </p>
                  <p className="text-xs text-slate-500">
                    @{interview.createdBy?.name || "system"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 pb-2">
            <h4 className="text-sm text-slate-500">Activity</h4>
          </div>

          <div
            className="border rounded-lg p-3 mx-4 mb-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm
            max-h-72 lg:max-h-none lg:flex-1 overflow-y-auto
            [&::-webkit-scrollbar]:w-2
            [&::-webkit-scrollbar-track]:rounded-full
            [&::-webkit-scrollbar-track]:bg-gray-100
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-gray-300
            dark:[&::-webkit-scrollbar-track]:bg-neutral-700
            dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500"
          >
            {loading && <Loading />}

            {!loading && !activities.length && (
              <div className="flex justify-center items-center h-40">
                <p className="text-sm text-slate-400">No activity found</p>
              </div>
            )}

            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.activityId} className="flex gap-3 text-sm">
                  <span className="mt-2 w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">
                      {activity.performedAt}
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {activity.message}
                    </p>
                    {activity.changes?.length > 1 && (
                      <ul className="space-y-0.5">
                        {activity.changes.map((c, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-slate-500 dark:text-slate-400"
                          >
                            <span className="font-medium text-slate-600 dark:text-slate-300">
                              {c.fieldName}
                            </span>
                            : {String(c.oldValue)} → {String(c.newValue)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isAdmin && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <button
                className="w-full py-3 rounded-lg
                bg-red-100 dark:bg-red-900/30
                text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50 transition"
              >
                Delete Interview
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Info = ({ label, value, capitalize }) => (
  <div>
    <p className="text-slate-500">{label}</p>
    <p className={`font-medium ${capitalize ? "capitalize" : ""}`}>
      {value || "—"}
    </p>
  </div>
);

const Comment = ({ name, text, time, email }) => (
  <div className="flex gap-3 text-sm">
    <img src={UserAvatar} className="w-8 h-8 rounded-full" />
    <div>
      <p className="font-medium">
        {name} <span className="text-xs text-slate-500">{email}</span>
      </p>
      <p className="text-slate-600 dark:text-slate-200 mb-1">{text}</p>
      <p className="text-xs text-slate-400">{time}</p>
    </div>
  </div>
);

function CommentSection({ interviewId, UserAvatar }) {
  console.log("load Comments");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    getComments(interviewId);
  }, [interviewId]);

  async function getComments(id) {
    try {
      setLoading(true);
      const data = await fetchComments(id);
      setComments(data.data);
    } catch (error) {
      toast.error("Failed to load comments", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (loading) return;
    try {
      setLoading(true);
      const response = await createComment({
        commentedOn: interviewId,
        content: text,
      });
      setText("");
      await getComments(interviewId);
      toast.success("Comment added successfully");
    } catch (error) {
      toast.error("Failed to add comment");
    }
  }

  return (
    <div className="border rounded-xl p-4 sm:p-6 space-y-4 border-slate-200 dark:border-slate-700">
      <h3 className="font-semibold text-lg">Comments</h3>

      <ul className="space-y-4">
        {comments?.map((comment) => {
          const { _id, content, commentedBy, createdAt } = comment;
          const formattedTime = formatDate(createdAt);

          return (
            <li key={_id}>
              <Comment
                name={commentedBy?.name}
                email={commentedBy?.email}
                text={content}
                time={formattedTime}
              />
            </li>
          );
        })}
      </ul>

      <form
        onSubmit={handleAddComment}
        className="flex items-center gap-3 pt-4 border-t"
      >
        <img src={UserAvatar} className="w-8 h-8 rounded-full" />
        <input
          disabled={loading}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 px-4 py-2 rounded-lg border bg-slate-50"
        />
        <button
          disabled={loading || text.trim() === ""}
          className="px-4 py-2 h-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 rounded-lg text-sm"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </form>
    </div>
  );
}

export default ViewInterview;
