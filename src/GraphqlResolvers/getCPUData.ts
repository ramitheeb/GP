import * as systemInformation from "systeminformation";

const getCPUData = (_, __, context) => {
  if (!context.req.username) return;
  return systemInformation.cpu();
};

export default getCPUData;
