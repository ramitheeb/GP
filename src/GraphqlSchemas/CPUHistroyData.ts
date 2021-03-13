import { gql } from "apollo-server";

const CPUHistoryData = gql`
  type CPUHistoryData {
    fromDate: Float
    toDate: Float
    data: [CurrentLoadData]
  }
`;

export default CPUHistoryData;
