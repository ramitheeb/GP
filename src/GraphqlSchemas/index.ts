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
      CurrentLoad: CurrentLoadData
      OsInfo: OsData
      DiskData: DisksIoData
      ProcessesData: ProcessesData

      DiskHistory(
        toDate: Float
        fromDate: Float
        option: String!
      ): DiskHistoryData
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

      ProcessesData: ProcessesData
    }
  `,
  DiskHistoryData,
  allTypes,
];

export default typeDefs;
