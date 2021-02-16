import getCPUData from "./getCPUData";
import getTimeData from "./getTimeData";
import getCpuCacheData from "./getCpuCacheData";
import getSystemData from "./getSystemData";
import getBiosData from "./getBiosData";
import getCpuCurrentSpeedData from "./getCpuCurrentSpeedData";
import getCpuTemperatureData from "./getCpuTemperatureData";
import getMemData from "./getMemData";
const resolvers = {
  Query: {
    time: getTimeData,
    cpu: getCPUData,
    cpuCache: getCpuCacheData,
    system: getSystemData,
    bios: getBiosData,
    CpuCurrentSpeedData: getCpuCurrentSpeedData,
    CpuTemperatureData: getCpuTemperatureData,
    MemData: getMemData,
  },
};
export default resolvers;
