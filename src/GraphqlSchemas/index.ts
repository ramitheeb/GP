import { gql } from "apollo-server-express";
import TimeData from "./TimeData";
import CpuData from "./CpuData";
import CpuCacheData from "./CpuCacheData";
import SystemData from "./SystemData";
import RaspberryRevisionData from "./RaspberryRevisionData";
const typeDefs = [
  gql`
    type Query {
      time: TimeData
      cpu: CpuData
      cpuCache: CpuCacheData
      system: SystemData
    }
  `,
  TimeData,
  CpuData,
  CpuCacheData,
  SystemData,
  RaspberryRevisionData,
];

export default typeDefs;
