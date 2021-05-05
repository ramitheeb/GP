import * as jwt from "jsonwebtoken";
import { AuthenticationError, IResolvers, withFilter } from "apollo-server";
import config from "../config";
import { open } from "sqlite";
import * as sqlite3 from "sqlite3";
import { GraphQLJSONObject } from "graphql-type-json";

import { GraphQLUpload } from "graphql-upload";
import { generalRedisClient } from "../pubsub";
import { handleAuth } from "../Authentication/handlers";
import { AuthInfoRequest } from "../Authentication/modules";
const getToken = ({ username, password }) =>
  jwt.sign(
    {
      username,
      password,
    },
    config.SECRET,
    { expiresIn: "20d" }
  );

const resolvers: IResolvers = {
  GraphQLUpload: GraphQLUpload,
  JSONObject: GraphQLJSONObject,
  Subscription: {
    MemData: {
      subscribe: (_, __, context) => {
        // if (!context.req.username) return;
        // console.log(`context is ${JSON.stringify(context)}`);

        return context.models.Memory?.subscribeToUsed();
      },
    },
    Time: {
      subscribe: (_, __, context) => {
        // if (!context.req.username) return;
        return context.models.System?.subscribeToTime();
      },
    },
    CurrentLoad: {
      subscribe: (_, __, context) => {
        // if (!context.req.username) return;
        return context.models.CPU?.subscribeToCurrentLoad();
      },
    },
    DiskData: {
      subscribe: (_, __, context) => {
        // if (!context.req.username) return;
        return context.models.Disk?.subscribeToDiskIO();
      },
    },
    ProcessesData: {
      subscribe: (_, __, context) => {
        // if (!context.req.username) return;
        return context.models.SystemRuntime?.subscribeToProcessData();
      },
    },
    containerStatus: {
      subscribe: (_, __, context) => {
        // if (!context.req.username) return;
        return context.models.Docker?.subscribeToDockerContainerStatus();
      },
    },
  },
  Query: {
    cpu: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.CPU?.getCPUData();
    },
    CPUHistory: (_, args, context) => {
      if (!context.req.username) return;
      return context.models.CPU?.getCPUHistory(
        args.option,
        args.toDate,
        args.fromDate
      );
    },
    cpuCache: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.CPU?.getCPUCacheData();
    },
    CpuCurrentSpeedData: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.CPU?.getCPUCurrentSpeed();
    },
    CpuTemperatureData: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.CPU?.getCPUTemperature();
    },
    CurrentLoad: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.CPU?.getCurrentLoadData();
    },
    MemData: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.Memory?.getMemData();
    },
    MemHistory: (_, args, context) => {
      if (!context.req.username) return;
      return context.models.Memory?.getMemHistory(
        args.option,
        args.toDate,
        args.fromDate
      );
    },
    DiskData: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.Disk?.getDiskData();
    },
    DiskHistory: (_, args, context) => {
      if (!context.req.username) return;
      return context.models.Disk?.getDiskHistory(
        args.option,
        args.toDate,
        args.fromDate
      );
    },
    Time: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.System?.getTime();
    },
    system: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.System?.getSystemData();
    },
    bios: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.System?.getBiosData();
    },
    OsInfo: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.System?.getOSInfo();
    },
    ProcessesData: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.SystemRuntime?.getProcessesData();
    },
    UsersData: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.SystemRuntime?.getUsersData();
    },
    TrafficHistory: (_, args, context) => {
      if (!context.req.username) return;
      return context.models.Traffic?.getTrafficHistory(
        args.option,
        args.toDate,
        args.fromDate
      );
    },
    EndpointStatisticsHistory: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.Traffic?.getEndpointStatistics();
    },
    DemographicGeoStatisticsHistory: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.Traffic?.getDemographicHistory();
    },
    Alerts: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.Alerts?.getAlerts();
    },
    CommandChains: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.CommandChains?.getCommandChains();
    },
    DockerInfo: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.Docker?.getDockerInfo();
    },
    DockerContainersData: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.Docker?.getDockerContainersData();
    },
    DockerImageData: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.Docker?.getDockerImageData();
    },
    containerStatus: (_, args, context) => {
      if (!context.req.username) return;
      return context.models.Docker?.getContainerStatus(args.id);
    },
  },
  Mutation: {
    async authenticationRequest(
      _,
      { username, serviceName, submethods },
      { res, req }
    ) {
      const db = await open({
        filename: "./database.db",
        driver: sqlite3.Database,
      });

      const userRow = await db
        .get("SELECT * FROM Users WHERE username = ?", [username])
        .catch((err) => {
          console.log(
            `An error occured while trying to fetch user from database`
          );
        });
      if (!userRow) {
        return {
          fail: true,
        };
      }
      req.session.service = serviceName;
      req.session.authLevel = 1;
      req.session.username = userRow.username;
      let auth: boolean | AuthInfoRequest;
      try {
        auth = await handleAuth(serviceName, 0, {}, req.session);
      } catch (e) {
        req.session = null;
        throw Error("Undefined Authentication Method");
      }
      if (auth === true) {
        req.session = null;
        return {
          success: true,
        };
      } else if (auth === false) {
        req.session = null;
        return {
          success: false,
        };
      } else
        return {
          infoRequest: auth,
        };
    },
    async authenticationInfoResponse(
      _,
      { numOfResponses, responses },
      { req, res }
    ) {
      console.log(req.sessionID);

      if (!req.session.username)
        return {
          fail: true,
        };
      const service = req.session.service;
      const authLevel = parseInt(req.session.authLevel);
      const auth = await handleAuth(service, authLevel, responses, req.session);
      if (auth === true) {
        req.session = null;
        return {
          success: true,
        };
      } else if (auth === false) {
        req.session = null;
        return {
          fail: true,
        };
      } else {
        req.session.authLevel++;

        return {
          infoRequest: auth,
        };
      }
    },
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
    alert(
      _,
      { start, end, rangeName, metric, alertName, id, component, type },
      context
    ) {
      if (!context.req.username) return;
      context.models.Alerts?.saveAlerts({
        start,
        end,
        rangeName,
        metric,
        alertName,
        id,
        component,
        type,
      });
    },
    async saveCommandChain(
      _,
      { id, chainName, chain, args, argsChanged, scriptFileLocation, file },
      context
    ) {
      if (!context.req.username) return;
      context.models.CommandChains?.saveCommandChain({
        id,
        chainName,
        chain,
        args,
        argsChanged,
        scriptFileLocation,
        file,
      });
    },
    async fireCommandChain(_, { id, args }, context) {
      if (!context.req.username) return;
      return context.models.CommandChains?.fireCommandChain({ id, args });
    },
    async deleteCommandChains(_, { id }, context) {
      if (!context.req.username) return;
      context.models.CommanChains.deleteCommandChain({ id });
    },
  },
};

export default resolvers;
