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
import getUsersData from "./getUsersData";
import getProcessesData from "./getProcessesData";
import { pubsub } from "../pubsub";
import * as sqlite3 from "sqlite3";
import getAlerts from "./getAlerts";
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
    UsersData: getUsersData,
    Alerts: getAlerts,
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
    alert(_, { start, end, rangeName, metric, alertName }, { res }) {
      try {
        const db = new sqlite3.Database("./database.db");
        var stmt = db.prepare("INSERT INTO Alerts VALUES (?,?,?,?,?)");
        stmt.run(start, end, metric, rangeName, alertName);
        stmt.finalize();
        db.close();
      } catch (e) {
        return false;
      }
      return true;
    },
  },
};

export default resolvers;
