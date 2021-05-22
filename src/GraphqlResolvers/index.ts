import { AuthenticationError, IResolvers, withFilter } from "apollo-server";

import { GraphQLJSONObject } from "graphql-type-json";

import { GraphQLUpload } from "graphql-upload";
import { Auth } from "../Authentication";

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
    Network: {
      subscribe: (_, __, context) => {
        // if (!context.req.username) return;
        return context.models.Network?.subscribeToNetwork();
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
    NetworkData: (_, __, context) => {
      if (!context.req.username) return;

      return context.models.Network?.getNetworkData();
    },
    NetworkHistory: (_, args, context) => {
      if (!context.req.username) return;
      return context.models.Network?.getNetworkHistory(
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
    Notifications: (_, __, context) => {
      if (!context.req.username) return;
      return context.models.Notifications?.getNotifications();
    },
  },
  Mutation: {
    async authenticationRequest(
      _,
      { username, serviceName, submethods },
      { res, req }
    ) {
      return await Auth.authenticationRequest(
        { username, serviceName, submethods },
        { req }
      );
    },
    async authenticationInfoResponse(
      _,
      { numOfResponses, responses },
      { req, res }
    ) {
      return await Auth.authenticationInfoResponse(
        { numOfResponses, responses },
        { req, res }
      );
    },
    async addPublickKeyUser(_, { username, publickKey }, { req }) {
      return await Auth.addPublickKeyUser({ username, publickKey }, { req });
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
      {
        id,
        chainName,
        chain,
        args,
        argsChanged,
        scriptFileLocation,
        file,
        passwordProtected,
      },
      context
    ) {
      if (!context.req.username) return;
      return context.models.CommandChains?.saveCommandChain({
        id,
        chainName,
        chain,
        args,
        argsChanged,
        scriptFileLocation,
        file,
        passwordProtected,
      });
    },
    async fireCommandChain(_, { id, args, runWithSUDO }, context) {
      if (!context.req.username) return;
      return context.models.CommandChains?.fireCommandChain(
        { id, args, runWithSUDO },
        context.req
      );
    },
    async fireProtectedCommandChain(_, { password }, context) {
      if (!context.req.username) return;
      return context.models.CommandChains?.fireProtectedCommandChain(
        { password },
        context.req
      );
    },
    async deleteCommandChains(_, { id }, context) {
      if (!context.req.username) return;
      return context.models.CommandChains?.deleteCommandChain({ id });
    },
    async deleteNotification(_, { id }, context) {
      if (!context.req.username) return;
      return context.models.Notifications?.deletNotification({ id });
    },
  },
};

export default resolvers;
