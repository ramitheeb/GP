import * as systemInformation from "systeminformation";

const getCpuCache = (_, __, context) => {
  if (!context.req.username) return;
  return systemInformation.cpuCache();
};

export default getCpuCache;
