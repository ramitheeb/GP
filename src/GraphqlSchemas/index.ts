import { gql } from "apollo-server-express";
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

  allTypes,
];

export default typeDefs;
