import * as systemInformation from "systeminformation";

const getCurrentLoadData = (_, __, context) => {
  if (!context.req.username) return;
  return systemInformation.currentLoad();
};

export default getCurrentLoadData;
