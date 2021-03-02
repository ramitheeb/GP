import { gql } from "apollo-server-express";
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
      DiskData: DisksIoData
      DiskHistory(toDate: Float!,fromDate:Float!,timeBucket:Float!): DiskHistoryData
    }
    type Mutation {
      login(username: String!, password: String!): User
    }

    type Subscription {
      MemData: MemData
      Time: TimeData
      DiskData: DisksIoData
    }
  `,
  DiskHistoryData,
  allTypes,
];

export default typeDefs;
