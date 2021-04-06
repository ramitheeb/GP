import { gql } from "apollo-server-express";
import CPUHistoryData from "./CPUHistroyData";
import DiskHistoryData from "./DiskHistoryData";
import MemHistoryData from "./MemHistoryData";
import allTypes from "./types";

const typeDefs = [
  gql`
    type Query {
      Time: TimeData
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
      Alerts: [Alert]
      UsersData: [UserData]

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
      MemHistory(
        toDate: Float
        fromDate: Float
        option: String!
      ): MemHistoryData
    }
    type Mutation {
      login(username: String!, password: String!): User
      alert(
        start: Float!
        end: Float!
        rangeName: String!
        metric: String!
        alertName: String!
      ): Boolean
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
  CPUHistoryData,
  DiskHistoryData,
  MemHistoryData,
  allTypes,
];

export default typeDefs;
