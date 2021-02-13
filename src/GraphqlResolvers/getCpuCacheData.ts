import systemInformation from "systeminformation";

const getCpuCache = () => {
  return systemInformation.cpuCache();
};

export default getCpuCache;
