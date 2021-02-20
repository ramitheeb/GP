import * as systemInformation from "systeminformation";

const getCpuTemperatureData = () => {
  return systemInformation.cpuTemperature();
};

export default getCpuTemperatureData;
