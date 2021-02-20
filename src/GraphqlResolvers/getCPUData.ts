import * as systemInformation from "systeminformation";

const getCPUData = () => {
  return systemInformation.cpu();
};

export default getCPUData;
