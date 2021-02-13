import getCPUData from "./getCPUData";
import getTimeData from "./getTimeData";
import getCpuCacheData from "./getCpuCacheData";
import getSystemData from "./getSystemData";

const resolvers = {
  Query: {
    time: getTimeData,
    cpu: getCPUData,
    cpuCache: getCpuCacheData,
    system: getSystemData,
  },
};
export default resolvers;
