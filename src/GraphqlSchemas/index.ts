import { gql } from "apollo-server-express";
import HistoryDataTypes from "./HistoryDataTypes";
import SystemInformationTypes from "./SystemInformationTypes";

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
      DockerInfo: DockerInfoData
      DockerContainersData: [DockerContainerData]
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
        id: Float!
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
  HistoryDataTypes,
  SystemInformationTypes,
];

export default typeDefs;
