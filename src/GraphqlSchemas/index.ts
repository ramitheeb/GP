import { gql } from "apollo-server-express";
import CPUHistoryData from "./CPUHistroyData";
import DiskHistoryData from "./DiskHistoryData";
import allTypes from "./types";

const typeDefs = [
  gql`
    type Query {
      time: TimeData
      cpu: CpuData
      cpuCache: CpuCacheData
      system: SystemData
      bios: BiosData
      CpuCurrentSpeedData: CpuCurrentSpeedData
      CpuTemperatureData: CpuTemperatureData
      MemData: MemData
      CurrentLoad: CurrentLoadData
      OsInfo: OsData
      DiskData: DisksIoData
      DiskHistory(
        toDate: Float
        fromDate: Float
        option: String!
      ): DiskHistoryData
      CPUHistory(
        toDate: Float
        fromDate: Float
        option: String!
      ): CPUHistoryData
    }
    type Mutation {
      login(username: String!, password: String!): User
    }

    type Subscription {
      MemData: MemData
      Time: TimeData
      CpuData: CpuData
      CurrentLoad: CurrentLoadData
      DiskData: DisksIoData
    }
  `,
  CPUHistoryData,
  DiskHistoryData,
  allTypes,
];

export default typeDefs;
