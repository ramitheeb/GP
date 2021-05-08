import * as jwt from "jsonwebtoken";
import { AuthenticationError, IResolvers, withFilter } from "apollo-server";
import config from "../config";

import { GraphQLJSONObject } from "graphql-type-json";

import { GraphQLUpload } from "graphql-upload";
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
    Time: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.System?.getTime();
    },
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
    system: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.System?.getSystemData();
    },
    bios: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.System?.getBiosData();
    },
    CpuCurrentSpeedData: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.CPU?.getCPUCurrentSpeed();
    },
    CpuTemperatureData: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.CPU?.getCPUTemperature();
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
    CurrentLoad: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.CPU?.getCurrentLoadData();
    },
    OsInfo: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.System?.getOSInfo();
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
    ProcessesData: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.SystemRuntime?.getProcessesData();
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
    UsersData: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.SystemRuntime?.getUsersData();
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
    deleteAlert(_, { id }, context) {
      if (!context.req.username) return;
      return context.models.Alerts?.deleteAlert(id);
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
