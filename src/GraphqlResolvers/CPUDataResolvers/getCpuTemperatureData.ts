import * as systemInformation from "systeminformation";

const getCpuTemperatureData = (_, __, context) => {
  if (!context.req.username) return;
  return systemInformation.cpuTemperature();
};

export default getCpuTemperatureData;
