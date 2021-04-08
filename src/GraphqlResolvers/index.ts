import getCPUData from "./getCPUData";
import getTimeData from "./getTimeData";
import getCpuCacheData from "./getCpuCacheData";
import getSystemData from "./getSystemData";
import getBiosData from "./getBiosData";
import getCpuCurrentSpeedData from "./getCpuCurrentSpeedData";
import getCpuTemperatureData from "./getCpuTemperatureData";
import getMemData from "./getMemData";
import getCurrentLoadData from "./getCurrentLoadData";
import getOsInfo from "./getOsInfo";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { UserInputError, AuthenticationError } from "apollo-server";
import config from "../config";
import getDiskData from "./getDiskData";
import getDiskHistoryData from "./getDiskHistoryData";
import getCPUHistoryData from "./getCPUHistoryData";
import getMemHistoryData from "./getMemHistoryData";

import getProcessesData from "./getProcessesData";
import { pubsub } from "../pubsub";
import getTrafficHistoryData from "./getTrafficHistoryData";
import getEndpointStatisticsHistory from "./getEndpointStatisticsHistory";
import getDemographicStatisticsHistory from "./getDemographicGeoStatisticsData";

const getToken = ({ username, password }) =>
  jwt.sign(
    {
      username,
      password,
    },
    config.SECRET,
    { expiresIn: "20d" }
  );

const resolvers = {
  Subscription: {
    MemData: {
      subscribe: () => pubsub.asyncIterator("NEW_MEM"),
    },
    Time: {
      subscribe: () => pubsub.asyncIterator("TIME_DATA"),
    },
    CurrentLoad: {
      subscribe: () => pubsub.asyncIterator("CURRENT_CPU_LOAD"),
    },
    DiskData: {
      subscribe: () => pubsub.asyncIterator("DISK_DATA"),
    },
    ProcessesData: {
      subscribe: () => pubsub.asyncIterator("PROCESSES_DATA"),
    },
  },
  Query: {
    Time: getTimeData,
    cpu: getCPUData,
    CPUHistory: getCPUHistoryData,
    cpuCache: getCpuCacheData,
    system: getSystemData,
    bios: getBiosData,
    CpuCurrentSpeedData: getCpuCurrentSpeedData,
    CpuTemperatureData: getCpuTemperatureData,
    MemData: getMemData,
    MemHistory: getMemHistoryData,
    CurrentLoad: getCurrentLoadData,
    OsInfo: getOsInfo,
    DiskData: getDiskData,
    DiskHistory: getDiskHistoryData,
    ProcessesData: getProcessesData,
    TrafficHistory: getTrafficHistoryData,
    EndpointStatisticsHistory: getEndpointStatisticsHistory,
    DemographicGeoStatisticsHistory: getDemographicStatisticsHistory,
  },
  Mutation: {
    login(_, { username, password }, { res }) {
      const user = {
        username: "admin",
        password: "admin",
      };

      if (user.username !== username)
        throw new AuthenticationError("this user is not found!");

      const match = password === user.password;
      if (!match) throw new AuthenticationError("wrong password!");

      const accessToken = getToken(user);
      res.cookie("access-token", accessToken);
      return {
        id: user.username,
      };
    },
  },
};

export default resolvers;
