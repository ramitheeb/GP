import { gql } from "apollo-server-core";

const TrafficHistoryData = gql`
  type TrafficHistoryData {
    fromDate: Float
    toDate: Float
    data: [TrafficData]
  }
`;
export default TrafficHistoryData;
