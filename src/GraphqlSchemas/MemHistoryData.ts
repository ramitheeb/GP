import { gql } from "apollo-server";

const MemHistoryData = gql`
  type MemHistoryData {
    fromDate: Float
    toDate: Float
    data: [MemData]
  }
`;

export default MemHistoryData;
