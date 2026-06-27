import api from "../../api/axios";

const addUser = async (data) => {
  const res = await api.post("/user/adduser", data);
  return res.data;
};



export default {
 addUser
};
