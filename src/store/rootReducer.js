import layout from "./layout";
import auth from "../features/auth/authSlice";
import users from "../features/user/userSlice";
import developer from "../features/user/developerSlice";
import interviews from "../features/interviews/interviewSlice";
import activity from "../features/activity/activitySlice";
import status from "../features/status/statusSlice";

const rootReducer = {
  layout,
  auth,
  users,
  developer,
  interviews,
  activity,
  status,
};

export default rootReducer;
