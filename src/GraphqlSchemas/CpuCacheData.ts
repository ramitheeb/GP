import { gql } from "apollo-server-express";

const CpuCacheData = gql`
  type CpuCacheData {
    l1d: String
    l1i: String
    l2: String
    l3: String
  }
`;

export default CpuCacheData;
