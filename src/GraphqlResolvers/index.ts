import getCPUData from "./CPUDataResolvers/getCPUData";
import getTimeData from "./SystemDataResolvers/getTimeData";
import getCpuCacheData from "./CPUDataResolvers/getCpuCacheData";
import getSystemData from "./SystemDataResolvers/getSystemData";
import getBiosData from "./SystemDataResolvers/getBiosData";
import getCpuCurrentSpeedData from "./CPUDataResolvers/getCpuCurrentSpeedData";
import getCpuTemperatureData from "./CPUDataResolvers/getCpuTemperatureData";
import getMemData from "./MemoryDataResolvers/getMemData";
import getCurrentLoadData from "./LoadDataResolvers/getCurrentLoadData";
import getOsInfo from "./SystemDataResolvers/getOsInfo";
import * as jwt from "jsonwebtoken";
import { AuthenticationError, withFilter } from "apollo-server";
import config from "../config";
import getDiskData from "./DiskDataResolvers/getDiskData";
import getDiskHistoryData from "./DiskDataResolvers/getDiskHistoryData";
import getCPUHistoryData from "./CPUDataResolvers/getCPUHistoryData";
import getMemHistoryData from "./MemoryDataResolvers/getMemHistoryData";
import getUsersData from "./SystemDataResolvers/getUsersData";
import getProcessesData from "./LoadDataResolvers/getProcessesData";
import { pubsub } from "../pubsub";
import getTrafficHistoryData from "./getTrafficHistoryData";
import getEndpointStatisticsHistory from "./getEndpointStatisticsHistory";
import getDemographicStatisticsHistory from "./getDemographicGeoStatisticsData";
import * as sqlite3 from "sqlite3";
import getAlerts from "./getAlerts";
import getDockerInfo from "./DockerDataResolvers/getDockerInfo";
import getDockerContainersData from "./DockerDataResolvers/getDockerContainersData";
import GraphQLJSON, { GraphQLJSONObject } from "graphql-type-json";
import getDockerImageData from "./DockerDataResolvers/getDockerImageData";
import getContainerStatus from "./DockerDataResolvers/getContainerStatus";
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
  JSON: GraphQLJSON,
  JSONObject: GraphQLJSONObject,

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
    containerStatus: {
      subscribe: withFilter(
        () => pubsub.asyncIterator("CONTAINER_STATUS"),
        (payload, variables) => {
          return payload.containerStatus.id === variables.id;
        }
      ),
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
    UsersData: getUsersData,
    Alerts: getAlerts,
    DockerInfo: getDockerInfo,
    DockerContainersData: getDockerContainersData,
    DockerImageData: getDockerImageData,
    containerStatus: getContainerStatus,
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
    alert(_, { start, end, rangeName, metric, alertName, id }, { res }) {
      try {
        const db = new sqlite3.Database("./database.db");
        if (id === -1) {
          var stmt = db.prepare("INSERT INTO Alerts VALUES (?,?,?,?,?,?,?)");
          stmt.run(null, "s", start, end, metric, rangeName, alertName);
          stmt.finalize();
        } else if (id >= 0) {
          var inputData = ["s", start, end, metric, rangeName, alertName, id];
          db.run(
            "UPDATE Alerts SET type =?, start=?, end=?,  metric=?,  rangeName=?,  AlertName=?  WHERE id=?",
            inputData
          );
        }
        db.close();
      } catch (e) {
        return false;
      }
      return true;
    },
  },
};

export default resolvers;
