import api from "./axios";

export const fetchComments = async (interviewId) => {
  const { data } = await api.get(`comments/${interviewId}`);
  return data;
};

export const createComment = async ({ commentedOn, content }) => {
  const { data } = await api.post("comments/create-comment", {
    content,
    commentedOn,
  });
  return data;
};
