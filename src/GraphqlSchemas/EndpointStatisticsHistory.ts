import { gql } from "apollo-server-core";

export const EndpointStatisticsHistoryData = gql`
  type EndpointStatisticsHistoryData {
    data: [EndpointStatistics]
  }
`;
