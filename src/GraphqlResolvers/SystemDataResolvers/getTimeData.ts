import * as systemInformation from "systeminformation";

const getTimeData = (_, __, context) => {
  if (!context.req.username) return;
  return systemInformation.time();
};

export default getTimeData;
