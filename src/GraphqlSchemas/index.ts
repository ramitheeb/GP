import { gql } from "apollo-server-express";
import HistoryDataTypes from "./HistoryDataTypes";
import SystemInformationTypes from "./SystemInformationTypes";
import { DemographicGeoStatisticsHistoryData } from "./DemographicHistoryData";
import { EndpointStatisticsHistoryData } from "./EndpointStatisticsHistory";
import TrafficHistoryData from "./TrafficHistoryData";
import { CommandChainOutput } from "./ExtraTypes";

const typeDefs = [
  gql`
    scalar GraphQLUpload
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
      CommandChains: [CommandChain]
      UsersData: [UserData]
      DockerInfo: DockerInfoData
      DockerContainersData: [DockerContainerData]
      DockerImageData: [DockerImageData]
      containerStatus(id: String!): [DockerContainerStatsData]

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

      TrafficHistory(
        toDate: Float
        fromDate: Float
        option: String!
      ): TrafficHistoryData

      EndpointStatisticsHistory: EndpointStatisticsHistoryData
      DemographicGeoStatisticsHistory: DemoGraphicGeoStatisticsHistoryData
    }

    type Mutation {
      login(username: String!, password: String!): User
      alert(
        start: Float!
        end: Float!
        type: String!
        rangeName: String!
        metric: String!
        component: String!
        alertName: String!
        id: Float!
      ): Boolean
      saveCommandChain(
        id: Float!
        chainName: String!
        scriptFileLocation: String
        chain: String
        args: [String]
        file: GraphQLUpload
        argsChanged: Boolean
      ): Boolean
      fireCommandChain(id: Float!, args: [String]): CommandChainOutput
      deleteCommandChains(id: Float!): Boolean
    }

    type Subscription {
      MemData: MemData
      Time: TimeData
      CpuData: CpuData
      CurrentLoad: CurrentLoadData
      DiskData: DisksIoData
      ProcessesData: ProcessesData
      containerStatus(id: String!): DockerContainerStatsData
    }
  `,
  HistoryDataTypes,
  SystemInformationTypes,
  HistoryDataTypes,
  TrafficHistoryData,
  EndpointStatisticsHistoryData,
  DemographicGeoStatisticsHistoryData,
  CommandChainOutput,
];

export default typeDefs;
