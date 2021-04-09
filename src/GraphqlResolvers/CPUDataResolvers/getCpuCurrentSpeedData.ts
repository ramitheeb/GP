import * as systemInformation from "systeminformation";

const getCpuCurrentSpeedData = (_, __, context) => {
  if (!context.req.username) return;
  return systemInformation.cpuCurrentSpeed();
};

export default getCpuCurrentSpeedData;
