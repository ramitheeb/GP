import * as systemInformation from "systeminformation";

const getUsersData = (_, __, context) => {
  if (!context.req.username) return;

  return systemInformation.users();
};

export default getUsersData;
