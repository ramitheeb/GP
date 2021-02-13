const { gql } = require("apollo-server-express");

const CpuData = gql`
  type CpuData {
    manufacturer: String
    brand: String
    vendor: String
    family: String
    model: String
    stepping: String
    revision: String
    voltage: String
    speed: Float
    speedMin: Float
    speedMax: Float
    governor: String
    cores: Int
    physicalCores: Int
    efficiencyCores: Int
    performanceCores: Int
    processors: Int
    socket: String
    flags: String
    virtualization: Boolean
    cache: CpuCacheData
  }
`;

export default CpuData;
