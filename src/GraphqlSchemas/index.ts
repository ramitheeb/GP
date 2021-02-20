import { gql } from "apollo-server-express";
import TimeData from "./TimeData";
import CpuData from "./CpuData";
import CpuCacheData from "./CpuCacheData";
import SystemData from "./SystemData";
import RaspberryRevisionData from "./RaspberryRevisionData";
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
    }
    type Mutation {
      login(username: String!, password: String!): User
    }
  `,

  allTypes,
];

export default typeDefs;
