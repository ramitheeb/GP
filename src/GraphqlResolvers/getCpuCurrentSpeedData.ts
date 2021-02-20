import * as systemInformation from "systeminformation";

const getCpuCurrentSpeedData = () => {
  return systemInformation.cpuCurrentSpeed();
};

export default getCpuCurrentSpeedData;
